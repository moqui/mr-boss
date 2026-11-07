// The Insights app's context (impl-insights §2, P1; design-insights §1.1, §15.2): who may open Insights, the organizations whose
// results they may see, their capabilities from the INSIGHTS_* permissions, safe defaults and the canonical links. The INSIGHTS_*
// permissions are BOSS's and decide what Insights' own screens and services offer; the framework's report engine checks its own
// artifacts (the ReportServices operations, each dataset's org.moqui.report.dataset.<id>, dataset saves, DataDocumentUserGroup),
// which data/BossSetupData.xml grants by capability (impl-insights §4, F2, F4). Nothing here grants a source: a supplied
// organization is checked against the user's own, and a capability opens an affordance, never data.
//
// Opening Insights needs the root grant of one of the user's groups (BOSS_INSIGHTS, the root user group, or BOSS_INSIGHTS_ADMIN),
// read directly so an inherited or disabled authorization cannot widen it (impl-admin F35); the root grant opens navigation only.
// A system administrator (ADMIN) opens everything.
//
// Later phases extend the tables below rather than the functions: capabilityPermissions (a capability from a permission), areas
// (menu areas whose authorization is a capability) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Insights.xml"
const areaLocation = area => "component://mr-boss/screen/Insights/" + area + ".xml"
// the default reporting range until P10's organization analytics defaults: relative, so it needs no zone or calendar
const defaultRange = {from: "now-30d", thru: "now"}

// ===== capabilities =====
// Each capability from its permission (design §1.1's table; data/BossSetupData.xml seeds them, each granted to ADMIN).
const capabilityPermissions = {
    view: "INSIGHTS_VIEW",
    author: "INSIGHTS_AUTHOR",
    datasetView: "INSIGHTS_DATASET_VIEW",
    datasetEdit: "INSIGHTS_DATASET_EDIT",
    schedule: "INSIGHTS_SCHEDULE",
    distribute: "INSIGHTS_DISTRIBUTE",
    flowEdit: "INSIGHTS_FLOW_EDIT",
    settingsView: "INSIGHTS_SETTINGS_VIEW",
    settingsEdit: "INSIGHTS_SETTINGS_EDIT"
}
// The menu areas whose authorization is a capability (data/BossSetupData.xml): the copied Reports and ScheduledReports
// (BOSS_INS_LEGACY) stay the Insights administrator's and ADMIN's until P4 and P7 replace them (impl-insights F20), read by the
// first, each with the same rows; P2 replaced the copied Dashboards and Dashboard with the framework mounts, P3 the copied report
// builder with the dataset screens: Datasets and DatasetView the author's and steward's (BOSS_INS_DATASET_SCREENS), DatasetDetail
// and DatasetFields the steward's (BOSS_INS_DATASET_STEWARDSHIP).
const areas = {
    legacy: "Reports",
    datasets: "ReportBuilder/Datasets",
    stewardship: "ReportBuilder/DatasetDetail"
}

// ===== scope =====
// The user's screen authorizations, read directly (as Commerce.js and Admin.js): screenAuthz reads the groups' rows once, and
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
    return {found: grants.length > 0, allowed}
}
// Only a system administrator, or a root authorization whose filter sets name MANTLE_ACTIVE_ORG (the Insights administrator's),
// sees every organization (the active one when there is one); any other grant is limited to the user's organizations, so a grant
// set up without filters fails closed. A Projects client contact (PROJECT_CLIENT) never opens Insights, and a PASS public
// account holds no BOSS group.
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

// The scope of the current user: the organizations whose results they see (null for every internal organization), the active
// one and their capabilities. The organizations are filterOrgIds kept to those the user belongs to, as Admin and Commerce; the
// administrator works in the active organization, or in every one with none active.
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
    return {
        read: grants.read,
        unrestricted: grants.unrestricted,
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
    if (!userScope.read) denied("INSIGHTS_UNAVAILABLE", "Insights is not available")
    return userScope
}
const sees = (userScope, partyId) => !userScope.ownerIds || (!!partyId && userScope.ownerIds.includes(partyId))
function partyName(partyId) {
    const organization = one("mantle.party.Organization", {partyId})
    return organization?.organizationName || partyId
}
// The internal organizations whose results the user sees: theirs, or every one for the administrator with none active.
function organizationIds(userScope) {
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}

