// Purchasing's purchase orders (impl-purchasing P3; design-purchasing §6): the PurchaseOrders list's views with ordered,
// received, billed and balance kept apart and amounts withheld from a reader (its one html render); OrderDetail's Purchasing
// context with the actions a buyer's draft offers (its one html render) and none for a reader; the bulk approval naming the
// order it refuses; Home's draft and unsent counts. The Mantle rules (the verbs, the approval gate, the hold, the send and
// the print) are mr-mantle's PurchaseOrders spec; the walk is the acceptance PurchasingOrdersWalk and the client
// PurchasingOrdersWalk. Run: ./moq test mr-boss --spec PurchasingOrders
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, refusal, invoke, page} = lib
const P = "mantle.order.PurchaseServices.",
    O = "ironstone.purchasing.OrderServices."
const state = {}

// a placed purchase order of Retail's from Ziddleman (DEMO_1_1 at its supplier price), made by the buyer through the Mantle
// services (which the screens call; their own permission checks hold with artifact authorization off)
function placedOrder(name) {
    return asUser(
        users.buyer,
        () => {
            const orderId = invoke(P + "create#PurchaseOrder", {
                organizationPartyId: ids.organizationId,
                vendorPartyId: ids.sharedSupplierId,
                orderName: name
            }).orderId
            invoke(P + "store#PurchaseOrderItem", {orderId, productId: "DEMO_1_1", quantity: 2})
            invoke(P + "place#PurchaseOrder", {orderId})
            return orderId
        },
        false
    )
}

spec({
    setupSpec() {
        state.placedId = placedOrder("Spec placed order")
        state.secondId = placedOrder("Spec second order")
    }
})

feature("the list shows a view's orders with ordered, received, billed and balance apart; a reader sees amounts withheld", {
    when() {
        const find = user =>
            asUser(user, () => invoke(O + "find#PurchaseOrders", {appRoot: "Purchasing", view: "approval", text: "spec placed"}))
        const buyer = find(users.buyer)
        const reader = find(users.read)
        const drafts = asUser(users.buyer, () => invoke(O + "find#PurchaseOrders", {appRoot: "Purchasing", view: "draft"}))
        const requester = asUser(users.requester, () => refusal(O + "find#PurchaseOrders", {appRoot: "Purchasing"}))
        const render = asUser(users.buyer, () => page("Orders/PurchaseOrders", {view: "approval", text: "spec placed"}, "html"))
        const row = list => Array.from(list.orderRows || []).find(each => each.orderId === state.placedId) || {}
        return {buyerRow: row(buyer), readerRow: row(reader), drafts, requester, render}
    },
    then({buyerRow, readerRow, drafts, requester, render}) {
        buyerRow.statusId == "OrderPlaced"
        buyerRow.orderRevision >= 1
        buyerRow.supplierName.startsWith("Ziddleman")
        buyerRow.orderedText == "2"
        buyerRow.receivedText == "0"
        buyerRow.totalText.includes("18")
        buyerRow.billedText.includes("0")
        buyerRow.balanceText.includes("18")
        readerRow.totalText == "Withheld"
        readerRow.balanceText == "Withheld"
        drafts.orderRows.some(row => row.orderId == ids.orderId)
        !drafts.orderRows.some(row => row.orderId == state.placedId)
        requester.includes("PERMISSION_DENIED") || requester.includes("is not authorized")
        render.status == 200
        render.errors == []
        render.output.includes(state.placedId)
        render.output.includes("Spec placed order")
        render.output.includes("New purchase order")
        render.output.includes("Awaiting approval")
    }
})

