// Marketing's terminal sweep (impl-marketing P23; design-marketing §16.3 scenario 16; style-guide §4.8, §8.1; AGENTS.md: one sweep per
// app per mode, in acceptance): every Marketing screen file under its root (the calendar's terminal twin CalendarTui among them), each
// screen its files mount from elsewhere (MarketingSpecLib.mountedScreens: Chatter and RecordFiles, Comms' Consent, the Suppressions,
// MessageTemplates, MessageTemplateDetail, CampaignDelivery and SendingProfiles Marketing built for Comms, Commerce's promotion and page
// screens, Commons' Knowledge and EventDetail, the survey builder's four screens, Sales' Leads, Accounts and LeadSources and the shared
// Customer360) and each tab of a mount that Marketing's menu shows, renders in the tui render mode as a document of the TUI model (v 1)
// with no error node, on the demo's records (MarketingSpecLib.sweepParameters; a staff registration of the webinar, which the demo has
// none of, made by MarketingSpecLib.sweepMade), and the second records of MarketingSpecLib.sweepExtras, as john.doe (ADMIN, who holds
// every MARKETING_* permission in every organization) with artifact authorization on. The two old placeholders' routes kept as
// redirects (Newsletters, Segments) answer a redirect, not a document. No date of a demo send is read (follow-up 6 makes them relative
// to the load). TuiRender does not sweep Marketing; the server-static sweep is MarketingServerStatic. Each screen's own render checks
// are the phases' regression specs.
// Run: ./moq accept mr-boss --spec MarketingTui
const root = "component://mr-boss/screen/Marketing.xml"
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
let screens, redirects, made

// the paths under the Marketing root of its own screen files (the redirects apart), then the mounts and the tabs of each its menu shows
function sweepScreens() {
    const files = []
    ec.resource.getLocationReference(root).walkChildTree(files, null)
    const own = files
        .filter(file => file.path !== "Marketing" && file.location.endsWith(".xml"))
        .map(file => file.path.substring("Marketing/".length))
        .filter(path => !redirects.includes(path))
    const mounts = []
    for (const [path] of lib.mountedScreens()) {
        if (!mounts.includes(path)) mounts.push(path)
        for (const tab of lib.mountTabs(path, lib.sweepParameters(path, made))) if (!mounts.includes(tab)) mounts.push(tab)
    }
    return own.concat(mounts.filter(path => !own.includes(path)))
}
// the error nodes of a TUI document, walking its nodes and a form list's cells (TuiRender's walk)
function walk(nodes, errors) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        if (node.t === "formList") for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors)
        walk(node.c, errors)
    }
}
function cellWalk(cell, errors) {
    if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors)
    else if (cell && typeof cell === "object") walk([cell], errors)
}
function tui(path, values) {
    const rendered = ec.screen
        .makeTest()
        .rootScreen(root)
        .renderMode("tui")
        .render(path, Object.assign({lastStandalone: "-2"}, values || {}), null)
    let doc = null
    try {
        doc = JSON.parse(rendered.output)
    } catch (error) {
        doc = null
    }
    const nodeErrors = []
    if (doc) walk(doc.c, nodeErrors)
    const errors = Array.from(rendered.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: rendered.status, errors, doc, nodeErrors, output: String(rendered.output || "")}
}
// a render's failure line, or null when it is a TUI document with no error node
function failure(label, got) {
    if (got.status != 200 || got.errors) return `${label}: status ${got.status}, ${got.errors}`
    if (!got.doc || got.doc.v != 1) return `${label}: not a TUI document: ${got.output.substring(0, 160)}`
    if (got.nodeErrors.length) return `${label}: ${got.nodeErrors.join(" | ")}`
    return null
}

spec({
    setupSpec() {
        login("john.doe")
        made = lib.sweepMade()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        redirects = lib.redirectScreens()
        screens = sweepScreens()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("every Marketing screen, mount and mounted tab renders in tui as a model document with no error node", {
    when() {
        const failures = []
        for (const path of screens) {
            const line = failure(path, tui(path, lib.sweepParameters(path, made)))
            if (line) failures.push(line)
        }
        for (const [path, parameters] of lib.sweepExtras()) {
            const line = failure(`${path} ${JSON.stringify(parameters)}`, tui(path, parameters))
            if (line) failures.push(line)
        }
        // a redirect of an old placeholder's route: a 302, or the 205 a standalone render answers, never an error
        for (const path of redirects) {
            const got = tui(path, {})
            if (got.status != 302 && got.status != 205) failures.push(`${path} (a redirect): status ${got.status}, ${got.errors}`)
        }
        if (failures.length) log.warn(`Marketing TUI failures:\n${failures.join("\n")}`)
        return {failures, screens, redirects}
    },
    then({failures, screens, redirects}) {
        // 67 screen files under the root (the two redirects apart), 26 mounts and their menus' tabs (PageDetail's, Customer360's)
        screens.length > 85
        screens.includes("Home")
        screens.includes("CalendarTui")
        screens.includes("Campaigns/CampaignDetail")
        screens.includes("Campaigns/CampaignPlan")
        screens.includes("Audiences/ListDetail")
        screens.includes("Audiences/Consent")
        screens.includes("Audiences/Suppressions")
        screens.includes("Sends/SendDetail")
        screens.includes("Sends/CampaignDelivery")
        screens.includes("Sends/MessageTemplateDetail")
        screens.includes("Automations/AutomationDetail")
        screens.includes("Promotions/PromotionDetail")
        screens.includes("Content/PageDetail")
        screens.includes("Content/Knowledge")
        screens.includes("Events/EventDetail")
        screens.includes("Events/RegistrationDetail")
        screens.includes("Events/CheckIn")
        screens.includes("Surveys/Responses")
        screens.includes("Leads/Leads")
        screens.includes("Leads/Accounts")
        screens.includes("Customers/Customer360")
        screens.includes("Contacts/ContactDetail")
        screens.includes("Reports/Attribution")
        screens.includes("Settings/SendingProfiles")
        screens.includes("Settings/LeadSources")
        screens.includes("Chatter")
        redirects.includes("Newsletters") && redirects.includes("Segments")
        !!made.registrationId
        failures.join("\n") == ""
    }
})
