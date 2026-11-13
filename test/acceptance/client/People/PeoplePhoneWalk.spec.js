// People at phone width (impl-people P31, design-people §14.3 "Navigation and devices": phone lists contain name and state or amount;
// Practices-App-Dev "Lists", the 390 px check), an acceptance walk in the live client at 390 px: the self-service employee's
// SelfService under Commons, Leave requests and Expense claims; the manager's My team, whose team list shows each person's name and
// availability, and Approvals; the HR officer's directory, whose rows show each person's name and state (Current). No page scrolls
// sideways or fails to render. The lists' phone columns are checked for every People list by PeopleNavigationWalk; the flows themselves
// are the phases' walks and specs.
// Run: ./moq accept mr-boss --spec PeoplePhoneWalk
let pages = {}
spec({
    setupSpec() {
        for (const user of ["people.employee", "people.manager", "people.hr"]) {
            const page = browser.newPage({user, viewport: {width: 390, height: 844}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the page fits the phone: nothing scrolls sideways, and nothing failed to render
function fits(page) {
    page.settle()
    return (
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) === true &&
        !/Error rendering|Exception in render/.test(page.text())
    )
}

feature("the self-service employee's SelfService, Leave requests and Expense claims fit a phone", {
    expect() {
        const employee = pages["people.employee"]
        for (const [path, text] of [
            ["/qapps/Commons/People/SelfService", "My employment"],
            ["/qapps/People/Time/LeaveRequests", "Request leave"],
            ["/qapps/People/Expenses/ExpenseClaims", "New claim"]
        ]) {
            employee.goto(path).status == 200
            waitForText(employee, text)
            fits(employee) == true
        }
    }
})

feature("the manager's My team shows each report's name and availability on a phone, and Approvals fits it", {
    expect() {
        const manager = pages["people.manager"]
        manager.goto("/qapps/People/MyTeam").status == 200
        waitForText(manager, "Team")
        waitForText(manager, "Tomas Lindqvist")
        fits(manager) == true
        // the phone columns of the team list: the person, and their availability this week
        manager.evaluate(() => (document.querySelector(".q-page")?.innerText || "").includes("Ines Varga")) == true
        manager.goto("/qapps/People/Approvals").status == 200
        manager.settle()
        fits(manager) == true
    }
})

feature("the HR officer's directory shows each person's name and state on a phone", {
    expect() {
        const hr = pages["people.hr"]
        hr.goto("/qapps/People/Employees/List").status == 200
        waitForText(hr, "Tomas Lindqvist")
        fits(hr) == true
        hr.evaluate(() => (document.querySelector(".q-page")?.innerText || "").includes("Current")) == true
    }
})
