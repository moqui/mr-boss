// Sales' commercial order changes (impl-sales P14; design-sales §6 OrderChanges and OrderChangeDetail): a rep's direct order for
// Wingtip, placed and approved; the change operator files a price change of it in Sales and the sales approver decides it.
// OrderChangeDetail's one qvt render in Sales' context as the change operator shows the change with Apply, its effects (the order's
// total before and after, the tax, freight and credit) and Sales' wording; the order desk's apply is refused for the kind and a
// representative's for the permission with the same parameters, while the change operator reaches the preview's check; the change's
// one notification link now opens Sales' OrderChangeDetail for the approver (F58). The rules are Mantle's SalesOrderChanges and
// OrderChanges. Demo data: Retail East's Wingtip Traders.
// Run: ./moq test mr-boss --spec SalesOrderChanges
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const O = "mantle.order.SalesOrderServices."
const C = "mantle.order.OrderChangeServices."
const capture = ec.factory.getTool("MailCapture")
let orderId, change, shipped
// P14 review: a spec-local Sales manager of Retail East who also reads and edits receivables (no demo Sales user does), for
// InvoiceDetail's one render under Sales
const arManager = "SAL_SPEC_AR_MANAGER"

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
        // P14 review: a second order of the rep's, part shipped and invoiced, for ShipmentDetail's and InvoiceDetail's renders
        const shippedOrderId = asUser(users.rep, () =>
            lib.system(() => {
                const id = invoke(O + "create#SalesOrder", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    orderName: "Wingtip shipped shelving"
                }).orderId
                invoke(O + "store#SalesOrderLine", {
                    orderId: id,
                    orderRevision: revisionOf(id),
                    productId: "DEMO_1_1",
                    quantity: 3
                })
                invoke(O + "place#SalesOrder", {orderId: id, orderRevision: revisionOf(id)})
                return id
            })
        )
        asUser(users.approver, () =>
            lib.system(() =>
                invoke(O + "approve#SalesOrder", {
                    orderId: shippedOrderId,
                    orderRevision: revisionOf(shippedOrderId),
                    operationKey: "soc-approve-" + shippedOrderId
                })
            )
        )
        login("john.doe")
        system(() => {
            const shipment = invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
                orderId: shippedOrderId,
                orderPartSeqId: "01"
            })
            invoke("mantle.shipment.ShipmentServices.pack#ShipmentProduct", {
                shipmentId: shipment.shipmentId,
                shipmentPackageSeqId: shipment.shipmentPackageSeqId,
                productId: "DEMO_1_1",
                quantity: 1
            })
            invoke("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: shipment.shipmentId})
            invoke("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: shipment.shipmentId})
            const billing = ec.entity.find("mantle.order.OrderItemBilling").condition("orderId", shippedOrderId).list()
            shipped = {
                orderId: shippedOrderId,
                shipmentId: shipment.shipmentId,
                invoiceId: billing.size() ? billing.get(0).invoiceId : null
            }
            call("create#moqui.security.UserGroup", {userGroupId: arManager, description: "Sales spec: receivables"})
            for (const userPermissionId of ["RECEIVABLE_VIEW", "RECEIVABLE_EDIT"])
                call("create#moqui.security.UserGroupPermission", {userGroupId: arManager, userPermissionId, fromDate: 0})
            call("create#mantle.party.Party", {partyId: arManager, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: arManager, firstName: "Sales spec", lastName: "Receivables"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: arManager,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: arManager,
                username: "sales.spec.armanager",
                partyId: arManager,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_SALES", "BOSS_SALES_MANAGER", arManager])
                call("create#moqui.security.UserGroupMember", {userId: arManager, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        // the spec user's memberships end, so no later spec meets a Sales user it does not know
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", arManager)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
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
        orderDesk.error.includes("FORBIDDEN")
        rep.error.includes("PERMISSION_DENIED")
        link.includes("/Sales/Orders/OrderChangeDetail")
    }
})

// P14 review: Sales' rows of the shared ShipmentDetail and InvoiceDetail, one qvt render each (their template, SalesHandoffs.xml):
// the shipment of the rep's order read only, and the invoice for a receivables editor with Send with pay link; a rep reads no invoice
feature("ShipmentDetail and InvoiceDetail open under Sales: the shipment read only, the invoice for a receivable reader", {
    when() {
        return {
            shipped,
            shipmentPage: asUser(users.rep, () => page("Orders/ShipmentDetail", {shipmentId: shipped.shipmentId})),
            invoicePage: asUser("sales.spec.armanager", () => page("Orders/InvoiceDetail", {invoiceId: shipped.invoiceId})),
            repInvoice: attempt(users.rep, O + "check#SalesInvoice", {invoiceId: shipped.invoiceId})
        }
    },
    then({shipped, shipmentPage, invoicePage, repInvoice}) {
        shipped.invoiceId != null
        shipmentPage.errors.length == 0
        shipmentPage.output.includes("Shipment " + shipped.shipmentId)
        shipmentPage.output.includes("Items and sources")
        shipmentPage.output.includes("Order " + shipped.orderId)
        !shipmentPage.output.includes("Shipment not available")
        invoicePage.errors.length == 0
        invoicePage.output.includes("Invoice " + shipped.invoiceId)
        invoicePage.output.includes("Payments and settlement")
        invoicePage.output.includes("Send with pay link")
        !invoicePage.output.includes("Invoice not available")
        repInvoice.error.includes("RECORD_UNAVAILABLE")
    }
})
