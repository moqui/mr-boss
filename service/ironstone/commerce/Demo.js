// Commerce's demo (impl-commerce P1, F17; DemoServices.load#CommerceDemo, run from BossZCommerceDemoData.xml): the two PASS
// sites of the demo stores, disabled until published, with their Shop mounts (Shop P1): ZIZI_SHOP on
// shop.zizi.localhost for POPC_DEFAULT's organization, Ziziwork Retail, and ZIZI_DIGITAL on digital.zizi.localhost for
// BOSS_COM_DIGITAL's, Ziziwork Services, each with Shop, Account, Billing and Support mounts (Billing and Support targeting the
// store's organization, F38); (P4) ZIZI_SHOP's published returns policy page and main menu; and (P6 review) its published
// terms policy page, which checkout readiness asks of each Shop site; (P5) POPC_DEFAULT's theme draft copied from the
// starter and ZIZI_SHOP's theme preview host, preview.shop.zizi.localhost (PshkPreview, never canonical). Each site, and
// each page, on its own (one that fails is named and the rest are made); (P10) Joe Q Public's cart reminders for POPC_DEFAULT;
// (Shop P7) BOSS_COM_DIGITAL's monthly membership offer; (P15, Shop F107) ZIZI_DIGITAL's Forum mount and its members' paid
// category, which the offer's paid access opens; idempotent.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, call} = lib

const sites = {
    shop: {
        siteId: "ZIZI_SHOP",
        name: "Ziziwork Retail Store",
        hostname: "shop.zizi.localhost",
        organizationPartyId: "ORG_ZIZI_RETAIL",
        productStoreId: "POPC_DEFAULT",
        shopPath: "/"
    },
    digital: {
        siteId: "ZIZI_DIGITAL",
        name: "Ziziwork Digital Store",
        hostname: "digital.zizi.localhost",
        organizationPartyId: "ORG_ZIZI_SERVICES",
        productStoreId: "BOSS_COM_DIGITAL",
        shopPath: "/shop",
        // P15 (Shop F107): the members' Forum the paid access opens
        forum: true
    }
}

function asDemoAdministrator(operation) {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}
function createOnce(entity, key, values) {
    if (!one(entity, key)) call("create#" + entity, Object.assign({}, key, values))
}
// one site: disabled (state disabled until published), its canonical host and its mounts
function ensureSite(site) {
    const {siteId} = site
    createOnce(
        "mantle.public.PublicSite",
        {siteId},
        {
            name: site.name,
            state: "disabled",
            registrationMode: "open",
            approvalRequired: "N",
            locale: "en",
            timeZone: "America/Chicago",
            policyRevision: 1,
            generation: 1
        }
    )
    createOnce("mantle.public.PublicSiteHost", {hostname: site.hostname}, {siteId, canonical: "Y"})
    for (const [app, targetId] of [
        ["account", null],
        ["billing", site.organizationPartyId],
        ["support", site.organizationPartyId]
    ])
        createOnce("mantle.public.PublicSiteApp", {siteId, appMountId: app}, {app, pathPrefix: "/" + app, enabled: "Y", targetId})
    // the Shop mount (Shop P1, F-SP1-3): ZIZI_SHOP's at its root, ZIZI_DIGITAL's at /shop, each targeting its store
    createOnce(
        "mantle.public.PublicSiteApp",
        {siteId, appMountId: "shop"},
        {app: "shop", pathPrefix: site.shopPath, enabled: "Y", targetId: site.productStoreId}
    )
    if (site.forum)
        createOnce("mantle.public.PublicSiteApp", {siteId, appMountId: "forum"}, {app: "forum", pathPrefix: "/forum", enabled: "Y"})
}

// P4: ZIZI_SHOP's returns policy page, published, and its main menu linking the page and a published product
// (mantle.public.ThemeServices and SiteServices.publish#SitePage, as Commerce's publisher would); made once
const demoPage = {siteId: "ZIZI_SHOP", title: "Returns policy", routePath: "returns", pageRole: "returns"}
const demoPageText =
    "# Returns policy\n\nReturn an item within 30 days of delivery for a refund to your original payment.\n\n" +
    "Start a return from your order in your account, or ask us through Support.\n"
// P6 review (F-P6-7): ZIZI_SHOP's terms policy page, published the same way, so the demo store's Terms page readiness holds
const termsPage = {siteId: "ZIZI_SHOP", title: "Terms of sale", routePath: "terms", pageRole: "terms"}
const termsPageText =
    "# Terms of sale\n\nPrices are in US dollars and include the shipping shown at checkout; tax is added where it applies.\n\n" +
    "An order is accepted when it ships. See the Returns policy for returns and refunds.\n"
