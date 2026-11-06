// The Commerce app's context (impl-commerce §2, §4, P1; design-commerce §1.1): the user's organizations and stores, their
// capabilities, the record checks every Commerce screen and shared mount runs before a Mantle service, the drop-downs, the
// palette and record links. ProductStore is filtered by its organization, but no entity filter covers its child records, the
// store's orders, its sites or a store-limited staff member's stores (F9, F-P1-1), so a store (and a site, order, cart or
// customer) is checked here by its organization and store; the Mantle services check their own permission and the store's
// organization again, and nothing here grants what Mantle refuses.
//
// Store scope (§4): a store is in scope when its organization is one of the user's (the active one, or every one, for the
// administrator); a user with a current StoreStaff ProductStoreParty row is limited to those stores. A store assignment
// grants no permission.
//
// Later phases extend the tables below rather than the functions: capabilityPermissions (a capability from a Moqui
// permission), areas (the menu areas whose authorization is a capability), recordKinds (a kind of record: its read and,
// once built, its screen), searchFinds (the palette), choiceSources (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Commerce.xml"
const areaLocation = area => "component://mr-boss/screen/Commerce/" + area + ".xml"
const choiceLimit = 30
const storeOptionLimit = 100
const staffRole = "StoreStaff"

// ===== capabilities =====
// Each capability from the Moqui permission the Mantle services check (design §1.1's table). `read` is the root grant with
// COMMERCE_VIEW; the borrowed reads are Products' (the shared catalog screens, P3); the area capabilities below are the
// authorizations of the menu areas.
const capabilityPermissions = {
    view: "COMMERCE_VIEW",
    storeEdit: "COMMERCE_STORE_EDIT",
    merchandise: "COMMERCE_MERCHANDISE",
    publish: "COMMERCE_PUBLISH",
    themeEdit: "COMMERCE_THEME_EDIT",
    themeCode: "COMMERCE_THEME_CODE",
    themePublish: "COMMERCE_THEME_PUBLISH",
    orderView: "COMMERCE_ORDER_VIEW",
    recovery: "COMMERCE_RECOVERY",
    promotionEdit: "COMMERCE_PROMOTION_EDIT",
    channelOperate: "COMMERCE_CHANNEL_OPERATE",
    subscriptionManage: "COMMERCE_SUBSCRIPTION_MANAGE",
    // borrowed (crosscut §1.4): the product master and price reads of Products' shared screens
    catalogView: "PRODUCT_CATALOG_VIEW",
    priceView: "PRICE_VIEW"
}
// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_COM_<Area>): Website for the merchandiser,
// designer, theme developer and publisher; Orders and Customers for the store and subscription operators; Integrations for
// the channel operator; Reports for the manager and the operators; Settings for the manager. Home, Stores, Merchandising
// and Promotions are every Commerce user's.
const areas = {
    website: "Website",
    orders: "Orders",
    customers: "Customers",
    integrations: "Integrations",
    reports: "Reports",
    settings: "Settings"
}

