// Purchasing's RFQs and supplier quotes (impl-purchasing P11; design-purchasing §5): the RFQ list's views and its one html
// render (a requester refused); QuoteRequestDetail's one html render for the buyer with the invited suppliers and the answer,
// the reader's amounts withheld; the quote list's Expiring view and QuoteDetail's one html render, Publish price offered only to
// a supplier-price editor; and Home's RFQs-due and quotes-expiring counts with the Today source of RFQs due, a buyer's only.
// P12: QuoteComparison's and Award's one html render each, the quote's awards before an award, and a declined quote (marked a
// quote) left out of Purchase orders' Closed view (F-P11-8).
// The rules of RFQs, quotes and the price publish are Mantle's (mr-mantle test/order/Sourcing); the access cases are
// PurchasingAccess's; the usable-when walk is acceptance PurchasingSourcingWalk. Run: ./moq test mr-boss --spec PurchasingSourcing
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const S = "mantle.order.SourcingServices.",
    B = "ironstone.purchasing.SourcingServices."
const capture = ec.factory.getTool("MailCapture")
const state = {}
const dayMs = 24 * 60 * 60 * 1000

spec({
    setupSpec() {
        capture.enable()
        // Retail's RFQ of the buyer for DEMO_1_1, sent to Brightline and Ziddleman, its response date passed; Ziddleman's answer
        // valid three more days (inside the buying policy's warning days)
        asUser(
            users.buyer,
            () => {
                const requestId = invoke(S + "create#QuoteRequest", {
                    organizationPartyId: ids.organizationId,
                    requestName: "Spec sourcing widgets",
                    facilityId: ids.facilityId
                }).requestId
                invoke(S + "store#QuoteRequestItem", {requestId, productId: "DEMO_1_1", quantity: 5})
                for (const supplierPartyId of [ids.supplierId, ids.sharedSupplierId])
                    invoke(S + "store#QuoteInvitation", {requestId, supplierPartyId})
                state.sent = invoke(S + "send#QuoteRequest", {requestId, operationKey: "spec-src-" + Date.now()})
                invoke(S + "store#QuoteRequest", {
                    requestId,
                    responseRequiredDate: Number(ec.user.nowTimestamp) - dayMs
                })
                const quoteId = state.sent.supplierResults.find(row => row.supplierPartyId == ids.sharedSupplierId).orderId
                const line = Array.from(ec.entity.find("mantle.order.OrderItem").condition("orderId", quoteId).list())[0]
                invoke(S + "store#SupplierQuoteItem", {orderId: quoteId, orderItemSeqId: line.orderItemSeqId, unitAmount: 8.75})
                invoke(S + "store#SupplierQuote", {
                    orderId: quoteId,
                    otherPartyOrderId: "ZQ-1",
                    validThruDate: Number(ec.user.nowTimestamp) + 3 * dayMs,
                    salesChannelEnumId: "ScEmail",
                    evidenceText: "Email from Ziddleman"
                })
                state.requestId = requestId
                state.quoteId = quoteId
                state.lineSeqId = line.orderItemSeqId
                state.otherQuoteId = state.sent.supplierResults.find(row => row.supplierPartyId == ids.supplierId).orderId
            },
            false
        )
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("RFQs: the buyer's RFQ is due with one supplier answered; the list's one html render; a requester is refused", {
    when() {
        const due = asUser(users.buyer, () => invoke(B + "find#QuoteRequests", {view: "due", pageSize: 100}))
        const row = (due.rfqRows || []).find(rfq => rfq.requestId == state.requestId) || {}
        const rendered = asUser(users.buyer, () => page("Sourcing/QuoteRequests", {view: "due"}, "html"))
        const requester = asUser(users.requester, () => lib.refusal(B + "find#QuoteRequests", {}))
        return {sent: state.sent, row, rendered, requester}
    },
    then({sent, row, rendered, requester}) {
        sent.sentCount == 2
        row.respondedText == "1 of 2"
        row.statusText == "Sent"
        row.overdue == true
        rendered.errors.join(" | ") == ""
        rendered.output.includes("Requests for quotation")
        rendered.output.includes("Spec sourcing widgets")
        requester.includes("PERMISSION_DENIED")
    }
})

feature("QuoteRequestDetail: the buyer's one html render with the suppliers and the answer; the reader's amounts withheld", {
    when() {
        const rendered = asUser(users.buyer, () => page("Sourcing/QuoteRequestDetail", {requestId: state.requestId}, "html"))
        const reader = asUser(users.read, () => invoke(B + "get#QuoteRequest", {requestId: state.requestId}).rfq)
        return {rendered, reader}
    },
    then({rendered, reader}) {
        rendered.errors.join(" | ") == ""
        rendered.output.includes("Brightline")
        rendered.output.includes("Quoted")
        rendered.output.includes("Invite supplier")
        reader.invitationRows.length == 2
        reader.responseRows[0].amountText == "Withheld"
        reader.canSend == false
        reader.canEdit == false
        reader.publishedRows.length == 1
    }
})

feature("Quotes: the answer is in Expiring; QuoteDetail's one html render; Publish price for a supplier-price editor only", {
    when() {
        const expiring = asUser(users.buyer, () => invoke(B + "find#SupplierQuotes", {view: "expiring", pageSize: 100}))
        const rendered = asUser(users.buyer, () => page("Sourcing/QuoteDetail", {orderId: state.quoteId}, "html"))
        const buyer = asUser(users.buyer, () => invoke(B + "get#SupplierQuote", {orderId: state.quoteId}).quote)
        const reader = asUser(users.read, () => invoke(B + "get#SupplierQuote", {orderId: state.quoteId}).quote)
        return {expiring: (expiring.quoteRows || []).map(row => row.orderId), rendered, buyer, reader}
    },
    then({expiring, rendered, buyer, reader}) {
        expiring.includes(state.quoteId)
        rendered.errors.join(" | ") == ""
        rendered.output.includes("ZQ-1")
        rendered.output.includes("Email from Ziddleman")
        !rendered.output.includes("Publish price")
        buyer.canPublish == false
        buyer.lineRows[0].priceText.includes("8.75")
        reader.lineRows[0].priceText == "Withheld"
        reader.canEdit == false
    }
})

feature("Home counts RFQs due and quotes expiring; Today lists the RFQ due for a buyer only", {
    when() {
        const home = asUser(users.buyer, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {}).counters)
        const today = user =>
            asUser(user, () =>
                Array.from(invoke(B + "get#TodayItems", {userId: ec.user.userId}).items || []).map(item => item.requestId)
            )
        return {home, buyer: today(users.buyer), reader: today(users.read)}
    },
    then({home, buyer, reader}) {
        home.quoteDueCount >= 1
        home.quoteExpiringCount >= 1
        buyer.includes(state.requestId)
        reader.length == 0
    }
})

feature(
    "QuoteComparison's and Award's one html render; no award yet on the quote; a declined quote stays out of Purchase orders",
    {
        when() {
            const compared = asUser(users.buyer, () => page("Sourcing/QuoteComparison", {requestId: state.requestId}, "html"))
            const item = Array.from(
                ec.entity.find("mantle.request.RequestItem").condition("requestId", state.requestId).disableAuthz().list()
            )[0]
            const allocationsText = [state.quoteId, state.lineSeqId, item.requestItemSeqId, "5"].join(":")
            const award = asUser(users.buyer, () => page("Sourcing/Award", {requestId: state.requestId, allocationsText}, "html"))
            const awards = asUser(users.buyer, () =>
                invoke("ironstone.purchasing.AwardServices.get#QuoteAwards", {orderId: state.quoteId})
            )
            asUser(
                users.buyer,
                () =>
                    invoke(S + "store#QuoteInvitation", {
                        requestId: state.requestId,
                        orderId: state.otherQuoteId,
                        declined: true,
                        reason: "No stock"
                    }),
                false
            )
            const closed = asUser(users.buyer, () =>
                invoke("ironstone.purchasing.OrderServices.find#PurchaseOrders", {view: "closed", text: state.otherQuoteId})
            )
            const marked = ec.entity
                .find("mantle.order.OrderHeader")
                .condition("orderId", state.otherQuoteId)
                .disableAuthz()
                .one()
            return {compared, award, awards, closedIds: Array.from(closed.orderRows || []).map(row => row.orderId), marked}
        },
        then({compared, award, awards, closedIds, marked}) {
            compared.errors.join(" | ") == ""
            compared.output.includes("Compare quotes")
            compared.output.includes("Awaiting the supplier")
            compared.output.includes("8.75")
            award.errors.join(" | ") == ""
            award.output.includes("Review the award")
            award.output.includes("Place 1 quote")
            awards.awardState == "open"
            marked.statusId == "OrderRejected"
            marked.supplierQuote == "Y"
            !closedIds.includes(state.otherQuoteId)
        }
    }
)
