// Marketing P19's "usable when" (impl-marketing P19; design-marketing §7 Promotions, §10 Customer360 and ContactDetail), as an acceptance
// walk through the screens' transitions with artifact authorization on: an author with Commerce's promotion permission (MarketingSpecLib
// promotionsAuthor) links a store promotion to the running campaign from PromotionDetail and generates codes for it from PromoCodes in
// Marketing; an author without it opens no promotion screen, sees the link on CampaignDetail read only and cannot end it; Customer360
// shows a contact's sends and event registrations to the Marketing administrator, and no order, invoice or Accounting figure to a user
// without Sales' or Accounting's read. The rules are Mantle's CampaignPromotions and Engagement, the renders MarketingPromotions.
// Run: ./moq accept mr-boss --spec MarketingPromotionsWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const promotionId = "PopcNewCustomer"
const promoUser = "mkpromo.author"
const state = {}

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const links = () =>
    all("mantle.marketing.campaign.CampaignAssociation", {
        marketingCampaignId: ids.runningCampaignId,
        associationKindEnumId: "CakPromotion",
        sourceId: promotionId
    }).filter(link => !link.thruDate)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        lib.promotionsAuthor()
        // Maya's place on the demo webinar, for her Customer360
        system(() =>
            ec.service
                .sync()
                .name("create#mantle.work.registration.EventRegistration")
                .parameters({
                    registrationId: "MKPROMO_WALK_REG",
                    registrationPolicyId: ids.webinarOfferId,
                    ticketTypeId: ids.webinarTicketId,
                    attendeePartyId: ids.acceptedPartyId,
                    buyerPartyId: ids.acceptedPartyId,
                    statusId: "EvrConfirmed",
                    createdDate: ec.user.nowTimestamp,
                    confirmedDate: ec.user.nowTimestamp
                })
                .call()
        )
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature(
    "an author with Commerce's promotion permission links a promotion to the campaign and generates its codes from Marketing",
    {
        when() {
            const linked = asUser(promoUser, () =>
                post("Promotions/PromotionDetail/linkCampaign", {
                    storePromotionId: promotionId,
                    marketingCampaignId: ids.runningCampaignId,
                    purpose: "New customer offer"
                })
            )
            const before = all("mantle.product.store.ProductStorePromoCode", {storePromotionId: promotionId}).length
            const generated = asUser(promoUser, () =>
                post("Promotions/PromoCodes/generateCodes", {
                    genPromotionId: promotionId,
                    genCount: 3,
                    genPrefix: "SPRWALK",
                    operationKey: "MKPROMO_WALK_CODES"
                })
            )
            const after = all("mantle.product.store.ProductStorePromoCode", {storePromotionId: promotionId})
            state.linkId = links()[0]?.campaignAssociationId
            const detail = asUser(promoUser, () => page("Promotions/PromotionDetail", {storePromotionId: promotionId}, "html"))
            return {linked, generated, before, after, detail}
        },
        then({linked, generated, before, after, detail}) {
            linked.errors == ""
            !!state.linkId
            generated.errors == ""
            after.length == before + 3
            after.filter(code => String(code.promoCode).startsWith("SPRWALK")).length == 3
            detail.errors == []
            detail.output.includes("Spring garden launch") && detail.output.includes("New customer offer")
        }
    }
)

feature("an author without it opens no promotion screen, sees the link on CampaignDetail read only and cannot end it", {
    when() {
        const promotions = lib.screenRefusal(users.author, "Promotions/PromotionDetail", {storePromotionId: promotionId})
        const campaign = asUser(users.author, () =>
            page("Campaigns/CampaignDetail", {marketingCampaignId: ids.runningCampaignId}, "html")
        )
        const end = asUser(users.author, () =>
            post("Campaigns/CampaignDetail/storeAssociation", {
                marketingCampaignId: ids.runningCampaignId,
                action: "end",
                campaignAssociationId: state.linkId
            })
        )
        return {promotions, campaign, end, stillLinked: links().length}
    },
    then({promotions, campaign, end, stillLinked}) {
        promotions != ""
        campaign.errors == []
        campaign.output.includes("20% Discount for New Customers")
        !campaign.output.includes("Link a promotion")
        end.errors.includes("PERMISSION_DENIED")
        stillLinked == 1
    }
})

feature("Customer360 shows a contact's sends and registrations, and no order or Accounting figure to a user without their read", {
    when() {
        return asUser(users.admin, () => page("Customers/Customer360", {customerPartyId: ids.acceptedPartyId}, "html"))
    },
    then(result) {
        result.errors == []
        result.output.includes("Maya Lindqvist")
        result.output.includes("Sends")
        result.output.includes("Event registrations")
        result.output.includes("Spring planting webinar")
        !result.output.includes("Open receivable")
        !result.output.includes("Open orders")
        !result.output.includes("Invoices and payments")
    }
})
