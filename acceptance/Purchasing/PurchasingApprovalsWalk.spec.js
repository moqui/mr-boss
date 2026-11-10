// Purchasing P4's "usable when" (impl-purchasing P4), through the screens' transitions and the notifications with artifact
// authorization on, on Retail's demo approval policy (up to $5,000 one purchase approver; from $5,000 the purchase approver
// group and then the purchasing administrator): a purchase order over the first band goes to the two approvers in sequence and
// one who may not take a step is refused; the approval waiting shows in Purchasing's Approvals and the Commons inbox alike and
// is decided from the inbox, and the inbox's decision on a superseded revision is refused naming the current one; a refused
// order is Rejected; a bulk approval of three orders with one stale names it and approves the other two; a purchase order to a
// supplier awaiting approval gets the policy's Stop and passes once the supplier is approved from Supplier360. The budget's
// Warn, Stop and the closed remainder's release are Mantle's (mr-mantle acceptance PurchaseApprovalBudgetWalk, regression
// PurchaseApprovals). Retail's unapproved-supplier rule is Stop for the walk and Warn again after it.
// Run: ./moq accept mr-boss --spec PurchasingApprovalsWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const P = "mantle.order.PurchaseServices."
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
// a placed purchase order of Retail's from Ziddleman (DEMO_1_1 at its supplier price), made by the buyer through the Mantle
// services as the screens call them
function placedOrder(name, quantity, vendorPartyId = ids.sharedSupplierId) {
    return asUser(
        users.buyer,
        () => {
            const orderId = invoke(P + "create#PurchaseOrder", {
                organizationPartyId: ids.organizationId,
                vendorPartyId,
                orderName: name
            }).orderId
            invoke(P + "store#PurchaseOrderItem", {orderId, productId: "DEMO_1_1", quantity})
            invoke(P + "place#PurchaseOrder", {orderId})
            return orderId
        },
        false
    )
}
// a key field's change of a placed order (its line's quantity), as a revision would make it
function changeLine(orderId, quantity) {
    system(() => {
        const item = Array.from(ec.entity.find("mantle.order.OrderItem").condition({orderId}).list())[0]
        invoke("mantle.order.OrderServices.update#OrderItem", {orderId, orderItemSeqId: item.orderItemSeqId, quantity})
    })
}
// the user's unread approval message of an order or supplier, as both Approvals and the Commons inbox list it
function waitingMessage(user, recordId) {
    const userId = one("moqui.security.UserAccount", {username: user}).userId
    return (
        rows("moqui.security.user.NotificationMessageByUser", {userId, recordId})
            .filter(row => !row.viewedDate && row.topic.startsWith("Purchase"))
            .sort((a, b) => Number(b.sentDate) - Number(a.sentDate))[0] || null
    )
}
function unapprovedRule(enumId) {
    const read = asUser(users.admin, () => invoke(P + "get#PurchasePolicy", {organizationPartyId: ids.organizationId}), false)
    asUser(
        users.admin,
        () =>
            invoke(P + "store#PurchasePolicy", {
                organizationPartyId: ids.organizationId,
                expectedFromDate: read.policyFromDate,
                policyGroup: "controls",
                unapprovedSupplierEnumId: enumId,
                changeReason: "Purchasing approvals walk: an unapproved supplier " + (enumId === "PusStop" ? "stops" : "warns")
            }),
        false
    )
}

spec({
    stepwise: true,
    cleanupSpec() {
        unapprovedRule("PusWarn")
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an order over the first band goes to the purchase approver and then the administrator; one who may not take a step is refused",
    {
        when() {
            const orderId = placedOrder("Approvals walk large order", 700)
            const firstWaiting = [users.approve, users.admin].map(user => !!waitingMessage(user, orderId))
            const decide = user =>
                post(user, detailPath + "approveOrder", {
                    orderId,
                    orderRevision: revisionOf(orderId),
                    operationKey: "pur-apr-walk-" + user + "-" + orderId
                })
            const adminFirst = decide(users.admin)
            const first = decide(users.approve)
            const afterFirst = statusOf(orderId)
            const secondWaiting = [users.approve, users.admin].map(user => !!waitingMessage(user, orderId))
            const approverAgain = asUser(
                users.approve,
                () => refusal(P + "decide#PurchaseApproval", {orderId, orderRevision: revisionOf(orderId)}),
                false
            )
            const second = decide(users.admin)
            return {firstWaiting, adminFirst, first, afterFirst, secondWaiting, approverAgain, second, status: statusOf(orderId)}
        },
        then(r) {
            r.firstWaiting[0] == true
            r.firstWaiting[1] == false
            r.adminFirst.errors.includes("NOT_ELIGIBLE")
            r.first.errors == ""
            r.afterFirst == "OrderPlaced"
            r.secondWaiting[0] == false
            r.secondWaiting[1] == true
            r.approverAgain.includes("NOT_ELIGIBLE")
            r.second.errors == ""
            r.status == "OrderApproved"
        }
    }
)

feature(
    "the approval waiting shows in Purchasing's Approvals and the Commons inbox and is decided from the inbox; a superseded revision's is refused naming the current one",
    {
        when() {
            const orderId = placedOrder("Approvals walk inbox order", 2)
            const message = waitingMessage(users.approve, orderId)
            const approvals = asUser(users.approve, () => lib.page("Approvals", {}, "html"))
            const inbox = asUser(users.approve, () =>
                ec.screen.makeTest().rootScreen(webroot).render("apps/Commons/Notifications", {}, null)
            )
            const decided = asUser(
                users.approve,
                () =>
                    refusal("org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                        notificationMessageId: message.notificationMessageId
                    }),
                false
            )
            const staleId = placedOrder("Approvals walk superseded order", 2)
            const staleMessage = waitingMessage(users.approve, staleId)
            changeLine(staleId, 3)
            const stale = asUser(
                users.approve,
                () =>
                    refusal("org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                        notificationMessageId: staleMessage.notificationMessageId
                    }),
                false
            )
            return {
                orderId,
                approvals,
                inboxOutput: String(inbox.output || ""),
                decided,
                status: statusOf(orderId),
                stale,
                staleRevision: revisionOf(staleId),
                staleStatus: statusOf(staleId),
                resent: !!waitingMessage(users.approve, staleId)
            }
        },
        then(r) {
            r.approvals.status == 200
            r.approvals.errors == []
            r.approvals.output.includes(r.orderId)
            r.inboxOutput.includes(r.orderId)
            r.decided == ""
            r.status == "OrderApproved"
            r.stale.includes("STALE_REVISION")
            r.stale.includes("revision " + r.staleRevision)
            r.staleStatus == "OrderPlaced"
            r.resent == true
        }
    }
)

