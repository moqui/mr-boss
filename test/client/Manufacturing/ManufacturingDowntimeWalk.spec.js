// Manufacturing P11 in the live client (impl-manufacturing P11 "usable when"): an operator reports a robot fault on line A in
// Downtime; the page comes back with the stop's Maintenance dialog open, and the maintenance request it makes opens in
// Manufacturing's RequestDetail with the stop and the robot; Downtime fits 390 px. The outage, the close, the no-material
// stop, the correction and the refusals are ProductionDowntime (mr-mantle), ManufacturingDowntime and ManufacturingAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.operate", 1280],
            ["manufacturing.operate", 390]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user + ":" + width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// a server-search drop-down of the open dialog: open it, type, choose the option; the options close when the focus moves on
function choose(page, dialog, label, typed, option) {
    dialog.getByLabel(label, {exact: true}).click()
    page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}

feature("an operator reports a robot fault on line A with a maintenance request, which opens in RequestDetail", {
    expect() {
        const page = pages["manufacturing.operate:1280"]
        // a note of this run, since the walks' database outlives a run
        const note = "Walk gripper jam " + Date.now()
        page.goto("/qapps/Manufacturing/WorkCenters/Downtime").status == 200
        waitForText(page, "Changeover")
        page.getByRole("button", {name: "Report stop", exact: true}).first().click()
        let dialog = page.getByRole("dialog")
        choose(page, dialog, "Work center", "line A", "Assembly line A")
        choose(page, dialog, "Equipment", "2345", "Assembly Bot 4 2345")
        choose(page, dialog, "Reason", "robot", "Assembly robot fault")
        dialog.getByLabel("What happened", {exact: true}).fill(note)
        dialog.getByRole("button", {name: "Report stop", exact: true}).click()
        // an equipment fault: the page comes back with the new stop and its Maintenance dialog open
        page.waitForURL(/_openDialog=MaintenanceDialog/)
        dialog = page.getByRole("dialog")
        dialog.getByText("Request maintenance of Assembly Bot 4 2345").waitFor()
        dialog.getByLabel("Problem", {exact: true}).fill(note + ": the gripper does not open")
        dialog.getByRole("button", {name: "Request maintenance", exact: true}).click()
        dialog.waitFor({state: "hidden"})
        waitForText(page, "Maintenance of Assembly Bot 4 2345")
        !/Error rendering|Exception in render/.test(page.text())
        // the request, in Manufacturing, with its stop and its robot
        page.getByRole("link", {name: /Maintenance of Assembly Bot 4 2345/})
            .first()
            .click()
        page.waitForURL(/WorkCenters\/RequestDetail/)
        waitForText(page, "Production")
        const text = page.text()
        text.includes("Assembly line A · Assembly robot fault")
        text.includes("Corrective Maintenance")
        text.includes(note)
    }
})

feature("Downtime fits 390 px", {
    expect() {
        const page = pages["manufacturing.operate:390"]
        page.goto("/qapps/Manufacturing/WorkCenters/Downtime").status == 200
        waitForText(page, "Changeover")
        page.settle()
        !/Error rendering|Exception in render/.test(page.text())
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
