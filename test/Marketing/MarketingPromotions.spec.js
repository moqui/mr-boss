// Marketing's promotions, Customer360 and contact (impl-marketing P19; design-marketing §7, §10): Commerce's shared promotion screens in
// Marketing's registration (service/ironstone/shared/PromotionApps.js) offer only the stores of the user's Marketing organizations within
// Commerce's store scope and only to a holder of Commerce's promotion read, PromotionDetail's one qvt render in Marketing's context shows
// its Campaigns box with the link and its actions for a campaign editor holding Commerce's promotion permission; the shared Customer360's
// Marketing branch renders once (qvt) for an audience reader with the contact's engagement and names what they may not read; Marketing's
// ContactDetail renders once (qvt) with Add to list. The promotion, link and engagement rules are Mantle's (StorePromotions,
// CampaignPromotions, Engagement); Commerce's promotion specs pass unchanged. The walk is the acceptance MarketingPromotionsWalk.
// Run: ./moq test mr-boss --spec MarketingPromotions
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, invoke, page, shell} = lib
const retailStoreId = "POPC_DEFAULT"
const servicesStoreId = "BOSS_COM_DIGITAL"
const promotionId = "PopcBuyGet"

// the Retail author holding Commerce's promotion read and edit (MarketingSpecLib promotionsAuthor)
const promoUser = "mkpromo.author"

spec({
    setupSpec() {
        lib.promotionsAuthor()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

const choices = (user, choice, parameters = {}) =>
    asUser(user, () =>
        invoke(
            "ironstone.marketing.ContextServices.get#Choices",
            Object.assign({appRoot: "Marketing", choice, term: ""}, parameters)
        )
    ).options || []
const context = user =>
    asUser(user, () => invoke("ironstone.marketing.ContextServices.get#SharedContext", {appRoot: "Marketing"}))

feature(
    "the promotion stores are the user's Marketing organizations' within Commerce's store scope, for a holder of Commerce's read",
    {
        when() {
            return {
                promoStores: choices(promoUser, "promotionStores").map(option => option.value),
                authorStores: choices(users.author, "promotionStores"),
                promoCaps: context(promoUser).capabilities,
                authorCaps: context(users.author).capabilities,
                promotions: choices(promoUser, "promotions", {organizationPartyId: ids.organizationId}).map(
                    option => option.value
                ),
                authorPromotions: choices(users.author, "promotions", {organizationPartyId: ids.organizationId}),
                promoMenu: shell(promoUser, true).names,
                authorMenu: shell(users.author, true).names
            }
        },
        then(r) {
            r.promoStores.includes(retailStoreId)
            !r.promoStores.includes(servicesStoreId)
            r.authorStores == []
            r.promoCaps.promotions && r.promoCaps.promotionEdit
            !r.authorCaps.promotions && !r.authorCaps.promotionRead
            r.promotions.includes(promotionId)
            r.authorPromotions == []
            r.promoMenu.includes("Promotions")
            !r.authorMenu.includes("Promotions")
        }
    }
)

// PromotionDetail in Marketing, rendered once (qvt): the shared header and limits, and Marketing's Campaigns box with the running
// campaign's link, Link to a campaign and End link for the promotions author; no order link (Marketing's registration has none)
feature("PromotionDetail in Marketing's context shows the promotion with its Campaigns box and the campaign link", {
    when() {
        // the link as the author, with the service's own rule (a screen's transition inherits its authorization)
        const linked = asUser(promoUser, () =>
            system(() =>
                invoke("mantle.marketing.CampaignServices.store#CampaignAssociation", {
                    marketingCampaignId: ids.runningCampaignId,
                    associationKindEnumId: "CakPromotion",
                    sourceId: promotionId,
                    purpose: "Spring offer"
                })
            )
        )
        const result = asUser(promoUser, () => page("Promotions/PromotionDetail", {storePromotionId: promotionId}))
        return {linked, result}
    },
    then({linked, result}) {
        !!linked.campaignAssociationId
        result.status == 200
        result.errors == []
        result.output.includes("Buy 1 Get 1 Half Off")
        result.output.includes("Uses per customer")
        result.output.includes("Campaigns")
        result.output.includes("Spring garden launch")
        result.output.includes("Spring offer")
        result.output.includes("Link to a campaign")
        result.output.includes("End link")
        !result.output.includes("Not available")
    }
})

// Customer360 in Marketing, rendered once (qvt): Maya's engagement for the audience manager, the lists and sends shown, the event
// registrations and promotion use named as not shown, no Accounting box
// P19 review: the contact record kind (Customer360, ContactDetail and the record's notes and files under Marketing) admits a party of
// the scope's audiences, not any directory party: a shared person Marketing has no record of is not available
feature("Customer360 in Marketing shows a contact's engagement and names the sources the user may not read", {
    when() {
        const strangerId = system(
            () => invoke("mantle.party.PartyServices.create#Person", {firstName: "Stranger", lastName: "Nolist"}).partyId
        )
        const check = partyId =>
            asUser(users.audience, () =>
                invoke("ironstone.marketing.ContextServices.check#Record", {
                    appRoot: "Marketing",
                    recordType: "contact",
                    recordId: partyId
                })
            )
        const stranger = check(strangerId)
        ec.message.clearErrors()
        const maya = check(ids.acceptedPartyId)
        const result = asUser(users.audience, () => page("Customers/Customer360", {customerPartyId: ids.acceptedPartyId}))
        result.stranger = stranger?.recordId || null
        result.maya = maya?.recordId || null
        return result
    },
    then(result) {
        result.stranger == null
        result.maya == ids.acceptedPartyId
        result.status == 200
        result.errors == []
        result.output.includes("Maya Lindqvist")
        result.output.includes("Lists and segments")
        result.output.includes("Garden newsletter")
        result.output.includes("Contact record")
        result.output.includes("Not shown to you:")
        result.output.includes("event registrations")
        !result.output.includes("Open receivable")
        !result.output.includes("Customer not available")
    }
})

// ContactDetail in Marketing, rendered once (qvt): the contact record with Add to list for the audience manager
feature("ContactDetail in Marketing shows the contact record with Add to list", {
    when() {
        return asUser(users.audience, () => page("Contacts/ContactDetail", {partyId: ids.acceptedPartyId}))
    },
    then(result) {
        result.status == 200
        result.errors == []
        result.output.includes("Maya Lindqvist")
        result.output.includes("Add to list")
        result.output.includes("engagement")
        !result.output.includes("Contact not available")
    }
})
