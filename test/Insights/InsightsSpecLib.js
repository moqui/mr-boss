// Helpers the Insights specs share: the demo ids (data/BossUsersDemoData.xml), the demo users by group, a block run as a user with
// artifact authorization on, a call's refusal message, an Insights page render and the shell's menu and providers. Later phases
// add their ids and users here.
const ids = {
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES",
    // every Insights user's menu (P2: the dashboards and Report builder › Explore; P4: Reports and Saved reports; P7: Scheduled
    // reports and Management digest, which replaced the last copied screen, impl-insights F20; P8: Business alerts; P9:
    // Business flows; P10: Settings; then the framework's CalcGrid, mounted by location)
    readerMenu: [
        "Home",
        "Dashboards",
        "Panels",
        "Playlists",
        "ReportBuilder",
        "Reports",
        "SavedReports",
        "ScheduledReports",
        "ManagementDigest",
        "Alerts",
        "Flows",
        "Settings",
        "CalcGrid"
    ]
}
// The demo users of each group (each also in BOSS_INSIGHTS but the administrator), agents of Ziziwork Retail but the Services
// reader, none in ADMIN; the reader with financial read; a Projects client contact, a PASS public account and another app's
// user; and an instance administrator (ADMIN).
const users = {
    reader: "insights.reader",
    author: "insights.author",
    steward: "insights.steward",
    distributor: "insights.distributor",
    flow: "insights.flow",
    admin: "insights.admin",
    services: "insights.services",
    finance: "insights.finance",
    // P4: an Insights reader who is a Customer Service manager, and one who is a Warehouse user
    serviceManager: "insights.servicemanager",
    warehouse: "insights.warehouse",
    client: "sheldon.acme",
    pass: "dana@joesdist.example.com",
    otherApp: "customerservice.read",
    system: "john.doe"
}

// Run action as username with artifact authorization enabled, then sign in again as the user before.
function asUser(username, action) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        ec.artifactExecution.enableAuthz()
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
// An Insights screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a
// widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Insights.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a
// refusal name the authorization.
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// The shell's menu of Insights and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell
// data (the launcher and providers).
function shell(user, menuOnly = false) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Insights/Home", {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Insights") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Insights")?.providers
        }
    })
}
// A transition of an Insights screen asked as the user through a root (Insights' own, or webroot for another app's route),
// posted unless it is a read (method null); no page is rendered. Where it sends the browser, its errors and what it
// answered.
function transition(user, root, path, parameters, method = "post") {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(root).render(path, parameters, method)
        const out = {
            status: result.status,
            location: String(result.header("Location") || ""),
            errors: Array.from(result.errorMessages || []).join(" | "),
            output: String(result.output || "")
        }
        ec.message.clearErrors()
        return out
    })
}
// The framework's report screens Insights mounts by location (mr-moqui plans/archive/Admin-Screens-Down.md, Track I: Library panels,
// Report builder's Explore and Compare, and Scheduled reports' three screens), as [path under Insights, location], read from the subscreens items of the root
// and of each area: the screen sweeps (acceptance InsightsTui and InsightsServerStatic) list Insights' screens from its own
// files, which these have left.
function mountedScreens() {
    const base = "component://mr-boss/screen/"
    const found = []
    const read = (reference, prefix) => {
        for (const match of String(reference.getText()).matchAll(
            /<subscreens-item name="([A-Za-z0-9]+)" location="(component:\/\/tools\/screen\/Dashboards\/[A-Za-z0-9]+\.xml)"/g
        ))
            found.push([prefix + match[1], match[2]])
    }
    read(ec.resource.getLocationReference(base + "Insights.xml"), "")
    for (const area of ec.resource.getLocationReference(base + "Insights").getDirectoryEntries()) {
        if (!/\.xml$/.test(area.location)) continue
        read(area, area.location.substring(area.location.lastIndexOf("/") + 1).replace(/\.xml$/, "") + "/")
    }
    return found
}

;({ids, users, asUser, system, refusal, invoke, page, screenRefusal, shell, transition, mountedScreens})
