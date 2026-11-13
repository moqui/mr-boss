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
// the default reporting range: relative, so it needs no zone or calendar
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
// The menu areas whose authorization is a capability (data/BossSetupData.xml): P3's dataset screens, Datasets and DatasetView
// the author's and steward's (BOSS_INS_DATASET_SCREENS), DatasetDetail and DatasetFields the steward's
// (BOSS_INS_DATASET_STEWARDSHIP). The copied screens of impl-insights F20 are all replaced (P2 Dashboards, P3 the report
// builder, P4 Reports, P7 ScheduledReports, every Insights user's), so no legacy area is left.
const areas = {
    datasets: "ReportBuilder/Datasets",
    stewardship: "ReportBuilder/DatasetDetail",
    // P6: Analysis, the author's and the steward's (BOSS_INS_ANALYSIS)
    analysis: "ReportBuilder/Analysis"
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

// ===== organization analytics defaults (P10; design §11 Settings, impl-insights §4) =====
// The organization's analytics defaults are registered PartySetting types mr-boss seeds (data/BossSetupData.xml), each for the
// OrgInternal role, so Admin's OrganizationDefaults lists them too: the default dashboard, flow map and digest, the display
// time zone and week start of Insights' own queries, the freshness policy of DataReadiness and the group recipient cap.
// ContextServices.store#Settings writes them (Settings.js); the readers are here, for every module that applies one. A value
// is the organization's own, else its type's default, else none: an empty choice stays empty.
const settingTypes = {
    defaultDashboardId: "InsightsDefaultDashboard",
    defaultMapId: "InsightsDefaultMap",
    defaultDigestDefinitionId: "InsightsDefaultDigest",
    displayTimeZone: "InsightsDisplayTimeZone",
    weekStart: "InsightsWeekStart",
    freshnessPolicyId: "InsightsFreshnessPolicy",
    groupRecipientCap: "InsightsGroupRecipientCap"
}
const ceilingKey = "report.groupRecipientCeiling"
// what the report engine itself falls back to (mr-moqui crates/moqui-report/src/delivery.rs)
const fallbackCeiling = 200
const fallbackCap = 50
function organizationSettings(partyId) {
    const typeIds = Object.values(settingTypes)
    const types = Array.from(find("mantle.party.PartySettingType").condition("partySettingTypeId", "in", typeIds).list())
    const own = partyId
        ? Array.from(find("mantle.party.PartySetting", {partyId}).condition("partySettingTypeId", "in", typeIds).list())
        : []
    const values = {}
    const sources = {}
    for (const [name, typeId] of Object.entries(settingTypes)) {
        const stored = own.find(row => row.partySettingTypeId === typeId)?.settingValue
        const fallback = types.find(row => row.partySettingTypeId === typeId)?.defaultValue
        const value = stored != null && stored !== "" ? stored : fallback
        values[name] = value == null || value === "" ? null : String(value)
        sources[name] = stored != null && stored !== "" ? "organization" : values[name] != null ? "default" : "none"
    }
    return {values, sources}
}
// Admin's instance ceiling for group recipients (the instance preference the report engine reads too): a registered,
// nonsecret preference, read whoever asks.
function recipientCeiling() {
    try {
        const ceiling = Number(
            lib.probe("org.moqui.admin.ConfigurationServices.get#InstancePreference", {settingKey: ceilingKey}).numberValue
        )
        if (Number.isInteger(ceiling) && ceiling > 0) return ceiling
    } catch (error) {
        ec.logger.error(
            "Insights: the group recipient ceiling could not be read; using " + fallbackCeiling + ": " + error.message
        )
    }
    return fallbackCeiling
}
const capOf = (values, ceiling) => {
    const cap = Number(values.groupRecipientCap)
    return Math.min(Number.isInteger(cap) && cap > 0 ? cap : fallbackCap, ceiling)
}
// The group recipient cap a schedule or an alert rule is saved and checked with: the cap of the organization the caller works
// in (the active one), else the lowest of the organizations in the caller's scope (every internal one for the administrator
// of all with none active: the P10 review, R3), never above the instance ceiling, which the engine holds it under as well.
function recipientCap(userScope = scope()) {
    const ceiling = recipientCeiling()
    const active = userScope.activeOrganizationPartyId
    const ids = active ? [active] : organizationIds(userScope).slice(0, 50)
    return Math.min(...(ids.length ? ids : [null]).map(partyId => capOf(organizationSettings(partyId).values, ceiling)))
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
    "ReportBuilder/DatasetView",
    // P4: the report catalog and saved reports (design §6)
    "Reports",
    "SavedReports",
    // P6: Analysis, Drill and the read-only record contexts (design §5, §4, §10)
    "ReportBuilder/Analysis",
    "Drill",
    "PanelDetail",
    "Records/OrderDetail",
    "Records/Customer360",
    "Records/Supplier360",
    "Records/Product360",
    "Records/RequestDetail",
    "Records/WorkItemDetail",
    "Records/ShipmentDetail",
    "Records/FacilityDetail",
    "Records/EquipmentDetail",
    "Records/InvoiceDetail",
    // People P2 (owner contract): the employee record's Overview, read only (Shared/Employee360 with Insights' context)
    "Records/Employee360",
    // P7: scheduled delivery and the management digest (design §7)
    "ScheduledReports/Schedules",
    "ScheduledReports/ScheduledReportDetail",
    "ScheduledReports/ReportDelivery",
    "ManagementDigest",
    // P8: business alerts (design §8)
    "Alerts/Rules",
    "Alerts/AlertDetail",
    // P9: business flow maps (design §9)
    "Flows/FlowMap",
    "Flows/FlowMaps",
    "Flows/FlowMapEditor",
    "Flows/ProcessStory",
    // P10: Settings and data readiness (design §11)
    "Settings/AnalyticsSettings",
    "Settings/DataReadiness"
]
// The record screens with tabs: under Insights their one subscreen is InsightsRecord (Shared/InsightsRecord.xml), which the
// links name, since a screen's default tab is chosen before the app's context is known.
const tabbedRecords = ["Records/Customer360", "Records/Supplier360", "Records/Product360", "Records/FacilityDetail", "Records/EquipmentDetail"]
// The framework report screens Insights mounts (impl-insights P2, INS-04), as the reportLinks map the framework screens read
// (mr-moqui docs/tools/Monitoring.md, "Mounting the report screens"): each key the screen a report link opens. A user without
// authoring (INSIGHTS_AUTHOR or INSIGHTS_DATASET_EDIT) gets no editor (null), so the framework screens offer no New, Edit or
// save; an alert rule opens in Insights' AlertDetail (P8; the framework's AlertRule there, without its contact points), for
// every reader, since the alerts one receives link it, and a panel's New alert rule is offered only to one who may set an
// alert (reportPolicy's features.alert below); Insights mounts no log context or definition import
// (P12), and shares from its Dashboard (the framework's ShareDashboard), so the editor keeps a definition's group as it
// is. The alert list is
// Insights' Rules (alerts); Insights has no shared contact points, silences or mute timings (alertShared).
function reportLinks(capabilities) {
    const authors = capabilities.author || capabilities.datasetEdit
    return {
        dashboards: "//Insights/Dashboards",
        dashboard: "//Insights/Dashboard",
        definition: authors ? "//Insights/DashboardEditor" : null,
        panel: authors ? "//Insights/PanelDetail" : null,
        explore: "//Insights/ReportBuilder/Explore",
        split: "//Insights/ReportBuilder/Split",
        // the playlists, one played in the app (the same screen with a playlist chosen) and one played full screen
        playlists: "//Insights/Playlists",
        playlist: "//Insights/Playlists",
        wallDisplay: "//Insights/WallDisplay",
        alerts: "//Insights/Alerts/Rules",
        alertRule: "//Insights/Alerts/AlertDetail",
        alertShared: null,
        logContext: null,
        share: "//Insights/Dashboard",
        // P6: each panel's menu offers Drill, Insights' own screen over the engine's get#Drill; Analysis is the author's
        // and the steward's
        drill: "//Insights/Drill",
        analysis: authors ? "//Insights/ReportBuilder/Analysis" : null
    }
}
// Insights' policy for the framework report screens it shows, the reportPolicy map they read beside reportLinks (mr-moqui
// docs/tools/Monitoring.md, "Mounting the report screens"; tools/template/ReportMount.js). Data only, which the root sets and
// no request supplies: the framework's transitions read it, and the engine's operation that acts still decides.
// - features: who may set an alert (an author or a distributor: the framework's alert transitions refuse anyone else, a
//   dataset steward too, who holds the engine's save) and who may share a dashboard or a playlist of their own (an
//   author: the framework's share transitions refuse anyone else, a steward and a distributor too, who hold the save);
// - range: the default reporting range (get#Context's defaults);
// - datasetIdPrefix: what a dataset created in Insights is named with; written here only: the steward group's grant is on
//   org.moqui.report.dataset.insights-* (BossSetupData), and the engine creates a dataset only under an id its creator's
//   own grant names;
// - datasetScopeLabel and datasetScopeHelp: the words of the dataset forms' scope field under Insights, the field that
//   carries a row's organization (the rowFilterParameters entry it is sent in is the scope policy's own, which Mantle's
//   organization policy registers as organizationField);
// - recipientPermissionId: whom a distributor may propose and name, Insights' readers: the framework's schedule and alert
//   screens ask find#ReportRecipients with it;
// - reportEmailTemplateId: the message of a schedule saved under Insights, written here only;
// - alertAudience: the fixed parts of an alert rule set under Insights, written here only: Insights' private topic, the
//   message sent to a recipient's own address and the link a notification opens, which the framework's alert
//   transitions write into every rule in place of contact points;
// - shareGroups: the wall displays, offered beside the sharer's own groups. Being here gives no right: the engine's save
//   accepts the group only from a sharer whose own grant holds its share artifact
//   (org.moqui.report.share.BOSS_INSIGHTS_DISPLAY: the author's, BossSetupData BOSS_INS_SHARE_DISPLAY);
// - calendar: the display zone and week start (its enumCode, the engine's week offset) of the organization in scope, nothing
//   where it set none; Insights' own Analysis (Analysis.js) reads it from this context through the framework's
//   ReportAnalysis.js calendarParameters, as the framework's Analysis reads it under a mount.
// The recipient cap (recipientCap above) is not read for every request: the areas that deliver add it (deliveryPolicy
// below, set by Scheduled reports and by Business alerts through the framework's ReportMount.js policyWith).
function reportPolicy(capabilities, settings) {
    const weekOffset = settings.weekStart
        ? one("moqui.basic.Enumeration", {enumId: settings.weekStart, enumTypeId: "InsightsWeekStart"})?.enumCode || null
        : null
    return {
        features: {alert: !!(capabilities.author || capabilities.distribute), share: !!capabilities.author},
        range: {from: defaultRange.from, thru: defaultRange.thru},
        datasetIdPrefix: "insights-",
        datasetScopeLabel: "Organization field",
        datasetScopeHelp: "The field that carries each row's organization",
        recipientPermissionId: capabilityPermissions.view,
        reportEmailTemplateId: "BOSS_INSIGHTS_REPORT",
        alertAudience: {
            topic: "InsightsBusinessAlert",
            emailTemplateId: "BOSS_INSIGHTS_ALERT",
            detailLink: "/qapps/Insights/Alerts/AlertDetail"
        },
        shareGroups: [{value: wallDisplayGroupId, label: "Wall displays"}],
        calendar: settings.displayTimeZone || weekOffset ? {timeZone: settings.displayTimeZone || null, weekOffset} : null
    }
}
// The variables a dashboard's panels are fixed to under Insights, as Insights › Dashboard fixes them (design §4 Dashboard):
// the organization in scope (the chosen one, else the user's organizations; none fixed for the administrator in every
// organization; a user of no organization is fixed to _NA_, which matches no record), also as vendorPartyId where the
// dashboard declares that variable over Mantle's sales datasets. found is get#Context's answer for the requested organization.
function scopeVariables(found, definition) {
    const scopeOrganization =
        found.organizationPartyId ||
        (found.allOrganizations ? null : found.organizationPartyIds.length ? found.organizationPartyIds : ["_NA_"])
    if (!scopeOrganization) return {}
    const seller = Array.from(definition?.body?.variables || []).some(
        variable => variable.name === "vendorPartyId" && String(variable.datasetId || "").startsWith("mantle-sales")
    )
    return Object.assign({organizationPartyId: scopeOrganization}, seller ? {vendorPartyId: scopeOrganization} : {})
}
// get#Context: the organization choices, the organization in scope (a requested one only when it is the user's, else the active
// one, else the only one), the capabilities, the safe defaults (the reporting range; currencies kept apart, never a default
// currency; the organization in scope's display zone and week start where it set them) and the canonical links. A requested organization outside the user's is refused (ORGANIZATION_UNAVAILABLE), whether
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
    const settings = organizationPartyId ? organizationSettings(organizationPartyId).values : {}
    return {
        capabilities: userScope.capabilities,
        organizations,
        organizationPartyIds: ids,
        organizationPartyId,
        allOrganizations: !userScope.ownerIds,
        defaults: {
            from: defaultRange.from,
            thru: defaultRange.thru,
            currencyMode: "native",
            displayTimeZone: settings.displayTimeZone || null,
            weekStart: settings.weekStart || null
        },
        appRoot: "Insights",
        linkBase: "//Insights",
        webBase: "/qapps/Insights",
        sharedLinks: Object.fromEntries(
            linkPaths.map(path => [path, "//Insights/" + path + (tabbedRecords.includes(path) ? "/InsightsRecord" : "")])
        ),
        reportLinks: reportLinks(userScope.capabilities),
        reportPolicy: reportPolicy(userScope.capabilities, settings)
    }
}

