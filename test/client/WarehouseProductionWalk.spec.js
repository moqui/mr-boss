// Warehouse P16 in the live client (impl-warehouse P16 "Usable when", design §19 subcontract output): the issuer opens the
// demo production run BOSS_WH_RUN in MaterialIssueReceipt (its frozen lines on the coating operation, no approved standard),
// receives the coated filters on the subcontract dispatch's Output receipt pane, which issues the filters at the
// vendor-custody facility and accepts the service line, then sees the output's tracking at a provisional cost on the run and
// returns one unused filter. The Mantle rules (lines from the released BOM, the frozen standard, two operations as two
// issuances, retries, quarantine with generated serials, refusals) are mr-mantle's WarehouseProduction spec; the demo run of
// DEMO_1_1 is WarehouseProductionFixtures'.
let page
spec({
    setupSpec() {
        page = browser.newPage({user: "warehouse.issue", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
function waitForMessage(text) {
    page.waitFor(text => (document.body.innerText || "").includes(text), {arg: text})
}
const runUrl = "/qapps/Warehouse/Inventory/MaterialIssueReceipt?sourceType=productionRun&sourceId=BOSS_WH_RUN"

feature("the run shows its frozen lines on their operation and its cost basis", {
    expect() {
        page.goto(runUrl).status == 200
        waitForText("Production run BOSS_WH_RUN")
        const text = page.text()
        text.includes("Coated filters")
        text.includes("Coating at Ziddleman")
        text.includes("Transfer demo filter")
        text.includes("No approved standard")
        text.includes("Output · 1")
        text.includes("Coated filter")
    }
})

feature("the subcontract's output is received from the vendor facility and the service line accepted", {
    expect() {
        page.goto("/qapps/Warehouse/Transfers/SubcontractShipmentDetail?shipmentId=BOSS_WH_SHIP_SUB").status == 200
        waitForText("Output receipt · Coated filter")
        page.getByRole("button", {name: "Receive output", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Quantity received", {exact: true}).fill("2")
        dialog.getByLabel("Location", {exact: true}).click()
        page.getByRole("option", {name: "01020401"}).first().click()
        dialog.getByRole("button", {name: "Receive and accept", exact: true}).click()
        waitForMessage("the service line is accepted")
        waitForText("2 of 4 received on run BOSS_WH_RUN")
        page.text().includes("2 of 4 accepted")
    }
})

feature("the run shows the output at a provisional cost and returns an unused filter as a new receipt", {
    expect() {
        page.goto(runUrl).status == 200
        waitForText("Tracking · 1")
        page.text().includes("Provisional")
        page.text().includes("Unused returns · 1")
        page.getByRole("button", {name: "Return", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Quantity", {exact: true}).fill("1")
        dialog.getByRole("button", {name: "Return unused", exact: true}).click()
        waitForMessage("Returned 1")
        waitForText("Unused return")
    }
})
