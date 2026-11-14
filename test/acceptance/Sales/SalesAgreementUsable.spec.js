// Sales P15's "usable when" (impl-sales P15; design-sales §14.3 scenarios 4 and 10, their agreement halves; §7 Agreements,
// AgreementDetail and PriceExplain): sales.agreement starts an agreement of Retail East with Contoso Labs in Agreements, adds two
// negotiated prices and Contoso's signer on AgreementDetail and activates it with the customer's acceptance; sales.rep2 (Contoso's
// rep) starts a quote for Contoso, whose lines take the two negotiated prices, and PriceExplain says they are the agreement's;
// sales.agreement ends the agreement; a new quote for Contoso takes the general price while the first quote keeps its prices. The
// demo agreement (BOSS_SAL_AGR_CONTOSO) is ended first, so this run's agreement is the customer's only one. Every agreement step
// through AgreementDetail's transitions; the rules are Mantle's SalesAgreements and ProductAgreementPrices.
// Run: ./moq accept mr-boss --spec SalesAgreementUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const G = "mantle.party.SalesAgreementServices."
const Q = "mantle.order.SalesQuoteServices."
const asService = (user, action) => asUser(user, () => system(action))
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const revisionOf = agreementId => Number(one("mantle.party.agreement.Agreement", {agreementId}).agreementRevision ?? 1)
const orderRevision = orderId => Number(one("mantle.order.OrderHeader", {orderId}).orderRevision ?? 1)
// a screen transition as the user: the render's errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Sales.xml").render(path, parameters, "POST")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return errors
    })
}
const lineAmount = (orderId, productId) =>
    Number(
        String(
            system(
                () => Array.from(ec.entity.find("mantle.order.OrderItem").condition({orderId, productId}).list())[0]?.unitAmount
            )
        )
    )
function quoteFor(name) {
    return asService(users.rep2, () => {
        const orderId = invoke(Q + "create#Quote", {
            organizationPartyId: ids.organizationId,
            customerPartyId: ids.accounts.contoso,
            contactPartyId: ids.contacts.dana,
            orderName: name
        }).orderId
        for (const productId of ["DEMO_1_1", "DEMO_1_2"])
            invoke(Q + "store#QuoteLine", {orderId, orderRevision: orderRevision(orderId), productId, quantity: 1})
        return orderId
    })
}
const shared = {}

spec({
    stepwise: true,
    setupSpec() {
        // the demo agreement ended, so this run's is the customer's only current one
        asService(users.agreement, () => {
            const demo = one("mantle.party.agreement.Agreement", {agreementId: ids.agreements.contoso})
            if (demo.statusId === "AgmStActive")
                invoke(G + "end#SalesAgreement", {
                    agreementId: demo.agreementId,
                    agreementRevision: revisionOf(demo.agreementId),
                    reason: "Replaced in the usable run"
                })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("an agreement keeper activates an agreement with two negotiated prices", {
    when() {
        const description = "Usable terms " + run
        const created = post(users.agreement, "Agreements/Agreements/createSalesAgreement", {
            organizationPartyId: ids.organizationId,
            customerPartyId: ids.accounts.contoso,
            agreementTypeEnumId: "AgrSales",
            description
        })
        shared.agreementId = asService(users.agreement, () =>
            Array.from(invoke(G + "find#SalesAgreements", {text: description, state: "all"}).agreementList || [])
        )[0]?.agreementId
        const detail = "Agreements/AgreementDetail/"
        const at = () => ({agreementId: shared.agreementId, agreementRevision: revisionOf(shared.agreementId)})
        const steps = [
            post(
                users.agreement,
                detail + "salesStoreAgreementItem",
                Object.assign(at(), {productId: "DEMO_1_1", price: "16.25"})
            ),
            post(
                users.agreement,
                detail + "salesStoreAgreementItem",
                Object.assign(at(), {productId: "DEMO_1_2", price: "10250"})
            ),
            post(users.agreement, detail + "salesStoreAgreementParty", Object.assign(at(), {partyId: ids.contacts.dana})),
            post(
                users.agreement,
                detail + "salesActivateAgreement",
                Object.assign(at(), {acceptanceEvidence: "Signed by Dana Morales"})
            )
        ]
        return {created, steps, status: one("mantle.party.agreement.Agreement", {agreementId: shared.agreementId}).statusId}
    },
    then({created, steps, status}) {
        created.length == 0
        steps.every(errors => errors.length == 0)
        status == "AgmStActive"
    }
})

feature("a rep's quote for the customer takes the agreement's prices and PriceExplain says why", {
    when() {
        shared.quoteId = quoteFor("Usable agreement quote " + run)
        const line = system(
            () =>
                Array.from(
                    ec.entity.find("mantle.order.OrderItem").condition({orderId: shared.quoteId, productId: "DEMO_1_1"}).list()
                )[0]
        )
        const explain = asUser(users.rep2, () =>
            page("Products/PriceExplain", {orderId: shared.quoteId, orderItemSeqId: line.orderItemSeqId}, "html")
        )
        return {one: lineAmount(shared.quoteId, "DEMO_1_1"), two: lineAmount(shared.quoteId, "DEMO_1_2"), explain}
    },
    then({one, two, explain}) {
        one == 16.25
        two == 10250
        explain.errors.length == 0
        explain.output.includes("The negotiated price of agreement Usable terms " + run)
    }
})

feature("after the agreement is ended a new quote takes the general price while the earlier quote keeps its own", {
    when() {
        const errors = post(users.agreement, "Agreements/AgreementDetail/salesEndAgreement", {
            agreementId: shared.agreementId,
            agreementRevision: revisionOf(shared.agreementId),
            reason: "Contoso moves to list prices"
        })
        const after = quoteFor("Usable list quote " + run)
        return {errors, after, status: one("mantle.party.agreement.Agreement", {agreementId: shared.agreementId}).statusId}
    },
    then({errors, after, status}) {
        errors.length == 0
        status == "AgmStClosed"
        lineAmount(after, "DEMO_1_1") != 16.25
        lineAmount(after, "DEMO_1_2") != 10250
        lineAmount(shared.quoteId, "DEMO_1_1") == 16.25
        lineAmount(shared.quoteId, "DEMO_1_2") == 10250
    }
})
