// Sales' requests for quote in BOSS (impl-sales P8; design-sales §1.4 Comms hooks, §5 QuoteRequests and QuoteRequestDetail): Create RFQ
// on a mail message, offered beside Create lead in Mail's message-actions slot (and on a chat message) and posted through Mail's
// createRecord and Comms' create-from provider, makes a request of sales.rep's with the message on it and answers the same request
// again; a Sales user who cannot read the message is refused as for a missing one, before anything is written, and another app's user
// is refused; QuoteRequestDetail's one qvt render in Sales' context (the record header with Create quote, the lines, the line with no
// product, Conversation and Files), its record link under Sales, and its "not available" for another organization's rep and in
// Commons' requests for its own rep; RFQs' one html render (the rep's requests
// with the mailed one in East's queue, the saved lists, New request). The rules are Mantle's SalesQuoteRequests; the demo requests are
// data/BossZSalesDemoData.xml's P8 block.
// Run: ./moq test mr-boss --spec SalesQuoteRequests
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, page} = lib
const {rfqs} = ids
const comms = "component://mr-boss/screen/Comms.xml"
const MESSAGE = "BOSS_SAL_SPEC_RFQ"

function post(path, parameters) {
    const result = ec.screen
        .makeTest()
        .rootScreen(comms)
        .render(path, parameters || {}, "post")
    let json = null
    try {
        json = JSON.parse(String(result.output || ""))
    } catch (error) {
        json = null
    }
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors, json: json || {}}
}
function extActions(path) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("extItems/apps/" + path, {}, null)
    ec.message.clearErrors()
    try {
        return Array.from(JSON.parse(String(result.output || "{}")).actions || []).map(action => action.name)
    } catch (error) {
        return []
    }
}
const linkOf = id => ({recordEntityName: "mantle.request.Request", id})
// the requests for quote a message is on
const requestsOf = emailMessageId =>
    system(() =>
        Array.from(ec.entity.find("mantle.request.RequestEmailMessage").condition("emailMessageId", emailMessageId).list())
            .map(row => ec.entity.find("mantle.request.Request").condition("requestId", row.requestId).one())
            .filter(request => request && request.requestTypeEnumId === "RqtQuote")
    )

spec({
    setupSpec() {
        login("john.doe")
        system(() =>
            call("store#moqui.basic.email.EmailMessage", {
                emailMessageId: MESSAGE,
                emailAccountId: "BOSS_SAL_INTAKE_MAIL",
                statusId: "ES_RECEIVED",
                contentType: "text/plain",
                receivedDate: ec.user.nowTimestamp,
                messageDate: ec.user.nowTimestamp,
                isRead: "N",
                hasAttachment: "N",
                fromAddress: "buying@wingtip.example",
                fromName: "Wingtip Buying",
                toAddresses: "sales@retail.example",
                subject: "Fwd: Price for 6 gondola ends",
                bodyText: "Could you quote six gondola end units for the spring reset?",
                messageId: "<spec-gondola@wingtip.example>",
                rootEmailMessageId: MESSAGE
            })
        )
    }
})

