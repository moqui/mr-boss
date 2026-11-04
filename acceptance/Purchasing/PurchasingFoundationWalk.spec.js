// Purchasing P1's "usable when" (impl-purchasing P1), as an acceptance walk with artifact authorization on: the menu renders
// for each group, and each area of it opens while the others are refused; quick create offers nothing a group may not create
// (P3: a purchase order, to the buyer and the administrator only); a reader sees their organization's purchase orders and suppliers and the shared suppliers,
// in the supplier list, the palette and record links, but not another organization's; a forged order or supplier id is
// refused. The rules themselves are PurchasingAccess's.
// Run: ./moq accept mr-boss --spec PurchasingFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, refusal, invoke, shell} = lib
const access = "ironstone.purchasing.AccessServices."
const areas = [
    "Home",
    "Suppliers",
    "Requests",
    "Sourcing",
    "Orders",
    "Approvals",
    "Agreements",
    "Replenishment",
    "Receiving",
    "Returns",
    "Bills",
    "Performance",
    "Settings",
    "Products"
]
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0

feature(
    "the menu renders for each group, its areas open, the others are refused, and quick create offers only what it may create",
    {
        when() {
            const problems = []
            for (const user of [users.requester, users.buyer, users.planner, users.approve, users.read, users.admin]) {
                const found = shell(user)
                if (found.status != 200 || !found.names.length) problems.push(`${user}'s menu: ${found.status} ${found.names}`)
                const quick = (found.providers?.quickCreate || [])
                    .map(item => item.kind)
                    .filter(kind => kind.startsWith("purchasing"))
                // P3: a purchase order for the buyer and the administrator; P10: a purchase request for them and the requester
                const creates = (
                    [users.requester, users.buyer, users.admin].includes(user) ? ["purchasingPurchaseRequest"] : []
                ).concat([users.buyer, users.admin].includes(user) ? ["purchasingPurchaseOrder", "purchasingQuoteRequest"] : [])
                if (JSON.stringify(quick) !== JSON.stringify(creates)) problems.push(`${user} is offered quick create ${quick}`)
                // every area: it opens when the menu lists it (or it is the hidden Products for a list reader), else it is refused
                const listReader = found.names.includes("Orders")
                for (const area of areas) {
                    const expected = found.names.includes(area) || (area === "Products" && listReader)
                    const rendered = asUser(user, () => lib.page(area, {}, "html"))
                    if (opened(rendered) !== expected)
                        problems.push(`${user} ${area}: ${expected ? "refused" : "opened"} ${rendered.status} ${rendered.errors}`)
                }
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("a reader sees their organization's orders and suppliers and the shared ones, never another organization's", {
    when() {
        const problems = []
        const view = user =>
            asUser(user, () => ({
                suppliers: invoke(access + "get#Choices", {choice: "suppliers"}).options.map(row => row.value),
                palette: invoke(access + "search#Records", {text: "boss_pur", limit: 20}).rows.map(row => row.url)
            }))
        const link = (user, id) =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName: "mantle.order.OrderHeader", id})
                        .url || null
            )
        const retail = view(users.read)
        const services = view(users.services)
        for (const supplierId of [ids.supplierId, ids.sharedSupplierId, ids.commonSupplierId])
            if (!retail.suppliers.includes(supplierId)) problems.push(`the reader does not see supplier ${supplierId}`)
        if (retail.suppliers.includes(ids.otherSupplierId)) problems.push("the reader sees the other organization's supplier")
        if (!services.suppliers.includes(ids.sharedSupplierId)) problems.push("services does not see the shared supplier")
        if (services.suppliers.includes(ids.supplierId)) problems.push("services sees Retail's supplier")
        if (!retail.palette.some(url => url.includes(ids.orderId))) problems.push(`the reader's palette: ${retail.palette}`)
        if (retail.palette.some(url => url.includes(ids.otherOrderId) || url.includes(ids.otherSupplierId)))
            problems.push("the reader's palette has the other organization's records")
        if (!services.palette.some(url => url.includes(ids.otherOrderId))) problems.push(`services' palette: ${services.palette}`)
        if (services.palette.some(url => url.includes(ids.orderId))) problems.push("services' palette has Retail's order")
        if (!link(users.read, ids.orderId) || !link(users.read, ids.approvedOrderId)) problems.push("the reader's order links")
        if (link(users.read, ids.otherOrderId)) problems.push("the reader links the other organization's order")
        if (link(users.services, ids.orderId)) problems.push("services links Retail's order")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a forged order or supplier id is refused like another organization's, on Home's lookup too", {
    when() {
        const problems = []
        asUser(users.read, () => {
            for (const [recordType, recordId] of [
                ["order", "BOSS_PUR_FORGED"],
                ["order", ids.otherOrderId],
                ["supplier", "BOSS_PUR_FORGED"],
                ["supplier", ids.otherSupplierId]
            ]) {
                const message = refusal(access + "check#Record", {recordType, recordId})
                if (!message.includes("RECORD_UNAVAILABLE")) problems.push(`${recordType} ${recordId}: ${message || "accepted"}`)
            }
            const home = lib.page("Home", {lookupType: "order", lookupId: ids.otherOrderId})
            if (!home.output.includes(ids.otherOrderId + " is not available to you.") || home.output.includes("Services office"))
                problems.push("Home's lookup shows the other organization's order")
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
