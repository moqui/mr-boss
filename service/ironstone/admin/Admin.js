// The Admin app's context (impl-admin §2, P1; design-admin §1.1, §17.2): who may open Admin, the organizations they may
// administer, their capabilities, the record checks every Admin screen and mount runs before a framework or Mantle service, the
// drop-downs, the palette and the developer tool links. UserAccount, UserGroup and the security records carry no organization,
// so an identity is in scope through its party's organization relationships (Mantle's get#PartyInternalOrgIds); the framework
// org.moqui.admin and Mantle IdentityServices services check their own permission and scope again, and nothing here grants
// what they refuse.
//
// Opening Admin needs the root grant of one of the user's groups (BOSS_ADMIN, the root user group, or BOSS_ADMIN_ADMIN), read
// directly so an inherited or disabled authorization cannot widen it; the root grant opens navigation only (design §1.1), and
// each read and action checks its own permission. A system administrator (ADMIN) opens everything.
//
// Later phases extend the tables below rather than the functions: capabilityPermissions (a capability from a Moqui
// permission), areas (the menu areas whose authorization is a capability), recordKinds (a kind of record: its read, the
// capability that reads it and, once built, its screen), searchFinds (the palette), choiceSources (the drop-downs), linkPaths
// (sharedLinks) and toolRoutes (DeveloperHome's framework tools).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Admin.xml"
// the settings index, which BOSS_USERS may open without the Admin root (impl-admin F46): a non-inheritable ALLOW on it alone
const settingsIndexLocation = "component://mr-boss/screen/Admin/Settings/SettingsHome.xml"
const areaLocation = area => "component://mr-boss/screen/Admin/" + area + ".xml"
const choiceLimit = 30
// the framework app roots whose own grants open the tools an Admin screen links (Tools ToolsSecurityData, MonitoringSecurityData)
const appLocations = {
    system: "component://tools/screen/System.xml",
    tools: "component://tools/screen/Tools.xml",
    monitor: "component://tools/screen/Monitor.xml",
    dashboards: "component://tools/screen/Dashboards.xml"
}
// the internal organization relationships of a staff identity (as get#PartyInternalOrgIds and MANTLE_USER_ORG count them)
const memberRelationships = ["PrtAgent", "PrtEmployee", "PrtMember"]

// ===== capabilities =====
// Each capability from the Moqui permission the framework and Mantle services check (design §1.1's table; the framework seeds
// them, each granted to ADMIN). ADMIN_IDENTITY_GLOBAL, ADMIN_ACCESS_MANAGE and ADMIN_BACKUP_DOWNLOAD are sealed, as is
// ADMIN_CONSTITUTION_GLOBAL; AgentAdmin is the framework's agent administration permission, granted separately.
const capabilityPermissions = {
    overview: "ADMIN_OVERVIEW_VIEW",
    identityView: "ADMIN_IDENTITY_VIEW",
    identityManage: "ADMIN_IDENTITY_MANAGE",
    identityGlobal: "ADMIN_IDENTITY_GLOBAL",
    accessView: "ADMIN_ACCESS_VIEW",
    accessManage: "ADMIN_ACCESS_MANAGE",
    settingsView: "ADMIN_SETTINGS_VIEW",
    settingsManage: "ADMIN_SETTINGS_MANAGE",
    connectionView: "ADMIN_CONNECTION_VIEW",
    connectionManage: "ADMIN_CONNECTION_MANAGE",
    operationView: "ADMIN_OPERATION_VIEW",
    operationManage: "ADMIN_OPERATION_MANAGE",
    transferView: "ADMIN_TRANSFER_VIEW",
    transferRun: "ADMIN_TRANSFER_RUN",
    auditView: "ADMIN_AUDIT_VIEW",
    backupView: "ADMIN_BACKUP_VIEW",
    backupRun: "ADMIN_BACKUP_RUN",
    backupDownload: "ADMIN_BACKUP_DOWNLOAD",
    constitutionGlobal: "ADMIN_CONSTITUTION_GLOBAL",
    agentAdmin: "AgentAdmin"
}
// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_ADM_<Area>): Operations for the reader,
// the operations operator and the administrator; Agents and Developer tools for the administrator. Home is every Admin user's;
// System (the Tools System screens) is ADMIN's alone, by Tools' own grant (impl-admin F2), so it is the system capability
// below, not an area. Later phases add their areas: P3 Access (Groups and GroupDetail) for the access administrator and the
// administrator.
const areas = {
    access: "Access",
    operations: "Operations",
    agents: "Agents",
    developer: "Developer"
}

