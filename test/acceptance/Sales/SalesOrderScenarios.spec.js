// Sales P11's "usable when" (impl-sales P11; design-sales §14.3 scenarios 4 and 7, their order halves; §6 Orders and OrderDetail's
// sales-order context): an accepted net-terms quote of Retail waits in Awaiting approval and sales.approver approves it from
// OrderDetail past the credit and Sales checks; Ziziwork Sales' storeless direct order (sales.rep3, Fabrikam) sends one confirmation at
// its placement, none again at its approval, and its invoice carries the gateway's tax; a rep enters a direct order with no quote
// through NewSalesOrder and OrderDetail and places it. Every step through the screens' transitions where one exists; the rules are
// Mantle's SalesOrderApproval and StorelessOrderConfirmation.
// Run: ./moq accept mr-boss --spec SalesOrderScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const capture = ec.factory.getTool("MailCapture")
const asService = (user, action) => asUser(user, () => system(action))
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const rows = (entity, values) => Array.from(ec.entity.find(entity).condition(values).disableAuthz().list())
const revisionOf = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision ?? 1)
const statusOf = orderId => one("mantle.order.OrderHeader", {orderId}).statusId
const drain = () => ec.factory.waitWorkerPoolEmpty(50)
const confirmations = orderId =>
    system(() =>
        Array.from(
            ec.entity
                .find("mantle.party.MessageDelivery")
                .condition("eventKey", "like", "SalesOrderConfirmation:" + orderId + "@%")
                .list()
        )
    )
// the order of the user named, found by its name in Orders' find (the screen's own query)
const orderNamed = (user, name, list = "recent") =>
    asService(user, () =>
        Array.from(invoke("mantle.sales.SalesWorkspaceServices.find#SalesOrders", {text: name, list}).orderList || [])
    )[0]

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
        // Fabrikam's contact gets an email, so its confirmation has somewhere to go
        system(() => {
            const mech = invoke("create#mantle.party.contact.ContactMech", {
                contactMechTypeEnumId: "CmtEmailAddress",
                infoString: "lee.chen." + run + "@fabrikam.example.test"
            })
            invoke("create#mantle.party.contact.PartyContactMech", {
                partyId: ids.contacts.lee,
                contactMechId: mech.contactMechId,
                contactMechPurposeId: "EmailPrimary",
                fromDate: ec.user.nowTimestamp
            })
        })
    },
    cleanupSpec() {
        capture.reset()
    }
})

feature("an accepted net-terms quote waits in Awaiting approval and the approver approves it past the credit and Sales checks", {
    when() {
        const name = "Usable net terms " + run
        asUser(users.rep, () =>
            page(
                "Quotes/Quotes/createQuote",
                {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    orderName: name
                },
                "html"
            )
        )
        const orderId = asService(users.rep, () =>
            Array.from(invoke("mantle.order.SalesQuoteServices.find#Quotes", {text: name, state: "all"}).quoteList || [])
        )[0]?.orderId
        asUser(users.rep, () =>
            page(
                "Orders/OrderDetail/salesStoreLine",
                {orderId, orderRevision: revisionOf(orderId), productId: "DEMO_1_1", quantity: "2"},
                "html"
            )
        )
        asUser(users.rep, () =>
            page("Orders/OrderDetail/salesProposeQuote", {orderId, orderRevision: revisionOf(orderId)}, "html")
        )
        asService(users.rep, () =>
            invoke("mantle.order.SalesQuoteIssueServices.send#Quote", {
                orderId,
                orderRevision: revisionOf(orderId),
                sendMode: "organization",
                operationKey: "usable-send-" + run
            })
        )
        const issueId = asService(users.rep, () =>
            invoke("mantle.order.SalesQuoteIssueServices.get#QuoteIssues", {orderId})
        ).standingIssueId
        asUser(users.rep, () =>
            page(
                "Orders/OrderDetail/salesRespondQuote",
                {
                    orderId,
                    issueId,
                    responseType: "accept",
                    contactPartyId: ids.contacts.dana,
                    otherPartyOrderId: "PO-" + run,
                    operationKey: "usable-accept-" + run
                },
                "html"
            )
        )
        const placed = statusOf(orderId)
        const awaiting = orderNamed(users.approver, name, "awaiting")
        const quoteListed = asService(
            users.rep,
            () =>
                Array.from(invoke("mantle.order.SalesQuoteServices.find#Quotes", {text: name, state: "all"}).quoteList || [])
                    .length
        )
        const detail = asUser(users.approver, () => page("Orders/OrderDetail", {orderId}, "html"))
        asUser(users.approver, () =>
            page(
                "Orders/OrderDetail/salesApproveOrder",
                {orderId, orderRevision: revisionOf(orderId), operationKey: "usable-approve-" + run},
                "html"
            )
        )
        return {orderId, placed, awaiting, quoteListed, detail, approved: statusOf(orderId)}
    },
    then({orderId, placed, awaiting, quoteListed, detail, approved}) {
        placed == "OrderPlaced"
        awaiting?.orderId == orderId
        // once placed the accepted quote is an order's, not listed among the quotes too (P7's review)
        quoteListed == 0
        detail.output.includes("Order " + orderId)
        detail.output.includes("Approve")
        approved == "OrderApproved"
    }
})

