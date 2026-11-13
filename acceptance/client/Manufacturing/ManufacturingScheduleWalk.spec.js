// Manufacturing P12 in the live client (impl-manufacturing P12 "Usable when"; design-manufacturing ProductionSchedule, §12 M11):
// the scheduler opens the production schedule of Retail's plant, drags "Schedule walk 1"'s Assemble bar to line B onto the
// time of "Schedule walk 2"'s Test there (a drag is a preview only: the Move dialog opens with the capacity conflict and no
// Apply, only Request override), moves the start in the Move form to a free hour, previews it with no conflict and applies
// it; the bar is then on line B. Show conflicts lists the schedule's conflicts. The schedule fits 390 px. The runs are
// ManufacturingScheduleFixtures'; the rules and refusals are ProductionSchedule (mr-mantle), ManufacturingSchedule and
// ManufacturingAccess (BOSS).
let pages = {}
const scheduleUrl = "/qapps/Manufacturing/Planning/ProductionSchedule?plantId=ZIRET_WH&days=28"
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.schedule", 1280],
            ["manufacturing.schedule", 390]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user + ":" + width] = page
        }
    }
})
const barLabel = (run, operation) => operation + ", Schedule walk " + run + ","
function waitForBar(page, label) {
    page.waitFor(
        label =>
            Array.from(document.querySelectorAll("[data-bar]")).some(bar =>
                (bar.getAttribute("aria-label") || "").startsWith(label)
            ),
        {
            arg: label
        }
    )
}

feature("the scheduler drags an operation to line B, sees the conflict in the preview and commits a free time through Move", {
    expect() {
        const page = pages["manufacturing.schedule:1280"]
        page.goto(scheduleUrl).status == 200
        waitForBar(page, barLabel(2, "Test and pack"))
        page.text().includes("Assembly line B")
        // the drop: run 1's Assemble two hours later (a day tick's width is a day), on line B's lane
        const dropped = page.evaluate(
            label => {
                const bar = Array.from(document.querySelectorAll("[data-bar]")).find(each =>
                    (each.getAttribute("aria-label") || "").startsWith(label)
                )
                const lane = document.querySelector('[data-lane="BOSS_MFG_LINE_B"]')
                const box = bar.getBoundingClientRect()
                const laneBox = lane.getBoundingClientRect()
                const dx = (document.querySelector(".boss-tl-tick").getBoundingClientRect().width * 2) / 24
                const x = box.left + 2
                const y = box.top + box.height / 2
                const event = (type, clientX, clientY, target) =>
                    (target || window).dispatchEvent(
                        new PointerEvent(type, {
                            bubbles: true,
                            cancelable: true,
                            clientX,
                            clientY,
                            button: 0,
                            pointerType: "mouse"
                        })
                    )
                event("pointerdown", x, y, bar)
                event("pointermove", x + 6, y + 4)
                event("pointermove", x + dx, laneBox.top + laneBox.height / 2)
                event("pointerup", x + dx, laneBox.top + laneBox.height / 2)
                return true
            },
            barLabel(1, "Assemble")
        )
        dropped == true
        const dialog = page.getByRole("dialog")
        dialog.waitFor()
        page.waitFor(() => (document.querySelector(".boss-schedule-preview")?.innerText || "").includes("operations at once"))
        const preview = page.locator(".boss-schedule-preview").text()
        preview.includes("Assembly line B")
        preview.includes("would run 2 operations at once")
        // a scheduler commits no conflict: no Apply, Request override instead. The dialog scales in from nothing, and a warm
        // server's preview can come back in its first frames, while its buttons have no box yet and a count finds none: the
        // button is waited for before the counts
        dialog.getByRole("button", {name: "Request override", exact: true}).waitFor()
        dialog.getByRole("button", {name: "Apply", exact: true}).count() == 0
        dialog.getByRole("button", {name: "Request override", exact: true}).count() == 1
        // the Move form: an hour later, previewed again, then applied
        const start = dialog.getByLabel("Start", {exact: true}).value()
        const later = start.slice(0, 11) + "09:00"
        dialog.getByLabel("Start", {exact: true}).fill(later)
        dialog.getByRole("button", {name: "Preview", exact: true}).click()
        page.waitFor(() => (document.querySelector(".boss-schedule-preview")?.innerText || "").includes("No conflict"))
        dialog.getByRole("button", {name: "Apply", exact: true}).click()
        dialog.waitFor({state: "hidden"})
        page.waitFor(
            label => {
                const bar = Array.from(document.querySelectorAll("[data-bar]")).find(each =>
                    (each.getAttribute("aria-label") || "").startsWith(label)
                )
                return bar && bar.closest("[data-lane]")?.getAttribute("data-lane") === "BOSS_MFG_LINE_B"
            },
            {arg: barLabel(1, "Assemble")}
        )
    }
})

feature("Show conflicts lists the schedule's conflicts", {
    expect() {
        const page = pages["manufacturing.schedule:1280"]
        page.goto(scheduleUrl).status == 200
        waitForBar(page, barLabel(2, "Test and pack"))
        page.locator(".boss-schedule-conflicts-toggle").click()
        page.locator(".boss-schedule-conflict-list").waitFor()
        page.locator(".boss-schedule-conflict-list").text().length > 0
    }
})

feature("the schedule fits 390 px", {
    expect() {
        const page = pages["manufacturing.schedule:390"]
        page.goto(scheduleUrl).status == 200
        waitForBar(page, barLabel(2, "Test and pack"))
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1) == true
    }
})
