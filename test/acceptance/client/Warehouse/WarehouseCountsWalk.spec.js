// Warehouse P10 in the live client (impl-warehouse P10 "Usable when"): a counter opens the Due find, opens the demo's
// planned blind count of a pick bin, starts it, and enters its lines on the desk grid without any expected quantity; on a
// phone (390 px) Handheld Count shows one line at a time at handheld density with nothing wider than the screen. Review,
// posting, retries and the schedule's due dates are the WarehouseCounts specs (mr-mantle and mr-boss); access is
// WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const width of [390, 1280]) {
            const page = browser.newPage({user: "warehouse.count", viewport: {width, height: 844}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[width] = page
        }
    }
})
function waitForText(page, pattern) {
    page.waitFor(source => new RegExp(source).test(document.body.innerText), {arg: pattern.source})
}

feature("the Due find lists the pick bins the schedule makes due", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Counts/Counts?view=due&facilityId=ZIRET_WH").status == 200
        waitForText(page, /Due for counting/)
        page.text().includes("Count every few days")
        page.text().includes("Location 01020301")
    }
})

feature("a counter starts the planned blind count and enters it without an expected quantity", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Counts/Counts?facilityId=ZIRET_WH").status == 200
        waitForText(page, /BOSS_WH_COUNT/)
        page.getByRole("link", {name: "BOSS_WH_COUNT", exact: true}).first().click()
        waitForText(page, /Cycle count: location 01020301/)
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
        }) == true
        page.getByRole("button", {name: "Start count"}).first().click()
        waitForText(page, /started with \d+ lines to count/)
        page.getByRole("link", {name: "Enter counts"}).first().click()
        waitForText(page, /Save counts/)
        const text = page.text()
        text.includes("Lot-tracked sealant")
        !text.includes("Expected")
        page.locator("input[id^='CountEntryList_quantity']").first().fill("35")
        page.getByRole("button", {name: "Save counts"}).first().click()
        waitForText(page, /Saved 1 counts/)
    }
})

feature("on a phone Handheld Count shows one line at a time at handheld density", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Count?physicalInventoryId=BOSS_WH_COUNT").status == 200
        waitForText(page, /Save and next/)
        page.settle()
        const shell = page.evaluate(() => ({
            handheld: document.body.classList.contains("m-density-handheld"),
            fits: document.documentElement.scrollWidth <= innerWidth
        }))
        shell.handheld
        shell.fits
        page.text().includes("Line 1 of")
        !page.text().includes("Expected")
    }
})