// ===== scope =====
// The user's authorizations on screens, read directly so disabled or inherited artifact authorization cannot widen them (as
// Commerce.js): screenAuthz reads the groups' screen authorizations once, and screenGrants picks a screen's from them (ALWAYS
// over DENY over ALLOW).
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
// Whether a path of screens opens to the user's own groups, as the framework decides a screen path (authz.rs is_permitted):
// an ALWAYS on a screen opens it and, inheritable, every screen below; a DENY refuses its screen and any ALLOW below it; the
// last screen needs an ALLOW or ALWAYS of its own, or one inherited from the screen above it.
function pathOpens(locations, authzRows) {
    let inherited = null
    let denied = false
    for (const [index, location] of locations.entries()) {
        const last = index === locations.length - 1
        if (inherited?.inheritable && inherited.type === "AUTHZT_ALWAYS") return true
        const grants = authzRows.filter(row =>
            row.nameIsPattern === "Y"
                ? new RegExp("^(?:" + row.artifactName + ")$").test(location)
                : row.artifactName === location
        )
        const own =
            grants.find(row => row.authzTypeEnumId === "AUTHZT_ALWAYS") ||
            grants.find(row => row.authzTypeEnumId === "AUTHZT_DENY") ||
            (denied ? null : grants.find(row => row.authzTypeEnumId === "AUTHZT_ALLOW"))
        if (own) {
            if (own.authzTypeEnumId === "AUTHZT_DENY") denied = true
            if (last) return own.authzTypeEnumId !== "AUTHZT_DENY"
            inherited = {type: own.authzTypeEnumId, inheritable: own.inheritAuthz === "Y"}
        } else if (last) {
            return !!inherited?.inheritable && inherited.type !== "AUTHZT_DENY"
        } else if (!inherited?.inheritable) {
            inherited = null
        }
    }
    return false
}

