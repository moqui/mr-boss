// Warehouse P9 in the live client (impl-warehouse P9 "Usable when"): on a phone (390 px) Handheld Putaway keeps the scan
// focus and 48 px controls at handheld density, and the scanner on hold at receiving, which no default location or rule
// fits, stays there with the reason named; at the desk the receiving stock is queued, Putaway suggests the rule's bulk bay
// for the sealant on hold and explains why its pick bin is refused for capacity, and the mover confirms the move. The
// reason for another bin, a retry and the rules are the WarehousePutaway specs (mr-mantle and mr-boss); access is
// WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const width of [390, 1280]) {
            const page = browser.newPage({user: "warehouse.move", viewport: {width, height: 844}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[width] = page
        }
    }
})
function waitForText(page, pattern) {
    page.waitFor(source => new RegExp(source).test(document.body.innerText), {arg: pattern.source})
}
// a code typed as a keyboard wedge sends it, ending in Enter, into a scan field
function scan(page, selector, code) {
    page.click(selector)
    page.fill(selector, "")
    page.keyboard.type(code)
    page.keyboard.press("Enter")
}

feature("at handheld density on a phone Putaway keeps the scan focus and 48 px controls", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Putaway?facilityId=ZIRET_WH").status == 200
        page.waitFor(() => !!document.querySelector("#HandheldSelect_stockScan"))
        page.settle()
        const shell = page.evaluate(() => {
            const control = document
                .querySelector("#HandheldSelect_stockScan")
                .closest(".q-field")
                .querySelector(".q-field__control")
            return {
                handheld: document.body.classList.contains("m-density-handheld"),
                drawer: !!document.querySelector(".q-drawer--left"),
                height: Math.round(control.getBoundingClientRect().height),
                focused: document.activeElement && document.activeElement.id,
                fits: document.documentElement.scrollWidth <= innerWidth
            }
        })
        shell.handheld
        !shell.drawer
        shell.height >= 48
        shell.focused == "HandheldSelect_stockScan"
        shell.fits
    }
})

feature("a scanned unit no location fits stays in receiving with the reason named", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Putaway?facilityId=ZIRET_WH").status == 200
        page.waitFor(() => !!document.querySelector("#HandheldSelect_stockScan"))
        page.settle()
        scan(page, "#HandheldSelect_stockScan", "BOSS_WH_SER_2")
        waitForText(page, /No default location or putaway rule applies to Serialized scanner here; it stays where it is/)
        page.text().includes("BOSS_WH_SER_2")
        page.evaluate(() => !!document.querySelector("#HandheldPutawayForm_toPlace")) == true
    }
})

feature("at the desk Putaway queues the receiving stock, explains the pick bin's refusal and puts the sealant away", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Receiving/Putaway?facilityId=ZIRET_WH").status == 200
        waitForText(page, /BOSS_WH_LOT_HOLD/)
        page.text().includes("Waiting to be put away")
        page.text().includes("BOSS_WH_SER_2")
        page.getByRole("link", {name: "BOSS_WH_LOT_HOLD", exact: true}).first().click()
        waitForText(page, /Suggested: 01020302/)
        waitForText(page, /Locations tried/)
        page.text().includes("Refused")
        page.text().includes("do not fit")
        page.settle()
        page.getByRole("button", {name: "Confirm move"}).click()
        waitForText(page, /Put away \d+ of BOSS_WH_LOT_HOLD from 0801 to 01020302, as suggested/)
    }
})
