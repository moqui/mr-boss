// Helpers the Sales specs share: the demo ids (data/BossUsersDemoData.xml and the other apps' demo organizations), the demo users by
// group, a block run as a user with artifact authorization on, a call's refusal message, a Sales page render and the shell's menu
// and providers. Later phases add their ids and users here.
const ids = {
    // the Sales users' organization (Retail) and the second demo organization, the storeless seller (impl-sales F72), which
    // sales.rep3 works alone
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SALES",
    // the menu of design §1.2 built so far: every Sales user's (Pipeline since P4, Accounts since P3), and with Reports a report
    // reader's
    staffMenu: ["Home", "Pipeline", "Accounts"],
    reportMenu: ["Home", "Pipeline", "Accounts", "Reports"],
    reportsMenu: ["SalesSummary", "SalesAnalysis"],
    accountsMenu: ["Accounts", "Contacts"],
    keys: ["g s", "g a", "g c", "g o", "g l"],
    // P3's demo accounts and contacts (data/BossYSalesAccountsDemoData.xml): Retail's Wingtip Traders (sales.rep's, under its parent
    // Wingtip Group), Contoso Labs (a prospect, sales.rep2's), Kim Park (an individual customer) and the duplicate pair Adatum
    // Corporation and Adatum Corp; Dana Morales, a contact of Wingtip Traders and Contoso Labs; Ziziwork Sales' Fabrikam
    // Industrial (sales.rep3's, with its contact Lee Chen) and Tailspin Outfitters
    accounts: {
        wingtip: "BOSS_SAL_ACC_WINGTIP",
        group: "BOSS_SAL_ACC_WTGROUP",
        contoso: "BOSS_SAL_ACC_CONTOSO",
        kim: "BOSS_SAL_ACC_KIMPARK",
        adatum: "BOSS_SAL_ACC_ADATUM",
        adatum2: "BOSS_SAL_ACC_ADATUM2",
        fabrikam: "BOSS_SAL_ACC_FABRIKAM",
        tailspin: "BOSS_SAL_ACC_TAILSPIN"
    },
    contacts: {dana: "BOSS_SAL_CON_DANA", lee: "BOSS_SAL_CON_LEE"},
    // P2: Settings, the administrator's and, for Teams, the manager's (with Accounts and Reports a manager's menu); its tabs
    managerMenu: ["Home", "Pipeline", "Accounts", "Reports", "Settings"],
    settingsMenu: ["Readiness", "Stages", "Teams", "LeadSources", "TypesAndReasons"],
    // P4: Pipeline's tabs, and the demo deals (data/BossZSalesDemoData.xml): Retail East's (sales.rep's) Wingtip refit in Proposal with
    // an activity, its maintenance plan (recurring), Kim Park's renewal (won), a website lead and the trade fair lead in East's queue;
    // Retail West's (sales.rep2's) Contoso pilot on West's pipeline, Adatum's racks (lost), Contoso's second site (a lead) and a partner
    // referral in West's queue (no owner);
    // Ziziwork Sales' (sales.rep3's) Fabrikam line upgrade and its outbound-call lead
    pipelineMenu: ["Opportunities", "Leads"],
    deals: {
        wingtip: "BOSS_SAL_OPP_WINGTIP_Q4",
        wingtipPlan: "BOSS_SAL_OPP_WINGTIP_SVC",
        kim: "BOSS_SAL_OPP_KIM_RENEW",
        contoso: "BOSS_SAL_OPP_CONTOSO_PILOT",
        adatum: "BOSS_SAL_OPP_ADATUM_LOST",
        fabrikam: "BOSS_SAL_OPP_FABRIKAM_LINE",
        fairLead: "BOSS_SAL_OPP_LEAD_FAIR",
        webLead: "BOSS_SAL_OPP_LEAD_WEB",
        contosoLead: "BOSS_SAL_OPP_LEAD_CONTOSO",
        westQueueLead: "BOSS_SAL_OPP_LEAD_WEST_QUEUE",
        callsLead: "BOSS_SAL_OPP_LEAD_CALLS"
    },
    wingtipActivity: "BOSS_SAL_ACT_WINGTIP"
}
// The demo users of each group (each but the administrator also in BOSS_SALES), agents of Ziziwork Retail but sales.rep3 (Ziziwork
// Sales only) and sales.manager2 and sales.admin (both), none in ADMIN; a Projects client contact, a PASS public account and another
// app's user; an identity operator; and an instance administrator (ADMIN).
const users = {
    rep: "sales.rep",
    rep2: "sales.rep2",
    manager: "sales.manager",
    approver: "sales.approver",
    change: "sales.change",
    agreement: "sales.agreement",
    reader: "sales.reader",
    otherRep: "sales.rep3",
    bothManager: "sales.manager2",
    admin: "sales.admin",
    client: "sheldon.acme",
    pass: "dana@joesdist.example.com",
    otherApp: "customerservice.read",
    identity: "admin.identity",
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
// A Sales screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a widget's
// render error counted among the errors; root names another app's root for a shared screen's mount.
function page(path, parameters = {}, mode = "qvt", root = "Sales") {
    const renderer = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a refusal
// name the authorization.
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// A path under the web root as the user (the REST APIs, menu and shell data): its status, output and whether it was refused.
function hit(path, parameters = {}) {
    const result = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, null)
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {
        status: result.status,
        output: String(result.output || ""),
        refused: result.status == 401 || result.status == 403 || /not authorized/i.test(errors)
    }
}
// The shell's menu of Sales and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell data (the
// launcher and providers). path and group give another level of the menu (Reports' tabs).
function shell(user, menuOnly = false, path = "Home", group = "Sales") {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen
            .makeTest()
            .rootScreen(root)
            .render("menuData/apps/Sales/" + path, {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === group) : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Sales")?.providers
        }
    })
}

;({ids, users, asUser, system, refusal, invoke, page, screenRefusal, hit, shell})
