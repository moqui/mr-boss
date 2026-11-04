// The Manufacturing app's access (impl-manufacturing §2, §4, P1): the user's organizations, the plants they may work in
// and their capabilities, the record checks every Manufacturing screen and shared mount runs before a Mantle service, the
// plant preference, the drop-downs, the palette and record links. No entity filter covers WorkEffort (F3), so a run,
// operation or routing is checked here by its owner and facility; the Mantle production, method and quality services check
// their own permissions and organization again, and nothing here grants what Mantle refuses.
//
// Later phases extend the tables below rather than the functions: capabilityPermissions (a capability from a Moqui
// permission), recordKinds (a kind of record: its check and, once built, its screen), searchFinds (the palette), choiceSources
// (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Manufacturing.xml"
// the user preference of the selected plant; it never widens the scope
const plantPreference = "ManufacturingPlantActive"
const choiceLimit = 30
// a plant is a facility of this type, or the parent of a work center (a line under its warehouse, F16)
const plantTypes = ["FcTpPlant"]
const runPurpose = "WepProductionRun"
const routingPurposes = ["WepRouting", "WepRoutingTask"]

// ===== capabilities =====
// Each capability from the Moqui permission the Mantle services check (§2, design §1.1); financial read is Accounting's and
// stock issue Warehouse's. `read` is the root grant (below), and productionRead the reader's PRODUCTION_VIEW, which every
// Manufacturing group holds but the plant display.
const capabilityPermissions = {
    productionRead: "PRODUCTION_VIEW",
    plan: "PRODUCTION_PLAN",
    schedule: "PRODUCTION_SCHEDULE",
    operate: "PRODUCTION_OPERATE",
    supervise: "PRODUCTION_SUPERVISE",
    costReview: "PRODUCTION_COST_REVIEW",
    policyEdit: "PRODUCTION_POLICY_EDIT",
    supplyPlan: "SUPPLY_PLAN_RUN",
    methodRead: "METHOD_VIEW",
    methodEdit: "METHOD_EDIT",
    methodApprove: "METHOD_APPROVE",
    methodResources: "METHOD_RESOURCES",
    costRead: "PRODUCT_COST_VIEW",
    inspect: "QUALITY_INSPECT",
    qualityVerify: "QUALITY_VERIFY",
    qualityDispose: "QUALITY_DISPOSE",
    qualityTemplateEdit: "QUALITY_TEMPLATE_EDIT",
    issue: "STOCK_ISSUE",
    financialRead: "ACCOUNTING_VIEW"
}

