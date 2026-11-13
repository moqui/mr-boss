// Warehouse P13 in the live client (impl-warehouse P13 "Usable when", design §19 label timeout and retry): a shipper opens
// the demo's packed shipment in Ship, sees it rated by the Mantle test carrier and by the local rules, buys both packages'
// labels, prints them on the dock printer the demo has no server for (the print fails, the labels stay and Reprint is
// offered) and ships it; PackageTracking lists its packages, and a delivery is recorded by hand; on a phone (390 px)
// PackageTracking fits the screen. The timeout's ask-before-retry, the refund, the manual carrier and the dispatch checks
// are mr-mantle's WarehouseShipping spec; access is WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [width, user] of [
            [1280, "warehouse.ship"],
            [390, "warehouse.ship"]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[width] = page
        }
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
    })
}

feature("a shipper rates the packed shipment, buys its labels, prints them (the print fails, Reprint is offered) and ships it", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Shipping/Ship?shipmentId=BOSS_WH_SHIP_SHIP").status == 200
        waitForText(page, "Ship demo bracket")
        const rated = page.text()
        rated.includes("Local rules")
        rated.includes("14 USD")
        rated.includes("Not ready to ship")
        // the toolbar's Buy labels (after the rate rows' ones)
        page.getByRole("button", {name: "Buy labels", exact: true}).last().click()
        waitForText(page, "1ZTEST")
        waitForText(page, "Labels · 2 of 2")
        page.getByRole("button", {name: "Print labels", exact: true}).click()
        waitForText(page, "Reprint")
        page.text().includes("1ZTEST")
        page.getByRole("button", {name: "Ship", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        acceptConfirm(page)
        dialog.getByRole("button", {name: "Ship", exact: true}).click()
        waitForText(page, "This shipment has shipped")
    }
})

feature("PackageTracking lists the shipped packages, and a delivery is recorded by hand", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Shipping/PackageTracking?shipmentId=BOSS_WH_SHIP_SHIP").status == 200
        waitForText(page, "BOSS_WH_SHIP_SHIP")
        page.text().includes("Test Carrier")
        page.getByRole("button", {name: "Record delivery", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Received by", {exact: true}).fill("Front desk")
        dialog.getByRole("button", {name: "Record delivery", exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-dialog"))
        page.goto("/qapps/Warehouse/Shipping/PackageTracking?shipmentId=BOSS_WH_SHIP_SHIP&show=all").status == 200
        waitForText(page, "Front desk")
    }
})

feature("on a phone PackageTracking fits the screen", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Shipping/PackageTracking?show=all").status == 200
        waitForText(page, "Package tracking")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
