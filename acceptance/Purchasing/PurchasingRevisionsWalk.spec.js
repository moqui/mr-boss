// Purchasing P9's "usable when" (impl-purchasing P9; design §6 OrderChanges and Acknowledgements), through the screens'
// transitions with artifact authorization on: a buyer lowers a partly received, sent purchase order's quantity: Change order
// holds it with a Change reason, OrderChanges shows the received quantity and refuses a cut below it, a receipt posted while
// the change is reviewed fails it with ReceiptInProgress and nothing changes, the applied revision adjusts the expected
// receipt and waits for its approval, the approval releases the hold and the resend stores the new revision's PDF; the order
// printed as of a time before the new revision shows the earlier revision's quantities; a supplier's phone confirmation with a
// later promised date is recorded and the requested date stays for on-time delivery; and reminders to three suppliers with
// one bad address name it and send the other two. The commitment's delta and the match re-evaluation are Mantle's
// PurchaseRevisions spec (no Retail budget or bill here). Run: ./moq accept mr-boss --spec PurchasingRevisionsWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0]
const P = "mantle.order.PurchaseServices.",
    O = "mantle.order.OrderServices."
const detailPath = "Orders/OrderDetail/"
const changesPath = "Orders/OrderChanges/"
const badSupplierId = "BOSS_PUR_WALK_BAD_ADDRESS"
const state = {}
let keySeq = 0
const key = () => "pur-rev-walk-" + Date.now() + "-" + ++keySeq
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
const revisionOf = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision)
const itemOf = orderId => one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"})
// an approved and sent order of Retail's from the supplier at a price given (not every supplier offers DEMO_1_1), through the
// Mantle services the screens call; a supplier with no valid address keeps it approved
function sentOrder(vendorPartyId, quantity, name) {
    const orderId = asUser(
        users.buyer,
        () => {
            const created = invoke(P + "create#PurchaseOrder", {
                organizationPartyId: ids.organizationId,
                vendorPartyId,
                facilityId: ids.facilityId,
                orderName: name
            }).orderId
            invoke(P + "store#PurchaseOrderItem", {
                orderId: created,
                productId: "DEMO_1_1",
                quantity,
                unitAmount: 9,
                requiredByDate: "2026-12-01"
            })
            invoke(P + "place#PurchaseOrder", {orderId: created})
            return created
        },
        false
    )
    asUser(
        users.approve,
        () => invoke(P + "decide#PurchaseApproval", {orderId, orderRevision: revisionOf(orderId), operationKey: key()}),
        false
    )
    asUser(users.buyer, () => invoke(O + "send#PurchaseOrder", {orderId, operationKey: key()}), false)
    return orderId
}
// what the change's preview answers (its basis key), as OrderChanges reads it
const preview = quantity =>
    asUser(
        users.buyer,
        () =>
            invoke(O + "preview#PurchaseRevision", {
                orderId: state.orderId,
                itemChanges: [{orderItemSeqId: "01", quantity}]
            }),
        false
    )