// ===== scope =====
// The user's authorizations on the Manufacturing root, read directly so disabled or inherited artifact authorization cannot
// widen them: whether they may open Manufacturing and whether they work in every plant. Only a system administrator, or an
// authorization whose filter sets name MANTLE_ACTIVE_ORG and have no Facility filter (the admin group's), reaches every
// plant; any other grant is limited to the user's organizations (MANTLE_USER_ORG's ownerPartyId in filterOrgIds), so a
// grant set up without filters fails closed. As Warehouse.js's rootGrants.
function rootGrants() {
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return {read: false, unrestricted: false}
    if (access.systemAdmin()) return {read: true, unrestricted: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return {read: false, unrestricted: false}
    const grants = Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    ).filter(row =>
        row.nameIsPattern === "Y"
            ? new RegExp("^(?:" + row.artifactName + ")$").test(rootLocation)
            : row.artifactName === rootLocation
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    if (!allowed.length) return {read: false, unrestricted: false}
    const everyPlant = authzId => {
        const setIds = rows("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: authzId}).map(row => row.entityFilterSetId)
        return (
            setIds.includes("MANTLE_ACTIVE_ORG") &&
            find("moqui.security.EntityFilter")
                .condition("entityFilterSetId", "in", setIds)
                .condition("entityName", "mantle.facility.Facility")
                .count() === 0
        )
    }
    return {read: true, unrestricted: allowed.some(row => everyPlant(row.artifactAuthzId))}
}

// The scope of the current user: their organizations (the owners of the runs, methods, routings and facilities they may work
// with; null for every owner) and their capabilities. The owners are filterOrgIds kept to the organizations the user belongs
// to, so an active organization the user does not belong to is set aside for their own (as Warehouse, impl-warehouse §4).
function scope() {
    const grants = rootGrants()
    const organization = ec.user.userId ? call("mantle.party.PartyServices.get#PartyOrganizationInfo") : {}
    const memberIds = Array.from(organization.userOrgIds || [])
    const filterIds = Array.from(organization.filterOrgIds || []).filter(partyId => memberIds.includes(partyId))
    const ownerIds = filterIds.length ? filterIds : memberIds
    const capabilities = {read: grants.read}
    for (const [name, permission] of Object.entries(capabilityPermissions))
        capabilities[name] = grants.read && access.has(permission)
    return {
        read: grants.read,
        unrestricted: grants.unrestricted,
        organizationPartyIds: memberIds,
        activeOrganizationPartyId: memberIds.includes(organization.activeOrgId) ? organization.activeOrgId : null,
        ownerIds: grants.unrestricted ? null : ownerIds,
        capabilities
    }
}
function required(userScope = scope()) {
    if (!userScope.read) denied("MANUFACTURING_UNAVAILABLE", "Manufacturing is not available")
    return userScope
}
const owns = (userScope, partyId) => !userScope.ownerIds || (!!partyId && userScope.ownerIds.includes(partyId))
const inScope = (userScope, facility) => !!facility && owns(userScope, facility.ownerPartyId)
const facilityName = facility => (facility ? facility.facilityName || facility.facilityId : "")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const facilityById = facilityId => (facilityId ? one("mantle.facility.Facility", {facilityId}) : null)
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"

// A Facility find limited to the user's organizations.
function facilityFind(userScope) {
    const query = find("mantle.facility.Facility")
    return userScope.ownerIds ? query.condition("ownerPartyId", "in", userScope.ownerIds) : query
}
// The ids of the work centers (WorkCenter rows), and of the facilities above them.
const workCenterIds = () =>
    Array.from(find("mantle.work.production.WorkCenter").selectField("facilityId").list()).map(row => row.facilityId)
function plantIdsAbove(centerIds) {
    if (!centerIds.length) return []
    return Array.from(
        find("mantle.facility.Facility")
            .condition("facilityId", "in", centerIds)
            .condition("parentFacilityId", "is-not-null", null)
            .selectField("parentFacilityId")
            .distinct(true)
            .list()
    ).map(row => row.parentFacilityId)
}
// The user's plants: their facilities that are plants or hold a work center.
function plantFind(userScope) {
    const factory = ec.entity.conditionFactory
    const parentIds = plantIdsAbove(workCenterIds())
    const kinds = [factory.makeCondition("facilityTypeEnumId", "in", plantTypes)]
    if (parentIds.length) kinds.push(factory.makeCondition("facilityId", "in", parentIds))
    return facilityFind(userScope).condition(kinds.length === 1 ? kinds[0] : factory.makeCondition(kinds, "or"))
}
function isPlant(userScope, facility) {
    if (!inScope(userScope, facility)) return false
    if (plantTypes.includes(facility.facilityTypeEnumId)) return true
    return plantIdsAbove(workCenterIds()).includes(facility.facilityId)
}
// The selected plant: the user's preference when it is one of their plants, else their only plant, else none.
function selectedPlant(userScope) {
    const preferred = ec.user.getPreference(plantPreference)
    if (preferred) {
        const facility = facilityById(preferred)
        if (isPlant(userScope, facility)) return facility
    }
    const firstTwo = Array.from(plantFind(userScope).orderBy("facilityName").limit(2).list())
    return firstTwo.length === 1 ? firstTwo[0] : null
}

// ===== shared context =====
// The Manufacturing routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: the areas of the menu (design §1.2)
    "Home",
    "WorkOrders",
    "ShopFloor",
    "BillsOfMaterials",
    "Routings",
    "WorkCenters",
    "Quality",
    "Planning",
    "Subcontracting",
    "Settings",
    "Approvals",
    "Reports"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Manufacturing") denied("MANUFACTURING_CONTEXT", "Manufacturing context is not available")
    const userScope = required()
    let plant = selectedPlant(userScope)
    if (p.plantId) {
        plant = facilityById(p.plantId)
        if (!isPlant(userScope, plant)) denied("PLANT_UNAVAILABLE", "Plant " + p.plantId + " is not available")
    }
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: userScope.organizationPartyIds,
        activeOrganizationPartyId: userScope.activeOrganizationPartyId,
        allPlants: !userScope.ownerIds,
        plantCount: plantFind(userScope).count(),
        plantId: plant?.facilityId || null,
        plantName: facilityName(plant),
        appRoot: "Manufacturing",
        linkBase: "//Manufacturing",
        webBase: "/qapps/Manufacturing",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Manufacturing/" + path]))
    }
}

