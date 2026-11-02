// One pass through the live client for fixed assets (design §16.3 batch, the asset depreciation part): GL posting opens
// the demo's delivery van, capitalizes it from its class's defaults, calculates this month's depreciation (the forklift
// and the van, with the label printer that has no cost failing) and posts it, and the van's book shows the month. The
// adjustment, disposal, reversal and closed-period refusals are tested in mr-mantle's AccountingFixedAssets.
const org = "organizationPartyId=BOSS_ACCT_ORG"
function userPage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
    return page
}
function acceptConfirmations(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    })
}

feature("the van is capitalized from its class and this month's depreciation posts with the printer failing", {
    expect() {
        const gl = userPage("finance.gl")
        gl.goto("/qapps/Accounting/FixedAssets/FixedAssets?" + org).status == 200
        gl.text().includes("Delivery van") && gl.text().includes("Not capitalized")
        gl.getByRole("link", {name: "Delivery van", exact: true}).first().click()
        gl.waitForURL(/EquipmentDetail/)
        gl.getByRole("button", {name: "Capitalize", exact: true}).first().click()
        let dialog = gl.getByRole("dialog")
        // the Trucks class fills the useful life and residual
        gl.evaluate(() => document.querySelector(".q-dialog input[name=usefulLifeYears]")?.value) == "5"
        acceptConfirmations(gl)
        dialog.getByRole("button", {name: "Capitalize", exact: true}).click()
        gl.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("In service"))
        gl.text().includes("Capitalized")
        // this month's depreciation: calculate, review, post
        gl.goto("/qapps/Accounting/FixedAssets/DepreciationRunDetail?" + org).status == 200
        gl.getByRole("button", {name: "Calculate", exact: true}).click()
        gl.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Preview"))
        gl.text().includes("Label printer") && gl.text().includes("has no Acquire Cost")
        gl.text().includes("Delivery van") && gl.text().includes("Warehouse forklift")
        acceptConfirmations(gl)
        gl.getByRole("button", {name: "Post depreciation", exact: true}).first().click()
        dialog = gl.getByRole("dialog")
        dialog.getByRole("button", {name: "Post depreciation", exact: true}).click()
        // the run is posted with the printer's result failed, with its reason
        gl.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Posted with failures"))
        gl.text().includes("1 failed") && gl.text().includes("has no Acquire Cost")
        // the van's book shows the month
        gl.goto("/qapps/Accounting/FixedAssets/EquipmentDetail?" + org + "&assetId=BOSS_ACCT_FA_VAN").status == 200
        gl.text().includes("Depreciated through")
        !gl.text().includes("No depreciation is posted for this asset.")
    }
})
