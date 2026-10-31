// Collections, credit and recurring invoices in the Accounting app: the screens render what each user may do over the
// demo (Granite Peak Supply overdue with a disputed invoice and a next action, Summit Retail's order held for credit, the
// monthly sublease); a reminder run previewed by AR leaves out the disputed invoice; the held order is released by an
// approver with a reason on OrderDetail, and the order is approved; the Today source names the held order.
const lib = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const org = "BOSS_ACCT_ORG"
const heldOrder = "BOSS_ACCT_SO_HELD"

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature("the collections, credit and recurring screens render in #mode", {
    where: [{mode: "qvt"}, {mode: "tui"}],
    when({mode}) {
        const pages = [
            ["finance.ar", "Receivables/Collections", {}, "Granite Peak Supply"],
            ["finance.ar", "Receivables/Dunning", {}, "New reminder run"],
            ["finance.ar", "Receivables/RecurringInvoices", {}, "Office sublease"],
            [
                "finance.ar",
                "Receivables/Customer360/Activities",
                {customerPartyId: "BOSS_ACCT_COLLECT", lastStandalone: "true"},
                "Call Granite Peak about the installation invoice"
            ],
            [
                "finance.ar",
                "Receivables/Customer360/Credit",
                {customerPartyId: "BOSS_ACCT_CREDIT", lastStandalone: "true"},
                heldOrder
            ],
            ["finance.approve", "Records/OrderDetail", {orderId: heldOrder}, "Release hold"],
            ["finance.admin", "Settings/CollectionPolicies", {}, "A friendly reminder"],
            ["finance.read", "Reports/Aging", {}, "Granite Peak Supply"]
        ]
        const rows = pages.map(([user, path, parameters, text]) =>
            lib().asUser(user, () => {
                const page = lib().page(path, parameters, mode)
                return {path, status: page.status, errors: page.errors, found: page.output.includes(text)}
            })
        )
        // AR sees the hold but cannot release it; the reader sees the aging but no contact dialog
        const arOrder = lib().asUser("finance.ar", () => lib().page("Records/OrderDetail", {orderId: heldOrder}, mode).output)
        const readCollections = lib().asUser("finance.read", () => lib().page("Receivables/Collections", {}, mode).output)
        return {rows, arOrder, readCollections}
    },
    then({rows, arOrder, readCollections}) {
        rows.filter(row => row.status != 200 || row.errors.length || !row.found).map(row => row.path) == []
        arOrder.includes("On hold")
        !arOrder.includes("Release hold")
        readCollections.includes("Granite Peak Supply")
        !readCollections.includes("Record contact")
    }
})

feature("AR previews a reminder run that leaves out the disputed invoice and names why", {
    when() {
        const previewed = lib().asUser("finance.ar", () =>
            lib().call("mantle.account.CollectionServices.preview#Dunning", {organizationPartyId: org})
        )
        const run = lib().asUser("finance.ar", () =>
            lib().call("mantle.account.CollectionServices.get#DunningRun", {dunningRunId: previewed.dunningRunId})
        )
        const page = lib().asUser("finance.ar", () =>
            lib().page("Receivables/Dunning", {dunningRunId: previewed.dunningRunId}, "qvt")
        )
        return {previewed, run, page}
    },
    then({previewed, run, page}) {
        run.notices.some(row => row.customerPartyId == "BOSS_ACCT_COLLECT" && row.invoiceIds == "BOSS_ACCT_AR_OVERDUE")
        run.notices.some(row => row.excludedReason == "DISPUTED" && row.invoiceIds == "BOSS_ACCT_AR_DISPUTED")
        page.output.includes("Send " + run.notices.filter(row => row.statusId == "DntPending").length + " reminders")
        page.output.includes("Disputed")
    }
})

feature("the Today source names the held order for a credit manager and nothing for AR", {
    when() {
        const approver = lib().asUser("finance.approve", () => lib().call("ironstone.accounting.HomeServices.get#TodayItems"))
        const ar = lib().asUser("finance.ar", () => lib().call("ironstone.accounting.HomeServices.get#TodayItems"))
        return {approver, ar}
    },
    then({approver, ar}) {
        approver.items.some(item => item.kind == "creditHold" && item.url.includes(heldOrder))
        !ar.items.some(item => item.kind == "creditHold")
    }
})

feature("an approver releases the demo order's credit hold with a reason; the order is approved", {
    when() {
        const denied = lib().asUser("finance.ar", () =>
            lib().refusal("mantle.account.CreditServices.release#CreditHold", {orderId: heldOrder, reason: "Paid"})
        )
        const released = lib().asUser("finance.approve", () =>
            lib().call("mantle.account.CreditServices.release#CreditHold", {
                orderId: heldOrder,
                reason: "Known customer; deposit received"
            })
        )
        const page = lib().asUser("finance.approve", () => lib().page("Records/OrderDetail", {orderId: heldOrder}, "qvt"))
        return {denied, released, page}
    },
    then({denied, released, page}) {
        denied.includes("PERMISSION_DENIED")
        released.statusId == "OrderApproved"
        !page.output.includes("Release hold")
    }
})
