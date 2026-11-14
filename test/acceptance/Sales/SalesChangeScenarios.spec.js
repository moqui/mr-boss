// Sales P14's "usable when" (impl-sales P14; design-sales §14.3 scenario 9; §6 OrderChanges, OrderChangeDetail, ShipmentDetail and
// InvoiceDetail): a price change Customer Service files is approved by sales.approver from OrderChangeDetail and applied by
// sales.change, the order's stored PDF and totals following; a change against a picked line waits with its conflict; a partly shipped
// and invoiced order's remaining quantities reconcile with its shipments and invoices, which open under Sales. Every step through
// the screens' transitions where one exists; the rules are Mantle's SalesOrderChanges and OrderChanges.
// Run: ./moq accept mr-boss --spec SalesChangeScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const C = "mantle.order.OrderChangeServices."
const O = "mantle.order.SalesOrderServices."
const capture = ec.factory.getTool("MailCapture")
const asService = (user, action) => asUser(user, () => system(action))
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const rows = (entity, values) => Array.from(ec.entity.find(entity).condition(values).disableAuthz().list())
const revisionOf = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision ?? 1)
const transition = (user, path, name, parameters) =>
    asUser(user, () => {
        const out = ec.screen
            .makeTest()
            .baseScreenPath("Sales")
            .render(path + "/" + name, parameters, "POST")
        return {errors: Array.from(out.errorMessages || []), messages: Array.from(out.messages || [])}
    })
// a rep's direct order for Wingtip, placed and approved: its id
function approvedOrder(name, quantity) {
    const orderId = asService(users.rep, () => {
        const id = invoke(O + "create#SalesOrder", {
            organizationPartyId: ids.organizationId,
            customerPartyId: ids.accounts.wingtip,
            contactPartyId: ids.contacts.dana,
            orderName: name
        }).orderId
        invoke(O + "store#SalesOrderLine", {orderId: id, orderRevision: revisionOf(id), productId: "DEMO_1_1", quantity})
        invoke(O + "place#SalesOrder", {orderId: id, orderRevision: revisionOf(id)})
        return id
    })
    asService(users.approver, () =>
        invoke(O + "approve#SalesOrder", {orderId, orderRevision: revisionOf(orderId), operationKey: "sca-" + orderId})
    )
    return orderId
}
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
    },
    cleanupSpec() {
        capture.reset()
    }
})

feature("a price change filed in Customer Service is approved in Sales and applied by the change operator", {
    when() {
        const orderId = approvedOrder("Change scenario " + run, 4)
        const before = one("mantle.order.OrderHeader", {orderId})
        const filed = asService("customerservice.orderdesk", () =>
            invoke(C + "save#OrderChange", {
                orderId,
                orderChangeKindEnumId: "OckPrice",
                reason: "Price agreed with Wingtip " + run,
                lines: [{orderItemSeqId: "01", proposedUnitAmount: 7}]
            })
        )
        const link = asService(
            users.approver,
            () =>
                invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                    recordEntityName: "mantle.request.Request",
                    id: filed.requestId
                }).url || ""
        )
        const decided = transition(users.approver, "Orders/OrderChangeDetail", "decideChange", {
            requestId: filed.requestId,
            sourceRevision: filed.sourceRevision,
            decision: "approve",
            operationKey: "sca-decide-" + run
        })
        const preview = asService(users.change, () => invoke(C + "preview#OrderChange", {requestId: filed.requestId}).preview)
        const applied = transition(users.change, "Orders/OrderChangeDetail", "applyChange", {
            requestId: filed.requestId,
            sourceRevision: filed.sourceRevision,
            expectedOrderRevision: preview.expectedOrderRevision,
            previewVersion: preview.previewVersion,
            confirmed: "Y",
            operationKey: "sca-apply-" + run
        })
        const detail = asUser(users.change, () => page("Orders/OrderChangeDetail", {requestId: filed.requestId}, "html"))
        return {
            filed,
            link,
            decided,
            applied,
            detail,
            before,
            after: one("mantle.order.OrderHeader", {orderId}),
            item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}),
            pdfs: rows("mantle.order.OrderContent", {orderId, orderContentTypeEnumId: "OctOrderChangeApplied"}),
            request: one("mantle.request.Request", {requestId: filed.requestId})
        }
    },
    then(r) {
        r.link.includes("/Sales/Orders/OrderChangeDetail")
        r.decided.errors.length == 0
        r.applied.errors.length == 0
        Number(String(r.item.unitAmount)) == 7
        Number(String(r.after.grandTotal)) < Number(String(r.before.grandTotal))
        r.pdfs.length == 1
        r.request.statusId == "ReqCompleted"
        r.after.statusId == "OrderApproved"
        r.detail.output.includes("Applied")
    }
})

