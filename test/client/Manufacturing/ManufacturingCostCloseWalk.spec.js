// Manufacturing P15 in the live client (impl-manufacturing P15 "usable when"): a finance approver without the Accounting
// launcher opens a work order's Cost close tab and sees the preview's findings, with no post for a run not complete; the cost
// estimator sees the note that the close is Accounting's; the Accounting finance approver opens the queue under Inventory; the
// tab fits 390 px. The absorption, split, variance, the post that closes the run, the retry, the closed period and the
// adjustment are ProductionCostClose (mr-mantle) and AccountingProductionCostClose (BOSS).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.costclose", 1280],
            ["manufacturing.cost", 1280],
            ["finance.approve", 1280],
            ["manufacturing.costclose", 390]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user + ":" + width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
const closeUrl = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/ProductionCostClose?workEffortId=BOSS_WH_RUN"

feature("a finance approver without the Accounting launcher opens the Cost close tab and sees why it cannot post yet", {
    expect() {
        const page = pages["manufacturing.costclose:1280"]
        page.goto(closeUrl).status == 200
        waitForText(page, "Not ready to post")
        page.text().includes("Coated filters")
        page.text().includes("complete it first")
        page.getByRole("button", {name: "Post cost close", exact: true}).count() == 0
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("the cost estimator sees that the cost close is Accounting's", {
    expect() {
        const page = pages["manufacturing.cost:1280"]
        page.goto(closeUrl).status == 200
        waitForText(page, "The cost close is Accounting")
        page.getByRole("button", {name: "Post cost close", exact: true}).count() == 0
    }
})

feature("Accounting's finance approver opens the cost close queue under Inventory", {
    expect() {
        const page = pages["finance.approve:1280"]
        page.goto("/qapps/Accounting/Inventory/ProductionCostClose").status == 200
        waitForText(page, "Waiting for the cost close")
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("the Cost close tab fits 390 px", {
    expect() {
        const page = pages["manufacturing.costclose:390"]
        page.goto(closeUrl).status == 200
        waitForText(page, "Not ready to post")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
