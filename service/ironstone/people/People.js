// The People app's context (impl-people §2, P1; design-people §1.1, §1.2): who may open People, their capabilities and scope, the
// record check every People screen and shared mount runs before a Mantle service, the drop-downs, the palette and the canonical
// links. The scope itself is Mantle's (mantle.humanres.PeopleServices.get#Scope: the People permissions, the employers and units
// a staff reader sees, the caller's own employments and live reports), read once per call here; the Mantle services check it
// again, and nothing here grants what Mantle refuses.
//
// Opening People needs the root grant of one of the user's groups (BOSS_PEOPLE, the root user group, or BOSS_PEOPLE_ADMIN), read
// directly so an inherited or disabled authorization cannot widen it (impl-admin F35, as Insights.js); the root grant opens
// navigation only. A system administrator (ADMIN) opens everything. A Projects client contact (PROJECT_CLIENT) never opens
// People, a PASS public account holds no BOSS group, and BOSS_PEOPLE_SELF has no root grant (self-service is Commons', P8).
//
// Later phases extend the tables below rather than the functions: areas (menu areas whose authorization is a capability),
// recordKinds (a kind of record: its read and, once built, its screen), searchFinds (the palette), choiceSources (the
// drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/People.xml"
const areaLocation = area => "component://mr-boss/screen/People/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100

// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_PPL_<Area>): Settings the People
// administrator's (P1). Home is every People user's.
const areas = {
    settings: "Settings"
}

// ===== scope =====
// The user's screen authorizations, read directly (as Insights.js and Commerce.js): screenAuthz reads the groups' rows once, and
// screenGrants picks a screen's from them (ALWAYS over DENY over ALLOW).
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
// An area's grant: the root's ALWAYS (the People administrator's, ADMIN's) passes every area below it; otherwise the area's own
// rows decide when it has any, else the root's.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's People scope and the areas.
function scope() {
    const grants = rootGrants()
    const people = grants.read ? call("mantle.humanres.PeopleServices.get#Scope") : null
    const capabilities = Object.assign({read: grants.read}, people?.capabilities || {})
    for (const [name, area] of Object.entries(areas)) capabilities[name] = areaGrant(grants, area)
    return {read: grants.read, people: people || {}, capabilities}
}
function required(userScope = scope()) {
    if (!userScope.read) denied("PEOPLE_UNAVAILABLE", "People is not available")
    return userScope
}
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}
function personName(partyId) {
    const person = partyId ? one("mantle.party.Person", {partyId}) : null
    const name = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : ""
    return name || partyId || ""
}
const employerIds = userScope => Array.from(userScope.people.organizationPartyIds || [])
const unitIds = userScope => employerIds(userScope).concat(Array.from(userScope.people.unitPartyIds || []))
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
// The People routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: Home and Settings (design §1.2)
    "Home",
    "Settings"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "People") denied("PEOPLE_CONTEXT", "People context is not available")
    const userScope = required()
    const people = userScope.people
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: employerIds(userScope),
        activeOrganizationPartyId: people.activeOrganizationPartyId || null,
        allOrganizations: !!people.allOrganizations,
        organizationOptions: organizationOptions(employerIds(userScope), null, organizationOptionLimit),
        unitPartyIds: Array.from(people.unitPartyIds || []),
        partyId: people.partyId || null,
        employments: Array.from(people.employments || []),
        appRoot: "People",
        linkBase: "//People",
        webBase: "/qapps/People",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//People/" + path]))
    }
}

