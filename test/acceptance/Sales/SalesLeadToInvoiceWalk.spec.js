// Sales P20, design-sales §14.3 scenario 12 (impl-sales P20, §8): the whole walk from a lead to an invoice with each step done by a
// user holding only the grants that step needs, through the screens' transitions as the app uses them, with artifact authorization on:
// - the seller, a spec-local agent of Ziziwork Retail in BOSS_USERS and BOSS_SALES (the root user group: the root grant with its
//   organization filters, SALES_VIEW and PRODUCT_CATALOG_VIEW) and a spec-local group with SALES_OPPORTUNITY_EDIT, SALES_QUOTE_EDIT
//   and SALES_QUOTE_SEND alone (no account, order, forecast, approval or report grant, and no team), creates a lead, qualifies it on
//   Wingtip Traders with Dana Morales, records Wingtip's request for quote, makes the quote from its two lines, enters a discounted
//   price over Retail's demo discount rule and asks for approval; is refused deciding it;
// - sales.approver, the demo approver (BOSS_SALES and BOSS_SALES_APPROVE: SALES_APPROVE, SALES_ORDER_APPROVE and ORDER_APPROVE, exactly
//   the quote's and the order's approval grants; Retail's rule names BOSS_SALES_APPROVE as its approvers, so a spec-local group could
//   not decide it), approves the quote from OrderDetail;
// - the seller proposes it, sends it to Dana through QuoteSend, records Wingtip's acceptance with its PO (one placed order, through
//   place#Order) and closes the deal as won; is refused approving the order;
// - sales.approver approves the order from OrderDetail;
// - fulfillment and invoicing are their owners': warehouse.pack (BOSS_WAREHOUSE_PACK, SHIPMENT_PACK) packs and warehouse.ship
//   (BOSS_WAREHOUSE_SHIP, SHIPMENT_SHIP) ships through Mantle's shipment services (Sales only hands off, P14; the seller holds no
//   SHIPMENT_* permission), the shipment making the order's invoice by Mantle's own rule; the seller sees the shipment under Sales and
//   the billed quantities but no invoice or payment (no receivable read), and a spec-local billing reader (BOSS_SALES and a group with
//   SALES_TEAM_VIEW and RECEIVABLE_VIEW) opens the invoice in Sales' InvoiceDetail;
// - the deal and the order render in the tui render mode (the terminal alternative) for the seller.
// The 390 px phone check of this walk is a browser walk's (PASS Sales' pages, and the client sweeps), not this server walk's. The rules
// are each phase's (SalesPipelineScenarios, SalesRfqUsable, SalesApprovalUsable, SalesQuoteScenarios, SalesOrderScenarios,
// SalesChangeScenarios) and Mantle's.
// Run: ./moq accept mr-boss --spec SalesLeadToInvoiceWalk
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page, refusal} = lib
const run = String(Date.now()).slice(-6)
const capture = ec.factory.getTool("MailCapture")
const OPPORTUNITY = "mantle.sales.opportunity.SalesOpportunity"
const asService = (user, action) => asUser(user, () => system(action))
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const rows = (entity, values) => Array.from(ec.entity.find(entity).condition(values).disableAuthz().list())
const revisionOf = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision ?? 1)
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const drain = () => ec.factory.waitWorkerPoolEmpty(50)

// the walk's spec-local users and groups: the seller and the billing reader, each with only the grants named
const seller = {
    userId: "SAL_P20_SELLER",
    username: "sales.p20.seller." + run,
    groupId: "SAL_P20_SELLER_GRANTS",
    permissions: ["SALES_OPPORTUNITY_EDIT", "SALES_QUOTE_EDIT", "SALES_QUOTE_SEND"]
}
const biller = {
    userId: "SAL_P20_BILLING",
    username: "sales.p20.billing." + run,
    groupId: "SAL_P20_BILLING_GRANTS",
    permissions: ["SALES_TEAM_VIEW", "RECEIVABLE_VIEW"]
}
const packer = "warehouse.pack"
const shipper = "warehouse.ship"
// the permissions the seller must not hold: every other Sales grant and the borrowed ones (design §1.1)
const notTheSellers = [
    "SALES_ACCOUNT_EDIT",
    "SALES_ORDER_EDIT",
    "SALES_ORDER_APPROVE",
    "ORDER_APPROVE",
    "SALES_APPROVE",
    "SALES_TEAM_VIEW",
    "SALES_REPORT_VIEW",
    "SALES_FORECAST_EDIT",
    "RECEIVABLE_VIEW",
    "ACCOUNTING_VIEW",
    "PRODUCT_COST_VIEW",
    "PRICE_EDIT",
    "SHIPMENT_PICK",
    "SHIPMENT_PACK",
    "SHIPMENT_SHIP"
]
const state = {}

