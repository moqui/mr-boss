// Purchasing's agreements (impl-purchasing P13; design-purchasing §7 Agreements and AgreementDetail): the agreement list's
// views with each agreement's limit, released and remaining value, withheld from the reader; AgreementDetail's one html render
// (its balance, items with the price, terms, the release action); and a release from AgreementDetail's transition, which makes
// a draft purchase order line at the agreement's price, shown in OrderDetail's Agreements. The rules (caps, tolerance,
// approval, revisions, the as-of print) are Mantle's (mr-mantle test/party/PurchaseAgreements); access is PurchasingAccess's;
// the usable-when walk is the acceptance PurchasingAgreementsWalk.
// Run: ./moq test mr-boss --spec PurchasingAgreements
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, invoke} = lib
const S = "ironstone.purchasing.AgreementServices."

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the agreement list's views show each agreement's limit, released and remaining value, withheld from the reader; AgreementDetail renders its balance, items, terms and release",
    {
        when() {
            const list = (user, view) =>
                asUser(user, () => invoke(S + "find#Agreements", {appRoot: "Purchasing", view, pageSize: 100})).agreementRows
            const active = list(users.buyer, "active")
            const templates = list(users.buyer, "templates")
            const reader = list(users.read, "active")
            const rendered = asUser(users.buyer, () =>
                lib.page("Agreements/AgreementDetail", {agreementId: ids.agreementId}, "html")
            )
            return {active, templates, reader, rendered}
        },
        then({active, templates, reader, rendered}) {
            const own = active.find(row => row.agreementId == ids.agreementId)
            own.limitText == "$1,000.00"
            own.releasable == true
            active.every(row => row.agreementId != ids.otherAgreementId)
            templates.some(row => row.agreementId == ids.templateAgreementId && row.limitText == "")
            reader.find(row => row.agreementId == ids.agreementId).limitText == "Withheld"
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Widget blanket")
            rendered.output.includes("$9.00")
            rendered.output.includes("Net 30 on each release")
            rendered.output.includes("Release from agreement")
        }
    }
)

feature(
    "a release from AgreementDetail makes a draft purchase order line at the agreement's price, shown in OrderDetail's Agreements",
    {
        when() {
            const released = asUser(users.buyer, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .render(
                    "apps/Purchasing/Agreements/AgreementDetail/releaseAgreement",
                    {agreementId: ids.agreementId, agreementItemSeqId: "01", quantity: "1"},
                    "post"
                )
            const out = {status: result.status, errors: Array.from(result.errorMessages || [])}
            ec.message.clearErrors()
            return out
        })
        const release = ec.entity
                .find("mantle.party.agreement.AgreementRelease")
                .condition("agreementId", ids.agreementId)
                .orderBy("-releaseDate")
                .disableAuthz()
                .one()
            const line = ec.entity
                .find("mantle.order.OrderItem")
                .condition({orderId: release.orderId, orderItemSeqId: release.orderItemSeqId})
                .disableAuthz()
                .one()
            const onOrder = asUser(users.read, () =>
                invoke(S + "get#OrderAgreements", {appRoot: "Purchasing", orderId: release.orderId})
            ).releaseRows
            return {released, line, onOrder}
        },
        then({released, line, onOrder}) {
            released.errors.length == 0
            line.unitAmount == 9
            line.quantity == 1
            onOrder.length == 1
            onOrder[0].agreementId == ids.agreementId
            onOrder[0].amountText == "Withheld"
        }
    }
)
