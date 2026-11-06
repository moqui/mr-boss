// Commerce access (impl-commerce §2, §4, P1; design-commerce §1.1): who may open Commerce, the menu, providers and launcher (the
// reader, a capability group and the administrator), Home's one render (qvt), the capabilities from the Mantle permissions and the area authorizations, the organization
// and store scope (a store-limited staff member's stores) through the services and the COMMERCE_STORE filter, the record
// check against another organization's, an unassigned and forged ids, a capability on a record, record links, the areas a
// group guards, and the paths around the Mantle services that no Commerce group reaches: the Mantle REST store paths and the
// raw store mutators. One feature per rule, each case of it a line of its problems, with artifact authorization enabled.
// The Mantle services' own permission checks are Mantle's. The access and isolation walk is the acceptance
// CommerceFoundationWalk. A later phase adds a case only for an access rule it adds, and its providers to the menu feature.
// Run: ./moq test mr-boss --spec Commerce/CommerceAccess
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const context = "ironstone.commerce.ContextServices."
// a refusal of a user without Commerce: the service is not authorized for them, or it refuses them
const refused = message => /COMMERCE_UNAVAILABLE|is not authorized/.test(message)
const values = result => Array.from(result.options || []).map(row => row.value)
const fixture = "component://mr-boss/test/screens/CommerceStoreRows.xml"

