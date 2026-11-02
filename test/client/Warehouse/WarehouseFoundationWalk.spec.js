// Warehouse P1 in the live client: a reader of Ziziwork Retail opens Warehouse, chooses a facility, reads the queues,
// looks up a unit by its serial number and finds nothing of another organization's; the palette's record link opens the
// lookup of a shipment; Home fits 390 px. The menus per group, the scope and the refusals are WarehouseShell and
// WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
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

feature("a reader chooses a facility, reads the queues and looks up their own unit only", {
    expect() {
        const page = pages["warehouse.read:1280"]
        page.goto("/qapps/Warehouse/Home").status == 200
        waitForText(page, "Operation queues")
        page.text().includes("Unavailable")
        page.text().includes("Nothing is assigned to you.")
        page.getByLabel("Facility", {exact: true}).click()
        page.getByRole("option", {name: "Ziziwork Retail East Warehouse"}).first().click()
        page.getByRole("button", {name: "Choose facility", exact: true}).click()
        waitForText(page, "Operation queues at Ziziwork Retail East Warehouse")
        // the Code is a scan input (P5): Enter resolves it, one match looks it up, another organization's is no match
        page.getByLabel("Code", {exact: true}).click()
        page.keyboard.type("SCN-1003")
        page.keyboard.press("Enter")
        waitForText(page, "Serialized scanner")
        page.text().includes("Asset BOSS_WH_SER_3")
        page.getByLabel("Code", {exact: true}).click()
        page.keyboard.type("BOSS_PRD_STOCK")
        page.keyboard.press("Enter")
        page.waitFor(() => /No match for BOSS_PRD_STOCK/.test(document.body.innerText))
    }
})
feature("a shipment's record link opens its lookup under Warehouse", {
    expect() {
        const page = pages["warehouse.read:1280"]
        page.goto("/qapps/Warehouse/Home?lookupType=shipment&lookupId=BOSS_WH_SHIP_TRANSFER").status == 200
        waitForText(page, "Shipment BOSS_WH_SHIP_TRANSFER")
        page.text().includes("Ziziwork Retail Warehouse")
        page.goto("/qapps/Warehouse/Home?lookupType=shipment&lookupId=BOSS_WH_SHIP_OTHER").status == 200
        waitForText(page, "Nothing in your facilities matches BOSS_WH_SHIP_OTHER")
    }
})
feature("Home fits 390 px", {
    expect() {
        const page = pages["warehouse.read:390"]
        page.goto("/qapps/Warehouse/Home?scanText=SCN-1001").status == 200
        waitForText(page, "Serialized scanner")
        page.settle()
        !/Error rendering|Exception in render/.test(page.text())
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
