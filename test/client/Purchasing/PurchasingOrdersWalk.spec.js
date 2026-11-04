// Purchasing's golden path in the live client (impl-purchasing P3 "usable when", the app's one regression walk): a buyer
// starts a purchase order to Ziddleman with New purchase order, adds a line of DEMO_1_1 at its supplier price and places
// it; a purchase approver approves it from its primary action; the buyer sends it, which mails it to the supplier's order
// address (the mail capture keeps it) and marks it Sent. The rules (the gate, self-approval, the hold, the send once per
// revision, the print as of a time) are mr-mantle's PurchaseOrders spec; the other "usable when" items are the acceptance
// PurchasingOrdersWalk.
let pages = {}
spec({
    setupSpec() {
        for (const user of ["purchasing.buyer", "purchasing.approve"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
function acceptConfirmations(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    })
}
// a drop-down of the open dialog: open it, type, choose the option
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
}
let orderId = null

feature("a buyer creates and places a purchase order, an approver approves it, and the buyer sends it", {
    expect() {
        const buyer = pages["purchasing.buyer"]
        buyer.goto("/qapps/Purchasing/Orders/PurchaseOrders").status == 200
        waitForText(buyer, "Purchase orders")
        buyer.getByRole("button", {name: "New purchase order", exact: true}).first().click()
        let dialog = buyer.getByRole("dialog")
        choose(buyer, dialog, "Supplier", "Ziddleman", /Ziddleman/)
        dialog.getByLabel("Reference", {exact: true}).fill("Client walk order")
        dialog.getByRole("button", {name: "Create draft", exact: true}).click()
        buyer.waitForURL(/OrderDetail/)
        waitForText(buyer, "Client walk order")
        orderId = buyer.evaluate(() => new URLSearchParams(location.search).get("orderId"))
        !!orderId
        buyer.getByRole("button", {name: "Add line", exact: true}).first().click()
        dialog = buyer.getByRole("dialog")
        choose(buyer, dialog, "Product", "DEMO_1_1", /DEMO_1_1 ·/)
        // the server-search menu stays open after the choice; leave the field
        buyer.keyboard.press("Tab")
        dialog.getByLabel("Quantity", {exact: true}).fill("2")
        dialog.getByRole("button", {name: "Add line", exact: true}).click()
        waitForText(buyer, "Lines · 1")
        acceptConfirmations(buyer)
        buyer.getByRole("button", {name: "Place", exact: true}).first().click()
        waitForText(buyer, "Placed 20")

        const approver = pages["purchasing.approve"]
        approver.goto("/qapps/Purchasing/Orders/OrderDetail?orderId=" + orderId).status == 200
        waitForText(approver, "Client walk order")
        approver.getByRole("button", {name: "Approve", exact: true}).first().click()
        approver
            .getByRole("dialog")
            .getByRole("button", {name: /Approve revision/})
            .click()
        waitForText(approver, "Approvals · 1")

        buyer.goto("/qapps/Purchasing/Orders/OrderDetail?orderId=" + orderId).status == 200
        waitForText(buyer, "Client walk order")
        buyer.getByRole("button", {name: "Send", exact: true}).first().click()
        buyer
            .getByRole("dialog")
            .getByRole("button", {name: /Send revision/})
            .click()
        waitForText(buyer, "Sent revision")
        buyer.text().includes("orders@ziddleman.example.com")
        !/Error rendering|Exception in render/.test(buyer.text())
    }
})
