// Purchasing access (impl-purchasing §2, §4, P1): who may open Purchasing, the menu, providers and launcher per group, Home's
// one render (qvt), the capabilities from the Mantle permissions and the area authorizations, the organization and supplier
// scope, the record check against another organization's and forged ids, a requester's own requests, a capability on a
// record, the screens a group guards, and the paths around the Mantle purchasing services that no Purchasing group reaches:
// the Mantle REST order paths and the bulk status change (F9). One feature per rule, each case of it a line of its problems,
// with artifact authorization enabled. The Mantle services' own permission checks are Mantle's (mr-mantle test/order). The
// access and isolation walk is the acceptance PurchasingFoundationWalk. A later phase adds a case only for an access rule it
// adds, and its quick creates, Today sources and notification topics to the menu feature's rows.
// Run: ./moq test mr-boss --spec PurchasingAccess
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const access = "ironstone.purchasing.AccessServices."
// a refusal of a user without Purchasing: the service is not authorized for them, or it refuses them
const refused = message => /PURCHASING_UNAVAILABLE|is not authorized/.test(message)
const values = result => Array.from(result.options || []).map(row => row.value)
// this spec's purchase requests of Retail's (at ZIRET_WH): one filed by the requester, one by the buyer
const fixture = {ownRequestId: "BOSS_PUR_SPEC_REQ_OWN", otherRequestId: "BOSS_PUR_SPEC_REQ_OTHER"}

