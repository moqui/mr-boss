// Warehouse P7's golden path in the live client (impl-warehouse P7 "Usable when"): a receiver opens the receipt of the
// demo purchase order part with New receipt, and a second New receipt for the part opens the same receipt. Receiving part
// of a line with a rejection and a lot, the short receipt's close, and Handheld Receive at 390 px are the acceptance walk
// WarehouseReceiptFinishWalk. The Mantle rules (the generated lot range, the double submit, the serial count, backorder,
// the self-billing bill) are mr-mantle's WarehouseReceiving spec; the screens' reads and refusals are BOSS's
// WarehouseReceiving and WarehouseAccess.
let page
spec({
    setupSpec() {
        page = browser.newPage({user: "warehouse.receive", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
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

feature("a receiver opens the part's receipt with New receipt, and a second New receipt opens the same one", {
    expect() {
        const first = openReceipt(page)
        page.text().includes("Lot-tracked sealant")
        page.text().includes("Serialized scanner")
        const second = openReceipt(page)
        second == first
        page.text().includes("Opened the open receipt")
    }
})
