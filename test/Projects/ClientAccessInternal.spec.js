// Client access leaves internal users' access as it was (impl-projects.md P10a; F3): Commons and Comms are authorized for
// ALL_USERS by AUTHZT_ALLOW where they were AUTHZT_ALWAYS, so the client group's deny reaches; an ALLOW does not pass a deny
// below it, so this spec proves nothing relied on ALWAYS. With authorization on, for a project manager (john.doe), a team
// member (joe.developer) and a user in no group but ALL_USERS (a temporary account), the menu data of every Commons and Comms
// screen (each level lists the subscreens the user may open) and the render of their app roots and main screens are the same
// with the records as ALWAYS (put back for the comparison) and as ALLOW; the new client groups and filter set change nothing
// for them either: the Projects menu and what the team is denied are as before, and no client filter reaches their finds.
// Run: ./moq test mr-boss --spec ClientAccessInternal
const webroot = "component://webroot/screen/webroot.xml"
const base = "component://mr-boss/screen"
const USERS = ["john.doe", "joe.developer", "boss.test.allusers"]
const MAIN = ["Commons/Home", "Commons/Tasks", "Commons/Contacts", "Commons/Calendar", "Commons/Knowledge", "Commons/Notes", "Commons/Files",
    "Commons/Settings/Index", "Comms/Home", "Comms/Inbox", "Comms/Chat", "Comms/Settings"]

