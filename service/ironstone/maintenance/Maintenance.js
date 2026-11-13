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
const procedures = () => ec.resource.script("component://mr-mantle/service/mantle/work/MaintenanceProcedures.js")
const plans = () => ec.resource.script("component://mr-mantle/service/mantle/work/MaintenancePlans.js")
const settings = () => ec.resource.script("component://mr-mantle/service/mantle/work/MaintenanceSettings.js")
// P8 review: People's restricted qualification kinds, left out of the qualification choice
const development = () => ec.resource.script("component://mr-mantle/service/mantle/humanres/Development.js")
const {find, one, denied} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Maintenance.xml"
const areaLocation = area => "component://mr-boss/screen/Maintenance/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100
// the technicians a typed name is looked for among: Mantle's find#MaintenanceCandidates ranks at most 200
const candidateSearchLimit = 200

// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_MNT_<Area>): Settings the Maintenance
// administrator's (P1). Home is every Maintenance user's. Each also needs its Mantle capability (the user's call of Nov 12 on
// F346): a custom group given Maintenance in Admin is no member of BOSS_MAINTENANCE, so the area's deny rows do not reach it.
const areas = {
    settings: {area: "Settings", capability: "settingsEdit"}
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
// An area is the user's when a grant opens all of it: a non-inheritable grant on its frame opens only the screens named under it
// (BOSS_MNT_TEAMS: Settings' Teams tab for a planner or supervisor, P8 review), not the area.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(
        areaLocation(area),
        grants.authzRows.filter(row => row.inheritAuthz !== "N")
    )
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's maintenance scope and the areas. Without the root grant nothing of
// Mantle's scope is read.
function scope() {
    const grants = rootGrants()
    const mantle = grants.read ? maintenanceAccess.scope() : null
    const capabilities = Object.assign({read: grants.read}, mantle?.capabilities || {})
    for (const [name, {area, capability}] of Object.entries(areas))
        capabilities[name] = areaGrant(grants, area) && !!capabilities[capability]
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
    "Settings",
    // P2: Equipment and Facilities, and the shared records mounted under them (design §6)
    "Equipment/Find",
    "Equipment/AssetTags",
    "Equipment/EquipmentDetail",
    "Equipment/Product360",
    "Equipment/Employee360",
    "Facilities/Find",
    "Facilities/FacilityDetail",
    // P3: Work orders and the work order record (design §3)
    "WorkOrders/Find",
    "WorkOrders/NewWorkOrder",
    "WorkOrders/WorkOrderDetail",
    "Settings/WorkPolicy",
    // P4: Requests and the request record (design §3 Requests)
    "Requests/Find",
    "Requests/RequestDetail",
    // P5: Downtime, under Equipment (design §6)
    "Equipment/Downtime",
    // P15: Scheduling's Resources, a resource's policy and Blackouts (design §7)
    "Scheduling/Resources",
    "Scheduling/ResourcePolicyDetail",
    "Scheduling/Blackouts",
    // P16: Scheduling's BookingRequests and ResourceCalendar (design §7)
    "Scheduling/BookingRequests",
    "Scheduling/ResourceCalendar",
    // P6: Procedures and the procedure record (design §4)
    "Procedures/Find",
    "Procedures/ProcedureDetail",
    // P7: a work order's follow-up task, Commons' work item with the Maintenance context
    "WorkOrders/WorkItemDetail",
    // P9: a work order's parts issued and returned, and a part's stock (design §3 mount rows)
    "WorkOrders/MaterialIssueReceipt",
    "WorkOrders/InventoryAvailability",
    // P13: preventive plans and the plan record (design §5)
    "Preventive/Plans/Find",
    "Preventive/Plans/PlanDetail",
    // P14: the due list and the compliance report (design §5 DueMaintenance, §8)
    "Preventive/DueMaintenance",
    "Reports/PreventiveComplianceReport",
    // P10: a purchase order of the work (the shared OrderDetail, read only)
    "WorkOrders/OrderDetail",
    // P18: the lookups, the setup readiness and the equipment import (design §9, §6)
    "Settings/Lookups",
    "Settings/Readiness",
    "Equipment/EquipmentImport",
    // P11: the cost report (the cost reader's, BOSS_MNT_COSTS)
    "Reports/MaintenanceCostReport",
    // P12: a customer repair's intervention report
    "WorkOrders/InterventionReport",
    // P17: the Reports landing and the work status report (design §8)
    "Reports/Overview",
    "Reports/WorkStatusReport"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Maintenance") denied("MAINTENANCE_CONTEXT", "Maintenance context is not available")
    const userScope = required()
    const mantle = userScope.mantle
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: organizationIds(userScope),
        activeOrganizationPartyId: mantle.activeOrganizationPartyId || null,
        // a new record's organization: the active, the only, or the user's own (impl-sales F111)
        defaultOrganizationPartyId: ec.resource
            .script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
            .defaultOrganization(mantle),
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
        destination: "Facilities/FacilityDetail",
        parameter: "facilityId",
        read: (userScope, facilityId) => {
            const found = maintenanceAccess.requireFacility(userScope.mantle, facilityId)
            return {
                organizationPartyId: found.organizationPartyId,
                label: facilityName(facilityId),
                detail: organizationName(found.organizationPartyId)
            }
        }
    },
    // P3: a work order (its root WorkEffort; a step reads as its root's), through Mantle's work read (a broad reader of its
    // service organization, or the technician it is assigned to)
    workOrder: {
        name: "Work order",
        icon: "sym_o_handyman",
        destination: "WorkOrders/WorkOrderDetail",
        parameter: "workEffortId",
        read: (userScope, workEffortId) => {
            const found = maintenanceAccess.requireWork(userScope.mantle, workEffortId)
            if (!one("mantle.work.maintenance.MaintenanceWorkOrder", {workEffortId: found.rootWorkEffortId})) return null
            const root = one("mantle.work.effort.WorkEffort", {workEffortId: found.rootWorkEffortId})
            if (root.isTemplate === "Y") return null
            return {
                organizationPartyId: found.organizationPartyId,
                label: root.workEffortName || root.workEffortId,
                detail: organizationName(found.organizationPartyId),
                rootWorkEffortId: root.workEffortId
            }
        }
    },
    // P4: a maintenance request (RqtMaintenance) of the scope's organizations, for a planner or supervisor (who triage them); a
    // requester follows their own in Commons (impl-maintenance F78)
    request: {
        name: "Request",
        icon: "sym_o_report_problem",
        destination: "Requests/RequestDetail",
        parameter: "requestId",
        read: (userScope, requestId) => {
            const capabilities = userScope.mantle.capabilities
            if (!capabilities.plan && !capabilities.supervise) return null
            const request = one("mantle.request.Request", {requestId})
            if (request?.requestTypeEnumId !== "RqtMaintenance") return null
            const organization = Array.from(
                find("mantle.request.RequestParty", {requestId, roleTypeId: "OrgInternal"})
                    .conditionDate("fromDate", "thruDate", null)
                    .limit(1)
                    .list()
            )[0]
            if (!organization || !covers(userScope, organization.partyId)) return null
            return {
                organizationPartyId: organization.partyId,
                label: request.requestName || requestId,
                detail: organizationName(organization.partyId)
            }
        }
    },
    // P6: a procedure (its template root), through Mantle's procedure read (a reader of its organization's procedures, or a
    // technician assigned to work made of it, read only)
    procedure: {
        name: "Procedure",
        icon: "sym_o_checklist",
        destination: "Procedures/ProcedureDetail",
        parameter: "workEffortId",
        read: (userScope, workEffortId) => {
            const found = procedures().requireProcedure(userScope.mantle, workEffortId, "read")
            return {
                organizationPartyId: found.organizationPartyId,
                label: found.root.workEffortName || workEffortId,
                detail: organizationName(found.organizationPartyId),
                readOnly: !!found.readOnly,
                assignedRead: !!found.assignedRead
            }
        }
    },
    // P13: a preventive plan, through Mantle's plan read (a maintenance reader of its organization)
    plan: {
        name: "Plan",
        icon: "sym_o_event_repeat",
        destination: "Preventive/Plans/PlanDetail",
        parameter: "maintenanceScheduleId",
        read: (userScope, maintenanceScheduleId) => {
            const schedule = plans().requireSchedule(userScope.mantle, maintenanceScheduleId)
            return {
                organizationPartyId: schedule.organizationPartyId,
                label: schedule.scheduleName || maintenanceScheduleId,
                detail: organizationName(schedule.organizationPartyId)
            }
        }
    },
    asset: {
        name: "Equipment",
        icon: "sym_o_build",
        destination: "Equipment/EquipmentDetail",
        parameter: "assetId",
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
        detail: found.detail,
        rootWorkEffortId: found.rootWorkEffortId || null,
        readOnly: !!found.readOnly
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
// enumeration options of a type, searched by description, with the selected one; a value ended in Maintenance's lookups (P18,
// Enumeration.thruDate) is offered for no new choice, only as the selected one; onlyIds narrows the query itself (a filter
// runs after its limit)
function enumOptions(enumTypeId, term, selected, filter = null, onlyIds = null) {
    const factory = ec.entity.conditionFactory
    let query = find("moqui.basic.Enumeration")
        .condition("enumTypeId", enumTypeId)
        .condition(
            factory.makeCondition(
                factory.makeCondition("thruDate", "is-null", null),
                "or",
                factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
            )
        )
        .orderBy("sequenceNum")
        .orderBy("description")
        .limit(choiceLimit * 2)
    if (term) query = query.condition(factory.makeCondition("description", "like", likeText(term)).ignoreCase())
    if (onlyIds) {
        if (!onlyIds.length) return withSelected([], selected, enumId => !!one("moqui.basic.Enumeration", {enumId, enumTypeId}), enumId => one("moqui.basic.Enumeration", {enumId})?.description || enumId)
        query = query.condition("enumId", "in", onlyIds)
    }
    let rows = Array.from(query.list())
    if (filter) rows = rows.filter(filter)
    const options = rows.slice(0, choiceLimit).map(row => ({value: row.enumId, label: row.description || row.enumId}))
    return withSelected(
        options,
        selected,
        enumId => !!one("moqui.basic.Enumeration", {enumId, enumTypeId}),
        enumId => one("moqui.basic.Enumeration", {enumId})?.description || enumId
    )
}
// the ids of an enumeration type's values
const enumIds = enumTypeId =>
    Array.from(find("moqui.basic.Enumeration").condition("enumTypeId", enumTypeId).selectField("enumId").list()).map(
        row => row.enumId
    )
const partyLabel = partyId => {
    const row = partyId ? one("mantle.party.PartyDetail", {partyId}) : null
    return row ? row.organizationName || [row.firstName, row.lastName].filter(Boolean).join(" ") || partyId : partyId || ""
}
// The organizations a warrantor or an agency may be, by name, searched in the query: an organization no user keeps private, and
// of the internal organizations only the scope's (another organization's people and private contacts are never offered).
function organizationPartyOptions(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    const internal = Array.from(
        find("mantle.party.PartyRole").condition("roleTypeId", "OrgInternal").selectField("partyId").list()
    ).map(row => row.partyId)
    const outside = internal.filter(partyId => !covers(userScope, partyId))
    let query = find("mantle.party.PartyDetail")
        .condition("partyTypeEnumId", "PtyOrganization")
        .condition("disabled", "is-null", null)
        .condition("privateOwnerUserId", "is-null", null)
        .orderBy("^organizationName")
        .limit(choiceLimit)
    if (outside.length) query = query.condition("partyId", "not-in", outside)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["partyId", "organizationName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
    const admits = partyId => {
        const row = one("mantle.party.PartyDetail", {partyId})
        return !!row && row.partyTypeEnumId === "PtyOrganization" && !row.privateOwnerUserId && !outside.includes(partyId)
    }
    return withSelected(options, selected, admits, partyLabel)
}
// The holders equipment may be given to: the people employed now by the scope's organizations, and those organizations, by name
// (as People's directory reaches them; nobody else's employees or contacts).
function custodianOptions(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    const organizations = organizationIds(userScope)
    if (!organizations.length) return []
    let query = find("mantle.party.PartyFromAndRelationship")
        .condition("relationshipTypeEnumId", "PrtEmployee")
        .condition("toPartyId", "in", organizations)
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
    const byParty = new Map()
    for (const row of Array.from(query.list()))
        if (!byParty.has(row.fromPartyId))
            byParty.set(row.fromPartyId, {
                value: row.fromPartyId,
                label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
            })
    const options = Array.from(byParty.values()).concat(organizationOptions(organizations, term, choiceLimit))
    const employed = partyId =>
        find("mantle.party.PartyRelationship")
            .condition({relationshipTypeEnumId: "PrtEmployee", fromPartyId: partyId})
            .condition("toPartyId", "in", organizations)
            .conditionDate("fromDate", "thruDate", null)
            .count() > 0
    return withSelected(options, selected, partyId => organizations.includes(partyId) || employed(partyId), partyLabel)
}
// the choices of equipment and facility records, answered only to a user who reads them (resourceRead)
const resourceChoices = [
    "facilityTypes",
    "equipmentTypes",
    "equipmentClasses",
    "roomFeatures",
    "custodyRoles",
    "readingReasons",
    "parties",
    "custodians",
    "equipmentModels",
    "equipment",
    "meters",
    "timeZones",
    "parentFacilities",
    // P5: downtime
    "downtimeReasons",
    "restoreDispositions",
    // P15: a blackout's reasons, a policy's approval modes and the people who may approve bookings
    "blockReasons",
    "approvalModes",
    "approvers"
]
// the choices of work orders, answered to a user who reads work (workRead) or keeps the work policy (settingsEdit)
// P6: the choices of procedures, answered to a reader of procedures or a planner or supervisor choosing one for work
const procedureChoices = [
    "procedures",
    "qualificationTypes",
    "procedureTypes",
    "procedureModels",
    "procedureClasses",
    "procedureFacilityTypes",
    "procedureSteps",
    "responseKinds",
    "measurementTypes",
    "measurementUoms",
    "skillTypes",
    "parts"
]
// P13: the choices of preventive plans, answered to a reader of maintenance work or a planner or supervisor
const planChoices = ["planDefaults", "planMeters", "holidayCalendars"]
const workChoices = [
    "maintenanceKinds",
    "maintenanceTypes",
    "maintenanceSources",
    "severities",
    "failureModes",
    "holdReasons",
    "cancelReasons",
    "outcomes",
    "dispositions",
    "closurePolicies",
    "teams",
    "workPeople",
    "technicians",
    "workFacilities",
    "openWorkOrders",
    "rejectReasons",
    // P9: a work order's charge and its parts
    "costCenters",
    "projects",
    "stockParts",
    "partFacilities"
]
// The teams of the scope's organizations (one organization's with organizationPartyId): an OrgTeam of an organization by People's
// rule (the one its rollups reach, else its internal owner: Mantle's UnitEmployers.js; impl-people follow-up 3).
function teamOptions(userScope, term, selected, p) {
    const organizations = p?.organizationPartyId
        ? covers(userScope, p.organizationPartyId)
            ? [p.organizationPartyId]
            : []
        : organizationIds(userScope)
    if (!organizations.length) return []
    const units = ec.resource.script("component://mr-mantle/service/mantle/humanres/UnitEmployers.js")
    const options = units
        .teamsOf(organizations, term || null)
        .slice(0, choiceLimit)
        .map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
    const admits = partyId => organizations.includes(units.teamOrganizations([partyId])[partyId] || "")
    return withSelected(options, selected, admits, partyLabel)
}
// The people a work order may be assigned to: the persons employed by or agents of the scope's organizations now (one
// organization's with organizationPartyId), by name, as Mantle's schedule#MaintenanceWorkOrder admits them.
function workPeopleOptions(userScope, term, selected, p) {
    const factory = ec.entity.conditionFactory
    const organizations = p?.organizationPartyId
        ? covers(userScope, p.organizationPartyId)
            ? [p.organizationPartyId]
            : []
        : organizationIds(userScope)
    if (!organizations.length) return []
    let query = find("mantle.party.PartyFromAndRelationship")
        .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent"])
        .condition("toPartyId", "in", organizations)
        .condition("partyTypeEnumId", "PtyPerson")
        .conditionDate("fromDate", "thruDate", null)
        .selectField(["fromPartyId", "firstName", "lastName"])
        .orderBy(["^firstName", "^lastName"])
        .limit(choiceLimit * 2)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["fromPartyId", "firstName", "lastName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const byParty = new Map()
    for (const row of Array.from(query.list()))
        if (!byParty.has(row.fromPartyId))
            byParty.set(row.fromPartyId, {
                value: row.fromPartyId,
                label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
            })
    const member = partyId =>
        find("mantle.party.PartyRelationship")
            .condition({fromPartyId: partyId})
            .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent"])
            .condition("toPartyId", "in", organizations)
            .conditionDate("fromDate", "thruDate", null)
            .count() > 0
    return withSelected(Array.from(byParty.values()).slice(0, choiceLimit), selected, member, partyLabel)
}
function technicianOptions(userScope, term, selected, p) {
    const caps = userScope.capabilities
    if (!p?.workEffortId || !(caps.plan || caps.supervise)) return workPeopleOptions(userScope, term, selected, p)
    const lower = String(term || "").toLowerCase()
    let found
    try {
        found = lib.probe("mantle.work.MaintenanceServices.find#MaintenanceCandidates", {
            workEffortId: p.workEffortId,
            teamPartyId: p.teamPartyId ?? null,
            // a typed name looks among every ranked candidate (Mantle's cap), not only the first page of the ranking
            limit: lower ? candidateSearchLimit : null,
            // a date-time field's empty mask ("____-__-__ __:__") or a partial entry is no window
            windowFrom: /^\d{4}-\d{2}-\d{2}/.test(String(p.windowFrom || "")) ? p.windowFrom : null,
            windowThru: /^\d{4}-\d{2}-\d{2}/.test(String(p.windowThru || "")) ? p.windowThru : null
        })
    } catch (error) {
        return []
    }
    const options = Array.from(found.candidateList || [])
        .filter(row => !lower || String(row.name).toLowerCase().includes(lower))
        .slice(0, choiceLimit)
        .map(row => ({value: row.partyId, label: row.label}))
    return withSelected(options, selected, () => false, partyLabel)
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
    },
    // P2: the drop-downs of Equipment, Facilities and their shared records
    facilityTypes: (userScope, term, selected) => enumOptions("FacilityType", term, selected),
    equipmentTypes: (userScope, term, selected) =>
        enumOptions("AssetType", term, selected, row => !["AstTpInventory", "AstTpSupplies"].includes(row.enumId)),
    equipmentClasses: (userScope, term, selected) => enumOptions("AssetClass", term, selected),
    roomFeatures: (userScope, term, selected) => enumOptions("RoomFeature", term, selected),
    custodyRoles: (userScope, term, selected) => {
        const roles = ["Custodian", "Operator"]
        return roles
            .map(roleTypeId => ({
                value: roleTypeId,
                label: one("mantle.party.RoleType", {roleTypeId})?.description || roleTypeId
            }))
            .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()))
    },
    readingReasons: (userScope, term, selected) =>
        enumOptions("AssetMeterReadingReason", term, selected, row => row.enumId !== "AmrCorrection"),
    // a warrantor or a registration agency: organizations, of the internal ones only the scope's
    parties: (userScope, term, selected) => organizationPartyOptions(userScope, term, selected),
    // a custodian or operator: the scope's organizations' employees, and the organizations
    custodians: (userScope, term, selected) => custodianOptions(userScope, term, selected),
    // equipment models: products of equipment type
    equipmentModels: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product")
            .condition("assetTypeEnumId", "AstTpEquipment")
            .orderBy("productName")
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["productId", "productName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({value: row.productId, label: row.productName || row.productId}))
        return withSelected(
            options,
            selected,
            productId => !!one("mantle.product.Product", {productId}),
            productId => one("mantle.product.Product", {productId})?.productName || productId
        )
    },
    // equipment of the scope (a parent), never the asset itself (assetId)
    equipment: (userScope, term, selected, p) => {
        const found = lib.probe("mantle.product.MaintenanceResourceServices.find#MaintenanceEquipment", {
            text: term || null,
            pageSize: choiceLimit
        })
        const options = Array.from(found.equipmentList || [])
            .filter(row => row.assetId !== p?.assetId)
            .map(row => ({value: row.assetId, label: row.assetName + (row.serialNumber ? " (" + row.serialNumber + ")" : "")}))
        return withSelected(
            options,
            selected,
            assetId => {
                try {
                    return !!recordOf(userScope, "asset", assetId)
                } catch (error) {
                    return false
                }
            },
            assetId => one("mantle.product.asset.Asset", {assetId})?.assetName || assetId
        )
    },
    // the meters of an equipment's model, or the meter types for equipment whose model has none
    meters: (userScope, term, selected, p) => {
        const asset = p?.assetId ? one("mantle.product.asset.Asset", {assetId: p.assetId}) : null
        if (!asset) return []
        recordOf(userScope, "asset", asset.assetId)
        const modelMeters = asset.productId
            ? Array.from(find("mantle.product.maintenance.ProductMeter").condition("productId", asset.productId).list())
            : []
        if (modelMeters.length)
            return modelMeters.map(row => ({
                value: row.productMeterId,
                label:
                    row.meterName ||
                    one("mantle.product.maintenance.ProductMeterType", {productMeterTypeId: row.productMeterTypeId})
                        ?.description ||
                    row.productMeterId
            }))
        return Array.from(find("mantle.product.maintenance.ProductMeterType").orderBy("description").list()).map(row => ({
            value: "type:" + row.productMeterTypeId,
            label: row.description || row.productMeterTypeId
        }))
    },
    // the time zones, searched by name
    timeZones: (userScope, term, selected) => {
        const zones = Array.from(ec.l10n.getAvailableTimeZones() || []).map(String)
        const found = zones.filter(zone => !term || zone.toLowerCase().includes(term.toLowerCase())).slice(0, choiceLimit)
        if (selected && !found.includes(selected) && zones.includes(selected)) found.push(selected)
        return found.map(zone => ({value: zone, label: zone}))
    },
    // P3: the lookups of work orders (design §9; Settings' Lookups maintain them from P18)
    maintenanceKinds: (userScope, term, selected) => enumOptions("MaintenanceKind", term, selected),
    maintenanceTypes: (userScope, term, selected) => enumOptions("MaintenanceType", term, selected),
    maintenanceSources: (userScope, term, selected) => enumOptions("MaintenanceSource", term, selected),
    severities: (userScope, term, selected) => enumOptions("MaintenanceSeverity", term, selected),
    // P18: with the work's equipment (assetId, in the scope), the failure modes that apply to it (MaintenanceSettings.js)
    failureModes: (userScope, term, selected, p) => {
        const assetId = p?.assetId && lib.check(() => recordOf(userScope, "asset", p.assetId)).allowed ? p.assetId : null
        // in the query, not after its limit: a failure mode that applies is offered however many there are (P18 review R3)
        const applies = assetId ? Array.from(settings().applicableFailureModes(enumIds("MaintenanceFailureMode"), assetId)) : null
        return enumOptions("MaintenanceFailureMode", term, selected, null, applies)
    },
    holdReasons: (userScope, term, selected) => enumOptions("MaintenanceHoldReason", term, selected),
    cancelReasons: (userScope, term, selected) => enumOptions("MaintenanceCancelReason", term, selected),
    outcomes: (userScope, term, selected) => enumOptions("MaintenanceOutcome", term, selected),
    dispositions: (userScope, term, selected) => enumOptions("MaintenanceDisposition", term, selected),
    closurePolicies: (userScope, term, selected) => enumOptions("MaintenanceClosurePolicy", term, selected),
    // P5: an outage's reason, and the dispositions a restoration may give (not still unavailable)
    downtimeReasons: (userScope, term, selected) => enumOptions("ResourceUnavailabilityReason", term, selected),
    restoreDispositions: (userScope, term, selected) =>
        enumOptions("MaintenanceDisposition", term, selected, row => row.enumId !== "MdispUnavailable"),
    // P15: a planned block's reasons (the planned ones), how a managed resource's bookings are approved, and its approvers: the
    // people of the scope's organizations, as a work order's
    blockReasons: (userScope, term, selected) =>
        enumOptions("ResourceUnavailabilityReason", term, selected, row => row.optionIndicator === "Y"),
    approvalModes: (userScope, term, selected) => enumOptions("ResourceBookingApprovalMode", term, selected),
    approvers: (userScope, term, selected, p) => workPeopleOptions(userScope, term, selected, p),
    // the teams and people work may be given to
    teams: (userScope, term, selected, p) => teamOptions(userScope, term, selected, p),
    workPeople: (userScope, term, selected, p) => workPeopleOptions(userScope, term, selected, p),
    // P8: a work order's technicians ranked for its window and team (Mantle's find#MaintenanceCandidates: free hours, skill,
    // People's qualification state, the team), each labelled so; a planner's or supervisor's, the organization's people otherwise
    technicians: (userScope, term, selected, p) => technicianOptions(userScope, term, selected, p),
    // P8: the qualification that proves a procedure step's skill (People's QualificationType values)
    // (never a restricted kind, People's identity documents and work permits: P8 review)
    qualificationTypes: (userScope, term, selected) =>
        enumOptions("QualificationType", term, selected, row => !development().isRestricted(row.enumId)),
    // a facility work is for: every facility of the scope (a room inside a building), through Mantle's scoped find
    workFacilities: (userScope, term, selected) => {
        if (!userScope.capabilities.resourceRead) return []
        const found = lib.probe("mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities", {
            text: term || null,
            pageSize: choiceLimit
        })
        const options = Array.from(found.facilityList || [])
            .filter(row => !row.hiddenAncestor)
            .map(row => ({value: row.facilityId, label: row.facilityName}))
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
    },
    // P4: an open work order a request may join (one organization's with organizationPartyId), through Mantle's scoped list
    openWorkOrders: (userScope, term, selected, p) => {
        const found = lib.probe("mantle.work.MaintenanceServices.find#MaintenanceWorkOrders", {
            text: term || null,
            organizationPartyId: p?.organizationPartyId || null,
            pageSize: choiceLimit
        })
        const options = Array.from(found.workOrderList || []).map(row => ({
            value: row.workEffortId,
            label: row.workEffortName + " (" + [row.workEffortId, row.targetName].filter(Boolean).join(", ") + ")"
        }))
        return withSelected(
            options,
            selected,
            workEffortId => {
                try {
                    return !!recordOf(userScope, "workOrder", workEffortId)
                } catch (error) {
                    return false
                }
            },
            workEffortId => one("mantle.work.effort.WorkEffort", {workEffortId})?.workEffortName || workEffortId
        )
    },
    // the reasons a request is rejected (the request resolutions triage#MaintenanceRequest takes)
    rejectReasons: (userScope, term, selected) =>
        enumOptions("RequestResolution", term, selected, row =>
            ["RrRejected", "RrDuplicate", "RrWontFix", "RrInsufficient", "RrCantReproduce"].includes(row.enumId)
        ),
    // the facilities of the scope as a parent: every facility of the scope (a room inside a building), never the facility itself
    // (facilityId)
    parentFacilities: (userScope, term, selected, p) => {
        const found = lib.probe("mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities", {
            text: term || null,
            pageSize: choiceLimit
        })
        // an unnamed node (a parent outside the scope, hidden-n) is no facility to choose
        const options = Array.from(found.facilityList || [])
            .filter(row => !row.hiddenAncestor && row.facilityId !== p?.facilityId)
            .map(row => ({value: row.facilityId, label: row.facilityName}))
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
    },
    // P6: procedures. The approved procedures in effect that apply to the work's target (assetId or facilityId), for new work
    procedures: (userScope, term, selected, p) => {
        const found = lib.probe("mantle.work.ProcessServices.find#WorkProcesses", {
            text: term || null,
            usable: true,
            assetId: p?.assetId || null,
            facilityId: p?.assetId ? null : p?.facilityId || null,
            pageSize: choiceLimit
        })
        return Array.from(found.procedureList || []).map(row => ({
            value: row.workEffortId,
            label: row.workEffortName + (row.stepCount ? " (" + row.stepCount + " steps)" : "")
        }))
    },
    procedureTypes: (userScope, term, selected) => enumOptions("MaintenanceType", term, selected),
    procedureClasses: (userScope, term, selected) => enumOptions("AssetClass", term, selected),
    procedureFacilityTypes: (userScope, term, selected) => enumOptions("FacilityType", term, selected),
    procedureModels: (userScope, term, selected) => productOptions(term, selected, "AstTpEquipment"),
    parts: (userScope, term, selected) => productOptions(term, selected, null),
    skillTypes: (userScope, term, selected) => enumOptions("SkillType", term, selected),
    responseKinds: (userScope, term, selected) => enumOptions("WorkStepResponseKind", term, selected),
    measurementTypes: (userScope, term, selected) => {
        const rows = Array.from(find("mantle.work.measurement.MeasurementType").orderBy("description").list()).filter(
            row =>
                row.hasValue !== "N" &&
                (!term ||
                    String(row.description || row.measurementTypeId)
                        .toLowerCase()
                        .includes(term.toLowerCase()))
        )
        return rows
            .slice(0, choiceLimit)
            .map(row => ({value: row.measurementTypeId, label: row.description || row.measurementTypeId}))
    },
    // the units of a measurement type's kind (measurementTypeId), or every unit that measures something
    measurementUoms: (userScope, term, selected, p) => {
        const type = p?.measurementTypeId
            ? one("mantle.work.measurement.MeasurementType", {measurementTypeId: p.measurementTypeId})
            : null
        let query = find("moqui.basic.Uom")
            .orderBy("description")
            .limit(choiceLimit * 4)
        if (type?.uomTypeEnumId) query = query.condition("uomTypeEnumId", type.uomTypeEnumId)
        else query = query.condition("uomTypeEnumId", "not-in", ["UT_CURRENCY_MEASURE", "UT_TIME_FREQ_MEASURE"])
        const rows = Array.from(query.list()).filter(
            row =>
                !term ||
                String(row.description || row.uomId)
                    .toLowerCase()
                    .includes(term.toLowerCase())
        )
        const options = rows
            .slice(0, choiceLimit)
            .map(row => ({
                value: row.uomId,
                label: (row.description || row.uomId) + (row.abbreviation ? " (" + row.abbreviation + ")" : "")
            }))
        return withSelected(
            options,
            selected,
            uomId => !!one("moqui.basic.Uom", {uomId}),
            uomId => one("moqui.basic.Uom", {uomId})?.description || uomId
        )
    },
    // P13: the maintenance defaults of an equipment's model (assetId), for a plan that follows one
    planDefaults: (userScope, term, selected, p) => {
        const asset = p?.assetId ? one("mantle.product.asset.Asset", {assetId: p.assetId}) : null
        if (!asset?.productId) return []
        recordOf(userScope, "asset", asset.assetId)
        return Array.from(find("mantle.product.maintenance.ProductMaintenance", {productId: asset.productId}).list())
            .filter(
                row =>
                    !term ||
                    String(row.description || row.productMaintenanceId)
                        .toLowerCase()
                        .includes(term.toLowerCase())
            )
            .slice(0, choiceLimit)
            .map(row => ({value: row.productMaintenanceId, label: row.description || row.productMaintenanceId}))
    },
    // the counting meters of an equipment's model (assetId), the meters a plan reads
    planMeters: (userScope, term, selected, p) => {
        const asset = p?.assetId ? one("mantle.product.asset.Asset", {assetId: p.assetId}) : null
        if (!asset?.productId) return []
        recordOf(userScope, "asset", asset.assetId)
        return Array.from(
            find("mantle.product.maintenance.ProductMeter", {productId: asset.productId, isCumulative: "Y"}).list()
        ).map(row => ({value: row.productMeterId, label: row.meterName || row.productMeterId}))
    },
    // People's holiday calendars (WcatHoliday categories) of the scope's organizations (one organization's with
    // organizationPartyId) and the shared ones
    holidayCalendars: (userScope, term, selected, p) => {
        const owners = p?.organizationPartyId
            ? covers(userScope, p.organizationPartyId)
                ? [p.organizationPartyId]
                : []
            : organizationIds(userScope)
        const factory = ec.entity.conditionFactory
        let query = find("mantle.work.effort.WorkEffortCategory", {categoryTypeEnumId: "WcatHoliday"})
            .condition(
                factory.makeCondition(
                    [factory.makeCondition("ownerPartyId", "is-null", null)].concat(
                        owners.length ? [factory.makeCondition("ownerPartyId", "in", owners)] : []
                    ),
                    "or"
                )
            )
            .orderBy("description")
            .limit(choiceLimit)
        if (term) query = query.condition(factory.makeCondition("description", "like", likeText(term)).ignoreCase())
        const options = Array.from(query.list()).map(row => ({
            value: row.workEffortCategoryId,
            label: row.description || row.workEffortCategoryId
        }))
        const admits = id => {
            const row = one("mantle.work.effort.WorkEffortCategory", {workEffortCategoryId: id})
            return row?.categoryTypeEnumId === "WcatHoliday" && (!row.ownerPartyId || owners.includes(row.ownerPartyId))
        }
        return withSelected(
            options,
            selected,
            admits,
            id => one("mantle.work.effort.WorkEffortCategory", {workEffortCategoryId: id})?.description || id
        )
    },
    // the steps of a procedure (rootWorkEffortId) a step may wait for, never the step itself (workEffortId)
    procedureSteps: (userScope, term, selected, p) => {
        if (!p?.rootWorkEffortId) return []
        let found
        try {
            found = procedures().requireProcedure(userScope.mantle, p.rootWorkEffortId, "read")
        } catch (error) {
            return []
        }
        return Array.from(
            find("mantle.work.effort.WorkEffort", {rootWorkEffortId: found.root.workEffortId}).orderBy("sequenceNum").list()
        )
            .filter(row => row.workEffortId !== p.workEffortId)
            .filter(
                row =>
                    !term ||
                    String(row.workEffortName || "")
                        .toLowerCase()
                        .includes(term.toLowerCase())
            )
            .slice(0, choiceLimit * 2)
            .map(row => ({value: row.workEffortId, label: row.workEffortName || row.workEffortId}))
    },
    // P9: the charge and the parts of a work order (organizationPartyId: the work's organization)
    costCenters: (userScope, term, selected, p) => chargeOptions(userScope, term, selected, p, "costCenter"),
    projects: (userScope, term, selected, p) => chargeOptions(userScope, term, selected, p, "project"),
    // inventory and supplies (both issued to maintenance work and routed to its expense, the user's call of Nov 12)
    stockParts: (userScope, term, selected) => productOptions(term, selected, ["AstTpInventory", "AstTpSupplies"]),
    partFacilities: (userScope, term, selected, p) => {
        const organizationPartyId = p?.organizationPartyId
        if (!organizationPartyId || !covers(userScope, organizationPartyId)) return []
        const options = Array.from(
            find("mantle.facility.Facility", {ownerPartyId: organizationPartyId})
                .condition("facilityTypeEnumId", "in", ["FcTpWarehouse", "FcTpWarehouseRoom", "FcTpRetailStore", "FcTpPlant"])
                .orderBy("facilityName")
                .limit(choiceLimit * 2)
                .list()
        )
            .filter(row => !term || String(row.facilityName || row.facilityId).toLowerCase().includes(term.toLowerCase()))
            .map(row => ({value: row.facilityId, label: row.facilityName || row.facilityId}))
        return withSelected(
            options,
            selected,
            facilityId => one("mantle.facility.Facility", {facilityId})?.ownerPartyId === organizationPartyId,
            facilityName
        )
    }
}
// P9: the cost centres a work order may be charged to (its organization and the internal organizations rolling up to it) and
// its organization's open projects, as Mantle's store#MaintenanceWorkOrder admits them.
function chargeOptions(userScope, term, selected, p, kind) {
    const organizationPartyId = p?.organizationPartyId
    if (!organizationPartyId || !covers(userScope, organizationPartyId)) return []
    let options
    if (kind === "costCenter") {
        const ids = [organizationPartyId].concat(
            Array.from(
                find("mantle.party.PartyRelationship", {toPartyId: organizationPartyId, relationshipTypeEnumId: "PrtOrgRollup"})
                    .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                    .list()
            ).map(row => row.fromPartyId)
        )
        options = ids.map(partyId => ({value: partyId, label: partyLabel(partyId)}))
    } else
        options = Array.from(
            find("mantle.work.effort.WorkEffort", {workEffortTypeEnumId: "WetProject", ownerPartyId: organizationPartyId})
                .condition("statusId", "not-in", ["WeClosed", "WeCancelled", "WeComplete"])
                .orderBy("workEffortName")
                .limit(choiceLimit * 2)
                .list()
        ).map(row => ({value: row.workEffortId, label: row.workEffortName || row.workEffortId}))
    options = options.filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase())).slice(0, choiceLimit)
    return withSelected(
        options,
        selected,
        id => (kind === "costCenter" ? !!one("mantle.party.PartyRole", {partyId: id, roleTypeId: "OrgInternal"}) : !!one("mantle.work.effort.WorkEffort", {workEffortId: id})),
        id => (kind === "costCenter" ? partyLabel(id) : one("mantle.work.effort.WorkEffort", {workEffortId: id})?.workEffortName || id)
    )
}
// Products by id or name, of an asset type (or types) when one is named (equipment models, parts), with the selected one.
function productOptions(term, selected, assetTypeEnumId) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.product.Product").orderBy("productName").limit(choiceLimit)
    if (Array.isArray(assetTypeEnumId)) query = query.condition("assetTypeEnumId", "in", assetTypeEnumId)
    else if (assetTypeEnumId) query = query.condition("assetTypeEnumId", assetTypeEnumId)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["productId", "productName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({value: row.productId, label: row.productName || row.productId}))
    return withSelected(
        options,
        selected,
        productId => !!one("mantle.product.Product", {productId}),
        productId => one("mantle.product.Product", {productId})?.productName || productId
    )
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Maintenance choice " + p.choice)
    const caps = userScope.capabilities
    if (procedureChoices.includes(p.choice) && !caps.processView && !caps.plan && !caps.supervise) return {options: []}
    if (planChoices.includes(p.choice) && !caps.view && !caps.plan && !caps.supervise) return {options: []}
    if (resourceChoices.includes(p.choice) && !userScope.capabilities.resourceRead) return {options: []}
    if (workChoices.includes(p.choice) && !userScope.capabilities.workRead && !userScope.capabilities.settingsEdit)
        return {options: []}
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's Maintenance records, each opening its Maintenance screen, with recordEntity and recordId for Assist's search:
// equipment and facilities (P2), through Mantle's scoped finds (a user who reads no equipment finds none); work orders (P3) and
// procedures (P6).
const recordUrl = (kind, recordId) =>
    "/qapps/Maintenance/" + recordKinds[kind].destination + "?" + recordKinds[kind].parameter + "=" + encodeURIComponent(recordId)
const searchFinds = [
    // P6: procedures, through Mantle's scoped find (a reader of procedures)
    {
        kind: "procedure",
        rows: (userScope, text, limit) => {
            if (!userScope.mantle.capabilities.processView) return []
            const found = lib.probe("mantle.work.ProcessServices.find#WorkProcesses", {text, pageSize: limit})
            return Array.from(found.procedureList || []).map(row => ({
                title: row.workEffortName,
                subtitle: ["Procedure " + row.workEffortId, row.statusText, row.applicabilityText].filter(Boolean).join(" · "),
                icon: recordKinds.procedure.icon,
                recordEntity: "mantle.work.effort.WorkEffort",
                recordId: row.workEffortId,
                url: recordUrl("procedure", row.workEffortId)
            }))
        }
    },
    // P3: work orders, through Mantle's scoped list (a technician with the assigned view finds their own)
    {
        kind: "workOrder",
        rows: (userScope, text, limit) => {
            if (!userScope.mantle.capabilities.workRead) return []
            const found = lib.probe("mantle.work.MaintenanceServices.find#MaintenanceWorkOrders", {
                text,
                statusId: "all",
                pageSize: limit
            })
            return Array.from(found.workOrderList || []).map(row => ({
                title: row.workEffortName,
                subtitle: ["Work order " + row.workEffortId, row.targetName, row.statusText].filter(Boolean).join(" · "),
                icon: recordKinds.workOrder.icon,
                recordEntity: "mantle.work.effort.WorkEffort",
                recordId: row.workEffortId,
                url: recordUrl("workOrder", row.workEffortId)
            }))
        }
    },
    {
        kind: "asset",
        rows: (userScope, text, limit) => {
            if (!userScope.mantle.capabilities.resourceRead) return []
            const found = lib.probe("mantle.product.MaintenanceResourceServices.find#MaintenanceEquipment", {
                text,
                pageSize: limit
            })
            return Array.from(found.equipmentList || []).map(row => ({
                title: row.assetName,
                subtitle: ["Equipment", row.serialNumber, row.facilityName].filter(Boolean).join(" · "),
                icon: recordKinds.asset.icon,
                recordEntity: "mantle.product.asset.Asset",
                recordId: row.assetId,
                url: recordUrl("asset", row.assetId)
            }))
        }
    },
    {
        kind: "facility",
        rows: (userScope, text, limit) => {
            if (!userScope.mantle.capabilities.resourceRead) return []
            const found = lib.probe("mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities", {
                text,
                pageSize: limit
            })
            // an unnamed node (a parent outside the scope) is not a record to open
            return Array.from(found.facilityList || [])
                .filter(row => !row.hiddenAncestor)
                .map(row => ({
                    title: row.facilityName,
                    subtitle: ["Facility", row.typeText, row.organizationName].filter(Boolean).join(" · "),
                    icon: recordKinds.facility.icon,
                    recordEntity: "mantle.facility.Facility",
                    recordId: row.facilityId,
                    url: recordUrl("facility", row.facilityId)
                }))
        }
    }
]
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

// ===== asset tag scans =====
// resolve#EquipmentScan: the equipment a scanned tag (its EquipmentDetail link) or a typed id, serial or soft identifier names, of
// the user's scope (Mantle's find, so the scope is checked on each scan): exact matches first, else those the text finds.
function resolveScan(p) {
    const userScope = scope()
    const text = String(p.scanText || "").trim()
    if (!userScope.read || !userScope.capabilities.resourceRead || !text) return {matches: []}
    const linked = /[?&]assetId=([^&#]+)/.exec(text)
    const wanted = linked ? decodeURIComponent(linked[1]) : text
    const found = lib.probe("mantle.product.MaintenanceResourceServices.find#MaintenanceEquipment", {text: wanted, pageSize: 10})
    const rows = Array.from(found.equipmentList || [])
    const exact = rows.filter(row => [row.assetId, row.serialNumber].includes(wanted))
    return {
        matches: (exact.length ? exact : rows).map(row => ({
            identityType: "asset",
            id: row.assetId,
            label: "Equipment " + row.assetName,
            detail: [row.serialNumber, row.facilityName].filter(Boolean).join(" · ")
        }))
    }
}

// recordLink: a record's Maintenance screen for the current user (Commons' get#RecordLink), or null when Maintenance does not admit
// them to it (no root grant, or the record outside their scope).
function recordLink(p) {
    const userScope = scope()
    if (!userScope.read) return {url: null}
    try {
        const found = recordOf(userScope, p.recordType, p.recordId)
        return {url: recordUrl(p.recordType, found.rootWorkEffortId || found.recordId)}
    } catch (error) {
        return {url: null}
    }
}

// calendarResources (P16): the bookable rooms and equipment of the user's scope (Mantle's find#BookableResources, which checks the
// permission and scope: a booking approver gets those they approve) in the shape Commons' Schedules component reads, for
// ResourceCalendar: a facility as a room, an asset as equipment, its name opening its policy; resourceType all, room or equipment,
// and text narrow it. Nothing for a user without Maintenance or the read.
function calendarResources(p) {
    if (!scope().read) return {resourceList: []}
    ec.message.pushErrors()
    let found = []
    try {
        found = Array.from(
            ec.service
                .sync()
                .name("mantle.work.ResourceBookingServices.find#BookableResources")
                .parameters({
                    resourceType: p.resourceType === "room" ? "facility" : p.resourceType === "equipment" ? "asset" : null,
                    text: p.text || null,
                    pageSize: 100
                })
                .disableAuthz()
                .call()?.resourceList || []
        )
    } catch (error) {
        found = []
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    return {
        resourceList: found.map(row => {
            const room = row.resourceType === "facility"
            const resourceId = room ? row.facilityId : row.assetId
            return {
                resourceType: room ? "room" : "equipment",
                resourceId,
                key: (room ? "room|" : "equipment|") + resourceId,
                name: row.resourceName,
                typeLabel: row.typeText || "",
                icon: room ? "sym_o_meeting_room" : "sym_o_devices",
                site: row.locationName || "",
                capacity: row.capacityText ? Number(String(row.capacityText).replace(/[^0-9.]/g, "")) || null : null,
                approverNames: row.approverNames ? String(row.approverNames).split(", ") : [],
                requiresApproval: /approved by|approval required/.test(row.policyText || ""),
                policyText: row.policyText || "",
                url:
                    "/qapps/Maintenance/Scheduling/ResourcePolicyDetail?" +
                    (room ? "facilityId=" : "assetId=") +
                    encodeURIComponent(resourceId)
            }
        })
    }
}

const operations = {sharedContext, capabilities: capabilitiesOf, checkRecord, choices, search, resolveScan, recordLink, calendarResources}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance operation " + op)
    return operations[op](p || {})
}
// P19: the record check, the canonical links and the palette's finds, for the stack providers (StackServices, Stack.js)
;({execute: run, scope, recordOf, recordUrl, searchFinds})
