// Purchasing P3's "usable when" (impl-purchasing P3), through the screens' transitions with artifact authorization on: a buyer
// creates a purchase order from Retail to Ziddleman at its supplier price and places it, and a line for an obsolete product is
// refused with its reason; with the approval gate on, a placed prepaid order is not auto-approved and its creator cannot
// approve it; a purchase approver approves it, and send mails the PDF to the supplier's order address, keeps it on the order
// and marks it Sent, and a second send of the revision mails no one; a buyer holds the order and only a purchase approver
// releases it, while a credit hold on another order stays; a draft service order like Manufacturing's outside-processing
// conversion is placed and approved here; and a partly received order closes its remainder with a reason, its line's
// cancelled quantity in the history, and completes. Retail's gate is turned on for the walk and off again after it.
// Run: ./moq accept mr-boss --spec PurchasingOrdersWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const one = (entity, key) => system(() => ec.entity.find(entity).condition(key).one())
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const detailPath = "Orders/OrderDetail/"
const state = {}
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
const statusOf = orderId => one("mantle.order.OrderHeader", {orderId}).statusId
const revisionOf = orderId => String(one("mantle.order.OrderHeader", {orderId}).orderRevision)
// the newest purchase order of the reference, made by the walk
const orderNamed = orderName =>
    rows("mantle.order.OrderHeader", {orderName}).sort((a, b) => Number(b.entryDate) - Number(a.entryDate))[0]?.orderId
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
                changeReason: "Purchasing orders walk: the approval gate " + (value === "Y" ? "on" : "off")
            }),
        false
    )
}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        system(() => {
            invoke("store#mantle.product.Product", {
                productId: "BOSS_PUR_WALK_OBSOLETE",
                productName: "Walk discontinued bracket",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                ownerPartyId: ids.organizationId,
                statusId: "PrdObsolete"
            })
        })
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
    "a buyer creates a purchase order from Retail to Ziddleman at its supplier price and places it; an obsolete line is refused",
    {
        when() {
            const created = post(users.buyer, "Orders/PurchaseOrders/createOrder", {
                organizationPartyId: ids.organizationId,
                vendorPartyId: ids.sharedSupplierId,
                orderName: "Walk restock"
            })
            const orderId = (state.orderId = orderNamed("Walk restock"))
            const line = post(users.buyer, detailPath + "storeLine", {orderId, productId: "DEMO_1_1", quantity: "3"})
            const obsolete = post(users.buyer, detailPath + "storeLine", {
                orderId,
                productId: "BOSS_PUR_WALK_OBSOLETE",
                quantity: "1"
            })
            const item = rows("mantle.order.OrderItem", {orderId})[0]
            const placed = post(users.buyer, detailPath + "placeOrder", {orderId})
            return {created, line, obsolete, item, placed, status: statusOf(orderId)}
        },
        then({created, line, obsolete, item, placed, status}) {
            created.errors == ""
            line.errors == ""
            item.productId == "DEMO_1_1"
            item.unitAmount == 9
            obsolete.errors.includes("Obsolete product")
            placed.errors == ""
            status == "OrderPlaced"
        }
    }
)

feature("with the approval gate on a placed prepaid order is not auto-approved and its creator cannot approve it", {
    when() {
        gate("Y")
        const created = post(users.admin, "Orders/PurchaseOrders/createOrder", {
            organizationPartyId: ids.organizationId,
            vendorPartyId: ids.sharedSupplierId,
            orderName: "Walk prepaid"
        })
        const orderId = (state.prepaidId = orderNamed("Walk prepaid"))
        post(users.admin, detailPath + "storeLine", {orderId, productId: "DEMO_1_1", quantity: "1"})
        system(() =>
            invoke("create#mantle.account.payment.Payment", {
                orderId,
                orderPartSeqId: "01",
                statusId: "PmntAuthorized",
                amount: one("mantle.order.OrderHeader", {orderId}).grandTotal,
                amountUomId: "USD",
                fromPartyId: ids.organizationId,
                toPartyId: ids.sharedSupplierId
            })
        )
        const placed = post(users.admin, detailPath + "placeOrder", {orderId})
        const self = post(users.admin, detailPath + "approveOrder", {orderId, orderRevision: revisionOf(orderId)})
        return {created, placed, self, status: statusOf(orderId)}
    },
    then({created, placed, self, status}) {
        created.errors == ""
        placed.errors == ""
        self.errors.includes("SELF_APPROVAL")
        status == "OrderPlaced"
    }
})

feature(
    "a purchase approver approves it, and send mails the PDF to the order address, keeps it and marks it Sent; a second send mails no one",
    {
        when() {
            const orderId = state.prepaidId
            const buyerApprove = post(users.buyer, detailPath + "approveOrder", {orderId, orderRevision: revisionOf(orderId)})
            const approved = post(users.approve, detailPath + "approveOrder", {orderId, orderRevision: revisionOf(orderId)})
            capture.clear()
            const sent = post(users.buyer, detailPath + "sendOrder", {
                orderId,
                orderRevision: revisionOf(orderId),
                operationKey: "walk-send-1"
            })
            const message = capture.last()
            const count = capture.count()
            const again = post(users.buyer, detailPath + "sendOrder", {
                orderId,
                orderRevision: revisionOf(orderId),
                operationKey: "walk-send-2"
            })
            const issued = rows("mantle.order.OrderContent", {orderId}).filter(
                row => row.orderContentTypeEnumId == "OctPurchaseOrderIssued"
            )
            return {
                buyerApprove,
                approved,
                sent,
                message,
                count,
                again,
                after: capture.count(),
                issued,
                status: statusOf(orderId)
            }
        },
        then({buyerApprove, approved, sent, message, count, again, after, issued, status}) {
            buyerApprove.errors != ""
            approved.errors == ""
            sent.errors == ""
            count == 1
            message.toList.includes("orders@ziddleman.example.com")
            message.attachmentNames.some(name => name.endsWith(".pdf"))
            again.errors == ""
            after == count
            issued.length == 1
            status == "OrderSent"
        }
    }
)

