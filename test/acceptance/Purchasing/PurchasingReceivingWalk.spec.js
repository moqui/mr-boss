// Purchasing P5's "usable when" (impl-purchasing P5; design §14.4 #1, the receipt), through the screens' transitions with
// artifact authorization on: an expected receipt (ASN) for a purchase order part asked twice opens the same receipt; a buyer
// without Warehouse's receive group cannot receive on it, and one with it receives 8 of 10 from Purchasing's mount into
// quarantine; Warehouse's inspector accepts 7 and rejects 1; Receipts shows 10 ordered, 8 received, 7 accepted, 1 rejected
// and 8 held until the disposition releases them, and the inspection reads under Purchasing; a receipt past its due date
// raises the late-receipt notice to the organization's buyers. The walk's product needs inspection (its tracking policy) and
// its order is due three days ago.
// Run: ./moq accept mr-boss --spec PurchasingReceivingWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const product = {productId: "BOSS_PUR_WALK_INSPECTED", productName: "Walk inspected gasket"}
const P = "mantle.order.PurchaseServices.",
    Q = "mantle.product.QualityServices."
const state = {}
let keySeq = 0
const key = () => "pur-rcv-walk-" + Date.now() + "-" + ++keySeq
// a transition of a Purchasing screen as the user posts it: its status and errors
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
const receiptIds = orderId =>
    [...new Set(rows("mantle.shipment.ShipmentItemSource", {orderId}).map(row => row.shipmentId))].filter(
        shipmentId => rows("mantle.shipment.Shipment", {shipmentId})[0]?.statusId !== "ShipCancelled"
    )

