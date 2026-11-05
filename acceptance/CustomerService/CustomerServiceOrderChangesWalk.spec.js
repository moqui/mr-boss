// Customer Service P10's "usable when" (impl-customer-service P10, design §10 order to short pick), as an acceptance walk
// through OrderChangeDetail's transitions with artifact authorization on, Warehouse's pick services as its picker: a picker
// short-picks a line of the order awaiting pick; the agent proposes a substitute with the customer's consent, a manager
// approves and the order desk applies it (the substitute priced and reserved, the remainder cancelled, Warehouse picks it);
// a concurrent pick makes apply answer STOCK_CHANGED with the order unchanged, and the cancel of the open remainder then
// releases its reservation while a shipped line is refused; between pack and ship the package is reopened, the line
// reduced and the shipment's invoice right after it is packed again, and the demo's packed order, whose pack invoice Retail
// finalized at pack, answers BILLING_CONFLICT; a customer's cancel before approval with nothing reserved is
// applied at once only with customerImmediateCancel on; an approved price change cannot be applied here, and a stale
// proposal names the current revision; a Credit hold placed by Accounting stays when the Change hold is released. The rules
// are Mantle's OrderChanges spec. The demo orders awaiting pick and packed end approved and packed, as the foundation walk
// reads them; the walk's own orders are cancelled at the end.
// Run: ./moq accept mr-boss --spec CustomerServiceOrderChangesWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const S = "mantle.order.OrderChangeServices.",
    T = "mantle.shipment.WarehouseTaskServices."
const picker = "warehouse.pick"
const n = value => (value == null ? 0 : Number(String(value)))
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const state = {orders: []}
let keySeq = 0
const key = () => "ocw-" + Date.now() + "-" + ++keySeq
// a transition of a Customer Service screen as the user posts it: its status and errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const html = (user, path, parameters) => asUser(user, () => lib.page(path, parameters, "html"))
// a Mantle call as the user (the reads a screen makes, a warehouse task): its result and error text
function run(user, service, parameters) {
    return asUser(
        user,
        () => {
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
        },
        false
    )
}
// the newest change of an order
const latestChange = orderId =>
    rows("mantle.request.Request", {requestTypeEnumId: "RqtOrderChange", orderId}).sort((a, b) =>
        String(b.requestId).localeCompare(String(a.requestId), undefined, {numeric: true})
    )[0]
const detailOf = (user, requestId) => run(user, S + "get#OrderChange", {requestId}).change
const previewOf = (user, requestId) => run(user, S + "preview#OrderChange", {requestId}).preview
const sourceOf = (orderId, orderItemSeqId) =>
    rows("mantle.shipment.ShipmentItemSource", {orderId, orderItemSeqId}).find(row => row.statusId !== "SisCancelled")
const reserved = (orderId, orderItemSeqId) =>
    rows("mantle.product.issuance.AssetReservation", {orderId, orderItemSeqId}).reduce((sum, row) => sum + n(row.quantity), 0)