function selectPlant(p) {
    const userScope = required()
    const plantId = p.plantId || null
    if (plantId && !isPlant(userScope, facilityById(plantId)))
        denied("PLANT_UNAVAILABLE", "Plant " + plantId + " is not available")
    ec.user.setPreference(plantPreference, plantId)
    return {plantId}
}

// ===== record kinds =====
// A run of the user's organizations: its owner and its facility's owner (as Mantle's Production.js runOf).
function readRun(workEffortId) {
    const run = one("mantle.work.effort.WorkEffort", {workEffortId})
    if (!run || run.purposeEnumId !== runPurpose) return null
    const facility = facilityById(run.facilityId)
    return {
        owners: [run.ownerPartyId],
        facilities: facility ? [facility] : [],
        label: run.workEffortName || workEffortId,
        detail: [statusText(run.statusId), facilityName(facility)].filter(Boolean).join(" · "),
        facility
    }
}
// An operation is a run's child (release makes them, with the run as root): checked by its run.
function readOperation(workEffortId) {
    const operation = one("mantle.work.effort.WorkEffort", {workEffortId})
    const runId = operation?.rootWorkEffortId || operation?.parentWorkEffortId
    const run = runId && runId !== workEffortId ? readRun(runId) : null
    if (!run) return null
    return {
        owners: run.owners,
        facilities: run.facilities,
        label: operation.workEffortName || workEffortId,
        detail: ["Work order " + runId, statusText(operation.statusId)].filter(Boolean).join(" · "),
        facility: run.facility
    }
}
// A method (ProductBom) by its organization.
function readMethod(productBomId) {
    const bom = one("mantle.product.bom.ProductBom", {productBomId})
    if (!bom) return null
    const product = bom.productId ? one("mantle.product.Product", {productId: bom.productId}) : null
    return {
        owners: [bom.organizationPartyId],
        facilities: [],
        label: bom.bomName || product?.productName || productBomId,
        detail: [product?.pseudoId || bom.productId, bom.methodCode].filter(Boolean).join(" · ")
    }
}
// A routing (WepRouting, or one of its operations) by its owner.
function readRouting(workEffortId) {
    const row = one("mantle.work.effort.WorkEffort", {workEffortId})
    if (!row || !routingPurposes.includes(row.purposeEnumId)) return null
    const routing =
        row.purposeEnumId === "WepRoutingTask"
            ? one("mantle.work.effort.WorkEffort", {workEffortId: row.parentWorkEffortId})
            : row
    return {
        owners: [routing?.ownerPartyId],
        facilities: [],
        label: row.workEffortName || workEffortId,
        detail: row.purposeEnumId === "WepRoutingTask" ? "Routing " + (routing?.workEffortId || "") : statusText(row.statusId)
    }
}
// A work center: a facility with a WorkCenter row, by the facility's owner.
function readWorkCenter(facilityId) {
    const center = one("mantle.work.production.WorkCenter", {facilityId})
    const facility = center ? facilityById(facilityId) : null
    if (!facility) return null
    const parent = facilityById(facility.parentFacilityId)
    return {
        owners: [],
        facilities: [facility],
        label: facilityName(facility),
        detail: [enumText(facility.facilityTypeEnumId), parent ? "in " + facilityName(parent) : ""].filter(Boolean).join(" · "),
        facility
    }
}
// An asset (equipment, or stock at a plant) by its facility.
function readAsset(assetId) {
    const asset = one("mantle.product.asset.Asset", {assetId})
    const facility = facilityById(asset?.facilityId)
    if (!asset || !facility) return null
    const product = asset.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
    return {
        owners: [],
        facilities: [facility],
        label: asset.assetName || product?.productName || assetId,
        detail: [asset.serialNumber ? "Serial " + asset.serialNumber : "", statusText(asset.statusId)]
            .filter(Boolean)
            .join(" · "),
        facility
    }
}
// A facility (a plant, a line or a warehouse) by its owner.
function readFacility(facilityId) {
    const facility = facilityById(facilityId)
    if (!facility) return null
    return {
        owners: [],
        facilities: [facility],
        label: facilityName(facility),
        detail: enumText(facility.facilityTypeEnumId),
        facility
    }
}