feature("a storeless order's placement sends one confirmation and its invoice carries the gateway's tax", {
    when() {
        const name = "Usable storeless " + run
        asUser(users.otherRep, () =>
            page(
                "Orders/Orders/createSalesOrder",
                {
                    organizationPartyId: ids.otherOrganizationId,
                    customerPartyId: ids.accounts.fabrikam,
                    contactPartyId: ids.contacts.lee,
                    orderName: name
                },
                "html"
            )
        )
        const orderId = orderNamed(users.otherRep, name)?.orderId
        asUser(users.otherRep, () =>
            page(
                "Orders/OrderDetail/salesStoreOrderLine",
                {orderId, orderRevision: revisionOf(orderId), productId: "DEMO_1_1", quantity: "2"},
                "html"
            )
        )
        asUser(users.otherRep, () =>
            page("Orders/OrderDetail/salesPlaceOrder", {orderId, orderRevision: revisionOf(orderId)}, "html")
        )
        drain()
        const atPlacement = confirmations(orderId)
        // approved and invoiced by the instance administrator (Ziziwork Sales has no demo approver or biller)
        asService(users.system, () => invoke("mantle.order.OrderServices.approve#Order", {orderId}))
        drain()
        const afterApproval = confirmations(orderId)
        const invoiceId = asService(users.system, () =>
            invoke("mantle.account.InvoiceServices.create#InvoiceFromSource", {orderId, operationKey: "usable-invoice-" + run})
        ).invoiceId
        const taxItems = rows("mantle.account.invoice.InvoiceItem", {invoiceId}).filter(item =>
            ["ItemSalesTax", "ItemVatTax"].includes(item.itemTypeEnumId)
        )
        const orderTax = rows("mantle.order.OrderItem", {orderId}).filter(item =>
            ["ItemSalesTax", "ItemVatTax"].includes(item.itemTypeEnumId)
        )
        return {orderId, atPlacement, afterApproval, taxItems, orderTax}
    },
    then({orderId, atPlacement, afterApproval, taxItems, orderTax}) {
        atPlacement.length == 1 && atPlacement[0].recipientPartyId == ids.contacts.lee
        afterApproval.length == 1
        orderTax.length > 0
        taxItems.length == orderTax.length
    }
})

feature("a rep enters a direct order with no quote and places it", {
    when() {
        const name = "Usable direct " + run
        asUser(users.rep, () =>
            page(
                "Orders/Orders/createSalesOrder",
                {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    orderName: name,
                    otherPartyOrderId: "WT-" + run
                },
                "html"
            )
        )
        const orderId = orderNamed(users.rep, name, "draft")?.orderId
        asUser(users.rep, () =>
            page(
                "Orders/OrderDetail/salesStoreOrderLine",
                {orderId, orderRevision: revisionOf(orderId), productId: "DEMO_1_1", quantity: "1"},
                "html"
            )
        )
        const draft = asUser(users.rep, () => page("Orders/OrderDetail", {orderId}, "html"))
        asUser(users.rep, () => page("Orders/OrderDetail/salesPlaceOrder", {orderId, orderRevision: revisionOf(orderId)}, "html"))
        const responses = rows("mantle.sales.quote.SalesQuoteResponse", {orderId}).length
        return {
            orderId,
            draft,
            status: statusOf(orderId),
            purpose: one("mantle.order.OrderHeader", {orderId}).orderPurposeEnumId,
            responses
        }
    },
    then({orderId, draft, status, purpose, responses}) {
        orderId != null
        draft.output.includes("Place")
        draft.output.includes("WT-")
        status == "OrderPlaced"
        purpose == "OrpSalesOrder"
        // a direct order needs no fake acceptance
        responses == 0
    }
})
