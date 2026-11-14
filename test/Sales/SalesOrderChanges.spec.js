// Sales' commercial order changes (impl-sales P14; design-sales §6 OrderChanges and OrderChangeDetail): a rep's direct order for
// Wingtip, placed and approved; the change operator files a price change of it in Sales and the sales approver decides it.
// OrderChangeDetail's one qvt render in Sales' context as the change operator shows the change with Apply, its effects (the order's
// total before and after, the tax, freight and credit) and Sales' wording; the order desk's apply is refused for the kind and a
// representative's for the permission with the same parameters, while the change operator reaches the preview's check; the change's
// one notification link now opens Sales' OrderChangeDetail for the approver (F58). The rules are Mantle's SalesOrderChanges and
// OrderChanges. Demo data: Retail East's Wingtip Traders.
// Run: ./moq test mr-boss --spec SalesOrderChanges
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const O = "mantle.order.SalesOrderServices."
const C = "mantle.order.OrderChangeServices."
const capture = ec.factory.getTool("MailCapture")
let orderId, change

// a call as a user, its result or its error text
function attempt(user, service, parameters) {
    return asUser(user, () =>
        lib.system(() => {
            ec.message.pushErrors()
            try {
                const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
                return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
            } catch (error) {
                return {error: String(error.message || error)}
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        })
    )
}

spec({
    setupSpec() {
        capture.enable()
        const revisionOf = id =>
            Number(ec.entity.find("mantle.order.OrderHeader").condition("orderId", id).disableAuthz().one().orderRevision)
        orderId = asUser(users.rep, () =>
            lib.system(() => {
                const id = invoke(O + "create#SalesOrder", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    orderName: "Wingtip changed shelving"
                }).orderId
                invoke(O + "store#SalesOrderLine", {
                    orderId: id,
                    orderRevision: revisionOf(id),
                    productId: "DEMO_1_1",
                    quantity: 4
                })
                invoke(O + "place#SalesOrder", {orderId: id, orderRevision: revisionOf(id)})
                return id
            })
        )
        asUser(users.approver, () =>
            lib.system(() =>
                invoke(O + "approve#SalesOrder", {
                    orderId,
                    orderRevision: revisionOf(orderId),
                    operationKey: "soc-approve-" + orderId
                })
            )
        )
        const saved = attempt(users.change, C + "save#OrderChange", {
            orderId,
            orderChangeKindEnumId: "OckPrice",
            reason: "Volume discount agreed on the phone",
            lines: [{orderItemSeqId: "01", proposedUnitAmount: 7}]
        })
        attempt(users.approver, C + "decide#OrderChange", {requestId: saved.requestId, sourceRevision: saved.sourceRevision})
        change = saved
    },
    cleanupSpec() {
        capture.reset()
    }
})

feature("OrderChangeDetail shows a commercial change in Sales with Apply and its effects; apply is the change operator's", {
    when() {
        const applyWith = user =>
            attempt(user, C + "apply#OrderChange", {
                requestId: change.requestId,
                sourceRevision: change.sourceRevision,
                previewVersion: "stale",
                confirmed: "Y",
                operationKey: "soc-apply-" + user
            })
        const link = asUser(users.approver, () =>
            lib.system(
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                        recordEntityName: "mantle.request.Request",
                        id: change.requestId
                    }).url || ""
            )
        )
        return {
            saved: change,
            detail: asUser(users.change, () => page("Orders/OrderChangeDetail", {requestId: change.requestId})),
            operator: applyWith(users.change),
            orderDesk: applyWith("customerservice.orderdesk"),
            rep: applyWith(users.rep),
            link
        }
    },
    then({saved, detail, operator, orderDesk, rep, link}) {
        saved.error == ""
        detail.errors.length == 0
        !detail.output.includes("Error rendering")
        detail.output.includes("Order change " + saved.requestId)
        detail.output.includes("Approved")
        detail.output.includes("Apply")
        detail.output.includes("Effects")
        detail.output.includes("Order total")
        detail.output.includes("does not raise the order")
        detail.output.includes("Volume discount agreed on the phone")
        // Sales' wording, not Customer Service's reminder that the owner applies it
        !detail.output.includes("The order's owner (Sales) decides and applies this kind")
        // the change operator reaches the preview's check; the order desk is refused for the kind, a rep for the permission
        operator.error.includes("STOCK_CHANGED")
        orderDesk.error.includes("FORBIDDEN") || orderDesk.error.includes("RECORD_UNAVAILABLE")
        rep.error.includes("PERMISSION_DENIED")
        link.includes("/Sales/Orders/OrderChangeDetail")
    }
})
