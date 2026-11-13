// Insights P2's "usable when" (impl-insights P2), in the live client: insights.author copies the shipped Store operations dashboard,
// edits and saves it without leaving Insights and shares it with a group; its panels over datasets not yet admitted say not
// available, never zero; the Tools Dashboards app is unchanged for ADMIN; a playlist of two dashboards plays in kiosk mode. The
// rules are InsightsDashboards' and InsightsAccess's; the golden walk is the regression InsightsDashboardsWalk. Saving a copy of
// Store operations needs its dataset (Mantle's sales orders) readable by the author, which P3's admission grants: the report
// engine checks every dataset a saved definition references as the author (impl-insights F41). The served demo leaves that
// dataset waiting for review, so the author first sees its panel not available, then the steward admits it (as P3's
// InsightsDatasetsUsable does server side) and the author copies the dashboard. The Commerce panels' datasets are admitted by
// setup (P3) and have no checkout in the window, so they say no data.
// Run: ./moq accept mr-boss --spec InsightsDashboardsUsable
const pages = {}
spec({
    setupSpec() {
        for (const user of ["insights.author", "insights.steward", "john.doe"]) {
            pages[user] = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
            pages[user].allowProblems(/userPhoto\?userId=/)
        }
    }
})
const pageText = () => document.querySelector(".q-page")?.innerText || ""

feature("the author copies Store operations, edits, saves and shares it in Insights; its unadmitted panels are not available", {
    expect() {
        const author = pages["insights.author"]
        const copyId = "INS_USABLE_" + Date.now()
        author.goto("/qapps/Insights/Dashboards").status == 200
        author.getByText("Store operations", {exact: true}).first().click()
        author.waitForURL(/\/qapps\/Insights\/Dashboard\?/)
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Not available"))
        // the orders panel, over the dataset not yet admitted, says not available, never no data
        const ordersPanel = author.text().split("Orders by store and day")[1].split("Payment attempts by phase")[0]
        ordersPanel.includes("Not available: dataset mantle-sales-orders is not admitted")
        !ordersPanel.includes("No data in this time range")
        // the steward admits the sales orders dataset; the author's copy may then name it
        const steward = pages["insights.steward"]
        steward.goto("/qapps/Insights/ReportBuilder/DatasetDetail?datasetId=mantle-sales-orders").status == 200
        steward.getByRole("button", {name: "Admit"}).click()
        steward.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
        steward.waitFor(() => (document.body.innerText || "").includes("Dataset admitted"))
        author.goto(author.url()).status == 200
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Orders by store and day"))
        !author.text().includes("Not available: dataset mantle-sales-orders")
        author.getByRole("link", {name: "Edit / save a copy / versions"}).click()
        author.waitForURL(/\/qapps\/Insights\/DashboardEditor\?/)
        author.getByLabel("New ID").fill(copyId)
        author.getByLabel("Copy title").fill("My store operations")
        author.getByRole("button", {name: "Save as copy"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/DashboardEditor\\?.*definitionId=" + copyId))
        author.getByLabel("Title", {exact: true}).fill("My store operations, edited")
        author.getByRole("button", {name: "Save version"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/DashboardEditor\\?.*definitionId=" + copyId))
        author.getByRole("link", {name: "Open dashboard"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/Dashboard\\?.*definitionId=" + copyId))
        author.getByRole("button", {name: "Share"}).click()
        author.getByRole("dialog").getByLabel("Share with").click()
        author.getByRole("option", {name: "Insights app users"}).click()
        author.getByRole("dialog").getByRole("button", {name: "Save sharing"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/Dashboard\\?.*definitionId=" + copyId))
        author.waitFor(pageText).includes("My store operations, edited")
        !/Error rendering|Exception in render/.test(author.text())
    }
})

feature("the Tools Dashboards app is unchanged for ADMIN", {
    expect() {
        const admin = pages["john.doe"]
        admin.goto("/qapps/dashboards/Dashboard?definitionId=boss-commerce-store-operations").status == 200
        admin.getByRole("link", {name: "Edit / save a copy / versions"}).click()
        admin.waitForURL(/\/qapps\/dashboards\/Definition\?/)
        admin.getByRole("button", {name: "Import definitions"}).count() == 1
    }
})

feature("a playlist of two dashboards plays in kiosk mode", {
    expect() {
        const author = pages["insights.author"]
        const playlistId = "INS_USABLE_PLAYLIST_" + Date.now()
        author.goto("/qapps/Insights/Playlists").status == 200
        author.getByRole("button", {name: "New playlist"}).click()
        const dialog = author.getByRole("dialog")
        dialog.getByLabel("ID").fill(playlistId)
        dialog.getByLabel("Title").fill("Management wall")
        dialog.getByLabel("Dashboards").click()
        author.getByRole("option", {name: "Management board"}).click()
        author.getByRole("option", {name: "Store operations"}).click()
        author.press("Escape")
        dialog.getByRole("button", {name: "Save playlist"}).click()
        author.waitForURL(new RegExp("/qapps/Insights/Playlists\\?.*definitionId=" + playlistId))
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("1 / 2"))
        author.getByRole("button", {name: "Next dashboard"}).click()
        author.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("2 / 2"))
        // the dashboard links open Insights' Dashboard in kiosk mode
        author.evaluate(() =>
            Array.from(document.querySelectorAll("a")).some(a => /\/Insights\/Dashboard\?.*kiosk=true/.test(a.href))
        ) == true
    }
})