// a spec-local user of Retail (an agent of it) in BOSS_USERS, BOSS_SALES and their own group of the permissions given
function makeUser(spec) {
    system(() => {
        if (!one("moqui.security.UserGroup", {userGroupId: spec.groupId}))
            call("create#moqui.security.UserGroup", {userGroupId: spec.groupId, description: "Sales P20 walk: " + spec.username})
        for (const userPermissionId of spec.permissions)
            if (!one("moqui.security.UserGroupPermission", {userGroupId: spec.groupId, userPermissionId}))
                call("create#moqui.security.UserGroupPermission", {userGroupId: spec.groupId, userPermissionId, fromDate: 0})
        if (!one("mantle.party.Party", {partyId: spec.userId})) {
            call("create#mantle.party.Party", {partyId: spec.userId, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: spec.userId, firstName: "Sales P20", lastName: spec.groupId})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: spec.userId,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
        }
        const account = one("moqui.security.UserAccount", {userId: spec.userId})
        if (account) call("update#moqui.security.UserAccount", {userId: spec.userId, username: spec.username})
        else
            call("create#moqui.security.UserAccount", {
                userId: spec.userId,
                username: spec.username,
                partyId: spec.userId,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
        for (const userGroupId of ["BOSS_USERS", "BOSS_SALES", spec.groupId])
            call("create#moqui.security.UserGroupMember", {userId: spec.userId, userGroupId, fromDate: ec.user.nowTimestamp})
    })
}
const dealRevision = salesOpportunityId =>
    asService(seller.username, () => invoke("mantle.sales.OpportunityServices.get#Opportunity", {salesOpportunityId})).opportunity
        .revision
const rfqOf = requestId =>
    asService(seller.username, () => invoke("mantle.order.SalesQuoteServices.get#QuoteRequest", {requestId}))
const quoteOf = orderId => asService(seller.username, () => invoke("mantle.order.SalesQuoteServices.get#Quote", {orderId}))

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
        makeUser(seller)
        makeUser(biller)
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        // the spec users' memberships end, so no later spec meets a Sales user it does not know
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", "in", [seller.userId, biller.userId])
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("the seller holds only the walk's grants: a representative's capabilities less accounts, orders and forecasts", {
    when() {
        const context = asUser(seller.username, () => invoke("ironstone.sales.ContextServices.get#SharedContext", {}))
        const held = asUser(seller.username, () => notTheSellers.filter(permission => ec.user.hasPermission(permission)))
        const billing = asUser(biller.username, () => invoke("ironstone.sales.ContextServices.get#SharedContext", {}))
        return {context, held, billing}
    },
    then({context, held, billing}) {
        context.capabilities.read == true
        context.capabilities.opportunityEdit == true
        context.capabilities.quoteEdit == true
        context.capabilities.quoteSend == true
        context.capabilities.orderEdit == false
        context.capabilities.accountEdit == false
        context.capabilities.approve == false
        context.capabilities.orderApprove == false
        context.capabilities.teamRead == false
        context.capabilities.financeRead == false
        context.organizationPartyIds.includes(ids.organizationId)
        !context.organizationPartyIds.includes(ids.otherOrganizationId)
        held == []
        billing.capabilities.teamRead == true
        billing.capabilities.financeRead == true
        billing.capabilities.quoteEdit == false
    }
})

feature("the seller creates a lead and qualifies it on Wingtip Traders with Dana Morales: one deal, the seller its owner", {
    when() {
        const name = "P20 walk lead " + run
        const created = asUser(seller.username, () =>
            page(
                "Pipeline/Leads/createOpportunity",
                {typeEnumId: "SotLead", organizationPartyId: ids.organizationId, opportunityName: name},
                "html"
            )
        )
        const leadId = (state.dealId = system(() => one(OPPORTUNITY, {opportunityName: name})?.salesOpportunityId))
        const qualified = asUser(seller.username, () =>
            page(
                "Pipeline/OpportunityDetail/qualifyLead",
                {
                    salesOpportunityId: leadId,
                    expectedRevision: dealRevision(leadId),
                    accountPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana
                },
                "html"
            )
        )
        const detail = asUser(seller.username, () => page("Pipeline/OpportunityDetail", {salesOpportunityId: leadId}, "html"))
        const owners = rows("mantle.sales.opportunity.SalesOpportunityParty", {
            salesOpportunityId: leadId || "-",
            roleTypeId: "SalesRepresentative"
        }).map(row => row.partyId)
        return {created, leadId, qualified, deal: one(OPPORTUNITY, {salesOpportunityId: leadId || "-"}), detail, owners}
    },
    then({created, leadId, qualified, deal, detail, owners}) {
        created.errors.length == 0
        leadId != null
        qualified.errors.length == 0
        deal.typeEnumId == "SotOpportunity"
        deal.accountPartyId == ids.accounts.wingtip
        deal.organizationPartyId == ids.organizationId
        owners.includes(seller.userId)
        opened(detail)
        detail.output.includes("Dana Morales")
    }
})

feature("the seller records Wingtip's request for quote with two lines and makes the quote from them", {
    when() {
        const name = "P20 walk RFQ " + run
        const made = asUser(seller.username, () =>
            page(
                "Quotes/QuoteRequests/createQuoteRequest",
                {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    requestName: name,
                    description: "Shelving for the refit, phoned in"
                },
                "html"
            )
        )
        const requestId = (state.requestId = asService(seller.username, () =>
            Array.from(invoke("mantle.order.SalesQuoteServices.find#QuoteRequests", {text: name}).quoteRequestList || [])
        )[0]?.requestId)
        const add = (quantity, description) =>
            asUser(seller.username, () =>
                page(
                    "Quotes/QuoteRequestDetail/rfqStoreItem",
                    {
                        requestId,
                        requestRevision: rfqOf(requestId).quoteRequest.requestRevision,
                        productId: "DEMO_1_1",
                        quantity,
                        description
                    },
                    "html"
                )
            )
        const lines = [add("2", "Shelving units"), add("1", "Spare shelving")]
        const quoted = asUser(seller.username, () =>
            page(
                "Quotes/QuoteRequestDetail/rfqCreateQuote",
                {
                    requestId,
                    requestRevision: rfqOf(requestId).quoteRequest.requestRevision,
                    operationKey: "p20-walk-rfq-" + run,
                    requestItemSeqIdList: "01,02"
                },
                "html"
            )
        )
        const after = rfqOf(requestId)
        state.orderId = after.quotes?.[0]?.orderId
        return {
            made,
            requestId,
            lines,
            quoted,
            after,
            links: rows("mantle.request.RequestItemOrder", {requestId: requestId || "-"})
        }
    },
    then({made, requestId, lines, quoted, after, links}) {
        made.errors.length == 0
        requestId != null
        lines.every(line => line.errors.length == 0)
        quoted.errors.length == 0
        after.quotes.length == 1
        after.quoteRequest.statusId == "ReqInProgress"
        links.length == 2
    }
})

feature("a discounted price over Retail's rule waits for sales.approver, who approves it; the seller cannot decide it", {
    when() {
        const orderId = state.orderId
        const line = rows("mantle.order.OrderItem", {orderId: orderId || "-", productId: "DEMO_1_1"}).sort((a, b) =>
            String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId))
        )[0]
        // about 10 % under the line's calculated price, over the demo rule's 5 %
        const discounted = Math.floor(Number(String(line?.unitAmount ?? 0)) * 90) / 100
        const priced = asUser(seller.username, () =>
            page(
                "Orders/OrderDetail/salesStoreLine",
                {
                    orderId,
                    orderRevision: revisionOf(orderId),
                    orderItemSeqId: line?.orderItemSeqId,
                    productId: "DEMO_1_1",
                    quantity: String(line?.quantity ?? 2),
                    unitAmount: String(discounted),
                    overrideReason: "Refit volume"
                },
                "html"
            )
        )
        const needed = quoteOf(orderId).approval
        const asked = asUser(seller.username, () =>
            page("Orders/OrderDetail/salesRequestApproval", {orderId, orderRevision: needed.orderRevision}, "html")
        )
        const sellerDecides = asService(seller.username, () =>
            refusal("mantle.order.SalesApprovalServices.decide#Quote", {orderId, orderRevision: needed.orderRevision})
        )
        const sellerProposes = asService(seller.username, () =>
            refusal("mantle.order.SalesQuoteServices.propose#Quote", {orderId, orderRevision: needed.orderRevision})
        )
        const approverView = asUser(users.approver, () => page("Orders/OrderDetail", {orderId}, "html"))
        const decided = asUser(users.approver, () =>
            page(
                "Orders/OrderDetail/salesDecideQuote",
                {
                    orderId,
                    orderRevision: quoteOf(orderId).approval.orderRevision,
                    decision: "approve",
                    operationKey: "p20-walk-decide-" + run
                },
                "html"
            )
        )
        return {priced, needed, asked, sellerDecides, sellerProposes, approverView, decided, after: quoteOf(orderId).approval}
    },
    then({priced, needed, asked, sellerDecides, sellerProposes, approverView, decided, after}) {
        priced.errors.length == 0
        needed.needsApproval == true
        Array.from(needed.requirements).some(row => row.ruleTypeEnumId == "SarDiscount")
        asked.errors.length == 0
        sellerDecides.includes("PERMISSION_DENIED")
        sellerProposes.includes("APPROVAL_REQUIRED")
        opened(approverView)
        decided.errors.length == 0
        after.approved == true
    }
})

