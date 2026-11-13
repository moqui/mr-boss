// Purchasing P7's "usable when" (impl-purchasing P7), through the screens' transitions with artifact authorization on: a
// customer order line reserved at Ziddleman's drop-ship facility makes a purchase order to Ziddleman whose parent is the
// customer order, shipping to the customer, while a line reserved in ZIRET_WH stays with the warehouse; with Retail's approval
// gate on, the order waits for a purchase approver, and once approved goes out by email (Ziddleman's facility has no
// integration); the buyer's Confirm delivery with a tracking code ships the order's delivery and packs and ships the customer
// shipment with that code, invoicing the customer once, and a retry changes nothing; "Drop-ship from supplier" on a warehouse
// line of DEMO_3_1 (Ziddleman's drop-ship price) makes the same kind of order; ZIRET_WH's stock is unchanged and the
// supplier's bill matches against the delivery. OrderDetail renders both orders' drop-ship parts. Retail's gate is turned on
// for the walk and off again after it. Run: ./moq accept mr-boss --spec PurchasingDropShipWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const dropShip = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingDropShipLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const {one, rows} = dropShip
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const detailPath = "Orders/OrderDetail/"
const state = {}
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Purchasing/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const statusOf = orderId => one("mantle.order.OrderHeader", {orderId}).statusId
const stockAt = (productId, facilityId) =>
    rows("mantle.product.asset.Asset", {productId, facilityId}).reduce(
        (sum, asset) => sum + toDecimal(asset.quantityOnHandTotal ?? 0).toNumber(),
        0
    )
function gate(value) {
    const read = asUser(
        users.admin,
        () => invoke("mantle.order.PurchaseServices.get#PurchasePolicy", {organizationPartyId: ids.organizationId}),
        false
    )
    asUser(
        users.admin,
        () =>
            invoke("mantle.order.PurchaseServices.store#PurchasePolicy", {
                organizationPartyId: ids.organizationId,
                expectedFromDate: read.policyFromDate,
                policyGroup: "controls",
                approvalGateEnabled: value,
                changeReason: "Purchasing drop-ship walk: the approval gate " + (value === "Y" ? "on" : "off")
            }),
        false
    )
}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        state.stockBefore = stockAt(dropShip.productId, ids.facilityId)
        gate("Y")
    },
    cleanupSpec() {
        capture.reset()
        gate("N")
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a line reserved at Ziddleman's drop-ship facility makes a purchase order to Ziddleman whose parent is the customer order, shipping to the customer; the ZIRET_WH line stays",
    {
        when() {
            capture.clear()
            const order = dropShip.customerOrder([
                [dropShip.productId, 2, dropShip.facilityId],
                ["DEMO_1_1", 1, ids.facilityId]
            ])
            state.order = order
            const po = order.purchaseOrderId ? one("mantle.order.OrderHeader", {orderId: order.purchaseOrderId}) : null
            const part = po ? one("mantle.order.OrderPart", {orderId: po.orderId, orderPartSeqId: "01"}) : null
            const lines = po ? rows("mantle.order.OrderItem", {orderId: po.orderId}) : []
            const shipTo = po ? rows("mantle.order.OrderPartParty", {orderId: po.orderId, roleTypeId: "CustomerShipTo"}) : []
            const salesView = asUser(users.buyer, () => page(detailPath, {orderId: order.orderId}, "html"))
            const poView = asUser(users.buyer, () => page(detailPath, {orderId: po?.orderId}, "html"))
            return {po, part, lines, shipTo, salesView, poView}
        },
        then({po, part, lines, shipTo, salesView, poView}) {
            po.parentOrderId == state.order.orderId
            part.vendorPartyId == ids.sharedSupplierId
            part.customerPartyId == ids.organizationId
            part.facilityId == dropShip.facilityId
            part.postalContactMechId == "CustJqpAddr"
            shipTo.length == 1 && shipTo[0].partyId == "CustJqp"
            lines.length == 1 && lines[0].productId == dropShip.productId
            lines[0].salesOrderId == state.order.orderId
            salesView.errors.length == 0
            salesView.output.includes("Customer order " + state.order.orderId)
            salesView.output.includes("Drop-ship on purchase order " + po.orderId)
            salesView.output.includes("Ships from")
            poView.errors.length == 0
            poView.output.includes("Drop-ship to")
            poView.output.includes("Customer order " + state.order.orderId)
        }
    }
)

feature("with the gate on the purchase order waits for a purchase approver, and once approved goes out by email", {
    when() {
        const poId = state.order.purchaseOrderId
        const waiting = statusOf(poId)
        const mailsBefore = capture.count()
        const approved = post(users.approve, detailPath + "approveOrder", {
            orderId: poId,
            orderRevision: String(one("mantle.order.OrderHeader", {orderId: poId}).orderRevision),
            operationKey: "dropship-walk-" + Date.now()
        })
        const status = dropShip.settledStatus(poId)
        const message = capture.last()
        return {waiting, mailsBefore, approved, status, mails: capture.count(), message}
    },
    then({waiting, mailsBefore, approved, status, mails, message}) {
        waiting == "OrderPlaced"
        mailsBefore == 0
        approved.errors == ""
        status == "OrderSent"
        mails >= 1
        message.attachmentNames.some(name => name.endsWith(".pdf"))
    }
})

