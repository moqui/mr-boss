// The IronStone Projects root (design-projects.md §1; impl-projects.md P1): its shell providers in shellData (the + menu
// kinds to Projects/QuickCreate, and the project kind to the managers' Projects/QuickProject, which the team is not offered
// (impl-projects.md F8, P2), the palette actions and types, the go-to keys of the projects scope); its menu by group
// (data/BossSetupData.xml: the managers' screens WorkItems/Import, Billing and Settings absent for the team); and the record
// links of ironstone.commons.PaletteServices.get#RecordLink: a project, and a task or request of a project, open in Projects for a
// user who may open it, else a task or request in Commons and a project nowhere, while a personal task stays in Commons.
// Authorization stays on, as for a shell request.
// Run: ./moq test mr-boss --spec ProjectsShell
const webroot = "component://webroot/screen/webroot.xml"

function shellJson(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render(path, parameters || {}, null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), json, text: String(str.output || "").substring(0, 400) }
}
// the subscreen names of each level of the menu data of a path under the apps root, by the level's name
function menuOf(path) {
    const found = shellJson(`menuData/apps/${path}`)
    const levels = {}
    for (const level of Array.isArray(found.json) ? found.json : [])
        levels[level.name] = (level.subscreens || []).filter((item) => item.menuInclude).map((item) => item.name)
    return { status: found.status, levels }
}
// as the user; withAuthz turns authorization on, as for a shell request (a spec runs with it off)
function as(username, run, withAuthz) {
    login(username)
    const wasDisabled = withAuthz && ec.artifactExecution.authzDisabled()
    if (wasDisabled) ec.artifactExecution.enableAuthz()
    try { return run() } finally {
        if (wasDisabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
const link = (parameters) => ec.service.sync().name("ironstone.commons.PaletteServices.get#RecordLink").parameters(parameters).call() || {}

spec({
    setupSpec() {
        login("john.doe")
        // a user in no group, for the links of one without Projects
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            if (!ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_TEST_NOPROJ").one())
                ec.service.sync().name("create#moqui.security.UserAccount").parameters({ userId: "BOSS_TEST_NOPROJ", username: "boss.test.noprojects",
                    userFullName: "Bob Acme", partyId: "ORG_ACME_BA", currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394", passwordHashType: "SHA" }).call()
        } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
    },
    cleanupSpec() {
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try { ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_TEST_NOPROJ").deleteAll() }
        finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
    },
})

feature("shellData lists Projects with its quick-create kinds, palette actions and types, and its go-to keys", {
    when() {
        const found = shellJson("shellData")
        const apps = found.json && Array.isArray(found.json.apps) ? found.json.apps : []
        const projects = (apps.find((item) => item.name === "Projects") || { providers: {} }).providers
        // the team: the same, without the project kind and action
        const team = as("joe.developer", () => {
            const teamFound = shellJson("shellData")
            const teamApps = teamFound.json && Array.isArray(teamFound.json.apps) ? teamFound.json.apps : []
            const providers = (teamApps.find((item) => item.name === "Projects") || { providers: {} }).providers
            return { kinds: (providers.quickCreate || []).map((kind) => kind.kind), actions: (providers.paletteActions || []).map((action) => action.label) }
        }, true)
        return { team, status: found.status, title: (apps.find((item) => item.name === "Projects") || {}).title,
            kinds: (projects.quickCreate || []).map((kind) => kind.kind), kindUrls: (projects.quickCreate || []).map((kind) => kind.url),
            actions: (projects.paletteActions || []).map((action) => action.label), actionUrls: (projects.paletteActions || []).map((action) => action.url),
            types: projects.paletteTypes || [], keymaps: (projects.keymaps || []).map((map) => ({ scope: map.scope, keys: map.keys.map((key) => key.keys) })) }
    },
    then({ team, status, title, kinds, kindUrls, actions, actionUrls, types, keymaps }) {
        status == 200
        title == "Projects"
        kinds == ["workItem", "time", "project"]
        kindUrls == ["/qapps/Projects/QuickCreate?kind=workItem", "/qapps/Projects/QuickCreate?kind=time", "/qapps/Projects/QuickProject"]
        actions == ["New work item", "New project", "Log time", "My time", "Team planner"]
        team.kinds == ["workItem", "time"]
        team.actions == ["New work item", "Log time", "My time", "Team planner"]
        actionUrls[3] == "/qapps/Projects/Time/MyTime"
        actionUrls[4] == "/qapps/Projects/Resources/TeamPlanner"
        types == ["MantleProject", "MantleTask", "MantleRequest"]
        keymaps == [{ scope: "projects", keys: ["g w", "g b", "g r", "g o", "g t"] }]
    },
})

feature("the Projects menu: managers get every entry, the team not Import, Billing and Settings", {
    when() {
        return { manager: menuOf("Projects/WorkItems"), team: as("joe.developer", () => menuOf("Projects/WorkItems"), true),
            teamBilling: as("joe.developer", () => shellJson("menuData/apps/Projects/Billing").status, true),
            teamTime: as("joe.developer", () => menuOf("Projects/Time"), true) }
    },
    then({ manager, team, teamBilling, teamTime }) {
        manager.status == 200
        manager.levels.Projects == ["Home", "Projects", "WorkItems", "Requests", "Code", "Time", "Resources", "Billing", "Reports", "Settings"]
        manager.levels.WorkItems == ["Backlog", "Timeline", "Import"]
        team.status == 200
        team.levels.Projects == ["Home", "Projects", "WorkItems", "Requests", "Code", "Time", "Resources", "Reports"]
        team.levels.WorkItems == ["Backlog", "Timeline"]
        teamBilling == 403
        teamTime.levels.Time == ["MyTime", "Timesheets", "TimeEntries"]
    },
})

feature("a project's records open in Projects for its users, in Commons for others; a personal task stays in Commons", {
    when() {
        // the service as the palette calls it (its screens' app root grants it); since mr-moqui e29d336f (impl-projects.md F77) an earlier
        // feature's shell data no longer leaves authorization off in this context
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            const forJohn = { project: link({ docType: "MantleProject", id: "IRON" }), task: link({ recordEntityName: "mantle.work.effort.WorkEffort", id: "IRON-3" }),
                personal: link({ docType: "MantleTask", id: "BOSS_DEMO_TASK" }), request: link({ docType: "MantleRequest", id: "BOSS_DEMO_REQUEST" }) }
            // a user without Projects (a temporary account of Bob Acme, in no group): Commons, and no link to a project
            const forOther = as("boss.test.noprojects", () => ({ project: link({ docType: "MantleProject", id: "IRON" }),
                task: link({ docType: "MantleTask", id: "IRON-3" }) }))
            // Sheldon Acme, a client contact (impl-projects.md P10): Projects alone, whose screens check what he may see
            const forSheldon = as("sheldon.acme", () => ({ project: link({ docType: "MantleProject", id: "ACME" }),
                task: link({ docType: "MantleTask", id: "ACME-1" }), personal: link({ docType: "MantleTask", id: "BOSS_DEMO_TASK" }),
                party: link({ docType: "MantleParty", id: "ORG_ACME" }), sprint: link({ recordEntityName: "mantle.work.effort.WorkEffort", id: "IRON-SP-2" }) }))
            return { forJohn, forOther, forSheldon }
        } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
    },
    then({ forJohn, forOther, forSheldon }) {
        forJohn.project.url == "/qapps/Projects/Projects/ProjectDetail?workEffortId=IRON"
        forJohn.project.icon == "sym_o_assignment"
        forJohn.task.url == "/qapps/Projects/WorkItems/WorkItemDetail?workEffortId=IRON-3"
        forJohn.personal.url == "/qapps/Commons/Tasks/TaskDetail?workEffortId=BOSS_DEMO_TASK"
        forJohn.request.url == "/qapps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST"
        forOther.project.url == null
        forOther.task.url == "/qapps/Commons/Tasks/TaskDetail?workEffortId=IRON-3"
        forSheldon.project.url == "/qapps/Projects/Projects/ProjectDetail?workEffortId=ACME"
        forSheldon.task.url == "/qapps/Projects/WorkItems/WorkItemDetail?workEffortId=ACME-1"
        forSheldon.personal.url == null
        forSheldon.party.url == null
        forSheldon.sprint.url == null
    },
})

feature("the details the links open render: the project's detail and the work item's (P2), the request's (P5)", {
    when() {
        const render = (path, parameters) => {
            const str = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Projects.xml").renderMode("qvt").withStaticData()
                    .render(path, Object.assign({ lastStandalone: "-2" }, parameters), null)
            return { status: str.status, errors: str.errorMessages.join(" | "), output: String(str.output || "") }
        }
        return { project: render("Projects/ProjectDetail", { workEffortId: "IRON" }), task: render("WorkItems/WorkItemDetail", { workEffortId: "IRON-3" }),
            request: render("Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST" }) }
    },
    then({ project, task, request }) {
        project.status == 200
        project.errors == ""
        project.output.includes("IronStone Projects")
        project.output.includes("ProjectStatusBar")
        task.status == 200
        task.errors == ""
        task.output.includes("Expand and collapse rows")
        task.output.includes("WorkItemStatusBar")
        request.status == 200
        request.errors == ""
        request.output.includes("Set up the shared team calendar")
    },
})