// the agent files a proposal on OrderChangeDetail, the manager approves it there: its request id
function proposeAndApprove(orderId, values) {
    const filed = post(
        users.agent,
        "Orders/OrderChangeDetail/saveChange",
        Object.assign({orderId, operationKey: key(), reason: "Walk"}, values)
    )
    const requestId = latestChange(orderId)?.requestId
    const revision = requestId ? detailOf(users.manager, requestId)?.sourceRevision : null
    const decided = post(users.manager, "Orders/OrderChangeDetail/decideChange", {
        requestId,
        sourceRevision: revision,
        decision: "approve",
        operationKey: key()
    })
    return {filed, requestId, revision, decided}
}
// the order desk applies it from OrderChangeDetail, with the preview it sees
function applyAsDesk(requestId, previewVersion) {
    const change = detailOf(users.orderDesk, requestId)
    return post(users.orderDesk, "Orders/OrderChangeDetail/applyChange", {
        requestId,
        sourceRevision: change.sourceRevision,
        expectedOrderRevision: change.expectedOrderRevision,
        previewVersion: previewVersion || previewOf(users.orderDesk, requestId).previewVersion,
        confirmed: "Y",
        operationKey: key()
    })
}
// a sales order of Retail for a customer, placed (reserving at approval when asked) and approved unless told not to
function walkOrder(customerPartyId, quantity, options = {}) {
    return system(() => {
        const created = invoke("mantle.order.OrderServices.create#Order", {
            vendorPartyId: ids.organizationId,
            customerPartyId,
            currencyUomId: "USD",
            facilityId: "ZIRET_WH"
        })
        invoke("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId: created.orderId,
            orderPartSeqId: created.orderPartSeqId,
            productId: ids.filterProductId,
            quantity,
            unitAmount: 15
        })
        if (options.reserveAtApproval)
            invoke("update#mantle.order.OrderPart", {
                orderId: created.orderId,
                orderPartSeqId: created.orderPartSeqId,
                reservationAutoEnumId: "AsResAutoApproved"
            })
        invoke("mantle.order.OrderServices.place#Order", {orderId: created.orderId})
        if (options.approve !== false) invoke("mantle.order.OrderServices.approve#Order", {orderId: created.orderId})
        state.orders.push(created.orderId)
        return created.orderId
    })
}

spec({
    cleanupSpec() {
        system(() => {
            for (const orderId of state.orders) {
                for (const hold of Array.from(ec.entity.find("mantle.order.OrderHoldReason").condition({orderId}).list()).filter(
                    row => !row.releasedDate
                ))
                    invoke("update#mantle.order.OrderHoldReason", {
                        orderHoldReasonId: hold.orderHoldReasonId,
                        releasedDate: ec.user.nowTimestamp,
                        releaseComment: "Walk cleanup"
                    })
                const order = ec.entity.find("mantle.order.OrderHeader").condition({orderId}).one()
                if (order && !["OrderCancelled", "OrderCompleted"].includes(order.statusId)) {
                    ec.message.pushErrors()
                    try {
                        ec.service.sync().name("mantle.order.OrderServices.cancel#Order").parameters({orderId}).call()
                    } finally {
                        ec.message.clearErrors()
                        ec.message.popErrors()
                    }
                }
            }
        })
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a short pick of the order awaiting pick is substituted with consent, approved by a manager and applied by the order desk",
    {
        when() {
            const orderId = ids.pickOrderId
            const shipment = system(() =>
                invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {orderId, orderPartSeqId: "01"})
            )
            state.pickShipmentId = shipment.shipmentId
            const short = run(picker, T + "record#ShortPick", {
                operationKey: key(),
                shipmentId: shipment.shipmentId,
                shipmentItemSourceId: sourceOf(orderId, "01").shipmentItemSourceId,
                quantityShort: 1,
                assetId: "BOSS_CS_FILTER_A",
                reasonEnumId: "SprNotFound",
                resolutionEnumId: "SpresSubstitute",
                requestRecount: "N"
            })
            const exceptionId = short.result?.exceptionId
            const proposal = html(users.agent, "Orders/OrderChangeDetail", {
                orderId,
                pickExceptionId: exceptionId,
                orderItemSeqId: "01"
            })
            const flow = proposeAndApprove(orderId, {
                orderChangeKindEnumId: "OckSubstitute",
                orderItemSeqId: "01",
                quantity: 1,
                pickExceptionId: exceptionId,
                productId: ids.substituteProductId,
                customerConsentRef: "Phone call with the buyer"
            })
            const deskView = html(users.orderDesk, "Orders/OrderChangeDetail", {requestId: flow.requestId})
            const applied = applyAsDesk(flow.requestId)
            const added = rows("mantle.order.OrderItem", {orderId}).find(row => row.productId === ids.substituteProductId)
            const addedSource = added ? sourceOf(orderId, added.orderItemSeqId) : null
            const picked = addedSource
                ? run(picker, T + "pick#ShipmentStock", {
                      operationKey: key(),
                      shipmentId: shipment.shipmentId,
                      shipmentItemSourceId: addedSource.shipmentItemSourceId,
                      quantity: 1
                  })
                : {error: "no substitute line on the shipment"}
            return {
                short,
                proposal,
                flow,
                deskView,
                applied,
                added,
                addedReserved: added ? reserved(orderId, added.orderItemSeqId) : 0,
                addedSource,
                picked,
                original: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}),
                exception: one("mantle.shipment.ShipmentPickException", {exceptionId}),
                order: one("mantle.order.OrderHeader", {orderId}),
                change: detailOf(users.orderDesk, flow.requestId)
            }
        },
        then(r) {
            r.short.error == ""
            r.proposal.errors == []
            r.proposal.output.includes("Propose a change to order")
            r.flow.filed.errors == ""
            r.flow.decided.errors == ""
            r.deskView.output.includes("Apply")
            r.applied.errors == ""
            n(r.added.unitAmount) == 16
            r.addedReserved == 1
            r.addedSource.shipmentId == state.pickShipmentId
            r.picked.error == ""
            n(r.original.quantity) == 3
            n(r.original.quantityCancelled) == 1
            r.exception.resolutionEnumId == "SpresSubstitute"
            r.order.statusId == "OrderApproved"
            r.change.state == "applied"
            r.change.orderContentId != null
        }
    }
)

