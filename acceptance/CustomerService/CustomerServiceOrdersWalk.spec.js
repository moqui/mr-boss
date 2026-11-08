// Customer Service P3's "usable when" (impl-customer-service P3), as an acceptance walk through the screens and their
// transitions with artifact authorization on: an agent finds Joe Q Public by email, opens Customer360 and sees the open case
// and the orders with no payment details, and a held order's reason read only; an order id of another organization and a
// missing id give the same answer; from OrderDetail the agent links the delivered order to a case and resends its
// confirmation, the send recording the recipient and the confirmation's version, and a second resend is a second record,
// not a re-render; InventoryAvailability for a product whose projection is not ready says unknown; StockAtDate answers the
// quantity at a past cut-off for ZIRET_WH; Product360 shows no cost or supplier price, and a reader without price read sees
// no PriceExplain. The rules are Mantle's OrderConfirmations and CustomerServiceOrders' specs.
// Run: ./moq accept mr-boss --spec CustomerServiceOrdersWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
// a transition of a Customer Service screen as the user posts it
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
const dayBefore = () => ec.l10n.format(new Date(Number(ec.user.nowTimestamp) - 86400000), "yyyy-MM-dd")

spec({
    setupSpec() {
        capture.enable()
        // a stocked product of Retail with no stock, orders or projection yet (a projection not ready)
        system(() => {
            if (!ec.entity.find("mantle.product.Product").condition("productId", "BOSS_CS_SPEC_UNSTOCKED").one())
                invoke("create#mantle.product.Product", {
                    productId: "BOSS_CS_SPEC_UNSTOCKED",
                    productName: "Service spec new filter",
                    productTypeEnumId: "PtAsset",
                    assetTypeEnumId: "AstTpInventory",
                    ownerPartyId: ids.organizationId
                })
        })
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the agent finds Joe by email, opens Customer360 with the open case and orders and no payment details, and a held order's reason read only",
    {
        when() {
            const found = html(users.agent, "Customers/Customers", {term: "joe@public.com"})
            const cases = html(users.agent, "Customers/Customer360/ServiceCases", {customerPartyId: ids.customerId})
            const ordersTab = html(users.agent, "Customers/Customer360/ServiceOrders", {customerPartyId: ids.customerId})
            const overview = html(users.agent, "Customers/Customer360/ServiceOverview", {customerPartyId: ids.customerId})
            const held = html(users.agent, "Orders/OrderDetail", {orderId: ids.heldOrderId})
            return {found, cases, ordersTab, overview, held}
        },
        then({found, cases, ordersTab, overview, held}) {
            found.errors == []
            found.output.includes("Customer360?customerPartyId=" + ids.customerId)
            cases.errors == []
            cases.output.includes(ids.thermostatCaseId)
            ordersTab.output.includes(ids.deliveredOrderId)
            ordersTab.output.includes(ids.heldOrderId)
            overview.errors == []
            overview.output.includes("joe@public.com")
            !overview.output.includes("1111")
            !overview.output.includes("Payment details")
            held.errors == []
            held.output.includes("Waiting for the customer to confirm the delivery address")
            held.output.includes("Read only")
            !held.output.includes("Release hold")
        }
    }
)

feature("an order id of another organization and a missing id give the same answer", {
    when() {
        const answer = term => {
            const found = asUser(users.agent, () => invoke("ironstone.customerservice.CaseServices.find#ServiceOrders", {term}))
            return {orders: found.orders, message: found.message, count: found.ordersCount}
        }
        const other = answer(ids.otherOrderId)
        const missing = answer("BOSS_CS_NO_SUCH_ORDER")
        const page = html(users.agent, "Orders/Orders", {term: ids.otherOrderId})
        const detail = html(users.agent, "Orders/OrderDetail", {orderId: ids.otherOrderId})
        const missingDetail = html(users.agent, "Orders/OrderDetail", {orderId: "BOSS_CS_NO_SUCH_ORDER"})
        return {other, missing, page, detail, missingDetail}
    },
    then({other, missing, page, detail, missingDetail}) {
        other == missing
        page.output.includes("No order matches")
        detail.output.includes("Order not available")
        missingDetail.output.includes("Order not available")
    }
})

feature(
    "from OrderDetail the agent links the delivered order to a case and resends its confirmation twice: two records of one stored version",
    {
        when() {
            capture.clear()
            const linked = post(users.agent, "Orders/OrderDetail/linkOrderCase", {
                orderId: ids.deliveredOrderId,
                requestId: ids.filtersCaseId
            })
            const link = rows("mantle.request.RequestRecord", {
                requestId: ids.filtersCaseId,
                recordEntityName: "mantle.order.OrderHeader",
                recordId: ids.deliveredOrderId
            })
            const resend = key =>
                post(users.agent, "Orders/OrderDetail/resendConfirmation", {
                    orderId: ids.deliveredOrderId,
                    toAddress: "joe@public.com",
                    emailAccountId: ids.serviceMailAccountId,
                    note: "Here is your order again.",
                    operationKey: key
                })
            const first = resend("walk-resend-" + Date.now() + "-1")
            const second = resend("walk-resend-" + Date.now() + "-2")
            const records = rows("mantle.order.OrderEmailMessage", {orderId: ids.deliveredOrderId}).filter(
                row => row.orderContentId
            )
            const contents = rows("mantle.order.OrderContent", {
                orderId: ids.deliveredOrderId,
                orderContentTypeEnumId: "OctOrderConfirmation"
            })
            const messages = records.map(row => rows("moqui.basic.email.EmailMessage", {emailMessageId: row.emailMessageId})[0])
            const detail = html(users.agent, "Orders/OrderDetail", {orderId: ids.deliveredOrderId})
            // a reader may not resend
            const reader = post(users.read, "Orders/OrderDetail/resendConfirmation", {
                orderId: ids.deliveredOrderId,
                toAddress: "joe@public.com",
                operationKey: "walk-resend-reader-" + Date.now()
            })
            return {linked, link, first, second, records, contents, messages, detail, reader}
        },
        then({linked, link, first, second, records, contents, messages, detail, reader}) {
            linked.errors == ""
            link.length == 1
            first.errors == ""
            second.errors == ""
            records.length == 2
            contents.length == 1
            records.every(row => row.orderContentId == contents[0].orderContentId)
            records.every(row => row.partyId == ids.customerId)
            messages.every(message => message.toAddresses == "joe@public.com")
            records[0].emailMessageId != records[1].emailMessageId
            detail.output.includes("joe@public.com")
            detail.output.includes("As placed")
            reader.errors.includes("PERMISSION_DENIED")
        }
    }
)

feature("InventoryAvailability of a product whose projection is not ready says unknown, never zero", {
    when() {
        return {
            projection: html(users.agent, "Availability/InventoryAvailability/Projection", {
                productId: "BOSS_CS_SPEC_UNSTOCKED",
                facilityId: "ZIRET_WH"
            })
        }
    },
    then({projection}) {
        projection.errors == []
        projection.output.includes("Projected availability is unknown, not zero")
    }
})

feature("StockAtDate answers the quantity at a past cut-off for ZIRET_WH; another organization's facility is refused", {
    when() {
        const service = "ironstone.customerservice.AvailabilityServices.get#StockAtDate"
        // the day once, in the spec's own zone: in the evening the agent's zone may already be on the next day
        const asOfDate = dayBefore()
        const report = asUser(users.agent, () =>
            invoke(service, {asOfDate, facilityId: "ZIRET_WH", productId: ids.filterProductId})
        )
        const outside = asUser(users.agent, () => refusal(service, {asOfDate, facilityId: "ZIRET_NOT_SERVING"}))
        const places = html(users.agent, "Availability/StockAtDate/Places", {
            asOfDate,
            facilityId: "ZIRET_WH",
            productId: ids.filterProductId
        })
        const filterRow = Array.from(report.stockRows || []).find(
            row => row.facilityId === "ZIRET_WH" && row.productId === ids.filterProductId
        )
        return {asOfDate, report, filterRow, outside, places}
    },
    then({asOfDate, report, filterRow, outside, places}) {
        report.asOfDay == asOfDate
        filterRow != null
        filterRow.closingText != ""
        outside.includes("FACILITY_UNAVAILABLE")
        places.errors == []
        places.output.includes("Stock from")
    }
})

feature("Product360 shows the warranty term and no cost or supplier price; a reader without price read sees no PriceExplain", {
    when() {
        return {
            summary: html(users.agent, "Availability/Product360/Summary", {productId: ids.serializedProductId}),
            agentExplain: html(users.agent, "Availability/PriceExplain", {productId: ids.serializedProductId}),
            readerExplain: html(users.read, "Availability/PriceExplain", {productId: ids.serializedProductId})
        }
    },
    then({summary, agentExplain, readerExplain}) {
        summary.errors == []
        summary.output.includes("Service demo smart thermostat")
        // P16 (F164): the product's warranty at sale, as WarrantyAssessment counts it
        summary.output.includes("Warranty: 12 months from delivery (" + ids.warrantyFeatureId + ")")
        !summary.output.includes("70.00")
        !summary.output.includes("Standard cost")
        agentExplain.output.includes("Transaction price context")
        !readerExplain.output.includes("Transaction price context")
    }
})