function ensurePages(page = demoPage, pageText = demoPageText) {
    const S = "mantle.public."
    const found = lib.rows(S + "PublicSitePage", {siteId: page.siteId, pageRole: page.pageRole})[0]
    if (!found) {
        const created = call(S + "ThemeServices.store#SitePage", Object.assign({pageText, changeReason: "Demo"}, page))
        call(S + "SiteServices.publish#SitePage", {
            input: {
                sitePageId: created.sitePageId,
                versionName: created.versionName,
                expectedRevision: 0,
                changeReason: "Demo",
                operationKey: "demo-page-" + created.sitePageId
            }
        })
    }
}
function ensureMenu() {
    const S = "mantle.public."
    const page = lib.rows(S + "PublicSitePage", {siteId: demoPage.siteId, pageRole: demoPage.pageRole})[0]
    if (!page) throw new Error("ZIZI_SHOP has no returns page for its menu")
    if (lib.rows(S + "PublicSiteNavigation", {siteId: demoPage.siteId, menuKey: "main"}).length) return
    const menu = call(S + "ThemeServices.store#SiteNavigation", {siteId: demoPage.siteId, menuKey: "main", name: "Main menu"})
    let revision = 0
    for (const item of [
        {label: "Demo Product One-One", destinationTypeEnumId: "SdtProduct", destinationValue: "DEMO_1_1"},
        {label: "Returns", destinationTypeEnumId: "SdtPage", destinationValue: page.sitePageId}
    ])
        revision = call(S + "ThemeServices.store#SiteNavigation", {
            siteId: demoPage.siteId,
            navigationId: menu.navigationId,
            expectedRevision: revision,
            item
        }).draftRevision
    call(S + "ThemeServices.publish#SiteNavigation", {
        siteId: demoPage.siteId,
        navigationId: menu.navigationId,
        expectedRevision: revision,
        changeReason: "Demo",
        operationKey: "demo-menu-" + menu.navigationId
    })
}

