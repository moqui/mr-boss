// Warehouse P7 in the live client (impl-warehouse P7 "Usable when", design §19 short receipt), past the golden path's
// opening of the receipt (test/client WarehouseReceivingWalk): a receiver receives part of the demo purchase order's
// sealant line with one unit rejected for a reason and a lot, and finishes the short receipt by closing the remainder
// with a reason, which delivers it; on a phone (390 px) Handheld Receive keeps the scan focus at handheld density. The
// Mantle rules are mr-mantle's WarehouseReceiving spec; the screens' reads and refusals are BOSS's WarehouseReceiving and
// WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const width of [1280, 390]) {
            const page = browser.newPage({user: "warehouse.receive", viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the in-app confirmation (moqui.confirmAction): only its Confirm button approves the action
function confirmAction(page) {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}
// a drop-down of the open dialog or the page: open it, type, choose the option; the options stay open over the dialog's
// button (with every open purchase order part listed) until the focus moves on
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
    page.waitFor(() => !Array.from(document.querySelectorAll(".q-menu"))
        .some(menu => menu.getClientRects().length && getComputedStyle(menu).visibility !== "hidden"))
}
// New receipt for the demo purchase order part: its open receipt, made the first time
function openReceipt(page) {
    page.goto("/qapps/Warehouse/Receiving/Receipts").status == 200
    waitForText(page, "Receipts")
    page.getByRole("button", {name: "New receipt", exact: true}).first().click()
    const dialog = page.getByRole("dialog")
    choose(page, dialog, "Purchase order", "BOSS_WH_PO", "PO BOSS_WH_PO")
    dialog.getByRole("button", {name: "Open receipt", exact: true}).click()
    page.waitForURL(/ReceiptDetail/)
    waitForText(page, "Purchase receipt")
    return /[?&]shipmentId=([^&]+)/.exec(page.evaluate(() => location.href))[1]
}

feature("a receiver receives part of the sealant with one unit rejected and a lot, then closes the remainder with a reason", {
    expect() {
        const page = pages[1280]
        const shipmentId = openReceipt(page)
        page.getByRole("link", {name: "Receive", exact: true}).first().click()
        page.waitForURL(/Receiving\/Receive/)
        waitForText(page, "Lot-tracked sealant")
        page.getByRole("link", {name: "Lot-tracked sealant", exact: true}).first().click()
        waitForText(page, "Receive Lot-tracked sealant")
        page.getByLabel("Accepted", {exact: true}).fill("12")
        page.getByLabel("Rejected", {exact: true}).fill("1")
        choose(page, page, "Rejection reason", "", "Damaged")
        page.getByLabel("Lot", {exact: true}).fill("SEAL-P7-WALK")
        page.getByRole("button", {name: "Receive", exact: true}).first().click()
        waitForText(page, "Receive Lot-tracked sealant: 7")
        // finish: close what did not arrive, with the reason, and the receipt is delivered
        page.goto("/qapps/Warehouse/Receiving/ReceiptDetail?shipmentId=" + shipmentId).status == 200
        waitForText(page, "SEAL-P7-WALK")
        page.getByRole("button", {name: "Finish receipt", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByText("Close it on the order").click()
        dialog.getByLabel("Reason", {exact: true}).fill("Supplier out of stock")
        dialog.getByRole("button", {name: "Finish receipt", exact: true}).click()
        confirmAction(page)
        waitForText(page, "Delivered")
        // the dialog closes after the answer shows: its "Finish receipt" button leaves the page a moment later
        page.waitFor(() => !(document.body.innerText || "").includes("Finish receipt"))
        page.text().includes("The remainder is closed")
        page.text().includes("Damaged")
        !page.text().includes("Finish receipt")
    }
})

feature("at handheld density on a phone Receive keeps the scan focus and fits the screen", {
    expect() {
        const page = pages[390]
        page.goto("/qapps/Warehouse/Handheld/Receive").status == 200
        page.waitFor(() => !!document.querySelector("#ScanReceipt_receiptCode"))
        page.settle()
        const shell = page.evaluate(() => {
            const control = document
                .querySelector("#ScanReceipt_receiptCode")
                .closest(".q-field")
                .querySelector(".q-field__control")
            return {
                handheld: document.body.classList.contains("m-density-handheld"),
                height: Math.round(control.getBoundingClientRect().height),
                focused: document.activeElement && document.activeElement.id,
                fits: document.documentElement.scrollWidth <= innerWidth
            }
        })
        shell.handheld
        shell.height >= 48
        shell.focused == "ScanReceipt_receiptCode"
        shell.fits
    }
})
