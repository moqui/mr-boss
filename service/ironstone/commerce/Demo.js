// Commerce's demo (impl-commerce P1, F17; DemoServices.load#CommerceDemo, run from BossZCommerceDemoData.xml): the two PASS
// sites of the demo stores, disabled until published, with their Shop mounts (Shop P1): ZIZI_SHOP on
// shop.zizi.localhost for POPC_DEFAULT's organization, Ziziwork Retail, and ZIZI_DIGITAL on digital.zizi.localhost for
// BOSS_COM_DIGITAL's, Ziziwork Services, each with Shop, Account, Billing and Support mounts (Billing and Support targeting the
// store's organization, F38); (P4) ZIZI_SHOP's published returns policy page and main menu; and (P6 review) its published
// terms policy page, which checkout readiness asks of each Shop site. Each site, and each page, on its own (one that fails
// is named and the rest are made); idempotent.
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
        shopPath: "/shop"
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

function load() {
    const errors = []
    for (const name of Object.keys(sites).concat(["pages", "menu", "terms"])) {
        try {
            lib.probe("ironstone.commerce.DemoServices.run#CommerceDemoStep", {step: name})
        } catch (error) {
            ec.logger.error("Commerce demo site " + name + " was not made: " + error.message)
            errors.push(name + ": " + error.message)
        }
    }
    return {complete: errors.length === 0, errors}
}
function runStep(p) {
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
const operations = {load, runStep}
;({
    sites,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Commerce demo operation " + op)
        return asDemoAdministrator(() => operations[op](parameters || {}))
    }
})