feature("Create RFQ on a mail message makes the rep's request with the message on it, once; who cannot read it files nothing", {
    when() {
        const offered = asUser(users.rep, () => extActions("Comms/Inbox/Mail"))
        const chatOffered = asUser(users.rep, () => extActions("Comms/Chat"))
        // sales.rep3 (Ziziwork Sales) does not read the intake mailbox: refused as for a message that is not there, nothing written
        const unread = asUser(users.otherRep, () =>
            post("Inbox/Mail/createRecord", {kind: "quoteRequest", emailMessageId: MESSAGE})
        )
        const missing = asUser(users.otherRep, () =>
            post("Inbox/Mail/createRecord", {kind: "quoteRequest", emailMessageId: "BOSS_SAL_SPEC_NONE"})
        )
        const beforeRep = requestsOf(MESSAGE).length
        const refused = asUser(users.otherApp, () =>
            post("Inbox/Mail/createRecord", {kind: "quoteRequest", emailMessageId: MESSAGE})
        )
        const made = asUser(users.rep, () => post("Inbox/Mail/createRecord", {kind: "quoteRequest", emailMessageId: MESSAGE}))
        const again = asUser(users.rep, () => post("Inbox/Mail/createRecord", {kind: "quoteRequest", emailMessageId: MESSAGE}))
        const requestId = made.json.recordId || "-"
        const parties = system(() =>
            Array.from(ec.entity.find("mantle.request.RequestParty").condition("requestId", requestId).list()).map(
                row => row.roleTypeId + ":" + row.partyId
            )
        )
        return {
            offered,
            chatOffered,
            unread,
            missing,
            beforeRep,
            refused,
            made,
            again,
            requestId,
            parties,
            after: requestsOf(MESSAGE)
        }
    },
    then(r) {
        r.offered.includes("sales.createLead")
        r.offered.includes("sales.createRfq")
        r.chatOffered.includes("sales.createRfq")
        r.unread.errors.includes("is not available")
        r.missing.errors.includes("is not available")
        r.beforeRep == 0
        r.refused.errors.length > 0
        r.made.errors == ""
        r.made.json.recordEntityName == "mantle.request.Request"
        r.made.json.url.includes("/Sales/Quotes/QuoteRequestDetail?requestId=" + r.requestId)
        r.again.json.recordId == r.requestId
        r.again.json.messageInfos[0].message.includes("Already request for quote")
        r.after.length == 1
        r.after[0].requestName == "Price for 6 gondola ends"
        r.parties.includes("OrgInternal:" + ids.organizationId)
        r.parties.includes("SalesRepresentative:BOSS_SAL_REP")
        // the sender is Wingtip's own address: Wingtip is the customer, no party made
        r.parties.includes("Customer:" + ids.accounts.wingtip)
    }
})

feature("QuoteRequestDetail shows the rep's request in Sales' context; another organization's rep is told it is not available", {
    when() {
        return {
            own: asUser(users.rep, () => page("Quotes/QuoteRequestDetail", {requestId: rfqs.wingtip})),
            other: asUser(users.otherRep, () => page("Quotes/QuoteRequestDetail", {requestId: rfqs.wingtip}, "html")),
            // a record link (the palette, Chatter's record chip) opens it under Sales for its rep and nowhere for another's
            link: asUser(users.rep, () =>
                system(() => lib.invoke("ironstone.commons.PaletteServices.get#RecordLink", linkOf(rfqs.wingtip)).url)
            ),
            otherLink: asUser(users.otherRep, () =>
                system(() => lib.invoke("ironstone.commons.PaletteServices.get#RecordLink", linkOf(rfqs.wingtip)).url)
            ),
            // the request is Sales' alone: its own rep finds it in no Commons list and Commons' request (and Projects') refuses it
            commons: asUser(users.rep, () =>
                system(() =>
                    lib.invoke("ironstone.commons.RequestServices.get#RequestAccess", {requestId: rfqs.wingtip, need: "check"})
                )
            ),
            commonsList: asUser(users.rep, () =>
                system(() =>
                    Array.from(
                        lib.invoke("ironstone.commons.RequestServices.find#RequestRows", {list: "all", pageSize: 500}).rowList ||
                            []
                    ).map(row => row.requestId)
                )
            )
        }
    },
    then({own, other, link, otherLink, commons, commonsList}) {
        commons.visible == false
        !commonsList.includes(rfqs.wingtip)
        String(link).includes("/Sales/Quotes/QuoteRequestDetail?requestId=" + rfqs.wingtip)
        !otherLink
        own.errors.length == 0
        own.output.includes("RFQ BOSS_SAL_RFQ_WINGTIP")
        own.output.includes("Wingtip stockroom shelving")
        own.output.includes("Wingtip Traders")
        own.output.includes("Create quote")
        own.output.includes("Demo Product One-One")
        own.output.includes("Delivery and installation")
        own.output.includes("No product yet")
        own.output.includes("Decline")
        own.output.includes("SalesRfqChatter")
        own.output.includes("SalesRfqFiles")
        // no case or SLA actions of the Commons or Customer Service request
        !own.output.includes("Reassign")
        other.output.includes("Request not available")
        !other.output.includes("Wingtip stockroom shelving")
    }
})

feature("RFQs lists the rep's requests, the mailed one in East's queue, with the saved lists and New request", {
    when() {
        return {list: asUser(users.rep, () => page("Quotes/QuoteRequests", {}, "html")), mailed: requestsOf(rfqs.mailMessage)}
    },
    then({list, mailed}) {
        list.errors.length == 0
        list.output.includes("Wingtip stockroom shelving")
        mailed.length == 1
        list.output.includes("Quote for checkout counters")
        list.output.includes("Awaiting a response")
        list.output.includes("Repairs to quote")
        list.output.includes("New request")
    }
})
