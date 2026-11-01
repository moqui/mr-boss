// Warehouse P17 in the live client (impl-warehouse P17 "Usable when"): a reader opens Reports from Home, chooses Stock at date
// and the demo's lot by weight from September 10 through 30, and sees its opening, receipts, issues, adjustments and closing,
// then its history; from a day before the demo's first movement the opening is Unknown and the history flagged incomplete;
// OperationsHistory totals each unit apart and opens a receipt; InventoryValuation refuses the reader its values and links
// the quantity reports; on a phone (390 px) Stock at date fits the screen. The reads and refusals are BOSS's
// WarehouseReports and mr-mantle's WarehouseReports specs.
let pages = {}
spec({
    setupSpec() {
        for (const [key, user, width] of [
            ["read", "warehouse.read", 1280],
            ["phone", "warehouse.read", 390]
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
// a drop-down of the find form: open it, type, choose the option
function choose(page, label, typed, option) {
    page.getByLabel(label, {exact: true}).first().click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Escape")
    page.settle()
}

feature("a reader finds a lot's stock at a past date with its opening, receipts, issues, adjustments and closing", {
    expect() {
        const page = pages.read
        page.goto("/qapps/Warehouse/Home").status == 200
        waitForText(page, "Operation queues")
        choose(page, "Facility", null, "Ziziwork Retail Warehouse")
        page.getByRole("button", {name: "Choose facility", exact: true}).click()
        waitForText(page, "Products in stock")
        page.getByText("Stock at date, history, valuation").first().click()
        page.waitForURL(/ReportIndex/)
        waitForText(page, "Operations history")
        page.getByRole("link", {name: "Stock at date", exact: true}).first().click()
        page.waitForURL(/StockAtDate/)
        waitForText(page, "What was on hand at the end of a day")
        page.locator("input[name=fromDate]").fill("2026-09-10")
        page.locator("input[name=asOfDate]").fill("2026-09-30")
        choose(page, "Lot", "SHEET", "SHEET-2026-09")
        // close the lot's menu before the find's button
        page.getByText("What was on hand at the end of a day").first().click()
        page.getByRole("button", {name: "Show stock", exact: true}).click()
        waitForText(page, "Stock from 2026-09-10 through the end of 2026-09-30")
        waitForText(page, "Gasket sheet by weight")
        const text = page.text()
        text.includes("57.5")
        text.includes("-0.5")
        !text.includes("History is incomplete")
        page.getByRole("tab", {name: "History", exact: true}).first().click()
        waitForText(page, "BOSS_WH_SHIP_SHEET_OUT")
        page.text().includes("BOSS_WH_SHEET_SCRAP")
    }
})

feature("before the demo's first movement the opening is unknown and the history flagged incomplete", {
    expect() {
        const page = pages.read
        page.goto("/qapps/Warehouse/Reports/StockAtDate?lotId=BOSS_WH_LOT_SHEET&asOfDate=2026-09-30").status == 200
        waitForText(page, "Stock from")
        page.locator("input[name=fromDate]").fill("2009-01-01")
        page.getByRole("button", {name: "Show stock", exact: true}).click()
        waitForText(page, "History is incomplete")
        page.text().includes("Unknown")
        page.text().includes("57.5")
    }
})

feature("operations history totals each unit apart and opens a receipt", {
    expect() {
        const page = pages.read
        page.goto("/qapps/Warehouse/Reports/OperationsHistory?fromDate=2026-09-01&thruDate=2026-09-30").status == 200
        waitForText(page, "BOSS_WH_SHIP_SHEET_IN")
        page.text().includes("Kilogram")
        page.getByRole("link", {name: "BOSS_WH_SHIP_SHEET_IN", exact: true}).first().click()
        page.waitForURL(/ReceiptDetail/)
        waitForText(page, "BOSS_WH_SHIP_SHEET_IN")
    }
})

feature("a reader without financial read is refused the valuation's values and offered the quantity reports", {
    expect() {
        const page = pages.read
        page.goto("/qapps/Warehouse/Reports/InventoryValuation").status == 200
        waitForText(page, "Stock values need financial read")
        !page.text().includes("Inventory accounts")
        page.getByRole("link", {name: "Stock at date", exact: true}).count() > 0
    }
})

feature("on a phone Stock at date fits the screen", {
    expect() {
        const page = pages.phone
        page.goto("/qapps/Warehouse/Reports/StockAtDate?lotId=BOSS_WH_LOT_SHEET&fromDate=2026-09-10&asOfDate=2026-09-30")
            .status == 200
        waitForText(page, "Gasket sheet by weight")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    }
})
