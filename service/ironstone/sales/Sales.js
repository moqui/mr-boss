// The Sales app's access and context (impl-sales §2, P1; design-sales §1.1, §1.2, §12.1): who may open Sales, their capabilities
// and organizations, the record check every Sales screen and shared mount runs before a Mantle service, the drop-downs, the
// palette and the canonical links. The scope itself is Mantle's (mantle/sales/SalesAccess.js: the SALES_* permissions and the
// user's organizations), read once per call here; the Mantle services check it again, and nothing here grants what Mantle
// refuses.
//
// Opening Sales needs the root grant of one of the user's groups (BOSS_SALES, the root user group, or BOSS_SALES_ADMIN), read
// directly so an inherited or disabled authorization cannot widen it (impl-admin F35, as People.js and Maintenance.js); the root
// grant opens navigation only. A system administrator (ADMIN) opens everything. A Projects client contact (PROJECT_CLIENT) never
// opens Sales, and a PASS public account holds no BOSS group.
//
// Later phases extend the tables below rather than the functions: mountRoots (the app roots that mount Sales' shared screens:
// Marketing's with P4), areas (menu areas whose authorization is a capability), recordKinds (a kind of record: its check and,
// once built, its screen), searchFinds (the palette), choiceSources (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const salesAccess = ec.resource.script("component://mr-mantle/service/mantle/sales/SalesAccess.js")
const {find, one, denied} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Sales.xml"
const areaLocation = area => "component://mr-boss/screen/Sales/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100

// The app roots whose screens take Sales' context, each with its link base: Sales' own. Marketing's root mounts Leads, Accounts
// and LeadSources with its own appRoot (impl-sales §2, impl-marketing P3), added when Leads is built (P4).
const mountRoots = {
    Sales: "//Sales"
}
// The menu areas whose authorization is a capability (data/BossSetupSalesData.xml BOSS_SAL_<Area>): Reports the report readers'
// (P1). Home is every Sales user's; later phases add theirs (Settings P2, Approvals P9, Changes P14, Agreements P15).
const areas = {
    reports: "Reports",
    // P2: Settings (BOSS_SAL_SETTINGS), the administrator's and, for Teams, the manager's
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
// An area's grant: the root's ALWAYS (the Sales administrator's, ADMIN's) passes every area below it; otherwise the area's own
// rows decide when it has any, else the root's.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's sales scope and the areas. Without the root grant nothing of Mantle's
// scope is read. An area needs its grant and, for Reports, the permission its screens' services check (SALES_REPORT_VIEW), so a
// custom group given Sales in Admin, which is no member of BOSS_SALES and not reached by the area's deny, is shown no area its
// services refuse (impl-maintenance F346's lesson).
// P2: Settings needs SALES_CONFIGURE or, for Teams alone, SALES_TEAM_MANAGE (the Mantle setup services' checks)
const areaReads = {reports: "reportRead", settings: caps => !!(caps.configure || caps.teamManage)}
function scope() {
    const grants = rootGrants()
    const mantle = grants.read ? salesAccess.scope() : null
    const capabilities = Object.assign({read: grants.read}, mantle?.capabilities || {})
    for (const [name, area] of Object.entries(areas))
        capabilities[name] =
            areaGrant(grants, area) &&
            (!areaReads[name] ||
                (typeof areaReads[name] === "function" ? areaReads[name](capabilities) : !!capabilities[areaReads[name]]))
    // whether the sales reports answer the user with costs (SalesAnalysis.js organizations: withheld from a Sales report reader
    // without PRODUCT_COST_VIEW, kept for report read), so a report leaves out what the services withhold rather than show it as
    // zero; borrowed authority, never a Sales permission (impl-sales §2)
    capabilities.reportCosts = grants.read && (access.has("ACCOUNTING_VIEW") || access.has("PRODUCT_COST_VIEW"))
    return {read: grants.read, mantle: mantle || {organizationPartyIds: [], capabilities: {}}, capabilities}
}
function required(userScope = scope()) {
    if (!userScope.read) denied("SALES_UNAVAILABLE", "Sales is not available")
    return userScope
}
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}
// The organizations of the scope: its list, or every internal organization when it is every one (null).
function organizationIds(userScope) {
    const ids = userScope.mantle.organizationPartyIds
    if (ids != null) return Array.from(ids)
    return Array.from(find("mantle.party.PartyRole").condition("roleTypeId", "OrgInternal").selectField("partyId").list()).map(
        row => row.partyId
    )
}
const covers = (userScope, partyId) => salesAccess.covers(userScope.mantle, partyId)
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
// The Sales routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: Home and the two reports ported in the first port (design §1.2, §8)
    "Home",
    "Reports",
    "Reports/SalesSummary",
    "Reports/SalesAnalysis",
    // P2: Settings (design §9), LeadSources built for a second mount (impl-sales §2)
    "Settings",
    "Settings/Readiness",
    "Settings/Stages",
    "Settings/Teams",
    "Settings/LeadSources",
    "Settings/TypesAndReasons"
]
function sharedContext(p) {
    const appRoot = p.appRoot || "Sales"
    if (!Object.hasOwn(mountRoots, appRoot)) denied("SALES_CONTEXT", "Sales context is not available")
    const userScope = required()
    const mantle = userScope.mantle
    const ids = organizationIds(userScope)
    const linkBase = mountRoots[appRoot]
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: ids,
        activeOrganizationPartyId: mantle.activeOrganizationPartyId || null,
        allOrganizations: !!mantle.allOrganizations,
        organizationOptions: organizationOptions(ids, null, organizationOptionLimit),
        partyId: mantle.partyId || null,
        appRoot,
        linkBase,
        webBase: "/qapps/" + appRoot,
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, linkBase + "/" + path]))
    }
}