// P5: the demo store's theme draft (Commerce's designer edits it) and ZIZI_SHOP's preview host (its ThemeEditor's preview)
const demoTheme = {productStoreId: "POPC_DEFAULT", starter: "mr-pass/starter", name: "Ziziwork Retail theme"}
const previewHost = {hostname: "preview.shop.zizi.localhost", siteId: "ZIZI_SHOP"}
function ensureTheme() {
    if (lib.rows("mantle.public.PublicTheme", {productStoreId: demoTheme.productStoreId}).length) return
    call("mantle.public.ThemeServices.create#ThemeDraft", demoTheme)
}
function ensurePreviewHost() {
    createOnce(
        "mantle.public.PublicSiteHost",
        {hostname: previewHost.hostname},
        {siteId: previewHost.siteId, canonical: "N", hostKindEnumId: "PshkPreview"}
    )
}
function load() {
    const errors = []
    for (const name of Object.keys(sites).concat(["pages", "menu", "terms", "theme", "preview", "recovery", "subscriptions"])) {
        try {
            lib.probe("ironstone.commerce.DemoServices.run#CommerceDemoStep", {step: name})
        } catch (error) {
            ec.logger.error("Commerce demo site " + name + " was not made: " + error.message)
            errors.push(name + ": " + error.message)
        }
    }
    return {complete: errors.length === 0, errors}
}
// P10: the demo's consenting customer, Joe Q Public (CustJqp, whose account Customer Service's demo verifies), with POPC_DEFAULT's
// cart reminders on, as he would turn them on in the email preferences page; the store's recovery stays off until enabled
const recoveryCustomer = {partyId: "CustJqp", productStoreId: "POPC_DEFAULT"}
function ensureRecoveryConsent() {
    const {partyId, productStoreId} = recoveryCustomer
    if (!one("mantle.party.Party", {partyId})) return
    if (call("mantle.public.AccountHubServices.check#CartReminderConsent", {partyId, productStoreId}).consented) return
    call("mantle.public.AccountHubServices.apply#CheckoutOptIn", {
        optInId: "cartReminders",
        mode: "grant",
        partyId,
        productStoreId,
        sourceEnumId: "PcsForm",
        evidenceText: "Commerce demo: cart reminders turned on"
    })
}
// Shop P7: BOSS_COM_DIGITAL's monthly offer, saved through store#RecurringOffer as Commerce's RecurringPolicy editor would (it
// also points the site's subscription address at Shop's Subscriptions page), its paid access bound (P15, Shop F107) to
// ZIZI_DIGITAL's members' Forum category, as a Forum operator sets it up through the Forum's staff services: the category
// (store#Category), its audience (members of the category, published, qualifying subscription and manual grants:
// set#CategoryAccess) and the binding (store#SubscriptionBinding), so a subscriber's grant opens that category to them once
// they are a member of the site; made once. The category is made by load#CommerceForumDemo, from a data file of its own after
// this one (BossZZCommerceForumDemoData.xml): the Forum's operations lock the operator's account row, which the data load's
// own transaction holds once the demo signs its administrator in, so they run in that transaction, not one of their own
const paidAccess = {
    siteId: "ZIZI_DIGITAL",
    productStoreId: "BOSS_COM_DIGITAL",
    productId: "BOSS_COM_PAID_MONTH",
    subscriptionResourceId: "BOSS_COM_PAID_ACCESS",
    categorySlug: "members",
    categoryName: "Members"
}
// a Forum operation's result, its refusal thrown
function forum(service, input) {
    const out = call(service, {input})
    return out.result || {}
}
function ensurePaidCategory() {
    const {siteId, subscriptionResourceId, categorySlug, categoryName} = paidAccess
    let category = lib.rows("mantle.forum.ForumCategory", {siteId, slug: categorySlug})[0]
    if (!category) {
        const made = forum("mantle.forum.ForumServices.store#Category", {
            siteId,
            operationId: "commerce-demo-members-" + siteId,
            name: categoryName,
            slug: categorySlug,
            rules: "<p>For Ziziwork Digital members: a monthly membership opens this category.</p>"
        })
        category = one("mantle.forum.ForumCategory", {contactListId: made.contactListId})
    }
    if (category.publicationState !== "published")
        forum("mantle.forum.ForumServices.set#CategoryAccess", {
            siteId,
            contactListId: category.contactListId,
            visibility: "category",
            publicationState: "published",
            qualifyingSources: ["subscription", "manual"],
            expectedRevision: Number(category.policyRevision),
            confirm: true
        })
    const binding = one("mantle.public.PublicSubscriptionBinding", {subscriptionResourceId})
    if (!binding)
        forum("mantle.public.SiteServices.store#SubscriptionBinding", {
            siteId,
            subscriptionResourceId,
            targetType: "category",
            contactListId: category.contactListId,
            reason: "Commerce demo: the monthly membership opens the members' category"
        })
    // a database loaded before P15 bound the resource to the whole site (Shop F107); a bound resource keeps its scope, so the
    // demo moves its own binding while no subscriber's grant names it yet
    else if (
        binding.targetType === "site" &&
        !lib.rows("mantle.public.PublicAccessGrant", {siteId, targetType: "site", sourceType: "subscription"}).length
    )
        call("update#mantle.public.PublicSubscriptionBinding", {
            subscriptionResourceId,
            targetType: "category",
            targetId: category.contactListId
        })
}
function ensureSubscriptionOffer() {
    const {productStoreId, productId} = paidAccess
    if (lib.rows("mantle.product.subscription.StoreRecurringOffer", {productStoreId, productId}).length) return
    call("mantle.product.ShopSubscriptionServices.store#RecurringOffer", {
        productStoreId,
        productId,
        offerName: "Monthly membership",
        priceAmount: "9.00",
        autoRenew: "Y",
        termsVersion: "1"
    })
}
function runStep(p) {
    if (p.step === "subscriptions") return ensureSubscriptionOffer() || {}
    if (p.step === "recovery") return ensureRecoveryConsent() || {}
    if (p.step === "theme") return ensureTheme() || {}
    if (p.step === "preview") return ensurePreviewHost() || {}
    if (p.step === "pages" || p.step === "menu" || p.step === "terms") {
        if (p.step === "pages") ensurePages()
        else if (p.step === "terms") ensurePages(termsPage, termsPageText)
        else ensureMenu()
        return {}
    }
    const site = Object.hasOwn(sites, String(p.step || "")) ? sites[p.step] : null
    if (!site) throw new Error("Unknown Commerce demo step " + p.step)
    ensureSite(site)
    return {}
}
// load#CommerceForumDemo: ZIZI_DIGITAL's members' category and the paid access's binding to it, in the caller's transaction
const loadForum = () => ensurePaidCategory() || {}
const operations = {load, runStep, loadForum}
;({
    sites,
    paidAccess,
    demoTheme,
    previewHost,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Commerce demo operation " + op)
        return asDemoAdministrator(() => operations[op](parameters || {}))
    }
})
