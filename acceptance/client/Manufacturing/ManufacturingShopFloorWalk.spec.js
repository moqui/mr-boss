// Manufacturing P10 in the live client (impl-manufacturing P10 "usable when"; design-manufacturing ShopFloor, OperationExecution,
// Instructions and ProductionTime): at phone width the material handler (an operator who issues stock) finds this load's walk
// work order under My work on the station, scans its Assemble, acknowledges the instruction and records the evidence, starts
// it from the station with the person timer (switching from the timer on other work after the confirmation), records machine
// runtime apart from labor and completes it; Test and pack's completion keeps what was entered when it is refused, then
// completes 5 good and 1 scrap with the coupled output receipt; the handler submits the week from the work order's time, and
// the work order's supervisor approves it on ProductionTime and reopens it. The station and the operation fit 390 px. The work order is ManufacturingShopFloorFixtures';
// the rules and refusals are ProductionShopFloor (mr-mantle), ManufacturingShopFloor and ManufacturingAccess (BOSS), and the
// terminal twin's flow ManufacturingShopFloor's tui renders.
let pages = {}
const station = "/qapps/Manufacturing/ShopFloor/Station"
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.material", 390],
            ["manufacturing.supervise", 1280]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user + ":" + width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => document.body.innerText.includes(text), {arg: text})
}
// accept the confirmation of the next action, as the user does
function confirmNext(page) {
    page.evaluate(() => {
        // the confirmation is the in-app dialog (moqui.confirmAction): Confirm it each time it opens, until the page reloads
        if (!window.walkConfirmations) {
            window.walkConfirmations = new MutationObserver(() => {
                for (const button of document.querySelectorAll(".q-dialog-plugin button")) {
                    if (button.innerText.trim() !== "Confirm" || button.dataset.walkConfirmed) continue
                    button.dataset.walkConfirmed = "Y"
                    button.click()
                }
            })
            window.walkConfirmations.observe(document.body, {childList: true, subtree: true})
        }
    })
}
const fits = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
// the station's board with My work on: this load's walk work order's cards
function openMyWork(page) {
    page.goto(station).status == 200
    waitForText(page, "Running")
    page.getByRole("switch", {name: "My work"}).count()
        ? page.getByRole("switch", {name: "My work"}).click()
        : page.getByText("My work").click()
    waitForText(page, "Shop floor walk")
}
const operationIdOf = url => decodeURIComponent((/operationWorkEffortId=([^&]+)/.exec(url) || [])[1] || "")

feature(
    "at phone width the handler scans Assemble, acknowledges it, starts it switching timers, records machine time and completes it",
    {
        expect() {
            const page = pages["manufacturing.material:390"]
            openMyWork(page)
            fits(page) == true
            // the card, then its operation's page: its id, which the scan takes
            page.getByText("Assemble", {exact: true}).first().click()
            page.getByRole("button", {name: "Open", exact: true}).click()
            page.waitForURL(/ShopFloor\/OperationExecution/)
            const assembleId = operationIdOf(page.url())
            assembleId != ""
            waitForText(page, "Read and acknowledge the instructions first")
            fits(page) == true
            // the instructions: acknowledge the step and record the evidence
            page.getByRole("link", {name: "Instructions"}).first().click()
            page.waitForURL(/ShopFloor\/Instructions/)
            waitForText(page, "fasten the four screws")
            page.getByRole("button", {name: "Acknowledge"}).click()
            waitForText(page, "Acknowledged")
            page.getByLabel("Photo of the fastened assembly", {exact: true}).fill("Photo of unit 1")
            page.getByRole("button", {name: "Record evidence"}).click()
            waitForText(page, "Recorded")
            // the scan at the station selects the card; Start asks to switch the timer on other work, then starts
            page.goto(station).status == 200
            waitForText(page, "Running")
            page.getByLabel("Scan an operation or work order").fill(assembleId)
            page.keyboard.press("Enter")
            page.locator("#SelectedOperation").getByText("Assemble").waitFor()
            page.locator("#SelectedOperation").getByRole("button", {name: "Start"}).click()
            page.getByRole("dialog").getByText("Switch your timer?").waitFor()
            page.getByRole("dialog").getByRole("button", {name: "Stop it and start"}).click()
            waitForText(page, "Your timer runs on Assemble")
            // the operation: machine runtime apart from labor, then Complete
            page.goto("/qapps/Manufacturing/ShopFloor/OperationExecution?operationWorkEffortId=" + encodeURIComponent(assembleId))
            waitForText(page, "Your timer runs on this operation")
            page.getByRole("button", {name: "Start machine"}).click()
            page.getByRole("button", {name: "Stop machine"}).waitFor()
            page.getByRole("button", {name: "Stop machine"}).click()
            page.getByRole("button", {name: "Start machine"}).waitFor()
            waitForText(page, "Machine runtime recorded")
            page.getByRole("button", {name: "Complete", exact: true}).first().click()
            const dialog = page.getByRole("dialog")
            dialog.getByLabel("Good", {exact: true}).fill("6")
            confirmNext(page)
            dialog.getByRole("button", {name: "Complete", exact: true}).click()
            waitForText(page, "Operation completed")
            page.text().includes("Complete")
            !/Error rendering|Exception in render/.test(page.text())
        }
    }
)

