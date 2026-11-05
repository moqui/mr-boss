// Purchasing P12's "usable when" (impl-purchasing P12; design §5 QuoteComparison and Award, §14.4 #1 the award), through the
// screens' transitions with artifact authorization on and the mail capture on: an approved purchase request of 12 of DEMO_1_1
// asked of Brightline and Ziddleman by RFQ, and quoted by them and by Common Fasteners in a currency with no rate, which the
// comparison shows Not comparable; 10 split across Brightline's and Ziddleman's quotes, Brightline blocked: its group fails by
// name and Ziddleman's is placed; once unblocked, the retry of the failed group places Brightline's; both are placed purchase
// orders with their allocated quantities and supply, never approved; a double commit answers the first result; the close
// cancels Common Fasteners' quote as Not awarded with a regret notice, and the 2 left uncovered stay for the next run.
// Run: ./moq accept mr-boss --spec PurchasingAwardWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0]
const capture = ec.factory.getTool("MailCapture")
const detailPath = "Sourcing/QuoteRequestDetail/"
const quotePath = "Sourcing/QuoteDetail/"
const awardPath = "Sourcing/Award/"
const dayMs = 24 * 60 * 60 * 1000
const state = {name: "Walk award " + Date.now()}
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
const lineOf = orderId => rows("mantle.order.OrderItem", {orderId}).find(row => row.productId == "DEMO_1_1")
const allocation = (orderId, quantity) => [orderId, lineOf(orderId).orderItemSeqId, state.itemSeqId, quantity].join(":")
// a block of Brightline's purchases from now, or its end; the block's row carries the fields of the row in effect (its
// approval status, currency and Incoterm), so the specs after this one in a shared database find Brightline as it was
function block(on) {
    system(() => {
        if (on) {
            const inEffect = rows("mantle.party.supplier.SupplierProfile", {
                organizationPartyId: ids.organizationId,
                supplierPartyId: ids.supplierId,
                thruDate: null
            }).sort((a, b) => Number(b.fromDate) - Number(a.fromDate))[0]
            state.blockId = invoke("create#mantle.party.supplier.SupplierProfile", {
                organizationPartyId: ids.organizationId,
                supplierPartyId: ids.supplierId,
                approvalStatusId: inEffect?.approvalStatusId ?? null,
                currencyUomId: inEffect?.currencyUomId ?? null,
                incotermEnumId: inEffect?.incotermEnumId ?? null,
                selfBillingIndicator: inEffect?.selfBillingIndicator ?? "N",
                fromDate: new Date(Number(ec.user.nowTimestamp) - 1000),
                purchaseBlockFromDate: new Date(Number(ec.user.nowTimestamp) - 1000),
                purchaseBlockReason: "Walk quality hold"
            }).supplierProfileId
        } else
            invoke("update#mantle.party.supplier.SupplierProfile", {
                supplierProfileId: state.blockId,
                purchaseBlockThruDate: ec.user.nowTimestamp
            })
    })
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        capture.enable()
        system(() => {
            // Common Fasteners' address, for its regret notice
            if (!one("mantle.party.contact.ContactMech", {contactMechId: "BOSS_PUR_WALK_COMMON_EMAIL"})) {
                invoke("create#mantle.party.contact.ContactMech", {
                    contactMechId: "BOSS_PUR_WALK_COMMON_EMAIL",
                    contactMechTypeEnumId: "CmtEmailAddress",
                    infoString: "sales@commonfasteners.example.com"
                })
                invoke("create#mantle.party.contact.PartyContactMech", {
                    partyId: ids.commonSupplierId,
                    contactMechId: "BOSS_PUR_WALK_COMMON_EMAIL",
                    contactMechPurposeId: "EmailPrimary",
                    fromDate: "2000-01-01 00:00:00"
                })
            }
        })
    },
    cleanupSpec() {
        if (state.blockId) block(false)
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("three suppliers quote an RFQ of 12; Common Fasteners' quote in a currency without a rate shows Not comparable", {
    when() {
        post(users.requester, "NewPurchaseRequest/createRequest", {
            organizationPartyId: ids.organizationId,
            requestName: state.name,
            facilityId: ids.facilityId
        })
        state.requestId = rows("mantle.request.Request", {requestName: state.name})[0]?.requestId
        post(users.requester, "Requests/RequestDetail/storePurchaseRequestItem", {
            requestId: state.requestId,
            productId: "DEMO_1_1",
            quantity: "12"
        })
        post(users.requester, "Requests/RequestDetail/submitPurchaseRequest", {requestId: state.requestId})
        post(users.approve, "Requests/RequestDetail/decidePurchaseRequest", {requestId: state.requestId, decision: "approve"})
        post(users.buyer, "Requests/RequestSourcing/requestQuotes", {
            rfqItemKeys: state.requestId + ":01",
            rfqName: state.name + " RFQ"
        })
        state.rfqId = rows("mantle.request.Request", {requestName: state.name + " RFQ"})[0]?.requestId
        state.itemSeqId = rows("mantle.request.RequestItem", {requestId: state.rfqId})[0]?.requestItemSeqId
        for (const supplierPartyId of [ids.supplierId, ids.sharedSupplierId])
            post(users.buyer, detailPath + "inviteSupplier", {requestId: state.rfqId, supplierPartyId})
        post(users.buyer, detailPath + "sendRfq", {requestId: state.rfqId, operationKey: "walk-award-send-" + Date.now()})
        const answer = (orderId, price, reference) => {
            post(users.buyer, quotePath + "storeQuoteItem", {
                orderId,
                orderItemSeqId: lineOf(orderId).orderItemSeqId,
                unitAmount: price
            })
            return post(users.buyer, quotePath + "storeQuote", {
                orderId,
                otherPartyOrderId: reference,
                validThruDate: Number(ec.user.nowTimestamp) + 20 * dayMs,
                salesChannelEnumId: "ScEmail",
                evidenceText: "Emailed quote " + reference
            })
        }
        const answers = [answer(quoteOf(ids.supplierId), "8.40", "BL-12"), answer(quoteOf(ids.sharedSupplierId), "8.10", "ZD-12")]
        const common = post(users.buyer, "Sourcing/Quotes/createQuote", {
            requestId: state.rfqId,
            organizationPartyId: ids.organizationId,
            vendorPartyId: ids.commonSupplierId,
            currencyUomId: "NZD",
            otherPartyOrderId: "CF-12",
            validThruDate: Number(ec.user.nowTimestamp) + 20 * dayMs,
            salesChannelEnumId: "ScPhone",
            evidenceText: "Phoned in"
        })
        state.commonQuoteId = quoteOf(ids.commonSupplierId)
        answer(state.commonQuoteId, "13.00", "CF-12")
        const compared = asUser(users.buyer, () => page("Sourcing/QuoteComparison", {requestId: state.rfqId}, "html"))
        const offers = asUser(
            users.buyer,
            () => invoke("mantle.order.SourcingServices.compare#SupplierQuotes", {requestId: state.rfqId}).offerRows,
            false
        )
        return {answers, common, compared, offers}
    },
    then({answers, common, compared, offers}) {
        !!state.rfqId
        answers.every(row => row.errors == "")
        common.errors == ""
        one("mantle.order.OrderHeader", {orderId: state.commonQuoteId}).currencyUomId == "NZD"
        compared.errors.join(" | ") == ""
        compared.output.includes("Not comparable")
        offers.find(row => row.orderId == state.commonQuoteId).reasonCode == "RATE_MISSING"
        offers.find(row => row.supplierPartyId == ids.sharedSupplierId).rank == 1
    }
})

feature(
    "10 split across two quotes: blocked Brightline's group fails by name, Ziddleman's is placed; the retry places Brightline's",
    {
        when() {
            block(true)
            state.brightlineQuoteId = quoteOf(ids.supplierId)
            state.ziddlemanQuoteId = quoteOf(ids.sharedSupplierId)
            const allocationsText = [allocation(state.brightlineQuoteId, "5"), allocation(state.ziddlemanQuoteId, "5")].join(";")
            const preview = asUser(users.buyer, () => page("Sourcing/Award", {requestId: state.rfqId, allocationsText}, "html"))
            state.firstKey = "walk-award-" + Date.now()
            state.allocationsText = allocationsText
            const first = post(users.buyer, awardPath + "commitAward", {
                requestId: state.rfqId,
                allocationsText,
                operationKey: state.firstKey
            })
            const firstResult = asUser(users.buyer, () =>
                invoke("ironstone.purchasing.AwardServices.get#AwardResult", {
                    requestId: state.rfqId,
                    operationKey: state.firstKey
                })
            )
            block(false)
            const retry = post(users.buyer, awardPath + "commitAward", {
                requestId: state.rfqId,
                allocationsText: firstResult.retryText,
                operationKey: "walk-award-retry-" + Date.now()
            })
            const statuses = [state.brightlineQuoteId, state.ziddlemanQuoteId].map(
                orderId => one("mantle.order.OrderHeader", {orderId}).statusId
            )
            const quantities = [state.brightlineQuoteId, state.ziddlemanQuoteId].map(orderId =>
                String(lineOf(orderId).quantity.toNumber())
            )
            const requirementId = rows("mantle.request.requirement.RequirementRequestItem", {requestId: state.requestId})[0]
                .requirementId
            const supplies = rows("mantle.request.requirement.RequirementSupply", {requirementId})
            const awards = asUser(users.buyer, () =>
                invoke("ironstone.purchasing.AwardServices.get#QuoteAwards", {orderId: state.ziddlemanQuoteId})
            )
            state.requirementId = requirementId
            return {preview, first, firstResult, retry, statuses, quantities, supplies, awards}
        },
        then({preview, first, firstResult, retry, statuses, quantities, supplies, awards}) {
            preview.output.includes("Purchasing from Brightline")
            first.errors == ""
            firstResult.groupRows.find(row => row.orderId == state.brightlineQuoteId).errorCode == "SUPPLIER_BLOCKED"
            firstResult.groupRows.find(row => row.orderId == state.ziddlemanQuoteId).resultStatus == "PLACED"
            firstResult.retryText.startsWith(state.brightlineQuoteId + ":")
            retry.errors == ""
            statuses.every(status => status == "OrderPlaced")
            quantities.every(quantity => quantity == "5")
            supplies.length == 2
            awards.awardState == "awarded"
            awards.awardRows[0].sourceText.includes(state.requestId)
        }
    }
)

feature("a double commit of the award answers the first result and places nothing more", {
    when() {
        const again = post(users.buyer, awardPath + "commitAward", {
            requestId: state.rfqId,
            allocationsText: state.allocationsText,
            operationKey: state.firstKey
        })
        return {again, supplies: rows("mantle.request.requirement.RequirementSupply", {requirementId: state.requirementId})}
    },
    then({again, supplies}) {
        again.errors == ""
        supplies.length == 2
    }
})

feature("the close cancels Common Fasteners' quote as Not awarded with a regret notice; the 2 uncovered stay for the next run", {
    when() {
        const preview = asUser(users.buyer, () => page("Sourcing/Award", {requestId: state.rfqId, step: "close"}, "html"))
        capture.clear()
        const closed = post(users.buyer, awardPath + "closeRfq", {
            requestId: state.rfqId,
            sendRegret: "Y",
            regretMessage: "Thank you for your quote; we placed this order elsewhere.",
            operationKey: "walk-award-close-" + Date.now()
        })
        const progress = asUser(
            users.buyer,
            () => invoke("mantle.request.RequestServices.get#PurchaseRequestProgress", {requestId: state.requestId}),
            false
        )
        return {
            preview,
            closed,
            mails: capture.count(),
            common: one("mantle.order.OrderHeader", {orderId: state.commonQuoteId}),
            rfq: one("mantle.request.Request", {requestId: state.rfqId}),
            requirement: one("mantle.request.requirement.Requirement", {requirementId: state.requirementId}),
            progress
        }
    },
    then({preview, closed, mails, common, rfq, requirement, progress}) {
        preview.output.includes("Left uncovered for the next run")
        preview.output.includes("Common Fasteners")
        closed.errors == ""
        common.statusId == "OrderCancelled"
        mails == 1
        rfq.statusId == "ReqCompleted"
        requirement.statusId == "RqmtStApproved"
        JSON.stringify(progress).includes('"remaining')
    }
})
