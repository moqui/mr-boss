// A quote's send dialog (impl-sales P10; design-sales §5 QuoteSend; screen/Sales/Orders/QuoteSend.xml): the one html render of
// QuoteSend once the rep's quote was issued, with the stored PDF's name, its recipient and that it was issued already (a second
// send resends the stored PDF, never another issue). The rules are Mantle's SalesQuoteIssue and SalesQuoteResponse; OrderDetail's
// actions are in SalesQuotes' one qvt render. Demo data: Retail East's Wingtip Traders and its contact Dana Morales.
// Run: ./moq test mr-boss --spec SalesQuoteSend
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, invoke} = lib
const Q = "mantle.order.SalesQuoteServices."
const I = "mantle.order.SalesQuoteIssueServices."
const capture = ec.factory.getTool("MailCapture")

spec({
    setupSpec() {
        capture.enable()
    },
    cleanupSpec() {
        capture.reset()
    }
})

feature("QuoteSend shows an issued quote's stored PDF and its recipient, to be sent again", {
    when() {
        const revisionOf = orderId =>
            Number(ec.entity.find("mantle.order.OrderHeader").condition("orderId", orderId).disableAuthz().one().orderRevision)
        // the rep's own calls, as Sales' screens would make them (the services check the rep's permissions and scope themselves)
        const made = asUser(users.rep, () =>
            lib.system(() => {
                const orderId = invoke(Q + "create#Quote", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    orderName: "Wingtip shelving"
                }).orderId
                invoke(Q + "store#QuoteLine", {orderId, orderRevision: revisionOf(orderId), productId: "DEMO_1_1", quantity: 2})
                invoke(Q + "propose#Quote", {orderId, orderRevision: revisionOf(orderId)})
                const sent = invoke(I + "send#Quote", {
                    orderId,
                    orderRevision: revisionOf(orderId),
                    sendMode: "organization",
                    operationKey: "sqsend-" + ec.user.randomString(16)
                })
                // Retail's quote is taxed at Wingtip's Utah address, which create#Quote took (Marketing follow-up 1's nexus)
                const taxLines = ec.entity
                    .find("mantle.order.OrderItem")
                    .condition({orderId, itemTypeEnumId: "ItemSalesTax"})
                    .disableAuthz()
                    .count()
                const part = ec.entity.find("mantle.order.OrderPart").condition({orderId}).disableAuthz().one()
                return {orderId, sent, revision: revisionOf(orderId), taxLines, address: part.postalContactMechId}
            })
        )
        const dialog = asUser(users.rep, () => lib.page("Orders/QuoteSend", {orderId: made.orderId}, "html"))
        return {made, dialog}
    },
    then({made, dialog}) {
        made.sent.newIssue == true
        made.address == "BOSS_SAL_WINGTIP_ADDR"
        made.taxLines > 0
        dialog.errors.length == 0
        dialog.output.includes("was issued already")
        dialog.output.includes("Quote-" + made.orderId + "-r" + made.revision + ".pdf")
        dialog.output.includes("Dana Morales")
        dialog.output.includes("Send quote " + made.orderId + " to the recipients checked?")
    }
})
