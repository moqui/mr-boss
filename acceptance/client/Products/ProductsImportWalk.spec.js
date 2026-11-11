feature("an editor uploads a real CSV part and receives the durable import location", {
    expect() {
        const s = session({user: "catalog.edit"})
        const opened = s.get("/apps/Products/ProductImport", {follow: true})
        opened.status == 200
        const uploaded = s.post("/apps/Products/ProductImport/Index/stage", {
            accept: "html",
            multipart: {
                organizationPartyId: "ORG_ZIZI_SERVICES",
                kindId: "products",
                delimiter: ",",
                updateMode: "upsert",
                importFile: {
                    fileName: "browser-upload.csv",
                    contentType: "text/csv",
                    text: "productId,productName\nBOSS_BROWSER_UPLOAD,Uploaded browser product\n"
                }
            }
        })
        uploaded.status >= 300 && uploaded.status < 400
        uploaded.location.includes("operationKey=")
        const sample = s.get("/apps/Products/ProductImport/Index/sample", {
            params: {kindId: "products", organizationPartyId: "ORG_ZIZI_SERVICES"}
        })
        sample.status == 200
        sample.contentType.includes("text/csv")
        sample.text.includes("productName")
    }
})
feature("an editor maps a file, reviews valid and invalid rows, applies and resumes without a duplicate write", {
    expect() {
        const p = browser.newPage({user: "catalog.edit", viewport: {width: 1280, height: 1100}, timeout: 30})
        p.allowProblems(/userPhoto\?userId=/)
        p.goto("/qapps/Products/ProductImport").status == 200
        p.waitFor(() => !!document.querySelector("#ImportUpload"))
        p.fill(
            "#ImportUpload textarea[name=sourceText]",
            "Code,Name\nBOSS_BROWSER_IMPORT,Imported browser product\nBOSS_BROWSER_INVALID,\n"
        )
        p.locator("#ImportUpload").getByRole("button", {name: "Stage import", exact: true}).click()
        p.waitFor(
            () =>
                Array.from(document.querySelectorAll("button")).filter(e => e.innerText.includes("Save column mapping"))
                    .length === 2
        )
        const key = p.evaluate(() => new URL(window.location.href).searchParams.get("operationKey"))
        !!key
        p.getByLabel("Catalog field", {exact: true}).first().click()
        p.getByRole("option", {name: "Product ID", exact: true}).click()
        p.getByRole("button", {name: "Save column mapping", exact: true}).first().click()
        p.waitFor(
            () =>
                Array.from(document.querySelectorAll("button")).filter(e => e.innerText.includes("Save column mapping"))
                    .length === 2
        )
        p.getByLabel("Catalog field", {exact: true}).nth(1).click()
        p.getByRole("option", {name: "Product name", exact: true}).click()
        p.getByRole("button", {name: "Save column mapping", exact: true}).nth(1).click()
        p.waitFor(() => !!document.querySelector("#ImportPreview"))
        p.locator("#ImportPreview").getByRole("button", {name: "Validate mapped rows", exact: true}).click()
        p.waitFor(() => document.querySelector(".q-page")?.innerText.includes("1 ready"))
        p.text().includes("Product name is required")
        p.evaluate(() => {
            // the confirmation is the in-app dialog (moqui.confirmAction): Confirm it each time it opens, until the page reloads
            if (!window.walkConfirmations) {
                window.walkConfirmations = new MutationObserver(() => {
                    for (const button of document.querySelectorAll(".q-dialog-plugin button")) {
                        if (button.innerText.trim() !== "Confirm" || button.dataset.walkConfirmed) continue
                        button.dataset.walkConfirmed = "Y"
                        button.click()
                    }
                })
                window.walkConfirmations.observe(document.body, {childList: true, subtree: true})
            }
            return true
        }) == true
        p.locator("#ImportApply").getByRole("button", {name: "Apply reviewed valid rows", exact: true}).click()
        p.waitFor(() => document.querySelector(".q-page")?.innerText.includes("1 applied"))
        p.goto("/qapps/Products/ProductImport?operationKey=" + key).status == 200
        p.text().includes("1 applied")
        p.locator("#ImportApply").count() == 0
        const download = p.getByRole("link", {name: "Error CSV", exact: false}).attribute("href")
        download.includes("/apps/Products/ProductImport/Index/results")
        const s = session({user: "catalog.edit"}),
            report = s.get(download)
        report.status == 200
        report.contentType.includes("text/csv")
        report.text.includes("BOSS_BROWSER_INVALID")
        !report.text.includes("BOSS_BROWSER_IMPORT")
    }
})
