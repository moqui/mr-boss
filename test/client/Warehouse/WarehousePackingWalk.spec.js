// Warehouse P12 in the live client (impl-warehouse P12 "Usable when", design §19 multiple packages and the reopened
// package): a packer opens the demo's picked shipment in Pack, packs it into two cartons, weighs one and enters the other's
// weight, and completes the pack, which sends it to shipping with no label bought; Zizi's sales invoice is final at pack, so
// reopening a package is refused and it stays closed; the demo kit's components pack from MaterialIssueReceipt and make the
// kit; on a phone (390 px) Handheld Pack keeps the scan focus at handheld density and fits the screen. The reopen while the
// invoice is in process, the reduced line's put back and the kit's cost without WIP are mr-mantle's WarehousePacking spec;
// access is WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [width, user] of [
            [1280, "warehouse.pack"],
            [390, "warehouse.pack"]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(
        text => {
            const shown = document.querySelector(".q-page")?.innerText || ""
            return typeof text === "string" ? shown.includes(text) : new RegExp(text).test(shown)
        },
        {arg: typeof text === "string" ? text : text.source}
    )
}
function choose(page, scope, label, option) {
    scope.getByLabel(label, {exact: true}).click()
    page.getByRole("option", {name: option}).first().click()
}
function addPackage(page, boxType) {
    page.getByRole("button", {name: "Add package", exact: true}).first().click()
    const dialog = page.getByRole("dialog")
    choose(page, dialog, "Box type", boxType)
    dialog.getByRole("button", {name: "Add package", exact: true}).click()
    page.waitFor(() => !document.querySelector(".q-dialog"))
}
function packLine(page, quantity, packageLabel) {
    // the line's Pack, after PackScan's
    page.getByRole("button", {name: "Pack", exact: true}).nth(1).click()
    const dialog = page.getByRole("dialog")
    dialog.getByLabel("Quantity", {exact: true}).fill(String(quantity))
    choose(page, dialog, "Package", packageLabel)
    dialog.getByRole("button", {name: "Pack", exact: true}).click()
    page.waitFor(() => !document.querySelector(".q-dialog"))
}

feature("a packer packs the picked shipment into two cartons with their weights and completes the pack; no label is bought", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Shipping/Pack?shipmentId=BOSS_WH_SHIP_PACK").status == 200
        waitForText(page, "Pack demo hinge")
        addPackage(page, "Small carton")
        waitForText(page, "Packages · 1")
        packLine(page, 2, "Package 1 · Small carton")
        waitForText(page, "2 packed, 2 left")
        addPackage(page, "Medium carton")
        packLine(page, 2, "Package 2 · Medium carton")
        waitForText(page, "4 packed, 0 left")
        // the small carton weighed from its box and contents (0.4 + 2 × 0.5), the medium one entered
        page.getByRole("button", {name: "Weigh", exact: true}).first().click()
        waitForText(page, "1.4 lb")
        page.getByRole("button", {name: "Edit", exact: true}).nth(1).click()
        const edit = page.getByRole("dialog")
        edit.getByLabel("Weight", {exact: true}).fill("1.9")
        edit.getByRole("button", {name: "Save package", exact: true}).click()
        waitForText(page, "1.9 lb")
        page.getByRole("button", {name: "Complete pack", exact: true}).first().click()
        const complete = page.getByRole("dialog")
        complete.getByText("no label is bought here").count() == 1
        complete.getByRole("button", {name: "Complete pack", exact: true}).click()
        waitForText(page, "Packed ·")
        const text = page.text()
        text.includes("Packed · 4 packed, 0 left")
        text.includes("Small carton")
        text.includes("Medium carton")
        !text.includes("Pack into a package")
    }
})

feature("Zizi's invoice is final at pack, so reopening the package is refused and it stays closed", {
    expect() {
        const page = pages[1280]
        // the refusal is the expected notification of a refused transition; its status is 500 because the framework
        // answers every JSON transition response with errors as a 500 (impl-warehouse F418), until that is changed
        page.allowProblems(/INVOICE_FINALIZED/)
        page.allowProblems(/500 Internal Server Error .*reopenPackage/)
        page.goto("/qapps/Warehouse/Shipping/Pack?shipmentId=BOSS_WH_SHIP_PACK").status == 200
        waitForText(page, "Pack demo hinge")
        page.getByRole("button", {name: "Reopen", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Reason", {exact: true}).fill("Customer asked for one fewer")
        dialog.getByText("Take the contents out of this package").click()
        dialog.getByRole("button", {name: "Reopen package", exact: true}).click()
        // the refusal shows as a notification, outside the page
        page.waitFor(() => /stays closed|INVOICE_FINALIZED/.test(document.body.innerText))
        page.goto("/qapps/Warehouse/Shipping/Pack?shipmentId=BOSS_WH_SHIP_PACK").status == 200
        waitForText(page, "Packed · 4 packed, 0 left")
    }
})

feature("the demo kit's components pack from MaterialIssueReceipt and make the kit", {
    expect() {
        const page = pages[1280]
        page.goto("/qapps/Warehouse/Inventory/MaterialIssueReceipt?sourceType=shipmentAssembly&sourceId=BOSS_WH_SHIP_KIT")
            .status == 200
        waitForText(page, "Kit assembly for shipment BOSS_WH_SHIP_KIT")
        for (const quantity of ["1", "2"]) {
            // the first component with something left, after the header's Pack
            page.getByRole("button", {name: "Pack", exact: true}).nth(1).click()
            const dialog = page.getByRole("dialog")
            const quantityField = dialog.getByLabel("Quantity", {exact: true})
            quantityField.waitFor()
            quantityField.value() == quantity
            dialog.getByRole("button", {name: "Pack component", exact: true}).click()
            page.waitFor(() => !document.querySelector(".q-dialog"))
        }
        waitForText(page, "Kit received")
        const text = page.text()
        text.includes("Zinc hinge kit")
        // a packer without financial read sees no value
        !text.includes("Value")
    }
})

feature("on a phone Handheld Pack keeps the scan focus at handheld density and fits the screen", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Pack").status == 200
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