// Each kind a Manufacturing screen, mount, palette or record link may be given: its name, icon, the Manufacturing screen that
// opens it (destination, the path and id parameter under the root; null until its phase builds it, and then the record
// opens Home's lookup) and its read (a record answers its owners and facilities, a label and a detail, or null when there is
// no such record). Later phases add a kind or set its destination.
const recordKinds = {
    run: {name: "Work order", icon: "sym_o_precision_manufacturing", destination: null, read: readRun},
    operation: {name: "Operation", icon: "sym_o_task_alt", destination: null, read: readOperation},
    method: {name: "BOM", icon: "sym_o_account_tree", destination: null, read: readMethod},
    routing: {name: "Routing", icon: "sym_o_route", destination: null, read: readRouting},
    workCenter: {name: "Work center", icon: "sym_o_factory", destination: null, read: readWorkCenter},
    asset: {name: "Asset", icon: "sym_o_precision_manufacturing", destination: null, read: readAsset},
    facility: {name: "Facility", icon: "sym_o_warehouse", destination: null, read: readFacility}
}

// A record the user may work with: every owner it names and every facility it is at are their organizations'. A record with
// neither is refused unless the user works in every plant. A missing record and one outside the scope are refused alike
// (RECORD_UNAVAILABLE), so a forged id learns nothing.
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    const found = definition.read(recordId)
    if (!found) unavailable()
    const owners = found.owners.filter(owner => owner !== undefined)
    const named = owners.length + found.facilities.length
    const allowed =
        (named > 0 || !userScope.ownerIds) &&
        owners.every(owner => owns(userScope, owner)) &&
        found.facilities.every(facility => inScope(userScope, facility))
    if (!allowed) unavailable()
    return {
        recordType: kind,
        recordId,
        kindName: definition.name,
        facilityId: found.facility?.facilityId || null,
        facilityName: facilityName(found.facility),
        label: found.label,
        detail: found.detail
    }
}