feature("a refused purchase order is Rejected, with the reason on its decision", {
    when() {
        const orderId = placedOrder("Approvals walk refused order", 1)
        const noReason = post(users.approve, detailPath + "refuseOrder", {orderId, orderRevision: revisionOf(orderId)})
        const refused = post(users.approve, detailPath + "refuseOrder", {
            orderId,
            orderRevision: revisionOf(orderId),
            reason: "Wrong supplier for this part"
        })
        const decision = rows("mantle.order.purchase.PurchaseApprovalDecision", {sourceId: orderId})[0]
        return {noReason, refused, decision, status: statusOf(orderId), waiting: !!waitingMessage(users.approve, orderId)}
    },
    then(r) {
        r.noReason.errors.includes("REASON_REQUIRED")
        r.refused.errors == ""
        r.status == "OrderRejected"
        r.decision.decisionEnumId == "PadRefused"
        r.decision.reason == "Wrong supplier for this part"
        r.waiting == false
    }
})

feature("a bulk approval of three orders with one stale names it and approves the other two", {
    when() {
        const orderIds = ["one", "two", "three"].map(name => placedOrder("Approvals walk bulk " + name, 1))
        const reviewed = Object.fromEntries(orderIds.map(orderId => [orderId, revisionOf(orderId)]))
        changeLine(orderIds[1], 2)
        const out = asUser(users.approve, () =>
            invoke("ironstone.purchasing.OrderServices.bulk#PurchaseOrderActions", {
                appRoot: "Purchasing",
                action: "approve",
                orderIds,
                orderRevisions: reviewed
            })
        )
        return {orderIds, out, statuses: orderIds.map(statusOf)}
    },
    then({orderIds, out, statuses}) {
        out.results.find(row => row.orderId == orderIds[1]).resultCode == "STALE_REVISION"
        out.results.filter(row => row.resultCode == "DONE").length == 2
        out.summary.startsWith("2 of 3 approved")
        out.summary.includes(orderIds[1])
        statuses[0] == "OrderApproved"
        statuses[1] == "OrderPlaced"
        statuses[2] == "OrderApproved"
    }
})

feature(
    "a purchase order to a supplier awaiting approval gets the policy's Stop, and passes once the supplier is approved from Supplier360",
    {
        when() {
            unapprovedRule("PusStop")
            const created = asUser(
                users.buyer,
                () =>
                    invoke("mantle.party.SupplierServices.create#Supplier", {
                        organizationPartyId: ids.organizationId,
                        organizationName: "Approvals Walk Supplier"
                    }),
                false
            )
            const supplierPartyId = created.partyId
            const notified = !!waitingMessage(users.approve, supplierPartyId)
            const create = () =>
                asUser(
                    users.buyer,
                    () =>
                        refusal(P + "create#PurchaseOrder", {
                            organizationPartyId: ids.organizationId,
                            vendorPartyId: supplierPartyId
                        }),
                    false
                )
            const stopped = create()
            const revision = rows("mantle.party.supplier.SupplierProfile", {
                organizationPartyId: ids.organizationId,
                supplierPartyId
            }).length
            const approved = post(users.approve, "Suppliers/Supplier360/decideSupplier", {
                vendorPartyId: supplierPartyId,
                organizationPartyId: ids.organizationId,
                sourceRevision: String(revision),
                decision: "approve"
            })
            const passed = create()
            return {created, notified, stopped, approved, passed}
        },
        then(r) {
            r.created.approvalStatusId == "SupaPending"
            r.notified == true
            r.stopped.includes("SUPPLIER_UNAPPROVED")
            r.approved.errors == ""
            r.passed == ""
        }
    }
)