function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    const wasDisabled = ec.artifactExecution.authzDisabled()
    if (wasDisabled) ec.artifactExecution.enableAuthz()
    try { return run() } finally {
        if (wasDisabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
// the screen paths under Commons and Comms
function screenPaths() {
    const paths = []
    for (const app of ["Commons", "Comms"]) {
        const files = []
        ec.resource.getLocationReference(`${base}/${app}.xml`).walkChildTree(files, null)
        for (const file of files) if (file.location.endsWith(".xml")) paths.push(file.path)
    }
    return paths
}
// what the user may open: the menu data of each path (status and the subscreen names of each level) and the status of the main
// screens
function fingerprint(paths) {
    const out = {}
    for (const path of paths) {
        const str = ec.screen.makeTest().rootScreen(webroot).render(`menuData/apps/${path}`, {}, null)
        let levels = null
        try { levels = JSON.parse(str.output).map((level) => level.name + ":" + (level.subscreens || []).map((item) => item.name).join(",")) } catch (err) { levels = null }
        out[path] = `${str.status} ${JSON.stringify(levels)}`
        ec.message.clearErrors()
    }
    for (const path of MAIN) {
        let str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(`apps/${path}`, { lastStandalone: "true" }, null)
        // a .qvue screen answers its component in qvue
        if (str.status == null && /render mode qvt is not supported/.test(str.errorMessages.join(" ") + str.output))
            str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvue").withStaticData().render(`apps/${path}`, { lastStandalone: "true" }, null)
        out["render " + path] = `${str.status} ${str.errorMessages.length ? "errors" : "ok"}`
        ec.message.clearErrors()
    }
    return out
}
const setTypes = (type) => sys(() => {
    for (const id of ["BOSS_COMMONS_ALL_USERS", "BOSS_COMMS_ALL_USERS"]) {
        const row = ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", id).one()
        row.authzTypeEnumId = type
        row.update()
    }
})

spec({
    setupSpec() {
        login("john.doe")
        sys(() => {
            if (!ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_TEST_ALLUSERS").one())
                ec.service.sync().name("create#moqui.security.UserAccount").parameters({ userId: "BOSS_TEST_ALLUSERS", username: "boss.test.allusers",
                    userFullName: "Bob Acme", partyId: "ORG_ACME_BA", currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394", passwordHashType: "SHA" }).call()
        })
    },
    cleanupSpec() {
        setTypes("AUTHZT_ALLOW")
        sys(() => ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_TEST_ALLUSERS").deleteAll())
    },
})

feature("Commons and Comms are AUTHZT_ALLOW for ALL_USERS, with a deny for the client group", {
    when() {
        return sys(() => ({ types: ["BOSS_COMMONS_ALL_USERS", "BOSS_COMMS_ALL_USERS", "BOSS_COMMONS_CLIENT", "BOSS_COMMS_CLIENT"].map((id) =>
            ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", id).one()?.authzTypeEnumId) }))
    },
    then({ types }) {
        types == ["AUTHZT_ALLOW", "AUTHZT_ALLOW", "AUTHZT_DENY", "AUTHZT_DENY"]
    },
})

feature("every Commons and Comms screen opens for internal users as it did under AUTHZT_ALWAYS", {
    when() {
        const paths = screenPaths()
        setTypes("AUTHZT_ALWAYS")
        const always = {}
        for (const user of USERS) always[user] = as(user, () => fingerprint(paths))
        setTypes("AUTHZT_ALLOW")
        const allow = {}
        for (const user of USERS) allow[user] = as(user, () => fingerprint(paths))
        const differences = []
        for (const user of USERS) for (const key of Object.keys(always[user]))
            if (always[user][key] !== allow[user][key]) differences.push(`${user} ${key}: ALWAYS ${always[user][key]} / ALLOW ${allow[user][key]}`)
        if (differences.length) log.warn(`Differences:\n${differences.join("\n")}`)
        const refusedMain = USERS.flatMap((user) => MAIN.filter((path) => !allow[user]["render " + path].startsWith("200")).map((path) => `${user} ${path}`))
        return { paths: paths.length, differences, refusedMain }
    },
    then({ paths, differences, refusedMain }) {
        paths > 50
        differences.join("\n") == ""
        refusedMain == []
    },
})

feature("the internal Projects users keep their menus, and the team its denies; the client filters reach no internal user", {
    when() {
        const menuOf = (path) => {
            const str = ec.screen.makeTest().rootScreen(webroot).render(`menuData/apps/${path}`, {}, null)
            const levels = {}
            try { for (const level of JSON.parse(str.output)) levels[level.name] = (level.subscreens || []).filter((item) => item.menuInclude).map((item) => item.name) } catch (err) { }
            ec.message.clearErrors()
            return levels
        }
        const john = as("john.doe", () => ({ menu: menuOf("Projects/WorkItems"), workItems: ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData()
            .render("apps/Projects/WorkItems/List", { list: "all", lastStandalone: "true" }, null).output }))
        const joe = as("joe.developer", () => ({ menu: menuOf("Projects/WorkItems"), settings: ec.screen.makeTest().rootScreen(webroot)
            .render("menuData/apps/Projects/Settings", {}, null).status, workItems: ec.screen.makeTest().rootScreen(webroot).renderMode("qvt")
            .withStaticData().render("apps/Projects/WorkItems/List", { list: "all", lastStandalone: "true" }, null).output }))
        const vis = as("joe.developer", () => sys(() => ec.service.sync().name("mantle.work.ProjectServices.get#VisibleProjectInfo").call()))
        return { john, joe, vis }
    },
    then({ john, joe, vis }) {
        john.menu.Projects == ["Home", "Projects", "WorkItems", "Requests", "Code", "Time", "Resources", "Billing", "Reports", "Settings"]
        john.menu.WorkItems == ["Backlog", "Timeline", "Import"]
        joe.menu.Projects == ["Home", "Projects", "WorkItems", "Requests", "Code", "Time", "Resources", "Reports"]
        joe.menu.WorkItems == ["Backlog", "Timeline"]
        joe.settings == 403
        // the team sees the Work group items of the projects it is on, which no client does
        john.workItems.includes("Single sign-on with their directory")
        joe.workItems.includes("Single sign-on with their directory")
        john.workItems.includes("Expand and collapse rows")
        vis.isClient == false
        vis.itemVisibilityIds == null
        vis.visibleProjectIds.includes("IRON")
    },
})
