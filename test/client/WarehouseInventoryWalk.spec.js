// Warehouse P4 in the live client (impl-warehouse P4 "Usable when"): a reader finds a lot's assets across locations and
// follows one asset's ledger to its receipt; a trace of the received lot reaches its shipments and shows Unknown for stock
// with no receipt; the reader sees no cost; an adjuster edits an asset's name, offered nothing else, and finds the change
// in its audit; the Inventory lists fit 390 px. Access and refusals are WarehouseAccess and WarehouseInventory.
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["warehouse.read", 1280],
            ["warehouse.read", 390],
            ["warehouse.adjust", 1280]
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

feature("a reader finds a lot's stock across locations and follows an asset's ledger to its receipt", {
    expect() {
        const page = pages["warehouse.read:1280"]
        page.goto("/qapps/Warehouse/Inventory/Lots").status == 200
        waitForText(page, "SEAL-2026-A")
        page.getByRole("link", {name: "SEAL-2026-A", exact: true}).first().click()
        waitForText(page, "Lot SEAL-2026-A")
        page.text().includes("BOSS_WH_LOT_HOLD")
        page.text().includes("BOSS_WH_LOT_EAST")
        page.getByRole("link", {name: "BOSS_WH_LOT_AVAIL", exact: true}).first().click()
        waitForText(page, "Receipt BOSS_WH_RCPT_A")
        page.text().includes("Shipment BOSS_WH_SHIP_IN")
        !page.text().includes("Unit cost")
        !page.text().includes("Edit details")
    }
})
feature("a trace of the received lot reaches its shipments and shows Unknown provenance, without cost", {
    expect() {
        const page = pages["warehouse.read:1280"]
        page.goto("/qapps/Warehouse/Inventory/Traceability").status == 200
        waitForText(page, "Choose a lot, asset or shipment to trace.")
        page.getByLabel("Code", {exact: true}).fill("BOSS_WH_LOT_A")
        page.getByRole("button", {name: "Trace", exact: true}).click()
        waitForText(page, "Lineage")
        page.text().includes("Shipment BOSS_WH_SHIP_IN")
        page.text().includes("Shipment BOSS_WH_SHIP_OUT")
        page.text().includes("Unknown provenance")
        !page.text().includes("Unit cost")
    }
})
feature("an adjuster edits an asset's name, with nothing else to edit, and finds it in the audit", {
    expect() {
        const page = pages["warehouse.adjust:1280"]
        page.goto("/qapps/Warehouse/Inventory/AssetDetail?assetId=BOSS_WH_SER_3").status == 200
        waitForText(page, "SCN-1003")
        page.getByRole("button", {name: "Edit details", exact: true}).click()
        page.waitFor(() => !!document.querySelector("#EditAsset input[name=assetName]"))
        page.evaluate(() => document.querySelectorAll("#EditAsset input:not([type=hidden]), #EditAsset textarea").length) == 2
        page.fill("#EditAsset input[name=assetName]", "East bench scanner")
        page.getByRole("button", {name: "Save details", exact: true}).click()
        waitForText(page, "East bench scanner")
        page.getByRole("tab", {name: "Audit", exact: true}).click()
        waitForText(page, "warehouse.adjust")
        page.text().includes("Name")
    }
})
feature("the Inventory lists fit 390 px", {
    expect() {
        const page = pages["warehouse.read:390"]
        for (const path of ["Assets", "Movements", "Lots?lotId=BOSS_WH_LOT_A", "Containers"]) {
            page.goto("/qapps/Warehouse/Inventory/" + path).status == 200
            page.settle()
            assert(!/Error rendering|Exception in render/.test(page.text()), path + " renders")
            assert(page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path + " fits 390 px")
        }
    }
})