feature(
    "a concurrent pick makes apply answer STOCK_CHANGED with the order unchanged; the open remainder's cancel then releases it",
    {
        when() {
            const orderId = ids.pickOrderId
            const flow = proposeAndApprove(orderId, {orderChangeKindEnumId: "OckCancel", orderItemSeqId: "01", quantity: 1})
            const preview = previewOf(users.orderDesk, flow.requestId)
            const picked = run(picker, T + "pick#ShipmentStock", {
                operationKey: key(),
                shipmentId: state.pickShipmentId,
                shipmentItemSourceId: sourceOf(orderId, "01").shipmentItemSourceId,
                quantity: 1
            })
            const before = {
                item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}),
                reserved: reserved(orderId, "01")
            }
            const stale = applyAsDesk(flow.requestId, preview.previewVersion)
            const unchanged = {
                item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}),
                reserved: reserved(orderId, "01")
            }
            const applied = applyAsDesk(flow.requestId)
            const shipped = asUser(
                users.agent,
                () =>
                    refusal(S + "save#OrderChange", {
                        orderId: ids.deliveredOrderId,
                        orderChangeKindEnumId: "OckCancel",
                        lines: [{orderItemSeqId: "01", quantity: 1}]
                    }),
                false
            )
            return {
                picked,
                before,
                stale,
                unchanged,
                applied,
                shipped,
                after: {item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}), reserved: reserved(orderId, "01")}
            }
        },
        then({picked, before, stale, unchanged, applied, shipped, after}) {
            picked.error == ""
            stale.errors.includes("STOCK_CHANGED")
            n(unchanged.item.quantity) == n(before.item.quantity)
            unchanged.reserved == before.reserved
            applied.errors == ""
            n(after.item.quantity) == n(before.item.quantity) - 1
            after.reserved == n(after.item.quantity)
            shipped.includes("ALREADY_SHIPPED")
        }
    }
)

