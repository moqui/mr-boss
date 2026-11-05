// Manufacturing P4 in the live client (impl-manufacturing P4 "usable when"): the resource administrator sets Retail's
// organization default and a plant override at ZIRET_WH of the overproduction tolerance, and the trace names each value's
// source; they add a reason code and deactivate it, and it stays in the list of inactive reasons. The services, refusals
// and the issue guard's scrap allowance are Mantle's ProductionPolicy spec and ManufacturingAccess.
let pages = {}
spec({
    setupSpec() {
        const page = browser.newPage({user: "manufacturing.resource", viewport: {width: 1280, height: 1100}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
        pages.resource = page
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// Accept the confirmation of the next action, as the user does (after the page has loaded).
function acceptConfirm(page) {
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
        return true
    }) == true
}
const settings = "/qapps/Manufacturing/Settings/"
// a code of this run, since the walks' database outlives a run
const code = "WALK_" + (Date.now() % 1000000)
// The list row that shows a record (the nearest element around its text that holds a button): its text, or the index of
// its action button among the page's buttons of that name.
const rowScript = `(text, name) => {
    let cell = [...document.querySelectorAll(".q-page *")].find(element =>
        element.children.length === 0 && element.innerText?.trim() === text)
    while (cell && !cell.querySelector("button")) cell = cell.parentElement
    const buttons = [...document.querySelectorAll(".q-page button")].filter(button => button.innerText.trim() === name)
    return {text: cell?.innerText || "", index: cell ? buttons.findIndex(button => cell.contains(button)) : -1}
}`
const rowOf = (page, text, name = "") => page.evaluate(`(${rowScript})(${JSON.stringify(text)}, ${JSON.stringify(name)})`)
function rowButton(page, text, name) {
    const index = rowOf(page, text, name).index
    if (index < 0) throw new Error("No " + name + " button in the row of " + text)
    return page.getByRole("button", {name, exact: true}).nth(index)
}
// change the overproduction tolerance in the Consumption dialog
function changeOverproduction(page, percent, reason) {
    page.getByRole("button", {name: "Change consumption", exact: true}).click()
    const dialog = page.getByRole("dialog")
    dialog.locator("input[name=overProducePercent]").fill(percent)
    dialog.locator("input[name=changeReason]").fill(reason)
    dialog.getByRole("button", {name: "Save consumption", exact: true}).click()
    waitForText(page, reason)
}

feature("the administrator sets an organization default and a plant override; the trace names each value's source", {
    expect() {
        const page = pages.resource
        page.goto(settings + "ProductionSettings").status == 200
        waitForText(page, "Organization default of Ziziwork Retail")
        changeOverproduction(page, "5", "Walk: organization default")
        page.text().includes("5%")
        page.text().includes("Organization default")
        page.goto(settings + "ProductionSettings?plantId=ZIRET_WH").status == 200
        waitForText(page, "Plant override at Ziziwork Retail Warehouse")
        page.text().includes("Nothing is set here; every value is inherited.")
        changeOverproduction(page, "8", "Walk: plant override")
        page.text().includes("Plant override: Ziziwork Retail Warehouse")
        page.text().includes("8%")
        page.text().includes("Built-in default")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
feature("the administrator adds a reason code and deactivates it; it is kept as inactive", {
    expect() {
        const page = pages.resource
        page.goto(settings + "ReasonCodes").status == 200
        waitForText(page, "Assembly robot fault")
        page.getByRole("button", {name: "Add reason", exact: true}).click()
        const dialog = page.getByRole("dialog")
        dialog.locator("input[name=reasonCode]").fill(code)
        dialog.locator("input[name=reasonName]").fill("Walk feeder jam")
        dialog.getByLabel("Category", {exact: true}).click()
        page.getByRole("option", {name: "Downtime", exact: true}).first().click()
        dialog.locator("input[name=changeReason]").fill("Walk: new reason")
        dialog.getByRole("button", {name: "Add reason", exact: true}).click()
        waitForText(page, "Walk feeder jam")
        rowButton(page, code, "Deactivate").click()
        const deactivate = page.getByRole("dialog")
        deactivate.locator("input[name=changeReason]").fill("Walk: not used")
        acceptConfirm(page)
        deactivate.getByRole("button", {name: "Deactivate reason", exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-dialog"))
        // the active list no longer shows it; the list of every reason keeps it, inactive
        page.goto(settings + "ReasonCodes").status == 200
        waitForText(page, "Assembly robot fault")
        !page.text().includes(code)
        page.goto(settings + "ReasonCodes?includeInactive=true").status == 200
        waitForText(page, code)
        rowOf(page, code).text.includes("Inactive")
    }
})
