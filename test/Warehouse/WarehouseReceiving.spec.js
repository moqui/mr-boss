// Warehouse receiving (impl-warehouse P7; design-warehouse §4, §13 HandheldReceive, §19 short receipt): Receipts lists the
// receipts of the user's facilities; NewReceipt opens a purchase order part's one open receipt (a second request opens the
// same one, a reader is refused); ReceiptDetail (Shared/ShipmentDetail's Warehouse branch) shows the lines and receipts
// with Receive for a receiver only; Receive posts a line with a rejected unit and a lot, a double submit answers the first
// receipt, and a serial count that does not match is refused; Finish closes the remainder with a reason and delivers;
// Supplier360's Warehouse branch shows the supplier's receipts with no price; the Handheld area mounts Receive; the receipt
// document prints the rejected units. The Mantle rules themselves are mr-mantle's WarehouseReceiving spec. Fixture purchase
// orders of Ziddleman for ZIRET_WH, made on the fresh database moqui test gives.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {asUser, invoke, page} = lib
const productId = "BOSS_WH_P7_ITEM"
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const n = value => (value == null ? 0 : Number(String(value)))
const sum = (list, field) => list.reduce((total, row) => total + n(row[field]), 0)
let keySeq = 0
const key = () => "p7-spec-" + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS") + "-" + ++keySeq
let orderId, closeOrderId

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
function call(name, parameters) {
    return ec.service.sync().name(name).parameters(parameters).call() || {}
}
// an approved purchase order of Ziddleman's for ZIRET_WH
function purchaseOrder(lines) {
    const created = call("mantle.order.OrderServices.create#Order", {
        customerPartyId: "ORG_ZIZI_RETAIL",
        vendorPartyId: "ZiddlemanInc",
        currencyUomId: "USD",
        facilityId: "ZIRET_WH"
    })
    for (const [lineProductId, quantity] of lines)
        call("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId: created.orderId,
            orderPartSeqId: created.orderPartSeqId,
            productId: lineProductId,
            quantity,
            unitAmount: 4,
            itemTypeEnumId: "ItemInventory"
        })
    call("mantle.order.OrderServices.place#Order", {orderId: created.orderId})
    call("mantle.order.OrderServices.approve#Order", {orderId: created.orderId})
    return created.orderId
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}
const receiptOf = id => rows("mantle.shipment.ShipmentItemSource", {orderId: id})[0]?.shipmentId

spec({
    setupSpec() {
        login("john.doe")
        withAuthzOff(() => {
            call("create#mantle.product.Product", {
                productId,
                productName: "P7 receiving fixture",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                amountUomId: "OTH_ea"
            })
            orderId = purchaseOrder([
                [productId, 10],
                ["BOSS_WH_SERIAL", 2]
            ])
            closeOrderId = purchaseOrder([[productId, 8]])
        })
    }
})

feature("NewReceipt opens a part's one open receipt; a second request opens the same one; a reader is refused", {
    when() {
        const parameters = {sourceType: "purchase", orderPart: orderId + ":01", facilityId: "ZIRET_WH"}
        const first = asUser("warehouse.receive", () =>
            post("Receiving/Receipts/ensureReceipt", Object.assign({operationKey: key()}, parameters))
        )
        const second = asUser("warehouse.receive", () =>
            post("Receiving/NewReceipt/ensureReceipt", Object.assign({operationKey: key()}, parameters))
        )
        const reader = asUser("warehouse.read", () =>
            post("Receiving/Receipts/ensureReceipt", Object.assign({operationKey: key()}, parameters))
        )
        const shipmentIds = [...new Set(rows("mantle.shipment.ShipmentItemSource", {orderId}).map(row => row.shipmentId))]
        return {
            first,
            second,
            reader,
            shipmentIds,
            list: asUser("warehouse.read", () => page("Receiving/Receipts", {}, "html")),
            receiverList: asUser("warehouse.receive", () => page("Receiving/Receipts", {}, "html"))
        }
    },
    then({first, second, reader, shipmentIds, list, receiverList}) {
        first == ""
        second == ""
        reader.includes("PERMISSION_DENIED")
        shipmentIds.length == 1
        list.errors == []
        list.output.includes(shipmentIds[0])
        list.output.includes("Ziddleman")
        !list.output.includes("New receipt")
        receiverList.output.includes("New receipt")
    }
})

feature("ReceiptDetail shows the lines and receipts, with Receive for a receiver only", {
    when() {
        const shipmentId = receiptOf(orderId)
        return {
            receiver: asUser("warehouse.receive", () => page("Receiving/ReceiptDetail", {shipmentId}, "html")),
            reader: asUser("warehouse.read", () => page("Receiving/ReceiptDetail", {shipmentId}, "html")),
            other: asUser("warehouse.read", () => page("Receiving/ReceiptDetail", {shipmentId: lib.ids.otherShipmentId}, "html"))
        }
    },
    then({receiver, reader, other}) {
        receiver.errors == []
        receiver.output.includes("P7 receiving fixture")
        receiver.output.includes("Finish receipt")
        receiver.output.includes("Receive all as expected")
        reader.errors == []
        reader.output.includes("P7 receiving fixture")
        !reader.output.includes("Finish receipt")
        other.output.includes("Receipt not available")
    }
})