// ===== scope =====
// The user's authorizations on a Commerce screen, read directly so disabled or inherited artifact authorization cannot
// widen them (as CustomerService.js): screenAuthz reads the groups' screen authorizations once, and screenGrants picks a
// screen's from them (ALWAYS over DENY over ALLOW).
function screenAuthz(groupIds) {
    return Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    )
}
function screenGrants(location, authzRows) {
    const grants = authzRows.filter(row =>
        row.nameIsPattern === "Y" ? new RegExp("^(?:" + row.artifactName + ")$").test(location) : row.artifactName === location
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    return {found: grants.length > 0, allowed}
}
// Only a system administrator, or an authorization whose filter sets name MANTLE_ACTIVE_ORG (the administrator group's),
// reaches every organization (the active one when there is one); any other grant is limited to the user's organizations,
// so a grant set up without filters fails closed. The root grant also needs COMMERCE_VIEW, so a deployment that gives the
// root and not the read opens nothing. A Projects client contact (PROJECT_CLIENT) never opens Commerce, and a PASS public
// account holds no BOSS group.
function rootGrants() {
    const none = {read: false, unrestricted: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, unrestricted: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    if (!root.allowed.length || !access.has(capabilityPermissions.view)) return none
    const activeOrg = authzId =>
        rows("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: authzId}).some(
            row => row.entityFilterSetId === "MANTLE_ACTIVE_ORG"
        )
    return {read: true, unrestricted: root.allowed.some(row => activeOrg(row.artifactAuthzId)), authzRows}
}
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}
// The stores of the user's current StoreStaff rows (§4), or null when there are none and the user works every store of
// their organizations. A system administrator is never limited.
function staffStoreIds(partyId) {
    if (!partyId) return null
    const ids = rows("mantle.product.store.ProductStoreParty", {partyId, roleTypeId: staffRole})
        .filter(row => lib.active(row))
        .map(row => row.productStoreId)
    return ids.length ? Array.from(new Set(ids)) : null
}

// The scope of the current user: their organizations (the owners of the stores they may work; null for every
// organization), the stores a store-limited staff member is limited to (null for none), and their capabilities. The owners
// are filterOrgIds kept to the organizations the user belongs to, as Customer Service; the administrator works in the
// active organization, or in every one with none active.
function scope() {
    const grants = rootGrants()
    // a user without Commerce has no organizations here (record links ask this of every user)
    const organization = grants.read ? call("mantle.party.PartyServices.get#PartyOrganizationInfo") : {}
    const memberIds = Array.from(organization.userOrgIds || [])
    const filterIds = Array.from(organization.filterOrgIds || []).filter(partyId => memberIds.includes(partyId))
    const ownerIds = grants.unrestricted
        ? organization.activeOrgId
            ? [organization.activeOrgId]
            : null
        : filterIds.length
          ? filterIds
          : memberIds
    const partyId = ec.user.userAccount?.partyId || null
    const capabilities = {read: grants.read}
    for (const [name, permission] of Object.entries(capabilityPermissions))
        capabilities[name] = grants.read && access.has(permission)
    for (const [name, area] of Object.entries(areas)) capabilities[name] = areaGrant(grants, area)
    return {
        read: grants.read,
        unrestricted: grants.unrestricted,
        organizationPartyIds: memberIds,
        activeOrganizationPartyId: grants.unrestricted
            ? organization.activeOrgId || null
            : memberIds.includes(organization.activeOrgId)
              ? organization.activeOrgId
              : null,
        ownerIds,
        storeLimit: grants.read && !grants.systemAdmin ? staffStoreIds(partyId) : null,
        partyId,
        capabilities
    }
}
function required(userScope = scope()) {
    if (!userScope.read) denied("COMMERCE_UNAVAILABLE", "Commerce is not available")
    return userScope
}
const owns = (userScope, partyId) => !userScope.ownerIds || (!!partyId && userScope.ownerIds.includes(partyId))
const hasRole = (partyId, roleTypeId) => !!partyId && !!one("mantle.party.PartyRole", {partyId, roleTypeId})
const isInternal = partyId => hasRole(partyId, "OrgInternal")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function partyName(partyId) {
    if (!partyId) return ""
    const organization = one("mantle.party.Organization", {partyId})
    if (organization?.organizationName) return organization.organizationName
    const person = one("mantle.party.Person", {partyId})
    const name = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : ""
    return name || partyId
}
// The internal organizations a store may belong to: the user's (null for every one).
function vendorIds(userScope) {
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}

// ===== stores =====
// The stores the user works, in the query: the user's organizations' stores, and for a store-limited staff member only
// theirs. ProductStore has no status (F9), so every store of the organization is listed.
function storeFind(userScope) {
    let query = find("mantle.product.store.ProductStore")
    if (userScope.ownerIds) query = query.condition("organizationPartyId", "in", userScope.ownerIds)
    if (userScope.storeLimit) query = query.condition("productStoreId", "in", userScope.storeLimit)
    return query
}
// A store the user works, or null: it exists, its organization is one of theirs, and it is one of a store-limited staff
// member's stores.
function storeIn(userScope, productStoreId) {
    const store = productStoreId ? one("mantle.product.store.ProductStore", {productStoreId}) : null
    if (!store || !owns(userScope, store.organizationPartyId)) return null
    if (userScope.storeLimit && !userScope.storeLimit.includes(productStoreId)) return null
    return store
}
const storeLabel = store => store.storeName || store.productStoreId
// The user's stores as drop-down options, by name, with their organization when the user works in more than one.
function storeOptions(userScope, term, limit) {
    const factory = ec.entity.conditionFactory
    let query = storeFind(userScope).orderBy("storeName").limit(limit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["productStoreId", "storeName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const several = !userScope.ownerIds || userScope.ownerIds.length > 1
    return Array.from(query.list()).map(store => ({
        value: store.productStoreId,
        label: storeLabel(store) + (several ? " · " + partyName(store.organizationPartyId) : "")
    }))
}

// ===== customers =====
// A customer the user may work with (as Customer Service's customerOf): a Customer-role party that is not an internal
// organization, not someone's private contact, whose owner is one of the user's organizations or shared (_NA_). A
// store-limited staff member reaches only a customer with an order in their stores.
function customerOf(userScope, partyId) {
    const party = partyId ? one("mantle.party.Party", {partyId}) : null
    if (!party || party.disabled === "Y") return null
    if (party.privateOwnerUserId && party.privateOwnerUserId !== ec.user.userId) return null
    if (!hasRole(partyId, "Customer") || isInternal(partyId)) return null
    if (party.ownerPartyId !== "_NA_" && !owns(userScope, party.ownerPartyId)) return null
    if (userScope.storeLimit) {
        const orders = find("mantle.order.OrderHeaderAndPart")
            .condition("customerPartyId", partyId)
            .condition("productStoreId", "in", userScope.storeLimit)
            .count()
        if (!orders) return null
    }
    return party
}

// ===== shared context =====
// The Commerce routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: the areas of the menu (design §1.2)
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
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Commerce") denied("COMMERCE_CONTEXT", "Commerce context is not available")
    const userScope = required()
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: userScope.organizationPartyIds,
        activeOrganizationPartyId: userScope.activeOrganizationPartyId,
        allOrganizations: !userScope.ownerIds,
        storeLimited: !!userScope.storeLimit,
        storeOptions: storeOptions(userScope, null, storeOptionLimit),
        appRoot: "Commerce",
        linkBase: "//Commerce",
        webBase: "/qapps/Commerce",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Commerce/" + path]))
    }
}

// ===== record kinds =====
// A store: its organization and itself.
function readStore(productStoreId) {
    const store = one("mantle.product.store.ProductStore", {productStoreId})
    if (!store) return null
    return {
        owners: [store.organizationPartyId],
        stores: [productStoreId],
        label: storeLabel(store),
        detail: partyName(store.organizationPartyId)
    }
}
// A PASS site: the organizations its targeted mounts serve (Billing, Support) and the stores its Shop mounts sell from (Shop
// P1). A site with neither belongs to no organization and is refused unless the user works in every one.
function readSite(siteId) {
    const site = one("mantle.public.PublicSite", {siteId})
    if (!site) return null
    const mounts = rows("mantle.public.PublicSiteApp", {siteId}).filter(mount => mount.targetId)
    const stores = mounts
        .filter(mount => mount.app === "shop" && one("mantle.product.store.ProductStore", {productStoreId: mount.targetId}))
        .map(mount => mount.targetId)
    const owners = mounts.filter(mount => mount.app !== "shop" && isInternal(mount.targetId)).map(mount => mount.targetId)
    const hosts = rows("mantle.public.PublicSiteHost", {siteId}).map(host => host.hostname)
    return {
        owners: Array.from(new Set(owners)),
        stores: Array.from(new Set(stores)),
        // a store-limited staff member reaches a site only through one of their stores
        storeBound: true,
        label: site.name || siteId,
        detail: [hosts.join(", "), site.state].filter(Boolean).join(" · ")
    }
}
// A store's order (open: a cart): its vendors and its store. An order of no store is not Commerce's.
function readStoreOrder(orderId, cart) {
    const order = one("mantle.order.OrderHeader", {orderId})
    if (!order || !order.productStoreId || (order.statusId === "OrderOpen") !== cart) return null
    const parts = rows("mantle.order.OrderPart", {orderId})
    const customerIds = Array.from(new Set(parts.map(part => part.customerPartyId).filter(Boolean)))
    return {
        owners: Array.from(new Set(parts.map(part => part.vendorPartyId).filter(Boolean))),
        stores: [order.productStoreId],
        label: order.orderName || orderId,
        detail: [customerIds.map(partyName).join(", "), statusText(order.statusId)].filter(Boolean).join(" · ")
    }
}
// A customer, checked by customerOf.
function readCustomer(partyId) {
    const party = one("mantle.party.Party", {partyId})
    if (!party || !hasRole(partyId, "Customer") || isInternal(partyId)) return null
    return {owners: [], stores: [], customer: partyId, label: partyName(partyId), detail: party.pseudoId || ""}
}

// Each kind a Commerce screen, mount, palette or record link may be given: its name, icon, the screen that opens it
// (destination, the path and id parameter under the root; null until its phase builds it: a store opens Home scoped to it
// until StoreDetail, P2; the others have no Commerce link until P8) and its read (owners: the organizations it names;
// stores: the stores it belongs to; or null when there is no such record).
const recordKinds = {
    store: {name: "Store", icon: "sym_o_storefront", destination: null, home: true, read: readStore},
    site: {name: "Site", icon: "sym_o_language", destination: null, read: readSite},
    order: {name: "Store order", icon: "sym_o_receipt_long", destination: null, read: orderId => readStoreOrder(orderId, false)},
    cart: {name: "Cart", icon: "sym_o_shopping_cart", destination: null, read: orderId => readStoreOrder(orderId, true)},
    customer: {name: "Customer", icon: "sym_o_person", destination: null, read: readCustomer}
}

// A record the user may work with: every organization it names is one of theirs and every store it names one they work; a
// customer is one customerOf passes; one that names no organization or store is refused unless the user works in every
// organization; a store-limited staff member reaches a site only through one of their stores. A missing record and one
// outside the scope are refused alike (RECORD_UNAVAILABLE), so a forged id learns nothing.
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    const found = definition.read(recordId)
    if (!found) unavailable()
    const allowed = found.customer
        ? !!customerOf(userScope, found.customer)
        : (found.owners.length > 0 || found.stores.length > 0 || !userScope.ownerIds) &&
          found.owners.every(owner => owns(userScope, owner)) &&
          found.stores.every(productStoreId => !!storeIn(userScope, productStoreId)) &&
          !(found.storeBound && userScope.storeLimit && !found.stores.length)
    if (!allowed) unavailable()
    return {recordType: kind, recordId, kindName: definition.name, label: found.label, detail: found.detail}
}

