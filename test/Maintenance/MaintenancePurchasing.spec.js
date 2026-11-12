// Maintenance purchasing in BOSS (impl-maintenance P10; design-maintenance §3 PurchaseLinks and the OrderDetail mount row,
// design-purchasing "Maintenance purchases"): WorkOrderDetail's Purchasing tab's one qvt render (the held motor's rewind request and
// its purchase order line, Request a purchase and Accept outside service for the supervisor, Warehouse's receiver (the lead's
// decision, P10 review R1), no price); OrderDetail under Maintenance rendered once (read only, the work's line with its work order;
// an order of no work of theirs not available); and Purchasing's RequestDetail rendered once for a reader of Services' purchases
// (the originating work order's id, state and need date; its name and a link into Maintenance only for a user Maintenance admits,
// so neither for them: P10 review R3). The rules are Mantle's MaintenancePurchases; the "usable
// when" is the acceptance MaintenancePurchaseWalk.
// Run: ./moq test mr-boss --spec MaintenancePurchasing
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, page} = lib

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the work order's Purchasing tab shows its request and order line; OrderDetail under Maintenance shows the work's line", {
    when() {
        const tab = asUser(users.supervisor, () =>
            page("WorkOrders/WorkOrderDetail/Purchasing", {workEffortId: ids.heldOrderId, lastStandalone: "true"})
        )
        const order = asUser(users.planner, () => page("WorkOrders/OrderDetail", {orderId: ids.rewindOrderId}))
        const otherOrder = asUser(users.planner, () => page("WorkOrders/OrderDetail", {orderId: "BOSS_PUR_PO_SVC"}))
        return {tab, order, otherOrder}
    },
    then({tab, order, otherOrder}) {
        tab.errors.length == 0
        tab.output.includes("Rewind the compressor motor")
        tab.output.includes(ids.rewindOrderId + ":01")
        tab.output.includes("Delta Motor Rewinds")
        tab.output.includes("Request a purchase")
        tab.output.includes("Accept outside service")
        !tab.output.includes("Accepting outside service is Purchasing")
        !tab.output.includes("$480")
        order.errors.length == 0
        order.output.includes("Lines for maintenance work")
        order.output.includes(ids.heldOrderId + " · Compressor motor vibration")
        !order.output.includes("Not available")
        otherOrder.output.includes("Not available")
    }
})

feature("Purchasing's RequestDetail shows the originating work order to a reader of Services' purchases", {
    when() {
        return asUser("purchasing.services", () =>
            page("Requests/RequestDetail", {requestId: ids.rewindRequestId}, "qvt", "Purchasing")
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("From work order")
        rendered.output.includes(ids.heldOrderId)
        !rendered.output.includes("Compressor motor vibration")
        rendered.output.includes("On Hold")
        !rendered.output.includes("/qapps/Maintenance/WorkOrders/WorkOrderDetail")
    }
})
