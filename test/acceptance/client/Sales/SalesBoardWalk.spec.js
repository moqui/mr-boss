// Sales P4's board in the live client (impl-sales P4 "usable when"; design-sales §1.3, §3 Opportunities), an acceptance walk: the
// representative drags a card on Opportunities' board to the next stage and sees it there after a reload; the same move through
// the row's Change stage in the list; and at phone width (390 px) the board offers Change stage on each card and nothing scrolls
// sideways. The rules are mr-mantle's SalesOpportunities; the golden path is the regression SalesPipelineWalk.
// Run: ./moq accept mr-boss --spec SalesBoardWalk
let pages = {}
spec({
    setupSpec() {
        for (const [key, width] of [
            ["desk", 1280],
            ["phone", 390]
        ]) {
            const page = browser.newPage({user: "sales.rep", viewport: {width, height: width < 600 ? 844 : 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[key] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the board's column holding a card, by the card's title
function columnOf(page, title) {
    return page.evaluate(title => {
        const card = Array.from(document.querySelectorAll(".m-board-card, .m-list-card")).find(node =>
            node.innerText.includes(title)
        )
        const column = card?.closest(".m-board-column, .m-list-column")
        return column ? column.querySelector(".m-board-column-title, .m-list-column-title, header")?.innerText || "" : ""
    }, title)
}
// a drop-down of the open dialog: open it, type, choose the option, and leave the field
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}

feature("a card dragged to the next stage stays there; the row's Change stage moves another the same way", {
    expect() {
        const page = pages.desk
        page.goto("/qapps/Sales/Pipeline/Opportunities?view=board").status == 200
        waitForText(page, "Wingtip maintenance plan")
        const card = page.locator(".m-board-card, .m-list-card").filter({hasText: "Wingtip maintenance plan"}).first()
        const target = page.locator(".m-board-column, .m-list-column").filter({hasText: "Discovery"}).first()
        card.dragTo(target)
        page.settle()
        page.reload()
        waitForText(page, "Wingtip maintenance plan")
        columnOf(page, "Wingtip maintenance plan").includes("Discovery")

        page.goto("/qapps/Sales/Pipeline/Opportunities?view=list").status == 200
        waitForText(page, "Wingtip stores refit")
        page.locator("tr").filter({hasText: "Wingtip stores refit"}).getByRole("button", {name: "Change stage"}).click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Stage", "Nego", /^Negotiation$/)
        dialog.getByRole("button", {name: "Change stage", exact: true}).click()
        waitForText(page, "Stage changed")
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("at phone width the board offers Change stage and nothing scrolls sideways", {
    expect() {
        const page = pages.phone
        page.goto("/qapps/Sales/Pipeline/Opportunities?view=board").status == 200
        waitForText(page, "Wingtip stores refit")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
        page.getByRole("button", {name: "Change stage"}).count() > 0
        !/Error rendering|Exception in render/.test(page.text())
    }
})