spec({
    stepwise: true,
    setupSpec() {
        lib.replenishmentFixture(product)
        system(() => {
            // the product's receipts need inspection at Retail's facilities (a tracking policy of its own)
            if (
                !rows("mantle.facility.WarehousePolicy", {organizationPartyId: ids.organizationId, productId: product.productId})
                    .length
            )
                invoke("create#mantle.facility.WarehousePolicy", {
                    organizationPartyId: ids.organizationId,
                    policyType: "tracking",
                    facilityId: "_NA_",
                    productId: product.productId,
                    fromDate: "2026-01-01 00:00:00",
                    inspectionRequired: "Y",
                    changeReason: "Purchasing receiving walk: inspect on receipt"
                })
        })
        // an approved purchase order of ten, due three days ago, made through the Mantle services the screens call
        state.orderId = asUser(
            users.buyer,
            () => {
                const orderId = invoke(P + "create#PurchaseOrder", {
                    organizationPartyId: ids.organizationId,
                    vendorPartyId: ids.sharedSupplierId,
                    facilityId: ids.facilityId,
                    orderName: "Receiving walk"
                }).orderId
                invoke(P + "store#PurchaseOrderItem", {
                    orderId,
                    productId: product.productId,
                    quantity: 10,
                    requiredByDate: new Date(Date.now() - 3 * 86400000)
                })
                invoke(P + "place#PurchaseOrder", {orderId})
                return orderId
            },
            false
        )
        asUser(
            users.approve,
            () => {
                const orderRevision = rows("mantle.order.OrderHeader", {orderId: state.orderId})[0].orderRevision
                invoke(P + "decide#PurchaseApproval", {orderId: state.orderId, orderRevision, operationKey: key()})
            },
            false
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("an expected receipt (ASN) for a purchase order part asked twice opens the same receipt", {
    when() {
        const part = state.orderId + ":01"
        const first = post(users.buyer, "Receiving/Receipts/prepareReceipt", {orderPart: part, operationKey: key()})
        const second = post(users.buyer, "Receiving/Receipts/prepareReceipt", {orderPart: part, operationKey: key()})
        const receipts = receiptIds(state.orderId)
        state.shipmentId = receipts[0]
        return {first, second, receipts, status: rows("mantle.order.OrderHeader", {orderId: state.orderId})[0].statusId}
    },
    then({first, second, receipts, status}) {
        status == "OrderApproved"
        first.errors == ""
        second.errors == ""
        receipts.length == 1
    }
})

feature("a buyer without the receive group cannot receive; one with it receives 8 of 10 into quarantine from Purchasing", {
    when() {
        const line = {shipmentId: state.shipmentId, productId: product.productId, quantityAccepted: "8", locationSeqId: "0901"}
        const path = "Receiving/ShipmentDetail/purchaseReceive"
        const buyer = post(users.buyer, path, Object.assign({operationKey: key()}, line))
        const received = post(users.buyReceive, path, Object.assign({operationKey: key()}, line))
        const receipts = rows("mantle.product.receipt.AssetReceipt", {orderId: state.orderId})
        const asset = receipts.length ? rows("mantle.product.asset.Asset", {assetId: receipts[0].assetId})[0] : {}
        const inspections = rows("mantle.product.quality.QualityInspection", {orderId: state.orderId})
        state.qualityInspectionId = inspections[0]?.qualityInspectionId
        return {buyer, received, receipts, asset, inspections}
    },
    then({buyer, received, receipts, asset, inspections}) {
        buyer.errors.includes("PERMISSION_DENIED")
        received.errors == ""
        receipts.length == 1
        String(receipts[0].quantityAccepted) == "8"
        asset.statusId == "AstQuarantine"
        inspections.length == 1
        String(inspections[0].heldQuantity) == "8"
    }
})

feature("the inspector accepts 7 and rejects 1; Receipts shows 10, 8 received, 7 accepted, 1 rejected and 8 held", {
    when() {
        const submitted = asUser(
            "warehouse.inspect",
            () =>
                invoke(Q + "submit#Inspection", {
                    qualityInspectionId: state.qualityInspectionId,
                    quantityAccepted: 7,
                    quantityRejected: 1,
                    resultReason: "One gasket torn"
                }),
            false
        )
        const found = asUser(users.buyer, () =>
            invoke("ironstone.purchasing.ReceiptServices.find#ExpectedReceipts", {
                appRoot: "Purchasing",
                orderId: state.orderId,
                view: "all"
            })
        )
        const inspection = asUser(users.buyer, () =>
            page("Receiving/QualityInspection", {qualityInspectionId: state.qualityInspectionId}, "html")
        )
        return {submitted, line: found.receiptRows[0] || {}, inspection}
    },
    then({submitted, line, inspection}) {
        submitted.statusId == "QiSubmitted"
        line.expectedQuantity == "10"
        line.receivedQuantity == "8"
        line.acceptedQuantity == "7"
        line.rejectedQuantity == "1"
        line.heldQuantity == "8"
        line.remainingQuantity == "2"
        line.stateText == "Late"
        inspection.status == 200
        inspection.errors == []
        inspection.output.includes(product.productName)
        inspection.output.includes("8 held")
        inspection.output.includes("Open the purchase order")
        !inspection.output.includes("Submit result")
    }
})

feature("the held quantity stays until the disposition releases the accepted units and scraps the rejected one", {
    when() {
        const quality = (service, parameters) => asUser("warehouse.quality", () => invoke(Q + service, parameters), false)
        quality("verify#Inspection", {qualityInspectionId: state.qualityInspectionId})
        quality("dispose#Inspection", {
            operationKey: key(),
            qualityInspectionId: state.qualityInspectionId,
            dispositionEnumId: "QdRelease",
            quantity: 7
        })
        quality("dispose#Inspection", {
            operationKey: key(),
            qualityInspectionId: state.qualityInspectionId,
            dispositionEnumId: "QdScrap",
            quantity: 1,
            reason: "Torn"
        })
        const found = asUser(users.read, () =>
            invoke("ironstone.purchasing.ReceiptServices.find#ExpectedReceipts", {
                appRoot: "Purchasing",
                orderId: state.orderId,
                view: "all"
            })
        )
        return {
            line: found.receiptRows[0] || {},
            status: rows("mantle.product.quality.QualityInspection", {qualityInspectionId: state.qualityInspectionId})[0]
                ?.statusId
        }
    },
    then({line, status}) {
        status == "QiDisposed"
        line.acceptedQuantity == "7"
        line.rejectedQuantity == "1"
        line.heldQuantity == "0"
    }
})

feature("a receipt past its due date raises the late-receipt notice to the organization's buyers", {
    when() {
        const out = system(() =>
            invoke("mantle.order.PurchaseReceiptServices.notify#LateReceipts", {organizationPartyId: ids.organizationId})
        )
        const notices = rows("moqui.security.user.NotificationMessage", {
            topic: "PurchaseLateReceipt",
            recordEntityName: "mantle.order.OrderHeader",
            recordId: state.orderId
        })
        const recipients = notices.length
            ? rows("moqui.security.user.NotificationMessageUser", {notificationMessageId: notices[0].notificationMessageId}).map(
                  row => row.userId
              )
            : []
        return {out, notices, recipients}
    },
    then({out, notices, recipients}) {
        out.lateCount >= 1
        notices.length == 1
        JSON.parse(notices[0].messageJson).lines[0].remaining == "2"
        recipients.includes("BOSS_PUR_BUYER")
        recipients.includes("BOSS_PUR_RECEIVE")
        !recipients.includes("BOSS_PUR_READ")
    }
})