// ===== record kinds =====
// Each kind a Sales screen or mount may be given: its name, icon, screen (once built) and its check, which refuses a record that
// does not exist and one outside the scope alike (RECORD_UNAVAILABLE). P1: an organization; later phases add theirs (an account
// P3, an opportunity P4, a quote P7, an order P11, an agreement P15, a forecast P18).
const recordKinds = {
    organization: {
        name: "Organization",
        icon: "sym_o_corporate_fare",
        destination: null,
        read: (userScope, partyId) => {
            if (!userScope.capabilities.anyRead || !covers(userScope, partyId)) return null
            return {organizationPartyId: partyId, label: organizationName(partyId), detail: "Organization"}
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
// check#Record: a record a Sales screen or mount was given, refused unless the user may see it and, when a capability is named,
// holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(userScope.capabilities, p.capability)) throw new Error("Unknown Sales capability " + p.capability)
        if (!userScope.capabilities[p.capability]) denied("PERMISSION_DENIED", "Sales " + p.capability + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== choices =====
// Each Sales drop-down: its options for the user, searched in the query ignoring case, with the selected value's label when it is
// in scope but not on the page. An unknown choice throws. Later phases add sources (teams, stages, accounts, products).
function withSelected(options, selected, admits, label) {
    if (selected && !options.some(option => option.value === selected) && admits(selected))
        options.push({value: selected, label: label(selected)})
    return options
}
const choiceSources = {
    // the organizations of the user's sales scope
    organizations: (userScope, term, selected) =>
        withSelected(
            organizationOptions(organizationIds(userScope), term, choiceLimit),
            selected,
            partyId => userScope.capabilities.anyRead && covers(userScope, partyId),
            organizationName
        ),
    // ===== P2: the pipeline setup's choices (impl-sales P2) =====
    // the current sales teams of an organization of the scope (a pipeline's team)
    teams: (userScope, term, selected, p) => {
        const organizationPartyId = p.organizationPartyId || null
        if (!organizationPartyId || !covers(userScope, organizationPartyId)) return []
        const lower = term.toLowerCase()
        return Array.from(salesSettings().teamsOf(organizationPartyId))
            .filter(
                team => !term || team.teamName.toLowerCase().includes(lower) || team.teamPartyId.toLowerCase().includes(lower)
            )
            .slice(0, choiceLimit)
            .map(team => ({value: team.teamPartyId, label: team.teamName}))
    },
    // TeamMembers' lookup: the people who work for the team's organization (an agent or employee in effect, the rule
    // store#SalesTeamMember checks), by name; for a reader of People's directory (PEOPLE_DIRECTORY_VIEW, F53) each employee's work
    // identity from mantle.humanres.PeopleServices.find#Employees labels them with their job title. A caller without it picks
    // by party; no People record is read for them.
    teamMembers: (userScope, term, selected, p) => {
        const organizationPartyId = p.organizationPartyId || null
        if (!organizationPartyId || !covers(userScope, organizationPartyId)) return []
        if (!userScope.capabilities.configure && !userScope.capabilities.teamManage) return []
        const workerIds = Array.from(
            find("mantle.party.PartyRelationship")
                .condition("toPartyId", organizationPartyId)
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee"])
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .selectField("fromPartyId")
                .list()
        ).map(row => row.fromPartyId)
        if (!workerIds.length) return []
        let query = find("mantle.party.PartyDetail")
            .condition("partyId", "in", Array.from(new Set(workerIds)))
            .condition("partyTypeEnumId", "PtyPerson")
            .orderBy(["firstName", "lastName"])
            .limit(choiceLimit)
        if (term) {
            const factory = ec.entity.conditionFactory
            query = query.condition(
                factory.makeCondition(
                    ["partyId", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        }
        const people = Array.from(query.list())
        const titles = {}
        // People's own scope first (impl-sales P2 review): an organization People does not cover for the caller is not asked, as
        // find#Employees would refuse it and the refused call is logged as an error
        if (access.has("PEOPLE_DIRECTORY_VIEW") && peopleCovers(organizationPartyId)) {
            try {
                const found = lib.probe("mantle.humanres.PeopleServices.find#Employees", {
                    organizationPartyId,
                    term: term || null,
                    pageSize: choiceLimit * 2
                })
                for (const row of Array.from(found.employees || [])) if (row.jobTitle) titles[row.partyId] = row.jobTitle
            } catch (error) {
                // People's directory is optional here: without it the people are picked by party
                ec.logger.info("Sales team lookup without People's directory: " + error.message)
            }
        }
        return people.map(row => {
            const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
            return {value: row.partyId, label: titles[row.partyId] ? name + ", " + titles[row.partyId] : name}
        })
    }
}
// P2: whether People's directory scope reaches an organization for the caller (People.js scopeOf: a staff reader's employers)
function peopleCovers(organizationPartyId) {
    const peopleScope = ec.resource.script("component://mr-mantle/service/mantle/humanres/People.js").scopeOf()
    return !!peopleScope.capabilities?.staff && Array.from(peopleScope.organizationPartyIds || []).includes(organizationPartyId)
}
// P2: Mantle's setup module (the teams of an organization), read once per call
let settingsModule = null
const salesSettings = () =>
    settingsModule || (settingsModule = ec.resource.script("component://mr-mantle/service/mantle/sales/SalesSettings.js"))
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Sales choice " + p.choice)
    if (!userScope.capabilities.anyRead) return {options: []}
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's Sales records, each opening its Sales screen, with recordEntity and recordId for Assist's search. None yet:
// accounts join with their screens (P3), opportunities and leads (P4), quotes and orders (P7, P11), agreements (P15).
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
            ec.logger.error("Sales palette " + definition.kind + " search failed: " + error.message)
        }
        for (const row of rowsFound) if (!found.has(row.url)) found.set(row.url, row)
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

const operations = {sharedContext, checkRecord, choices, search}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Sales operation " + op)
    return operations[op](p || {})
}
;({execute: run})
