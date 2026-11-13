// Manufacturing P13 in the live client (impl-manufacturing P13 "Usable when", design-manufacturing §10.3 shortage to finished
// stock): the planner opens Supply planning from Home, recalculates Retail's plant for the walk's product, sees a make
// suggestion and a buy suggestion for its component, explains the make suggestion's demand and supply, and converts it into
// a draft work order; the suggestion then shows it is covered by that work order. The scheduler reads the plan with no
// Recalculate. The suggestions fit 390 px. The demand is ManufacturingPlanningFixtures'; the rules and refusals are
// SupplyPlanning (mr-mantle), ManufacturingPlanning and ManufacturingAccess (BOSS).
let pages = {}
const productName = "Walk planned assembly"
const componentName = "Walk planned part"
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.plan", 1280],
            ["manufacturing.schedule", 1280],
            ["manufacturing.plan", 390]
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

feature("the planner recalculates the plant, sees make and buy suggestions, explains the make and converts it", {
    expect() {
        const page = pages["manufacturing.plan:1280"]
        page.goto("/qapps/Manufacturing/Home").status == 200
        waitForText(page, "Due work and shortages")
        page.getByRole("link", {name: "Supply planning", exact: true}).first().click()
        page.waitForURL(/Planning\/SupplyPlanning/)
        waitForText(page, "Supply planning")
        page.getByRole("button", {name: "Recalculate", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Product", "BOSS_MFG_WALK_FIN", "BOSS_MFG_WALK_FIN")
        confirmNext(page)
        dialog.getByRole("button", {name: "Recalculate", exact: true}).click()
        dialog.waitFor({state: "hidden"})
        waitForText(page, componentName)
        let text = page.text()
        text.includes(productName)
        text.includes("Make")
        text.includes("Buy")
        text.includes("Current")
        // the make suggestion explained: its sales demand netted
        page.getByRole("link", {name: "BOSS_MFG_WALK_FIN", exact: true}).first().click()
        waitForText(page, "Demand and supply of BOSS_MFG_WALK_FIN")
        text = page.text()
        text.includes("Sales order BOSS_MFG_WALK_SO_")
        // converted from the row's selection
        const selected = page.evaluate(id => {
            const link = Array.from(document.querySelectorAll(".q-page a")).find(each => each.innerText.trim() === id)
            let row = link
            while (row && !row.querySelector(".q-checkbox")) row = row.parentElement
            row.querySelector(".q-checkbox").click()
            return true
        }, "BOSS_MFG_WALK_FIN")
        selected == true
        // the selection's row actions, then Convert
        const opened = page.evaluate(() => {
            const button = Array.from(document.querySelectorAll(".q-page .q-btn")).find(
                each => each.innerText.trim() === "more_vert"
            )
            button.click()
            return true
        })
        opened == true
        page.locator(".q-menu").getByRole("button", {name: "Convert", exact: true}).click()
        const convert = page.getByRole("dialog")
        confirmNext(page)
        convert.getByRole("button", {name: "Make draft work orders", exact: true}).click()
        convert.waitFor({state: "hidden"})
        waitForText(page, "Converted")
        page.text().includes("Work order ")
    }
})

feature("the scheduler reads the plan with no Recalculate, Schedule or Convert", {
    expect() {
        const page = pages["manufacturing.schedule:1280"]
        page.goto("/qapps/Manufacturing/Planning/SupplyPlanning?plantId=ZIRET_WH").status == 200
        waitForText(page, componentName)
        const text = page.text()
        !text.includes("Recalculate")
        page.getByRole("button", {name: "Schedule", exact: true}).count() == 0
        page.getByRole("button", {name: "Convert", exact: true}).count() == 0
    }
})

feature("the suggestions fit 390 px", {
    expect() {
        const page = pages["manufacturing.plan:390"]
        page.goto("/qapps/Manufacturing/Planning/SupplyPlanning?plantId=ZIRET_WH").status == 200
        waitForText(page, componentName)
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1) == true
    }
})
