// Customer Service returns (impl-customer-service P9; ReturnServices, Returns.js; the policy, eligibility and authorization rules
// are Mantle's, tested in mr-mantle test/order/ReturnPolicies): the Returns list limited to the user's organizations and
// customers (Ziziwork Services' agent sees none of Retail's) and closed to the service reader; NewReturn's returnable lines of the
// delivered demo order with the policy preview; a return entered for Joe Q Public through submit#CustomerReturn under Retail's
// policy; the batch of authorizations with a result per return (one authorized, a forged one Forbidden); the §2 audience on
// ReturnDetail (credit amounts and settlement for the borrowed F capability only, receipt for W only); Home's Returns awaiting
// approval; and the one qvt render of Returns, NewReturn and ReturnDetail. The returns it makes are cancelled at the end, so
// the delivered order's lines are free again for the other specs. Run: ./moq test mr-boss --spec CustomerService/CustomerServiceReturns
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const R = "ironstone.customerservice.ReturnServices."
const P = "mantle.order.ReturnPolicyServices."
const state = {returnIds: []}
let keySeq = 0
const key = () => "CSRS-" + ec.user.randomString(8) + "-" + ++keySeq
const filterLine = () =>
    system(() =>
        ec.entity
            .find("mantle.order.OrderItem")
            .condition({orderId: ids.deliveredOrderId, productId: ids.filterProductId})
            .disableAuthz()
            .one()
    ).orderItemSeqId

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        // the returns made here are cancelled (none received or credited), so the order's lines are free again
        for (const returnId of state.returnIds)
            asUser(users.returns, () => refusal(P + "cancel#CustomerReturn", {returnId, reason: "Spec cleanup"}), false)
        login("john.doe")
    }
})

feature("NewReturn: the delivered order's returnable lines and a return entered under Retail's policy", {
    when() {
        const prepared = asUser(
            users.agent,
            () => invoke(R + "prepare#Return", {appRoot: "CustomerService", orderId: ids.deliveredOrderId}).prepared,
            false
        )
        const submitted = asUser(
            users.agent,
            () =>
                invoke(P + "submit#CustomerReturn", {
                    operationKey: key(),
                    orderId: ids.deliveredOrderId,
                    lineList: [
                        {
                            orderItemSeqId: filterLine(),
                            quantity: 1,
                            returnReasonEnumId: "RrsnDefective",
                            returnResponseEnumId: "RrspCredit"
                        }
                    ],
                    customerReference: "JQP-CSRS-1"
                }),
            false
        )
        state.returnIds.push(submitted.returnId)
        state.returnId = submitted.returnId
        const readerPrepare = asUser(
            users.read,
            () => refusal(R + "prepare#Return", {appRoot: "CustomerService", orderId: ids.deliveredOrderId}),
            false
        )
        return {prepared, submitted, readerPrepare}
    },
    then({prepared, submitted, readerPrepare}) {
        prepared.customerPartyId == ids.customerId
        prepared.lineRows.some(row => row.productId == ids.filterProductId && row.returnable)
        prepared.evaluation.returnPolicyId == ids.returnPolicyId
        submitted.outcome == "Eligible"
        submitted.statusId == "ReturnRequested"
        readerPrepare.includes("PERMISSION_DENIED")
    }
})

feature("Returns: the user's organizations and customers only, and closed to the service reader", {
    when() {
        const agent = asUser(
            users.agent,
            () => invoke(R + "find#Returns", {appRoot: "CustomerService", view: "requested"}).found,
            false
        )
        const services = asUser(
            users.services,
            () => invoke(R + "find#Returns", {appRoot: "CustomerService", view: "all"}).found,
            false
        )
        const reader = asUser(users.read, () => refusal(R + "find#Returns", {appRoot: "CustomerService"}), false)
        const awaiting = asUser(users.returns, () => invoke(R + "get#AwaitingReturns", {appRoot: "CustomerService"}), false)
        return {agent, services, reader, awaiting}
    },
    then({agent, services, reader, awaiting}) {
        agent.returnRows.some(row => row.returnId == state.returnId && row.customerReference == "JQP-CSRS-1")
        !services.returnRows.some(row => row.returnId == state.returnId)
        reader.includes("PERMISSION_DENIED")
        awaiting.approvalRows.some(row => row.returnId == state.returnId && row.previewExpireText)
    }
})

feature("the batch authorizes each return on its own: the user's authorized, a forged one Forbidden", {
    when() {
        const applied = asUser(
            users.returns,
            () =>
                invoke(R + "apply#ReturnBatch", {
                    appRoot: "CustomerService",
                    action: "authorize",
                    returnIds: [state.returnId, "BOSS_CS_NO_RETURN"],
                    operationKey: key()
                }),
            false
        )
        const header = system(() =>
            ec.entity.find("mantle.order.return.ReturnHeader").condition({returnId: state.returnId}).one()
        )
        const agentBatch = asUser(
            users.agent,
            () => invoke(R + "apply#ReturnBatch", {appRoot: "CustomerService", action: "authorize", returnIds: [state.returnId]}),
            false
        )
        return {applied, header, agentBatch}
    },
    then({applied, header, agentBatch}) {
        applied.results.find(row => row.returnId == state.returnId).result == "Done"
        applied.results.find(row => row.returnId == "BOSS_CS_NO_RETURN").result == "Forbidden"
        header.statusId == "ReturnApproved"
        header.authorizationExpireDate != null
        agentBatch.results[0].result == "Forbidden"
    }
})

feature("ReturnDetail's audience: settlement for F only, receipt for W only, the actions by capability", {
    when() {
        const detail = user =>
            asUser(user, () => invoke(R + "get#ReturnDetail", {appRoot: "CustomerService", returnId: state.returnId}), false)
        return {
            agent: detail(users.agent),
            authorizer: detail(users.returns),
            finance: detail(users.returnsReceivables),
            warehouse: detail(users.agentWarehouse)
        }
    },
    then({agent, authorizer, finance, warehouse}) {
        agent.rh.statusId == "ReturnApproved"
        !agent.settlement.reader
        !agent.rh.canAuthorize && !agent.rh.canIssueLabel && !agent.rh.canSettle
        authorizer.rh.canIssueLabel
        authorizer.rh.canCloseRemainder
        finance.settlement.reader
        agent.rh.canReceive == false
        warehouse.rh.canReceive == warehouse.rh.settlementRequired
        agent.shipmentRows.length == 1
    }
})

feature("Returns, NewReturn and ReturnDetail render once (qvt)", {
    when() {
        const list = asUser(users.returns, () => page("Returns/Returns", {view: "authorized"}))
        const newReturn = asUser(users.agent, () => page("Returns/NewReturn", {orderId: ids.deliveredOrderId}))
        const detail = asUser(users.returns, () => page("Returns/ReturnDetail", {returnId: state.returnId}))
        return {list, newReturn, detail}
    },
    then({list, newReturn, detail}) {
        list.status == 200
        list.errors.length == 0
        list.output.includes(state.returnId)
        newReturn.status == 200
        newReturn.errors.length == 0
        newReturn.output.includes("What comes back")
        detail.status == 200
        detail.errors.length == 0
        detail.output.includes("JQP-CSRS-1")
        detail.output.includes("Issue return label")
    }
})
