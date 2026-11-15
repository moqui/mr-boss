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
        const card = Array.from(document.querySelectorAll(".m-board-card")).find(node => node.innerText.includes(title))
        const column = card?.closest(".m-board-col")
        return column ? column.querySelector(".m-board-col-label")?.innerText || "" : ""
    }, title)
}
// a card dragged by the pointer onto a column, as a mouse drags it (the board's SortableJS reads pointer events; the harness has no
// drag of its own): pressed on the card, moved in steps to the column's cards and released there
function dragCard(page, title, column) {
    return page.evaluate(
        async ({title, column}) => {
            const card = Array.from(document.querySelectorAll(".m-board-card")).find(node => node.innerText.includes(title))
            const target = Array.from(document.querySelectorAll(".m-board-col"))
                .find(node => (node.querySelector(".m-board-col-label")?.innerText || "").includes(column))
                ?.querySelector(".m-board-cards")
            if (!card || !target) return false
            const from = card.getBoundingClientRect()
            const to = target.getBoundingClientRect()
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
            const fire = (node, type, x, y) => {
                const init = {
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                    button: 0,
                    buttons: type.endsWith("up") ? 0 : 1
                }
                node.dispatchEvent(
                    new PointerEvent(type, Object.assign({pointerId: 1, pointerType: "mouse", isPrimary: true}, init))
                )
                node.dispatchEvent(new MouseEvent(type.replace("pointer", "mouse"), init))
            }
            const x0 = from.left + from.width / 2,
                y0 = from.top + from.height / 2
            const x1 = to.left + to.width / 2,
                y1 = to.top + Math.min(to.height / 2, 30)
            fire(card, "pointerdown", x0, y0)
            await wait(60)
            for (let step = 1; step <= 12; step++) {
                const x = x0 + ((x1 - x0) * step) / 12,
                    y = y0 + ((y1 - y0) * step) / 12
                fire(document.elementFromPoint(x, y) || document.body, "pointermove", x, y)
                await wait(60)
            }
            fire(document.elementFromPoint(x1, y1) || document.body, "pointerup", x1, y1)
            await wait(100)
            return true
        },
        {title, column}
    )
}
// the index among the list's rows (the form-list's .tr elements) of the row naming text
function rowIndex(page, text) {
    return page.evaluate(
        text => Array.from(document.querySelectorAll(".tr")).findIndex(row => row.innerText.includes(text)),
        text
    )
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
        page.settle()
        dragCard(page, "Wingtip maintenance plan", "Discovery") == true
        page.settle()
        // opened again (the harness has no reload)
        page.goto("/qapps/Sales/Pipeline/Opportunities?view=board").status == 200
        waitForText(page, "Wingtip maintenance plan")
        columnOf(page, "Wingtip maintenance plan").includes("Discovery")

        page.goto("/qapps/Sales/Pipeline/Opportunities?view=list").status == 200
        waitForText(page, "Wingtip stores refit")
        page.locator(".tr").nth(rowIndex(page, "Wingtip stores refit")).getByRole("button", {name: "Change stage"}).click()
        const dialog = page.getByRole("dialog")
        choose(page, dialog, "Stage", "Nego", /^Negotiation$/)
        dialog.getByRole("button", {name: "Change stage", exact: true}).click()
        // the message is a notification, outside the page's content
        page.waitFor(() => document.body.innerText.includes("Stage changed"))
        page.goto("/qapps/Sales/Pipeline/Opportunities?view=board").status == 200
        waitForText(page, "Wingtip stores refit")
        columnOf(page, "Wingtip stores refit").includes("Negotiation")
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
