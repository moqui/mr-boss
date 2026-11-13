// Sales' golden path in the live client (impl-sales P4, the app's one regression walk): a representative captures a lead with New
// lead, qualifies it on Wingtip Traders from its record (the same record becomes an opportunity), moves it a stage with Change stage
// and closes it won. The rules (the scope, the revisions, qualification's operation key, Lost's reason, the batch) are mr-mantle's
// SalesOpportunities and SalesLeadQualify and mr-boss's SalesOpportunities; the "usable when" scenarios are the acceptance
// SalesPipelineScenarios and SalesBoardWalk.
let page = null
const name = "Walk: shelving enquiry " + String(Date.now()).slice(-6)
spec({
    setupSpec() {
        page = browser.newPage({user: "sales.rep", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the deal's outcome, in the record header
function waitForStatus(text) {
    page.waitFor(text => (document.querySelector(".m-record-status")?.innerText || "").trim() === text, {arg: text})
}
// the in-app confirmation (moqui.confirmAction): only its Confirm button approves the action
function confirmAction() {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}
// the header's More menu: open it and click the item's own button, not the menu row around it
function headerAction(label) {
    page.evaluate(() => {
        Array.from(document.querySelectorAll(".m-record-actions button"))
            .find(button => button.innerText.includes("More"))
            .click()
        return true
    }) == true
    page.waitFor(label => Array.from(document.querySelectorAll(".q-menu button")).some(b => b.innerText.trim().endsWith(label)), {
        arg: label
    })
    page.evaluate(label => {
        Array.from(document.querySelectorAll(".q-menu button"))
            .find(b => b.innerText.trim().endsWith(label))
            .click()
        return true
    }, label) == true
}
// a drop-down of the open dialog: open it, type, choose the option, and leave the field
function choose(scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}

feature("a rep captures a lead, qualifies it on an account, moves it a stage and closes it won", {
    expect() {
        page.goto("/qapps/Sales/Pipeline/Leads").status == 200
        waitForText("Leads")
        page.getByRole("button", {name: "New lead", exact: true}).click()
        const lead = page.getByRole("dialog")
        lead.getByLabel("Interest", {exact: true}).fill(name)
        // the rep's one organization is chosen already (Retail, though the scope also holds its Returns Center)
        page.waitFor(() => (document.querySelector(".q-dialog")?.innerText || "").includes("Ziziwork Retail"))
        lead.getByRole("button", {name: "Create lead", exact: true}).click()
        page.waitForURL(/OpportunityDetail/)
        waitForText(name)
        waitForText("No account yet")
        waitForStatus("Open")

        page.getByRole("button", {name: "Qualify", exact: true}).first().click()
        const qualify = page.getByRole("dialog")
        choose(qualify, "Existing account", "Wingtip T", /^Wingtip Traders/)
        qualify.getByRole("button", {name: "Qualify", exact: true}).click()
        confirmAction()
        waitForText("Account: Wingtip Traders")
        waitForText("Opportunity · Wingtip Traders")

        headerAction("Change stage")
        const stage = page.getByRole("dialog")
        choose(stage, "Stage", "Disc", /^Discovery$/)
        stage.getByRole("button", {name: "Change stage", exact: true}).click()
        waitForText("Stage: Discovery")

        page.getByRole("button", {name: "Close", exact: true}).first().click()
        const close = page.getByRole("dialog")
        close.getByRole("radio", {name: "Won"}).click()
        close.getByRole("button", {name: "Close", exact: true}).click()
        confirmAction()
        waitForStatus("Won")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
