// Purchasing P13's "usable when" (impl-purchasing P13; design §7 Agreements and AgreementDetail), through the screens'
// transitions with artifact authorization on: a buyer starts a blanket agreement for 100 units with a value cap and a
// tolerance, adds its term and sends it for approval; a purchase approver approves it and its PDF is stored; CreatePurchaseOrder's
// agreement release makes two draft purchase orders at the agreement's price, a third over the cap is refused and one within the
// tolerance passes, each shown in its OrderDetail's Agreements and in Supplier360's Agreements; a changed cap shows in
// AgreementDetail's history and the print as of the first approval shows the old cap; PriceExplain chooses the agreement's
// price for its release; a template has no balance; and an expired agreement takes no new release while its orders stay. Two
// releases at once are the Mantle acceptance PurchaseAgreementWalk's. Run: ./moq accept mr-boss --spec PurchasingAgreementsWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0]
const description = "Walk blanket " + Date.now()
const state = {}
// a transition of a Purchasing screen as the user posts it: its status and errors
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
const agreementOf = () => one("mantle.party.agreement.Agreement", {agreementId: state.agreementId})
const releasesOf = () =>
    rows("mantle.party.agreement.AgreementRelease", {agreementId: state.agreementId}).sort((a, b) =>
        String(a.agreementReleaseId).localeCompare(String(b.agreementReleaseId))
    )
const release = quantity =>
    post(users.buyer, "Orders/PurchaseOrders/releaseAgreement", {
        agreementId: state.agreementId,
        agreementItemSeqId: "01",
        quantity: String(quantity)
    })
function tick() {
    const start = Number(ec.user.nowTimestamp)
    while (Number(ec.user.nowTimestamp) <= start + 2) {}
    return Number(ec.user.nowTimestamp)
}

