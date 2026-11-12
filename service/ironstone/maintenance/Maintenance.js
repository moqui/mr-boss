// The Maintenance app's access and context (impl-maintenance §2, P1; design-maintenance §1.1, §1.2): who may open Maintenance,
// their capabilities and organizations, the record check every Maintenance screen and shared mount runs before a Mantle service,
// the drop-downs, the palette and the canonical links. The scope itself is Mantle's (mantle/work/MaintenanceAccess.js: the
// maintenance permissions, the user's organizations, a facility's, an asset's and a work order's organization, assignment), read
// once per call here; the Mantle services check it again, and nothing here grants what Mantle refuses.
//
// Opening Maintenance needs the root grant of one of the user's groups (BOSS_MAINTENANCE, the root user group, or
// BOSS_MAINTENANCE_ADMIN), read directly so an inherited or disabled authorization cannot widen it (impl-admin F35, as People.js);
// the root grant opens navigation only. A system administrator (ADMIN) opens everything. A Projects client contact
// (PROJECT_CLIENT) never opens Maintenance, a PASS public account holds no BOSS group, and BOSS_MAINTENANCE_REQUEST has no root
// grant (a requester reports from Commons, P4).
//
// Later phases extend the tables below rather than the functions: areas (menu areas whose authorization is a capability),
// recordKinds (a kind of record: its check and, once built, its screen), searchFinds (the palette), choiceSources (the
// drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenanceAccess = ec.resource.script("component://mr-mantle/service/mantle/work/MaintenanceAccess.js")
const {find, one, denied} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Maintenance.xml"
const areaLocation = area => "component://mr-boss/screen/Maintenance/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100

// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_MNT_<Area>): Settings the Maintenance
// administrator's (P1). Home is every Maintenance user's.
const areas = {
    settings: "Settings"
}

