// Insights' golden path in the live client (impl-insights P2, the app's one regression walk): an author opens a dashboard shared
// with the Insights users from Dashboards, saves a copy in Insights' mounted editor (DashboardEditor), adds a library panel to it
// and saves a version, then opens the copy in Insights' Dashboard, where the library panel over a dataset waiting for the steward's
// admission (P3) says it is not available. Every step stays under /qapps/Insights. The dashboard and the panel are InsightsClientFixtures'.
// Each run makes a copy of its own. The "usable when" scenario is the acceptance InsightsDashboardsUsable.
let author
spec({
    setupSpec() {
        author = browser.newPage({user: "insights.author", viewport: {width: 1280, height: 1000}, timeout: 30})
        author.allowProblems(/userPhoto\?userId=/)
    }
})

feature("an author copies a shared dashboard, adds a library panel and saves it, all in Insights", {
    expect() {
        const copyId = "INS_WALK_COPY_" + Date.now()
        author.goto("/qapps/Insights/Dashboards").status == 200
        author.getByText("Management board", {exact: true}).first().click()
        author.waitForURL(/\/qapps\/Insights\/Dashboard\?/)
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("The week at a glance."))
        author.getByRole("link", {name: "Edit / save a copy / versions"}).click()
        author.waitForURL(/\/qapps\/Insights\/DashboardEditor\?/)
        author.getByLabel("New ID").fill(copyId)
        author.getByLabel("Copy title").fill("My management board")
        author.getByRole("button", {name: "Save as copy"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/DashboardEditor\\?.*definitionId=" + copyId))
        // the framework editor: choose the shared library panel and add a reference to it
        const chosen = author.getByLabel("Library panel").evaluate(select => {
            select.value = "INS_WALK_PANEL"
            select.dispatchEvent(new Event("change", {bubbles: true}))
            return select.value
        })
        chosen == "INS_WALK_PANEL"
        author.getByRole("button", {name: "Add library reference"}).click()
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Library panel: INS_WALK_PANEL"))
        author.getByRole("button", {name: "Save version"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/DashboardEditor\\?.*definitionId=" + copyId))
        author.getByRole("link", {name: "Open dashboard"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/Dashboard\\?.*definitionId=" + copyId))
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Orders per day"))
        // the library panel's dataset waits for admission: not available, never empty or zero
        author.text().includes("Not available")
        author.url().includes("/qapps/Insights/")
        !/Error rendering|Exception in render/.test(author.text())
    }
})