const receive = quantity =>
    post(users.buyReceive, "Receiving/ShipmentDetail/purchaseReceive", {
        operationKey: key(),
        shipmentId: state.shipmentId,
        productId: "DEMO_1_1",
        quantityAccepted: String(quantity),
        locationSeqId: "0901"
    })

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        system(() => {
            // a supplier of Retail's whose order address is not an address
            if (!one("mantle.party.Party", {partyId: badSupplierId})) {
                invoke("create#mantle.party.Party", {
                    partyId: badSupplierId,
                    partyTypeEnumId: "PtyOrganization",
                    ownerPartyId: ids.organizationId
                })
                invoke("create#mantle.party.Organization", {partyId: badSupplierId, organizationName: "Walk Misaddressed Supply"})
                invoke("create#mantle.party.PartyRole", {partyId: badSupplierId, roleTypeId: "Supplier"})
                invoke("create#mantle.party.contact.ContactMech", {
                    contactMechId: badSupplierId + "_EMAIL",
                    contactMechTypeEnumId: "CmtEmailAddress",
                    infoString: "orders at nowhere"
                })
                invoke("create#mantle.party.contact.PartyContactMech", {
                    partyId: badSupplierId,
                    contactMechId: badSupplierId + "_EMAIL",
                    contactMechPurposeId: "EmailOrder",
                    fromDate: "2026-01-01 00:00:00"
                })
            }
        })
        state.orderId = sentOrder(ids.sharedSupplierId, 10, "Revision walk")
        state.r1 = revisionOf(state.orderId)
        asUser(
            users.buyer,
            () =>
                invoke("mantle.shipment.WarehouseTaskServices.ensure#PurchaseReceipt", {
                    operationKey: key(),
                    orderId: state.orderId,
                    orderPartSeqId: "01"
                }),
            false
        )
        state.shipmentId = rows("mantle.shipment.ShipmentItemSource", {orderId: state.orderId})[0].shipmentId
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a buyer starts a change of the partly received, sent order: it holds with a Change reason", {
    when() {
        const received = receive(4)
        const started = post(users.buyer, detailPath + "startRevision", {
            orderId: state.orderId,
            orderRevision: String(state.r1),
            reason: "Customer cut the forecast"
        })
        const hold = rows("mantle.order.OrderHoldReason", {orderId: state.orderId}).find(row => !row.releasedDate)
        return {received, started, hold}
    },
    then({received, started, hold}) {
        received.errors == ""
        started.errors == ""
        statusOf(state.orderId) == "OrderHold"
        hold.holdTypeEnumId == "OhtChange"
        hold.holdComment == "Customer cut the forecast"
    }
})

feature("OrderChanges shows the received quantity and refuses a cut below it", {
    when() {
        const changesText = JSON.stringify({itemChanges: [{orderItemSeqId: "01", quantity: "3"}]})
        const render = asUser(users.buyer, () => page("Orders/OrderChanges", {orderId: state.orderId, changesText}, "html"))
        const refused = post(users.buyer, changesPath + "applyChange", {
            orderId: state.orderId,
            orderRevision: String(state.r1),
            changesText,
            reason: "Cut",
            operationKey: key()
        })
        return {render, refused}
    },
    then({render, refused}) {
        render.errors.length == 0
        render.output.includes("4 received; it cannot go below that")
        refused.errors.includes("QUANTITY_BELOW_RECEIVED")
        itemOf(state.orderId).quantity == 10
    }
})

feature("a receipt posted while the change is reviewed fails the revision with ReceiptInProgress, and nothing changes", {
    when() {
        const reviewed = preview(6)
        // the dock goes on receiving while the buyer reviews the change: one more unit arrives
        const raced = receive(1)
        const failed = post(users.buyer, changesPath + "applyChange", {
            orderId: state.orderId,
            orderRevision: String(state.r1),
            basisKey: reviewed.basisKey,
            changesText: JSON.stringify({itemChanges: [{orderItemSeqId: "01", quantity: "6"}]}),
            reason: "Customer cut the forecast",
            operationKey: key()
        })
        return {raced, failed}
    },
    then({raced, failed}) {
        raced.errors == ""
        failed.errors.includes("RECEIPT_IN_PROGRESS")
        itemOf(state.orderId).quantity == 10
        revisionOf(state.orderId) == state.r1
    }
})