// ===== sharing (design §4 ShareDashboard) =====
// A dashboard and a playlist are shared on the framework's screens (Dashboard's share and Playlists' sharePlaylist, taken in
// by Insights' own: the policy's features.share and shareGroups above, and the report engine's save, which accepts only a
// group of the sharer's own or one whose share artifact their own grant holds). What stays here is the group choice of
// Insights' own forms (a saved report's copy, an analysis, a flow map, a digest): the user's own groups, by name, never the
// implicit ALL_USERS. Sharing gives the group the definition only; each viewer's queries still run with their own dataset grants.
// The wall displays' group (P11, design §4 Playlists), every display account's group (BOSS_INSIGHTS_DISPLAY), which no person
// is in, is not among them: a playlist and its dashboards are shared with it on the framework's screens (the policy's
// shareGroups), and are then read by the registered displays, each showing only what its own display account's grants and
// organizations give.
const wallDisplayGroupId = "BOSS_INSIGHTS_DISPLAY"
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
// The same in a transaction of its own, for a call whose refusal the caller expects and gets past (an unread dataset, a guard's
// refusal): the refusal does not mark the caller's transaction.
function asViewerApart(name, parameters) {
    const out = ec.service.sync().name(name).parameters(parameters).requireNewTransaction(true).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// A screen's read with its refusal as an answer (P12, impl-admin F129): a service-call with ignore-error clears the message, so
// a screen cannot read a refusal's reason after it. With answerRefusal the read's refusal (a "CODE: text" error) is answered as
// {refusalCode, refusal}; any other failure is logged and answered as FAILED with a plain sentence, never its text. Without
// answerRefusal the read fails as before, for every other caller.
function answering(parameters, read) {
    if (!parameters || parameters.answerRefusal !== true) return read()
    try {
        return read()
    } catch (error) {
        const text = String(error?.message ?? error ?? "")
        const code = lib.reasonCode(error)
        ec.message.clearErrors()
        // a refusal's code has an underscore (every Insights and engine refusal's does), so an exception's text with a
        // code-like prefix (a database's ERROR:, URL:, JSON:) is a failure, never shown (as Admin's AdminCalls.read, P19 review)
        if (code && code.includes("_"))
            return {refusalCode: code, refusal: text.replace(/^(Error:\s*)?[A-Z][A-Z0-9_]+:\s*/, "").substring(0, 300)}
        ec.logger.warn("Insights read refused or failed for " + ec.user.username + ": " + text)
        return {
            refusalCode: "FAILED",
            refusal: /not authorized/i.test(text) ? "You may not read this" : "This could not be read now"
        }
    }
}

// get#DeliveryPolicy: what a delivering area adds to the root's reportPolicy, the recipient cap of the caller's scope.
function deliveryPolicy() {
    return {recipientCap: recipientCap(required())}
}

const operations = {context, shareGroups, deliveryPolicy}
;({
    // the scope for a later phase's own module: the user's scope, the same refusing a user without Insights
    scope,
    required,
    sees,
    // the user's root and screen grants (P4: whether a catalog entry's route opens, Admin.js destinationOpens)
    grants: rootGrants,
    // P6: the context, the fixed scope variables and an engine call as the viewer, for Drill.js, Analysis.js and Records.js
    context,
    scopeVariables,
    asViewer,
    asViewerApart,
    shareGroupIds,
    // P10: the organization's analytics defaults, for Settings.js and every module that applies one
    settingTypes,
    organizationSettings,
    recipientCeiling,
    recipientCap,
    partyName,
    organizationIds,
    // P12: a screen's read with its refusal as an answer (impl-admin F129)
    answering,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights operation " + op)
        return operations[op](parameters)
    }
})