// Only a system administrator, or an authorization whose filter sets name MANTLE_ACTIVE_ORG (the administrator group's),
// administers every organization (the active one when there is one); any other grant is limited to the user's organizations,
// so a grant set up without filters fails closed. A Projects client contact (PROJECT_CLIENT) never opens Admin, and a PASS
// public account holds no BOSS group.
function rootGrants() {
    const none = {read: false, unrestricted: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, unrestricted: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    if (!root.allowed.length) return Object.assign(none, {authzRows})
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
// A framework app the user's own groups open (System, Tools, Monitor, Dashboards), by its own grant only: an Admin grant never
// opens it (impl-admin F2).
function appGrant(grants, app) {
    if (grants.systemAdmin) return true
    return screenGrants(appLocations[app], grants.authzRows).allowed.length > 0
}

// Whether a destination, a path under /qapps, opens to the user: a framework app's route (Admin › System and system/ by System's
// own grant, tools/, monitor/ and dashboards/ by theirs) or a BOSS screen path, each screen of it a file under mr-boss's screen
// directory, checked as the framework checks the path. A registry's link is shown only when it opens.
const appRoutes = [
    ["Admin/System", "system"],
    ["system", "system"],
    ["tools", "tools"],
    ["monitor", "monitor"],
    ["dashboards", "dashboards"]
]
function destinationOpens(grants, path) {
    if (!path) return false
    if (grants.systemAdmin) return true
    const route = String(path)
        .split("?")[0]
        .replace(/^\/+|\/+$/g, "")
    const app = appRoutes.find(([prefix]) => route === prefix || route.startsWith(prefix + "/"))
    if (app) return appGrant(grants, app[1])
    const parts = route.split("/")
    return pathOpens(
        parts.map((_, index) => "component://mr-boss/screen/" + parts.slice(0, index + 1).join("/") + ".xml"),
        grants.authzRows || []
    )
}
// A BOSS user without Admin to whom the settings index alone is granted (impl-admin F46): its own ALLOW on SettingsHome.
function settingsIndexOnly(userScope) {
    return (
        !userScope.read &&
        !!ec.user.userId &&
        !ec.user.hasPermission("PROJECT_CLIENT") &&
        screenGrants(settingsIndexLocation, userScope.grants.authzRows || []).allowed.length > 0
    )
}

// The scope of the current user: the organizations they administer (null for every internal organization), their own
// organizations and their capabilities. The administered organizations are filterOrgIds kept to the organizations the user
// belongs to, as Commerce; the administrator works in the active organization, or in every one with none active.
function scope() {
    const grants = rootGrants()
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
    capabilities.system = grants.read && appGrant(grants, "system")
    return {
        read: grants.read,
        grants,
        unrestricted: grants.unrestricted,
        memberIds,
        activeOrganizationPartyId: grants.unrestricted
            ? organization.activeOrgId || null
            : memberIds.includes(organization.activeOrgId)
              ? organization.activeOrgId
              : null,
        ownerIds,
        capabilities
    }
}
function required(userScope = scope()) {
    if (!userScope.read) denied("ADMIN_UNAVAILABLE", "Admin is not available")
    return userScope
}
const administers = (userScope, partyId) => !userScope.ownerIds || (!!partyId && userScope.ownerIds.includes(partyId))
const isInternal = partyId => !!partyId && !!one("mantle.party.PartyRole", {partyId, roleTypeId: "OrgInternal"})
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function partyName(partyId) {
    if (!partyId) return ""
    const organization = one("mantle.party.Organization", {partyId})
    if (organization?.organizationName) return organization.organizationName
    const person = one("mantle.party.Person", {partyId})
    const name = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : ""
    return name || partyId
}
// The internal organizations the user administers: theirs, or every one for the administrator with none active.
function organizationIds(userScope) {
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}

// ===== shared context =====
// The Admin routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: the areas of the menu built so far (design §1.2)
    "Home",
    "Operations/Monitoring",
    // P2: Health and the settings index
    "Operations/Health",
    // P3: groups and grants
    "Access/Groups",
    "Access/GroupDetail",
    "Settings/SettingsHome",
    "Agents/Home",
    "System",
    "Developer/Home"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Admin") denied("ADMIN_CONTEXT", "Admin context is not available")
    const found = scope()
    // the settings index alone (impl-admin F46): no capability, the user's own organizations and the index's link
    if (settingsIndexOnly(found))
        return {
            capabilities: {read: false, settingsIndex: true},
            organizationPartyIds: found.memberIds,
            activeOrganizationPartyId: found.activeOrganizationPartyId,
            allOrganizations: false,
            appRoot: "Admin",
            linkBase: "//Admin",
            webBase: "/qapps/Admin",
            sharedLinks: {"Settings/SettingsHome": "//Admin/Settings/SettingsHome"}
        }
    const userScope = required(found)
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: organizationIds(userScope),
        activeOrganizationPartyId: userScope.activeOrganizationPartyId,
        allOrganizations: !userScope.ownerIds,
        appRoot: "Admin",
        linkBase: "//Admin",
        webBase: "/qapps/Admin",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Admin/" + path]))
    }
}

// ===== record kinds =====
// An internal organization: itself.
function readOrganization(partyId) {
    if (!isInternal(partyId)) return null
    return {owners: [partyId], label: partyName(partyId), detail: one("mantle.party.Party", {partyId})?.pseudoId || ""}
}
// A user account (an identity): the internal organizations its party works for (agent, employee or member, as
// get#PartyInternalOrgIds counts them). An account with no party, or whose party works for no internal organization,
// belongs to none.
function readUser(userId) {
    const account = userId ? one("moqui.security.UserAccount", {userId}) : null
    if (!account) return null
    const partyId = account.partyId
    const owners = partyId
        ? Array.from(call("mantle.party.PartyServices.get#PartyInternalOrgIds", {partyId}).userOrgIds || [])
        : []
    return {owners, anyOwner: true, label: account.userFullName || account.username || userId, detail: account.username || ""}
}

