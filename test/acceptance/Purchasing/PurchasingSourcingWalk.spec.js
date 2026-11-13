// Purchasing P11's "usable when" (impl-purchasing P11; design §5 QuoteRequests, QuoteRequestDetail, Quotes and QuoteDetail),
// through the screens' transitions with artifact authorization on and the mail capture on: an RFQ made from an approved
// purchase request's line in RequestSourcing goes to three suppliers as three requested quotes; the supplier with a bad
// address is named and the other two are sent, and the published RFQ's PDF is on the RFQ; a material edit after the send
// needs a new send and the earlier RFQ prints as of its send time; a buyer enters two suppliers' prices on their quotes with
// their evidence, a price change shows in the line's history and an expired quote shows but cannot be placed; publishing a
// quoted price makes the supplier price with the quote's dates, and the buyer, without supplier-price edit, is refused; and the
// RFQ is in no Commons or Projects request list, and the palette opens it in QuoteRequestDetail.
// Run: ./moq accept mr-boss --spec PurchasingSourcingWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0]
const B = "ironstone.purchasing.SourcingServices."
const capture = ec.factory.getTool("MailCapture")
const detailPath = "Sourcing/QuoteRequestDetail/"
const quotePath = "Sourcing/QuoteDetail/"
const badSupplier = "BOSS_PUR_WALK_SUP_BAD"
const priceEditorGroup = "BOSS_PRODUCTS_SUPPLIER_PRICE_EDIT"
const dayMs = 24 * 60 * 60 * 1000
const state = {name: "Walk sourcing " + Date.now()}
// a transition of a screen as the user posts it: its status and errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Purchasing/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const quoteOf = supplierPartyId =>
    [...new Set(rows("mantle.request.RequestItemOrder", {requestId: state.rfqId}).map(row => row.orderId))].find(
        orderId => one("mantle.order.OrderPart", {orderId}).vendorPartyId == supplierPartyId
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        capture.enable()
        system(() => {
            // a third supplier of Retail's whose order address is not an address
            if (!one("mantle.party.Party", {partyId: badSupplier})) {
                invoke("create#mantle.party.Party", {
                    partyId: badSupplier,
                    partyTypeEnumId: "PtyOrganization",
                    ownerPartyId: ids.organizationId
                })
                invoke("create#mantle.party.Organization", {partyId: badSupplier, organizationName: "Walk Bad Address Supply"})
                invoke("create#mantle.party.PartyRole", {partyId: badSupplier, roleTypeId: "Supplier"})
                invoke("create#mantle.party.contact.ContactMech", {
                    contactMechId: badSupplier + "_EMAIL",
                    contactMechTypeEnumId: "CmtEmailAddress",
                    infoString: "orders-at-walk-bad"
                })
                invoke("create#mantle.party.contact.PartyContactMech", {
                    partyId: badSupplier,
                    contactMechId: badSupplier + "_EMAIL",
                    contactMechPurposeId: "EmailOrder",
                    fromDate: "2000-01-01 00:00:00"
                })
            }
            // the purchasing administrator also edits supplier prices (Products' group), so publishes the quoted price
            if (!one("moqui.security.UserGroupMember", {userGroupId: priceEditorGroup, userId: "BOSS_PUR_ADMIN"}))
                invoke("create#moqui.security.UserGroupMember", {
                    userGroupId: priceEditorGroup,
                    userId: "BOSS_PUR_ADMIN",
                    fromDate: "2000-01-01 00:00:00"
                })
        })
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an RFQ from an approved request goes to three suppliers; the bad address is named, two are sent, the PDF is on the RFQ",
    {
        when() {
            // the requester's request of DEMO_1_1, approved
            post(users.requester, "NewPurchaseRequest/createRequest", {
                organizationPartyId: ids.organizationId,
                requestName: state.name,
                facilityId: ids.facilityId
            })
            state.requestId = rows("mantle.request.Request", {requestName: state.name})[0]?.requestId
            post(users.requester, "Requests/RequestDetail/storePurchaseRequestItem", {
                requestId: state.requestId,
                productId: "DEMO_1_1",
                quantity: "20"
            })
            post(users.requester, "Requests/RequestDetail/submitPurchaseRequest", {requestId: state.requestId})
            post(users.approve, "Requests/RequestDetail/decidePurchaseRequest", {requestId: state.requestId, decision: "approve"})
            // RequestSourcing's RFQ route makes the RFQ of the line
            const sourcing = asUser(users.buyer, () => page("Requests/RequestSourcing", {requestId: state.requestId}, "html"))
            const created = post(users.buyer, "Requests/RequestSourcing/requestQuotes", {
                rfqItemKeys: state.requestId + ":01",
                rfqName: state.name + " RFQ"
            })
            state.rfqId = rows("mantle.request.Request", {requestName: state.name + " RFQ"})[0]?.requestId
            const invited = [ids.supplierId, ids.sharedSupplierId, badSupplier].map(supplierPartyId =>
                post(users.buyer, detailPath + "inviteSupplier", {requestId: state.rfqId, supplierPartyId})
            )
            capture.clear()
            const sent = post(users.buyer, detailPath + "sendRfq", {
                requestId: state.rfqId,
                operationKey: "walk-rfq-" + Date.now()
            })
            state.firstSendAt = Number(ec.user.nowTimestamp)
            const quotes = [ids.supplierId, ids.sharedSupplierId, badSupplier].map(quoteOf)
            const emails = quotes.map(orderId => rows("mantle.order.OrderEmailMessage", {orderId}).length)
            const items = rows("mantle.request.RequestItem", {requestId: state.rfqId})
            const assoc = rows("mantle.request.RequestItemAssoc", {requestId: state.rfqId})
            return {
                sourcing,
                created,
                invited,
                sent,
                mails: capture.count(),
                quotes,
                statuses: quotes.map(orderId => one("mantle.order.OrderHeader", {orderId})?.statusId),
                emails,
                items,
                assoc,
                published: rows("mantle.request.RequestContent", {
                    requestId: state.rfqId,
                    contentTypeEnumId: "RqCntRfqPublished"
                }),
                rfq: one("mantle.request.Request", {requestId: state.rfqId})
            }
        },
        then(r) {
            r.sourcing.output.includes("Ask suppliers for quotes")
            r.created.errors == ""
            !!state.rfqId
            r.items.length == 1
            Number(String(r.items[0].quantity)) == 20
            r.assoc.length == 1
            r.assoc[0].otherRequestId == state.requestId
            r.invited.every(row => row.errors == "")
            r.statuses.every(status => status == "OrderRequested")
            r.sent.errors == ""
            r.mails == 2
            r.emails[0] == 1
            r.emails[1] == 1
            r.emails[2] == 0
            r.published.length == 1
            r.rfq.statusId == "ReqSubmitted"
            r.rfq.requestTypeEnumId == "RqtPurchaseRfq"
        }
    }
)

