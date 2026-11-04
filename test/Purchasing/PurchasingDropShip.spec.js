// Purchasing's drop-ship reads (impl-purchasing P7): the purchase orders' Drop-ship view lists the drop-ship orders whose
// delivery is still to be confirmed, and not the others; Supplier360's Drop-ship tab (its one html render) shows the
// supplier's drop-ship facility and its integration, with Add for a purchase administrator only. The drop-ship rules (the
// order, its send, the delivery, the routing, the match) are Mantle's (mr-mantle test/order/DropShip); the usable-when is the
// acceptance PurchasingDropShipWalk. Run: ./moq test mr-boss --spec PurchasingDropShip
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const dropShip = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingDropShipLib.js")
const {ids, users, asUser, invoke, page} = lib
const state = {}

spec({
    setupSpec() {
        state.order = dropShip.customerOrder()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the Drop-ship view lists the drop-ship orders waiting for their delivery and not the others", {
    when() {
        const found = asUser(users.buyer, () =>
            invoke("ironstone.purchasing.OrderServices.find#PurchaseOrders", {
                appRoot: "Purchasing",
                view: "dropship",
                pageSize: 100
            })
        )
        return {orderIds: Array.from(found.orderRows || []).map(row => row.orderId), viewLabel: found.viewLabel}
    },
    then({orderIds, viewLabel}) {
        state.order.purchaseOrderId != null
        orderIds.includes(state.order.purchaseOrderId)
        !orderIds.includes(ids.orderId)
        viewLabel == "Drop-ship, delivery pending"
    }
})

feature("Supplier360's Drop-ship tab shows the supplier's drop-ship facility, with Add for a purchase administrator only", {
    when() {
        const tab = user =>
            asUser(user, () =>
                page(
                    "Suppliers/Supplier360/PurchasingDropShip",
                    {vendorPartyId: ids.sharedSupplierId, organizationPartyId: ids.organizationId},
                    "html"
                )
            )
        return {admin: tab(users.admin), buyer: tab(users.buyer)}
    },
    then({admin, buyer}) {
        admin.errors.length == 0
        admin.output.includes("Ziddleman direct (drop-ship)")
        admin.output.includes("Email (no integration)")
        admin.output.includes("Add drop-ship facility")
        buyer.errors.length == 0
        buyer.output.includes("Ziddleman direct (drop-ship)")
        !buyer.output.includes("Add drop-ship facility")
    }
})
