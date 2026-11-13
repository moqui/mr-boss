// Warehouse P2 in the live client (impl-warehouse P2 "Usable when"): the facility admin creates a facility, gives it
// receiving, quarantine, staging and pick locations in an area, sets the receiving and quarantine types' statuses, and is
// refused closing a location of the demo warehouse that holds stock, with the stock named; a reader opens the facility,
// reads its locations and has no edit action; Facilities and FacilityDetail fit 390 px. The parent cycle and the Mantle
// rules are WarehouseFacilities (BOSS and mr-mantle).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["warehouse.facility", 1280],
            ["warehouse.read", 1280],
            ["warehouse.read", 390]
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
function acceptConfirmations(page) {
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
    })
}
// a server-search drop-down of the open dialog: open it, type, choose the option
function choose(page, dialog, label, typed, option) {
    dialog.getByLabel(label, {exact: true}).click()
    page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
}

// the Set status button of a location type's row: the one whose row (its nearest container with no other such button)
// starts with the type's name
function setStatusButton(page, type) {
    const index = page.evaluate(type => {
        const buttons = [...document.querySelectorAll(".q-page button")].filter(b => b.innerText.includes("Set status"))
        return buttons.findIndex(button => {
            for (let el = button.parentElement; el; el = el.parentElement) {
                if ((el.innerText.match(/Set status/g) || []).length > 1) return false
                if (el.innerText.trim().startsWith(type)) return true
            }
            return false
        })
    }, type)
    return page.getByRole("button", {name: "Set status"}).nth(index)
}

feature(
    "the facility admin builds a facility with an area, receiving, quarantine, staging and pick locations and their statuses",
    {
        expect() {
            const page = pages["warehouse.facility:1280"]
            const name = "Walk depot " + Date.now()
            page.goto("/qapps/Warehouse/Locations/Facilities").status == 200
            waitForText(page, "Ziziwork Retail East Warehouse")
            page.getByRole("button", {name: "New facility", exact: true}).first().click()
            let dialog = page.getByRole("dialog")
            dialog.getByLabel("Name", {exact: true}).fill(name)
            // the facility admin works for Retail and its Returns Center child, so the owner has no default
            choose(page, dialog, "Owner", "Retail", "Ziziwork Retail & Wholesale")
            dialog.getByRole("button", {name: "Create facility", exact: true}).click()
            page.waitForURL(/FacilityDetail/)
            waitForText(page, name)
            page.text().includes("Edit facility")
            page.getByRole("tab", {name: "Locations"}).first().click()
            waitForText(page, "Location types")
            for (const [locationSeqId, type] of [
                ["R1", "Receiving"],
                ["Q1", "Quarantine"],
                ["S1", "Staging"],
                ["P1", "Pick"]
            ]) {
                page.getByRole("button", {name: "New location", exact: true}).first().click()
                dialog = page.getByRole("dialog")
                dialog.getByLabel("Location id", {exact: true}).fill(locationSeqId)
                choose(page, dialog, "Type", type, type)
                dialog.getByLabel("Area", {exact: true}).fill("A")
                dialog.getByRole("button", {name: "Create location", exact: true}).click()
                dialog.waitFor({state: "hidden"})
                waitForText(page, locationSeqId)
            }
            for (const [type, status] of [
                ["Receiving", "On Hold"],
                ["Quarantine", "Quarantine"]
            ]) {
                setStatusButton(page, type).click()
                dialog = page.getByRole("dialog")
                dialog.getByLabel("Reason", {exact: true}).fill("New depot")
                choose(page, dialog, "Stock put there becomes", status, status)
                // the options close when the focus moves on
                page.keyboard.press("Tab")
                dialog.getByRole("button", {name: "Save status", exact: true}).click()
                dialog.waitFor({state: "hidden"})
            }
            waitForText(page, "On Hold")
            const text = page.text()
            text.includes("R1") && text.includes("Q1") && text.includes("S1") && text.includes("P1")
            text.includes("Area A")
        }
    }
)

feature("closing a location that holds stock is refused, naming the stock", {
    expect() {
        const page = pages["warehouse.facility:1280"]
        // the refusal is the expected notification of a refused transition
        page.allowProblems(/LOCATION_IN_USE/)
        page.allowProblems(/500 Internal Server Error .*closeLocation/)
        page.goto("/qapps/Warehouse/Locations/FacilityDetail/Locations?facilityId=ZIRET_WH&text=01020301").status == 200
        waitForText(page, "01020301")
        page.getByRole("button", {name: "Close", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Reason", {exact: true}).fill("Consolidating")
        acceptConfirmations(page)
        dialog.getByRole("button", {name: "Close location", exact: true}).click()
        page.waitFor(() => document.body.innerText.includes("BOSS_WH_LOT_AVAIL"))
        page.text().includes("cannot close until it is empty")
    }
})

feature("a reader opens the facility and reads its locations, with no edit action", {
    expect() {
        const page = pages["warehouse.read:1280"]
        page.goto("/qapps/Warehouse/Locations/FacilityDetail?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Forklift 2")
        !page.text().includes("Edit facility")
        page.getByRole("tab", {name: "Locations"}).first().click()
        waitForText(page, "Location types")
        !page.text().includes("New location")
        !page.text().includes("Set status")
        page.getByRole("link", {name: "Facilities", exact: true}).first().click()
        waitForText(page, "Ziziwork Retail East Warehouse")
        !page.text().includes("New facility")
    }
})

feature("Facilities and FacilityDetail fit 390 px", {
    expect() {
        const page = pages["warehouse.read:390"]
        page.goto("/qapps/Warehouse/Locations/Facilities").status == 200
        waitForText(page, "Ziziwork Retail East Warehouse")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        page.goto("/qapps/Warehouse/Locations/FacilityDetail/Locations?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Location types")
        page.settle()
        !/Error rendering|Exception in render/.test(page.text())
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
