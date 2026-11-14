// Sales P12's "usable when" (impl-sales P12; design-sales §14.3 scenario 5, its template half; §5 QuoteTemplates and
// QuoteTemplateDetail): sales.manager starts a template in Quote templates, adds a line priced on the quote's date and a fixed-price
// line through the quote draft's line editor and publishes it; sales.rep starts a quote for Wingtip from it on QuoteTemplateDetail,
// priced for Wingtip today with the fixed line kept; the manager starts the successor, changes its quantity and publishes it, which
// ends the first template; the rep's first quote, its lines and its print are unchanged, and the next quote copies the successor.
// Every step through the screens' transitions; the rules are Mantle's SalesQuoteTemplates.
// Run: ./moq accept mr-boss --spec SalesTemplateUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const Q = "mantle.order.SalesQuoteServices."
const asService = (user, action) => asUser(user, () => system(action))
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const revisionOf = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision ?? 1)
const templateNamed = name =>
    asService(users.manager, () =>
        Array.from(invoke(Q + "find#QuoteTemplates", {text: name, state: "all"}).templateList || [])
    )[0]?.orderId
const quoteNamed = name =>
    asService(users.rep, () => Array.from(invoke(Q + "find#Quotes", {text: name, state: "all"}).quoteList || []))[0]?.orderId
const linesOf = orderId =>
    asService(users.rep, () =>
        Array.from(invoke(Q + "get#Quote", {orderId}).lines || []).map(line => [
            line.description,
            line.quantityText,
            line.unitText
        ])
    )
const printOf = orderId =>
    asService(users.rep, () => String(invoke("mantle.order.SalesQuoteIssueServices.get#QuotePrint", {orderId}).printHtml || ""))
const shared = {name: "Usable template " + run}

spec({
    stepwise: true,
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("a manager starts a template, adds a line priced on the quote's date and a fixed-price line, and publishes it", {
    when() {
        asUser(users.manager, () =>
            page(
                "Quotes/QuoteTemplates/createQuoteTemplate",
                {organizationPartyId: ids.organizationId, orderName: shared.name, templateValidityDays: "30"},
                "html"
            )
        )
        shared.template = templateNamed(shared.name)
        const line = values =>
            asUser(users.manager, () =>
                page(
                    "Quotes/QuoteTemplateDetail/salesStoreLine",
                    Object.assign({orderId: shared.template, orderRevision: revisionOf(shared.template)}, values),
                    "html"
                )
            )
        line({productId: "DEMO_1_1", quantity: "4"})
        line({productId: "DEMO_1_2", quantity: "1", unitAmount: "10000", overrideReason: "Usable bundle rate"})
        asUser(users.manager, () =>
            page(
                "Quotes/QuoteTemplateDetail/salesPublishTemplate",
                {orderId: shared.template, orderRevision: revisionOf(shared.template)},
                "html"
            )
        )
        return {
            detail: asUser(users.rep, () => page("Quotes/QuoteTemplateDetail", {orderId: shared.template}, "html"))
        }
    },
    then({detail}) {
        !!shared.template
        detail.errors.length == 0
        detail.output.includes(shared.name)
        detail.output.includes("Published")
        detail.output.includes("Usable bundle rate")
    }
})

feature("a rep starts a quote from it, priced for Wingtip today with the fixed line kept", {
    when() {
        asUser(users.rep, () =>
            page(
                "Quotes/QuoteTemplateDetail/createQuote",
                {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    templateOrderId: shared.template,
                    orderName: shared.name + " for Wingtip"
                },
                "html"
            )
        )
        shared.quote = quoteNamed(shared.name + " for Wingtip")
        shared.lines = linesOf(shared.quote)
        shared.print = printOf(shared.quote)
        return {header: one("mantle.order.OrderHeader", {orderId: shared.quote}), lines: shared.lines}
    },
    then({header, lines}) {
        header.parentOrderId == shared.template && header.orderPurposeEnumId == "OrpSalesQuote"
        lines.length == 2
        // Wingtip's own price of One-One (17.50) on the quote's date; One-Two at the template's fixed rate
        lines.some(line => line[0] == "Demo Product One-One" && line[2].includes("17.5"))
        lines.some(line => line[0] == "Demo Product One-Two" && line[2].includes("10,000"))
    }
})

feature(
    "the manager publishes a successor; the first quote and its print are unchanged and the next quote copies the successor",
    {
        when() {
            asUser(users.manager, () =>
                page("Quotes/QuoteTemplateDetail/salesSucceedTemplate", {orderId: shared.template}, "html")
            )
            const successor = asService(users.manager, () =>
                Array.from(
                    ec.entity
                        .find("mantle.order.OrderHeader")
                        .condition("parentOrderId", shared.template)
                        .condition("orderPurposeEnumId", "OrpSalesQuoteTemplate")
                        .list()
                )
            )[0]?.orderId
            const line = asService(users.manager, () =>
                Array.from(invoke(Q + "get#QuoteTemplate", {orderId: successor}).lines).find(row => row.productId == "DEMO_1_1")
            )
            asUser(users.manager, () =>
                page(
                    "Quotes/QuoteTemplateDetail/salesStoreLine",
                    {
                        orderId: successor,
                        orderRevision: revisionOf(successor),
                        orderItemSeqId: line.orderItemSeqId,
                        quantity: "6"
                    },
                    "html"
                )
            )
            asUser(users.manager, () =>
                page(
                    "Quotes/QuoteTemplateDetail/salesPublishTemplate",
                    {orderId: successor, orderRevision: revisionOf(successor)},
                    "html"
                )
            )
            asUser(users.rep, () =>
                page(
                    "Quotes/QuoteTemplateDetail/createQuote",
                    {
                        organizationPartyId: ids.organizationId,
                        customerPartyId: ids.accounts.wingtip,
                        templateOrderId: successor,
                        orderName: shared.name + " second"
                    },
                    "html"
                )
            )
            return {
                first: asService(users.manager, () => invoke(Q + "get#QuoteTemplate", {orderId: shared.template}).template),
                lines: linesOf(shared.quote),
                print: printOf(shared.quote),
                next: linesOf(quoteNamed(shared.name + " second"))
            }
        },
        then({first, lines, print, next}) {
            first.state == "ended"
            JSON.stringify(lines) == JSON.stringify(shared.lines)
            print.length > 0 && print == shared.print
            next.some(line => line[0] == "Demo Product One-One" && line[1] == "6")
        }
    }
)
