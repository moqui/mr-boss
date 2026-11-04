// Drop-ship fixtures the Purchasing specs share (impl-purchasing P7): a customer order of Retail's to Joe Q Public whose lines
// reserve at Ziddleman's drop-ship facility (BOSS_PUR_DROPSHIP, BossPurchasingDemoData.xml) or ZIRET_WH, placed and approved by
// john.doe, whose approval makes the drop-ship purchase order (Retail's approval gate off in the demo: approved and emailed
// once the approval commits, on a worker of its own). Each call makes a new order.
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, system, invoke} = lib
const facilityId = "BOSS_PUR_DROPSHIP",
    productId = "DEMO_3_1"
const one = (entity, key) => system(() => ec.entity.find(entity).condition(key).one())
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))

// lines: [productId, quantity, facilityId], one order part per facility; approve false leaves it placed
function customerOrder(lines = [[productId, 2, facilityId]], approve = true) {
    const fixture = {parts: {}}
    system(() => {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const created = invoke("mantle.order.OrderServices.create#Order", {
            vendorPartyId: ids.organizationId,
            customerPartyId: "CustJqp",
            currencyUomId: "USD"
        })
        fixture.orderId = created.orderId
        for (const [lineProductId, quantity, lineFacilityId] of lines) {
            let orderPartSeqId = fixture.parts[lineFacilityId]
            if (!orderPartSeqId) {
                orderPartSeqId = Object.keys(fixture.parts).length
                    ? invoke("mantle.order.OrderServices.create#OrderPart", {
                          orderId: created.orderId,
                          vendorPartyId: ids.organizationId,
                          customerPartyId: "CustJqp",
                          facilityId: lineFacilityId
                      }).orderPartSeqId
                    : created.orderPartSeqId
                invoke("update#mantle.order.OrderPart", {orderId: created.orderId, orderPartSeqId, facilityId: lineFacilityId})
                invoke("mantle.order.OrderServices.set#OrderBillingShippingInfo", {
                    orderId: created.orderId,
                    orderPartSeqId,
                    shippingPostalContactMechId: "CustJqpAddr",
                    carrierPartyId: "_NA_",
                    shipmentMethodEnumId: "ShMthGround"
                })
                fixture.parts[lineFacilityId] = orderPartSeqId
            }
            invoke("mantle.order.OrderServices.add#OrderProductQuantity", {
                orderId: created.orderId,
                orderPartSeqId,
                productId: lineProductId,
                quantity,
                unitAmount: 15
            })
        }
    })
    // placed and approved each in its own transaction, so the approval's commit sends the purchase order
    for (const verb of approve ? ["place", "approve"] : ["place"])
        system(() =>
            ec.service
                .sync()
                .name("mantle.order.OrderServices." + verb + "#Order")
                .parameters({orderId: fixture.orderId})
                .requireNewTransaction(true)
                .call()
        )
    ec.message.clearErrors()
    fixture.purchaseOrderId = rows("mantle.order.OrderHeader", {parentOrderId: fixture.orderId})[0]?.orderId || null
    return fixture
}
// the order's status once the drop-ship send has run (it goes out after the approval commits, on a worker)
function settledStatus(orderId, statusId = "OrderSent") {
    const deadline = Date.now() + 5000
    let current = one("mantle.order.OrderHeader", {orderId})?.statusId
    while (Date.now() < deadline && current !== statusId) {
        ec.factory.waitWorkerPoolEmpty(50)
        current = one("mantle.order.OrderHeader", {orderId})?.statusId
    }
    return current
}

;({facilityId, productId, customerOrder, settledStatus, one, rows})
