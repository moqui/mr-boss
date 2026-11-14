// Sales P10's "usable when" (impl-sales P10; design-sales §14.3 scenarios 6 and 7, the staff path; §5 OrderDetail's quote context):
// a rep proposes a quote and sends it to two of Wingtip's contacts through QuoteSend; the one with no email fails, gets an email, and
// a second send reaches that contact alone under the one issue; the rep records the customer's acceptance with their PO and sees one
// placed order at the one OrderDetail route; on a second quote, revising ends the old issue's authority and keeps its PDF, and an
// acceptance of the old issue is refused. Every step through the screens' transitions; the rules are Mantle's SalesQuoteIssue and
// SalesQuoteResponse. Placement goes through place#Order alone (respond#Quote), as Marketing's attribution expects.
// Run: ./moq accept mr-boss --spec SalesQuoteScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const capture = ec.factory.getTool("MailCapture")
const asService = (user, action) => asUser(user, () => system(action))
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const revisionOf = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision ?? 1)
const issuesOf = orderId => asService(users.rep, () => invoke("mantle.order.SalesQuoteIssueServices.get#QuoteIssues", {orderId}))
const unmailed = "BOSS_SAL_USABLE_" + run
const shared = {}

// a quote of sales.rep for Wingtip with one line at the customer's price, through Quotes and OrderDetail's transitions
function draft(name) {
    asUser(users.rep, () =>
        page(
            "Quotes/Quotes/createQuote",
            {
                organizationPartyId: ids.organizationId,
                customerPartyId: ids.accounts.wingtip,
                contactPartyId: ids.contacts.dana,
                orderName: name
            },
            "html"
        )
    )
    const orderId = asService(users.rep, () =>
        Array.from(invoke("mantle.order.SalesQuoteServices.find#Quotes", {text: name, state: "all"}).quoteList || [])
    )[0]?.orderId
    asUser(users.rep, () =>
        page(
            "Orders/OrderDetail/salesStoreLine",
            {orderId, orderRevision: revisionOf(orderId), productId: "DEMO_1_1", quantity: "3"},
            "html"
        )
    )
    return orderId
}
function send(orderId, recipientPartyIds) {
    return asUser(users.rep, () =>
        page(
            "Orders/QuoteSend/sendQuote",
            {
                orderId,
                orderRevision: revisionOf(orderId),
                recipientPartyIds: recipientPartyIds.join(","),
                sendMode: "organization",
                operationKey: "usable-" + ec.user.randomString(20)
            },
            "html"
        )
    )
}
function attempt(orderId) {
    const issueId = issuesOf(orderId).standingIssueId
    if (issueId) system(() => invoke("mantle.order.SalesQuoteIssueServices.attempt#QuoteDeliveries", {issueId}))
}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
        // a second contact of Wingtip with no email yet
        system(() => {
            invoke("create#mantle.party.Party", {partyId: unmailed, partyTypeEnumId: "PtyPerson"})
            invoke("create#mantle.party.Person", {partyId: unmailed, firstName: "Usable", lastName: "Buyer " + run})
            invoke("create#mantle.party.PartyRelationship", {
                fromPartyId: unmailed,
                toPartyId: ids.accounts.wingtip,
                relationshipTypeEnumId: "PrtContact",
                fromDate: ec.user.nowTimestamp
            })
        })
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("a rep proposes a quote and sends it to two contacts; the one with no email fails and a second send reaches it alone", {
    when() {
        const orderId = (shared.orderId = draft("Usable send " + run))
        const proposed = asUser(users.rep, () =>
            page("Orders/OrderDetail/salesProposeQuote", {orderId, orderRevision: revisionOf(orderId)}, "html")
        )
        const dialog = asUser(users.rep, () => page("Orders/QuoteSend", {orderId}, "html"))
        capture.clear()
        send(orderId, [ids.contacts.dana, unmailed])
        attempt(orderId)
        const first = issuesOf(orderId)
        system(() => {
            const mech = invoke("create#mantle.party.contact.ContactMech", {
                contactMechTypeEnumId: "CmtEmailAddress",
                infoString: "usable" + run + "@wingtip.example.test"
            })
            invoke("create#mantle.party.contact.PartyContactMech", {
                partyId: unmailed,
                contactMechId: mech.contactMechId,
                contactMechPurposeId: "EmailPrimary",
                fromDate: ec.user.nowTimestamp
            })
        })
        const firstMails = capture.count()
        capture.clear()
        send(orderId, [ids.contacts.dana, unmailed])
        attempt(orderId)
        const second = issuesOf(orderId)
        return {proposed, dialog, first, firstMails, mails: capture.getMessages(), second}
    },
    then({proposed, dialog, first, firstMails, mails, second}) {
        proposed.errors.length == 0
        dialog.output.includes("stores its PDF")
        first.issues.length == 1 && first.issues[0].failedCount == 1
        firstMails == 1
        mails.length == 1
        mails[0].toList.includes("usable" + run + "@wingtip.example.test")
        second.issues.length == 1 && second.issues[0].failedCount == 0
    }
})

