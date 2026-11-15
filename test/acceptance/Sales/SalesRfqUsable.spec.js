// Sales P8's "usable when" (impl-sales P8; design-sales §5 QuoteRequests and QuoteRequestDetail, §6 the chargeable repair handoff):
// mail to the RFQ address becomes a request with its attachment, in East's queue; a rep gives it three lines and makes a quote from two
// of them and a second quote later from the third, through QuoteRequestDetail's transitions; a declined request tells the requester
// at the address the preview showed; a warranty claim whose decision is a chargeable repair becomes a quote, carrying none of the
// claim's fault, which Customer Service reads back on the claim. The rules are Mantle's SalesQuoteRequests and the BOSS
// SalesQuoteRequests; the demo rule and mailbox are data/BossZSalesDemoData.xml's P5 and P8 blocks.
// Run: ./moq accept mr-boss --spec SalesRfqUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const cs = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const rowsOf = (entity, condition) => system(() => Array.from(ec.entity.find(entity).condition(condition).list()))
const requestOf = emailMessageId =>
    rowsOf("mantle.request.RequestEmailMessage", {emailMessageId})
        .map(row => system(() => ec.entity.find("mantle.request.Request").condition("requestId", row.requestId).one()))
        .find(request => request?.requestTypeEnumId === "RqtQuote")
const state = {}
// a mail to the RFQ address, as the mailbox stores it, and the rule's action on it
function rfqMail(kind, withFile) {
    const emailMessageId = "SAL_RFQ_" + kind + "_" + run
    system(() => {
        call("create#moqui.basic.email.EmailMessage", {
            emailMessageId,
            emailAccountId: "BOSS_SAL_INTAKE_MAIL",
            statusId: "ES_RECEIVED",
            contentType: "text/plain",
            receivedDate: ec.user.nowTimestamp,
            messageDate: ec.user.nowTimestamp,
            isRead: "N",
            hasAttachment: withFile ? "Y" : "N",
            fromAddress: "buying@wingtip.example",
            fromName: "Wingtip Buying",
            toAddresses: "sales+rfq@retail.example",
            subject: "RFQ " + kind + " " + run,
            bodyText: "Please quote the attached list: shelving, a display unit and installation.",
            messageId: "<rfq-" + kind.toLowerCase() + "-" + run + "@wingtip.example>"
        })
        if (withFile) {
            const location = "dbresource://spec/sales-rfq/" + run + "/shelving-list.txt"
            ec.resource.getLocationReference(location).putText("20 shelving units, 1 display unit, installation")
            call("create#moqui.basic.email.EmailMessageAttachment", {
                emailMessageId,
                fileName: "shelving-list.txt",
                contentType: "text/plain",
                attachmentLocation: location,
                isInline: "N"
            })
        }
        call("mantle.order.SalesQuoteServices.create#QuoteRequestFromEmail", {
            emailMessageId,
            emailAccountId: "BOSS_SAL_INTAKE_MAIL",
            emailRuleId: "BOSS_SAL_RFQ_RULE",
            ruleOwnerUserId: "BOSS_SAL_MANAGER",
            value: "BOSS_SAL_TEAM_EAST"
        })
    })
    return emailMessageId
}
// a user's own service call, as Sales' screens make it: the services check the user's permissions and scope themselves
const asCall = (user, action) => asUser(user, () => system(action))
const detail = (requestId, user = users.rep) =>
    asCall(user, () => invoke("mantle.order.SalesQuoteServices.get#QuoteRequest", {requestId}))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        cs.closeWarrantyClaim(state.claimId)
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("mail to the RFQ address becomes a request with its attachment, in East's queue, for Wingtip", {
    when() {
        const emailMessageId = rfqMail("LIST", true)
        const request = requestOf(emailMessageId)
        state.requestId = request?.requestId
        return {
            request,
            files: rowsOf("mantle.request.RequestContent", {requestId: state.requestId || "-"}),
            shown: detail(state.requestId),
            list: asUser(users.rep, () => page("Quotes/QuoteRequests", {state: "awaiting"}, "html"))
        }
    },
    then({request, files, shown, list}) {
        request.statusId == "ReqSubmitted"
        files.some(file => file.description === "shelving-list.txt" && file.contentLocation)
        shown.quoteRequest.customerName == "Wingtip Traders"
        shown.quoteRequest.teamName.length > 0
        opened(list)
        list.output.includes("RFQ LIST " + run)
    }
})

