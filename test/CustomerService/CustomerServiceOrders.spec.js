// Customer Service customers and orders (impl-customer-service P3; CaseServices.find#ServiceOrders, CustomerServices,
// OrderServices, Orders.js, Customers.js; the confirmation's rules are Mantle's, tested in mr-mantle test/order/
// OrderConfirmations): the order lookup's exact id first and a missing and another organization's id answered alike (F30);
// Customer360 of a shared customer listing only the user's organizations' orders (F74); the audience of §2 (order amounts
// withheld without price read, invoice amounts without receivables read, the credit status only for a credit reader, no payment details); a case's linked
// records opening Customer Service; Products' Customer Service context (no cost or supplier price, price read by permission,
// the customer-serving facilities, F52); and the one render of OrderDetail's and Customer360's Customer Service branches
// (qvt). Run: ./moq test mr-boss --spec CustomerService/CustomerServiceOrders
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const cases = "ironstone.customerservice.CaseServices."
const customers = "ironstone.customerservice.CustomerServices."
const orders = "ironstone.customerservice.OrderServices."
const orderIds = result => Array.from(result.orders || []).map(row => row.orderId)
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // the shared customer ORG_ACME buys from both organizations: Retail's order and Services' order
        system(() => {
            for (const [orderId, vendorPartyId] of [
                ["BOSS_CS_SPEC_ACME_RETAIL", ids.organizationId],
                ["BOSS_CS_SPEC_ACME_SERVICES", ids.otherOrganizationId]
            ]) {
                if (ec.entity.find("mantle.order.OrderHeader").condition("orderId", orderId).one()) continue
                invoke("create#mantle.order.OrderHeader", {
                    orderId,
                    orderName: "Spec order of the shared customer",
                    statusId: "OrderPlaced",
                    placedDate: ec.user.nowTimestamp,
                    entryDate: ec.user.nowTimestamp,
                    currencyUomId: "USD"
                })
                invoke("create#mantle.order.OrderPart", {
                    orderId,
                    orderPartSeqId: "01",
                    vendorPartyId,
                    customerPartyId: ids.sharedCustomerId,
                    statusId: "OrderPlaced"
                })
            }
            const billing = ec.entity
                .find("mantle.order.OrderItemBilling")
                .condition("orderId", ids.deliveredOrderId)
                .disableAuthz()
                .list()
            state.invoiceId = billing.length ? billing[0].invoiceId : null
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the order lookup finds an exact id first, the customer's orders by email, and answers a missing and another organization's id alike",
    {
        when() {
            return asUser(users.agent, () => ({
                exact: invoke(cases + "find#ServiceOrders", {term: ids.deliveredOrderId}),
                byEmail: invoke(cases + "find#ServiceOrders", {term: "joe@public.com"}),
                other: invoke(cases + "find#ServiceOrders", {term: ids.otherOrderId}),
                missing: invoke(cases + "find#ServiceOrders", {term: "BOSS_CS_NO_SUCH_ORDER"}),
                empty: invoke(cases + "find#ServiceOrders", {})
            }))
        },
        then({exact, byEmail, other, missing, empty}) {
            exact.exact == true
            orderIds(exact) == [ids.deliveredOrderId]
            exact.orders[0].customerName == "Joe Public"
            exact.orders[0].fulfillmentText == "Delivered"
            exact.orders[0].url == "/qapps/CustomerService/Orders/OrderDetail?orderId=" + ids.deliveredOrderId
            byEmail.exact == false
            orderIds(byEmail).includes(ids.deliveredOrderId)
            orderIds(byEmail).includes("BOSS_CS_SO_HELD")
            orderIds(other) == []
            orderIds(missing) == []
            other.message == missing.message
            other.message == "No order matches"
            orderIds(empty) == []
        }
    }
)

feature(
    "Customer360 of a shared customer lists only the user's organizations' orders; another organization's customer is not found",
    {
        when() {
            const orderList = detail => Array.from(detail.customerDetail?.orderRows || []).map(row => row.orderId)
            const retail = asUser(users.agent, () =>
                invoke(customers + "get#Customer360", {customerPartyId: ids.sharedCustomerId})
            )
            const services = asUser(users.services, () =>
                invoke(customers + "get#Customer360", {customerPartyId: ids.sharedCustomerId})
            )
            const otherCustomer = asUser(users.agent, () =>
                invoke(customers + "get#Customer360", {customerPartyId: ids.otherCustomerId})
            )
            return {
                retail: orderList(retail),
                services: orderList(services),
                shared: retail.customerDetail?.shared,
                otherCustomer
            }
        },
        then({retail, services, shared, otherCustomer}) {
            shared == true
            retail.includes("BOSS_CS_SPEC_ACME_RETAIL")
            !retail.includes("BOSS_CS_SPEC_ACME_SERVICES")
            services.includes("BOSS_CS_SPEC_ACME_SERVICES")
            !services.includes("BOSS_CS_SPEC_ACME_RETAIL")
            otherCustomer.customerFound == false
            otherCustomer.customerDetail == null
        }
    }
)

feature(
    "order amounts show to a price reader, invoice amounts to a receivables reader, the credit status to a credit reader, and no payment details to anyone",
    {
        when() {
            const invoice = user => asUser(user, () => invoke(orders + "get#InvoiceDetail", {invoiceId: state.invoiceId}).detail)
            const customer = user =>
                asUser(user, () => invoke(customers + "get#Customer360", {customerPartyId: ids.customerId}).customerDetail)
            return {
                agentInvoice: invoice(users.agent),
                arInvoice: invoice(users.returnsReceivables),
                agentCustomer: customer(users.agent),
                readerCustomer: customer(users.read),
                readerOrder: asUser(users.read, () => invoke(orders + "get#OrderDetail", {orderId: ids.deliveredOrderId}).detail)
            }
        },
        then({agentInvoice, arInvoice, agentCustomer, readerCustomer, readerOrder}) {
            agentInvoice.moneyRead == false
            agentInvoice.invoice.totalText == "Withheld"
            agentInvoice.lineRows.every(row => row.amountText == "Withheld")
            agentInvoice.paymentRows == []
            agentInvoice.canSendCopy == false
            arInvoice.moneyRead == true
            arInvoice.invoice.totalText != "Withheld"
            arInvoice.canSendCopy == true
            agentCustomer.credit.read == true
            readerCustomer.credit.read == false
            readerCustomer.credit.rows == []
            agentCustomer.invoiceRows.every(row => row.totalText == "Withheld")
            agentCustomer.orderRows.every(row => row.totalText != "Withheld")
            readerCustomer.orderRows.every(row => row.totalText == "Withheld")
            readerOrder.amountRead == false
            readerOrder.order.totalText == "Withheld"
            readerOrder.itemRows.every(row => row.priceText == "Withheld" && row.amountText == "Withheld")
            !JSON.stringify(agentCustomer).includes("4111111111111111")
            !JSON.stringify(agentCustomer).includes("CustJqpCc")
        }
    }
)

feature("a case's linked order opens OrderDetail here, named by its kind", {
    when() {
        const detail = asUser(users.agent, () => invoke(cases + "get#CaseDetail", {requestId: ids.thermostatCaseId}).detail)
        return {orderLink: Array.from(detail.links || []).find(row => row.recordId === ids.deliveredOrderId)}
    },
    then({orderLink}) {
        orderLink.url == "/qapps/CustomerService/Orders/OrderDetail?orderId=" + ids.deliveredOrderId
        orderLink.recordText.startsWith("Sales order " + ids.deliveredOrderId)
    }
})

feature(
    "Products' Customer Service context: no cost or supplier price, price read by permission, the customer-serving facilities",
    {
        when() {
            const context = user =>
                // as a mounted screen calls it (its root's authorization covers it), so the call itself is not authorized here
                asUser(
                    user,
                    () => invoke("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "CustomerService"}),
                    false
                )
            return {agent: context(users.agent), reader: context(users.read)}
        },
        then({agent, reader}) {
            agent.capabilities.read == true
            agent.capabilities.costRead == false
            agent.capabilities.supplierPriceRead == false
            agent.capabilities.marginRead == false
            agent.capabilities.priceRead == true
            agent.productTabs.includes("Prices")
            !agent.productTabs.includes("Costs")
            !agent.productTabs.includes("Suppliers")
            agent.facilityIds.includes("ZIRET_WH")
            reader.capabilities.priceRead == false
            !reader.productTabs.includes("Prices")
            agent.sharedLinks["Prices/PriceExplain"] == "//CustomerService/Availability/PriceExplain"
        }
    }
)

feature("OrderDetail's and Customer360's Customer Service branches render for the agent (qvt)", {
    when() {
        const held = asUser(users.agent, () => lib.page("Orders/OrderDetail", {orderId: "BOSS_CS_SO_HELD"}))
        const customer = asUser(users.agent, () => lib.page("Customers/Customer360", {customerPartyId: ids.customerId}))
        const other = asUser(users.agent, () => lib.page("Orders/OrderDetail", {orderId: ids.otherOrderId}))
        return {held, customer, other}
    },
    then({held, customer, other}) {
        held.status == 200
        held.errors == []
        held.output.includes("Order BOSS_CS_SO_HELD")
        held.output.includes("Waiting for the customer to confirm the delivery address")
        held.output.includes("Resend confirmation")
        held.output.includes("Link to case")
        customer.status == 200
        customer.errors == []
        customer.output.includes("Joe Public")
        customer.output.includes("Open cases")
        customer.output.includes("CustomerServiceCustomerTabs")
        !customer.output.includes("AccountingCustomerTabs")
        !customer.output.includes("Customer statement")
        other.output.includes("Order not available")
    }
})
