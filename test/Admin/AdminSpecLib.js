// Helpers the Admin specs share: the demo ids (data/BossUsersDemoData.xml), the demo users by group, a block run as a user with
// artifact authorization on or off, a call's refusal message, an Admin page render and the shell's menu and providers. Later
// phases add their ids and users here.
const ids = {
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES",
    // Accounting's demo organization, of no Admin user
    accountingOrganizationId: "BOSS_ACCT_ORG",
    // a staff identity of Retail and Services (shared.staff), one of Services only (commerce.services) and one of Retail only
    sharedUserId: "BOSS_ADM_SHARED",
    otherUserId: "BOSS_COM_SERVICES",
    retailUserId: "BOSS_COM_MANAGER",
    // the privileged groups mr-boss adds (MoquiConf.xml) and the custom group of the delegated access administrator
    accessGroupId: "BOSS_ADMIN_ACCESS",
    backupGroupId: "BOSS_ADMIN_BACKUP",
    adminGroupId: "BOSS_ADMIN_ADMIN",
    delegateGroupId: "BOSS_ADMIN_DEMO_DELEGATE"
}
// The demo users of each group (each also in BOSS_ADMIN but the administrator), all agents of Ziziwork Retail, none in ADMIN;
// the delegated access administrator; the shared identity; and an instance administrator (ADMIN).
const users = {
    reader: "admin.reader",
    identity: "admin.identity",
    access: "admin.access",
    configure: "admin.configure",
    integrations: "admin.integrations",
    operations: "admin.operations",
    data: "admin.data",
    audit: "admin.audit",
    privacy: "admin.privacy",
    backup: "admin.backup",
    admin: "admin.admin",
    delegate: "admin.delegate",
    shared: "shared.staff",
    system: "john.doe"
}
// BOSS users in no Admin group: a warehouse manager, to whom the settings index alone is granted (P2, impl-admin F46), and a
// finance reader, who reads Accounting's readiness in Accounting
const outsiders = {
    warehouseManager: "warehouse.manager",
    financeReader: "finance.read"
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
// An Admin screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a
// widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Admin.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// The shell's menu of Admin and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell data
// (the launcher and providers).
function shell(user, menuOnly = false) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Admin/Home", {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Admin") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Admin")?.providers
        }
    })
}

;({ids, users, outsiders, asUser, system, refusal, invoke, page, shell})