feature(
    "OrderDetail shows a buyer's draft with its lines and draft actions; a reader gets no action and amounts withheld, in the history too",
    {
        when() {
            const render = asUser(users.buyer, () => page("Orders/OrderDetail", {orderId: ids.orderId}, "html"))
            const reader = asUser(users.read, () =>
                invoke(O + "get#OrderDetail", {appRoot: "Purchasing", orderId: ids.orderId})
            ).purchaseOrder
            const placed = asUser(users.approve, () =>
                invoke(O + "get#OrderDetail", {appRoot: "Purchasing", orderId: state.placedId})
            ).purchaseOrder
            const readerPlaced = asUser(users.read, () =>
                invoke(O + "get#OrderDetail", {appRoot: "Purchasing", orderId: state.placedId})
            ).purchaseOrder
            const prices = order => order.historyRows.filter(row => row.whatText.endsWith("Price"))
            return {render, reader, placed, approverPrices: prices(placed), readerPrices: prices(readerPlaced)}
        },
        then({render, reader, placed, approverPrices, readerPrices}) {
            render.status == 200
            render.errors == []
            render.output.includes("Purchase order " + ids.orderId)
            render.output.includes("Brightline")
            render.output.includes("Add line")
            render.output.includes("Place")
            render.output.includes("Lines · 1")
            // P4: the approvals section (template/PurchasingOrderApprovals.xml) of a draft
            render.output.includes("No approval decision yet.")
            Object.values(reader.actions).every(allowed => !allowed)
            reader.totalText == "Withheld"
            reader.itemRows[0].priceText == "Withheld"
            placed.actions.approve == true
            // P4: the approver may refuse the step waiting of Retail's policy (one step up to $5,000); a reader gets no preview
            placed.actions.refuse == true
            placed.approval.stepRows.length == 1
            placed.approval.canDecide == true
            reader.approval == null
            placed.actions.place == false
            placed.actions.edit == false
            // the history's price changes are withheld from the reader too
            approverPrices.length > 0
            approverPrices[0].toText.includes("9")
            readerPrices.length == approverPrices.length
            readerPrices.every(row => row.toText == "Withheld" && row.fromText == "Withheld")
        }
    }
)

feature("the bulk approval approves each order it may and names the one it refuses", {
    when() {
        // the list's Approve posts the revisions shown: one changed since is refused, not approved (P4 review, F-P4-6)
        const revision = asUser(users.approve, () =>
            invoke(O + "get#OrderDetail", {appRoot: "Purchasing", orderId: state.secondId})
        ).purchaseOrder.orderRevision
        const stalePost = asUser(users.approve, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Purchasing.xml")
                .render(
                    "Orders/PurchaseOrders/bulkAction",
                    {
                        action: "approve",
                        selectedIds: [state.secondId],
                        orderRevisionsText: JSON.stringify({[state.secondId]: Number(revision) - 1})
                    },
                    "post"
                )
        )
        ec.message.clearErrors()
        const staleStatus = ec.entity
            .find("mantle.order.OrderHeader")
            .condition("orderId", state.secondId)
            .disableAuthz()
            .one().statusId
        const out = asUser(users.approve, () =>
            invoke(O + "bulk#PurchaseOrderActions", {
                appRoot: "Purchasing",
                action: "approve",
                orderIds: [state.secondId, ids.orderId]
            })
        )
        const status = asUser(users.approve, () =>
            invoke(O + "get#OrderDetail", {appRoot: "Purchasing", orderId: state.secondId})
        ).purchaseOrder.statusId
        return {revision, stalePost, staleStatus, out, status}
    },
    then({revision, stalePost, staleStatus, out, status}) {
        Number(revision) >= 1
        stalePost.status < 400
        staleStatus == "OrderPlaced"
        out.results.find(row => row.orderId == ids.orderId).resultCode == "ORDER_NOT_PLACED"
        out.results.find(row => row.orderId == state.secondId).resultCode == "DONE"
        out.summary.startsWith("1 of 2 approved")
        status == "OrderApproved"
    }
})

feature("Home counts the drafts and the approved orders not sent, and a buyer's work lists the orders to send", {
    when() {
        const home = user => asUser(user, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {appRoot: "Purchasing"}))
        const work = asUser(users.buyer, () =>
            invoke("ironstone.purchasing.BuyerServices.find#BuyerWork", {appRoot: "Purchasing"})
        )
        return {
            buyer: home(users.buyer).counters,
            requester: home(users.requester).counters,
            approver: home(users.approve).counters,
            work
        }
    },
    then({buyer, requester, approver, work}) {
        // P4: the approvals waiting for the approver (the placed order's PurchaseOrderApproval), none counted for a buyer
        approver.approvalCount >= 1
        buyer.approvalCount == null
        buyer.draftCount >= 1
        buyer.unsentCount >= 1
        requester.draftCount == null
        work.workRows.some(row => row.documentText.includes(state.secondId) && row.nextAction == "Send to the supplier")
    }
})