feature(
    "between pack and ship the package is reopened, the line reduced and the invoice right after; a final pack invoice refuses",
    {
        when() {
            const invoicesOf = orderId =>
                [...new Set(rows("mantle.order.OrderItemBilling", {orderId}).map(row => row.invoiceId))]
                    .map(invoiceId => one("mantle.account.invoice.Invoice", {invoiceId}))
                    .filter(invoice => invoice.statusId !== "InvoiceCancelled")
            // the demo's packed order: Retail finalizes its pack invoice at pack, so the package stays closed and the cancel is
            // refused when it is filed
            const demo = ids.packedOrderId
            const demoFiled = post(users.agent, "Orders/OrderChangeDetail/saveChange", {
                orderId: demo,
                orderChangeKindEnumId: "OckCancel",
                orderItemSeqId: "01",
                quantity: 1,
                operationKey: key()
            })
            const demoAfter = {
                item: one("mantle.order.OrderItem", {orderId: demo, orderItemSeqId: "01"}),
                shipment: one("mantle.shipment.Shipment", {shipmentId: sourceOf(demo, "01").shipmentId}),
                changes: latestChange(demo)
            }
            // an order packed while the company finalizes its sales invoices at ship (D3), as finance administration sets it
            const orderId = walkOrder(ids.companyCustomerId, 3)
            const preference = one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId: "ORG_ZIZI_CORP"})
            const shipment = system(() => {
                const made = invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {orderId, orderPartSeqId: "01"})
                invoke("mantle.shipment.ShipmentServices.pack#ShipmentProduct", {
                    shipmentId: made.shipmentId,
                    shipmentPackageSeqId: made.shipmentPackageSeqId,
                    productId: ids.filterProductId,
                    quantity: 3
                })
                invoke("update#mantle.ledger.config.PartyAcctgPreference", {
                    organizationPartyId: "ORG_ZIZI_CORP",
                    salesInvoiceFinalizedAtShip: "Y"
                })
                try {
                    invoke("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: made.shipmentId})
                } finally {
                    invoke("update#mantle.ledger.config.PartyAcctgPreference", {
                        organizationPartyId: "ORG_ZIZI_CORP",
                        salesInvoiceFinalizedAtShip: preference.salesInvoiceFinalizedAtShip || "N"
                    })
                }
                return made
            })
            const packInvoices = invoicesOf(orderId)
            const flow = proposeAndApprove(orderId, {orderChangeKindEnumId: "OckCancel", orderItemSeqId: "01", quantity: 1})
            const applied = applyAsDesk(flow.requestId)
            const afterApply = {
                shipment: one("mantle.shipment.Shipment", {shipmentId: shipment.shipmentId}),
                item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}),
                invoice: one("mantle.account.invoice.Invoice", {invoiceId: packInvoices[0]?.invoiceId})
            }
            system(() => invoke("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: shipment.shipmentId}))
            return {
                demoFiled,
                demoAfter,
                packInvoices,
                applied,
                afterApply,
                repacked: invoicesOf(orderId),
                repackedShipment: one("mantle.shipment.Shipment", {shipmentId: shipment.shipmentId})
            }
        },
        then(r) {
            r.demoFiled.errors.includes("BILLING_CONFLICT")
            r.demoAfter.changes == null
            n(r.demoAfter.item.quantity) == 2
            r.demoAfter.shipment.statusId == "ShipPacked"
            r.packInvoices.length == 1
            r.packInvoices[0].statusId == "InvoiceInProcess"
            r.applied.errors == ""
            r.afterApply.shipment.statusId == "ShipPicked"
            n(r.afterApply.item.quantity) == 2
            r.afterApply.invoice.statusId == "InvoiceCancelled"
            r.repacked.length == 1
            n(r.repacked[0].invoiceTotal) == 30
            r.repackedShipment.statusId == "ShipPacked"
        }
    }
)

feature("a customer's cancel before approval with nothing reserved is applied at once only under customerImmediateCancel", {
    when() {
        const customer = "joe@public.com"
        const ask = orderId =>
            run(customer, S + "save#OrderChange", {
                orderId,
                orderChangeKindEnumId: "OckCancel",
                customerConsentRef: "Account page",
                lines: [{orderItemSeqId: "01", quantity: 1}]
            })
        const offOrder = walkOrder(ids.customerId, 1, {approve: false, reserveAtApproval: true})
        const off = ask(offOrder)
        const policy = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.request.support.ServicePolicy")
                    .condition("organizationPartyId", ids.organizationId)
                    .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                    .list()
            ).find(row => row.fromDate)
        )
        system(() =>
            invoke("update#mantle.request.support.ServicePolicy", {
                servicePolicyId: policy.servicePolicyId,
                customerImmediateCancel: "Y"
            })
        )
        let on, onOrder
        try {
            onOrder = walkOrder(ids.customerId, 1, {approve: false, reserveAtApproval: true})
            on = ask(onOrder)
        } finally {
            system(() =>
                invoke("update#mantle.request.support.ServicePolicy", {
                    servicePolicyId: policy.servicePolicyId,
                    customerImmediateCancel: policy.customerImmediateCancel || "N"
                })
            )
        }
        return {
            off,
            offStatus: one("mantle.order.OrderHeader", {orderId: offOrder}).statusId,
            on,
            onStatus: one("mantle.order.OrderHeader", {orderId: onOrder}).statusId
        }
    },
    then({off, offStatus, on, onStatus}) {
        off.error == ""
        off.stateText == "Cancellation requested"
        offStatus == "OrderPlaced"
        on.error == ""
        on.immediate == true
        onStatus == "OrderCancelled"
    }
})