// A user group (P3): the groups and their grants are instance-wide, read with accessView alone; no organization scopes them
// (design §1.1: UserGroup carries no organization), and the framework's AccessServices check delegation themselves.
function readGroup(userGroupId) {
    const group = userGroupId ? one("moqui.security.UserGroup", {userGroupId}) : null
    if (!group) return null
    return {owners: [], instance: true, label: group.description || userGroupId, detail: userGroupId}
}

// Each kind an Admin screen, mount, palette or record link may be given: its name, icon, the capability that reads it (null
// for the scope alone), the screen that opens it (destination, the path and id parameter under the root; null until its
// phase builds it: users in P4, organizations in P7) and its read (owners: the organizations it names; anyOwner: one of them
// in scope is enough, for an identity that works for several organizations; or null when there is no such record).
const recordKinds = {
    organization: {name: "Organization", icon: "sym_o_corporate_fare", need: null, destination: null, read: readOrganization},
    user: {name: "User", icon: "sym_o_person", need: "identityView", destination: null, read: readUser},
    // P3: a group, and a user as a group's member: an access administrator reads the users of the organizations they administer
    // to add or end their memberships, without the identity operator's ADMIN_IDENTITY_VIEW
    group: {name: "Group", icon: "sym_o_group", need: "accessView", destination: "Access/GroupDetail", read: readGroup},
    member: {name: "User", icon: "sym_o_person", need: "accessView", destination: null, read: readUser}
}

// A record the user may administer: the organizations it names are theirs (every one, or for an identity one of them); one
// that names no organization is refused unless the user administers every organization. A missing record and one outside the
// scope are refused alike (RECORD_UNAVAILABLE), so a forged id learns nothing; the kind's read capability is checked first
// (PERMISSION_DENIED). Only the organizations in scope are named in the detail: authority over one organization's
// memberships does not show another's (design §1.1).
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    if (definition.need && !userScope.capabilities[definition.need])
        denied("PERMISSION_DENIED", capabilityPermissions[definition.need] + " is required")
    const found = definition.read(recordId)
    if (!found) unavailable()
    const inScope = found.owners.filter(owner => administers(userScope, owner))
    const allowed = found.instance
        ? true
        : found.owners.length
          ? found.anyOwner
              ? inScope.length > 0
              : inScope.length === found.owners.length
          : !userScope.ownerIds
    if (!allowed) unavailable()
    const scopeText = kind === "user" || kind === "member" ? inScope.map(partyName).join(", ") : ""
    return {
        recordType: kind,
        recordId,
        kindName: definition.name,
        label: found.label,
        detail: [found.detail, scopeText].filter(Boolean).join(" · "),
        organizationPartyIds: inScope,
        // works for an organization outside the user's scope too, so an account-wide change needs ADMIN_IDENTITY_GLOBAL (P4)
        sharedBeyondScope: inScope.length < found.owners.length
    }
}