feature("a material edit after the send needs a new send, and the earlier RFQ prints as of its send time", {
    when() {
        const item = rows("mantle.request.RequestItem", {requestId: state.rfqId})[0]
        const edited = post(users.buyer, detailPath + "storeRfqItem", {
            requestId: state.rfqId,
            requestItemSeqId: item.requestItemSeqId,
            quantity: "24",
            changeReason: "Two more boxes"
        })
        const changed = asUser(users.buyer, () => invoke(B + "get#QuoteRequest", {requestId: state.rfqId}).rfq)
        // the print as of the first send, as QuoteRequestDetail's printRfq transition renders it (the Mantle service, which
        // the screen calls after its record check)
        const earlier = asUser(
            users.buyer,
            () =>
                invoke("mantle.order.SourcingServices.get#QuoteRequestPrint", {
                    requestId: state.rfqId,
                    asOfDate: state.firstSendAt
                }),
            false
        )
        capture.clear()
        const resent = post(users.buyer, detailPath + "sendRfq", {
            requestId: state.rfqId,
            operationKey: "walk-rfq2-" + Date.now()
        })
        const after = asUser(users.buyer, () => invoke(B + "get#QuoteRequest", {requestId: state.rfqId}).rfq)
        return {edited, changed, earlier, resent, mails: capture.count(), after}
    },
    then(r) {
        r.edited.errors == ""
        r.changed.changedSinceSent == true
        r.changed.sendCount == 3
        r.earlier.printHtml.includes(">20 ")
        !r.earlier.printHtml.includes(">24 ")
        r.resent.errors == ""
        r.mails == 2
        r.after.publishedRows.length == 2
        r.after.invitationRows.find(row => row.supplierPartyId == ids.supplierId).sendState == "Sent"
    }
})

