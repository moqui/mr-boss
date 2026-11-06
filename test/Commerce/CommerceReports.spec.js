// Commerce reports and Home's period strip (impl-commerce P11, COM-REPORTS; design-commerce §1.2, §3;
// ironstone.commerce.ReportingServices over Mantle's store-scoped sales reads, F21): in a month of their own, a placed
// order, an open cart and an invoice of POPC_DEFAULT; Online sales counts the order and not the cart, and Home's strip shows
// the same totals for the same store and period; Cart recovery and Promotion use answer for the manager, with the export's
// same rows; the reader (no Reports) is refused the reports but has the strip, another organization's manager is refused
// the store; the report catalogue and the shipped definitions; the four Reports screens rendered once each (qvt). The rules
// of the store scope and the summaries are Mantle's (SalesReportStoreScope, StoreReports); RecurringTemplate bases cannot be
// left out until Shop P7 marks them (F112). The usable-when is the acceptance CommerceReportsScenario.
// Run: ./moq test mr-boss --spec CommerceReports
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const R = "ironstone.commerce.ReportingServices."
const prefix = "BOSS_COM11"
// a month of its own, years back, so only this spec's records are in it
const day = "2004-05-12"
const at = hour => ec.l10n.parseTimestamp(day + " " + String(hour).padStart(2, "0") + ":00", "yyyy-MM-dd HH:mm")
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")
const make = (entity, values) =>
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(values)
        .call()
const scope = {appRoot: "Commerce", productStoreId: ids.storeId, interval: "M", periodDate: day, currencyUomId: "USD"}
const searchCount = queryString =>
    Number(
        String(
            invoke("org.moqui.search.SearchServices.search#DataDocuments", {
                indexName: "mantle_sales",
                documentType: "MantleSalesInvoice",
                queryString,
                pageSize: 10
            }).documentListCount || 0
        )
    )
function order(orderId, statusId) {
    make("mantle.order.OrderHeader", {
        orderId,
        productStoreId: ids.storeId,
        statusId,
        currencyUomId: "USD",
        salesChannelEnumId: "ScWeb",
        entryDate: at(9),
        placedDate: statusId === "OrderOpen" ? null : at(10),
        grandTotal: 20
    })
    make("mantle.order.OrderPart", {
        orderId,
        orderPartSeqId: "01",
        vendorPartyId: ids.organizationId,
        customerPartyId: ids.customerId,
        statusId
    })
    make("mantle.order.OrderItem", {
        orderId,
        orderItemSeqId: "01",
        orderPartSeqId: "01",
        itemTypeEnumId: "ItemProduct",
        productId: prefix + "_PROD",
        quantity: 2,
        unitAmount: 10
    })
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            make("mantle.product.Product", {
                productId: prefix + "_PROD",
                productName: "Reports spec item",
                productTypeEnumId: "PtService",
                ownerPartyId: ids.organizationId
            })
            order(prefix + "_ORDER", "OrderApproved")
            order(prefix + "_CART", "OrderOpen")
            make("mantle.account.invoice.Invoice", {
                invoiceId: prefix + "_INV",
                invoiceTypeEnumId: "InvoiceSales",
                fromPartyId: ids.organizationId,
                toPartyId: ids.customerId,
                productStoreId: ids.storeId,
                statusId: "InvoiceFinalized",
                invoiceDate: at(11),
                currencyUomId: "USD"
            })
            make("mantle.account.invoice.InvoiceItem", {
                invoiceId: prefix + "_INV",
                invoiceItemSeqId: "01",
                itemTypeEnumId: "ItemProduct",
                productId: prefix + "_PROD",
                quantity: 2,
                amount: 10
            })
            const started = Date.now()
            while (Date.now() - started < 10000) {
                invoke("org.moqui.EntityServices.process#DataFeedPending", {})
                if (searchCount("invoiceId:" + prefix + "_INV") > 0) break
            }
        })
    }
})