spec({
    setupSpec() {
        system(() => {
            for (const [requestId, filedByPartyId] of [
                [fixture.ownRequestId, "BOSS_PUR_REQUESTER"],
                [fixture.otherRequestId, "BOSS_PUR_BUYER"]
            ])
                ec.service
                    .sync()
                    .name("store#mantle.request.Request")
                    .parameters({
                        requestId,
                        requestTypeEnumId: "RqtPurchase",
                        statusId: "ReqSubmitted",
                        requestName: "Spec request " + requestId,
                        facilityId: "ZIRET_WH",
                        filedByPartyId
                    })
                    .call()
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a
// refusal name the authorization
function screenRefusal(user, path) {
    const rendered = asUser(user, () => lib.page(path, {}, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
const unauthorized = message => /^40[13] |is not authorized/.test(message)

feature("a Purchasing user gets the context; a user without the root group is refused it and the app", {
    when() {
        const problems = []
        const context = user => asUser(user, () => refusal(access + "get#SharedContext", {}))
        for (const user of [users.requester, users.read, users.admin, users.services]) {
            const message = context(user)
            if (message !== "") problems.push(`${user} is refused the context: ${message}`)
        }
        // Manufacturing's buyer holds Purchasing's buyer group but not the root user group
        for (const user of ["manufacturing.buyer", "warehouse.read", "finance.read"]) {
            const message = context(user)
            if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
        }
        const otherRoot = asUser(users.read, () => refusal(access + "get#SharedContext", {appRoot: "Warehouse"}))
        if (!otherRoot.includes("PURCHASING_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
        const home = screenRefusal("warehouse.read", "Home")
        if (!unauthorized(home)) problems.push(`warehouse.read opens Home: ${home || "opened"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// the menu of design §1; Home and Requests open to every Purchasing user, the others by group (BOSS_PUR_<Area>)
const order = [
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
    "Settings"
]
const lists = ["Suppliers", "Sourcing", "Orders", "Agreements", "Receiving", "Returns", "Bills", "Performance"]
const menuOf = extra => order.filter(name => ["Home", "Requests"].includes(name) || extra.includes(name))

// no area of P1 creates a record, so quick create offers nothing yet: P3 adds the purchase order, P10 the request, P11 the RFQ
feature("the Purchasing menu and providers follow each group's areas; the launcher shows Purchasing to its users only", {
    when() {
        const rows = [
            {user: users.requester, extra: []},
            {user: users.read, extra: lists.concat(["Replenishment"])},
            {user: users.buyer, extra: lists.concat(["Replenishment"])},
            {user: users.planner, extra: lists.concat(["Replenishment"])},
            {user: users.approve, extra: lists.concat(["Approvals"])},
            {user: users.admin, extra: order}
        ]
        const problems = []
        for (const {user, extra} of rows) {
            const found = shell(user)
            const quickKinds = (found.providers?.quickCreate || []).map(item => item.kind)
            if (found.status != 200) problems.push(`${user}'s menu: ${found.status}`)
            if (JSON.stringify(found.names) !== JSON.stringify(menuOf(extra)))
                problems.push(`${user}'s menu is ${found.names}, not ${menuOf(extra)}`)
            if (quickKinds.length) problems.push(`${user} is offered quick create ${quickKinds}`)
            if (!(found.providers?.paletteSources || []).some(source => source.group === "Purchasing"))
                problems.push(`${user} has no Purchasing palette source`)
            if (!(found.providers?.keymaps || []).some(keymap => keymap.scope === "purchasing"))
                problems.push(`${user} has no purchasing key scope`)
        }
        // the launcher: the reader has Purchasing and no other business app; Purchasing's buyer group alone, without the root
        // user group (Manufacturing's buyer), opens no Purchasing
        const readerApps = shell(users.read).apps
        if (!readerApps.includes("Purchasing")) problems.push(`the reader's launcher has no Purchasing: ${readerApps}`)
        const otherApps = readerApps.filter(app =>
            ["Products", "Accounting", "Manufacturing", "Warehouse", "Projects", "Sales"].includes(app)
        )
        if (otherApps.length) problems.push(`the reader's launcher has ${otherApps}`)
        if (shell("manufacturing.buyer").apps.includes("Purchasing")) problems.push("Manufacturing's buyer has Purchasing")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Home shows the reader's counters as unavailable, no work yet, spend unavailable and the lookup of their order", {
    when() {
        return asUser(users.read, () => lib.page("Home", {lookupType: "order", lookupId: ids.orderId}))
    },
    then({status, errors, output}) {
        status == 200
        errors == []
        output.includes("Unacknowledged orders")
        output.includes("Unavailable")
        output.includes("Nothing is waiting for you.")
        output.includes("Committed and billed spend is unavailable.")
        output.includes("Purchase order " + ids.orderId)
        output.includes("Brightline restock")
        // the approver's card is not the reader's
        !output.includes("Approvals waiting")
    }
})

const capabilityNames = [
    "buy",
    "approve",
    "orderApprove",
    "holdRelease",
    "plan",
    "stockPolicy",
    "policyEdit",
    "profileEdit",
    "scorecardEdit",
    "billImport",
    "returnAuthorize",
    "supplierPriceRead",
    "match",
    "receive",
    "listRead",
    "replenishment",
    "approvals",
    "settings"
]
const buyer = ["buy", "profileEdit", "scorecardEdit", "billImport", "returnAuthorize", "supplierPriceRead"]
const capabilityUsers = [
    {user: users.requester, granted: []},
    {user: users.read, granted: ["listRead", "replenishment"]},
    {user: users.buyer, granted: buyer.concat(["listRead", "replenishment"])},
    {user: users.planner, granted: ["plan", "stockPolicy", "listRead", "replenishment"]},
    {user: users.approve, granted: ["approve", "orderApprove", "holdRelease", "listRead", "approvals"]},
    {user: users.buyMatch, granted: buyer.concat(["match", "listRead", "replenishment"])},
    {user: users.services, granted: ["listRead", "replenishment"]}
]
feature("each group holds exactly the capabilities of its permissions and areas, the administrator every Purchasing one", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const capabilities = asUser(user, () => invoke(access + "get#SharedContext", {}).capabilities)
            const held = capabilityNames.filter(name => capabilities[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (capabilities.read !== true) problems.push(`${user} does not read`)
        }
        const admin = asUser(users.admin, () => invoke(access + "get#SharedContext", {}))
        const missing = capabilityNames
            .filter(name => !["match", "receive"].includes(name))
            .filter(name => !admin.capabilities[name])
        if (missing.length) problems.push(`the administrator lacks ${missing}`)
        if (admin.allOrganizations !== true) problems.push("the administrator is not in every organization")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a user's suppliers are their organization's and the shared ones, in the drop-downs and the palette", {
    when() {
        const problems = []
        const choices = (user, choice, extra = {}) =>
            asUser(user, () => values(invoke(access + "get#Choices", Object.assign({choice}, extra))))
        const retail = choices(users.read, "suppliers", {term: ""})
        const services = choices(users.services, "suppliers", {term: ""})
        for (const supplierId of [ids.supplierId, ids.sharedSupplierId, ids.commonSupplierId])
            if (!retail.includes(supplierId)) problems.push(`the reader is not offered ${supplierId}`)
        if (retail.includes(ids.otherSupplierId)) problems.push("the reader is offered the other organization's supplier")
        if (!services.includes(ids.otherSupplierId) || !services.includes(ids.sharedSupplierId))
            problems.push(`the other organization's suppliers: ${services}`)
        if (services.includes(ids.supplierId)) problems.push("the other organization is offered Retail's supplier")
        // a selected value outside the page: Retail's supplier for its user, not for the other organization's
        const selected = user => choices(user, "suppliers", {term: "zzz-none", selected: ids.supplierId})
        if (!selected(users.read).includes(ids.supplierId)) problems.push("the reader's selected supplier is left out")
        if (selected(users.services).includes(ids.supplierId)) problems.push("the other organization gets the selected supplier")
        const organizations = choices(users.read, "organizations", {})
        if (!organizations.includes(ids.organizationId) || organizations.includes(ids.otherOrganizationId))
            problems.push(`the reader's organizations: ${organizations}`)
        const unknown = asUser(users.read, () => refusal(access + "get#Choices", {choice: "everything"}))
        if (!unknown.includes("Unknown Purchasing choice")) problems.push(`an unknown choice: ${unknown || "accepted"}`)
        // the palette: the reader's own purchase order and the shared supplier, nothing of the other organization's
        const search = (user, text) =>
            asUser(user, () => invoke(access + "search#Records", {text, limit: 20}).rows.map(row => row.url))
        const orders = search(users.read, "boss_pur_po")
        if (!orders.some(url => url.includes("lookupType=order&lookupId=" + ids.orderId)))
            problems.push(`the reader's palette orders: ${orders}`)
        if (orders.some(url => url.includes(ids.otherOrderId))) problems.push("the reader's palette has the other order")
        const suppliers = search(users.read, "ziddleman")
        if (!suppliers.some(url => url.includes("lookupId=" + ids.sharedSupplierId)))
            problems.push(`the reader's palette suppliers: ${suppliers}`)
        if (search(users.services, "boss_pur_po").some(url => url.includes(ids.orderId)))
            problems.push("the other organization's palette has Retail's order")
        if (search(users.requester, "boss_pur_po").length) problems.push("the requester's palette has orders")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// each record type: a record of Retail's and one it does not reach (another organization's, or a record of another type)
const records = [
    {recordType: "order", own: ids.orderId, other: ids.otherOrderId},
    {recordType: "order", own: ids.approvedOrderId, other: "BOSS_WH_SO"},
    {recordType: "supplier", own: ids.supplierId, other: ids.otherSupplierId},
    {recordType: "supplier", own: ids.sharedSupplierId, other: ids.organizationId},
    {recordType: "quote", own: null, other: ids.orderId},
    {recordType: "request", own: fixture.otherRequestId, other: ids.orderId}
]
feature("another organization's or a forged record is refused like a missing one; a requester reads their own requests only", {
    when() {
        const problems = []
        const check = (recordType, recordId) => refusal(access + "check#Record", {recordType, recordId})
        asUser(users.read, () => {
            for (const {recordType, own, other} of records) {
                const ownMessage = own ? check(recordType, own) : ""
                if (ownMessage !== "") problems.push(`the reader is refused its ${recordType} ${own}: ${ownMessage}`)
                for (const recordId of [other, "BOSS_PUR_FORGED"]) {
                    const message = check(recordType, recordId)
                    if (!message.includes("RECORD_UNAVAILABLE"))
                        problems.push(`the reader reaches ${recordType} ${recordId}: ${message || "accepted"}`)
                }
            }
            const unknown = check("everything", ids.orderId)
            if (!unknown.includes("RECORD_UNAVAILABLE")) problems.push(`an unknown record type: ${unknown}`)
        })
        asUser(users.services, () => {
            for (const {recordType, own} of records.filter(row => row.own && row.own !== ids.sharedSupplierId)) {
                const message = check(recordType, own)
                if (!message.includes("RECORD_UNAVAILABLE")) problems.push(`services reaches ${recordType} ${own}: ${message}`)
            }
            const shared = check("supplier", ids.sharedSupplierId)
            if (shared !== "") problems.push(`services is refused the shared supplier: ${shared}`)
            const servicesOwn = check("order", ids.otherOrderId)
            if (servicesOwn !== "") problems.push(`services is refused its own order: ${servicesOwn}`)
        })
        // the requester: their own request, not another's, and no purchase order or supplier
        asUser(users.requester, () => {
            const own = check("request", fixture.ownRequestId)
            if (own !== "") problems.push(`the requester is refused their request: ${own}`)
            for (const [recordType, recordId] of [
                ["request", fixture.otherRequestId],
                ["order", ids.orderId],
                ["supplier", ids.supplierId]
            ]) {
                const message = check(recordType, recordId)
                if (!message.includes("RECORD_UNAVAILABLE"))
                    problems.push(`the requester reaches ${recordType} ${recordId}: ${message || "accepted"}`)
            }
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a capability on a record is refused for a user without its permission and passes for one with it, on the same record", {
    when() {
        const problems = []
        const cases = [
            ["buy", "order", ids.orderId, users.buyer, users.read],
            ["orderApprove", "order", ids.orderId, users.approve, users.buyer],
            ["plan", "order", ids.orderId, users.planner, users.approve]
        ]
        for (const [capability, recordType, recordId, holder, without] of cases) {
            const parameters = {recordType, recordId, capability}
            const held = asUser(holder, () => refusal(access + "check#Record", parameters))
            if (held !== "") problems.push(`${holder} is refused ${capability} on ${recordId}: ${held}`)
            const refusedMessage = asUser(without, () => refusal(access + "check#Record", parameters))
            if (!refusedMessage.includes("PERMISSION_DENIED"))
                problems.push(`${without} is not refused ${capability}: ${refusedMessage || "accepted"}`)
        }
        const unknown = asUser(users.buyer, () =>
            refusal(access + "check#Record", {recordType: "order", recordId: ids.orderId, capability: "everything"})
        )
        if (!unknown.includes("Unknown Purchasing capability")) problems.push(`an unknown capability: ${unknown || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a purchase order's record link opens under Purchasing for its reader only", {
    when() {
        const link = (user, id, enabled = true) =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName: "mantle.order.OrderHeader", id})
                        .url || null,
                enabled
            )
        return {
            own: link(users.read, ids.orderId),
            other: link(users.read, ids.otherOrderId),
            services: link(users.services, ids.otherOrderId),
            // the requester and another app's user: with authorization disabled the service itself answers no link
            requester: link(users.requester, ids.orderId),
            finance: link("finance.read", ids.orderId, false)
        }
    },
    then({own, other, services, requester, finance}) {
        // P1 builds no record screen, so a purchase order opens Home's lookup; P3 sets its destination
        own == "/qapps/Purchasing/Home?lookupType=order&lookupId=" + ids.orderId
        other == null
        services == "/qapps/Purchasing/Home?lookupType=order&lookupId=" + ids.otherOrderId
        requester == null
        finance == null
    }
})

feature("the areas a group guards refuse a Purchasing user without it", {
    when() {
        const problems = []
        for (const [user, path] of [
            [users.requester, "Orders"],
            [users.buyer, "Approvals"],
            [users.approve, "Settings"]
        ]) {
            const got = screenRefusal(user, path)
            if (!unauthorized(got) || !got.includes("AT_XML_SCREEN [")) problems.push(`${user} ${path}: ${got || "opened"}`)
        }
        const opened = screenRefusal(users.requester, "Requests")
        if (opened !== "") problems.push(`the requester is refused Requests: ${opened}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("no Purchasing group reaches the Mantle REST order paths or the bulk order status change (F9)", {
    when() {
        const problems = []
        for (const user of [users.buyer, users.approve, users.admin])
            asUser(user, () => {
                for (const [path, method] of [
                    ["s1/mantle/orders", "get"],
                    ["s1/mantle/orders", "post"],
                    ["s1/mantle/orders/" + ids.orderId, "patch"]
                ]) {
                    const rendered = ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot/rest.xml")
                        .render(path, {vendorPartyId: ids.supplierId, customerPartyId: ids.organizationId}, method)
                    if (![401, 403].includes(rendered.status)) problems.push(`${user} ${path} ${method}: ${rendered.status}`)
                    ec.message.clearErrors()
                }
                const bulk = refusal("mantle.order.OrderBulkServices.change#OrderPartsStatus", {
                    toStatusId: "OrderApproved",
                    inputFieldsMap: {orderId: ids.orderId}
                })
                if (!bulk.includes("is not authorized")) problems.push(`${user} change#OrderPartsStatus: ${bulk || "accepted"}`)
            })
        const status = system(() => ec.entity.find("mantle.order.OrderHeader").condition("orderId", ids.orderId).one().statusId)
        if (status !== "OrderOpen") problems.push(`the order is ${status}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P14a: Replenishment's facility (the record its SupplyPlanning, ReorderRules and their transitions check): the plan and
// stock-policy capabilities for the planner, the buy capability for the buyer, each refused to the other on the same
// facility; another organization's facility refused like a missing one, and not among the planning facilities; the
// replenishment reads refused to a group without the area
feature("a replenishment facility is the organization's; plan and buy on it need their permissions", {
    when() {
        const problems = []
        const check = (user, capability, recordId = ids.facilityId) =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "facility", recordId, capability}))
        for (const [capability, holder, without] of [
            ["plan", users.planner, users.buyer],
            ["stockPolicy", users.planner, users.buyer],
            ["buy", users.buyer, users.planner]
        ]) {
            const held = check(holder, capability)
            if (held !== "") problems.push(`${holder} is refused ${capability} on ${ids.facilityId}: ${held}`)
            const refusedMessage = check(without, capability)
            if (!refusedMessage.includes("PERMISSION_DENIED"))
                problems.push(`${without} is not refused ${capability}: ${refusedMessage || "accepted"}`)
        }
        const other = check(users.planner, "plan", "BOSS_PRD_WH")
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's facility: ${other || "accepted"}`)
        const facilities = asUser(users.planner, () => values(invoke(access + "get#Choices", {choice: "planFacilities"})))
        if (!facilities.includes(ids.facilityId) || facilities.includes("BOSS_PRD_WH"))
            problems.push(`the planner's planning facilities: ${facilities}`)
        const requester = asUser(users.requester, () =>
            refusal("ironstone.purchasing.ReplenishmentServices.find#ReorderRules", {})
        )
        if (!requester.includes("PERMISSION_DENIED") && !refused(requester))
            problems.push(`the requester reads the reorder rules: ${requester || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
