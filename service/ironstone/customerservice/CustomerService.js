// The Customer Service app's access (impl-customer-service §2, §4, P1; design-customer-service §1): the user's service
// organizations, their capabilities, own and borrowed, the queues and teams they work, the customers they may serve, the
// record checks every Customer Service screen and shared mount runs before a Mantle service, the drop-downs, the palette and
// record links. No entity filter covers OrderHeader, Request or CommunicationEvent (F2), so a sales order (and, from P2, a
// case) is checked here by its organization and customer; the Mantle services check their own permission and organization
// again, and nothing here grants what Mantle refuses.
//
// Later phases extend the tables below rather than the functions: capabilityPermissions (a capability from a Moqui
// permission), areas (the menu areas whose authorization is a capability), recordKinds (a kind of record: its check and,
// once built, its screen), searchFinds (the palette), choiceSources (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/CustomerService.xml"
const areaLocation = area => "component://mr-boss/screen/CustomerService/" + area + ".xml"
const choiceLimit = 30

// ===== capabilities =====
// Each capability from the Moqui permission the Mantle services check (§2, §4, design §1). The borrowed ones are their
// owners' grants: Warehouse's receive, inspect and dispose (W), Accounting's credit, refund and return credit (F), and the
// credit read Accounting seeds. `read` is the root grant, and the area capabilities below are the authorizations of the menu
// areas.
const capabilityPermissions = {
    caseEdit: "SUPPORT_CASE_EDIT",
    caseManage: "SUPPORT_CASE_MANAGE",
    policyEdit: "SUPPORT_POLICY_EDIT",
    knowledgeEdit: "SUPPORT_KNOWLEDGE_EDIT",
    contactInvite: "SUPPORT_CONTACT_INVITE",
    orderChangeRequest: "ORDER_CHANGE_REQUEST",
    orderChangeApprove: "ORDER_CHANGE_APPROVE",
    orderChangeApply: "ORDER_CHANGE_APPLY",
    orderHoldRelease: "ORDER_CHANGE_HOLD_RELEASE",
    returnAuthorize: "RETURN_AUTHORIZE",
    returnExceptionApprove: "RETURN_EXCEPTION_APPROVE",
    returnPolicyEdit: "RETURN_POLICY_EDIT",
    warrantyApprove: "WARRANTY_APPROVE",
    creditRead: "CUSTOMER_CREDIT_VIEW",
    // borrowed (crosscut §1.4)
    receive: "STOCK_RECEIVE",
    inspect: "QUALITY_INSPECT",
    dispose: "QUALITY_DISPOSE",
    invoiceCredit: "RECEIVABLE_EDIT",
    paymentRefund: "PAYMENT_EDIT",
    returnCredit: "RETURN_CREDIT_APPROVE"
}
// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_CS_<Area>): Returns and Reports for the
// agent, manager and return authorizer, Approvals for the manager and return authorizer, Settings for the administrator.
// Home, Cases, Customers, Orders, Availability and Knowledge are every Customer Service user's.
const areas = {
    returns: "Returns",
    approvals: "Approvals",
    reports: "Reports",
    settings: "Settings"
}

// ===== scope =====
// The user's authorizations on a Customer Service screen, read directly so disabled or inherited artifact authorization
// cannot widen them (as Purchasing.js): screenAuthz reads the groups' screen authorizations once, and screenGrants picks a
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
// reaches every organization (the active one when there is one); any other grant is limited to the user's organizations, so
// a grant set up without filters fails closed. A Projects client contact (PROJECT_CLIENT) never opens Customer Service.
function rootGrants() {
    const none = {read: false, unrestricted: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, unrestricted: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    if (!root.allowed.length) return none
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

// The scope of the current user: their service organizations (the vendors of the sales orders and the owners of the
// customers they may serve; null for every organization), the queues and teams they work (P2 fills them from the queue and
// team records; until then none), and their capabilities. The owners are filterOrgIds kept to the organizations the user
// belongs to, as Purchasing; the administrator works in the active organization, or in every one with none active.
function scope() {
    const grants = rootGrants()
    // a user without Customer Service has no organizations here (record links ask this of every user)
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
        // the service queues and agent teams the user works (P2: an agent's teams' queues, a manager's managed teams)
        queueIds: [],
        teamIds: [],
        partyId: ec.user.userAccount?.partyId || null,
        capabilities
    }
}
function required(userScope = scope()) {
    if (!userScope.read) denied("CUSTOMER_SERVICE_UNAVAILABLE", "Customer Service is not available")
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
// The internal organizations a sales record may name: the user's (null for every one).
function vendorIds(userScope) {
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}

// ===== customers =====
// A customer the user may serve (§2, design §1): a Customer-role party that is not an internal organization, not someone's
// private contact, whose owner is one of the user's organizations or shared (_NA_), as the organization filters pass a Party
// and as Purchasing's supplier scope. A party's owner defaults to _NA_, so Mantle's ORG_ACME is a shared customer (F-P1-1).
function customerOf(userScope, partyId) {
    const party = partyId ? one("mantle.party.Party", {partyId}) : null
    if (!party || party.disabled === "Y") return null
    if (party.privateOwnerUserId && party.privateOwnerUserId !== ec.user.userId) return null
    if (!hasRole(partyId, "Customer") || isInternal(partyId)) return null
    return party.ownerPartyId === "_NA_" || owns(userScope, party.ownerPartyId) ? party : null
}
// The Customer-role parties a find may list, limited in the query to the user's owners and the shared ones.
function customerFind(userScope) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.party.PartyDetailAndRole", {roleTypeId: "Customer"}).condition(
        factory.makeCondition(
            [factory.makeCondition("disabled", "is-null", null), factory.makeCondition("disabled", "equals", "N")],
            "or"
        )
    )
    if (userScope.ownerIds) query = query.condition("ownerPartyId", "in", ["_NA_"].concat(userScope.ownerIds))
    return query.condition(
        factory.makeCondition(
            [
                factory.makeCondition("privateOwnerUserId", "is-null", null),
                factory.makeCondition("privateOwnerUserId", "equals", ec.user.userId || "_NA_")
            ],
            "or"
        )
    )
}