// check#Record: a record a Manufacturing screen or mount was given, refused unless the user may work with it and, when a
// capability is named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(capabilityPermissions, p.capability))
            throw new Error("Unknown Manufacturing capability " + p.capability)
        if (!userScope.capabilities[p.capability])
            denied("PERMISSION_DENIED", capabilityPermissions[p.capability] + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// The Manufacturing screen of a record: its kind's destination, else Home's lookup of it.
function recordUrl(kind, recordId) {
    const destination = recordKinds[kind]?.destination
    if (destination) return "/qapps/Manufacturing/" + destination + encodeURIComponent(recordId)
    return "/qapps/Manufacturing/Home?lookupType=" + kind + "&lookupId=" + encodeURIComponent(recordId)
}
// The Manufacturing link of a record the user may work with, else null (get#RecordLink).
function recordLink(kind, recordId) {
    try {
        const userScope = scope()
        if (!userScope.read) return null
        recordOf(userScope, kind, recordId)
        return recordUrl(kind, recordId)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
            ec.logger.warn("Manufacturing link of " + kind + " " + recordId + ": " + error.message)
        return null
    }
}

// ===== palette =====
// The finds of the palette (design §1.2: runs, product and method ids, scoped equipment): each kind by its id and names,
// ignoring case, limited in the query to the user's organizations, and each row checked again by recordOf. Each entry: its
// kind, entity, id field, fixed conditions, text fields, and the field the scope applies to (an owner, or a facility for
// "facility:<field>"); entries for the same kind (a method by its product) share it.
const searchFinds = [
    {
        kind: "run",
        entity: "mantle.work.effort.WorkEffort",
        idField: "workEffortId",
        conditions: {purposeEnumId: runPurpose},
        textFields: ["workEffortId", "workEffortName"],
        scopeField: "ownerPartyId"
    },
    {
        kind: "method",
        entity: "mantle.product.bom.ProductBom",
        idField: "productBomId",
        conditions: {},
        textFields: ["productBomId", "bomName", "methodCode", "productId"],
        scopeField: "organizationPartyId"
    },
    {
        kind: "routing",
        entity: "mantle.work.effort.WorkEffort",
        idField: "workEffortId",
        conditions: {purposeEnumId: "WepRouting"},
        textFields: ["workEffortId", "workEffortName"],
        scopeField: "ownerPartyId"
    },
    {
        kind: "workCenter",
        entity: "mantle.facility.Facility",
        idField: "facilityId",
        conditions: {},
        workCenters: true,
        textFields: ["facilityId", "facilityName"],
        scopeField: "ownerPartyId"
    },
    {
        kind: "asset",
        entity: "mantle.product.asset.Asset",
        idField: "assetId",
        conditions: {assetTypeEnumId: "AstTpEquipment"},
        textFields: ["assetId", "assetName", "serialNumber"],
        scopeField: "facility:facilityId"
    }
]
function searchFind(definition, userScope, text) {
    const factory = ec.entity.conditionFactory
    const anyOf = conditions => (conditions.length === 1 ? conditions[0] : factory.makeCondition(conditions, "or"))
    const pattern = likeText(text)
    let query = find(definition.entity, definition.conditions)
        .condition(anyOf(definition.textFields.map(field => factory.makeCondition(field, "like", pattern).ignoreCase())))
        .selectField(definition.idField)
        .distinct(true)
        .orderBy(definition.idField)
    if (definition.workCenters) query = query.condition("facilityId", "in", workCenterIds())
    if (userScope.ownerIds) {
        const [field, scopeField] = definition.scopeField.startsWith("facility:")
            ? [definition.scopeField.substring("facility:".length), "facility"]
            : [definition.scopeField, "owner"]
        const ids =
            scopeField === "facility"
                ? Array.from(facilityFind(userScope).selectField("facilityId").list()).map(row => row.facilityId)
                : userScope.ownerIds
        query = query.condition(field, "in", ids)
    }
    return query
}
function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const found = new Map()
    for (const definition of searchFinds) {
        if (definition.workCenters && !workCenterIds().length) continue
        let rowsFound = []
        try {
            rowsFound = Array.from(searchFind(definition, userScope, text).limit(limit).list())
        } catch (error) {
            ec.logger.error("Manufacturing palette " + definition.kind + " search failed: " + error.message)
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
                    ec.logger.error("Manufacturing palette " + definition.kind + " " + recordId + ": " + error.message)
            }
        }
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== choices =====
// The options of a facility drop-down: the query's rows searched by term in their id and name, with the selected value's
// label when it is in scope but not on the page.
function facilityOptions(query, term, selected, keep) {
    const factory = ec.entity.conditionFactory
    let found = query.orderBy("facilityName").limit(choiceLimit)
    if (term)
        found = found.condition(
            factory.makeCondition(
                [
                    factory.makeCondition("facilityId", "like", likeText(term)).ignoreCase(),
                    factory.makeCondition("facilityName", "like", likeText(term)).ignoreCase()
                ],
                "or"
            )
        )
    const options = Array.from(found.list()).map(row => ({value: row.facilityId, label: facilityName(row)}))
    if (selected && !options.some(option => option.value === selected)) {
        const facility = facilityById(selected)
        if (facility && keep(facility)) options.push({value: facility.facilityId, label: facilityName(facility)})
    }
    return options
}
// Each Manufacturing drop-down: its options for the user, the term and the selected value. Later phases add sources.
const choiceSources = {
    plants: (userScope, term, selected) =>
        facilityOptions(plantFind(userScope), term, selected, facility => isPlant(userScope, facility)),
    // the work centers of the user's organizations, under the given plant when there is one
    workCenters: (userScope, term, selected, p) => {
        const centerIds = workCenterIds()
        if (!centerIds.length) return []
        let query = facilityFind(userScope).condition("facilityId", "in", centerIds)
        if (p.plantId) query = query.condition("parentFacilityId", p.plantId)
        return facilityOptions(
            query,
            term,
            selected,
            facility => centerIds.includes(facility.facilityId) && inScope(userScope, facility)
        )
    }
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Manufacturing choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

const operations = {sharedContext, selectPlant, checkRecord, search, choices}
;({
    recordLink,
    // the scope for a phase's own module and the shared mounts' Manufacturing branch: the user's scope, the same refusing a
    // user without Manufacturing, the owner and facility checks, the plants, a record's check and its Manufacturing link
    scope,
    required,
    owns,
    inScope,
    plantFind,
    isPlant,
    selectedPlant,
    recordOf,
    recordUrl,
    // whether a kind has its Manufacturing screen yet (get#RecordLink sends a method or routing to Products until it has)
    hasScreen: kind => !!recordKinds[kind]?.destination,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Manufacturing operation " + op)
        return operations[op](parameters)
    }
})