feature("Receive posts a line with a rejected unit; a double submit answers the first; a short serial count is refused", {
    when() {
        const shipmentId = receiptOf(orderId)
        const line = {
            shipmentId,
            productId,
            operationKey: key(),
            quantityAccepted: 5,
            quantityRejected: 1,
            rejectionReasonEnumId: "ArjDamaged"
        }
        const first = asUser("warehouse.receive", () => post("Receiving/Receive/receiveLine", line))
        const again = asUser("warehouse.receive", () => post("Receiving/Receive/receiveLine", line))
        const serials = asUser("warehouse.receive", () =>
            post("Receiving/Receive/receiveLine", {
                shipmentId,
                productId: "BOSS_WH_SERIAL",
                operationKey: key(),
                quantityAccepted: 2,
                serialNumbers: "P7-SN-1"
            })
        )
        const reader = asUser("warehouse.read", () =>
            post("Receiving/Receive/receiveLine", Object.assign({}, line, {operationKey: key()}))
        )
        return {
            first,
            again,
            serials,
            reader,
            receipts: rows("mantle.product.receipt.AssetReceipt", {shipmentId, productId}),
            task: asUser("warehouse.receive", () => page("Receiving/Receive", {shipmentId, productId}, "html"))
        }
    },
    then({first, again, serials, reader, receipts, task}) {
        first == ""
        again == ""
        serials.includes("SERIAL_COUNT_MISMATCH")
        reader.includes("PERMISSION_DENIED")
        sum(receipts, "quantityAccepted") == 5
        sum(receipts, "quantityRejected") == 1
        task.errors == []
        task.output.includes("Receive P7 receiving fixture: 4")
        task.output.includes("Generate serials or lots")
    }
})

feature("Finish closes the remainder with a reason and delivers the receipt; the order is complete", {
    when() {
        const shipmentId = withAuthzOff(() =>
            asUser("warehouse.receive", () => {
                post("Receiving/Receipts/ensureReceipt", {
                    sourceType: "purchase",
                    orderPart: closeOrderId + ":01",
                    facilityId: "ZIRET_WH",
                    operationKey: key()
                })
                return receiptOf(closeOrderId)
            })
        )
        asUser("warehouse.receive", () =>
            post("Receiving/Receive/receiveLine", {shipmentId, productId, operationKey: key(), quantityAccepted: 6})
        )
        const noReason = asUser("warehouse.receive", () =>
            post("Receiving/ReceiptDetail/closeRemainder", {shipmentId, choice: "close", reason: "", operationKey: key()})
        )
        const closed = asUser("warehouse.receive", () =>
            post("Receiving/ReceiptDetail/closeRemainder", {
                shipmentId,
                choice: "close",
                reason: "Supplier short shipped",
                operationKey: key()
            })
        )
        return {
            noReason,
            closed,
            shipment: one("mantle.shipment.Shipment", {shipmentId}),
            order: one("mantle.order.OrderHeader", {orderId: closeOrderId}),
            document: asUser("warehouse.receive", () =>
                page("Receiving/ReceiptDocument", {shipmentId: receiptOf(orderId), rejectedOnly: "Y"}, "html")
            )
        }
    },
    then({noReason, closed, shipment, order, document}) {
        noReason.includes("REASON_REQUIRED")
        closed == ""
        shipment.statusId == "ShipDelivered"
        order.statusId == "OrderCompleted"
        document.errors == []
        document.output.includes("Rejected goods receipt")
        document.output.includes("Damaged")
    }
})

feature("Supplier360 in Warehouse shows the supplier's receipts and rejections with no prices; Handheld mounts Receive", {
    when() {
        return asUser("warehouse.receive", () => ({
            supplier: page("Receiving/Supplier360/Receiving", {vendorPartyId: "ZiddlemanInc"}, "html"),
            overview: page("Receiving/Supplier360", {vendorPartyId: "ZiddlemanInc"}, "html"),
            // the supplier prices tab shows nothing in Warehouse (its condition; crosscut §3.3: no price)
            prices: page("Receiving/Supplier360/Prices", {vendorPartyId: "ZiddlemanInc"}, "html"),
            handheld: page("Handheld/Receive", {}, "html"),
            handheldReceipt: page("Handheld/Receive", {shipmentId: receiptOf(orderId)}, "html"),
            scan: invoke("ironstone.warehouse.AccessServices.resolve#Scan", {
                scanText: receiptOf(orderId),
                allowedTypes: ["shipment"],
                facilityId: "ZIRET_WH"
            })
        }))
    },
    then({supplier, overview, prices, handheld, handheldReceipt, scan}) {
        supplier.errors == []
        supplier.output.includes("Rejections")
        supplier.output.includes("P7 receiving fixture")
        overview.errors == []
        overview.output.includes("Contact information")
        !prices.output.includes("Supplier offers")
        handheld.errors == []
        handheld.output.includes("Scan the receipt")
        handheldReceipt.output.includes("P7 receiving fixture")
        scan.matches.length == 1
        scan.matches[0].identityType == "shipment"
    }
})