// ===== shared context =====
// The Customer Service routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: the areas of the menu (design §1)
    "Home",
    "Cases",
    "Customers",
    "Orders",
    "Returns",
    "Approvals",
    "Availability",
    "Knowledge",
    "Reports",
    "Settings"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "CustomerService")
        denied("CUSTOMER_SERVICE_CONTEXT", "Customer Service context is not available")
    const userScope = required()
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: userScope.organizationPartyIds,
        activeOrganizationPartyId: userScope.activeOrganizationPartyId,
        allOrganizations: !userScope.ownerIds,
        queueIds: userScope.queueIds,
        teamIds: userScope.teamIds,
        appRoot: "CustomerService",
        linkBase: "//CustomerService",
        webBase: "/qapps/CustomerService",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//CustomerService/" + path]))
    }
}

// ===== record kinds =====
// A sales order: a part's vendor is an internal organization (the record's owner) and its customer is not; every customer it
// names must be one the user serves.
function readOrder(orderId) {
    const order = one("mantle.order.OrderHeader", {orderId})
    const parts = order ? rows("mantle.order.OrderPart", {orderId}) : []
    if (!order || !parts.length) return null
    if (!parts.every(part => isInternal(part.vendorPartyId) && !isInternal(part.customerPartyId))) return null
    const customerIds = Array.from(new Set(parts.map(part => part.customerPartyId).filter(Boolean)))
    return {
        owners: parts.map(part => part.vendorPartyId),
        customers: customerIds,
        label: order.orderName || orderId,
        detail: [customerIds.map(partyName).join(", "), statusText(order.statusId)].filter(Boolean).join(" · ")
    }
}
// A customer by itself: no organization of its own beyond its owner, checked as a customer in scope.
function readCustomer(partyId) {
    const party = one("mantle.party.Party", {partyId})
    if (!party || !hasRole(partyId, "Customer") || isInternal(partyId)) return null
    return {owners: [], customers: [partyId], shared: true, label: partyName(partyId), detail: party.pseudoId || ""}
}

// Each kind a Customer Service screen, mount, palette or record link may be given: its name, icon, the screen that opens it
// (destination, the path and id parameter under the root; null until its phase builds it, and then the record opens Home's
// lookup) and its read (a record answers its owners (service organizations) and customers, a label and a detail, or null
// when there is no such record). P2 adds the case, P9 the return, P11 the warranty claim; P3 sets the destinations.
const recordKinds = {
    order: {name: "Sales order", icon: "sym_o_receipt_long", destination: null, read: readOrder},
    customer: {name: "Customer", icon: "sym_o_person", destination: null, read: readCustomer}
}

// A record the user may work with: every organization it names is one of theirs and every customer it names is one they
// serve; one that names no organization is refused unless it is a customer or the user works in every organization. A
// missing record and one outside the scope are refused alike (RECORD_UNAVAILABLE), so a forged id learns nothing.
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    const found = definition.read(recordId)
    if (!found) unavailable()
    const owners = found.owners.filter(owner => owner !== undefined)
    const allowed =
        (owners.length > 0 || found.shared || !userScope.ownerIds) &&
        owners.every(owner => owns(userScope, owner)) &&
        found.customers.every(partyId => !!customerOf(userScope, partyId))
    if (!allowed) unavailable()
    return {recordType: kind, recordId, kindName: definition.name, label: found.label, detail: found.detail}
}