// ===== context =====
// The Insights routes other screens link to (sharedLinks), by path under the root; each phase adds the screens it builds. The
// copied screens (F20) are not canonical links: their phases replace them.
const linkPaths = [
    // P1: Home (design §1.2)
    "Home",
    // P2: the dashboards and Explore (design §4, §5)
    "Dashboards",
    "Dashboard",
    "Panels",
    "Playlists",
    "ReportBuilder/Explore",
    // P3: the business datasets (design §5)
    "ReportBuilder/Datasets",
    "ReportBuilder/DatasetView"
]
// The framework report screens Insights mounts (impl-insights P2, INS-04), as the reportLinks map the framework screens read
// (mr-moqui docs/tools/Monitoring.md, "Mounting the report screens"): each key the screen a report link opens. A user without
// authoring (INSIGHTS_AUTHOR or INSIGHTS_DATASET_EDIT) gets no editor (null), so the framework screens offer no New, Edit or
// save; Insights mounts no alert rules (P8), log context or definition import (P12), and shares from its Dashboard
// (ShareDashboard), so the editor keeps a definition's group as it is.
function reportLinks(capabilities) {
    const authors = capabilities.author || capabilities.datasetEdit
    return {
        dashboards: "//Insights/Dashboards",
        dashboard: "//Insights/Dashboard",
        definition: authors ? "//Insights/DashboardEditor" : null,
        panel: authors ? "//Insights/PanelDetail" : null,
        explore: "//Insights/ReportBuilder/Explore",
        split: "//Insights/ReportBuilder/Split",
        playlist: "//Insights/Playlists",
        alertRule: null,
        logContext: null,
        share: "//Insights/Dashboard"
    }
}
// get#Context: the organization choices, the organization in scope (a requested one only when it is the user's, else the active
// one, else the only one), the capabilities, the safe defaults (the reporting range; currencies kept apart, never a default
// currency) and the canonical links. A requested organization outside the user's is refused (ORGANIZATION_UNAVAILABLE), whether
// or not it exists, so a forged id learns nothing.
function context(p) {
    if (p.appRoot && p.appRoot !== "Insights") denied("INSIGHTS_CONTEXT", "Insights context is not available")
    const userScope = required()
    const ids = organizationIds(userScope)
    const requested = p.organizationPartyId || null
    if (requested && (!sees(userScope, requested) || !ids.includes(requested)))
        denied("ORGANIZATION_UNAVAILABLE", "Organization " + requested + " is not available")
    const active = userScope.activeOrganizationPartyId
    const organizationPartyId = requested || (active && ids.includes(active) ? active : ids.length === 1 ? ids[0] : null)
    const organizations = ids
        .map(partyId => ({value: partyId, label: partyName(partyId)}))
        .sort((a, b) => a.label.localeCompare(b.label))
    return {
        capabilities: userScope.capabilities,
        organizations,
        organizationPartyIds: ids,
        organizationPartyId,
        allOrganizations: !userScope.ownerIds,
        defaults: {from: defaultRange.from, thru: defaultRange.thru, currencyMode: "native"},
        appRoot: "Insights",
        linkBase: "//Insights",
        webBase: "/qapps/Insights",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Insights/" + path])),
        reportLinks: reportLinks(userScope.capabilities)
    }
}

// ===== sharing (design §4 ShareDashboard) =====
// The groups an author may share a dashboard with: their own groups, by name, never the implicit ALL_USERS. Sharing gives the
// group the definition only; each viewer's queries still run with their own dataset grants.
function shareGroupIds() {
    return Array.from(ec.user.getUserGroupIdSet() || []).filter(groupId => groupId !== "ALL_USERS")
}
function shareGroups() {
    required()
    const groups = Array.from(find("moqui.security.UserGroup").condition("userGroupId", "in", shareGroupIds()).list())
    return {
        groups: groups
            .map(group => ({value: group.userGroupId, label: group.description || group.userGroupId}))
            .sort((a, b) => a.label.localeCompare(b.label))
    }
}
// A report engine call as the viewer, so the engine's own checks (the operation's grant, the owner, each dataset) apply.
function asViewer(name, parameters) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// share#Dashboard: the owner, an author, shares their dashboard with one of their own groups or makes it private again; the
// engine's save checks the owner and the version read (expectedVersion) as for any save.
function shareDashboard(p) {
    const userScope = required()
    if (!userScope.capabilities.author) denied("INSIGHTS_AUTHOR_REQUIRED", "Sharing a dashboard needs Insights authoring")
    const group = p.userGroupId || null
    if (group && !shareGroupIds().includes(group)) denied("SHARE_GROUP_UNAVAILABLE", "Share only with a group you belong to")
    const definition = asViewer("org.moqui.report.ReportServices.get#Definition", {definitionId: p.definitionId}).definition
    if (definition.type !== "dashboard") denied("DASHBOARD_REQUIRED", "Choose a dashboard")
    if (definition.readOnly || definition.ownerId !== ec.user.userId)
        denied("DASHBOARD_NOT_OWNED", "Only the owner shares a dashboard; save a copy first")
    const version = p.expectedVersion != null && p.expectedVersion !== "" ? Number(p.expectedVersion) : definition.version
    const saved = asViewer("org.moqui.report.ReportServices.save#Definition", {
        definition: {
            id: definition.id,
            type: definition.type,
            title: definition.title,
            body: definition.body,
            version,
            userGroupId: group
        },
        note: group ? "Shared with " + group : "Made private"
    }).definition
    return {definitionId: saved.id, userGroupId: saved.userGroupId || null, version: saved.version}
}

const operations = {context, shareGroups, shareDashboard}
;({
    // the scope for a later phase's own module: the user's scope, the same refusing a user without Insights
    scope,
    required,
    sees,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights operation " + op)
        return operations[op](parameters)
    }
})
