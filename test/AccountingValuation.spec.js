// Valuation and landed costs on the demo (BOSS_ACCT_ORG): the carrier's freight bill (BOSS_ACCT_BILL_FREIGHT) allocated by
// weight to the two supply receipts raises their stock's cost, once; the inventory valuation, Product360's Accounting
// context and the stock transactions report show it to the reader; the close checklist carries the valuation rows. The
// allocation, valuation and repair rules themselves are tested in mr-mantle's AccountingValuation.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const BOOK = "mantle.ledger.AssetBookServices."
const bill = {invoiceId: "BOSS_ACCT_BILL_FREIGHT", organizationPartyId: "BOSS_ACCT_ORG"}
function receiptIds() {
    return ["BOSS_ACCT_PO_RECEIVED", "BOSS_ACCT_PO_MATCH"].map(
        orderId =>
            ec.entity.find("mantle.product.receipt.AssetReceipt").condition("orderId", orderId).disableAuthz().one()
                .assetReceiptId
    )
}

feature("the freight bill's line is allocated by weight to the two receipts once, and the screens show it", {
    when() {
        const sources = helper().asUser("finance.gl", () => helper().call(BOOK + "get#LandedCostSources", bill))
        const p = Object.assign(
            {
                invoiceItemSeqId: sources.chargeRows[0].invoiceItemSeqId,
                basisEnumId: "LcbWeight",
                assetReceiptIds: receiptIds().join(",")
            },
            bill
        )
        const preview = helper().asUser("finance.gl", () => helper().call(BOOK + "preview#LandedCost", p))
        const post = Object.assign({}, p, {
            inputFingerprint: preview.inputFingerprint,
            operationKey: "BOSS-P13-LANDED",
            changeReason: "Freight in on the supply receipts"
        })
        const posted = helper().asUser("finance.gl", () => helper().call(BOOK + "post#LandedCost", post))
        const twice = helper().asUser("finance.gl", () =>
            helper().refusal(BOOK + "post#LandedCost", Object.assign({}, post, {operationKey: "BOSS-P13-LANDED-2"}))
        )
        const page = helper().asUser("finance.gl", () => helper().page("Payables/LandedCosts", bill, "html"), false)
        return {sources, preview, posted, twice, page}
    },
    then({sources, preview, posted, twice, page}) {
        sources.chargeRows[0].eligible == true
        preview.complete == true && preview.allocationRows.length == 2
        preview.totalAmount == 28
        posted.acctgTransId != null
        twice.includes("ALREADY_ALLOCATED")
        page.errors.length == 0
        page.output.includes("Allocated") && page.output.includes(posted.acctgTransId)
        page.output.includes("no charge line left to allocate")
    }
})

feature("the reader sees the valuation, the product's accounting context and the stock transactions; AR does not", {
    when() {
        const reader = path => helper().asUser("finance.read", () => helper().page(path[0], path[1] || {}, "html"), false)
        return {
            valuation: reader(["Inventory/InventoryValuation"]),
            product: reader(["Records/Product360", {productId: "BOSS_ACCT_SUPPLY"}]),
            stock: reader(["Reports/StockTransactions", {timePeriodId: "BOSS_ACCT_CLOSE_PERIOD"}]),
            arValuation: helper().asUser("finance.ar", () =>
                helper().refusal("mantle.product.InventoryReportServices.run#InventoryValuation", {
                    organizationPartyId: "BOSS_ACCT_ORG"
                })
            )
        }
    },
    then({valuation, product, stock, arValuation}) {
        valuation.errors.length == 0
        valuation.output.includes("Stock value") && valuation.output.includes("Accounting demo office supplies")
        !valuation.output.includes("Repair product cost")
        product.errors.length == 0
        product.output.includes("Costs and history") && product.output.includes("Landed cost")
        product.output.includes("GL mappings") && !product.output.includes("Add mapping")
        stock.errors.length == 0 && stock.output.includes("Count variance")
        arValuation.includes("PERMISSION_DENIED")
    }
})

feature("the finance administrator repairs cost from the valuation; the close checklist has the valuation rows", {
    when() {
        const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const month = ec.entity
            .find("mantle.party.time.TimePeriod")
            .condition({partyId: "BOSS_ACCT_ORG", timePeriodTypeId: "FiscalMonth"})
            .condition("fromDate", "less-equals", day)
            .condition("thruDate", "greater-equals", day)
            .disableAuthz()
            .one().timePeriodId
        return {
            admin: helper().asUser("finance.admin", () => helper().page("Inventory/InventoryValuation", {}, "html"), false),
            checklist: helper().asUser("finance.approve", () =>
                helper().call("mantle.ledger.CloseServices.get#Checklist", {
                    organizationPartyId: "BOSS_ACCT_ORG",
                    timePeriodId: month
                })
            )
        }
    },
    then({admin, checklist}) {
        admin.errors.length == 0 && admin.output.includes("Repair product cost")
        checklist.checkRows.some(r => r.checkEnumId == "PccReceiptCostBasis")
        checklist.checkRows.some(r => r.checkEnumId == "PccValuationTieOut")
    }
})