feature("a change against a picked line waits with its conflict", {
    when() {
        const orderId = approvedOrder("Picked change " + run, 3)
        const shipment = system(() =>
            invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {orderId, orderPartSeqId: "01"})
        )
        const source = rows("mantle.shipment.ShipmentItemSource", {orderId, orderItemSeqId: "01"})[0]
        system(() =>
            invoke("mantle.shipment.WarehouseTaskServices.pick#ShipmentStock", {
                operationKey: "sca-pick-" + run,
                shipmentId: shipment.shipmentId,
                shipmentItemSourceId: source.shipmentItemSourceId,
                quantity: 1
            })
        )
        const filed = asService(users.change, () =>
            invoke(C + "save#OrderChange", {
                orderId,
                orderChangeKindEnumId: "OckShipDate",
                reason: "Customer asked for later delivery",
                lines: [{orderItemSeqId: "01", requiredByDate: "2031-06-01T00:00:00Z"}]
            })
        )
        asService(users.approver, () =>
            invoke(C + "decide#OrderChange", {requestId: filed.requestId, sourceRevision: filed.sourceRevision})
        )
        const preview = asService(users.change, () => invoke(C + "preview#OrderChange", {requestId: filed.requestId}).preview)
        const applied = transition(users.change, "Orders/OrderChangeDetail", "applyChange", {
            requestId: filed.requestId,
            sourceRevision: filed.sourceRevision,
            previewVersion: preview.previewVersion,
            confirmed: "Y",
            operationKey: "sca-apply-pick-" + run
        })
        return {preview, applied, item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"})}
    },
    then({preview, applied, item}) {
        preview.conflicts.some(row => row.code == "ACTIVE_PICK")
        applied.errors.some(text => text.includes("ACTIVE_PICK"))
        item.requiredByDate == null
    }
})

feature(
    "a partly shipped and invoiced order's remaining quantities reconcile with its shipments and invoices, opened under Sales",
    {
        when() {
            const orderId = approvedOrder("Part shipped " + run, 5)
            const shipment = system(() =>
                invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {orderId, orderPartSeqId: "01"})
            )
            system(() => {
                invoke("mantle.shipment.ShipmentServices.pack#ShipmentProduct", {
                    shipmentId: shipment.shipmentId,
                    shipmentPackageSeqId: shipment.shipmentPackageSeqId,
                    productId: "DEMO_1_1",
                    quantity: 2
                })
                invoke("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: shipment.shipmentId})
                invoke("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: shipment.shipmentId})
            })
            const order = asService(users.rep, () => invoke(O + "get#SalesOrder", {orderId}))
            const invoiceIds = [...new Set(rows("mantle.order.OrderItemBilling", {orderId}).map(row => row.invoiceId))]
            return {
                order,
                shipmentId: shipment.shipmentId,
                invoiceIds,
                billed: rows("mantle.order.OrderItemBilling", {orderId}).reduce(
                    (sum, row) => sum + Number(String(row.quantity)),
                    0
                ),
                shipmentPage: asUser(users.rep, () => page("Orders/ShipmentDetail", {shipmentId: shipment.shipmentId}, "html"))
            }
        },
        then(r) {
            r.order.orderFound == true
            r.order.shipments.some(row => row.shipmentId == r.shipmentId)
            r.billed == 2
            r.shipmentPage.output.includes("Shipment " + r.shipmentId)
            r.shipmentPage.output.includes("Items and sources")
            r.invoiceIds.length == 1
        }
    }
)