feature(
    "Confirm delivery with a tracking code ships the delivery and the customer shipment with the code, invoicing the customer once; a retry changes nothing",
    {
        when() {
            const poId = state.order.purchaseOrderId
            const confirm = {orderId: poId, trackingCode: "1ZWALKDROP"}
            const reader = post(users.read, detailPath + "confirmDelivery", confirm)
            const confirmed = post(users.buyer, detailPath + "confirmDelivery", confirm)
            const retry = post(users.buyer, detailPath + "confirmDelivery", confirm)
            const deliveries = rows("mantle.shipment.ShipmentItemSource", {orderId: poId})
            const delivery = deliveries.length ? one("mantle.shipment.Shipment", {shipmentId: deliveries[0].shipmentId}) : null
            const dropSeq = rows("mantle.order.OrderItem", {orderId: state.order.orderId, productId: dropShip.productId})[0]
                .orderItemSeqId
            const salesSources = rows("mantle.shipment.ShipmentItemSource", {
                orderId: state.order.orderId,
                orderItemSeqId: dropSeq
            })
            const salesShipment = salesSources.length
                ? one("mantle.shipment.Shipment", {shipmentId: salesSources[0].shipmentId})
                : null
            const tracking = salesShipment
                ? rows("mantle.shipment.ShipmentPackageRouteSeg", {shipmentId: salesShipment.shipmentId}).map(
                      row => row.trackingCode
                  )
                : []
            const billings = rows("mantle.order.OrderItemBilling", {orderId: state.order.orderId, orderItemSeqId: dropSeq})
            return {reader, confirmed, retry, deliveries, delivery, salesShipment, tracking, billings, status: statusOf(poId)}
        },
        then({reader, confirmed, retry, deliveries, delivery, salesShipment, tracking, billings, status}) {
            reader.errors.includes("PERMISSION_DENIED") || reader.errors.includes("not authorized") || reader.status != 200
            confirmed.errors == ""
            retry.errors == ""
            deliveries.length == 1
            delivery.shipmentTypeEnumId == "ShpTpPurchase"
            delivery.statusId == "ShipShipped"
            salesShipment.statusId == "ShipShipped"
            tracking.includes("1ZWALKDROP")
            billings.length == 1
            status == "OrderCompleted"
        }
    }
)

feature("Drop-ship from supplier on a warehouse line of DEMO_3_1 makes the same kind of purchase order", {
    when() {
        const order = dropShip.customerOrder([[dropShip.productId, 3, ids.facilityId]])
        const seq = rows("mantle.order.OrderItem", {orderId: order.orderId})[0].orderItemSeqId
        const routed = post(users.buyer, detailPath + "dropShipLine", {
            orderId: order.orderId,
            orderItemSeqId: seq,
            supplierPartyId: ids.sharedSupplierId
        })
        const line = rows("mantle.order.OrderItem", {salesOrderId: order.orderId, salesOrderItemSeqId: seq})[0]
        const po = line ? one("mantle.order.OrderHeader", {orderId: line.orderId}) : null
        return {order, routed, line, po}
    },
    then({order, routed, line, po}) {
        order.purchaseOrderId == null
        routed.errors == ""
        line.productId == dropShip.productId
        po.parentOrderId == order.orderId
        po.statusId == "OrderPlaced"
    }
})

feature("ZIRET_WH's stock is unchanged, and the supplier's bill matches against the confirmed delivery", {
    when() {
        const reference = "DROPSHIP-WALK-" + Date.now()
        const invoiceId = asUser(
            users.buyer,
            () =>
                invoke("mantle.account.InvoiceServices.import#Bill", {
                    organizationPartyId: ids.organizationId,
                    supplierPartyId: ids.sharedSupplierId,
                    referenceNumber: reference
                }).invoiceId,
            false
        )
        system(() =>
            invoke("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId,
                itemTypeEnumId: "ItemProduct",
                productId: dropShip.productId,
                quantity: 2,
                amount: "4.50"
            })
        )
        const evaluated = asUser(
            users.buyMatch,
            () => invoke("mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch", {invoiceId}),
            false
        )
        return {evaluated, stockAfter: stockAt(dropShip.productId, ids.facilityId)}
    },
    then({evaluated, stockAfter}) {
        stockAfter == state.stockBefore
        evaluated.resultEnumId == "ImrMatched"
        Array.from(evaluated.sourceRows).some(row => row.orderId == state.order.purchaseOrderId)
    }
})
