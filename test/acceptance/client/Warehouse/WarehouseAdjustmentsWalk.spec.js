// Warehouse P6 in the live client (impl-warehouse P6 "Usable when"): an adjuster previews and posts a count of one lot
// bucket with a reason; a backdated adjustment into the demo's closed month (June 2024) is refused; the adjuster scraps the
// expired lot's morgue stock from the Lots expiry list, it posts once and the scrap's physical inventory is not a count;
// a mover unpacks 2 cases into 24 units with the lot carried, and a user with financial read sees the unit cost carried
// and netting to zero. Retries, the ledger postings and the refusals in detail are the WarehouseAdjustments specs
// (mr-mantle and mr-boss); access is WarehouseAccess.
let pages = {}
spec({
    setupSpec() {
        for (const user of ["warehouse.adjust", "warehouse.move", "john.doe"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 900}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, pattern) {
    page.waitFor(source => new RegExp(source).test(document.body.innerText), {arg: pattern.source})
}
// Accept the confirmation of the next action, as the user does (after the page has loaded).
function acceptConfirm(page) {
    page.evaluate(() => {
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
}
const adjustments = query => "/qapps/Warehouse/Inventory/Adjustments?" + query

feature("an adjuster previews and posts a count of one lot bucket with a reason", {
    expect() {
        const page = pages["warehouse.adjust"]
        // lot SEAL-2026-A on hold at receiving (0801): 10 on hand, counted 9, lost
        const query =
            "facilityId=ZIRET_WH&productId=BOSS_WH_LOTTED&locationSeqId=0801&lotId=BOSS_WH_LOT_A&mode=count&quantity=9" +
            "&varianceReasonEnumId=InVrLost&comments=Cycle+count"
        page.goto(adjustments(query)).status == 200
        waitForText(page, /Before and after/)
        page.text().includes("location 0801 · lot SEAL-2026-A: 10 on hand, change -1, after 9")
        page.text().includes("BOSS_WH_LOT_HOLD")
        !page.text().includes("Value change")
        page.settle()
        acceptConfirm(page)
        page.getByRole("button", {name: "Post adjustment"}).click()
        waitForText(page, /Adjusted: 10 to 9/)
        page.waitFor(() => !document.body.innerText.includes("Before and after"))
        page.text().includes("Your recent adjustments")
    }
})

feature("a backdated adjustment into a closed period is refused", {
    expect() {
        const page = pages["warehouse.adjust"]
        // the refusal is the expected notification of a refused transition; its status is 500 because the framework
        // answers every JSON transition response with errors as a 500 (impl-warehouse F418), until that is changed
        page.allowProblems(/PERIOD_CLOSED/)
        page.allowProblems(/500 Internal Server Error .*adjustStock/)
        const query =
            "facilityId=ZIRET_WH&productId=BOSS_WH_LOTTED&locationSeqId=01020301&lotId=BOSS_WH_LOT_A&mode=count&quantity=5" +
            "&physicalInventoryDate=2024-06-15+12%3A00&varianceReasonEnumId=InVrFound"
        page.goto(adjustments(query)).status == 200
        waitForText(page, /Before and after/)
        page.text().includes("0 on hand on 2024-06-15")
        page.settle()
        acceptConfirm(page)
        page.getByRole("button", {name: "Post adjustment"}).click()
        waitForText(page, /PERIOD_CLOSED|fiscal period of 2024-06-15 is closed/)
    }
})

feature("the adjuster scraps the expired lot's morgue stock from the Lots expiry list, once, and it is not a count", {
    expect() {
        const page = pages["warehouse.adjust"]
        page.goto("/qapps/Warehouse/Inventory/Lots?lotId=BOSS_WH_LOT_B").status == 200
        waitForText(page, /BOSS_WH_LOT_MORGUE/)
        page.locator("a[href*='_openDialog=ScrapDialog'][href*='BOSS_WH_LOT_MORGUE']").first().click()
        waitForText(page, /free to scrap/)
        page.settle()
        acceptConfirm(page)
        page.locator(".q-dialog").getByRole("button", {name: "Scrap"}).click()
        waitForText(page, /Scrapped 2 of BOSS_WH_LOT_MORGUE; physical inventory/)
        const physicalInventoryId = page.evaluate(
            () => (/Scrapped 2 of BOSS_WH_LOT_MORGUE; physical inventory (\S+)/.exec(document.body.innerText) || [])[1]
        )
        waitForText(page, /Your recent adjustments/)
        page.text().includes("Scrap")
        // the scrap's physical inventory is not a count: the lookup of it as a count finds nothing
        page.goto("/qapps/Warehouse/Home?lookupType=count&lookupId=" + physicalInventoryId).status == 200
        waitForText(page, /Nothing in your facilities matches/)
    }
})

feature("a mover unpacks 2 cases into 24 units with the lot carried, and financial read shows the unit cost netting to zero", {
    expect() {
        const finance = pages["john.doe"]
        finance.goto("/qapps/Warehouse/Transfers/Repack?assetId=BOSS_WH_CASES&quantity=2").status == 200
        waitForText(finance, /Unpack 2 Twelve-pack of lot-tracked sealant into 24 Lot-tracked sealant/)
        finance.text().includes("lot SEAL-2026-C carried over")
        finance.text().includes("$150.00 → $12.50")
        finance.text().includes("netting to zero")

        const page = pages["warehouse.move"]
        page.goto("/qapps/Warehouse/Transfers/Repack?assetId=BOSS_WH_CASES").status == 200
        waitForText(page, /Unpack into Lot-tracked sealant \(12 each\)/)
        page.locator("#RepackTarget_quantity").fill("2")
        page.getByRole("button", {name: "Preview"}).click()
        waitForText(page, /into 24 Lot-tracked sealant, lot SEAL-2026-C carried over/)
        !page.text().includes("Unit cost")
        page.settle()
        page.getByRole("button", {name: "Unpack", exact: true}).click()
        waitForText(page, /Unpacked 2 of BOSS_WH_CASES into 24 of BOSS_WH_LOTTED/)
        waitForText(page, /Your recent repacks/)
    }
})
