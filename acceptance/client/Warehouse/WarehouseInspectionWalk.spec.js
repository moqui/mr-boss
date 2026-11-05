// Warehouse P8 in the live client (impl-warehouse P8 "Usable when", design §19 receipt to partial inspection): an inspector
// opens the demo's draft inspection of the quarantined sealant from Inspections, records its readings and submits 3
// accepted and 2 rejected; a quality manager verifies it and releases the accepted 3 (the scrap of the rest, the
// reservation of waiting demand and the receipt into quarantine are the WarehouseQuality and WarehouseInspections specs);
// a Warehouse reader opens the same inspection but no Inspection area, and on a phone (390 px) the inspection fits the
// screen. Access is WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        const open = (user, width) => {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            return page
        }
        pages = {
            inspector: open("warehouse.inspect", 1280),
            quality: open("warehouse.quality", 1280),
            reader: open("warehouse.read", 390)
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// a drop-down of the open dialog: open it, choose the option
function choose(page, scope, label, option) {
    scope.getByLabel(label, {exact: true}).click()
    page.getByRole("option", {name: option}).first().click()
}
// the Record reading button of the characteristic's row, in the template's order
function recordReading(page, index, fill, shown) {
    page.getByRole("button", {name: "Record reading"}).nth(index).click()
    const dialog = page.getByRole("dialog")
    fill(dialog)
    dialog.getByRole("button", {name: "Save reading", exact: true}).click()
    waitForText(page, shown)
}

feature("an inspector opens the inspection from Inspections, records its readings and submits the result", {
    expect() {
        const page = pages.inspector
        page.goto("/qapps/Warehouse/Inspection/Inspections").status == 200
        waitForText(page, "BOSS_WH_INSP")
        page.getByRole("link", {name: "BOSS_WH_INSP", exact: true}).first().click()
        waitForText(page, "Viscosity")
        recordReading(page, 0, dialog => dialog.getByLabel("Measured value", {exact: true}).fill("52"), "#1 52")
        recordReading(page, 1, dialog => choose(page, dialog, "Pass or fail", "Pass"), "#1 Pass")
        page.getByRole("button", {name: "Submit result", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Accepted", {exact: true}).fill("3")
        dialog.getByLabel("Rejected", {exact: true}).fill("2")
        dialog.getByLabel("Reason", {exact: true}).fill("Seal leaking on two tubes")
        dialog.getByRole("button", {name: "Submit result", exact: true}).click()
        waitForText(page, "Partly accepted: 3 accepted")
        page.text().includes("Partly accepted")
        // an inspector does not verify
        page.getByRole("button", {name: "Verify", exact: true}).count() == 0
    }
})

feature("a quality manager verifies it and releases the accepted part", {
    expect() {
        const page = pages.quality
        page.goto("/qapps/Warehouse/QualityInspection?qualityInspectionId=BOSS_WH_INSP").status == 200
        waitForText(page, "Viscosity")
        page.getByRole("button", {name: "Verify", exact: true}).first().click()
        page.getByRole("dialog").getByRole("button", {name: "Record decision", exact: true}).click()
        waitForText(page, "Verified by")
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
        page.getByRole("button", {name: "Dispose", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Quantity", {exact: true}).fill("3")
        dialog.getByRole("button", {name: "Post disposition", exact: true}).click()
        waitForText(page, "Left to dispose: 0 accepted")
        page.text().includes("3 in asset")
    }
})

feature("a Warehouse reader opens the inspection on a phone, with no Inspection area", {
    expect() {
        const page = pages.reader
        page.goto("/qapps/Warehouse/QualityInspection?qualityInspectionId=BOSS_WH_INSP").status == 200
        waitForText(page, "Viscosity")
        page.settle()
        const shown = page.evaluate(() => ({
            fits: document.documentElement.scrollWidth <= innerWidth,
            text: document.querySelector(".q-page")?.innerText || ""
        }))
        shown.fits
        shown.text.includes("BOSS_WH_INSP")
        !shown.text.includes("Record reading")
        page.goto("/qapps/Warehouse/Home").status == 200
        waitForText(page, "Warehouse")
        page.getByRole("link", {name: "Inspection", exact: true}).count() == 0
    }
})