feature("the rep records the customer's acceptance with their PO and sees one placed order at the one OrderDetail route", {
    when() {
        const orderId = shared.orderId
        const issueId = issuesOf(orderId).standingIssueId
        const accepted = asUser(users.rep, () =>
            page(
                "Orders/OrderDetail/salesRespondQuote",
                {
                    orderId,
                    issueId,
                    responseType: "accept",
                    contactPartyId: ids.contacts.dana,
                    otherPartyOrderId: "WT-PO-" + run,
                    operationKey: "usable-accept-" + run
                },
                "html"
            )
        )
        const again = asUser(users.rep, () =>
            page(
                "Orders/OrderDetail/salesRespondQuote",
                {
                    orderId,
                    issueId,
                    responseType: "accept",
                    contactPartyId: ids.contacts.dana,
                    otherPartyOrderId: "WT-PO-" + run,
                    operationKey: "usable-again-" + run
                },
                "html"
            )
        )
        const order = one("mantle.order.OrderHeader", {orderId})
        const detail = asUser(users.rep, () => page("Orders/OrderDetail", {orderId}, "html"))
        return {
            accepted,
            again,
            order,
            detail,
            part: one("mantle.order.OrderPart", {orderId, orderPartSeqId: "01"}),
            issues: issuesOf(orderId)
        }
    },
    then({accepted, again, order, detail, part, issues}) {
        accepted.errors.length == 0
        again.errors.length == 0
        order.statusId == "OrderPlaced"
        part.otherPartyOrderId == "WT-PO-" + run
        issues.issues[0].state == "accepted"
        detail.errors.length == 0
        detail.output.includes("Accepted")
    }
})

feature("revising a sent quote ends the old issue's authority and keeps its PDF", {
    when() {
        const orderId = draft("Usable revise " + run)
        asUser(users.rep, () =>
            page("Orders/OrderDetail/salesProposeQuote", {orderId, orderRevision: revisionOf(orderId)}, "html")
        )
        send(orderId, [ids.contacts.dana])
        const issueId = issuesOf(orderId).standingIssueId
        const revised = asUser(users.rep, () =>
            page(
                "Orders/OrderDetail/salesReviseQuote",
                {orderId, orderRevision: revisionOf(orderId), reason: "Customer wants five"},
                "html"
            )
        )
        const late = asService(users.rep, () =>
            lib.refusal("mantle.order.SalesQuoteIssueServices.respond#Quote", {
                orderId,
                issueId,
                responseType: "accept",
                operationKey: "usable-late-" + run
            })
        )
        const issue = one("mantle.sales.quote.SalesQuoteIssue", {issueId})
        const pdf = system(() => ec.resource.getLocationReference(issue.contentLocation).getExists())
        return {revised, late, issue, pdf, statusId: one("mantle.order.OrderHeader", {orderId}).statusId}
    },
    then({revised, late, issue, pdf, statusId}) {
        revised.errors.length == 0
        statusId == "OrderBeingChanged"
        issue.endReasonEnumId == "SqeRevised"
        late.includes("ISSUE_ENDED")
        pdf == true
    }
})