feature("Test and pack's refused completion keeps what was entered, then it completes with the receipt; its week is approved", {
    expect() {
        const page = pages["manufacturing.material:390"]
        openMyWork(page)
        page.getByText("Test and pack", {exact: true}).first().click()
        page.locator("#SelectedOperation").getByRole("button", {name: "Open"}).click()
        page.waitForURL(/ShopFloor\/OperationExecution/)
        const testId = operationIdOf(page.url())
        // start it here (the timer stopped with Assemble)
        page.getByRole("button", {name: "Start", exact: true}).first().click()
        page.getByRole("dialog").getByRole("button", {name: "Start", exact: true}).click()
        waitForText(page, "Your timer runs on this operation")
        // the evidence is still to record: the completion is refused and the form keeps the quantities
        page.getByRole("button", {name: "Complete", exact: true}).first().click()
        let dialog = page.getByRole("dialog")
        dialog.getByLabel("Good", {exact: true}).fill("5")
        dialog.getByLabel("Scrap", {exact: true}).fill("1")
        dialog.getByLabel("Note", {exact: true}).fill("Dropped one")
        confirmNext(page)
        dialog.getByRole("button", {name: "Complete", exact: true}).click()
        waitForText(page, "Record the evidence the operation requires")
        page.takeProblems()
        // the dialog stays open with the quantities entered
        dialog.getByLabel("Good", {exact: true}).value() == "5"
        dialog.getByLabel("Scrap", {exact: true}).value() == "1"
        page.keyboard.press("Escape")
        // the evidence, then the completion with the coupled receipt
        page.goto("/qapps/Manufacturing/ShopFloor/Instructions?operationWorkEffortId=" + encodeURIComponent(testId))
        page.getByLabel("Test result", {exact: true}).fill("Passed")
        page.getByRole("button", {name: "Record evidence"}).click()
        waitForText(page, "Recorded")
        page.goto("/qapps/Manufacturing/ShopFloor/OperationExecution?operationWorkEffortId=" + encodeURIComponent(testId))
        page.getByRole("button", {name: "Complete", exact: true}).first().click()
        dialog = page.getByRole("dialog")
        dialog.getByLabel("Good", {exact: true}).fill("5")
        dialog.getByLabel("Scrap", {exact: true}).fill("1")
        dialog.getByLabel("Note", {exact: true}).fill("Dropped one")
        // WarehousePoliciesWalk makes DEMO_1_1 lot required in this database: the output's lot
        dialog.getByLabel("Lot", {exact: true}).fill("WALK-SF-" + testId)
        confirmNext(page)
        dialog.getByRole("button", {name: "Complete", exact: true}).click()
        waitForText(page, "good 5")
        fits(page) == true
        !/Error rendering|Exception in render/.test(page.text())
        // the week: the handler submits it from the work order's time, the supervisor approves it and reopens it
        page.locator(".m-record-actions").getByText("More").first().click()
        page.locator(".q-menu a").getByText("Time").first().click()
        page.waitForURL(/ShopFloor\/ProductionTime/)
        const timeUrl = page.url()
        waitForText(page, "Time entries")
        page.getByRole("button", {name: "Submit"}).first().click()
        page.getByRole("dialog").getByRole("button", {name: "Submit for approval"}).click()
        waitForText(page, "Week submitted")
        const supervisor = pages["manufacturing.supervise:1280"]
        supervisor.goto(timeUrl.replace(/^https?:\/\/[^/]+/, "")).status == 200
        waitForText(supervisor, "Manufacturing Material handler")
        supervisor.getByRole("button", {name: "Approve"}).first().click()
        confirmNext(supervisor)
        supervisor.getByRole("dialog").getByRole("button", {name: "Approve"}).click()
        waitForText(supervisor, "Week approved")
        waitForText(supervisor, "Labor cost recorded")
        supervisor.getByRole("button", {name: "Reopen"}).first().click()
        supervisor.getByRole("dialog").getByLabel("Reason").fill("Walk reopens it")
        confirmNext(supervisor)
        supervisor.getByRole("dialog").getByRole("button", {name: "Reopen"}).click()
        waitForText(supervisor, "Week reopened")
        !/Error rendering|Exception in render/.test(supervisor.text())
    }
})
