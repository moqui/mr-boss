// Purchasing's revisions and acknowledgements (impl-purchasing P9; design-purchasing §6 OrderChanges and Acknowledgements):
// the Acknowledgements list's views over the sent orders (its one html render), Home's unacknowledged count and the Today
// source; OrderChanges' effects of a proposed change beside what the line has behind it (its one html render) and
// OrderDetail's revisions and acknowledgement read with the actions by capability. The Mantle rules (start, preview, apply
// with its receipt, budget and match effects, the approval of the new revision, the acknowledgement and the reminders) are
// mr-mantle's PurchaseRevisions spec; the walk is the acceptance PurchasingRevisionsWalk. Run: ./moq test mr-boss --spec
// PurchasingRevisions
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const P = "mantle.order.PurchaseServices.",
    O = "mantle.order.OrderServices.",
    R = "ironstone.purchasing.RevisionServices."
const state = {}

spec({
    setupSpec() {
        // Retail's approved order from Ziddleman (DEMO_1_1 at its supplier price), with a change started on it
        state.orderId = asUser(
            users.buyer,
            () => {
                const orderId = invoke(P + "create#PurchaseOrder", {
                    organizationPartyId: ids.organizationId,
                    vendorPartyId: ids.sharedSupplierId,
                    orderName: "Spec revised order"
                }).orderId
                invoke(P + "store#PurchaseOrderItem", {orderId, productId: "DEMO_1_1", quantity: 6})
                invoke(P + "place#PurchaseOrder", {orderId})
                return orderId
            },
            false
        )
        system(() => invoke(O + "update#OrderStatus", {orderId: state.orderId, statusId: "OrderApproved"}))
        asUser(users.buyer, () => invoke(O + "start#PurchaseRevision", {orderId: state.orderId, reason: "Spec change"}), false)
    }
})

feature("Acknowledgements lists the sent order not acknowledged and Home counts it; a requester is refused the list", {
    when() {
        const find = view =>
            asUser(users.buyer, () =>
                invoke("ironstone.purchasing.OrderServices.find#Acknowledgements", {appRoot: "Purchasing", view})
            )
        const listed = rows => Array.from(rows.ackRows || []).map(row => row.orderId)
        const unacknowledged = find("unacknowledged")
        const changed = find("changed")
        const requester = asUser(users.requester, () =>
            refusal("ironstone.purchasing.OrderServices.find#Acknowledgements", {appRoot: "Purchasing"})
        )
        const home = user =>
            asUser(user, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {appRoot: "Purchasing"}).counters)
        const today = user => asUser(user, () => invoke(R + "get#TodayItems", {}))
        const render = asUser(users.buyer, () => page("Orders/Acknowledgements", {}, "html"))
        const row = Array.from(unacknowledged.ackRows || []).find(each => each.orderId === ids.ackOrderId) || {}
        return {
            unacknowledged: listed(unacknowledged),
            row,
            changed: listed(changed),
            requester,
            buyerCount: home(users.buyer).unacknowledgedCount,
            requesterCount: home(users.requester).unacknowledgedCount,
            buyerToday: today(users.buyer),
            readerToday: today(users.read),
            render
        }
    },
    then({unacknowledged, row, changed, requester, buyerCount, requesterCount, buyerToday, readerToday, render}) {
        unacknowledged.includes(ids.ackOrderId)
        row.supplierName.startsWith("Brightline")
        row.responseText == "None yet"
        row.requiredText.startsWith("2026-11-")
        !changed.includes(ids.ackOrderId)
        requester.includes("PERMISSION_DENIED")
        buyerCount >= 1
        requesterCount == null
        Array.isArray(buyerToday.items)
        readerToday.items.length == 0
        render.errors.length == 0
        render.output.includes("Fastener restock")
        render.output.includes("Changed promise")
    }
})

feature(
    "OrderChanges shows a proposed cut beside the line's quantities with the apply step; OrderDetail's read offers the change to a buyer only",
    {
        when() {
            const changesText = JSON.stringify({itemChanges: [{orderItemSeqId: "01", quantity: "4"}]})
            const render = asUser(users.buyer, () => page("Orders/OrderChanges", {orderId: state.orderId, changesText}, "html"))
            const read = user =>
                asUser(
                    user,
                    () => invoke(R + "get#OrderRevisions", {appRoot: "Purchasing", orderId: state.orderId}).orderRevisions
                )
            const buyer = read(users.buyer)
            const reader = read(users.read)
            const sent = asUser(
                users.buyer,
                () => invoke(R + "get#OrderRevisions", {appRoot: "Purchasing", orderId: ids.ackOrderId}).orderRevisions
            )
            return {render, buyer, reader, sent}
        },
        then({render, buyer, reader, sent}) {
            render.errors.length == 0
            render.output.includes("Line 01 Quantity")
            render.output.includes("Lowest quantity")
            render.output.includes("Apply revision")
            buyer.revisionState == "started"
            buyer.actions.continueChange == true
            buyer.actions.change == false
            buyer.revisionRows.length >= 1
            buyer.acknowledgement.stateText == "Not acknowledged yet"
            reader.actions.continueChange == false
            reader.actions.acknowledge == false
            sent.actions.change == true
            sent.actions.remind == true
            sent.lineRows[0].requiredText.startsWith("2026-11-")
        }
    }
)
