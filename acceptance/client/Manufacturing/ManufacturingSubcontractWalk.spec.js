// Manufacturing P14 in the live client (impl-manufacturing P14 "Usable when"): the planner asks for an operation of the walk's
// released work order to be done by Ziddleman from Outside processing and lands on its outside-processing record, Requested;
// the buyer (Purchasing's buyer group on the Manufacturing mount) converts the request in Supply planning into a draft
// service purchase order line, and its record shows the order and its price; the planner, without the buyer's grant, sees
// the order and no price. The worklist fits 390 px. The work order is ManufacturingSubcontractFixtures'; the rules and
// refusals are ProductionSubcontract (mr-mantle), ManufacturingSubcontracting and ManufacturingAccess (BOSS).
let pages = {}
const runName = "Walk subcontracted assemblies"
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.plan", 1280],
            ["manufacturing.buyer", 1280],
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
function choose(page, dialog, label, typed, option) {
    dialog.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}
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

feature("the planner asks for an operation of the walk's work order to be done by a supplier", {
    expect() {
        const page = pages["manufacturing.plan:1280"]
        page.goto("/qapps/Manufacturing/Subcontracting").status == 200
        waitForText(page, "Outside processing")
        page.getByRole("button", {name: "New outside processing", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Operation", "", new RegExp(runName))
        choose(page, dialog, "Service", "coating", /Filter coating service/)
        dialog.getByLabel("Quantity", {exact: true}).fill("2")
        choose(page, dialog, "Supplier", "Ziddleman", /Ziddleman/)
        dialog.getByRole("button", {name: "Request outside processing", exact: true}).click()
        page.waitForURL(/Subcontracting\/SubcontractDetail/)
        waitForText(page, "Requested")
        const text = page.text()
        text.includes(runName)
        text.includes("Filter coating service")
        text.includes("a buyer converts the request in Supply planning")
    }
})

feature("the buyer converts the request in Supply planning into a draft purchase order line", {
    expect() {
        const page = pages["manufacturing.buyer:1280"]
        page.goto("/qapps/Manufacturing/Planning/SupplyPlanning?plantId=ZIRET_WH&methodEnumId=PsmOutside").status == 200
        waitForText(page, "Outside processing")
        // the newest proposed coating request's row: from its product link up to the row with its selection box
        const selected = page.evaluate(id => {
            const links = Array.from(document.querySelectorAll(".q-page a")).filter(each => each.innerText.trim() === id)
            for (const link of links.reverse()) {
                let row = link
                while (row && !row.querySelector(".q-checkbox")) row = row.parentElement
                if (row && row.innerText.includes("Proposed")) {
                    row.querySelector(".q-checkbox").click()
                    return true
                }
            }
            return false
        }, "BOSS_WH_COATING")
        selected == true
        page.evaluate(() => {
            const button = Array.from(document.querySelectorAll(".q-page .q-btn")).find(
                each => each.innerText.trim() === "more_vert"
            )
            button.click()
            return true
        })
        page.locator(".q-menu").getByRole("button", {name: "Convert", exact: true}).click()
        const convert = page.getByRole("dialog")
        confirmNext(page)
        convert.getByRole("button", {name: "Make draft purchase order lines", exact: true}).click()
        convert.waitFor({state: "hidden"})
        waitForText(page, "Purchase order ")
        page.text().includes("Converted")
    }
})

feature("the buyer reads the order line's price on the record; the planner reads the order and no price", {
    expect() {
        const buyer = pages["manufacturing.buyer:1280"]
        buyer.goto("/qapps/Manufacturing/Subcontracting").status == 200
        waitForText(buyer, "Assemble")
        buyer.getByRole("link", {name: "Assemble", exact: true}).first().click()
        buyer.waitForURL(/SubcontractDetail/)
        waitForText(buyer, "Draft purchase order")
        buyer.text().includes("$3.00")
        const url = buyer.url()
        const planner = pages["manufacturing.plan:1280"]
        planner.goto(url.substring(url.indexOf("/qapps/"))).status == 200
        waitForText(planner, "Draft purchase order")
        !planner.text().includes("$3.00")
    }
})

feature("the outside-processing worklist fits 390 px", {
    expect() {
        const page = pages["manufacturing.plan:390"]
        page.goto("/qapps/Manufacturing/Subcontracting").status == 200
        waitForText(page, "Outside processing")
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1) == true
    }
})
