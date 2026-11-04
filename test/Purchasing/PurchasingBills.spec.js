// Purchasing's bills and matching (impl-purchasing P6; design-purchasing §10): BillList's views with amounts withheld from a
// reader (its one html render); InvoiceDetail's Purchasing context of a held bill, the release a buyer may ask for and the
// payments withheld from them (its one html render); MatchExceptions' held and received-not-billed views, the
// re-evaluation with a result per bill and the legacy backfill's preview for a match operator (its one html render); OrderDetail's bills with the actions by capability, Supplier360's bills and Home's
// held-bill count. The Mantle rules (the match, the hold, the release request, the prepayment and the match-exception
// notice) are mr-mantle's AccountingMatching and PurchaseBills specs; the access rules are PurchasingAccess's; the walk is
// the acceptance PurchasingBillsWalk. Run: ./moq test mr-boss --spec PurchasingBills
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, invoke, page, billFixture} = lib
const B = "ironstone.purchasing.BillServices."
const state = {}

spec({
    setupSpec() {
        state.held = billFixture("Spec bills held")
        state.open = billFixture("Spec bills open", false)
    }
})

feature("the bill list shows a view's bills with their match and hold; a reader sees the amounts withheld", {
    when() {
        const find = (user, parameters) =>
            asUser(user, () => invoke(B + "find#Bills", Object.assign({appRoot: "Purchasing"}, parameters)))
        const held = find(users.buyer, {view: "held", text: state.held.reference})
        const unmatched = find(users.buyer, {view: "unmatched", text: state.open.reference})
        const reader = find(users.read, {text: state.held.reference})
        const render = asUser(users.buyer, () => page("Bills/BillList", {view: "held"}, "html"))
        const row = (list, invoiceId) => Array.from(list.billRows || []).find(each => each.invoiceId === invoiceId) || {}
        return {
            heldRow: row(held, state.held.invoiceId),
            unmatched: Array.from(unmatched.billRows).map(each => each.invoiceId),
            readerRow: row(reader, state.held.invoiceId),
            render
        }
    },
    then({heldRow, unmatched, readerRow, render}) {
        heldRow.held == true
        heldRow.holdText.length > 0
        heldRow.matchText == "Exception"
        heldRow.orderText == state.held.orderId
        heldRow.totalText.includes("76")
        heldRow.unpaidText == "Withheld"
        unmatched == [state.open.invoiceId]
        readerRow.totalText == "Withheld"
        render.status == 200
        render.errors == []
        render.output.includes(state.held.invoiceId)
        render.output.includes("Upload supplier bill")
        render.output.includes("Supplier bills")
    }
})

feature("InvoiceDetail shows a held bill's holds and match exceptions; the buyer may ask to release, payments are withheld", {
    when() {
        const render = asUser(users.buyer, () => page("Bills/InvoiceDetail", {invoiceId: state.held.invoiceId}, "html"))
        const detail = user =>
            asUser(user, () => invoke(B + "get#BillDetail", {appRoot: "Purchasing", invoiceId: state.held.invoiceId})).bill
        return {render, buyer: detail(users.buyer), matcher: detail(users.buyMatch), reader: detail(users.read)}
    },
    then({render, buyer, matcher, reader}) {
        render.status == 200
        render.errors == []
        render.output.includes("Bill " + state.held.invoiceId)
        render.output.includes("Ask to release")
        render.output.includes("Payments are withheld")
        buyer.held == true
        buyer.holdRows[0].canRequestRelease == true
        buyer.exceptionRows.length > 0
        buyer.sourceRows[0].orderId == state.held.orderId
        buyer.actions.match == false
        buyer.paymentsVisible == false
        buyer.unpaidText == "Withheld"
        matcher.actions.match == true
        matcher.paymentsVisible == true
        reader.totalText == "Withheld"
        reader.holdRows[0].canRequestRelease == false
    }
})

feature("match exceptions list held bills and received lines not billed; the re-evaluation answers a result per bill", {
    when() {
        const find = parameters =>
            asUser(users.buyer, () =>
                invoke(
                    B + "find#MatchExceptions",
                    Object.assign({appRoot: "Purchasing", orderId: state.open.orderId}, parameters)
                )
            )
        const held = asUser(users.buyer, () =>
            invoke(B + "find#MatchExceptions", {appRoot: "Purchasing", view: "held", orderId: state.held.orderId})
        )
        const unbilled = find({view: "receivedNotBilled"})
        const evaluated = asUser(users.buyMatch, () =>
            invoke(B + "reevaluate#Matches", {appRoot: "Purchasing", invoiceIds: [state.held.invoiceId, "NO_SUCH_BILL"]})
        )
        const render = asUser(users.buyMatch, () =>
            page("Bills/MatchExceptions", {view: "held", orderId: state.held.orderId, legacyPreview: "Y"}, "html")
        )
        return {held: held.billRows, unbilled: unbilled.lineRows, evaluated, render}
    },
    then({held, unbilled, evaluated, render}) {
        render.status == 200
        render.errors == []
        render.output.includes(state.held.invoiceId)
        render.output.includes("Ask to release")
        render.output.includes("Link earlier bills")
        held.length == 1
        held[0].invoiceId == state.held.invoiceId
        held[0].canRequestRelease == true
        held[0].exceptionText.length > 0
        unbilled.length == 1
        unbilled[0].acceptedText == "7"
        unbilled[0].billedText == "0"
        evaluated.results.find(row => row.invoiceId == state.held.invoiceId).resultCode == "DONE"
        evaluated.results.find(row => row.invoiceId == "NO_SUCH_BILL").resultCode == "RECORD_UNAVAILABLE"
        evaluated.summary.startsWith("1 of 2 evaluated")
    }
})

feature("OrderDetail lists the order's bills, Supplier360 the supplier's, and Home counts the held bills", {
    when() {
        const order = asUser(users.buyer, () =>
            invoke(B + "get#OrderBills", {appRoot: "Purchasing", orderId: state.held.orderId})
        ).orderBills
        const supplier = asUser(users.buyer, () =>
            invoke(B + "get#SupplierBills", {appRoot: "Purchasing", vendorPartyId: ids.sharedSupplierId})
        ).supplierBills
        const home = asUser(users.buyer, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {appRoot: "Purchasing"}))
        return {order, supplier, counters: home.counters}
    },
    then({order, supplier, counters}) {
        order.billRows.map(row => row.invoiceId) == [state.held.invoiceId]
        order.actions.uploadBill == true
        order.actions.draftBill == false
        order.actions.prepayment == false
        order.paymentsVisible == false
        supplier.billRows.some(row => row.invoiceId == state.open.invoiceId)
        supplier.heldCount >= 1
        supplier.unpaidText == "Withheld"
        counters.heldCount >= 1
    }
})