// ===== scope =====
// The user's screen authorizations, read directly (as People.js): screenAuthz reads the groups' rows once, and screenGrants
// picks a screen's from them (ALWAYS over DENY over ALLOW).
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
    return {found: grants.length > 0, allowed, always: always.length > 0}
}
function rootGrants() {
    const none = {read: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    return {read: root.allowed.length > 0, rootAlways: root.always, authzRows}
}
// An area's grant: the root's ALWAYS (the Maintenance administrator's, ADMIN's) passes every area below it; otherwise the area's
// own rows decide when it has any, else the root's.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's maintenance scope and the areas. Without the root grant nothing of
// Mantle's scope is read.
function scope() {
    const grants = rootGrants()
    const mantle = grants.read ? maintenanceAccess.scope() : null
    const capabilities = Object.assign({read: grants.read}, mantle?.capabilities || {})
    for (const [name, area] of Object.entries(areas)) capabilities[name] = areaGrant(grants, area)
    return {read: grants.read, mantle: mantle || {organizationPartyIds: [], capabilities: {}}, capabilities}
}
function required(userScope = scope()) {
    if (!userScope.read) denied("MAINTENANCE_UNAVAILABLE", "Maintenance is not available")
    return userScope
}
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}
function facilityName(facilityId) {
    const facility = facilityId ? one("mantle.facility.Facility", {facilityId}) : null
    return facility?.facilityName || facilityId || ""
}
// The organizations of the scope: its list, or every internal organization when it is every one (null).
function organizationIds(userScope) {
    const ids = userScope.mantle.organizationPartyIds
    if (ids != null) return Array.from(ids)
    return Array.from(find("mantle.party.PartyRole").condition("roleTypeId", "OrgInternal").selectField("partyId").list()).map(
        row => row.partyId
    )
}
const covers = (userScope, partyId) => maintenanceAccess.covers(userScope.mantle, partyId)
// Organizations as options, by name, searched in the query ignoring case.
function organizationOptions(partyIds, term, limit) {
    if (!partyIds.length) return []
    let query = find("mantle.party.Organization").condition("partyId", "in", partyIds).orderBy("^organizationName").limit(limit)
    if (term) {
        const factory = ec.entity.conditionFactory
        query = query.condition(
            factory.makeCondition(
                ["partyId", "organizationName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    }
    return Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
}

// ===== shared context =====
// The Maintenance routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: Home and Settings (design §1.2)
    "Home",
    "Settings"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Maintenance") denied("MAINTENANCE_CONTEXT", "Maintenance context is not available")
    const userScope = required()
    const mantle = userScope.mantle
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: organizationIds(userScope),
        activeOrganizationPartyId: mantle.activeOrganizationPartyId || null,
        allOrganizations: !!mantle.allOrganizations,
        organizationOptions: organizationOptions(organizationIds(userScope), null, organizationOptionLimit),
        partyId: mantle.partyId || null,
        appRoot: "Maintenance",
        linkBase: "//Maintenance",
        webBase: "/qapps/Maintenance",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Maintenance/" + path]))
    }
}
// get#Capabilities: the user's Maintenance capabilities (the permissions, the derived reads and the areas); a user without
// Maintenance holds none and is told so by read false, not refused, so a shared screen or Commons can ask.
function capabilitiesOf() {
    return {capabilities: scope().capabilities}
}

// ===== record kinds =====
// Each kind a Maintenance screen or mount may be given: its name, icon, screen (once built) and its check, which refuses a record
// that does not exist and one outside the scope alike (RECORD_UNAVAILABLE). P1: an organization, a facility and an asset (their
// screens are P2's); later phases add theirs (a work order, a procedure, a plan).
const recordKinds = {
    organization: {
        name: "Organization",
        icon: "sym_o_corporate_fare",
        destination: null,
        read: (userScope, partyId) => {
            if (!userScope.capabilities.anyRead || !covers(userScope, partyId)) return null
            return {organizationPartyId: partyId, label: organizationName(partyId), detail: "Organization"}
        }
    },
    facility: {
        name: "Facility",
        icon: "sym_o_domain",
        destination: null,
        read: (userScope, facilityId) => {
            const found = maintenanceAccess.requireFacility(userScope.mantle, facilityId)
            return {
                organizationPartyId: found.organizationPartyId,
                label: facilityName(facilityId),
                detail: organizationName(found.organizationPartyId)
            }
        }
    },
    asset: {
        name: "Equipment",
        icon: "sym_o_build",
        destination: null,
        read: (userScope, assetId) => {
            const found = maintenanceAccess.requireAsset(userScope.mantle, assetId)
            const asset = one("mantle.product.asset.Asset", {assetId})
            return {
                organizationPartyId: found.organizationPartyId,
                label: asset.assetName || assetId,
                detail: [facilityName(asset.facilityId), organizationName(found.organizationPartyId)].filter(Boolean).join(" · ")
            }
        }
    }
}
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    let found
    try {
        found = definition.read(userScope, recordId)
    } catch (error) {
        // Mantle's refusals of a record (missing, outside the scope, no read) are one answer here
        if (["RECORD_UNAVAILABLE", "PERMISSION_DENIED", "ORGANIZATION_DENIED"].includes(lib.reasonCode(error))) unavailable()
        throw error
    }
    if (!found) unavailable()
    return {
        recordType: kind,
        recordId,
        kindName: definition.name,
        organizationPartyId: found.organizationPartyId,
        label: found.label,
        detail: found.detail
    }
}
// check#Record: a record a Maintenance screen or mount was given, refused unless the user may see it and, when a capability is
// named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(userScope.capabilities, p.capability))
            throw new Error("Unknown Maintenance capability " + p.capability)
        if (!userScope.capabilities[p.capability]) denied("PERMISSION_DENIED", "Maintenance " + p.capability + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== choices =====
// Each Maintenance drop-down: its options for the user, searched in the query ignoring case, with the selected value's label when
// it is in scope but not on the page. An unknown choice throws. Later phases add sources (teams, equipment, templates).
function withSelected(options, selected, admits, label) {
    if (selected && !options.some(option => option.value === selected) && admits(selected))
        options.push({value: selected, label: label(selected)})
    return options
}
const choiceSources = {
    // the organizations of the user's maintenance scope
    organizations: (userScope, term, selected) =>
        withSelected(
            organizationOptions(organizationIds(userScope), term, choiceLimit),
            selected,
            partyId => covers(userScope, partyId),
            organizationName
        ),
    // the facilities the organizations own (one organization's with organizationPartyId), for an equipment or facility reader; a
    // facility under an owned one that names no owner of its own is offered as selected
    facilities: (userScope, term, selected, p) => {
        if (!userScope.capabilities.resourceRead) return []
        const ownerIds = p?.organizationPartyId
            ? covers(userScope, p.organizationPartyId)
                ? [p.organizationPartyId]
                : []
            : organizationIds(userScope)
        if (!ownerIds.length) return []
        let query = find("mantle.facility.Facility")
            .condition("ownerPartyId", "in", ownerIds)
            .selectField(["facilityId", "facilityName"])
            .orderBy("^facilityName")
            .limit(choiceLimit)
        if (term) {
            const factory = ec.entity.conditionFactory
            query = query.condition(
                factory.makeCondition(
                    ["facilityId", "facilityName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        }
        const options = Array.from(query.list()).map(row => ({value: row.facilityId, label: row.facilityName || row.facilityId}))
        return withSelected(
            options,
            selected,
            facilityId => {
                try {
                    return !!recordOf(userScope, "facility", facilityId)
                } catch (error) {
                    return false
                }
            },
            facilityName
        )
    }
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Maintenance choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's Maintenance records, each opening its Maintenance screen, with recordEntity and recordId for Assist's search.
// None yet: equipment and facilities join with their screens (P2), work orders (P3), procedures (P6).
const searchFinds = []
function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const found = new Map()
    for (const definition of searchFinds) {
        let rowsFound = []
        try {
            rowsFound = definition.rows(userScope, text, limit)
        } catch (error) {
            ec.logger.error("Maintenance palette " + definition.kind + " search failed: " + error.message)
        }
        for (const row of rowsFound) if (!found.has(row.url)) found.set(row.url, row)
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

const operations = {sharedContext, capabilities: capabilitiesOf, checkRecord, choices, search}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance operation " + op)
    return operations[op](p || {})
}
;({execute: run})
