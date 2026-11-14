// Sales P7's "usable when" (impl-sales P7; design-sales §14.3 scenario 4, its price and tax half; §5, §7, X1): a rep drafts a
// customer-priced quote with no ProductStore through the screens, sees the price Products explains and the tax of the seller's gateway
// change with each line, an unavailable price told apart from a zero one, and no cost; Projects', Accounting's, Purchasing's,
// Customer Service's and Commerce's order contexts read as before. The rules are Mantle's SalesQuoteDrafts and StorelessOrderTax and
// the BOSS SalesQuotes.
// Run: ./moq accept mr-boss --spec SalesQuoteDraftUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const priced = "SAL_USABLE_PRICED_" + run,
    zero = "SAL_USABLE_ZERO_" + run,
    unpriced = "SAL_USABLE_UNPRICED_" + run
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const one = (entity, condition) => system(() => ec.entity.find(entity).condition(condition).one())
const taxOf = orderId =>
    system(() =>
        Array.from(ec.entity.find("mantle.order.OrderItem").condition({orderId, itemTypeEnumId: "ItemSalesTax"}).list())
    ).reduce((sum, row) => sum.add(toDecimal(row.quantity ?? 1).multiply(toDecimal(row.unitAmount ?? 0))), toDecimal(0))
let orderId

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            // Ziziwork Sales' products: one with Fabrikam's own price, one priced at zero (a giveaway the seller set), one with none
            for (const productId of [priced, zero, unpriced])
                call("create#mantle.product.Product", {
                    productId,
                    productName: "Usable " + productId,
                    productTypeEnumId: "PtAsset",
                    ownerPartyId: ids.otherOrganizationId
                })
            const price = (productId, values) =>
                call(
                    "create#mantle.product.ProductPrice",
                    Object.assign(
                        {
                            productId,
                            vendorPartyId: ids.otherOrganizationId,
                            pricePurposeEnumId: "PppPurchase",
                            priceTypeEnumId: "PptCurrent",
                            fromDate: 0,
                            minQuantity: 1,
                            priceUomId: "USD"
                        },
                        values
                    )
                )
            price(priced, {price: "500"})
            price(priced, {customerPartyId: ids.accounts.fabrikam, price: "400"})
            price(zero, {price: "0"})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("a rep drafts a storeless quote at the customer's price, its tax through the seller's gateway changing with each line", {
    when() {
        const created = asUser(users.otherRep, () =>
            page(
                "Quotes/Quotes/createQuote",
                {
                    organizationPartyId: ids.otherOrganizationId,
                    customerPartyId: ids.accounts.fabrikam,
                    orderName: "Usable " + run
                },
                "html"
            )
        )
        orderId = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.order.OrderHeader")
                        .condition({orderName: "Usable " + run})
                        .orderBy("-entryDate")
                        .limit(1)
                        .list()
                )[0]?.orderId
        )
        const revision = () => String(one("mantle.order.OrderHeader", {orderId}).orderRevision)
        const add = (productId, quantity) =>
            asUser(users.otherRep, () =>
                page("Orders/OrderDetail/salesStoreLine", {orderId, orderRevision: revision(), productId, quantity}, "html")
            )
        add(priced, "2")
        const firstTax = taxOf(orderId)
        add(priced, "1")
        const secondTax = taxOf(orderId)
        const shipping = asUser(users.otherRep, () =>
            page(
                "Orders/OrderDetail/salesStoreLine",
                {orderId, orderRevision: revision(), itemTypeEnumId: "ItemShipping", unitAmount: "40"},
                "html"
            )
        )
        const shippingTax = taxOf(orderId)
        const header = one("mantle.order.OrderHeader", {orderId})
        const part = one("mantle.order.OrderPart", {orderId, orderPartSeqId: "01"})
        return {created, orderId, firstTax, secondTax, shippingTax, shipping, header, part}
    },
    then({created, orderId, firstTax, secondTax, shippingTax, header, part}) {
        opened(created)
        orderId != null
        header.productStoreId == null
        header.orderPurposeEnumId == "OrpSalesQuote"
        part.vendorPartyId == ids.otherOrganizationId
        // 2 × 400 at 6.1 %, then 1 × 400 more, then 40 of freight
        firstTax.eq(toDecimal("48.8"))
        secondTax.eq(toDecimal("73.2"))
        shippingTax.eq(toDecimal("75.64"))
    }
})

