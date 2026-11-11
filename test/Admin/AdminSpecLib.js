// Helpers the Admin specs share: the demo ids (data/BossUsersDemoData.xml), the demo users by group, a block run as a user with
// artifact authorization on or off, a call's refusal message, an Admin page render, the shell's menu and providers, and the
// acceptance sweeps' screens and demo records (P19). Later phases add their ids and users here.
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

// The screen sweeps' screens (P19; acceptance AdminTui and AdminServerStatic): [path under Admin, location] of every screen file
// under screen/Admin, the shared screens its areas mount (Data/DataImport) and the framework's System screens its areas mount
// by location (mr-moqui plans/Admin-Screens-Down.md: Operations' Jobs, JobRuns and JobRunDetail, Mail and protocols' MailRelays
// and MailRelayDetail), but System, which is Tools' screens for ADMIN, swept with Tools.
function sweepScreens() {
    const base = "component://mr-boss/screen/"
    const found = []
    const files = []
    ec.resource.getLocationReference(base + "Admin.xml").walkChildTree(files, null)
    for (const file of files)
        if (file.path !== "Admin" && /\.xml$/.test(file.location))
            found.push([file.path.substring("Admin/".length), file.location])
    for (const area of ec.resource.getLocationReference(base + "Admin").getDirectoryEntries()) {
        if (!/\.xml$/.test(area.location)) continue
        const areaName = area.location.substring(area.location.lastIndexOf("/") + 1).replace(/\.xml$/, "")
        for (const match of String(area.getText()).matchAll(
            /<subscreens-item name="([A-Za-z0-9]+)" location="(component:\/\/(?:mr-boss\/screen\/Shared|tools\/screen\/System\/[A-Za-z0-9]+)\/[A-Za-z0-9]+\.xml)"/g
        ))
            if (!found.some(([known]) => known === areaName + "/" + match[1])) found.push([areaName + "/" + match[1], match[2]])
    }
    return found
}
// The demo records the sweeps open a detail screen on: the fixed demo ids, and the first row of a kind the demo or the setup
// makes (none: the screen's own "not available" render, which is a render too).
function sweepParameters() {
    const first = (entity, field, conditions = {}) =>
        system(
            () =>
                Array.from(ec.entity.find(entity).condition(conditions).selectField(field).orderBy(field).limit(1).list())[0]?.[
                    field
                ] || "NONE"
        )
    return {
        "Access/GroupDetail": {userGroupId: ids.delegateGroupId},
        "Access/AccessReview": {groups: ids.delegateGroupId},
        "Users/UserDetail": {userId: ids.retailUserId},
        "Users/LifecycleDetail": {operationId: first("mantle.party.UserLifecycleOperation", "operationId")},
        "Settings/OrganizationDetail": {organizationPartyId: ids.organizationId},
        "Integrations/ConnectionDetail": {
            adapterKey: "paymentGateway",
            connectionKey: first("mantle.account.method.PaymentGatewayConfig", "paymentGatewayConfigId")
        },
        "Integrations/MessageTypeDetail": {
            systemMessageTypeId: first("moqui.service.message.SystemMessageType", "systemMessageTypeId")
        },
        "Integrations/SystemMessageDetail": {systemMessageId: first("moqui.service.message.SystemMessage", "systemMessageId")},
        "Protocols/MailRelayDetail": {connectionKey: "SYSTEM"},
        "Security/IdentityProviderDetail": {authFlowId: first("moqui.security.sso.AuthFlow", "authFlowId")},
        "Operations/JobDetail": {jobName: "backup_EmbeddedDatabase_daily"},
        "Operations/JobRunDetail": {jobRunId: first("moqui.service.job.ServiceJobRun", "jobRunId")},
        "Operations/TopicDetail": {topic: "ServiceJobError"},
        "Data/DataImport": {targetId: "staffInvitations"},
        "Data/ImportDetail": {targetId: "catalog", operationKey: "NONE"},
        LogNote: {entityName: "moqui.security.UserAccount", recordId: ids.retailUserId}
    }
}

;({ids, users, outsiders, asUser, system, refusal, invoke, page, shell, sweepScreens, sweepParameters})