// check#Record: a record a Commerce screen or mount was given, refused unless the user may work with it and, when a
// capability is named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(capabilityPermissions, p.capability)) throw new Error("Unknown Commerce capability " + p.capability)
        if (!userScope.capabilities[p.capability])
            denied("PERMISSION_DENIED", capabilityPermissions[p.capability] + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// The Commerce screen of a record: its kind's destination, else Home scoped to a store, else none.
function recordUrl(kind, recordId) {
    const definition = recordKinds[kind]
    if (definition?.destination) return "/qapps/Commerce/" + definition.destination + encodeURIComponent(recordId)
    if (definition?.home) return "/qapps/Commerce/Home?productStoreId=" + encodeURIComponent(recordId)
    return null
}
// The Commerce link of a record the user may work with, else null (get#RecordLink).
function recordLink(kind, recordId) {
    try {
        const userScope = scope()
        if (!userScope.read || !recordUrl(kind, recordId)) return null
        recordOf(userScope, kind, recordId)
        return recordUrl(kind, recordId)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
            ec.logger.warn("Commerce link of " + kind + " " + recordId + ": " + error.message)
        return null
    }
}

// ===== palette =====
// The finds of the palette (design §1.2: permitted stores; orders and carts in P8): each kind by its id and names, ignoring
// case, limited in the query to the user's stores, and each row checked again by recordOf.
const searchFinds = [
    {
        kind: "store",
        query: (userScope, condition) =>
            storeFind(userScope)
                .condition(condition(["productStoreId", "storeName"]))
                .selectField("productStoreId")
                .orderBy("productStoreId"),
        idField: "productStoreId"
    }
]
function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const factory = ec.entity.conditionFactory
    const condition = fields =>
        factory.makeCondition(
            fields.map(field => factory.makeCondition(field, "like", likeText(text)).ignoreCase()),
            "or"
        )
    const found = new Map()
    for (const definition of searchFinds) {
        let rowsFound = []
        try {
            rowsFound = Array.from(definition.query(userScope, condition).limit(limit).list())
        } catch (error) {
            ec.logger.error("Commerce palette " + definition.kind + " search failed: " + error.message)
        }
        // each row on its own: one that fails or is out of scope is left out and the others still show
        for (const row of rowsFound) {
            const recordId = row[definition.idField]
            try {
                const record = recordOf(userScope, definition.kind, recordId)
                const url = recordUrl(definition.kind, recordId)
                if (url && !found.has(url))
                    found.set(url, {
                        title: (record.label && record.label !== recordId ? record.label + " · " : "") + recordId,
                        subtitle: [record.kindName, record.detail].filter(Boolean).join(" · "),
                        icon: recordKinds[definition.kind].icon,
                        recordEntity: "mantle.product.store.ProductStore",
                        recordId,
                        url
                    })
            } catch (error) {
                if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                    ec.logger.error("Commerce palette " + definition.kind + " " + recordId + ": " + error.message)
            }
        }
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== choices =====
// Each Commerce drop-down: its options for the user, the term and the selected value, with the selected value's label
// when it is in scope but not on the page. Later phases add sources (store groups, sites, themes).
const choiceSources = {
    // the stores the user works (their organizations', a store-limited staff member's own)
    stores: (userScope, term, selected) => {
        const options = storeOptions(userScope, term, choiceLimit)
        const store = selected && !options.some(option => option.value === selected) ? storeIn(userScope, selected) : null
        if (store) options.push({value: store.productStoreId, label: storeLabel(store)})
        return options
    },
    // the user's organizations (internal organizations they belong to, or every one for the administrator)
    organizations: (userScope, term, selected) => {
        const ids = vendorIds(userScope)
        const options = ids
            .map(partyId => ({value: partyId, label: partyName(partyId)}))
            .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()))
            .sort((a, b) => a.label.localeCompare(b.label))
            .slice(0, choiceLimit)
        if (selected && !options.some(option => option.value === selected) && ids.includes(selected))
            options.push({value: selected, label: partyName(selected)})
        return options
    }
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Commerce choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== store scope =====
// get#StoreScope: the stores the user works (storeIds, by id), whether a store assignment limits them and to which stores
// (staffStoreIds), for the later phases' services, which condition their finds on it as the filters cannot (child records,
// orders, reads with authorization disabled, REST and the search indexes).
function storeScope() {
    const userScope = required()
    return {
        storeLimited: !!userScope.storeLimit,
        staffStoreIds: userScope.storeLimit || [],
        storeIds: Array.from(storeFind(userScope).selectField("productStoreId").orderBy("productStoreId").list()).map(
            row => row.productStoreId
        )
    }
}
// setup#StoreScope: a store-limited staff member's stores in the user context (commerceStoreIds) for the COMMERCE_STORE
// entity filter set on Commerce's authorizations (F50), which applies only when it is set; left unset for a user with no
// current StoreStaff row and for a system administrator. A failure to read them leaves _NA_, so the filter matches nothing.
function setupStoreScope() {
    let storeIds = null
    try {
        storeIds = ec.user.userId && !access.systemAdmin() ? staffStoreIds(ec.user.userAccount?.partyId || null) : null
    } catch (error) {
        ec.logger.error("Commerce store scope of user " + ec.user.userId + " not read, the store filter sees nothing: " + error)
        storeIds = ["_NA_"]
    }
    if (storeIds) ec.user.context.commerceStoreIds = storeIds
    else delete ec.user.context.commerceStoreIds
    return {storeLimited: !!storeIds}
}

const operations = {sharedContext, checkRecord, search, choices, storeScope, setupStoreScope}
;({
    recordLink,
    // the scope for a phase's own module and the shared mounts' Commerce branch: the user's scope, the same refusing a user
    // without Commerce, the store and customer checks, a record's check and its Commerce link
    scope,
    required,
    owns,
    storeIn,
    storeFind,
    storeScope,
    customerOf,
    recordOf,
    recordUrl,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Commerce operation " + op)
        return operations[op](parameters)
    }
})
