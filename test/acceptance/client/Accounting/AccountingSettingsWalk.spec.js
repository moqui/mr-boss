feature("a finance administrator saves due terms and document preferences; the system administrator imports dated rates", {
    expect() {
        const page = browser.newPage({
            user: "finance.admin",
            viewport: {width: 1280, height: 900},
            timeout: 30
        })
        page.allowProblems(/userPhoto\?userId=/)
        page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
        const go = (path, query = "") =>
            page.goto("/qapps/Accounting/Settings/" + path + "?organizationPartyId=BOSS_ACCT_ORG" + query)
        page.goto("/qapps/Accounting/GeneralLedger/ChartOfAccounts?organizationPartyId=BOSS_ACCT_ORG").status == 200
        page.getByRole("button", {
            name: "Assign existing account",
            exact: true
        }).click()
        let assignment = page.getByRole("dialog")
        assignment.getByLabel("Existing chart account", {exact: true}).click()
        assignment.getByLabel("Existing chart account", {exact: true}).fill("909900001")
        page.getByRole("option", {name: /909900001/})
            .first()
            .click()
        assignment.locator("input[name=changeReason]").fill("Browser purchase account assignment")
        assignment.getByRole("button", {name: "Assign account", exact: true}).click()
        page.waitForURL(/AccountDetail/)
        // the mapping form shows the fields of the kind the page lists
        go("PostingDefaults", "&mappingKind=item").status == 200
        page.getByRole("button", {
            name: "Add mapping",
            exact: true
        }).click()
        let mapping = page.getByRole("dialog")
        mapping.getByLabel("Item type", {exact: true}).click()
        mapping.getByLabel("Item type", {exact: true}).fill("Accounting service")
        page.getByRole("option", {
            name: "Accounting service item",
            exact: true
        }).click()
        // close the item type's menu, as a user clicking elsewhere does, then choose a Quasar radio by its label
        page.getByText("Add a mapping: Invoice item types", {exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-menu"))
        page.evaluate(() => {
            Array.from(document.querySelectorAll(".q-dialog .q-radio"))
                .find(radio => radio.innerText.trim() == "Incoming")
                .click()
            return true
        }) == true
        mapping.getByLabel("Posting account", {exact: true}).click()
        mapping.getByLabel("Posting account", {exact: true}).fill("909900001")
        page.getByRole("option", {name: /909900001/})
            .first()
            .click()
        mapping.locator("input[name=changeReason]").fill("Browser missing item mapping repair")
        mapping.getByRole("button", {name: "Save mapping", exact: true}).click()
        page.waitFor(() => !document.querySelector("[role=dialog]"))
        go("PaymentTerms").status == 200
        page.getByRole("button", {
            name: "New payment term",
            exact: true
        }).click()
        let dialog = page.getByRole("dialog")
        dialog.locator("input[name=description]").fill("Browser net 37")
        dialog.locator("input[name=termValue]").fill("37")
        dialog.getByLabel("Time unit", {exact: true}).click()
        page.getByRole("option", {name: /Day/}).first().click()
        dialog.locator("input[name=changeReason]").fill("Browser finance settings review")
        dialog.getByRole("button", {name: "Save payment term", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Browser net 37"))
        // exchange rates are every organization's: a finance administrator of some organizations sees Import rates disabled with
        // its reason, and the system administrator (ACCOUNTING_ALL_ORGANIZATIONS) imports them (ACC-UI-039, SEC-BOS-02)
        go("Currencies").status == 200
        page.getByRole("button", {name: "Import rates", exact: true}).count() == 1
        !page.getByRole("button", {name: "Import rates", exact: true}).isEnabled()
        const admin = browser.newPage({user: "john.doe", viewport: {width: 1280, height: 900}, timeout: 30})
        admin.allowProblems(/userPhoto\?userId=/)
        admin.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
        admin.goto("/qapps/Accounting/Settings/Currencies?organizationPartyId=BOSS_ACCT_ORG").status == 200
        admin.getByRole("button", {
            name: "Import rates",
            exact: true
        }).click()
        dialog = admin.getByRole("dialog")
        dialog
            .locator("textarea[name=csvText]")
            .fill(
                "uomId,toUomId,fromDate,conversionFactor,rateSource\nUSD,EUR,2026-10-29T00:00:00Z,0.92,Browser review\nUSD,EUR,2026-10-30T00:00:00Z,-1,Malformed review\n"
            )
        dialog.locator("input[name=changeReason]").fill("Browser rate import review")
        dialog.getByRole("button", {name: "Import rate rows", exact: true}).click()
        admin.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Browser review"))
        admin.text().includes("1 stored, 1 refused")
        assert.ok(/\d{4}-\d{2}-\d{2}/.test(admin.text()))
        go("DocumentSettings").status == 200
        page.fill("input[name=invoiceIdPrefix]", "BROWSER-")
        page.fill("input[name=changeReason]", "Browser numbering preferences")
        page.getByRole("button", {
            name: "Save document settings",
            exact: true
        }).click()
        page.waitFor(() => document.querySelector("input[name=invoiceIdPrefix]")?.value === "BROWSER-")
    }
})