feature("the seller proposes and sends the quote to Dana, records Wingtip's acceptance and closes the deal won", {
    when() {
        const orderId = state.orderId
        const proposed = asUser(seller.username, () =>
            page("Orders/OrderDetail/salesProposeQuote", {orderId, orderRevision: revisionOf(orderId)}, "html")
        )
        capture.clear()
        const sent = asUser(seller.username, () =>
            page(
                "Orders/QuoteSend/sendQuote",
                {
                    orderId,
                    orderRevision: revisionOf(orderId),
                    recipientPartyIds: ids.contacts.dana,
                    sendMode: "organization",
                    operationKey: "p20-walk-send-" + run
                },
                "html"
            )
        )
        const issues = () =>
            asService(seller.username, () => invoke("mantle.order.SalesQuoteIssueServices.get#QuoteIssues", {orderId}))
        const issueId = issues().standingIssueId
        if (issueId) system(() => invoke("mantle.order.SalesQuoteIssueServices.attempt#QuoteDeliveries", {issueId}))
        drain()
        const accepted = asUser(seller.username, () =>
            page(
                "Orders/OrderDetail/salesRespondQuote",
                {
                    orderId,
                    issueId,
                    responseType: "accept",
                    contactPartyId: ids.contacts.dana,
                    otherPartyOrderId: "WT-P20-" + run,
                    operationKey: "p20-walk-accept-" + run
                },
                "html"
            )
        )
        const won = asUser(seller.username, () =>
            page(
                "Pipeline/OpportunityDetail/closeOpportunity",
                {salesOpportunityId: state.dealId, expectedRevision: dealRevision(state.dealId), statusId: "SalesOppWon"},
                "html"
            )
        )
        return {
            proposed,
            sent,
            mails: capture.getMessages(),
            issues: issues(),
            accepted,
            order: one("mantle.order.OrderHeader", {orderId}),
            part: one("mantle.order.OrderPart", {orderId, orderPartSeqId: "01"}),
            won,
            deal: one(OPPORTUNITY, {salesOpportunityId: state.dealId})
        }
    },
    then({proposed, sent, mails, issues, accepted, order, part, won, deal}) {
        proposed.errors.length == 0
        sent.errors.length == 0
        mails.length >= 1
        issues.issues.length == 1
        accepted.errors.length == 0
        issues.issues[0].state == "accepted"
        order.statusId == "OrderPlaced"
        // the accepted quote is the order, placed, its purpose kept (Mantle's SalesAccess: "OrpSalesQuote once placed")
        order.orderPurposeEnumId == "OrpSalesQuote"
        part.otherPartyOrderId == "WT-P20-" + run
        won.errors.length == 0
        deal.statusId == "SalesOppWon"
    }
})

