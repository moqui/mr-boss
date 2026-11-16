// Sales' agreement screens (impl-sales P15; design-sales §7 Agreements and AgreementDetail): AgreementDetail's one qvt render as the
// agreement keeper (Contoso's active supply terms: the record header with Renew and More, the two negotiated prices, the net 30 term,
// the signer, the signed copy, no activation needs) and Agreements' one html render as the rep (the active agreement listed, the
// template not, no New agreement). The rules are Mantle's SalesAgreements and ProductAgreementPrices. Demo data:
// data/BossZSalesDemoData.xml (P15 block).
// Run: ./moq test mr-boss --spec SalesAgreements
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, page} = lib

feature("AgreementDetail shows an active agreement with its prices to its keeper; Agreements lists it to a rep", {
    when() {
        return {
            detail: asUser(users.agreement, () => page("Agreements/AgreementDetail", {agreementId: ids.agreements.contoso})),
            list: asUser(users.rep, () => page("Agreements/Agreements", {}, "html"))
        }
    },
    then({detail, list}) {
        detail.errors.length == 0
        detail.output.includes("Contoso supply terms")
        detail.output.includes("Contoso Labs")
        detail.output.includes("Active")
        detail.output.includes("Renew")
        detail.output.includes("End agreement")
        detail.output.includes("Demo Product One-One")
        detail.output.includes("17.50")
        detail.output.includes("10,800.00")
        detail.output.includes("Net 30 days from invoice")
        detail.output.includes("Dana Morales")
        detail.output.includes("Signed by Dana Morales")
        !detail.output.includes("Before it is activated")
        list.errors.length == 0
        list.output.includes("Contoso supply terms")
        !list.output.includes("Standard supply terms")
        !list.output.includes("New agreement")
    }
})
