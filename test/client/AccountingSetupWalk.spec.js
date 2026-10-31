// Accounting setup (P19): Home offers the demo organization not yet active (BOSS_ACCT_NEWCO, BossZSetupDemoData.xml) its
// setup first; a finance administrator goes through the wizard: the basis, the opening trial balance that ties to the open
// invoice, an import whose refused row is named, readiness, and activation, after which the setup shows the opening entry.
feature("a finance administrator finishes an organization's setup and activates its accounting", {
    expect() {
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
        page.goto("/qapps/Accounting/Home?organizationPartyId=BOSS_ACCT_NEWCO").status == 200
        shows("Finish setting up accounting")
        page.getByText("Continue setup").click()
        page.waitForURL(/Settings\/Setup/)
        shows("Opening day")
        // the basis as it is saved: the wizard's Next saves it and goes on
        next()
        page.waitForURL(/Setup\/OpeningBalances/)
        shows("Opening trial balance")
        page.text().includes("Balanced")
        page.text().includes("Ties")
        next()
        page.waitForURL(/Setup\/OpenItems/)
        shows("STARTUP-1001")
        page.getByRole("button", {name: "Import open items", exact: true}).click()
        const dialog = page.getByRole("dialog")
        dialog
            .locator("textarea[name=csvText]")
            .fill(
                "direction,partyId,documentNumber,documentDate,dueDate,openAmount\n" +
                    "receivable,BOSS_ACCT_NOBODY,STARTUP-1002,2026-01-15,2026-02-14,40\n"
            )
        page.evaluate(() => {
            Array.from(document.querySelectorAll(".q-dialog .q-radio"))
                .find(radio => radio.innerText.trim() == "Import them")
                .click()
            return true
        }) == true
        dialog.getByRole("button", {name: "Import open items", exact: true}).click()
        shows("Last import")
        page.text().includes("0 imported, 0 already imported, 1 refused")
        page.text().includes("STARTUP-1002")
        page.text().includes("Counterparty is not available")
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
