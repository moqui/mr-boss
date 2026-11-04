// Purchasing's receiving (impl-purchasing P5; design-purchasing §9): Receipts' lines of the user's purchase orders with
// expected, received, accepted, rejected and held apart, by view (the late demo order in the Late view, Home's late count and
// PurchaseOrders' Late view), refused to a requester (its one html render); the receipt's Purchasing detail, whose receiving
// actions are a holder's of Warehouse's receive permission and whose progress a buyer without it reads (its one html render);
// the Inspections list and the receipt templates under Receiving and the Receipts and quality tab of Supplier360 (their html
// renders). The quantities and the late notice are mr-mantle's PurchaseReceipts spec; receiving into quarantine, the
// inspection's outcome and the expected receipt opened twice are the acceptance PurchasingReceivingWalk.
// Run: ./moq test mr-boss --spec PurchasingReceiving
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, refusal, invoke, page} = lib
const R = "ironstone.purchasing.ReceiptServices."
const lineOf = (found, orderId) => Array.from(found.receiptRows || []).find(row => row.orderId === orderId) || {}

feature("Receipts shows the late order's line with its quantities apart, in the Late view, Home and the orders' Late view", {
    when() {
        const late = asUser(users.buyer, () => invoke(R + "find#ExpectedReceipts", {appRoot: "Purchasing", view: "late"}))
        const completed = asUser(users.read, () =>
            invoke(R + "find#ExpectedReceipts", {appRoot: "Purchasing", view: "completed", orderId: ids.receiptOrderId})
        )
        const requester = asUser(users.requester, () => refusal(R + "find#ExpectedReceipts", {appRoot: "Purchasing"}))
        const render = asUser(users.buyer, () => page("Receiving/Receipts", {view: "late"}, "html"))
        const home = user => asUser(user, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {appRoot: "Purchasing"}))
        const orders = asUser(users.buyer, () =>
            invoke("ironstone.purchasing.OrderServices.find#PurchaseOrders", {appRoot: "Purchasing", view: "late"})
        )
        return {
            line: lineOf(late, ids.receiptOrderId),
            completed,
            requester,
            render,
            buyerLate: home(users.buyer).counters.lateCount,
            requesterLate: home(users.requester).counters.lateCount,
            lateOrders: Array.from(orders.orderRows || []).map(row => row.orderId)
        }
    },
    then({line, completed, requester, render, buyerLate, requesterLate, lateOrders}) {
        line.lineText == ids.receiptOrderId + ":01"
        line.expectedQuantity == "10"
        line.receivedQuantity == "0"
        line.acceptedQuantity == "0"
        line.rejectedQuantity == "0"
        line.heldQuantity == "0"
        line.remainingQuantity == "10"
        line.stateText == "Late"
        line.shipmentId == ids.receiptId
        line.supplierName.startsWith("Ziddleman")
        completed.receiptRows.length == 0
        requester.includes("PERMISSION_DENIED") || requester.includes("is not authorized")
        render.status == 200
        render.errors == []
        render.output.includes(ids.receiptOrderId + ":01")
        render.output.includes(ids.receiptId)
        render.output.includes("Expected receipt (ASN)")
        buyerLate >= 1
        requesterLate == null
        lateOrders.includes(ids.receiptOrderId)
        !lateOrders.includes(ids.orderId)
    }
})

feature("a receipt's detail offers receiving to a holder of Warehouse's receive permission; a buyer without it reads progress", {
    when() {
        const render = asUser(users.buyReceive, () => page("Receiving/ShipmentDetail", {shipmentId: ids.receiptId}, "html"))
        const buyer = asUser(users.buyer, () =>
            invoke(R + "get#ReceiptDetail", {appRoot: "Purchasing", shipmentId: ids.receiptId})
        )
        const other = asUser(users.services, () =>
            refusal(R + "get#ReceiptDetail", {appRoot: "Purchasing", shipmentId: ids.receiptId})
        )
        return {render, buyer, other}
    },
    then({render, buyer, other}) {
        render.status == 200
        render.errors == []
        render.output.includes("Receipt " + ids.receiptId)
        render.output.includes("Receive all as expected")
        render.output.includes("Items and sources")
        render.output.includes(ids.receiptOrderId + ":01")
        buyer.receipt.canReceive == false
        buyer.receipt.progressOnly == true
        buyer.lineRows[0].expectedQuantity == "10"
        buyer.lineRows[0].dueQuantity == "10"
        other.includes("RECORD_UNAVAILABLE")
    }
})

feature("Inspections, the receipt templates and Supplier360's Receipts and quality tab render under Purchasing", {
    when() {
        return asUser(users.buyer, () => ({
            inspections: page("Receiving/Inspections", {view: "all"}, "html"),
            templates: page("Receiving/InspectionTemplates", {}, "html"),
            supplier: page("Suppliers/Supplier360/PurchasingReceipts", {vendorPartyId: ids.sharedSupplierId}, "html")
        }))
    },
    then({inspections, templates, supplier}) {
        inspections.status == 200
        inspections.errors == []
        inspections.output.includes("Purchase receipts held for inspection")
        templates.status == 200
        templates.errors == []
        templates.output.includes("Inspection templates")
        !templates.output.includes("New template")
        supplier.status == 200
        supplier.errors == []
        supplier.output.includes(ids.receiptOrderId + ":01")
        supplier.output.includes("Quality")
    }
})
