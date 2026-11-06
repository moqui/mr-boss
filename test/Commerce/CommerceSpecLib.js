// Helpers the Commerce specs share: the demo ids (data/BossCommerceDemoData.xml, BossZCommerceDemoData.xml,
// BossUsersDemoData.xml), the demo users by group, a block run as a user with artifact authorization on or off, a call's
// refusal message, a Commerce page render and the shell's menu and providers. Later phases add their ids and users here.
const ids = {
    // Ziziwork Retail's demo store and Ziziwork Services' digital store
    storeId: "POPC_DEFAULT",
    otherStoreId: "BOSS_COM_DIGITAL",
    // Accounting's store of its own demo organization (BOSS_ACCT_ORG), in no Commerce user's scope
    accountingStoreId: "BOSS_ACCT_STORE",
    // the demo sites, disabled until published
    siteId: "ZIZI_SHOP",
    otherSiteId: "ZIZI_DIGITAL",
    // Retail's store orders (Customer Service's demo, of POPC_DEFAULT) and Services' (BOSS_CS_SO_OTHER, of no store)
    storeOrderId: "BOSS_CS_SO_DELIVERED",
    noStoreOrderId: "BOSS_CS_SO_OTHER",
    customerId: "CustJqp",
    otherCustomerId: "BOSS_CS_CUST_OTHER",
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES"
}
// The demo users of each group (each also in BOSS_COMMERCE but the administrator), the store-limited staff member and the
// other organization's manager.
const users = {
    manager: "commerce.manager",
    merchandiser: "commerce.merchandiser",
    designer: "commerce.designer",
    developer: "commerce.developer",
    publisher: "commerce.publisher",
    operator: "commerce.operator",
    channel: "commerce.channel",
    subscriptions: "commerce.subscriptions",
    admin: "commerce.admin",
    read: "commerce.read",
    storeStaff: "commerce.storestaff",
    services: "commerce.services"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Commerce screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a
// widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// The shell's menu of Commerce and the launcher's apps for the user, as the shell fetches them.
function shell(user) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Commerce/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Commerce") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Commerce")?.providers
        }
    })
}

;({ids, users, asUser, system, refusal, invoke, page, shell})
