// Manufacturing P3 in the live client (impl-manufacturing P3 "Usable when"): the resource administrator makes a new line a
// work center with two parallel slots and adds a capacity per hour for DEMO_1_1, with no rate to add (a rate needs the cost
// authority); an operator reads line A without its rate and with no edit action, and the work-center calendar shows its day
// shift and its shutdown day; Centers and the Work center tab fit 390 px. The rules and the refusals are WorkCenters
// (mr-mantle) and ManufacturingWorkCenters and ManufacturingAccess (BOSS).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.resource", 1280],
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

feature("the resource administrator makes a new line a work center with two slots and a capacity per hour for DEMO_1_1", {
    expect() {
        const page = pages["manufacturing.resource:1280"]
        const name = "Walk cell " + Date.now()
        page.goto("/qapps/Manufacturing/WorkCenters/Centers").status == 200
        waitForText(page, "Assembly line A")
        page.getByRole("button", {name: "New work center", exact: true}).first().click()
        let dialog = page.getByRole("dialog")
        dialog.getByLabel("New line name", {exact: true}).fill(name)
        // the plant is the user's only one, chosen already
        dialog.getByLabel("Parallel slots", {exact: true}).fill("2")
        dialog.getByLabel("Reason", {exact: true}).fill("Walk cell")
        dialog.getByRole("button", {name: "Create work center", exact: true}).click()
        page.waitForURL(/FacilityDetail\/WorkCenter/)
        waitForText(page, "2 parallel slots")
        page.text().includes(name)
        page.getByRole("button", {name: "Add capacity", exact: true}).first().click()
        dialog = page.getByRole("dialog")
        choose(page, dialog, "Basis", "Quantity", "Quantity per time")
        choose(page, dialog, "Product", "DEMO_1_1", "DEMO_1_1")
        dialog.getByLabel("Quantity", {exact: true}).fill("30")
        choose(page, dialog, "Unit", "Each", "Each/Piece")
        dialog.getByLabel("Per", {exact: true}).fill("1")
        choose(page, dialog, "Time unit", "Hour", "Hour")
        dialog.getByLabel("Reason", {exact: true}).fill("Demonstrated rate")
        dialog.getByRole("button", {name: "Add capacity", exact: true}).click()
        dialog.waitFor({state: "hidden"})
        waitForText(page, "per hr")
        const text = page.text()
        text.includes("DEMO_1_1")
        // a rate needs the cost authority: no rate to read or add
        !text.includes("Hourly rates")
        !text.includes("Add rate")
    }
})

feature("an operator reads line A without its rate or an edit action; the calendar shows its shift and shutdown day", {
    expect() {
        const page = pages["manufacturing.operate:1280"]
        page.goto("/qapps/Manufacturing/WorkCenters/FacilityDetail/WorkCenter?facilityId=BOSS_MFG_LINE_A").status == 200
        waitForText(page, "Assembly line B")
        let text = page.text()
        text.includes("2 parallel slots")
        text.includes("Line A shifts")
        !text.includes("Hourly rates")
        !text.includes("Edit work center")
        !text.includes("Add capacity")
        page.goto("/qapps/Manufacturing/WorkCenters/ResourceCalendar?view=week&date=2026-11-23").status == 200
        page.waitFor(() => (document.body.innerText || "").includes("Day shift"))
        text = page.evaluate(() => document.body.innerText)
        text.includes("Line A maintenance shutdown")
        // read only: no New
        !page.evaluate(() => [...document.querySelectorAll("button")].some(button => button.innerText.trim() === "New"))
    }
})

feature("Centers and the Work center tab fit 390 px", {
    expect() {
        const page = pages["manufacturing.operate:390"]
        page.goto("/qapps/Manufacturing/WorkCenters/Centers").status == 200
        waitForText(page, "Assembly line A")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        page.goto("/qapps/Manufacturing/WorkCenters/FacilityDetail/WorkCenter?facilityId=BOSS_MFG_LINE_A").status == 200
        waitForText(page, "Assembly line B")
        page.settle()
        !/Error rendering|Exception in render/.test(page.text())
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
