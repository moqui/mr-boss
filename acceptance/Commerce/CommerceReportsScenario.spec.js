// Commerce P11's "usable when" (impl-commerce P11; design-commerce §12.2 scenario 15), as an acceptance scenario over the
// demo data with artifact authorization on: a placed order and an invoice of the demo store this month; Online sales for
// POPC_DEFAULT agrees, period by period, with Mantle's get#SalesOrderSummary and get#SalesInvoiceSummary read by an
// Accounting reader for the same window, store and currency; Home's strip shows the same totals; the store-limited staff
// member sees only their store and another organization's manager only theirs; the CSV holds the same rows; Home and the
// four Reports screens render in qvt. The rules are SalesReportStoreScope's and CommerceReports'.
// Run: ./moq accept mr-boss --spec CommerceReportsScenario
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const R = "ironstone.commerce.ReportingServices."
const S = "mantle.sales.SalesReportServices."
const stamp = String(Date.now()).slice(-6)
const orderId = "BOSS_REP_O" + stamp,
    invoiceId = "BOSS_REP_I" + stamp,
    productId = "BOSS_REP_P" + stamp
const periods = 6
const walk = {}
const make = (entity, values) =>
    system(
        () =>
            ec.service
                .sync()
                .name("create#" + entity)
                .parameters(values)
                .requireNewTransaction(true)
                .call() || {}
    )
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")
const num = value => (value == null ? 0 : Number(String(value)))
const round = value => Math.round(num(value) * 100) / 100
const indexed = (documentType, queryString) =>
    num(
        system(
            () =>
                invoke("org.moqui.search.SearchServices.search#DataDocuments", {
                    indexName: "mantle_sales",
                    documentType,
                    queryString,
                    pageSize: 10
                }).documentListCount
        )
    )

spec({stepwise: true})

feature("a placed order and its invoice of the demo store this month reach the sales index", {
    when() {
        make("mantle.product.Product", {
            productId,
            productName: "Reports scenario item",
            productTypeEnumId: "PtService",
            ownerPartyId: ids.organizationId
        })
        make("mantle.order.OrderHeader", {
            orderId,
            productStoreId: ids.storeId,
            statusId: "OrderApproved",
            currencyUomId: "USD",
            salesChannelEnumId: "ScWeb",
            entryDate: ec.user.nowTimestamp,
            placedDate: ec.user.nowTimestamp,
            grandTotal: 30
        })
        make("mantle.order.OrderPart", {
            orderId,
            orderPartSeqId: "01",
            vendorPartyId: ids.organizationId,
            customerPartyId: ids.customerId,
            statusId: "OrderApproved"
        })
        make("mantle.order.OrderItem", {
            orderId,
            orderItemSeqId: "01",
            orderPartSeqId: "01",
            itemTypeEnumId: "ItemProduct",
            productId,
            quantity: 3,
            unitAmount: 10
        })
        make("mantle.account.invoice.Invoice", {
            invoiceId,
            invoiceTypeEnumId: "InvoiceSales",
            fromPartyId: ids.organizationId,
            toPartyId: ids.customerId,
            productStoreId: ids.storeId,
            statusId: "InvoiceFinalized",
            invoiceDate: ec.user.nowTimestamp,
            currencyUomId: "USD"
        })
        make("mantle.account.invoice.InvoiceItem", {
            invoiceId,
            invoiceItemSeqId: "01",
            itemTypeEnumId: "ItemProduct",
            productId,
            quantity: 3,
            amount: 10
        })
        const started = Date.now()
        let settled = false
        while (!settled && Date.now() - started < 30000) {
            system(() => invoke("org.moqui.EntityServices.process#DataFeedPending", {}))
            settled =
                indexed("MantleSalesOrderItem", "orderId:" + orderId) > 0 &&
                indexed("MantleSalesInvoice", "invoiceId:" + invoiceId) > 0
        }
        return {settled}
    },
    then({settled}) {
        settled
    }
})

feature("Online sales for the demo store agrees with Mantle's order and invoice summaries for the same window", {
    when() {
        const sales = asUser(
            users.manager,
            () =>
                invoke(R + "get#OnlineSales", {
                    appRoot: "Commerce",
                    productStoreId: ids.storeId,
                    interval: "M",
                    periodCount: periods,
                    currencyUomId: "USD"
                }).answer
        )
        // an Accounting reader (john.doe), as Accounting reads them: the store's organization, store and currency (a direct
        // service call, so without the screens' artifact authorization; Mantle checks ACCOUNTING_VIEW)
        const window = {
            interval: "M",
            intervalCount: periods,
            dateFormat: "yyyy-MM-dd",
            productStoreIds: [ids.storeId],
            currencyUomIds: ["USD"]
        }
        const orders = asUser(
            "john.doe",
            () => invoke(S + "get#SalesOrderSummary", Object.assign({vendorPartyIds: [ids.organizationId]}, window)),
            false
        )
        const invoices = asUser(
            "john.doe",
            () => invoke(S + "get#SalesInvoiceSummary", Object.assign({fromPartyIds: [ids.organizationId]}, window)),
            false
        )
        const byKey = list =>
            Object.fromEntries(
                Array.from(list || [])
                    .filter(line => /^\d{4}-/.test(line.dateKey))
                    .map(line => [line.dateKey, line])
            )
        walk.sales = sales
        return {sales, orders: byKey(orders.salesOrderSummaryList), invoices: byKey(invoices.salesInvoiceSummaryList)}
    },
    then({sales, orders, invoices}) {
        sales.totalRows.length == periods
        sales.totalRows[0].orderCount >= 1
        sales.totalRows.every(row => row.orderCount === num(orders[row.periodKey]?.orderCount))
        sales.totalRows.every(row => round(row.netSales) === round(orders[row.periodKey]?.netSales))
        sales.totalRows.every(row => round(row.grossSales) === round(orders[row.periodKey]?.productSaleTotal))
        sales.totalRows.every(row => round(row.invoicedNet) === round(invoices[row.periodKey]?.netSales))
        sales.topProducts.some(row => row.productId === productId)
    }
})

