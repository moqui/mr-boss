// Customer Service's golden path in the live client (impl-customer-service §2, P2 "usable when", the app's one regression
// walk): an agent opens NewCase, finds Joe Public (CustJqp), sees his open cases as possible duplicates, describes a distinct case in
// the Support queue and creates it, which opens it in CaseDetail; they resolve it from
// its primary action, which offers Reopen. The rules (create#Case, the workflow's moves, the
// duplicate read) are Mantle's SupportCases and BOSS's CustomerServiceCases specs; the other "usable when" items are the
// acceptance CustomerServiceCasesWalk and the other CustomerService acceptance walks. Other specs add cases for Joe, so it
// checks its own case, not the lists.
let pages = {}
spec({
    setupSpec() {
        const page = browser.newPage({user: "customerservice.agent", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
        pages[1280] = page
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the in-app confirmation (moqui.confirmAction): only its Confirm button approves the action
function confirmAction(page) {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}
const base = "/qapps/CustomerService/Cases/"
const subject = "Client walk thermostat " + Date.now()

feature("an agent creates a case for Joe Public in Support past the duplicate warning and resolves it", {
    expect() {
        const page = pages[1280]
        page.goto(base + "NewCase").status == 200
        waitForText(page, "1. Customer and type")
        page.getByLabel("Customer", {exact: true}).click()
        page.keyboard.type("Joe")
        page.getByRole("option", {name: /^Joe (Q )?Public ·/}).first().click()
        page.getByLabel("Type", {exact: true}).click()
        page.getByRole("option", {name: "Help with a product or order", exact: true}).click()
        page.getByLabel("What is it about?", {exact: true}).fill(subject)
        page.getByRole("button", {name: "Continue", exact: true}).click()
        // the duplicate warning: Joe's open cases (the demo's two, and any another spec added)
        waitForText(page, "open case(s): is this one of them?")
        waitForText(page, "2. The case")
        page.evaluate(() => document.querySelector("input[name=requestName]").value) == subject
        page.getByLabel("Description", {exact: true}).fill("The display flickers at night.")
        page.getByRole("button", {name: "Create case", exact: true}).click()
        page.waitForURL(/CaseDetail/)
        waitForText(page, subject)
        !!page.evaluate(() => new URLSearchParams(location.search).get("requestId"))
        const header = page.evaluate(() => document.querySelector(".m-record-header").innerText)
        /Joe (Q )?Public/.test(header)
        header.includes("Support")
        // the primary move: Resolve, with the workflow's default resolution (Completed)
        page.getByRole("button", {name: /Resolve/}).first().click()
        page.getByRole("dialog").getByRole("button", {name: /Resolve/}).click()
        confirmAction(page)
        page.waitFor(() => !/^New/.test(document.querySelector(".m-record-status")?.innerText || "New"))
        page.waitFor(() => Array.from(document.querySelectorAll("button")).some(button => /Reopen/.test(button.innerText)))
        !/Error rendering|Exception in render/.test(page.text())
    }
})