// check#Record: a record a Customer Service screen or mount was given, refused unless the user may work with it and, when a
// capability is named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(capabilityPermissions, p.capability))
            throw new Error("Unknown Customer Service capability " + p.capability)
        if (!userScope.capabilities[p.capability])
            denied("PERMISSION_DENIED", capabilityPermissions[p.capability] + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// The Customer Service screen of a record: its kind's destination, else Home's lookup of it.
function recordUrl(kind, recordId) {
    const destination = recordKinds[kind]?.destination
    if (destination) return "/qapps/CustomerService/" + destination + encodeURIComponent(recordId)
    return "/qapps/CustomerService/Home?lookupType=" + kind + "&lookupId=" + encodeURIComponent(recordId)
}
// The Customer Service link of a record the user may work with, else null (get#RecordLink).
function recordLink(kind, recordId) {
    try {
        const userScope = scope()
        if (!userScope.read) return null
        recordOf(userScope, kind, recordId)
        return recordUrl(kind, recordId)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
            ec.logger.warn("Customer Service link of " + kind + " " + recordId + ": " + error.message)
        return null
    }
}
// Whether an order is a sales order (every part sold by an internal organization to an outside party), for get#RecordLink.
function isSalesOrder(orderId) {
    const parts = rows("mantle.order.OrderPart", {orderId})
    return parts.length > 0 && parts.every(part => isInternal(part.vendorPartyId) && !isInternal(part.customerPartyId))
}

// ===== palette =====
// The finds of the palette (design §1: permitted cases, customers, orders and RMAs): each kind by its id and names, ignoring
// case, limited in the query to the user's organizations or customer scope, and each row checked again by recordOf. P2 adds
// cases, P9 returns.
const searchFinds = [
    {
        kind: "order",
        query: (userScope, condition) =>
            find("mantle.order.OrderHeaderAndPart")
                .condition("vendorPartyId", "in", vendorIds(userScope))
                .condition(condition(["orderId", "orderName", "externalId", "otherPartyOrderId"]))
                .selectField("orderId")
                .distinct(true)
                .orderBy("orderId"),
        idField: "orderId"
    },
    {
        kind: "customer",
        query: (userScope, condition) =>
            customerFind(userScope)
                .condition(condition(["partyId", "pseudoId", "organizationName", "firstName", "lastName"]))
                .selectField("partyId")
                .distinct(true)
                .orderBy("partyId"),
        idField: "partyId"
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
            ec.logger.error("Customer Service palette " + definition.kind + " search failed: " + error.message)
        }
        // each row on its own: one that fails or is out of scope is left out and the others still show
        for (const row of rowsFound) {
            const recordId = row[definition.idField]
            try {
                const record = recordOf(userScope, definition.kind, recordId)
                const url = recordUrl(definition.kind, recordId)
                if (!found.has(url))
                    found.set(url, {
                        title: (record.label && record.label !== recordId ? record.label + " · " : "") + recordId,
                        subtitle: [record.kindName, record.detail].filter(Boolean).join(" · "),
                        icon: recordKinds[definition.kind].icon,
                        url
                    })
            } catch (error) {
                if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                    ec.logger.error("Customer Service palette " + definition.kind + " " + recordId + ": " + error.message)
            }
        }
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== choices =====
// Each Customer Service drop-down: its options for the user, the term and the selected value, with the selected value's
// label when it is in scope but not on the page. Later phases add sources (queues, teams, case types).
const choiceSources = {
    // the customers the user may serve (their organizations' and the shared ones)
    customers: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = customerFind(userScope).selectField("partyId").distinct(true).orderBy("partyId").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["partyId", "pseudoId", "organizationName", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({value: row.partyId, label: partyName(row.partyId)}))
        if (selected && !options.some(option => option.value === selected) && customerOf(userScope, selected))
            options.push({value: selected, label: partyName(selected)})
        return options
    },
    // the user's service organizations (internal organizations they belong to, or every one for the administrator)
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
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Customer Service choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

const operations = {sharedContext, checkRecord, search, choices}
;({
    recordLink,
    isSalesOrder,
    // the scope for a phase's own module and the shared mounts' Customer Service branch: the user's scope, the same refusing
    // a user without Customer Service, the customer checks, a record's check and its Customer Service link
    scope,
    required,
    owns,
    customerOf,
    customerFind,
    recordOf,
    recordUrl,
    // whether a kind has its Customer Service screen yet (get#RecordLink leaves a customer to Commons until it has)
    hasScreen: kind => !!recordKinds[kind]?.destination,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service operation " + op)
        return operations[op](parameters)
    }
})
