// Admin's golden path in the live client (impl-admin P4, the app's one regression walk): the administrator finds a Retail staff
// identity in Users, opens it in UserDetail, ends its Purchasing buyer membership (kept on record as ended) and signs its live
// session out, every step under /qapps/Admin. The identity, its membership and its session are AdminClientFixtures'. The rules
// are Mantle's StaffIdentity, the framework's AdminSessions and AdminAccessServices and BOSS's AdminUsers; the "usable when" is
// the acceptance AdminUsersUsable.
let page
spec({
    setupSpec() {
        page = browser.newPage({user: "admin.admin", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the in-app confirmation (moqui.confirmAction): only its Confirm button approves the action
// the button labelled label in the smallest element that holds text and such a button (a list row)
function rowButton(text, label) {
    return page.evaluate(
        ([text, label]) => {
            const buttons = el => Array.from(el.querySelectorAll("button, a")).filter(b => b.innerText.trim().endsWith(label))
            const rows = Array.from(document.querySelectorAll(".q-page *"))
                .filter(el => el.innerText && el.innerText.includes(text) && buttons(el).length)
                .sort((a, b) => a.innerText.length - b.innerText.length)
            const button = rows.length ? buttons(rows[0])[0] : null
            if (button) button.click()
            return !!button
        },
        [text, label]
    )
}
function confirmAction() {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}

feature("the administrator finds a user, ends a membership and signs a session out", {
    expect() {
        page.goto("/qapps/Admin/Users/Users").status == 200
        waitForText("The staff of the organizations you administer")
        page.getByLabel("Name or email", {exact: true}).fill("Walk Staff")
        page.getByRole("button", {name: "Find", exact: true}).click()
        page.getByRole("link", {name: "Walk Staff", exact: true}).first().click()
        page.waitForURL(/\/qapps\/Admin\/Users\/UserDetail\?/)
        waitForText("Sessions and history")
        page.evaluate(() => document.querySelector(".m-record-header").innerText).includes("Walk Staff")
        // Access: end the Purchasing buyer membership now, with a reason
        waitForText("Purchasing buyer")
        rowButton("Purchasing buyer", "End") == true
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Reason", {exact: true}).fill("Walk: cover over")
        dialog.getByRole("button", {name: "End membership", exact: true}).click()
        waitForText("ended membership(s) kept on record")
        // Sessions and history: sign the live Firefox session out
        waitForText("Firefox on Linux")
        rowButton("Firefox on Linux", "Sign out") == true
        confirmAction()
        // the session ends at once: its visit is closed, so the list shows it signed out
        waitForText("Signed out 20")
        page.url().includes("/qapps/Admin/")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