feature(
    "a buyer enters two suppliers' prices with evidence; a price change is in the history; an expired quote cannot be placed",
    {
        when() {
            const answer = (supplierPartyId, price, reference, validThruDate) => {
                const orderId = quoteOf(supplierPartyId)
                const line = rows("mantle.order.OrderItem", {orderId})[0]
                const priced = post(users.buyer, quotePath + "storeQuoteItem", {
                    orderId,
                    orderItemSeqId: line.orderItemSeqId,
                    unitAmount: price
                })
                const answered = post(users.buyer, quotePath + "storeQuote", {
                    orderId,
                    otherPartyOrderId: reference,
                    validFromDate: Number(ec.user.nowTimestamp) - 2 * dayMs,
                    validThruDate,
                    salesChannelEnumId: "ScEmail",
                    evidenceText: "Emailed quote " + reference
                })
                return {orderId, line: line.orderItemSeqId, priced, answered}
            }
            const brightline = answer(ids.supplierId, "8.40", "BL-501", Number(ec.user.nowTimestamp) + 20 * dayMs)
            const ziddleman = answer(ids.sharedSupplierId, "8.10", "ZD-77", Number(ec.user.nowTimestamp) - 1000)
            state.quoteId = brightline.orderId
            state.quoteLine = brightline.line
            const repriced = post(users.buyer, quotePath + "storeQuoteItem", {
                orderId: brightline.orderId,
                orderItemSeqId: brightline.line,
                unitAmount: "8.20",
                changeReason: "Matched a competing offer"
            })
            const current = asUser(users.buyer, () => invoke(B + "get#SupplierQuote", {orderId: brightline.orderId}).quote)
            const expired = asUser(users.buyer, () => invoke(B + "get#SupplierQuote", {orderId: ziddleman.orderId}).quote)
            const expiredList = asUser(users.buyer, () =>
                (invoke(B + "find#SupplierQuotes", {view: "expired", pageSize: 100}).quoteRows || []).map(row => row.orderId)
            )
            const rendered = asUser(users.buyer, () => page("Sourcing/QuoteDetail", {orderId: ziddleman.orderId}, "html"))
            return {brightline, ziddleman, repriced, current, expired, expiredList, rendered}
        },
        then(r) {
            r.brightline.priced.errors == ""
            r.brightline.answered.errors == ""
            r.ziddleman.answered.errors == ""
            r.repriced.errors == ""
            r.current.statusText == "Quoted"
            r.current.evidenceRows.length == 1
            r.current.lineRows[0].historyRows.some(row => row.whatText == "price" && row.reason == "Matched a competing offer")
            r.expired.statusText == "Expired"
            r.expired.canPlace == false
            r.expiredList.includes(r.ziddleman.orderId)
            r.rendered.output.includes("cannot be placed")
        }
    }
)

feature("publishing a quoted price makes the supplier price with its dates; the buyer without supplier-price edit is refused", {
    when() {
        const buyer = post(users.buyer, quotePath + "publishPrice", {orderId: state.quoteId, orderItemSeqId: state.quoteLine})
        const published = post(users.admin, quotePath + "publishPrice", {orderId: state.quoteId, orderItemSeqId: state.quoteLine})
        const price = rows("mantle.product.ProductPrice", {sourceOrderId: state.quoteId})[0]
        const part = one("mantle.order.OrderPart", {orderId: state.quoteId})
        return {buyer, published, price, part}
    },
    then(r) {
        r.buyer.errors.includes("PERMISSION_DENIED")
        r.published.errors == ""
        r.price.vendorPartyId == ids.supplierId
        r.price.customerPartyId == ids.organizationId
        String(r.price.price).startsWith("8.2")
        r.price.sourceOrderItemSeqId == state.quoteLine
        Number(r.price.thruDate) == Number(r.part.validThruDate)
    }
})

feature("the RFQ is in no Commons or Projects request list, and the palette opens it in QuoteRequestDetail", {
    when() {
        const commons = asUser(
            users.buyer,
            () =>
                Array.from(
                    invoke("ironstone.commons.RequestServices.find#RequestRows", {list: "all", pageSize: 100}).rowList || []
                ),
            false
        )
        const projects = asUser(
            "john.doe",
            () =>
                Array.from(
                    invoke("ironstone.projects.ProjectRequestServices.find#ProjectRequests", {list: "all", pageSize: 100})
                        .rowList || []
                ),
            false
        )
        const palette = asUser(users.buyer, () =>
            Array.from(invoke("ironstone.purchasing.AccessServices.search#Records", {text: state.rfqId, limit: 10}).rows || [])
        )
        const rendered = asUser(users.buyer, () => page("Sourcing/QuoteRequestDetail", {requestId: state.rfqId}))
        return {commons, projects, palette, rendered}
    },
    then(r) {
        !r.commons.some(row => row.requestId == state.rfqId)
        !r.projects.some(row => row.requestId == state.rfqId)
        r.palette.some(row => row.url == "/qapps/Purchasing/Sourcing/QuoteRequestDetail?requestId=" + state.rfqId)
        r.rendered.errors.join(" | ") == ""
        r.rendered.output.includes(state.name + " RFQ")
    }
})