feature("the seller is refused approving the placed order; sales.approver approves it from OrderDetail", {
    when() {
        const orderId = state.orderId
        const sellerApproves = asService(seller.username, () =>
            refusal("mantle.order.SalesOrderServices.approve#SalesOrder", {
                orderId,
                orderRevision: revisionOf(orderId),
                operationKey: "p20-walk-seller-approve-" + run
            })
        )
        const awaiting = asService(users.approver, () =>
            Array.from(
                invoke("mantle.sales.SalesWorkspaceServices.find#SalesOrders", {text: orderId, list: "awaiting"}).orderList || []
            ).map(row => row.orderId)
        )
        const approved = asUser(users.approver, () =>
            page(
                "Orders/OrderDetail/salesApproveOrder",
                {orderId, orderRevision: revisionOf(orderId), operationKey: "p20-walk-approve-" + run},
                "html"
            )
        )
        return {sellerApproves, awaiting, approved, statusId: one("mantle.order.OrderHeader", {orderId}).statusId}
    },
    then({sellerApproves, awaiting, approved, statusId}) {
        sellerApproves.includes("PERMISSION_DENIED")
        awaiting.includes(state.orderId)
        approved.errors.length == 0
        statusId == "OrderApproved"
    }
})

feature(
    "Warehouse's users pack and ship the order, which bills it; the seller sees the shipment, the billing reader the invoice",
    {
        when() {
            const orderId = state.orderId
            // the seller holds no shipment grant: Warehouse's ship task refuses them, and nothing ships
            const made = asService(shipper, () =>
                invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {orderId, orderPartSeqId: "01"})
            )
            const sellerShips = asService(seller.username, () =>
                refusal("mantle.shipment.WarehouseTaskServices.ship#OutgoingShipment", {
                    operationKey: "p20-walk-seller-ship-" + run,
                    shipmentId: made.shipmentId
                })
            )
            const quantity = rows("mantle.order.OrderItem", {orderId, productId: "DEMO_1_1"}).reduce(
                (sum, item) => sum + Number(String(item.quantity ?? 0)),
                0
            )
            asService(packer, () => {
                invoke("mantle.shipment.ShipmentServices.pack#ShipmentProduct", {
                    shipmentId: made.shipmentId,
                    shipmentPackageSeqId: made.shipmentPackageSeqId,
                    productId: "DEMO_1_1",
                    quantity
                })
                invoke("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: made.shipmentId})
            })
            const beforeShip = one("mantle.shipment.Shipment", {shipmentId: made.shipmentId}).statusId
            asService(shipper, () => invoke("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: made.shipmentId}))
            drain()
            const invoiceIds = [...new Set(rows("mantle.order.OrderItemBilling", {orderId}).map(row => row.invoiceId))]
            state.invoiceId = invoiceIds[0]
            const sellerOrder = asService(seller.username, () =>
                invoke("mantle.order.SalesOrderServices.get#SalesOrder", {orderId})
            )
            const billingOrder = asService(biller.username, () =>
                invoke("mantle.order.SalesOrderServices.get#SalesOrder", {orderId})
            )
            return {
                made,
                sellerShips,
                beforeShip,
                shipment: one("mantle.shipment.Shipment", {shipmentId: made.shipmentId}),
                invoiceIds,
                sellerOrder,
                billingOrder,
                sellerShipment: asUser(seller.username, () =>
                    page("Orders/ShipmentDetail", {shipmentId: made.shipmentId}, "html")
                ),
                sellerInvoice: asUser(seller.username, () => page("Orders/InvoiceDetail", {invoiceId: state.invoiceId}, "html")),
                sellerInvoiceCheck: asUser(seller.username, () =>
                    refusal("ironstone.sales.ContextServices.check#Record", {recordType: "invoice", recordId: state.invoiceId})
                ),
                billingInvoice: asUser(biller.username, () => page("Orders/InvoiceDetail", {invoiceId: state.invoiceId}, "html"))
            }
        },
        then(r) {
            r.made.shipmentId != null
            r.sellerShips != ""
            r.beforeShip != "ShipShipped"
            r.shipment.statusId == "ShipShipped"
            r.invoiceIds.length == 1
            r.sellerOrder.orderFound == true
            r.sellerOrder.shipments.some(row => row.shipmentId == r.made.shipmentId)
            r.sellerOrder.lines.every(line => !line.productId || line.billedText != "")
            // no receivable read: the money stays Accounting's
            r.sellerOrder.showMoney == false
            r.sellerOrder.invoices.length == 0
            r.sellerOrder.payments.length == 0
            r.billingOrder.invoices.some(row => row.invoiceId == r.invoiceIds[0])
            opened(r.sellerShipment)
            r.sellerShipment.output.includes("Shipment " + r.made.shipmentId)
            !r.sellerInvoice.output.includes("Invoice " + r.invoiceIds[0] + " ·")
            r.sellerInvoiceCheck.includes("RECORD_UNAVAILABLE")
            opened(r.billingInvoice)
            r.billingInvoice.output.includes(r.invoiceIds[0])
        }
    }
)

feature("the deal and the order render for the seller in the tui render mode, the terminal alternative", {
    when() {
        const errorNode = output => /"t"\s*:\s*"error"/.test(output)
        const deal = asUser(seller.username, () => page("Pipeline/OpportunityDetail", {salesOpportunityId: state.dealId}, "tui"))
        const order = asUser(seller.username, () => page("Orders/OrderDetail", {orderId: state.orderId}, "tui"))
        return {deal, order, dealError: errorNode(deal.output), orderError: errorNode(order.output)}
    },
    then({deal, order, dealError, orderError}) {
        opened(deal)
        deal.output.includes("P20 walk lead " + run)
        dealError == false
        opened(order)
        order.output.includes(state.orderId)
        orderError == false
    }
})