// ===== record kinds =====
// Each kind a People screen or mount may be given: its name, icon, screen (once built) and its check, which refuses a record
// that does not exist and one outside the scope alike (RECORD_UNAVAILABLE). P1: an employer and a person; later phases add theirs.
const recordKinds = {
    organization: {
        name: "Employer",
        icon: "sym_o_corporate_fare",
        destination: null,
        read: (userScope, partyId) =>
            employerIds(userScope).includes(partyId) ? {label: organizationName(partyId), detail: "Employer"} : null
    },
    person: {
        name: "Person",
        icon: "sym_o_person",
        destination: null,
        read: (userScope, partyId) => {
            // Mantle's scope admits the person (self, team or staff) and names the employments it shows
            const admitted = call("mantle.humanres.PeopleServices.get#Scope", {partyId})
            const employers = Array.from(new Set(Array.from(admitted.partyEmployments || []).map(row => row.organizationPartyId)))
            return {label: personName(partyId), detail: employers.map(organizationName).join(", ")}
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
        if (lib.reasonCode(error) === "RECORD_UNAVAILABLE") unavailable()
        throw error
    }
    if (!found) unavailable()
    return {recordType: kind, recordId, kindName: definition.name, label: found.label, detail: found.detail}
}
// check#Record: a record a People screen or mount was given, refused unless the user may see it and, when a capability is
// named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(userScope.capabilities, p.capability)) throw new Error("Unknown People capability " + p.capability)
        if (!userScope.capabilities[p.capability]) denied("PERMISSION_DENIED", "People " + p.capability + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== choices =====
// Each People drop-down: its options for the user, searched in the query ignoring case, with the selected value's label when it
// is in scope but not on the page. An unknown choice throws. Later phases add sources (positions, job classes, pay groups).
function withSelected(options, selected, admits, label) {
    if (selected && !options.some(option => option.value === selected) && admits(selected))
        options.push({value: selected, label: label(selected)})
    return options
}
const choiceSources = {
    // the employers a staff reader sees
    employers: (userScope, term, selected) =>
        withSelected(
            organizationOptions(employerIds(userScope), term, choiceLimit),
            selected,
            partyId => employerIds(userScope).includes(partyId),
            organizationName
        ),
    // the employers and the departments and teams under them
    units: (userScope, term, selected) =>
        withSelected(
            organizationOptions(unitIds(userScope), term, choiceLimit),
            selected,
            partyId => unitIds(userScope).includes(partyId),
            organizationName
        ),
    // the people in scope: the current employees of the employers a staff reader sees, the caller's live reports and themselves
    // with self-service; by name or id
    people: (userScope, term, selected) => {
        const people = userScope.people
        const factory = ec.entity.conditionFactory
        const reach = []
        if (employerIds(userScope).length)
            reach.push(
                factory.makeCondition(
                    factory.makeCondition("relationshipTypeEnumId", "equals", "PrtEmployee"),
                    "and",
                    factory.makeCondition("toPartyId", "in", employerIds(userScope))
                )
            )
        const own = Array.from(people.reportPartyIds || []).concat(
            people.capabilities?.self && people.partyId ? [people.partyId] : []
        )
        if (own.length)
            reach.push(
                factory.makeCondition(
                    factory.makeCondition("relationshipTypeEnumId", "equals", "PrtEmployee"),
                    "and",
                    factory.makeCondition("fromPartyId", "in", own)
                )
            )
        if (!reach.length) return []
        let query = find("mantle.party.PartyFromAndRelationship")
            .condition(factory.makeCondition(reach, "or"))
            .conditionDate("fromDate", "thruDate", null)
            .selectField(["fromPartyId", "firstName", "lastName"])
            .orderBy(["^firstName", "^lastName"])
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["fromPartyId", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        // a person employed by two employers is one option
        const byParty = new Map()
        for (const row of Array.from(query.list()))
            if (!byParty.has(row.fromPartyId))
                byParty.set(row.fromPartyId, {
                    value: row.fromPartyId,
                    label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
                })
        const options = Array.from(byParty.values())
        return withSelected(
            options,
            selected,
            partyId => {
                try {
                    return !!recordOf(userScope, "person", partyId)
                } catch (error) {
                    return false
                }
            },
            personName
        )
    }
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown People choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's People records, each opening its People screen: none in P1; P2 adds the directory (Person rows with recordEntity
// and recordId).
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
            ec.logger.error("People palette " + definition.kind + " search failed: " + error.message)
        }
        for (const row of rowsFound) if (!found.has(row.url)) found.set(row.url, row)
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

const operations = {sharedContext, checkRecord, choices, search}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown People operation " + op)
    return operations[op](p || {})
}
;({execute: run})