feature("the quote shows Products' explanation of the price, an unavailable price told apart from zero, and no cost", {
    when() {
        const revision = () => String(one("mantle.order.OrderHeader", {orderId}).orderRevision)
        const detail = asUser(users.otherRep, () => page("Orders/OrderDetail", {orderId}, "html"))
        const line = system(() =>
            Array.from(
                ec.entity.find("mantle.order.OrderItem").condition({orderId, productId: priced}).orderBy("orderItemSeqId").list()
            )
        )[0]
        const explained = asUser(users.otherRep, () =>
            page("Products/PriceExplain", {orderId, orderItemSeqId: line.orderItemSeqId}, "html")
        )
        const zeroAdded = asUser(users.otherRep, () =>
            lib.refusal("mantle.order.SalesQuoteServices.store#QuoteLine", {orderId, orderRevision: revision(), productId: zero})
        )
        const unpricedAdded = asUser(users.otherRep, () =>
            lib.refusal("mantle.order.SalesQuoteServices.store#QuoteLine", {
                orderId,
                orderRevision: revision(),
                productId: unpriced
            })
        )
        const zeroLine = system(() =>
            Array.from(ec.entity.find("mantle.order.OrderItem").condition({orderId, productId: zero}).list())
        )[0]
        return {detail, explained, zeroAdded, unpricedAdded, zeroLine}
    },
    then({detail, explained, zeroAdded, unpricedAdded, zeroLine}) {
        opened(detail)
        detail.output.includes("Tax by the seller")
        detail.output.includes("Explain price")
        !detail.output.includes("Standard estimate")
        !detail.output.includes("Margin")
        opened(explained)
        explained.output.includes("customer’s own price")
        zeroAdded == ""
        zeroLine.priceSource == "product-price"
        toDecimal(zeroLine.unitAmount).isZero()
        unpricedAdded.includes("PRICE_UNAVAILABLE")
    }
})

feature("Projects', Accounting's, Purchasing's, Customer Service's and Commerce's order contexts read as before", {
    when() {
        const first = (entity, condition) =>
            system(() => Array.from(ec.entity.find(entity).condition(condition).limit(1).list()))[0]?.orderId || null
        const projectOrder = system(
            () =>
                Array.from(ec.entity.find("mantle.order.OrderItemWorkEffort").selectField("orderId").limit(1).list())[0]
                    ?.orderId || null
        )
        const purchaseOrder = first("mantle.order.OrderHeaderAndPart", {
            customerPartyId: "ORG_ZIZI_RETAIL",
            statusId: "OrderApproved"
        })
        const storeOrder = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.order.OrderHeader")
                        .condition("productStoreId", "is-not-null", null)
                        .condition("statusId", "in", ["OrderPlaced", "OrderApproved", "OrderCompleted"])
                        .limit(1)
                        .list()
                )[0]?.orderId || null
        )
        const contexts = [
            ["Projects", "Billing/OrderDetail", projectOrder],
            ["Accounting", "Records/OrderDetail", "BOSS_ACCT_SO_HELD"],
            ["Purchasing", "Orders/OrderDetail", purchaseOrder],
            ["CustomerService", "Orders/OrderDetail", storeOrder],
            ["Commerce", "Orders/OrderDetail", storeOrder]
        ]
        return {
            rendered: contexts
                .filter(([, , id]) => id)
                .map(([root, path, id]) => {
                    const out = asUser(users.system, () => page(path, {orderId: id}, "html", root))
                    return {root, opened: opened(out), quoteContext: out.output.includes("it is not a sales quote or order")}
                })
        }
    },
    then({rendered}) {
        // each context with a demo order of its kind (a purchase order may be missing from a demo without one)
        rendered.length >= 4
        rendered.every(row => row.opened && !row.quoteContext)
    }
})