feature("Home's strip shows the same totals as Online sales for the store and month", {
    when() {
        return {
            home: asUser(
                users.manager,
                () => invoke(R + "get#HomePeriod", {appRoot: "Commerce", productStoreId: ids.storeId, interval: "M"}).period
            ),
            rendered: asUser(users.manager, () => page("Home", {productStoreId: ids.storeId, interval: "M"}))
        }
    },
    then({home, rendered}) {
        const card = home.cards.find(row => row.currencyUomId === "USD")
        card.orderCount == walk.sales.totalRows[0].orderCount
        round(card.invoicedNet) == round(walk.sales.totalRows[0].invoicedNet)
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Orders (USD)")
        rendered.output.includes(card.netText)
    }
})

feature("each reader sees only their stores", {
    when() {
        return {
            staff: asUser(users.storeStaff, () => invoke(R + "get#HomePeriod", {appRoot: "Commerce", interval: "M"}).period),
            staffOther: code(
                asUser(users.storeStaff, () =>
                    refusal(R + "get#HomePeriod", {appRoot: "Commerce", productStoreId: ids.otherStoreId})
                )
            ),
            other: asUser(
                users.services,
                () => invoke(R + "get#OnlineSales", {appRoot: "Commerce", interval: "M", periodCount: 1}).answer
            ),
            otherStore: code(
                asUser(users.services, () => refusal(R + "get#OnlineSales", {appRoot: "Commerce", productStoreId: ids.storeId}))
            ),
            otherOrders: code(
                asUser(users.services, () => refusal(S + "get#SalesOrderSummary", {productStoreIds: [ids.storeId]}), false)
            ),
            catalogue: asUser(users.manager, () => invoke(R + "get#ReportCatalogue", {appRoot: "Commerce"}).reports)
        }
    },
    then({staff, staffOther, other, otherStore, otherOrders, catalogue}) {
        // the staff member's stores are POPC_DEFAULT alone: the same totals as the store's
        staff.cards.find(row => row.currencyUomId === "USD").orderCount == walk.sales.totalRows[0].orderCount
        staffOther == "RECORD_UNAVAILABLE"
        // Services' manager reads their organization's store, never the demo store or its order
        other.filtersText.includes("Ziziwork Digital")
        !other.filtersText.includes("Ziziwork Retail")
        !other.topProducts.some(row => row.productId === productId)
        otherStore == "RECORD_UNAVAILABLE"
        otherOrders == "RECORD_UNAVAILABLE"
        catalogue.length == 3
    }
})

feature("the CSV holds the same rows", {
    when() {
        const exported = asUser(
            users.manager,
            () =>
                invoke(R + "get#OnlineSales", {
                    appRoot: "Commerce",
                    productStoreId: ids.storeId,
                    interval: "M",
                    periodCount: periods,
                    currencyUomId: "USD",
                    output: "csv"
                }).answer
        )
        return {exported}
    },
    then({exported}) {
        const lines = exported.csvText.split("\r\n")
        exported.totalRows.length == walk.sales.totalRows.length
        exported.totalRows.every(row =>
            lines.some(
                line =>
                    line.includes(row.periodText) &&
                    line.includes(",USD," + row.orderCount + "," + row.itemCount + ",") &&
                    line.endsWith("," + row.invoicedCsv + "," + row.averageCsv)
            )
        )
        lines.some(line => line.includes(productId))
    }
})

feature("the Reports screens render in qvt", {
    when() {
        const rendered = asUser(users.manager, () =>
            ["Reports", "Reports/OnlineSales", "Reports/CartRecovery", "Reports/PromotionUse"].map(path =>
                page(path, {productStoreId: ids.storeId})
            )
        )
        return {
            statuses: rendered.map(result => result.status),
            errors: rendered.flatMap(result => result.errors),
            sales: rendered[1].output
        }
    },
    then({statuses, errors, sales}) {
        statuses == [200, 200, 200, 200]
        errors == []
        sales.includes("Reports scenario item")
    }
})
