// Projects Home (screen/Projects/Home.xml, service/ironstone/projects/ProjectServices.xml get#ProjectsHome over
// mantle.work.ProjectServices.get#ProjectHomeCounts; design-projects.md §3 Home; impl-projects.md P2) on the Projects demo
// (data/BossProjectsDemoData.xml): a manager's counters (with the projects at risk and the milestones soon), my work items,
// the recent changes and the projects I manage; a team member's Home without the managers' counters; the first-run card for a
// user on no project. Read only. Authorization stays on.
// Run: ./moq test mr-boss --spec ProjectsHome
const webroot = "component://webroot/screen/webroot.xml"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}

spec({
    setupSpec() { login("john.doe") },
})

feature("a manager's Home: the counters with the projects at risk, my work items, the recent changes and the projects I manage", {
    when() {
        return { home: sys(() => call("ironstone.projects.ProjectServices.get#ProjectsHome", {})).home, page: render("apps/Projects/Home", {}) }
    },
    then({ home, page }) {
        home.isManager == true
        home.firstRun == false
        home.failedParts.length == 0
        home.counts.myOpen >= 1
        home.counts.projectsAtRisk >= 1
        home.atRiskProjectIds.includes("ACME")
        // john.doe is asked to review the code demo's !1 (null without git hosting in the build)
        home.counts.reviewsWaiting == null || home.counts.reviewsWaiting >= 1
        home.workItemList.map((row) => row.workEffortId).includes("HIRE-1")
        home.projectList.map((row) => row.workEffortId).includes("ACME")
        home.projectList.map((row) => row.workEffortId).includes("IRON")
        !home.projectList.map((row) => row.workEffortId).includes("TPLWEB")
        home.activityList.length >= 1
        page.status == 200
        page.errors == ""
        !page.broken
        page.output.includes("My open items")
        page.output.includes("At risk")
        page.output.includes("Projects I manage")
        page.output.includes("Acme customer portal")
        page.output.includes("List the roles for next year")
        page.output.includes("Recently changed in my projects")
        page.output.includes("New project")
        !page.output.includes("Get started with Projects")
    },
})

feature("a team member's Home has the team's counters, the work assigned to him and the projects he is on", {
    when() {
        return as("joe.developer", () => ({ home: sys(() => call("ironstone.projects.ProjectServices.get#ProjectsHome", {})).home, page: render("apps/Projects/Home", {}) }))
    },
    then({ home, page }) {
        home.isManager == false
        home.counts.projectsAtRisk == null
        home.workItemList.map((row) => row.workEffortId).includes("IRON-3")
        !home.workItemList.map((row) => row.workEffortId).includes("HIRE-1")
        home.projectList.map((row) => row.workEffortId).includes("IRON")
        !home.projectList.map((row) => row.workEffortId).includes("HIRE")
        page.status == 200
        !page.broken
        page.output.includes("My projects")
        !page.output.includes("Milestones")
        !page.output.includes("New project")
    },
})

feature("a user on no project sees the first-run card", {
    when() {
        const partyId = sys(() => call("mantle.party.PartyServices.create#Person", { firstName: "Nora", lastName: "Newcomer" })).partyId
        sys(() => call("mantle.party.PartyServices.create#PartyUserAccount", { partyId, emailAddress: "boss.test.nora@example.com", username: "boss.test.nora",
            newPassword: "moqui1!!", newPasswordVerify: "moqui1!!" }))
        sys(() => call("create#moqui.security.UserGroupMember", { userGroupId: "BOSS_PROJECT_TEAM", userId: ec.entity.find("moqui.security.UserAccount")
            .condition("username", "boss.test.nora").one().userId, fromDate: ec.user.nowTimestamp }))
        login("boss.test.nora", "moqui1!!")
        try { return { home: sys(() => call("ironstone.projects.ProjectServices.get#ProjectsHome", {})).home, page: render("apps/Projects/Home", {}) } }
        finally { login("john.doe") }
    },
    then({ home, page }) {
        home.firstRun == true
        home.counts.myOpen == 0
        page.status == 200
        !page.broken
        page.output.includes("Get started with Projects")
        page.output.includes("Nothing assigned to you")
    },
})
