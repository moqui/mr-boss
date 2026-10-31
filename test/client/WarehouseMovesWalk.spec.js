// Warehouse P5 in the live client (impl-warehouse P5 "Usable when"): on a phone (390 px) the Handheld Move keeps the scan
// focus and 48 px controls at handheld density; a mover scans an asset and a bin and moves part of it, confirming the bin;
// a move of quarantined stock into a pick bin is refused; at the desk, Move lists a quarantine location's stock and warns
// that it stays quarantined. The retry of an operation, Relocate with one invalid asset and the container move are the
// WarehouseMoves specs (mr-mantle and mr-boss); access and refusals are WarehouseAccess.
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

feature("at handheld density on a phone Move keeps the scan focus and 48 px controls", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Move?facilityId=ZIRET_WH").status == 200
        page.waitFor(() => !!document.querySelector("#HandheldMoveForm_assetId"))
        page.settle()
        const shell = page.evaluate(() => {
            const control = document
                .querySelector("#HandheldMoveForm_assetId")
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
        shell.focused == "HandheldMoveForm_assetId"
        shell.fits
    }
})

feature("a mover scans an asset and a bin and moves part of it, and the focus comes back to the scan", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Move?facilityId=ZIRET_WH").status == 200
        page.waitFor(() => !!document.querySelector("#HandheldMoveForm_assetId"))
        page.settle()
        scan(page, "#HandheldMoveForm_assetId", "BOSS_WH_LOT_AVAIL")
        page.waitFor(() => !document.querySelector(".m-scan-input .q-field--loading"))
        page.fill("#HandheldMoveForm_quantity", "1")
        scan(page, "#HandheldMoveForm_toPlace", "01020302")
        page.waitFor(() => /01020302/.test((document.querySelector(".m-scan-confirm") || {}).innerText || ""))
        // Enter on the same text confirms the bin, and the form posts with the bin scan's id as its operation key
        page.keyboard.press("Enter")
        waitForText(page, /Moved 1 of BOSS_WH_LOT_AVAIL from 01020301 to 01020302/)
        page.waitFor(() => !!document.querySelector("#HandheldMoveForm_assetId"))
        page.settle()
        page.evaluate(() => document.activeElement && document.activeElement.id) == "HandheldMoveForm_assetId"
        page.text().includes("Your recent moves")
    }
})

feature("a move of quarantined stock into a pick bin is refused", {
    expect() {
        const page = pages[390]
        // the refusal is the expected notification of a refused transition; its status is 500 because the framework
        // answers every JSON transition response with errors as a 500 (impl-warehouse F418), until that is changed
        page.allowProblems(/HELD_STOCK/)
        page.allowProblems(/500 Internal Server Error .*moveStock/)
        page.goto("/qapps/Warehouse/Handheld/Move?facilityId=ZIRET_WH").status == 200
        page.waitFor(() => !!document.querySelector("#HandheldMoveForm_assetId"))
        page.settle()
        scan(page, "#HandheldMoveForm_assetId", "BOSS_WH_LOT_QUARANTINE")
        page.waitFor(() => !document.querySelector(".m-scan-input .q-field--loading"))
        scan(page, "#HandheldMoveForm_toPlace", "01020301")
        page.waitFor(() => !!document.querySelector(".m-scan-confirm"))
        page.keyboard.press("Enter")
        waitForText(page, /HELD_STOCK|is quarantined/)
    }
})

feature("at the desk Move lists a quarantine location's stock and warns it stays quarantined", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Transfers/Move?facilityId=ZIRET_WH&locationSeqId=0901").status == 200
        waitForText(page, /BOSS_WH_LOT_QUARANTINE/)
        page.text().includes("Reserved")
        page.getByRole("link", {name: "BOSS_WH_LOT_QUARANTINE", exact: true}).first().click()
        waitForText(page, /Quarantined stock moves only to a location where it stays quarantined/)
        page.text().includes("To location")
        page.text().includes("Move to another facility")
    }
})
