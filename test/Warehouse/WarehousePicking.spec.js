// Warehouse P11 in BOSS (impl-warehouse P11): the picker's overdue pick is a Today item; Home counts the picking queue; the
// shared ShipmentDetail shows an outgoing shipment in its Warehouse outbound branch and a receipt still in its receipt branch;
// OrderDetail shows the Warehouse fulfillment; the Pick task lists the demo picklist's line in pick order. The guarded picks,
// the wave, short picks, put back and pick faces are mr-mantle's WarehousePicking spec; access is WarehouseAccess.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {ids, asUser, invoke} = lib
spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("the picker's picklist still open from an earlier day is a Today item, and Home counts the picking queue", {
    when() {
        return {
            today: asUser("warehouse.pick", () => invoke("ironstone.warehouse.HomeServices.get#TodayItems", {}).items),
            reader: asUser("warehouse.read", () => invoke("ironstone.warehouse.HomeServices.get#TodayItems", {}).items),
            queue: asUser("warehouse.picksupervisor", () =>
                invoke("ironstone.warehouse.HomeServices.get#Home", {facilityId: ids.facilityId}).queueRows.find(
                    row => row.operation === "picking"
                )
            )
        }
    },
    then({today, reader, queue}) {
        today.some(item => item.title.includes("Pick Morning picks") && item.url.includes("PicklistDetail?workEffortId=BOSS_WH_LOAD"))
        !reader.some(item => String(item.title).includes("Morning picks"))
        queue.readyCount >= 1
        queue.lateCount >= 1
        queue.waitingCount != null
    }
})

feature("ShipmentDetail shows an outgoing shipment's outbound branch and a receipt its receipt branch", {
    when() {
        return asUser("warehouse.read", () => ({
            outbound: lib.page("Shipping/ShipmentDetail", {shipmentId: "BOSS_WH_SHIP_PICK"}, "html"),
            receipt: lib.page("Receiving/ReceiptDetail", {shipmentId: "BOSS_WH_SHIP_IN"}, "html"),
            foreign: lib.page("Shipping/ShipmentDetail", {shipmentId: ids.otherShipmentId}, "html"),
            order: lib.page("Orders/OrderDetail", {orderId: "BOSS_WH_SO"}, "html")
        }))
    },
    then({outbound, receipt, foreign, order}) {
        outbound.errors == []
        outbound.output.includes("Items and sources")
        outbound.output.includes("Pick demo bracket")
        !outbound.output.includes("Unit price")
        receipt.errors == []
        receipt.output.includes("Lot-tracked sealant")
        foreign.output.includes("is not available")
        order.errors == []
        order.output.includes("Fulfillment")
        order.output.includes("BOSS_WH_SHIP_PICK")
    }
})

feature("the Pick task lists the picklist's line at its reserved location, and Short and Finish for the picker", {
    when() {
        return asUser("warehouse.pick", () => ({
            context: invoke("ironstone.warehouse.PickingServices.get#PickContext", {workEffortId: "BOSS_WH_LOAD"}),
            page: lib.page("Picking/Pick", {workEffortId: "BOSS_WH_LOAD"}, "html"),
            sheet: lib.page("Picking/PickSheet", {workEffortId: "BOSS_WH_LOAD", combined: "Y"}, "html")
        }))
    },
    then({context, page, sheet}) {
        context.found == true
        context.lines.some(line => line.shipmentItemSourceId === "BOSS_WH_SIS_PICK" && line.locationSeqId === "01020201")
        context.shortReasons.length >= 4
        page.errors == []
        page.output.includes("Pick demo bracket")
        page.output.includes("Short")
        sheet.errors == []
        sheet.output.includes("Pick and pack")
    }
})
