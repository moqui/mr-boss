// Warehouse P11 in the live client (impl-warehouse P11 "Usable when"): a picker opens the demo picklist "Morning picks",
// starts picking, picks part of the line at its pick location and short-picks the rest, which shows Short and requests a
// recount with on-hand unchanged; on a phone (390 px) Handheld Pick keeps the scan focus at handheld density and fits the
// screen, and the move group's pick-face moves list what is below minimum. The wave with its excluded order and results,
// the put back of a cancelled balance and the pick-face refill are mr-mantle's WarehousePicking spec; access is
// WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [width, user] of [[1280, "warehouse.pick"], [390, "warehouse.pick"], [1281, "warehouse.move"]]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}

feature("a picker opens the picklist, picks part of the line and short-picks the rest: Short, a recount, on-hand unchanged", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Picking/Picklists").status == 200
        waitForText(page, "Morning picks")
        page.getByRole("link", {name: "Morning picks", exact: true}).first().click()
        page.waitForURL(/PicklistDetail/)
        waitForText(page, "BOSS_WH_SHIP_PICK")
        page.getByRole("link", {name: "Start picking", exact: true}).first().click()
        page.waitForURL(/Picking\/Pick/)
        waitForText(page, "Pick demo bracket: 3 to pick at 01020201")
        page.getByLabel("Quantity", {exact: true}).first().fill("2")
        page.getByRole("button", {name: "Pick", exact: true}).first().click()
        waitForText(page, "Pick demo bracket: 1 to pick at 01020201")
        page.getByRole("button", {name: "Short", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByRole("button", {name: "Record short pick", exact: true}).click()
        waitForText(page, "Every line is picked or short")
        const text = page.text()
        text.includes("on-hand is not changed")
        text.includes("recount")
        text.includes("Short")
    }
})

feature("on a phone Handheld Pick keeps the scan focus at handheld density and fits the screen", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Pick").status == 200
        page.waitFor(() => !!document.querySelector("#ScanWork_workCode"))
        page.settle()
        const shell = page.evaluate(() => {
            const control = document.querySelector("#ScanWork_workCode").closest(".q-field").querySelector(".q-field__control")
            return {
                handheld: document.body.classList.contains("m-density-handheld"),
                height: Math.round(control.getBoundingClientRect().height),
                focused: document.activeElement && document.activeElement.id,
                fits: document.documentElement.scrollWidth <= innerWidth
            }
        })
        shell.handheld
        shell.height >= 48
        shell.focused == "ScanWork_workCode"
        shell.fits
    }
})

feature("the move group opens the pick-face moves of the facility", {
    expect() {
        const page = pages[1281]
        page.goto("/qapps/Warehouse/Picking/PickLocationMoves?facilityId=ZIRET_WH").status == 200
        waitForText(page, "Below minimum")
        page.text().includes("Quick move to a pick face")
    }
})
