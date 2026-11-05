// Purchasing's performance reads (impl-purchasing P15; ReportServices, Reports.js): Commitments counts a request reservation,
// its purchase order and its actual once, and withholds the amounts from a buyer without financial read; Spend keeps
// committed and billed apart and withholds the supplier prices from a reader; the procurement tracker shows a buyer the bill's
// payment withheld and a payables reader its state; an evaluation's detail (one qvt render of ScorecardDetail) and the
// scorecards' export with its filters, snapshot time and what it left out, a supplier name a spreadsheet would read as a
// formula guarded. The scorecard rules are Mantle's (mr-mantle test/party/SupplierScorecards); access is PurchasingAccess's
// P15 feature; the usable-when walk is the acceptance PurchasingPerformanceWalk.
// Run: ./moq test mr-boss --spec PurchasingPerformance
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page, billFixture} = lib
const R = "ironstone.purchasing.ReportServices."
const prefix = "BOSS_PUR_PERF_SPEC"
// a supplier of Retail's whose name a spreadsheet would read as a formula
const formulaSupplier = prefix + "_SUP"

spec({
    setupSpec() {
        system(() => {
            invoke("create#mantle.party.Party", {
                partyId: formulaSupplier,
                partyTypeEnumId: "PtyOrganization",
                ownerPartyId: ids.organizationId
            })
            invoke("create#mantle.party.Organization", {partyId: formulaSupplier, organizationName: "=SUM(1+1)"})
            invoke("create#mantle.party.PartyRole", {partyId: formulaSupplier, roleTypeId: "Supplier"})
            // a request line's reservation of 100, its purchase order line converting all of it and the bill's actual
            // converting the order's, and another request line's open reservation of 40, all in January 2001
            const commitment = (id, stageEnumId, statusId, amount, convertedFromId, sourceEntityName, sourceId) =>
                invoke("create#mantle.other.budget.BudgetCommitment", {
                    budgetCommitmentId: prefix + "_" + id,
                    organizationPartyId: ids.organizationId,
                    glAccountId: "510000",
                    commitmentDate: "2001-01-10",
                    sourceEntityName,
                    sourceId,
                    sourceItemId: "01",
                    sourceRevision: "1",
                    stageEnumId,
                    statusId,
                    amount,
                    currencyUomId: "USD",
                    convertedFromId,
                    createdDate: ec.user.nowTimestamp
                })
            commitment("REQ", "BcsRequest", "BcConverted", 100, null, "mantle.request.Request", prefix + "_REQ")
            commitment("PO", "BcsOrder", "BcConverted", 100, prefix + "_REQ", "mantle.order.OrderHeader", prefix + "_PO")
            commitment("ACT", "BcsExpense", "BcActual", 100, prefix + "_PO", "mantle.account.invoice.Invoice", prefix + "_BILL")
            commitment("OPEN", "BcsRequest", "BcReserved", 40, null, "mantle.request.Request", prefix + "_REQ2")
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Commitments counts a reservation, its order and its actual once; a buyer sees the amounts withheld", {
    when() {
        const options = {organizationPartyId: ids.organizationId, fromDate: "2001-01-01", thruDate: "2001-01-31"}
        const finance = asUser("john.doe", () => invoke(R + "get#PurchaseCommitments", options).answer)
        const all = asUser("john.doe", () => invoke(R + "get#PurchaseCommitments", Object.assign({view: "all"}, options)).answer)
        const buyer = asUser(users.buyer, () => invoke(R + "get#PurchaseCommitments", options).answer)
        return {finance, all, buyer}
    },
    then({finance, all, buyer}) {
        finance.totalRows.length == 1
        finance.totalRows[0].reserved == "40.00"
        finance.totalRows[0].ordered == "0.00"
        finance.totalRows[0].actual == "100.00"
        // open view: the open reservation and the actual; every commitment: the converted ones too, open nothing
        finance.commitmentRows.length == 2
        all.commitmentRows.length == 4
        all.totalRows[0].actual == "100.00"
        buyer.commitmentRows.length == 2
        buyer.commitmentRows.every(row => row.openText == "Withheld" && row.openAmount == null)
        buyer.totalRows[0].actualText == "Withheld"
        buyer.omittedText.includes("Commitment amounts are withheld")
        buyer.complete == false
    }
})

feature(
    "Spend keeps committed and billed apart; the tracker withholds a bill's payment from a buyer and shows it a payables reader",
    {
        when() {
            const fixture = billFixture("Performance spec spend")
            const spend = user =>
                asUser(
                    user,
                    () => invoke(R + "get#PurchaseSpend", {supplierPartyId: ids.sharedSupplierId, groupBy: "supplier"}).answer
                )
            const tracker = user => asUser(user, () => invoke(R + "get#ProcurementTracker", {orderId: fixture.orderId}).answer)
            return {
                fixture,
                buyerSpend: spend(users.buyer),
                readerSpend: spend(users.read),
                buyerTracker: tracker(users.buyer),
                matchTracker: tracker(users.buyMatch)
            }
        },
        then({fixture, buyerSpend, readerSpend, buyerTracker, matchTracker}) {
            buyerSpend.spendRows.length == 1
            buyerSpend.spendRows[0].committed != null
            buyerSpend.spendRows[0].billed != null
            toDecimal(buyerSpend.spendRows[0].billed).compare(toDecimal("76.00")) >= 0
            buyerSpend.spendRows[0].committed != buyerSpend.spendRows[0].billed
            readerSpend.spendRows[0].committed == null
            readerSpend.spendRows[0].committedText == "Withheld"
            readerSpend.spendRows[0].billedText == "Withheld"
            readerSpend.omittedText.includes("Committed and received amounts are withheld")
            buyerTracker.trackerRows.length == 1
            buyerTracker.trackerRows[0].receiptText.startsWith("8 in 1 receipt")
            buyerTracker.trackerRows[0].billText.includes(fixture.invoiceId)
            buyerTracker.trackerRows[0].paymentText == "Withheld"
            matchTracker.trackerRows[0].paymentText.startsWith(fixture.invoiceId + ": Not paid")
        }
    }
)

feature("an evaluation's detail shows its measures and why the data is insufficient; the export guards formula text", {
    when() {
        const evaluated = asUser(
            users.buyer,
            () =>
                invoke("mantle.party.SupplierServices.evaluate#SupplierScorecard", {
                    organizationPartyId: ids.organizationId,
                    supplierPartyId: formulaSupplier
                }),
            false
        )
        const scorecardId = evaluated.resultRows[0].supplierScorecardId
        const detail = asUser(users.read, () => page("Performance/ScorecardDetail", {supplierScorecardId: scorecardId}))
        const exported = asUser(
            users.read,
            () => invoke(R + "find#SupplierScorecards", {supplierPartyId: formulaSupplier, output: "csv"}).answer
        )
        return {evaluated, detail, csvText: exported.csvText, fileName: exported.fileName}
    },
    then({evaluated, detail, csvText, fileName}) {
        evaluated.resultRows[0].resultEnumId == "SsrInsufficient"
        detail.status == 200
        detail.errors == []
        detail.output.includes("Insufficient data")
        detail.output.includes("0 eligible receipts of the 5")
        detail.output.includes("On-time delivery")
        csvText.startsWith("Supplier scorecards\r\n")
        csvText.includes("As of,")
        csvText.includes("'=SUM(1+1)")
        !csvText.includes(",=SUM")
        fileName.startsWith("Supplier-scorecards-")
    }
})