spec({
    setupSpec() {
        // the store-filter fixture's authorization: the root user group's, with the root's filter sets and COMMERCE_STORE
        login("john.doe")
        system(() => {
            const create = (name, parameters) =>
                ec.service
                    .sync()
                    .name("create#" + name)
                    .parameters(parameters)
                    .call()
            create("moqui.security.ArtifactGroup", {artifactGroupId: "COMMERCE_STORE_TEST"})
            create("moqui.security.ArtifactGroupMember", {
                artifactGroupId: "COMMERCE_STORE_TEST",
                artifactName: fixture,
                artifactTypeEnumId: "AT_XML_SCREEN",
                inheritAuthz: "Y"
            })
            create("moqui.security.ArtifactAuthz", {
                artifactAuthzId: "COMMERCE_STORE_TEST",
                artifactGroupId: "COMMERCE_STORE_TEST",
                userGroupId: "BOSS_COMMERCE",
                authzTypeEnumId: "AUTHZT_ALLOW",
                authzActionEnumId: "AUTHZA_ALL"
            })
            for (const entityFilterSetId of ["MANTLE_USER_ORG", "MANTLE_PRIVATE_CONTACT", "COMMERCE_STORE"])
                create("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: "COMMERCE_STORE_TEST", entityFilterSetId})
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

feature(
    "a Commerce user gets the context; another app's user, a Projects client and a PASS public account are refused it and the app",
    {
        when() {
            const problems = []
            const shared = user => asUser(user, () => refusal(context + "get#SharedContext", {}))
            // the reader, manager and administrator get it in the capabilities feature
            for (const user of [users.storeStaff, users.services]) {
                const message = shared(user)
                if (message !== "") problems.push(`${user} is refused the context: ${message}`)
            }
            // a PASS public account (Customer Service's Support demo contact) holds no BOSS group
            for (const user of ["customerservice.read", "sheldon.acme", "dana@joesdist.example.com"]) {
                const message = shared(user)
                if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
            }
            const otherRoot = asUser(users.read, () => refusal(context + "get#SharedContext", {appRoot: "Warehouse"}))
            if (!otherRoot.includes("COMMERCE_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
            for (const user of ["sheldon.acme", "dana@joesdist.example.com"]) {
                const home = screenRefusal(user, "Home")
                if (!unauthorized(home)) problems.push(`${user} opens Home: ${home || "opened"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// the menu of design §1.2; Home, Stores, Merchandising and Promotions open to every Commerce user, the others by group
// (BOSS_COM_<Area>)
const order = [
    "Home",
    "Stores",
    "Merchandising",
    "Website",
    "Orders",
    "Customers",
    "Promotions",
    "Integrations",
    "Reports",
    "Settings"
]
const open = ["Home", "Stores", "Merchandising", "Promotions"]
const menuOf = extra => order.filter(name => open.includes(name) || extra.includes(name))

feature("the Commerce menu and providers follow the areas' groups; the launcher shows it to its users only", {
    when() {
        // the reader (no guarded area), a capability group's member (its areas) and the administrator (every area); each
        // group's areas are its area capabilities, from the same authorizations, in the capabilities feature
        const rows = [
            {user: users.read, extra: []},
            {user: users.operator, extra: ["Orders", "Customers", "Reports"]},
            {user: users.admin, extra: order}
        ]
        const problems = []
        const shells = {}
        for (const {user, extra} of rows) {
            const found = (shells[user] = shell(user))
            if (found.status != 200) problems.push(`${user}'s menu: ${found.status}`)
            if (JSON.stringify(found.names) !== JSON.stringify(menuOf(extra)))
                problems.push(`${user}'s menu is ${found.names}, not ${menuOf(extra)}`)
            if ((found.providers?.quickCreate || []).length) problems.push(`${user} is offered quick create`)
            if (!(found.providers?.paletteSources || []).some(source => source.group === "Commerce"))
                problems.push(`${user} has no Commerce palette source`)
            if (!(found.providers?.keymaps || []).some(keymap => keymap.scope === "commerce"))
                problems.push(`${user} has no commerce key scope`)
        }
        // the launcher: the reader has Commerce and no other business app; another app's user has no Commerce
        const readerApps = shells[users.read].apps
        if (!readerApps.includes("Commerce")) problems.push(`the reader's launcher has no Commerce: ${readerApps}`)
        const business = [
            "Products",
            "Accounting",
            "Manufacturing",
            "Warehouse",
            "Projects",
            "Sales",
            "Purchasing",
            "CustomerService"
        ]
        const otherApps = readerApps.filter(app => business.includes(app))
        if (otherApps.length) problems.push(`the reader's launcher has ${otherApps}`)
        if (shell("customerservice.read").apps.includes("Commerce")) problems.push("customerservice.read has Commerce")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Home shows the work and the period not configured for the reader's store, and refuses another organization's", {
    when() {
        return {
            own: asUser(users.read, () => lib.page("Home", {productStoreId: ids.storeId})),
            other: asUser(users.read, () => lib.page("Home", {productStoreId: ids.otherStoreId}))
        }
    },
    then({own, other}) {
        own.status == 200
        own.errors == []
        own.output.includes("Work to do")
        own.output.includes("Payment holds")
        own.output.includes("Net sales")
        own.output.includes("Not configured")
        own.output.includes("Ziziwork Retail Store,")
        !own.output.includes("New store")
        !own.output.includes("Visits")
        other.status == 200
        other.output.includes("Store " + ids.otherStoreId + " is not available to you.")
        !other.output.includes("Ziziwork Digital Store")
    }
})

const capabilityNames = [
    "view",
    "storeEdit",
    "merchandise",
    "publish",
    "themeEdit",
    "themeCode",
    "themePublish",
    "orderView",
    "recovery",
    "promotionEdit",
    "channelOperate",
    "subscriptionManage",
    "catalogView",
    "priceView",
    "website",
    "orders",
    "customers",
    "integrations",
    "reports",
    "settings"
]
const reader = ["view", "catalogView"]
const capabilityUsers = [
    {user: users.read, granted: reader},
    {user: users.manager, granted: reader.concat(["storeEdit", "promotionEdit", "priceView", "reports", "settings"])},
    {user: users.merchandiser, granted: reader.concat(["merchandise", "priceView", "website"])},
    {user: users.designer, granted: reader.concat(["themeEdit", "website"])},
    {user: users.developer, granted: reader.concat(["themeEdit", "themeCode", "website"])},
    {user: users.publisher, granted: reader.concat(["publish", "themePublish", "website"])},
    {user: users.operator, granted: reader.concat(["orderView", "recovery", "priceView", "orders", "customers", "reports"])},
    {user: users.channel, granted: reader.concat(["channelOperate", "integrations", "reports"])},
    {user: users.subscriptions, granted: reader.concat(["orderView", "subscriptionManage", "orders", "customers", "reports"])},
    {user: users.admin, granted: capabilityNames}
]
feature("each group holds exactly the capabilities of its permissions and areas, the administrator every one", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const capabilities = asUser(user, () => invoke(context + "get#SharedContext", {}).capabilities)
            const held = capabilityNames.filter(name => capabilities[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (capabilities.read !== true) problems.push(`${user} does not read`)
        }
        const admin = asUser(users.admin, () => invoke(context + "get#SharedContext", {}))
        if (admin.allOrganizations !== true) problems.push("the administrator is not in every organization")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a user's stores are their organization's, and a store-limited staff member's only theirs, in every service and the filter",
    {
        when() {
            const problems = []
            const scope = user => asUser(user, () => invoke(context + "get#StoreScope", {}))
            const choices = (user, extra = {}) =>
                asUser(user, () => values(invoke(context + "get#Choices", Object.assign({choice: "stores"}, extra))))
            const palette = (user, text) =>
                asUser(user, () => invoke(context + "search#Records", {text, limit: 20}).rows.map(row => row.recordId))
            const filtered = user =>
                asUser(user, () => {
                    const result = ec.screen.makeTest().rootScreen(fixture).render("rows", {}, "get")
                    if (result.errorMessages.length) throw new Error(result.errorMessages.join(" | "))
                    return JSON.parse(result.output)
                })
            // an unlimited user's scope is every store of their organizations, which other specs may add to in a full run:
            // it must hold the demo store and never the other organization's; a store-limited one's is exactly theirs
            const wrong = (list, own, other, limited) =>
                limited
                    ? JSON.stringify([...(list || [])].sort()) !== JSON.stringify(own)
                    : !own.every(id => (list || []).includes(id)) || (list || []).includes(other)
            for (const [user, own, other, limited] of [
                [users.read, [ids.storeId], ids.otherStoreId, false],
                [users.services, [ids.otherStoreId], ids.storeId, false],
                // a member of both organizations, assigned POPC_DEFAULT only
                [users.storeStaff, [ids.storeId], ids.otherStoreId, true]
            ]) {
                const found = scope(user)
                if (wrong(found.storeIds, own, other, limited)) problems.push(`${user}'s stores: ${found.storeIds}`)
                if (found.storeLimited !== limited) problems.push(`${user} limited: ${found.storeLimited}`)
                const offered = choices(user, {term: "ziziwork"})
                if (wrong(offered, own, other, limited)) problems.push(`${user} is offered ${offered}`)
                const searched = palette(user, "store")
                if (wrong(searched, own, other, limited)) problems.push(`${user}'s palette: ${searched}`)
                const rows = filtered(user)
                if (wrong(rows.stores, own, other, limited))
                    problems.push(`${user}'s filtered stores: ${rows.stores}`)
                if (rows.filters.includes("COMMERCE_STORE") !== limited)
                    problems.push(`${user}'s store filter applies: ${rows.filters}`)
            }
            // a selected store outside the page: the reader's own, never the other organization's or an unassigned one
            const selected = (user, storeId) => choices(user, {term: "zzz-none", selected: storeId}).includes(storeId)
            if (!selected(users.read, ids.storeId)) problems.push("the reader's selected store is left out")
            if (selected(users.read, ids.otherStoreId)) problems.push("the reader gets the other organization's selected store")
            if (selected(users.storeStaff, ids.otherStoreId)) problems.push("the staff member gets an unassigned selected store")
            const unknown = asUser(users.read, () => refusal(context + "get#Choices", {choice: "everything"}))
            if (!unknown.includes("Unknown Commerce choice")) problems.push(`an unknown choice: ${unknown || "accepted"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// each record type: one of Retail's and ones the reader does not reach (another organization's, unassigned, of no store)
const records = [
    {recordType: "store", own: ids.storeId, others: [ids.otherStoreId, ids.accountingStoreId]},
    {recordType: "site", own: ids.siteId, others: [ids.otherSiteId]},
    {recordType: "order", own: ids.storeOrderId, others: [ids.noStoreOrderId]},
    {recordType: "customer", own: ids.customerId, others: [ids.otherCustomerId, ids.organizationId]}
]
feature(
    "another organization's, an unassigned or a forged record is refused like a missing one; a capability is its permission's",
    {
        when() {
            const problems = []
            const check = (recordType, recordId, capability) =>
                refusal(context + "check#Record", {recordType, recordId, capability})
            asUser(users.read, () => {
                for (const {recordType, own, others} of records) {
                    const ownMessage = check(recordType, own)
                    if (ownMessage !== "") problems.push(`the reader is refused its ${recordType} ${own}: ${ownMessage}`)
                    for (const recordId of others.concat(["BOSS_COM_FORGED"])) {
                        const message = check(recordType, recordId)
                        if (!message.includes("RECORD_UNAVAILABLE"))
                            problems.push(`the reader reaches ${recordType} ${recordId}: ${message || "accepted"}`)
                    }
                }
                // an open order is a cart, not an order; an unknown kind is refused
                if (!check("cart", ids.storeOrderId).includes("RECORD_UNAVAILABLE")) problems.push("a placed order is a cart")
                if (!check("everything", ids.storeId).includes("RECORD_UNAVAILABLE")) problems.push("an unknown record type")
            })
            asUser(users.services, () => {
                if (check("store", ids.otherStoreId) !== "") problems.push("services is refused its own store")
                if (check("site", ids.otherSiteId) !== "") problems.push("services is refused its own site")
                if (!check("store", ids.storeId).includes("RECORD_UNAVAILABLE")) problems.push("services reaches Retail's store")
            })
            // the staff member, of both organizations: their store, its order and its site (ZIZI_SHOP's Shop mount targets
            // POPC_DEFAULT, Shop P1); not the unassigned store, nor a site with no store of theirs (ZIZI_DIGITAL's)
            asUser(users.storeStaff, () => {
                if (check("store", ids.storeId) !== "") problems.push("the staff member is refused their store")
                if (check("order", ids.storeOrderId) !== "") problems.push("the staff member is refused their store's order")
                if (check("site", ids.siteId) !== "") problems.push("the staff member is refused their store's site")
                for (const [recordType, recordId] of [
                    ["store", ids.otherStoreId],
                    ["site", ids.otherSiteId]
                ])
                    if (!check(recordType, recordId).includes("RECORD_UNAVAILABLE"))
                        problems.push(`the staff member reaches ${recordType} ${recordId}`)
            })
            // a capability on the same record: the holder passes, the user without its permission is refused
            for (const [capability, holder, without] of [
                ["storeEdit", users.manager, users.read],
                ["themePublish", users.publisher, users.designer]
            ]) {
                const held = asUser(holder, () => check("store", ids.storeId, capability))
                if (held !== "") problems.push(`${holder} is refused ${capability}: ${held}`)
                const message = asUser(without, () => check("store", ids.storeId, capability))
                if (!message.includes("PERMISSION_DENIED"))
                    problems.push(`${without} is not refused ${capability}: ${message || "accepted"}`)
            }
            const unknownCapability = asUser(users.read, () => check("store", ids.storeId, "everything"))
            if (!unknownCapability.includes("Unknown Commerce capability"))
                problems.push(`an unknown capability: ${unknownCapability || "accepted"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "a store's record link opens Commerce for its users only; the guarded areas, Mantle REST and raw store mutators are refused",
    {
        when() {
            const problems = []
            const link = (user, id, enabled = true) =>
                asUser(
                    user,
                    () =>
                        invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                            recordEntityName: "mantle.product.store.ProductStore",
                            id
                        }).url || null,
                    enabled
                )
            const home = id => "/qapps/Commerce/Stores/StoreDetail?productStoreId=" + id
            if (link(users.read, ids.storeId) !== home(ids.storeId)) problems.push("the reader's store link")
            if (link(users.read, ids.otherStoreId) !== null) problems.push("the reader links the other store")
            if (link(users.services, ids.otherStoreId) !== home(ids.otherStoreId)) problems.push("services' store link")
            if (link(users.storeStaff, ids.otherStoreId) !== null) problems.push("the staff member links an unassigned store")
            // another app's user: with authorization disabled the service itself answers no link
            if (link("customerservice.read", ids.storeId, false) !== null) problems.push("customerservice.read links the store")
            for (const [user, path] of [
                [users.read, "Website"],
                [users.manager, "Orders"],
                [users.designer, "Settings"]
            ]) {
                const got = screenRefusal(user, path)
                if (!unauthorized(got) || !got.includes("AT_XML_SCREEN [")) problems.push(`${user} ${path}: ${got || "opened"}`)
            }
            const opened = screenRefusal(users.read, "Promotions")
            if (opened !== "") problems.push(`the reader is refused Promotions: ${opened}`)
            for (const user of [users.manager, users.admin])
                asUser(user, () => {
                    for (const [path, method] of [
                        ["s1/mantle/products/stores", "get"],
                        ["s1/mantle/products/stores", "post"],
                        ["s1/mantle/products/stores/" + ids.storeId, "put"]
                    ]) {
                        const rendered = ec.screen
                            .makeTest()
                            .rootScreen("component://webroot/screen/webroot/rest.xml")
                            .render(path, {storeName: "Forged", organizationPartyId: ids.organizationId}, method)
                        if (![401, 403].includes(rendered.status)) problems.push(`${user} ${path} ${method}: ${rendered.status}`)
                        ec.message.clearErrors()
                    }
                    for (const [service, parameters] of [
                        ["update#mantle.product.store.ProductStore", {productStoreId: ids.storeId, storeName: "Forged"}],
                        [
                            "mantle.product.StoreServices.clone#ProductStore",
                            {baseProductStoreId: ids.storeId, productStoreId: "BOSS_COM_FORGED"}
                        ]
                    ]) {
                        const message = refusal(service, parameters)
                        if (!message.includes("is not authorized")) problems.push(`${user} ${service}: ${message || "accepted"}`)
                    }
                })
            const name = system(
                () => ec.entity.find("mantle.product.store.ProductStore").condition("productStoreId", ids.storeId).one().storeName
            )
            if (name !== "Ziziwork Retail Store") problems.push(`the store is named ${name}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P2 (F51): a store-limited staff member is refused another store of their own organization in StoreDetail's reads, as
// in the record check; a reader of the organization (no assignment) reads it, and another organization's manager is refused
// it. Mantle's get#Store is the read StoreDetail makes after check#Record.
feature("a store-limited staff member is refused another store of the same organization; another organization's manager too", {
    given() {
        system(() => {
            if (!ec.entity.find("mantle.product.store.ProductStore").condition("productStoreId", "BOSS_COM_P2_SECOND").one())
                ec.service
                    .sync()
                    .name("create#mantle.product.store.ProductStore")
                    .parameters({
                        productStoreId: "BOSS_COM_P2_SECOND",
                        storeName: "Retail second store",
                        organizationPartyId: ids.organizationId
                    })
                    .call()
        })
    },
    when() {
        const read = (user, productStoreId) =>
            asUser(user, () => refusal("mantle.product.StoreAdminServices.get#Store", {productStoreId}), false)
        const checked = (user, recordId) => asUser(user, () => refusal(context + "check#Record", {recordType: "store", recordId}))
        return {
            reader: read(users.read, "BOSS_COM_P2_SECOND"),
            readerCheck: checked(users.read, "BOSS_COM_P2_SECOND"),
            staff: read(users.storeStaff, "BOSS_COM_P2_SECOND"),
            staffCheck: checked(users.storeStaff, "BOSS_COM_P2_SECOND"),
            staffOwn: read(users.storeStaff, ids.storeId),
            other: read(users.services, "BOSS_COM_P2_SECOND")
        }
    },
    then({reader, readerCheck, staff, staffCheck, staffOwn, other}) {
        reader == ""
        readerCheck == ""
        staff.includes("RECORD_UNAVAILABLE")
        staffCheck.includes("RECORD_UNAVAILABLE")
        staffOwn == ""
        other.includes("RECORD_UNAVAILABLE")
    }
})
