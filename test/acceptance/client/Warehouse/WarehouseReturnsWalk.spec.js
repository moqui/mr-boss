// Warehouse P14 in the live client (impl-warehouse P14 "Usable when", design §19 the return in two boxes, crosscut §6 customer
// and supplier returns): a receiver opens the demo RMA from Returns, sees no settlement action, and receives it in two boxes on
// ReturnReceipt, one unit rejected at the dock in the first, into quarantine with an inspection of each box; a quality manager
// sends back the demo supplier return's quarantined gaskets on SupplierReturnShipment and a shipper ships it, so the return is
// Shipped; on a phone (390 px) Returns fits the screen. Inspection, restocking and scrapping are the inspection walk's and
// mr-mantle's WarehouseReturns spec; the screens' reads and refusals are BOSS's WarehouseReturns and WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [key, user, width] of [
            ["receive", "warehouse.receive", 1280],
            ["quality", "warehouse.quality", 1280],
            ["ship", "warehouse.ship", 1280],
            ["phone", "warehouse.receive", 390]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[key] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.body?.innerText || "").includes(text), {arg: text})
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
// a drop-down of the open dialog: open it, choose the option
function choose(page, scope, label, option) {
    scope.getByLabel(label, {exact: true}).click()
    page.getByRole("option", {name: option}).first().click()
}
// one box of the RMA through the row's Receive dialog
function receiveBox(page, accepted, rejected) {
    page.getByRole("button", {name: "Receive", exact: true}).first().click()
    const dialog = page.getByRole("dialog")
    dialog.getByLabel("Accepted", {exact: true}).fill(String(accepted))
    dialog.getByLabel("Rejected at the dock", {exact: true}).fill(String(rejected))
    if (rejected) choose(page, dialog, "Rejection reason", "Damaged")
    dialog.getByLabel("Lot", {exact: true}).fill("SEAL-2026-A")
    dialog.getByRole("button", {name: "Receive", exact: true}).click()
}

feature("a receiver receives the RMA in two boxes, a unit rejected at the dock, into quarantine with an inspection per box", {
    expect() {
        const page = pages.receive
        page.goto("/qapps/Warehouse/Returns/Returns").status == 200
        waitForText(page, "BOSS_WH_RMA")
        page.getByRole("link", {name: "BOSS_WH_RMA", exact: true}).first().click()
        page.waitForURL(/ReturnDetail/)
        waitForText(page, "Customer return BOSS_WH_RMA")
        page.text().includes("Not settled")
        !page.text().includes("Settle return")
        page.getByRole("link", {name: "Receive", exact: true}).first().click()
        page.waitForURL(/ReturnReceipt/)
        waitForText(page, "Return receipt BOSS_WH_RMA_SHIP")
        receiveBox(page, 1, 1)
        waitForText(page, "1 rejected at the dock")
        page.text().includes("Received 1 into quarantine at 0901")
        receiveBox(page, 1, 0)
        waitForText(page, "Delivered")
        page.text().includes("Inspection and disposition")
        page.text().includes("Sealant check") || page.text().includes("Lot-tracked sealant")
        page.getByRole("button", {name: "Receive", exact: true}).count() == 0
    }
})

feature("a quality manager sends back the supplier return's quarantined lot and a shipper ships it, setting Shipped", {
    expect() {
        const quality = pages.quality
        quality.goto("/qapps/Warehouse/Returns/SupplierReturnShipment?shipmentId=BOSS_WH_SRET_SHIP").status == 200
        waitForText(quality, "Supplier return BOSS_WH_SRET_SHIP")
        quality.getByRole("button", {name: "Send back", exact: true}).first().click()
        const sendDialog = quality.getByRole("dialog")
        sendDialog.getByLabel("Quantity", {exact: true}).fill("3")
        sendDialog.getByRole("button", {name: "Send back", exact: true}).click()
        waitForText(quality, "Sent back 3 of BOSS_WH_RTS_STOCK")
        quality.getByRole("button", {name: "Ship", exact: true}).count() == 0
        const ship = pages.ship
        ship.goto("/qapps/Warehouse/Returns/SupplierReturnShipment?shipmentId=BOSS_WH_SRET_SHIP").status == 200
        waitForText(ship, "Supplier return BOSS_WH_SRET_SHIP")
        acceptConfirmations(ship)
        ship.getByRole("button", {name: "Ship", exact: true}).first().click()
        const shipDialog = ship.getByRole("dialog")
        shipDialog.getByLabel("Tracking code", {exact: true}).fill("1Z-RTV-P14")
        shipDialog.getByRole("button", {name: "Ship", exact: true}).click()
        waitForText(ship, "Shipped supplier return BOSS_WH_SRET_SHIP")
        ship.text().includes("1Z-RTV-P14")
        ship.goto("/qapps/Warehouse/Returns/ReturnDetail?returnId=BOSS_WH_SRET").status == 200
        waitForText(ship, "Supplier return BOSS_WH_SRET")
        ship.text().includes("Shipped")
    }
})

feature("on a phone Returns fits the screen", {
    expect() {
        const page = pages.phone
        page.goto("/qapps/Warehouse/Returns/Returns").status == 200
        waitForText(page, "BOSS_WH_RMA")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    }
})
