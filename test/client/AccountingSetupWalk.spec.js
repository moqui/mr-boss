// Accounting setup (P19) of an organization made for this walk, so the walk passes again on the same database: Home
// offers it Set up accounting; a finance administrator chooses the chart template and base currency, imports the trial
// balance and the open items (one refused row named), sees readiness and activates, after which the setup shows the
// opening entry. The demo organization in setup, BOSS_ACCT_NEWCO, is left as it is.
const day = offset => {
    const date = new Date(Date.now() + offset * 86400000)
    const pad = number => String(number).padStart(2, "0")
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
}
feature("a finance administrator sets up a new organization's accounting and activates it", {
    expect() {
        // the organization, as an administrator makes one: an internal organization with no accounting yet
        const made = http.post("/rest/s1/mantle/parties/organization", {
            json: {organizationName: "Setup Walk " + Date.now(), roleTypeId: "OrgInternal"},
            basic: ["john.doe", "moqui"],
            csrf: false
        })
        made.ok
        const organizationPartyId = made.json().partyId
        const page = browser.newPage({
            user: "finance.admin",
            viewport: {width: 1280, height: 900},
            timeout: 30
        })
        page.allowProblems(/userPhoto\?userId=/)
        page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
        const shows = text =>
            page.waitFor(expected => document.querySelector(".q-page")?.innerText.includes(expected), {arg: text})
        const next = () => page.getByRole("button", {name: "Next", exact: true}).click()
        const confirmDialogs = () =>
            page.evaluate(() => {
                window.confirm = () => true
                return true
            })
        page.goto("/qapps/Accounting/Home?organizationPartyId=" + organizationPartyId).status == 200
        shows("Set up accounting")
        page.getByText("Start setup").click()
        page.waitForURL(/Settings\/Setup/)
        shows("Opening day")
        page.getByLabel("Base currency", {exact: true}).click()
        page.getByLabel("Base currency", {exact: true}).fill("United States")
        page.getByRole("option", {name: /United States Dollar/})
            .first()
            .click()
        next()
        page.waitForURL(/Setup\/OpeningBalances/)
        shows("Opening trial balance")
        confirmDialogs() == true
        page.getByRole("button", {name: "Import trial balance", exact: true}).click()
        let dialog = page.getByRole("dialog")
        dialog
            .locator("textarea[name=balancesCsvText]")
            .fill("account,debit,credit\n111100000,1000,\n121000000,250,\n331100000,,1250\n")
        dialog.getByRole("button", {name: "Replace the lines", exact: true}).click()
        shows("Balanced")
        next()
        page.waitForURL(/Setup\/OpenItems/)
        shows("Open invoices and bills")
        page.getByRole("button", {name: "Import open items", exact: true}).click()
        dialog = page.getByRole("dialog")
        dialog
            .locator("textarea[name=csvText]")
            .fill(
                "direction,partyId,documentNumber,documentDate,dueDate,openAmount\n" +
                    ["receivable", "ORG_ACME", "WALK-1001", day(-30), day(-5), "250"].join(",") +
                    "\n" +
                    ["receivable", "BOSS_ACCT_NOBODY", "WALK-1002", day(-30), day(-5), "40"].join(",") +
                    "\n"
            )
        page.evaluate(() => {
            Array.from(document.querySelectorAll(".q-dialog .q-radio"))
                .find(radio => radio.innerText.trim() == "Import them")
                .click()
            return true
        }) == true
        dialog.getByRole("button", {name: "Import open items", exact: true}).click()
        shows("Last import")
        page.text().includes("1 imported, 0 already imported, 1 refused")
        page.text().includes("WALK-1002")
        page.text().includes("Counterparty is not available")
        page.text().includes("WALK-1001")
        next()
        page.waitForURL(/Setup\/Readiness/)
        shows("Ready to activate")
        next()
        page.waitForURL(/Setup\/Activate/)
        shows("Choose Activate accounting")
        page.getByRole("button", {name: "Activate accounting", exact: true}).click()
        shows("Accounting is active")
        page.text().includes("Opening entry")
    }
})
