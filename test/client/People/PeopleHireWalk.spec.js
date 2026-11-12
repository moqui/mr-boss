// People's golden path in the live client (impl-people P6, the app's one regression walk): Retail's HR officer looks for a person in
// the directory and does not find them, hires them through the hire wizard (Identity, Employment terms, Confirm) into Store
// Operations under Hannah Okafor, lands on their Employee360 with the department, and asks for their transfer to Merchandising
// through the employment change wizard (Change, Impact and confirm), which waits for Hannah's approval. The rules are Mantle's
// PeopleEmployment and BOSS's PeopleHire and PeopleAccess; the "usable when" is the acceptance PeopleHireUsable. Each run hires a
// person of its own name.
let page
const lastName = "Walker" + String(Date.now()).slice(-6)
spec({
    setupSpec() {
        page = browser.newPage({user: "people.hr", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// a drop-down: cleared when it holds a value (the terms now), opened, typed into; once the search has answered, the first match is
// highlighted (a choice made earlier would be undone by the search reopening the menu), and Enter takes it
function choose(label, typed) {
    page.evaluate(label => {
        const field = Array.from(document.querySelectorAll(".q-page .q-field")).find(
            item => item.querySelector(".q-field__label")?.innerText.trim() === label
        )
        const clear = field?.querySelector(".q-field__focusable-action")
        if (clear) clear.click()
        return true
    }, label)
    page.getByLabel(label, {exact: true}).click()
    page.keyboard.type(typed)
    page.waitFor(
        typed =>
            Array.from(document.querySelectorAll(".q-menu [role=option]")).some(
                item =>
                    item.classList.contains("q-manual-focusable--focused") &&
                    item.innerText.toLowerCase().includes(typed.toLowerCase())
            ),
        {arg: typed}
    )
    page.keyboard.press("Enter")
    page.waitFor(() => !document.querySelector(".q-menu"))
}
// a header menu's item: open the menu (its button in the record's actions), then click the item's own link, not the row around it
function menuItem(menu, label) {
    page.evaluate(menu => {
        Array.from(document.querySelectorAll(".m-record-actions button"))
            .find(button => button.innerText.includes(menu))
            .click()
        return true
    }, menu)
    page.waitFor(
        label =>
            Array.from(document.querySelectorAll(".q-menu a, .q-menu button")).some(item =>
                item.innerText.trim().endsWith(label)
            ),
        {arg: label}
    )
    return page.evaluate(label => {
        Array.from(document.querySelectorAll(".q-menu a, .q-menu button"))
            .find(item => item.innerText.trim().endsWith(label))
            .click()
        return true
    }, label)
}
// the wizard's Next, or its last step's button
function next(label = null) {
    if (label) page.locator(".m-wizard-next").getByText(label, {exact: true}).click()
    else page.locator(".m-wizard-next").click()
}

feature("an HR officer finds no one, hires the person, opens their record and asks for their transfer", {
    expect() {
        // the directory: not employed yet
        page.goto("/qapps/People/Employees").status == 200
        waitForText("The people of the employers you read")
        page.getByLabel("Name", {exact: true}).fill(lastName)
        page.getByRole("button", {name: "Find", exact: true}).click()
        waitForText("No one matches.")
        // the hire wizard: a new person, then the terms, then the review
        page.getByRole("link", {name: "Hire employee", exact: true}).click()
        page.waitForURL(/\/People\/Employees\/HireEmployee/)
        waitForText("Who is hired")
        choose("Employer", "Retail")
        page.getByLabel("First name", {exact: true}).fill("Wren")
        page.getByLabel("Last name", {exact: true}).fill(lastName)
        page.getByLabel("Work email", {exact: true}).fill(lastName.toLowerCase() + "@ziziwork.example")
        next()
        waitForText("Pay is set by payroll")
        choose("Department", "Store")
        choose("Manager", "Hannah")
        next()
        waitForText("Hire Wren " + lastName)
        waitForText("A new employment")
        next("Hire")
        // the person's record
        page.waitForURL(/\/People\/Employees\/Employee360\?/)
        waitForText("Employment history")
        page.evaluate(() => document.querySelector(".m-record-header").innerText).includes("Wren " + lastName)
        waitForText("Store Operations")
        // the transfer: to Merchandising, from tomorrow, waiting for the manager
        menuItem("Change employment", "Transfer") == true
        page.waitForURL(/\/People\/Employees\/EmploymentChange/)
        waitForText("Now: Store Operations")
        choose("Department", "Merch")
        page.getByLabel("Why", {exact: true}).fill("Walk: moves to merchandising")
        next()
        waitForText("Moves from Store Operations to Merchandising")
        waitForText("Hannah Okafor")
        next("Ask for approval")
        page.waitForURL(/\/People\/Employees\/Employee360\?/)
        waitForText("Waiting for approval")
        waitForText("Waiting for Hannah Okafor")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