feature(
    "the applied revision adjusts the expected receipt and waits for its approval; the approval releases the hold and the resend stores its PDF",
    {
        when() {
            const reviewed = preview(6)
            state.beforeApply = Date.now() - 1
            const applied = post(users.buyer, changesPath + "applyChange", {
                orderId: state.orderId,
                orderRevision: String(state.r1),
                basisKey: reviewed.basisKey,
                changesText: JSON.stringify({itemChanges: [{orderItemSeqId: "01", quantity: "6"}]}),
                reason: "Customer cut the forecast",
                operationKey: key()
            })
            const held = statusOf(state.orderId)
            state.r2 = revisionOf(state.orderId)
            const source = rows("mantle.shipment.ShipmentItemSource", {orderId: state.orderId})[0]
            const buyerApproves = post(users.buyer, detailPath + "approveOrder", {
                orderId: state.orderId,
                orderRevision: String(state.r2),
                operationKey: key()
            })
            const approved = post(users.approve, detailPath + "approveOrder", {
                orderId: state.orderId,
                orderRevision: String(state.r2),
                operationKey: key()
            })
            const statusApproved = statusOf(state.orderId)
            capture.clear()
            const sent = post(users.buyer, detailPath + "sendOrder", {
                orderId: state.orderId,
                orderRevision: String(state.r2),
                operationKey: key()
            })
            const issued = rows("mantle.order.OrderContent", {orderId: state.orderId}).filter(
                row => row.orderContentTypeEnumId === "OctPurchaseOrderIssued"
            )
            return {applied, held, source, buyerApproves, approved, statusApproved, sent, issued, mailed: capture.count()}
        },
        then({applied, held, source, buyerApproves, approved, statusApproved, sent, issued, mailed}) {
            applied.errors == ""
            state.r2 == state.r1 + 1
            held == "OrderHold"
            itemOf(state.orderId).quantity == 6
            source.quantity == 6
            buyerApproves.errors.includes("PERMISSION_DENIED")
            approved.errors == ""
            statusApproved == "OrderApproved"
            sent.errors == ""
            mailed == 1
            statusOf(state.orderId) == "OrderSent"
            issued.length == 2
            issued.some(row => row.description.includes("revision " + state.r2))
        }
    }
)

feature("the order printed as of a time before the new revision shows the earlier revision's quantities", {
    when() {
        const print = asOfDate =>
            asUser(users.buyer, () => invoke(O + "get#PurchaseOrderPrint", {orderId: state.orderId, asOfDate}), false)
        return {before: print(state.beforeApply), now: print(null)}
    },
    then({before, now}) {
        before.orderRevision == state.r1
        before.printHtml.includes(">10 ")
        now.orderRevision == state.r2
        now.printHtml.includes(">6 ")
        now.printHtml.includes("Changes in this revision")
    }
})

feature("a supplier's phone confirmation with a later date is recorded, and the original due date stays for on-time delivery", {
    when() {
        const required = itemOf(state.orderId).requiredByDate
        const recorded = post(users.buyer, detailPath + "recordAcknowledgement", {
            orderId: state.orderId,
            orderRevision: String(state.r2),
            otherPartyOrderId: "ZID-77120",
            acknowledgementEnumId: "PakChanged",
            promisedDate: "2026-12-12",
            acknowledgementNote: "Raw material arrives late",
            evidenceText: "Phone call with Ziddleman's order desk",
            operationKey: key()
        })
        const listed = asUser(users.buyer, () =>
            invoke("ironstone.purchasing.OrderServices.find#Acknowledgements", {appRoot: "Purchasing", view: "changed"})
        )
        return {required, recorded, listed: Array.from(listed.ackRows || []).map(row => row.orderId)}
    },
    then({required, recorded, listed}) {
        recorded.errors == ""
        itemOf(state.orderId).promisedDate != null
        itemOf(state.orderId).requiredByDate == required
        one("mantle.order.OrderPart", {orderId: state.orderId, orderPartSeqId: "01"}).acknowledgedRevision == state.r2
        listed.includes(state.orderId)
    }
})

feature("reminders to three suppliers with one bad address name it and mark the other two sent", {
    when() {
        const orderIds = [
            sentOrder(ids.sharedSupplierId, 2, "Reminder walk Ziddleman"),
            sentOrder(ids.supplierId, 2, "Reminder walk Brightline"),
            sentOrder(badSupplierId, 2, "Reminder walk misaddressed")
        ]
        capture.clear()
        const reminded = post(users.buyer, "Orders/Acknowledgements/sendReminders", {
            selectedIds: orderIds,
            note: "Please confirm"
        })
        const reminders = orderIds.map(
            orderId => rows("mantle.order.OrderEmailMessage", {orderId}).filter(row => row.reminderOccurrence).length
        )
        return {orderIds, reminded, reminders, mailed: capture.count()}
    },
    then({orderIds, reminded, reminders, mailed}) {
        reminded.errors == ""
        reminders[0] == 1
        reminders[1] == 1
        reminders[2] == 0
        mailed == 2
    }
})