feature("a buyer holds the order and only a purchase approver releases it; a credit hold on another order stays", {
    when() {
        const orderId = state.prepaidId
        const otherHold = system(
            () =>
                invoke("create#mantle.order.OrderHoldReason", {
                    orderId: state.orderId,
                    holdTypeEnumId: "OhtCredit",
                    returnStatusId: "OrderPlaced",
                    placedDate: ec.user.nowTimestamp
                }).orderHoldReasonId
        )
        const held = post(users.buyer, detailPath + "holdOrder", {orderId, holdComment: "Price check"})
        const reason = rows("mantle.order.OrderHoldReason", {orderId}).find(row => !row.releasedDate)
        const buyerRelease = post(users.buyer, detailPath + "releaseHold", {
            orderId,
            orderHoldReasonId: reason?.orderHoldReasonId,
            releaseComment: "Done"
        })
        const released = post(users.approve, detailPath + "releaseHold", {
            orderId,
            orderHoldReasonId: reason?.orderHoldReasonId,
            releaseComment: "Price confirmed"
        })
        const other = one("mantle.order.OrderHoldReason", {orderHoldReasonId: otherHold})
        system(() =>
            invoke("update#mantle.order.OrderHoldReason", {orderHoldReasonId: otherHold, releasedDate: ec.user.nowTimestamp})
        )
        return {held, reason, buyerRelease, released, other, status: statusOf(orderId)}
    },
    then({held, reason, buyerRelease, released, other, status}) {
        held.errors == ""
        reason.holdTypeEnumId == "OhtPurchase"
        buyerRelease.errors != ""
        released.errors == ""
        status == "OrderApproved"
        other.releasedDate == null
    }
})

feature("a draft service order like Manufacturing's outside-processing conversion is placed and approved here", {
    when() {
        gate("N")
        const orderId = "BOSS_PUR_WALK_SVC_PO"
        system(() => {
            invoke("store#mantle.order.OrderHeader", {
                orderId,
                orderName: "Walk outside coating",
                statusId: "OrderOpen",
                currencyUomId: "USD",
                entryDate: ec.user.nowTimestamp
            })
            invoke("store#mantle.order.OrderPart", {
                orderId,
                orderPartSeqId: "01",
                statusId: "OrderOpen",
                vendorPartyId: ids.sharedSupplierId,
                customerPartyId: ids.organizationId,
                facilityId: ids.facilityId
            })
            invoke("create#mantle.order.OrderItem", {
                orderId,
                orderItemSeqId: "01",
                orderPartSeqId: "01",
                itemTypeEnumId: "ItemProduct",
                productId: "BOSS_WH_COATING",
                itemDescription: "Coat 2 filters",
                quantity: 2,
                unitAmount: 3
            })
        })
        const detail = asUser(users.buyer, () => lib.page(detailPath.slice(0, -1), {orderId}, "html"))
        const placed = post(users.buyer, detailPath + "placeOrder", {orderId})
        const approved = post(users.approve, detailPath + "approveOrder", {orderId, orderRevision: revisionOf(orderId)})
        return {detail, placed, approved, status: statusOf(orderId)}
    },
    then({detail, placed, approved, status}) {
        detail.errors == []
        detail.output.includes("Walk outside coating")
        placed.errors == ""
        approved.errors == ""
        status == "OrderApproved"
    }
})

feature(
    "a partly received order closes its remainder with a reason, records the cancelled quantity in its history and completes",
    {
        when() {
            const orderId = state.orderId
            const approved = post(users.approve, detailPath + "approveOrder", {orderId, orderRevision: revisionOf(orderId)})
            system(() => {
                const shipment = invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
                    orderId,
                    orderPartSeqId: "01",
                    destinationFacilityId: ids.facilityId
                })
                invoke("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: shipment.shipmentId})
                invoke("mantle.shipment.ShipmentServices.receive#ShipmentProduct", {
                    shipmentId: shipment.shipmentId,
                    productId: "DEMO_1_1",
                    quantityAccepted: 1,
                    facilityId: ids.facilityId
                })
            })
            const noReason = post(users.buyer, detailPath + "closeRemainder", {orderId})
            const closed = post(users.buyer, detailPath + "closeRemainder", {orderId, reason: "Supplier short; buying elsewhere"})
            const item = rows("mantle.order.OrderItem", {orderId})[0]
            const history = asUser(users.buyer, () =>
                invoke("ironstone.purchasing.OrderServices.get#OrderDetail", {appRoot: "Purchasing", orderId})
            ).purchaseOrder.historyRows
            return {approved, noReason, closed, item, history, status: statusOf(orderId)}
        },
        then({approved, noReason, closed, item, history, status}) {
            approved.errors == ""
            noReason.errors != ""
            closed.errors == ""
            item.quantityCancelled == 2
            history.some(row => row.whatText == "Line 01 Cancelled" && Number(row.toText) == 2)
            status == "OrderCompleted"
        }
    }
)