feature("Online sales counts the placed order and not the open cart, and Home's strip shows the same totals", {
    when() {
        const sales = asUser(users.manager, () => invoke(R + "get#OnlineSales", Object.assign({periodCount: 1}, scope)).answer)
        const home = asUser(users.manager, () => invoke(R + "get#HomePeriod", scope).period)
        // the reader has no Reports but has Home's strip, which Mantle answers for COMMERCE_VIEW (F21)
        const readerHome = asUser(users.read, () => invoke(R + "get#HomePeriod", scope).period)
        const exported = asUser(
            users.manager,
            () => invoke(R + "get#OnlineSales", Object.assign({periodCount: 1, output: "csv"}, scope)).answer
        )
        return {sales, home, readerHome, exported}
    },
    then({sales, home, readerHome, exported}) {
        sales.totalRows.length == 1
        const total = sales.totalRows[0]
        total.periodKey == "2004-05-01"
        total.orderCount == 1
        total.itemCount == 2
        total.netSales == 20
        total.invoicedNet == 20
        // the month before had none
        total.orderChangeText == ""
        sales.topProducts.map(row => row.productId) == [prefix + "_PROD"]
        // Home's strip: the same store, period and currency, the same totals
        home.cards.length == 1
        home.cards[0].orderCount == total.orderCount
        home.cards[0].invoicedNet == total.invoicedNet
        home.cards[0].previousOrderCount == 0
        home.cards[0].topProductText == "Reports spec item"
        home.canReports == true
        readerHome.cards[0].orderCount == 1
        readerHome.canReports == false
        // the export: the same rows
        exported.fileName.startsWith("OnlineSales-")
        exported.csvText.includes("Online sales")
        exported.csvText.includes(",USD,1,2,20,0,20,20,20")
        exported.csvText.includes(prefix + "_PROD")
    }
})

feature("the reports keep to the Reports area and the user's stores; Cart recovery and Promotion use answer", {
    when() {
        return {
            reader: code(asUser(users.read, () => refusal(R + "get#OnlineSales", scope))),
            readerCatalogue: asUser(users.read, () => invoke(R + "get#ReportCatalogue", {appRoot: "Commerce"}).reports),
            catalogue: asUser(users.manager, () => invoke(R + "get#ReportCatalogue", {appRoot: "Commerce"}).reports),
            otherStore: code(asUser(users.services, () => refusal(R + "get#HomePeriod", scope))),
            otherReport: code(
                asUser(users.manager, () =>
                    refusal(R + "get#CartRecovery", Object.assign({}, scope, {productStoreId: ids.otherStoreId}))
                )
            ),
            recovery: asUser(users.manager, () => invoke(R + "get#CartRecovery", Object.assign({output: "csv"}, scope)).answer),
            promotions: asUser(users.operator, () => invoke(R + "get#PromotionUse", scope).answer),
            definitions: [
                "boss-commerce-checkouts",
                "boss-commerce-payment-attempts",
                "boss-commerce-store-operations",
                "boss-commerce-checkout-failures",
                "boss-commerce-payment-unresolved"
            ].map(definitionId => invoke("org.moqui.report.ReportServices.get#Definition", {definitionId}).definition),
            documents: system(() =>
                ["BossStoreCheckout", "BossStorePaymentAttempt"].filter(dataDocumentId =>
                    ec.entity.find("moqui.entity.document.DataDocument").condition("dataDocumentId", dataDocumentId).one()
                )
            )
        }
    },
    then({reader, readerCatalogue, catalogue, otherStore, otherReport, recovery, promotions, definitions, documents}) {
        reader == "PERMISSION_DENIED"
        readerCatalogue.length == 0
        catalogue.map(entry => entry.entryId) == ["Commerce.OnlineSales", "Commerce.CartRecovery", "Commerce.PromotionUse"]
        otherStore == "RECORD_UNAVAILABLE"
        otherReport == "RECORD_UNAVAILABLE"
        // the spec's open cart has no Shop access row: no cart was opened through Shop in the month
        recovery.rows.length == 0
        recovery.csvText.includes("Carts opened")
        recovery.fileName.startsWith("CartRecovery-")
        promotions.rows.length == 0
        promotions.filtersText.includes("Ziziwork Retail")
        definitions.every(definition => definition != null)
        definitions.map(definition => definition.type) == ["dataset", "dataset", "dashboard", "alert", "alert"]
        // the datasets' documents
        documents.length == 2
    }
})

feature("the Reports screens render for the manager", {
    when() {
        return asUser(users.manager, () => ({
            home: page("Reports"),
            sales: page("Reports/OnlineSales", {productStoreId: ids.storeId, periodDate: day, periodCount: "1"}),
            recovery: page("Reports/CartRecovery", {productStoreId: ids.storeId, periodDate: day}),
            promotions: page("Reports/PromotionUse", {productStoreId: ids.storeId, periodDate: day})
        }))
    },
    then({home, sales, recovery, promotions}) {
        for (const rendered of [home, sales, recovery, promotions]) {
            rendered.status == 200
            rendered.errors == []
        }
        home.output.includes("Online sales")
        home.output.includes("Promotion use")
        sales.output.includes("Net invoiced")
        sales.output.includes("Reports spec item")
        sales.output.includes("Export CSV")
        recovery.output.includes("Recovery funnel")
        promotions.output.includes("By promotion and code")
    }
})
