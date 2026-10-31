// Base-currency posting (P20), its rates: a finance administrator fetches the day's rates on Currencies from the European
// Central Bank's file pasted in (the walk never reaches the network), sees the proposed euro rate, accepts it, and finds
// it among the active exchange rates. The rate's day changes with each run, so the walk passes again on the same database.
const day = offset => {
    const date = new Date(Date.now() + offset * 86400000)
    const pad = number => String(number).padStart(2, "0")
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
}
feature("a finance administrator proposes the day's rates from the provider's file and accepts one", {
    expect() {
        const rateDay = day(-(30 + (Math.floor(Date.now() / 60000) % 600)))
        const file =
            "<gesmes:Envelope><Cube><Cube time='" +
            rateDay +
            "'><Cube currency='USD' rate='1.0800'/><Cube currency='GBP' rate='0.8400'/></Cube></Cube></gesmes:Envelope>"
        const page = browser.newPage({
            user: "finance.admin",
            viewport: {width: 1280, height: 900},
            timeout: 30
        })
        page.allowProblems(/userPhoto\?userId=/)
        page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
        const shows = text =>
            page.waitFor(expected => document.querySelector(".q-page")?.innerText.includes(expected), {arg: text})
        page.goto("/qapps/Accounting/Settings/Currencies?organizationPartyId=BOSS_ACCT_ORG").status == 200
        page.getByRole("button", {name: "Fetch rates", exact: true}).click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Currencies", {exact: true}).click()
        dialog.getByLabel("Currencies", {exact: true}).fill("Euro")
        page.getByRole("option", {name: /Euro/}).first().click()
        page.getByText("Fetch the day's rates from the provider", {exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-menu"))
        dialog.locator("textarea[name=sourceText]").fill(file)
        dialog.getByRole("button", {name: "Propose rates", exact: true}).click()
        shows("Proposed rates: 1 to accept or reject")
        page.text().includes("ECB reference rate " + rateDay)
        page.text().includes("1.08")
        // check the proposal's row, then open the row actions menu in the list head and accept it with a reason
        page.evaluate(source => {
            Array.from(document.querySelectorAll(".tr"))
                .find(row => row.innerText.includes(source) && row.querySelector("[role=checkbox]"))
                .querySelector("[role=checkbox]")
                .click()
            return true
        }, "ECB reference rate " + rateDay) == true
        page.waitFor(() => !!document.querySelector(".tr [role=checkbox][aria-checked=true]"))
        page.evaluate(() => {
            Array.from(document.querySelectorAll(".q-page button"))
                .find(button => button.innerText.includes("more_vert"))
                .click()
            return true
        }) == true
        page.locator(".q-menu").getByRole("button", {name: "Accept selected", exact: true}).click()
        const accept = page.getByRole("dialog")
        accept.locator("input[name=changeReason]").fill("Walk accepts the reference rate")
        accept.getByRole("button", {name: "Accept selected rates", exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-page")?.innerText.includes("Proposed rates:"))
        shows("ECB reference rate " + rateDay)
    }
})
