// Warehouse P3 in the live client (impl-warehouse P3 "usable when"): a warehouse manager sets ZIRET_WH to two-step
// receipt, a product to lot required and a facility reservation default with no store; the preview names the source
// of each value and the store's own setting wins for its orders; a reader reads the effective policy without the
// change actions. The services, refusals and every screen are WarehousePolicies and WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const user of ["warehouse.manager", "warehouse.read"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 1100}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// choose an option of a drop-down in a dialog, then close the option menu
function choose(page, dialog, label, option, search) {
    dialog.getByLabel(label, {exact: true}).click()
    if (search) dialog.getByLabel(label, {exact: true}).fill(search)
    page.getByRole("option", {name: option, exact: true}).first().click()
    page.keyboard.press("Escape")
    page.settle()
}
const settings = "/qapps/Warehouse/Settings/"

feature("a manager sets ZIRET_WH to two-step receipt and the trace names the facility as its source", {
    expect() {
        const page = pages["warehouse.manager"]
        page.goto(settings + "StockPolicies/OperationPolicy?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Operations at Ziziwork Retail Warehouse")
        page.text().includes("Organization: Ziziwork Retail")
        page.getByRole("button", {name: "Change operations", exact: true}).click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Receipt steps", "2 steps: receive to a receiving location, then put away")
        dialog.locator("input[name=changeReason]").fill("Walk: two-step receipt")
        dialog.getByRole("button", {name: "Save operation policy", exact: true}).click()
        waitForText(page, "Walk: two-step receipt")
        page.text().includes("Facility: Ziziwork Retail Warehouse")
        page.text().includes("2 steps: receive to a receiving location, then put away")
    }
})
feature("a manager makes a product lot required by a product exception", {
    expect() {
        const page = pages["warehouse.manager"]
        page.goto(settings + "StockPolicies/ProductTrackingExceptions").status == 200
        waitForText(page, "Product tracking exceptions")
        page.getByRole("button", {name: "Add exception", exact: true}).click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Product", "Demo Product One-One", "One-One")
        choose(page, dialog, "Lot required", "Yes")
        dialog.locator("input[name=changeReason]").fill("Walk: demo product by lot")
        dialog.getByRole("button", {name: "Save exception", exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-dialog"))
        waitForText(page, "Demo Product One-One")
        page.goto(settings + "StockPolicies/PolicyPreview?facilityId=ZIRET_WH&productId=DEMO_1_1").status == 200
        waitForText(page, "Policy in effect")
        page.text().includes("Product exception: Demo Product One-One")
    }
})
feature("a manager sets a facility reservation default with no store; the store's own setting wins for its orders", {
    expect() {
        const page = pages["warehouse.manager"]
        page.goto(settings + "ReservationPolicies/FacilityReservation?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Reservation default at Ziziwork Retail Warehouse")
        page.getByRole("button", {name: "Change reservation default", exact: true}).click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Reservation order", "LIFO Receive")
        dialog.locator("input[name=changeReason]").fill("Walk: newest stock first")
        dialog.getByRole("button", {name: "Save reservation default", exact: true}).click()
        waitForText(page, "Walk: newest stock first")
        page.text().includes("LIFO Receive")
        page.goto(settings + "StockPolicies/PolicyPreview?facilityId=ZIRET_WH&productStoreId=POPC_DEFAULT").status == 200
        waitForText(page, "orders of Ziziwork Retail Store")
        page.text().includes("Store: Ziziwork Retail Store")
        page.goto(settings + "StockPolicies/PolicyPreview?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Policy in effect")
        page.text().includes("Reservation: Reservation order")
        page.text().includes("LIFO Receive")
    }
})
feature("a reader reads the effective policy and its sources without the change actions", {
    expect() {
        const page = pages["warehouse.read"]
        page.goto(settings + "StockPolicies/OperationPolicy?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Operations at Ziziwork Retail Warehouse")
        page.text().includes("Facility: Ziziwork Retail Warehouse")
        page.getByRole("button", {name: "Change operations", exact: true}).count() == 0
        page.goto(settings + "Index").status == 200
        waitForText(page, "Warehouse managers change it")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