// check#Record: a record an Admin screen or mount was given, refused unless the user may administer it and, when a
// capability is named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(capabilityPermissions, p.capability)) throw new Error("Unknown Admin capability " + p.capability)
        if (!userScope.capabilities[p.capability])
            denied("PERMISSION_DENIED", capabilityPermissions[p.capability] + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== palette =====
// The finds of the palette: groups (P3); users, connections and jobs with their phases (design §1.2), each by its id and names,
// ignoring case, limited in the query to the user's scope, and each row checked again by recordOf. A kind is searched only for
// a holder of its read capability.
const searchFinds = [
    {
        kind: "group",
        entityName: "moqui.security.UserGroup",
        idField: "userGroupId",
        query: (userScope, condition) =>
            find("moqui.security.UserGroup")
                .condition(condition(["userGroupId", "description"]))
                .selectField("userGroupId")
                .orderBy("userGroupId"),
        url: recordId => "/qapps/Admin/Access/GroupDetail?userGroupId=" + encodeURIComponent(recordId)
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
        const need = recordKinds[definition.kind].need
        if (need && !userScope.capabilities[need]) continue
        let rowsFound = []
        try {
            rowsFound = Array.from(definition.query(userScope, condition).limit(limit).list())
        } catch (error) {
            ec.logger.error("Admin palette " + definition.kind + " search failed: " + error.message)
        }
        // each row on its own: one that fails or is out of scope is left out and the others still show
        for (const row of rowsFound) {
            const recordId = row[definition.idField]
            try {
                const record = recordOf(userScope, definition.kind, recordId)
                const url = definition.url(recordId)
                if (url && !found.has(url))
                    found.set(url, {
                        title: record.label,
                        subtitle: [record.kindName, record.detail].filter(Boolean).join(" · "),
                        icon: recordKinds[definition.kind].icon,
                        recordEntity: definition.entityName,
                        recordId,
                        url
                    })
            } catch (error) {
                if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                    ec.logger.error("Admin palette " + definition.kind + " " + recordId + ": " + error.message)
            }
        }
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== choices =====
// The staff identities of the organizations the user administers whose name or username matches the term, for GroupMembers'
// member search (P3): the parties working for those organizations (as get#PartyInternalOrgIds counts them), their accounts.
function memberOptions(userScope, term, selected) {
    if (!userScope.capabilities.accessView) return []
    const partyIds = Array.from(
        new Set(
            Array.from(
                find("mantle.party.PartyRelationship")
                    .condition("toPartyId", "in", organizationIds(userScope))
                    .condition("relationshipTypeEnumId", "in", memberRelationships)
                    .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                    .selectField("fromPartyId")
                    .list()
            ).map(row => row.fromPartyId)
        )
    )
    if (!partyIds.length) return []
    let accounts = find("moqui.security.UserAccount").condition("partyId", "in", partyIds)
    if (term) {
        const factory = ec.entity.conditionFactory
        accounts = accounts.condition(
            factory.makeCondition(
                ["username", "userFullName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    }
    const options = Array.from(accounts.orderBy("userFullName").limit(choiceLimit).list()).map(row => ({
        value: row.userId,
        label: (row.userFullName || row.username) + (row.username ? " (" + row.username + ")" : "")
    }))
    if (selected && !options.some(option => option.value === selected)) {
        try {
            const record = recordOf(userScope, "member", selected)
            options.push({value: selected, label: record.label})
        } catch (error) {
            // a selected user outside the scope is not named
        }
    }
    return options
}

// Each Admin drop-down: its options for the user, the term and the selected value, with the selected value's label when it is
// in scope but not on the page. Later phases add sources.
const choiceSources = {
    // P3: the users an access administrator may add to a group
    members: memberOptions,
    // the internal organizations the user administers (theirs, or every one for the administrator)
    organizations: (userScope, term, selected) => {
        const ids = organizationIds(userScope)
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
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Admin choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== developer tools =====
// The framework tools DeveloperHome links (design §13 DeveloperHome): each by its app (whose own grant opens it, never an Admin
// one), its route under that app (System's under Admin › System, where an instance administrator opens it; the others at their
// own app) and the permission its screen checks besides the app's grant, if any. Each keeps its own checks and environment
// restrictions when opened; Admin adds no raw shell, service-run field or database restore.
const toolRoutes = [
    {tool: "Entity data", purpose: "Find, view and edit entity records", app: "tools", path: "Data/Grid"},
    {tool: "Data views", purpose: "Saved views over entity data", app: "tools", path: "Data/Views"},
    {tool: "Data export", purpose: "Export entity data as XML, JSON or CSV", app: "tools", path: "Data/Export"},
    {tool: "Data load", purpose: "Load entity data files", app: "tools", path: "Data/Load"},
    {tool: "Snapshots", purpose: "Database snapshots and their restore checks", app: "tools", path: "Data/Snapshots"},
    {tool: "Data documents", purpose: "Data documents, feeds and search", app: "system", path: "DataDocument"},
    {tool: "Status flows", purpose: "Status items and their transitions", app: "tools", path: "StatusFlows"},
    {tool: "Entities", purpose: "Entity definitions, tables and indexes", app: "tools", path: "Schema"},
    {tool: "Services", purpose: "Service reference and a service run", app: "tools", path: "Service"},
    {
        tool: "Service load runner",
        purpose: "Load tests of services",
        app: "tools",
        path: "Service/ServiceLoadRunner",
        permission: "SERVICE_LOAD_RUNNER"
    },
    {tool: "SQL runner", purpose: "Run SQL statements", app: "tools", path: "Sql", permission: "SQL_RUNNER_WEB"},
    {
        tool: "Database",
        purpose: "Database server, tables and statement statistics",
        app: "tools",
        path: "Database",
        permission: "DATABASE_ADMIN"
    },
    {tool: "ETL", purpose: "Mappings, value maps and runs", app: "tools", path: "Etl"},
    {tool: "Caches", purpose: "Cache statistics and clearing", app: "system", path: "Cache"},
    {tool: "Resources", purpose: "Git repositories and resources", app: "system", path: "Resource"},
    {tool: "Print", purpose: "Printers and print jobs", app: "system", path: "Print"},
    {tool: "Instances", purpose: "Hosted instances", app: "system", path: "Instance"},
    {tool: "Configuration", purpose: "The effective configuration", app: "system", path: "Conf"},
    {tool: "Components", purpose: "Installed components", app: "system", path: "Components"}
]
const appNames = {system: "System", tools: "Tools"}
const toolUrl = route => (route.app === "system" ? "/qapps/Admin/System/" : "/qapps/" + route.app + "/") + route.path
// find#ToolLinks: the tools the user may open, each checked with its app's own grant and its permission; the others are left
// out (design §13: omit unauthorized actions). Not an Admin capability: the user's own Tools grants decide.
function toolLinks() {
    const userScope = required()
    const grants = userScope.grants
    const links = []
    for (const route of toolRoutes) {
        try {
            if (route.app === "system" ? !userScope.capabilities.system : !appGrant(grants, route.app)) continue
            if (route.permission && !access.has(route.permission)) continue
            links.push({
                tool: route.tool,
                purpose: route.purpose,
                appName: appNames[route.app],
                permission: route.permission || "",
                url: toolUrl(route)
            })
        } catch (error) {
            ec.logger.error("Admin tool link " + route.tool + " not checked: " + error.message)
        }
    }
    return {links}
}
// The framework apps the user's own groups open, for the Monitoring and Agents landings' links (monitor, dashboards, system).
function appAccess() {
    const userScope = required()
    return Object.fromEntries(Object.keys(appLocations).map(app => [app, appGrant(userScope.grants, app)]))
}

// get#MemberScope (P3): which of a group's members the user may change, the users of the organizations they administer (every
// one for the administrator), and how many are outside; a member outside the scope is counted, never named.
function memberScope(p) {
    const userScope = required()
    if (!userScope.capabilities.accessView) denied("PERMISSION_DENIED", "ADMIN_ACCESS_VIEW is required")
    const userIds = Array.from(new Set(Array.from(p.userIds || [])))
    const inScope = []
    for (const userId of userIds) {
        try {
            recordOf(userScope, "member", userId)
            inScope.push(userId)
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        }
    }
    return {inScopeUserIds: inScope, outsideCount: userIds.length - inScope.length}
}

const operations = {sharedContext, checkRecord, search, choices, toolLinks, appAccess, memberScope}
;({
    // the scope for a phase's own module: the user's scope, the same refusing a user without Admin, and a record's check
    scope,
    required,
    administers,
    recordOf,
    destinationOpens,
    settingsIndexOnly,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Admin operation " + op)
        return operations[op](parameters)
    }
})
