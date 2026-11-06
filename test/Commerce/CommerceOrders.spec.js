// Commerce orders, carts and customers (impl-commerce P8; design-commerce §6, §10): the store operations in Commerce's
// context by store scope (the operator's demo-store order with its Payment hold, which the operator cannot release; the
// reader and the other organization refused), the record link and palette of a store order under Commerce for a user
// Customer Service does not take (F8, F42) while a Customer Service user keeps its own, and the one qvt render of
// OrderDetail's Commerce branch and of CartDetail. The worklist rules themselves are Mantle's (StoreOperations). The walk is
// the acceptance CommerceOrdersWalk.
// Run: ./moq test mr-boss --spec CommerceOrders
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const O = "mantle.order.StoreOperationsServices."
const prefix = "BOSS_COM8"
const orderId = prefix + "_HELD",
    cartId = prefix + "_CART",
    otherOrderId = prefix + "_DIGITAL"
const as = (user, service, parameters = {}) => asUser(user, () => invoke(O + service, parameters), false)
const refused = (user, service, parameters = {}) => asUser(user, () => refusal(service, parameters), false)
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")
const make = (entity, values) =>
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(values)
        .call()
let holdId = null

function storeOrder(id, statusId, productStoreId = ids.storeId, vendorPartyId = ids.organizationId) {
    make("mantle.order.OrderHeader", {
        orderId: id,
        productStoreId,
        statusId,
        currencyUomId: "USD",
        entryDate: ec.user.nowTimestamp,
        placedDate: statusId === "OrderOpen" ? null : ec.user.nowTimestamp,
        grandTotal: 25
    })
    make("mantle.order.OrderPart", {
        orderId: id,
        orderPartSeqId: "01",
        vendorPartyId,
        customerPartyId: ids.customerId,
        statusId
    })
    make("mantle.order.OrderItem", {
        orderId: id,
        orderItemSeqId: "01",
        orderPartSeqId: "01",
        itemTypeEnumId: "ItemProduct",
        productId: "BOSS_CS_FILTER",
        itemDescription: "Commerce spec item",
        quantity: 1,
        unitAmount: 25
    })
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            storeOrder(orderId, "OrderApproved")
            holdId = make("mantle.order.OrderHoldReason", {
                orderId,
                holdTypeEnumId: "OhtPayment",
                holdComment: "The capture failed after placement",
                placedDate: ec.user.nowTimestamp
            }).orderHoldReasonId
            storeOrder(cartId, "OrderOpen")
            // Ziziwork Services' digital store, another organization's
            storeOrder(otherOrderId, "OrderApproved", ids.otherStoreId, ids.otherOrganizationId)
            make("mantle.order.StoreCartAccess", {
                cartAccessId: prefix + "_ACCESS",
                orderId: cartId,
                productStoreId: ids.storeId,
                customerPartyId: ids.customerId,
                lastActivityDate: ec.user.nowTimestamp,
                createdDate: ec.user.nowTimestamp
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the demo store's held order by store scope: the operator reads its hold and cannot release it, others are refused", {
    when() {
        const link = user =>
            asUser(user, () =>
                invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                    recordEntityName: "mantle.order.OrderHeader",
                    id: orderId
                })
            ).url || null
        return {
            held: as(users.operator, "find#StoreOrders", {attention: "paymentHold", pageSize: 100}).orders || [],
            detail: as(users.operator, "get#StoreOrder", {orderId}),
            release: refused(users.operator, "mantle.order.OrderServices.release#OrderHold", {
                orderHoldReasonId: holdId,
                releaseComment: "Released from Commerce"
            }),
            reader: refused(users.read, O + "find#StoreOrders", {}),
            other: refused(users.operator, O + "get#StoreOrder", {orderId: otherOrderId}),
            operatorLink: link(users.operator),
            serviceLink: link("customerservice.orderdesk"),
            otherLink: link(users.services),
            palette:
                asUser(users.operator, () =>
                    invoke("ironstone.commerce.ContextServices.search#Records", {text: prefix, limit: 10})
                ).rows || []
        }
    },
    then(r) {
        r.held.some(row => row.orderId == orderId && row.paymentHold)
        r.detail.holds[0].payment == true
        code(r.release) == "PERMISSION_DENIED"
        code(r.reader) == "PERMISSION_DENIED"
        code(r.other) == "RECORD_UNAVAILABLE"
        r.operatorLink == "/qapps/Commerce/Orders/OrderDetail?orderId=" + orderId
        r.serviceLink.startsWith("/qapps/CustomerService/")
        r.otherLink == null
        r.palette.some(row => row.recordId == orderId && row.recordEntity == "mantle.order.OrderHeader")
        r.palette.some(row => row.url == "/qapps/Commerce/Orders/CartDetail?orderId=" + cartId)
    }
})

// OrderDetail under Commerce and CartDetail, each rendered once (qvt): the held order's header, its Payment hold banner read
// only and Order again; the cart's summary, activity and empty recovery history
feature("OrderDetail's Commerce branch shows the Payment hold read only with Order again, and CartDetail the cart", {
    when() {
        return asUser(users.operator, () => ({
            order: lib.page("Orders/OrderDetail", {orderId}),
            cart: lib.page("Orders/CartDetail", {orderId: cartId})
        }))
    },
    then(r) {
        r.order.status == 200
        r.order.errors == []
        r.order.output.includes("Payment hold")
        r.order.output.includes("The capture failed after placement")
        r.order.output.includes("an Accounting payment operator releases the hold")
        r.order.output.includes("Order again")
        !r.order.output.includes("Not available")
        r.cart.status == 200
        r.cart.errors == []
        r.cart.output.includes("Cart summary")
        r.cart.output.includes("Commerce spec item")
        r.cart.output.includes("No recovery sent")
    }
})
