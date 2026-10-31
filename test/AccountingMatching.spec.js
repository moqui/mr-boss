// Matching in the Accounting app: BillDetail's Match tab, the legacy matches task and the match policies render what
// each user may do, and a bill priced outside the policy goes on hold when it is matched.
const lib = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature("the matching screens render in #mode", {
    where: [{mode: "qvt"}, {mode: "tui"}],
    when({mode}) {
        const check = (user, path, parameters, text) =>
            lib().asUser(user, () => {
                const page = lib().page(path, parameters, mode)
                return {path, status: page.status, errors: page.errors, found: page.output.includes(text)}
            })
        const rows = [
            check(
                "finance.match",
                "Payables/BillDetail/Match",
                {recordId: "BOSS_ACCT_BILL_MATCH", lastStandalone: "true"},
                "Order and receipt sources"
            ),
            check("finance.match", "Payables/LegacyMatches", {showPreview: "Y"}, "Lines to link"),
            check("finance.admin", "Settings/MatchPolicies", {}, "Accepted receipts (three-way)")
        ]
        return {rows}
    },
    then({rows}) {
        rows.filter(row => row.status != 200 || row.errors.length || !row.found).map(row => row.path) == []
    }
})

feature("a match operator is offered Apply match and a reader is not; a bill not found is not available", {
    when() {
        const parameters = {recordId: "BOSS_ACCT_BILL_MATCH", lastStandalone: "true"}
        const match = lib().asUser("finance.match", () => lib().page("Payables/BillDetail/Match", parameters, "qvt"))
        const read = lib().asUser("finance.read", () => lib().page("Payables/BillDetail/Match", parameters, "qvt"))
        const missing = lib().asUser("finance.match", () =>
            lib().page("Payables/BillDetail/Match", {recordId: "BOSS_ACCT_NO_BILL", lastStandalone: "true"}, "qvt")
        )
        const legacy = lib().asUser("finance.read", () => lib().page("Payables/LegacyMatches", {}, "qvt"))
        return {match, read, missing, legacy}
    },
    then({match, read, missing, legacy}) {
        match.output.includes("Apply match")
        read.status == 200
        read.output.includes("Bill lines")
        !read.output.includes("Apply match")
        missing.output.includes("is not available: Invoice is not available")
        legacy.output.includes("needs the bill match permission")
    }
})

feature("a bill priced outside the policy goes on hold when matched, naming the rule, and only an approver releases it", {
    when() {
        const org = lib().ids.organizationPartyId
        const applied = lib().asUser("finance.match", () => {
            const evaluated = lib().call("mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch", {
                invoiceId: "BOSS_ACCT_BILL_PRICE",
                organizationPartyId: org
            })
            return lib().call("mantle.account.InvoiceMatchServices.apply#InvoiceMatch", {
                invoiceId: "BOSS_ACCT_BILL_PRICE",
                organizationPartyId: org,
                allocationList: evaluated.sourceRows.map(row => ({
                    invoiceItemSeqId: row.invoiceItemSeqId,
                    orderId: row.orderId,
                    orderItemSeqId: row.orderItemSeqId,
                    assetReceiptId: row.assetReceiptId,
                    quantity: String(row.quantity)
                }))
            })
        })
        const holds = lib().asUser("finance.approve", () =>
            lib().page("Payables/BillDetail/Holds", {recordId: "BOSS_ACCT_BILL_PRICE", lastStandalone: "true"}, "qvt")
        )
        const tab = lib().asUser("finance.match", () =>
            lib().page("Payables/BillDetail/Match", {recordId: "BOSS_ACCT_BILL_PRICE", lastStandalone: "true"}, "qvt")
        )
        return {applied, holds, tab}
    },
    then({applied, holds, tab}) {
        applied.resultEnumId == "ImrException"
        applied.invoiceHoldId != null
        applied.resultText.includes("outside the price tolerance")
        holds.output.includes("Match exception")
        holds.output.includes("Release")
        tab.output.includes("Applied match")
        tab.output.includes("Unapply match")
    }
})