feature("an approved price change is not applied here; a stale proposal names the current revision; a Credit hold stays", {
    when() {
        const orderId = walkOrder(ids.companyCustomerId, 3)
        // a price change, filed here and approved by the order's owner (Sales' decision, recorded as Sales would)
        post(users.agent, "Orders/OrderChangeDetail/saveChange", {
            orderId,
            orderChangeKindEnumId: "OckPrice",
            orderItemSeqId: "01",
            proposedUnitAmount: 12,
            reason: "Agreed discount",
            operationKey: key()
        })
        const price = latestChange(orderId)
        const priceDetail = detailOf(users.agent, price.requestId)
        system(() =>
            invoke("create#mantle.request.support.OrderChangeDecision", {
                requestId: price.requestId,
                sourceRevision: priceDetail.sourceRevision,
                orderId,
                orderRevision: priceDetail.orderRevision,
                organizationPartyId: ids.organizationId,
                decisionEnumId: "OcdApproved",
                decisionDate: ec.user.nowTimestamp,
                expireDate: new Date(Number(ec.user.nowTimestamp) + 86400000),
                reason: "Approved by Sales"
            })
        )
        const priceApply = applyAsDesk(price.requestId)
        // a stale proposal: changed after the manager read it
        post(users.agent, "Orders/OrderChangeDetail/saveChange", {
            orderId,
            orderChangeKindEnumId: "OckCancel",
            orderItemSeqId: "01",
            quantity: 1,
            operationKey: key()
        })
        const cancel = latestChange(orderId)
        const readRevision = detailOf(users.manager, cancel.requestId).sourceRevision
        post(users.agent, "Orders/OrderChangeDetail/saveChange", {
            requestId: cancel.requestId,
            orderChangeKindEnumId: "OckCancel",
            orderItemSeqId: "01",
            quantity: 2,
            operationKey: key()
        })
        const staleDecision = post(users.manager, "Orders/OrderChangeDetail/decideChange", {
            requestId: cancel.requestId,
            sourceRevision: readRevision,
            decision: "approve",
            operationKey: key()
        })
        const current = detailOf(users.manager, cancel.requestId)
        const decided = post(users.manager, "Orders/OrderChangeDetail/decideChange", {
            requestId: cancel.requestId,
            sourceRevision: current.sourceRevision,
            decision: "approve",
            operationKey: key()
        })
        // a Credit hold placed by Accounting's credit policy, then the change applied
        system(() =>
            invoke("mantle.order.OrderServices.hold#Order", {orderId, holdTypeEnumId: "OhtCredit", holdComment: "Over the limit"})
        )
        const applied = applyAsDesk(cancel.requestId)
        const holds = rows("mantle.order.OrderHoldReason", {orderId}).filter(row => !row.releasedDate)
        return {
            priceApply,
            staleDecision,
            currentRevisionText: current.revisionText,
            decided,
            applied,
            order: one("mantle.order.OrderHeader", {orderId}),
            item: one("mantle.order.OrderItem", {orderId, orderItemSeqId: "01"}),
            holds
        }
    },
    then(r) {
        r.priceApply.errors.includes("FORBIDDEN")
        r.staleDecision.errors.includes("STALE_REVISION")
        r.staleDecision.errors.includes(r.currentRevisionText)
        r.decided.errors == ""
        r.applied.errors == ""
        n(r.item.quantity) == 1
        r.order.statusId == "OrderHold"
        r.holds.length == 1
        r.holds[0].holdTypeEnumId == "OhtCredit"
    }
})
