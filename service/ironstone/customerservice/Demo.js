// The Customer Service demo orders for ORG_ZIZI_RETAIL (BossCustomerServiceDemoData.xml; impl-customer-service P1, F34),
// made once by fixed ID through Mantle's order, shipment and payment services, as Accounting's Demo.js: Mantle seeds no
// sales orders. Joe Q Public's order of the warranted, serialized demo thermostat and two filters, paid by check, shipped,
// invoiced at ship and delivered (the thermostat's Asset is then the customer's, AstDelivered, with its AssetIssuance);
// Joe's Distributing's order of four filters, approved and reserved, awaiting pick; and its order of two filters, packed.
// The products, their stock and the other organization's order are rows of the data file. Later phases add queues, teams,
// cases, returns and contacts.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, rows, call} = lib

const organizationPartyId = "ORG_ZIZI_RETAIL"
const productStoreId = "POPC_DEFAULT"
const facilityId = "ZIRET_WH"
const thermostat = "BOSS_CS_THERMOSTAT"
const filter = "BOSS_CS_FILTER"

function createOnce(entity, key, values) {
    if (!one(entity, key)) call("create#" + entity, Object.assign({}, key, values))
}

// A sales order of the organization to a customer at the demo warehouse, its lines added and placed once; answers whether it
// was made now (an order that has its lines is left as it is).
function salesOrder(orderId, customerPartyId, orderName, lines, payment) {
    createOnce(
        "mantle.order.OrderHeader",
        {orderId},
        {
            orderName,
            statusId: "OrderOpen",
            productStoreId,
            currencyUomId: one("mantle.product.store.ProductStore", {productStoreId}).defaultCurrencyUomId,
            entryDate: ec.user.nowTimestamp
        }
    )
    createOnce(
        "mantle.order.OrderPart",
        {orderId, orderPartSeqId: "01"},
        {vendorPartyId: organizationPartyId, customerPartyId, statusId: "OrderOpen", facilityId}
    )
    if (rows("mantle.order.OrderItem", {orderId}).length) return {made: false}
    for (const [productId, quantity, unitAmount] of lines)
        call("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId,
            orderPartSeqId: "01",
            productId,
            quantity,
            unitAmount
        })
    const paid = payment
        ? call("mantle.order.OrderServices.add#OrderPartPayment", {
              orderId,
              orderPartSeqId: "01",
              paymentInstrumentEnumId: "PiCompanyCheck"
          })
        : null
    call("mantle.order.OrderServices.place#Order", {orderId})
    call("mantle.order.OrderServices.approve#Order", {orderId})
    // the check received: the payment is applied to the invoice made at ship
    if (paid)
        call("update#mantle.account.payment.Payment", {
            paymentId: paid.paymentId,
            statusId: "PmntDelivered",
            effectiveDate: ec.user.nowTimestamp
        })
    return {made: true}
}

function deliveredOrder() {
    const orderId = "BOSS_CS_SO_DELIVERED"
    const made = salesOrder(
        orderId,
        "CustJqp",
        "Thermostat and filters",
        [
            [thermostat, 1, 120],
            [filter, 2, 15]
        ],
        true
    )
    if (!made.made) return
    const shipped = call("mantle.shipment.ShipmentServices.ship#OrderPart", {orderId, orderPartSeqId: "01"})
    call("mantle.shipment.ShipmentServices.deliver#Shipment", {shipmentId: shipped.shipmentId})
}
function awaitingPickOrder() {
    salesOrder("BOSS_CS_SO_PICK", "JoeDist", "Filters restock", [[filter, 4, 14]], false)
}
function packedOrder() {
    const orderId = "BOSS_CS_SO_PACKED"
    const made = salesOrder(orderId, "JoeDist", "Filters for the showroom", [[filter, 2, 14]], false)
    if (!made.made) return
    const shipment = call("mantle.shipment.ShipmentServices.create#OrderPartShipment", {orderId, orderPartSeqId: "01"})
    call("mantle.shipment.ShipmentServices.pack#ShipmentProduct", {
        shipmentId: shipment.shipmentId,
        shipmentPackageSeqId: shipment.shipmentPackageSeqId,
        productId: filter,
        quantity: 2
    })
    call("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: shipment.shipmentId})
}

// Run as a system administrator during data loading (john.doe, artifact authorization off), refusing any other user.
function asDemoAdministrator(operation) {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}

const orders = {delivered: deliveredOrder, awaitingPick: awaitingPickOrder, packed: packedOrder}
// Each order on its own transaction (DemoServices.load#DemoOrder): one that fails is logged by name and the others are still
// made (AGENTS.md failure tolerance).
function load() {
    return asDemoAdministrator(() => {
        const errors = []
        for (const order of Object.keys(orders)) {
            try {
                lib.probe("ironstone.customerservice.DemoServices.load#DemoOrder", {order})
            } catch (error) {
                ec.logger.error("Customer Service demo order " + order + " was not made: " + error.message)
                errors.push(order + ": " + error.message)
            }
        }
        return {complete: errors.length === 0, errors}
    })
}
function loadOrder(p) {
    if (!Object.hasOwn(orders, p.order)) throw new Error("Unknown Customer Service demo order " + p.order)
    return asDemoAdministrator(() => {
        orders[p.order]()
        return {}
    })
}

const operations = {load, loadOrder}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service demonstration operation " + op)
        return operations[op](parameters)
    }
})