feature("a rep makes a quote from two of its three lines and a second quote later from the third", {
    when() {
        const requestId = state.requestId
        const revision = () => detail(requestId).quoteRequest.requestRevision
        const add = (productId, quantity, description) =>
            asUser(users.rep, () =>
                page(
                    "Quotes/QuoteRequestDetail/rfqStoreItem",
                    {requestId, requestRevision: revision(), productId, quantity, description},
                    "html"
                )
            )
        add("DEMO_1_1", "20", "Shelving units")
        add("DEMO_1_2", "1", "Display unit")
        add("DEMO_1_1", "2", "Spare shelving")
        const first = asUser(users.rep, () =>
            page(
                "Quotes/QuoteRequestDetail/rfqCreateQuote",
                {requestId, requestRevision: revision(), operationKey: "rfq-usable-1-" + run, requestItemSeqIdList: "01,02"},
                "html"
            )
        )
        const afterFirst = detail(requestId)
        const second = asUser(users.rep, () =>
            page(
                "Quotes/QuoteRequestDetail/rfqCreateQuote",
                {requestId, requestRevision: revision(), operationKey: "rfq-usable-2-" + run, requestItemSeqIdList: "03"},
                "html"
            )
        )
        const shown = detail(requestId)
        return {first, second, afterFirst, shown, links: rowsOf("mantle.request.RequestItemOrder", {requestId})}
    },
    then({afterFirst, shown, links}) {
        afterFirst.quotes.length == 1
        afterFirst.quoteRequest.statusId == "ReqInProgress"
        shown.quotes.length == 2
        links.filter(link => link.orderId === afterFirst.quotes[0].orderId).length == 2
        links
            .filter(link => link.orderId !== afterFirst.quotes[0].orderId)
            .map(link => link.requestItemSeqId)
            .join() == "03"
        // still open for more quotes: nothing completed it
        shown.quoteRequest.statusId == "ReqInProgress"
    }
})

feature("a declined request tells its requester at the address the preview showed", {
    when() {
        const emailMessageId = rfqMail("DECLINE", false)
        const requestId = requestOf(emailMessageId).requestId
        const preview = asCall(users.rep, () =>
            invoke("mantle.order.SalesQuoteServices.preview#QuoteRequestDecline", {requestId})
        )
        const declined = asUser(users.rep, () =>
            page(
                "Quotes/QuoteRequestDetail/rfqDecline",
                {
                    requestId,
                    requestRevision: detail(requestId).quoteRequest.requestRevision,
                    reason: "Outside our delivery area",
                    notify: "Y",
                    toAddress: preview.toAddress,
                    messageText: "Thank you; we cannot quote this one."
                },
                "html"
            )
        )
        const filed = rowsOf("mantle.request.RequestEmailMessage", {requestId})
            .map(row =>
                system(() =>
                    ec.entity.find("moqui.basic.email.EmailMessage").condition("emailMessageId", row.emailMessageId).one()
                )
            )
            .filter(message => message && message.emailMessageId !== emailMessageId)
        return {
            preview,
            declined,
            filed,
            request: system(() => ec.entity.find("mantle.request.Request").condition("requestId", requestId).one())
        }
    },
    then({preview, filed, request}) {
        preview.canNotify == true
        preview.toAddress == "buying@wingtip.example"
        filed.length == 1
        filed[0].toAddresses == "buying@wingtip.example"
        filed[0].bodyText == "Thank you; we cannot quote this one."
        request.statusId == "ReqCancelled"
    }
})

feature("a warranty claim's chargeable line becomes a quote without its fault, which Customer Service reads on the claim", {
    when() {
        const claim = cs.warrantyClaim(cs.users.agent, {
            requestName: "Thermostat dead after a fall " + run,
            productId: cs.ids.serializedProductId,
            quantity: 1,
            faultText: "Dropped from the wall; the case is cracked"
        })
        state.claimId = claim.requestId
        const decided = cs.asUser(
            cs.users.agent,
            () =>
                invoke("mantle.request.WarrantyServices.decide#WarrantyClaim", {
                    requestId: claim.requestId,
                    claimRevision: claim.claimRevision,
                    decisionEnumId: "WdRejected",
                    reason: "Physical damage is not covered",
                    chargeEstimate: 95,
                    chargeCurrencyUomId: "USD"
                }),
            false
        )
        const repairs = asCall(users.rep, () =>
            invoke("mantle.order.SalesQuoteServices.find#QuoteRequests", {kind: "repair"})
        ).quoteRequestList
        const source = detail(claim.requestId)
        const quote = asCall(users.rep, () =>
            invoke("mantle.order.SalesQuoteServices.create#QuoteFromRequest", {
                requestId: claim.requestId,
                requestRevision: source.quoteRequest.requestRevision,
                operationKey: "rfq-usable-repair-" + run,
                items: [{requestItemSeqId: source.items[0].requestItemSeqId, unitAmount: "95", overrideReason: "Repair charge"}]
            })
        )
        const quoteRead = asCall(users.rep, () => invoke("mantle.order.SalesQuoteServices.get#Quote", {orderId: quote.orderId}))
        const serviceRead = cs.asUser(
            cs.users.agent,
            () => invoke("mantle.request.WarrantyServices.get#WarrantyClaim", {requestId: claim.requestId}),
            false
        )
        return {claim, decided, repairs, source, quote, quoteRead, serviceRead}
    },
    then({claim, repairs, source, quote, quoteRead, serviceRead}) {
        claim.error == ""
        Array.from(repairs).some(row => row.requestId === claim.requestId)
        !JSON.stringify(source).includes("cracked")
        quote.orderId != null
        quoteRead.quote.orderName == "Repair estimate"
        !JSON.stringify(quoteRead).includes("cracked")
        !JSON.stringify(quoteRead).includes("Physical damage")
        Array.from(serviceRead.salesQuotes).some(row => row.orderId === quote.orderId)
        // the claim stays Customer Service's: its decision is not superseded by the quote
        serviceRead.currentDecision != null
    }
})
