// Commerce's demo (impl-commerce P1, F17; DemoServices.load#CommerceDemo, run from BossZCommerceDemoData.xml): the two PASS
// sites of the demo stores, disabled until published (Shop P1 adds their Shop mounts and publication): ZIZI_SHOP on
// shop.zizi.localhost for POPC_DEFAULT's organization, Ziziwork Retail, and ZIZI_DIGITAL on digital.zizi.localhost for
// BOSS_COM_DIGITAL's, Ziziwork Services, each with Account, Billing and Support mounts (Billing and Support targeting the
// store's organization, F38). Each site on its own (one that fails is named and the other is made); idempotent.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, call} = lib

const sites = {
    shop: {
        siteId: "ZIZI_SHOP",
        name: "Ziziwork Retail Store",
        hostname: "shop.zizi.localhost",
        organizationPartyId: "ORG_ZIZI_RETAIL"
    },
    digital: {
        siteId: "ZIZI_DIGITAL",
        name: "Ziziwork Digital Store",
        hostname: "digital.zizi.localhost",
        organizationPartyId: "ORG_ZIZI_SERVICES"
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
}

function load() {
    const errors = []
    for (const name of Object.keys(sites)) {
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
