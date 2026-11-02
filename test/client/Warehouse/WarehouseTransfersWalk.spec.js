// Warehouse P15 in the live client (impl-warehouse P15 "Usable when", design §19 transfer in transit): the issuer sends the
// demo transfer's filters from ZIRET_WH and ships it, and it shows in transit; the receiver at BOSS_WH_EAST receives it in two
// parts and it is delivered; a planner approves the demo stock request and the move group allocates it by a transfer, its
// progress showing requested, approved and allocated; the move group dispatches components to the vendor-custody facility by
// move and they show as the organization's stock under custody at supplier. The Mantle rules (cost and owner carried by
// issuance, F37's sums, the refusals) are mr-mantle's WarehouseTransfers spec; the screens' scope is BOSS's WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const user of ["warehouse.issue", "warehouse.receive", "warehouse.planner", "warehouse.move"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// a transition's message, shown as a notification outside the page
function waitForMessage(page, text) {
    page.waitFor(text => (document.body.innerText || "").includes(text), {arg: text})
}
// a drop-down of the open dialog: open it, type, choose the option
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
}
function openDialog(page, button) {
    page.getByRole("button", {name: button, exact: true}).first().click()
    return page.getByRole("dialog")
}

feature("the origin sends the transfer's stock and ships it; it is in transit and not yet at the destination", {
    expect() {
        const page = pages["warehouse.issue"]
        page.goto("/qapps/Warehouse/Transfers/Transfers").status == 200
        waitForText(page, "BOSS_WH_SHIP_TRANSFER")
        page.getByRole("link", {name: "BOSS_WH_SHIP_TRANSFER", exact: true}).first().click()
        page.waitForURL(/TransferShipmentDetail/)
        waitForText(page, "Transfer demo filter")
        let dialog = openDialog(page, "Send stock")
        choose(page, dialog, "Line", "", "Transfer demo filter")
        choose(page, dialog, "Stock", "", "BOSS_WH_TRF_STOCK")
        dialog.getByLabel("Quantity", {exact: true}).fill("6")
        dialog.getByRole("button", {name: "Send", exact: true}).click()
        waitForMessage(page, "Sent 6 from BOSS_WH_TRF_STOCK")
        dialog = openDialog(page, "Ship")
        dialog.getByRole("button", {name: "Ship", exact: true}).click()
        waitForMessage(page, "it is in transit")
        waitForText(page, "6 on the way")
        page.text().includes("6 in transit")
        page.text().includes("Shipped")
    }
})

feature("the destination receives the transfer in two parts and it is delivered", {
    expect() {
        const page = pages["warehouse.receive"]
        page.goto("/qapps/Warehouse/Transfers/TransferShipmentDetail?shipmentId=BOSS_WH_SHIP_TRANSFER").status == 200
        waitForText(page, "6 on the way")
        let dialog = openDialog(page, "Receive")
        choose(page, dialog, "Line", "", "Transfer demo filter")
        dialog.getByLabel("Accepted", {exact: true}).fill("4")
        choose(page, dialog, "Location", "", "E0101")
        dialog.getByRole("button", {name: "Receive", exact: true}).click()
        waitForMessage(page, "2 still in transit")
        dialog = openDialog(page, "Receive")
        choose(page, dialog, "Line", "", "Transfer demo filter")
        dialog.getByLabel("Accepted", {exact: true}).fill("2")
        choose(page, dialog, "Location", "", "E0101")
        dialog.getByRole("button", {name: "Receive", exact: true}).click()
        waitForMessage(page, "the transfer is delivered")
        waitForText(page, "Received in full")
        page.text().includes("Delivered")
        page.text().includes("0 on the way")
    }
})

feature("a planner approves the stock request and the move group allocates it by a transfer", {
    expect() {
        const planner = pages["warehouse.planner"]
        planner.goto("/qapps/Warehouse/Transfers/StockRequests").status == 200
        waitForText(planner, "Filters for the east line")
        planner.getByRole("link", {name: "Filters for the east line", exact: true}).first().click()
        planner.waitForURL(/RequestDetail/)
        waitForText(planner, "Items and progress")
        const dialog = openDialog(planner, "Approve")
        dialog.getByRole("button", {name: "Approve", exact: true}).click()
        waitForMessage(planner, "Approved request BOSS_WH_REQ")
        const mover = pages["warehouse.move"]
        mover.goto("/qapps/Warehouse/Transfers/RequestDetail?requestId=BOSS_WH_REQ").status == 200
        waitForText(mover, "Items and progress")
        const allocate = openDialog(mover, "Allocate")
        choose(mover, allocate, "Item", "", "Transfer demo filter")
        choose(mover, allocate, "From", "", "Ziziwork Retail Warehouse")
        allocate.getByLabel("Quantity", {exact: true}).fill("4")
        allocate.getByRole("button", {name: "Allocate", exact: true}).click()
        waitForMessage(mover, "Allocated on transfer")
        waitForText(mover, "sent 0, received 0")
    }
})

feature("components dispatched to the vendor-custody facility by move stay the organization's, under custody at supplier", {
    expect() {
        const page = pages["warehouse.move"]
        page.goto("/qapps/Warehouse/Transfers/SubcontractShipmentDetail?shipmentId=BOSS_WH_SHIP_SUB").status == 200
        waitForText(page, "Custody at supplier")
        page.text().includes("BOSS_WH_SUB_PO:01")
        const dialog = openDialog(page, "Move to Ziddleman coating (custody)")
        choose(page, dialog, "Line", "", "Transfer demo filter")
        choose(page, dialog, "Stock", "", "BOSS_WH_TRF_STOCK")
        dialog.getByLabel("Quantity", {exact: true}).fill("2")
        choose(page, dialog, "To location", "", "V0101")
        dialog.getByRole("button", {name: "Move", exact: true}).click()
        waitForMessage(page, "it stays the organization's; the dispatch is complete")
        page.goto("/qapps/Warehouse/Transfers/Transfers?custody=Y&statusId=all").status == 200
        waitForText(page, "Stock at suppliers")
        page.text().includes("BOSS_WH_SHIP_SUB")
        page.text().includes("Ziddleman")
        page.text().includes("Ziziwork Retail")
    }
})
