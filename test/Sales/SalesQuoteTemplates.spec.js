// Sales' quote template screens (impl-sales P12; design-sales §5 QuoteTemplates and QuoteTemplateDetail): QuoteTemplateDetail's one qvt
// render as the manager (the record header with the published state, Start successor and New quote, the lines with their pricing: One-
// Two's fixed bundle rate and its reason, the overview, the preview priced for Wingtip with its total, the history), and Quote templates'
// one html render as the rep (the published template listed, the manager's draft not, no New template). The rules are Mantle's
// SalesQuoteTemplates. Demo data: data/BossZSalesDemoData.xml (P12 block).
// Run: ./moq test mr-boss --spec SalesQuoteTemplates
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, page} = lib
const {templates} = ids

feature("QuoteTemplateDetail shows a published template to its manager with its preview; Quote templates lists it to a rep", {
    when() {
        return {
            detail: asUser(users.manager, () =>
                page("Quotes/QuoteTemplateDetail", {orderId: templates.refit, previewCustomerPartyId: ids.accounts.wingtip})
            ),
            list: asUser(users.rep, () => page("Quotes/QuoteTemplates", {}, "html"))
        }
    },
    then({detail, list}) {
        detail.errors.length == 0
        detail.output.includes("Store refit starter")
        detail.output.includes("Published")
        detail.output.includes("Start successor")
        detail.output.includes("New quote")
        detail.output.includes("Demo Product One-Two")
        detail.output.includes("Refit bundle rate")
        detail.output.includes("Priced on the quote's date")
        detail.output.includes("Installation and delivery")
        detail.output.includes("45 days")
        // the preview prices One-One at Wingtip's own price and keeps One-Two's fixed rate
        detail.output.includes("Wingtip Traders")
        detail.output.includes("Example total")
        // a published template is not changed in place: no line editing
        !detail.output.includes("Add shipping charge")
        list.errors.length == 0
        list.output.includes("Quote templates")
        list.output.includes("Store refit starter")
        !list.output.includes("Yearly service visit")
        !list.output.includes("New template")
    }
})

// P12 review: a template is never another app's order. Customer Service's order lookup (its palette and OrderDetail read the same
// record kind) finds neither the demo template's id nor its name for an agent of Retail.
feature("Customer Service's order lookup never finds a quote template", {
    when() {
        const cs = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
        const find = term =>
            cs.asUser(cs.users.agent, () =>
                cs.invoke("ironstone.customerservice.CaseServices.find#ServiceOrders", {term}).orders.map(row => row.orderId)
            )
        return {byId: find(templates.refit), byName: find("Store refit starter")}
    },
    then({byId, byName}) {
        byId.length == 0
        !byName.includes(templates.refit)
    }
})