spec({
    stepwise: true,
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a buyer starts a blanket agreement, adds its item and term and sends it; a purchase approver approves it and its PDF is stored",
    {
        when() {
            const created = post(users.buyer, "Agreements/AgreementList/newAgreement", {
                organizationPartyId: ids.organizationId,
                otherPartyId: ids.sharedSupplierId,
                description,
                currencyUomId: "USD",
                isTemplate: "N",
                fromDate: "2026-01-01"
            })
            state.agreementId = one("mantle.party.agreement.Agreement", {description}).agreementId
            const item = post(users.buyer, "Agreements/AgreementDetail/storeItem", {
                agreementId: state.agreementId,
                productId: "DEMO_1_1",
                quantity: "100",
                price: "5",
                amountCap: "500",
                releaseTolerancePercent: "5"
            })
            const term = post(users.buyer, "Agreements/AgreementDetail/storeTerm", {
                agreementId: state.agreementId,
                termTypeEnumId: "TtFinPaymentDays",
                termNumber: "30",
                termText: "Net 30"
            })
            const readerSubmit = post(users.read, "Agreements/AgreementDetail/submitAgreement", {agreementId: state.agreementId})
            const submitted = post(users.buyer, "Agreements/AgreementDetail/submitAgreement", {agreementId: state.agreementId})
            const waiting = rows("moqui.security.user.NotificationMessage", {
                topic: "PurchaseOrderApproval",
                recordId: state.agreementId
            })
            const approved = post(users.approve, "Agreements/AgreementDetail/decideAgreement", {
                agreementId: state.agreementId,
                agreementRevision: String(agreementOf().agreementRevision)
            })
            state.approvedAt = tick()
            return {
                created,
                item,
                term,
                readerSubmit,
                submitted,
                waiting,
                approved,
                agreement: agreementOf(),
                pdf: rows("mantle.party.agreement.AgreementContent", {agreementId: state.agreementId})
            }
        },
        then(r) {
            r.created.errors == ""
            r.item.errors == ""
            r.term.errors == ""
            r.readerSubmit.errors.includes("PERMISSION_DENIED")
            r.submitted.errors == ""
            r.waiting.length >= 1
            r.approved.errors == ""
            r.agreement.statusId == "AgmStActive"
            Number(r.agreement.approvedRevision) == Number(r.agreement.agreementRevision)
            r.pdf.some(row => row.contentTypeEnumId == "AcntApprovedVersion")
        }
    }
)

feature(
    "CreatePurchaseOrder's agreement release makes two draft orders at the agreement's price; a third over the cap is refused and one within the tolerance passes; OrderDetail and Supplier360 show them",
    {
        when() {
            const first = release(40)
            const second = release(40)
            const over = release(30)
            const withinTolerance = release(25)
            const releases = releasesOf()
            const line = one("mantle.order.OrderItem", {orderId: releases[0].orderId, orderItemSeqId: releases[0].orderItemSeqId})
            const orderDetail = asUser(users.buyer, () => page("Orders/OrderDetail", {orderId: releases[0].orderId}, "html"))
            const supplier360 = asUser(users.buyer, () =>
                page("Suppliers/Supplier360/PurchasingAgreements", {vendorPartyId: ids.sharedSupplierId}, "html")
            )
            return {first, second, over, withinTolerance, releases, line, orderDetail, supplier360}
        },
        then(r) {
            r.first.errors == ""
            r.second.errors == ""
            r.over.errors.includes("RELEASE_OVER_QUANTITY")
            r.withinTolerance.errors == ""
            r.releases.length == 3
            r.releases[0].orderId != r.releases[1].orderId
            r.line.unitAmount == 5
            r.orderDetail.output.includes(state.agreementId)
            r.supplier360.output.includes(state.agreementId)
        }
    }
)

feature(
    "a changed cap shows in AgreementDetail's history and the print as of the approval shows the old cap; PriceExplain chooses the agreement's price; a template has no balance",
    {
        when() {
            const changed = post(users.buyer, "Agreements/AgreementDetail/storeItem", {
                agreementId: state.agreementId,
                agreementItemSeqId: "01",
                amountCap: "800",
                changeReason: "Second season"
            })
            const pendingRelease = release(1)
            const reapproved = post(users.approve, "Agreements/AgreementDetail/decideAgreement", {
                agreementId: state.agreementId,
                agreementRevision: String(agreementOf().agreementRevision)
            })
            const detail = asUser(users.buyer, () => page("Agreements/AgreementDetail", {agreementId: state.agreementId}, "html"))
            const asOf = asUser(
                users.buyer,
                () =>
                    invoke("mantle.party.AgreementServices.get#PurchaseAgreementPrint", {
                        agreementId: state.agreementId,
                        asOfDate: state.approvedAt
                    }),
                false
            )
            const explain = asUser(users.buyer, () =>
                page(
                    "Suppliers/PriceExplain",
                    {
                        productId: "DEMO_1_1",
                        vendorPartyId: ids.sharedSupplierId,
                        customerPartyId: ids.organizationId,
                        organizationPartyId: ids.organizationId,
                        direction: "purchase",
                        priceUomId: "USD",
                        quantity: "1",
                        agreementId: state.agreementId,
                        agreementItemSeqId: "01"
                    },
                    "html"
                )
            )
            const template = asUser(users.buyer, () =>
                invoke("ironstone.purchasing.AgreementServices.find#Agreements", {appRoot: "Purchasing", view: "templates"})
            ).agreementRows.find(row => row.agreementId == ids.templateAgreementId)
            // the agreement's price row the resolver chose (the Base price row PriceExplain shows)
            const priceRow = rows("mantle.product.ProductPrice", {agreementId: state.agreementId})[0]
            return {changed, pendingRelease, reapproved, detail, asOf, explain, template, priceRow}
        },
        then(r) {
            r.changed.errors == ""
            r.pendingRelease.errors.includes("AGREEMENT_CHANGE_PENDING")
            r.reapproved.errors == ""
            r.detail.output.includes("Second season")
            r.detail.output.includes("$800.00")
            r.asOf.printHtml.includes("$500.00")
            !r.asOf.printHtml.includes("$800.00")
            r.explain.errors.length == 0
            r.explain.output.includes(r.priceRow.productPriceId)
            r.template.limitText == ""
            r.template.releasable == false
        }
    }
)

feature("an expired agreement takes no new release and its orders stay", {
    when() {
        const ended = post(users.buyer, "Agreements/AgreementDetail/updateAgreement", {
            agreementId: state.agreementId,
            description,
            thruDate: Number(ec.user.nowTimestamp) - 60000,
            changeReason: "Ended early"
        })
        const refused = release(1)
        system(() => ec.service.sync().name("mantle.party.AgreementServices.expire#PurchaseAgreements").call())
        const orders = releasesOf().map(row => one("mantle.order.OrderHeader", {orderId: row.orderId}).statusId)
        return {ended, refused, agreement: agreementOf(), orders}
    },
    then(r) {
        r.ended.errors == ""
        r.refused.errors.includes("AGREEMENT_EXPIRED")
        r.agreement.statusId == "AgmStExpired"
        r.orders.length == 3
        r.orders.every(statusId => statusId == "OrderOpen")
    }
})
