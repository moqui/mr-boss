// Sales' quote screens (impl-sales P7; design-sales §5, §7): OrderDetail's one qvt render in Sales' quote context (template/
// SalesOrderDetail.xml: the record header with Add line, the lines with their price source, the entered price's basis and reason,
// no cost, the storeless seller's tax through its gateway, Conversation and Files) and its "not available" for another
// organization's rep; Quotes' one html render (the rep's quotes, not another organization's, the saved lists, New quote); and
// PriceExplain's one html render for a rep without PRICE_VIEW (the quote line's safe explanation, no trace form). The rules are
// Mantle's SalesQuoteDrafts and StorelessOrderTax. Demo data: data/BossZSalesDemoData.xml (P7 block).
// Run: ./moq test mr-boss --spec SalesQuotes
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, page} = lib
const {quotes} = ids

feature(
    "OrderDetail shows the rep's quote in Sales' context; the storeless seller's quote is taxed; another organization's is not available",
    {
        when() {
            return {
                own: asUser(users.rep, () => page("Orders/OrderDetail", {orderId: quotes.wingtip})),
                storeless: asUser(users.otherRep, () => page("Orders/OrderDetail", {orderId: quotes.fabrikam}, "html")),
                other: asUser(users.otherRep, () => page("Orders/OrderDetail", {orderId: quotes.wingtip}, "html"))
            }
        },
        then({own, storeless, other}) {
            own.errors.length == 0
            own.output.includes("Quote BOSS_SAL_QTE_WINGTIP")
            own.output.includes("Wingtip store refit")
            own.output.includes("Wingtip Traders")
            own.output.includes("Add line")
            own.output.includes("Demo Product One-One")
            // the entered price keeps its basis and reason; the customer price is the line's source
            own.output.includes("Bundled with the refit")
            own.output.includes("Entered price")
            own.output.includes("Explain price")
            own.output.includes("No tax: the seller has no tax gateway")
            own.output.includes("SalesQuoteChatter")
            own.output.includes("SalesQuoteFiles")
            // P9: the Approval box, Retail's discount rule met by the entered refit price
            own.output.includes("Discount at or beyond")
            // P10: a draft with lines proposes as its primary; Print and Copy in More
            own.output.includes("Propose")
            own.output.includes("Copy as a new quote")
            own.output.includes("Print (PDF)")
            !own.output.includes("Record acceptance")
            !own.output.includes("Standard estimate")
            !own.output.includes("Margin")
            storeless.errors.length == 0
            storeless.output.includes("Tax by the seller")
            storeless.output.includes("Freight")
            // 2 × 1,200 + 450 + 80 freight, taxed 6.1 %: 178.73 tax, 3,108.73 total
            storeless.output.includes("178.73")
            storeless.output.includes("3,108.73")
            other.output.includes("Quote or order BOSS_SAL_QTE_WINGTIP is not available")
            !other.output.includes("Demo Product One-One")
        }
    }
)

feature("Quotes lists the rep's quotes with the saved lists and New quote; another organization's quote is not listed", {
    when() {
        return {list: asUser(users.rep, () => page("Quotes/Quotes", {}, "html"))}
    },
    then({list}) {
        list.errors.length == 0
        list.output.includes("Wingtip store refit")
        !list.output.includes("Fabrikam line upgrade")
        list.output.includes("Expiring")
        list.output.includes("New quote")
    }
})

feature("PriceExplain explains a quote line's price to a rep without PRICE_VIEW, without the trace", {
    when() {
        return {
            explained: asUser(users.rep, () =>
                page("Products/PriceExplain", {orderId: quotes.wingtip, orderItemSeqId: "01"}, "html")
            )
        }
    },
    then({explained}) {
        explained.errors.length == 0
        explained.output.includes("Price of quote BOSS_SAL_QTE_WINGTIP line 01")
        explained.output.includes("customer’s own price")
        explained.output.includes("The full price trace is for price readers")
        !explained.output.includes("Transaction price context")
    }
})
