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
    "Reports",
    // P2: the method records
    "BillsOfMaterials/BillOfMaterialsDetail",
    "BillsOfMaterials/WhereUsed",
    "BillsOfMaterials/Product360",
    "Routings/RoutingDetail",
    "Routings/OperationTemplates"
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
        // a new record's organization: the active, the only, or the user's own (impl-sales F111)
        defaultOrganizationPartyId: ec.resource
            .script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
            .defaultOrganization(userScope),
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
    // an operation template is a routing task with no routing (P2), checked by its own owner
    const template = row.purposeEnumId === "WepRoutingTask" && !row.parentWorkEffortId
    const routing =
        row.purposeEnumId === "WepRoutingTask" && !template
            ? one("mantle.work.effort.WorkEffort", {workEffortId: row.parentWorkEffortId})
            : row
    return {
        owners: [routing?.ownerPartyId],
        facilities: [],
        label: row.workEffortName || workEffortId,
        detail: template
            ? "Operation template"
            : row.purposeEnumId === "WepRoutingTask"
              ? "Routing " + (routing?.workEffortId || "")
              : statusText(row.statusId)
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

// The Manufacturing screen of a routing, an operation (its routing's, with the operation selected) or a template (P2).
function routingDestination(workEffortId) {
    const row = one("mantle.work.effort.WorkEffort", {workEffortId})
    if (row?.purposeEnumId === "WepRoutingTask" && !row.parentWorkEffortId)
        return "Routings/OperationTemplates?workEffortId=" + encodeURIComponent(workEffortId)
    if (row?.purposeEnumId === "WepRoutingTask")
        return (
            "Routings/RoutingDetail?workEffortId=" +
            encodeURIComponent(row.parentWorkEffortId) +
            "&selectedOperationId=" +
            encodeURIComponent(workEffortId)
        )
    return "Routings/RoutingDetail?workEffortId=" + encodeURIComponent(workEffortId)
}

// Each kind a Manufacturing screen, mount, palette or record link may be given: its name, icon, the Manufacturing screen that
// opens it (destination, the path and id parameter under the root; null until its phase builds it, and then the record
// opens Home's lookup) and its read (a record answers its owners and facilities, a label and a detail, or null when there is
// no such record). Later phases add a kind or set its destination.
const recordKinds = {
    run: {name: "Work order", icon: "sym_o_precision_manufacturing", destination: null, read: readRun},
    operation: {name: "Operation", icon: "sym_o_task_alt", destination: null, read: readOperation},
    method: {
        name: "BOM",
        icon: "sym_o_account_tree",
        destination: "BillsOfMaterials/BillOfMaterialsDetail?productBomId=",
        read: readMethod
    },
    routing: {name: "Routing", icon: "sym_o_route", destination: routingDestination, read: readRouting},
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
    // a destination is a path the id is added to, or a function of the id (a routing's operation opens its routing)
    if (typeof destination === "function") return "/qapps/Manufacturing/" + destination(recordId)
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
    // P2: the products of the user's organizations a method may be made for (not pick kits, D15), by id, pseudo id and name
    products: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product").condition("productTypeEnumId", "not-equals", "PtPickAssembly")
        if (userScope.ownerIds) query = query.condition("ownerPartyId", "in", userScope.ownerIds)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["productId", "pseudoId", "productName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const label = row => [row.pseudoId || row.productId, row.productName].filter(Boolean).join(" · ")
        const options = Array.from(query.orderBy("productName").limit(choiceLimit).list()).map(row => ({
            value: row.productId,
            label: label(row)
        }))
        if (selected && !options.some(option => option.value === selected)) {
            const row = one("mantle.product.Product", {productId: selected})
            if (row && owns(userScope, row.ownerPartyId) && row.productTypeEnumId !== "PtPickAssembly")
                options.push({value: row.productId, label: label(row)})
        }
        return options
    },
    // P2: the operation templates and the other routings' operations a routing may copy (not archived templates)
    operationSources: (userScope, term, selected, p) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.work.effort.WorkEffort", {purposeEnumId: "WepRoutingTask"}).condition(
            factory.makeCondition(
                [
                    factory.makeCondition("methodArchived", "is-null", null),
                    factory.makeCondition("methodArchived", "equals", "N")
                ],
                "or"
            )
        )
        if (userScope.ownerIds) query = query.condition("ownerPartyId", "in", userScope.ownerIds)
        // not this routing's own operations; a template has no parent, which a plain not-equals would leave out
        if (p.workEffortId)
            query = query.condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("parentWorkEffortId", "is-null", null),
                        factory.makeCondition("parentWorkEffortId", "not-equals", p.workEffortId)
                    ],
                    "or"
                )
            )
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["workEffortId", "workEffortName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const label = row =>
            (row.workEffortName || row.workEffortId) + (row.parentWorkEffortId ? " · " + row.parentWorkEffortId : " · template")
        const options = Array.from(query.orderBy("workEffortName").limit(choiceLimit).list())
            .filter(row => row.methodRemoved !== "Y")
            .map(row => ({value: row.workEffortId, label: label(row)}))
        if (selected && !options.some(option => option.value === selected)) {
            const row = one("mantle.work.effort.WorkEffort", {workEffortId: selected})
            if (row?.purposeEnumId === "WepRoutingTask" && owns(userScope, row.ownerPartyId))
                options.push({value: row.workEffortId, label: label(row)})
        }
        return options
    },
    // P2: the production inspection templates of the user's organizations (Warehouse P8's InspectionTemplate)
    inspectionTemplates: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.quality.InspectionTemplate", {inspectionContextEnumId: "QicProduction"}).condition(
            "statusId",
            "not-equals",
            "QtRetired"
        )
        if (userScope.ownerIds) query = query.condition("organizationPartyId", "in", userScope.ownerIds)
        if (term) query = query.condition(factory.makeCondition("templateName", "like", likeText(term)).ignoreCase())
        const options = Array.from(query.orderBy("templateName").limit(choiceLimit).list()).map(row => ({
            value: row.inspectionTemplateId,
            label: row.templateName || row.inspectionTemplateId
        }))
        if (selected && !options.some(option => option.value === selected)) {
            const row = one("mantle.product.quality.InspectionTemplate", {inspectionTemplateId: selected})
            if (row && owns(userScope, row.organizationPartyId))
                options.push({value: row.inspectionTemplateId, label: row.templateName || row.inspectionTemplateId})
        }
        return options
    },
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
    },
    // P4: the organizations whose production policy and reasons the user works with (their own, or every internal
    // organization for a user in every plant)
    organizations: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.PartyDetailAndRole", {roleTypeId: "OrgInternal"})
            .selectField("partyId,organizationName")
            .orderBy("organizationName")
            .limit(choiceLimit)
        if (userScope.ownerIds) query = query.condition("partyId", "in", userScope.ownerIds)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("partyId", "like", likeText(term)).ignoreCase(),
                        factory.makeCondition("organizationName", "like", likeText(term)).ignoreCase()
                    ],
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
        if (selected && !options.some(option => option.value === selected) && owns(userScope, selected)) {
            const organization = one("mantle.party.Organization", {partyId: selected})
            if (organization && one("mantle.party.PartyRole", {partyId: selected, roleTypeId: "OrgInternal"}))
                options.push({value: selected, label: organization.organizationName || selected})
        }
        return options
    }
}
// the method form choices (P2) name a method organization's products, operations and inspection templates: method readers only
const methodChoices = ["products", "operationSources", "inspectionTemplates"]
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Manufacturing choice " + p.choice)
    if (methodChoices.includes(p.choice) && !userScope.capabilities.methodRead) return {options: []}
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== P3: work centers and equipment =====
// The Work centers area's screens (impl-manufacturing P3): a work center and a facility open FacilityDetail, an asset
// EquipmentDetail, under WorkCenters; their routes are in sharedLinks; and the drop-downs of its forms.
recordKinds.workCenter.destination = "WorkCenters/FacilityDetail?facilityId="
recordKinds.facility.destination = "WorkCenters/FacilityDetail?facilityId="
recordKinds.asset.destination = "WorkCenters/EquipmentDetail?assetId="
linkPaths.push(
    "WorkCenters/Centers",
    "WorkCenters/FacilityDetail",
    "WorkCenters/Equipment",
    "WorkCenters/EquipmentDetail",
    "WorkCenters/ResourceCalendar"
)
// options of an entity searched by term in its id and name fields, ignoring case, with the selected value's label when
// keep allows it
function rowOptions(query, idField, label, textFields, term, selected, keep) {
    const factory = ec.entity.conditionFactory
    let found = query.limit(choiceLimit)
    if (term)
        found = found.condition(
            factory.makeCondition(
                textFields.map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const options = Array.from(found.list()).map(row => ({value: row[idField], label: label(row)}))
    if (selected && !options.some(option => option.value === selected)) {
        const row = keep(selected)
        if (row) options.push({value: row[idField], label: label(row)})
    }
    return options
}
Object.assign(choiceSources, {
    // the user's facilities that are not work centers yet, for New work center (a warehouse, a room, a line)
    centerFacilities: (userScope, term, selected) => {
        const centerIds = workCenterIds()
        let query = facilityFind(userScope)
        if (centerIds.length) query = query.condition("facilityId", "not-in", centerIds)
        return facilityOptions(
            query,
            term,
            selected,
            facility => inScope(userScope, facility) && !centerIds.includes(facility.facilityId)
        )
    },
    // the resource calendars of the user's organizations, for a work center's work hours and holidays
    calendars: (userScope, term, selected) => {
        let query = find("mantle.work.calendar.Calendar")
            .condition("calendarKindEnumId", "in", ["CalkResource", "CalkShared"])
            .orderBy("calendarName")
        if (userScope.ownerIds) query = query.condition("ownerPartyId", "in", userScope.ownerIds)
        return rowOptions(
            query,
            "calendarId",
            row => row.calendarName || row.calendarId,
            ["calendarId", "calendarName"],
            term,
            selected,
            calendarId => {
                const row = one("mantle.work.calendar.Calendar", {calendarId})
                return row && owns(userScope, row.ownerPartyId) ? row : null
            }
        )
    },
    // the products of the user's organizations and the shared ones (owner _NA_ or none), for a capacity or an alternate
    products: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product").orderBy("pseudoId").orderBy("productId")
        if (userScope.ownerIds)
            query = query.condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("ownerPartyId", "in", userScope.ownerIds.concat(["_NA_"])),
                        factory.makeCondition("ownerPartyId", "is-null", null)
                    ],
                    "or"
                )
            )
        const label = row => [row.pseudoId || row.productId, row.productName].filter(Boolean).join(" ")
        return rowOptions(query, "productId", label, ["productId", "pseudoId", "productName"], term, selected, productId => {
            const row = one("mantle.product.Product", {productId})
            return row && (!row.ownerPartyId || row.ownerPartyId === "_NA_" || owns(userScope, row.ownerPartyId)) ? row : null
        })
    },
    // the units of a capacity's quantity (not currencies or time) and of its time
    quantityUnits: (userScope, term, selected) =>
        rowOptions(
            find("moqui.basic.Uom")
                .condition("uomTypeEnumId", "in", [
                    "UT_OTHER_MEASURE",
                    "UT_WEIGHT_MEASURE",
                    "UT_VOLUME_LIQ_MEAS",
                    "UT_LENGTH_MEASURE"
                ])
                .orderBy("description"),
            "uomId",
            row => row.description || row.uomId,
            ["uomId", "description", "abbreviation"],
            term,
            selected,
            uomId => one("moqui.basic.Uom", {uomId})
        ),
    timeUnits: (userScope, term, selected) =>
        rowOptions(
            find("moqui.basic.Uom").condition("uomId", "in", ["TF_min", "TF_hr", "TF_day"]).orderBy("description"),
            "uomId",
            row => row.description || row.uomId,
            ["uomId", "description"],
            term,
            selected,
            uomId => one("moqui.basic.Uom", {uomId})
        ),
    // the scheduling policies, the capacity bases and the equipment asset types (closed lists)
    schedulingPolicies: (userScope, term, selected) => enumOptions("WorkCenterSchedulingPolicy", term, selected),
    capacityBases: (userScope, term, selected) => enumOptions("WorkCenterCapacityBasis", term, selected),
    equipmentTypes: (userScope, term, selected) =>
        enumOptions("AssetType", term, selected).filter(option => !["AstTpInventory", "AstTpSupplies"].includes(option.value)),
    // the hourly cost components of a rate
    rateComponents: (userScope, term, selected) =>
        enumOptions("ProductCostComponentType", term, selected).filter(option =>
            ["PccLabor", "PccMachine", "PccOverhead"].includes(option.value)
        ),
    currencies: (userScope, term, selected) =>
        rowOptions(
            find("moqui.basic.Uom").condition("uomTypeEnumId", "UT_CURRENCY_MEASURE").orderBy("uomId"),
            "uomId",
            row => row.uomId + (row.description ? " " + row.description : ""),
            ["uomId", "description"],
            term,
            selected,
            uomId => one("moqui.basic.Uom", {uomId})
        )
})
function enumOptions(enumTypeId, term, selected) {
    return rowOptions(
        find("moqui.basic.Enumeration", {enumTypeId}).orderBy("sequenceNum").orderBy("description"),
        "enumId",
        row => row.description || row.enumId,
        ["enumId", "description"],
        term,
        selected,
        enumId => {
            const row = one("moqui.basic.Enumeration", {enumId})
            return row && row.enumTypeId === enumTypeId ? row : null
        }
    )
}

// ===== P5a: work orders =====
// The Work orders area's screens (impl-manufacturing P5a): a run opens WorkOrderDetail, an operation its run's Operations;
// their routes are in sharedLinks; and the drop-downs of New work order, Overview and the Lifecycle dialog.
recordKinds.run.destination = "WorkOrders/WorkOrderDetail?workEffortId="
recordKinds.operation.destination = workEffortId => {
    const operation = one("mantle.work.effort.WorkEffort", {workEffortId})
    const runId = operation?.rootWorkEffortId || operation?.parentWorkEffortId || workEffortId
    return (
        "WorkOrders/WorkOrderDetail/Operations?workEffortId=" +
        encodeURIComponent(runId) +
        "&selectedOperationId=" +
        encodeURIComponent(workEffortId)
    )
}
linkPaths.push(
    "WorkOrders/Find",
    "WorkOrders/NewWorkOrder",
    "WorkOrders/WorkOrderDetail",
    "WorkOrders/WorkOrderDetail/Overview",
    "WorkOrders/WorkOrderDetail/Operations",
    "WorkOrders/WorkOrderDetail/Notes"
)
// the products of the user's organizations with a released BOM of theirs (a run is made only from one, METHOD_REQUIRED)
function madeProductIds(userScope) {
    let boms = find("mantle.product.bom.ProductBom").selectField("productBomId,productId,organizationPartyId")
    if (userScope.ownerIds) boms = boms.condition("organizationPartyId", "in", userScope.ownerIds)
    const rowsFound = Array.from(boms.limit(2000).list())
    if (!rowsFound.length) return []
    const released = new Set(
        Array.from(
            find("mantle.work.method.MethodReleaseDecision", {methodEntityName: "mantle.product.bom.ProductBom"})
                .condition(
                    "methodId",
                    "in",
                    rowsFound.map(row => row.productBomId)
                )
                .selectField("methodId")
                .distinct(true)
                .list()
        ).map(row => row.methodId)
    )
    return Array.from(new Set(rowsFound.filter(row => released.has(row.productBomId)).map(row => row.productId)))
}
const personName = person => [person.firstName, person.lastName].filter(Boolean).join(" ") || person.partyId
Object.assign(choiceSources, {
    // the products a work order may make: the user's organizations' products with a released BOM
    madeProducts: (userScope, term, selected) => {
        const productIds = madeProductIds(userScope)
        if (!productIds.length) return []
        const label = row => [row.pseudoId || row.productId, row.productName].filter(Boolean).join(" · ")
        return rowOptions(
            find("mantle.product.Product").condition("productId", "in", productIds).orderBy("productName"),
            "productId",
            label,
            ["productId", "pseudoId", "productName"],
            term,
            selected,
            productId => (productIds.includes(productId) ? one("mantle.product.Product", {productId}) : null)
        )
    },
    // the released BOMs of the chosen product (productId), by method code
    releasedBoms: (userScope, term, selected, p) => {
        if (!p.productId) return []
        let query = find("mantle.product.bom.ProductBom", {productId: p.productId}).orderBy("methodCode")
        if (userScope.ownerIds) query = query.condition("organizationPartyId", "in", userScope.ownerIds)
        const released = row =>
            find("mantle.work.method.MethodReleaseDecision", {
                methodEntityName: "mantle.product.bom.ProductBom",
                methodId: row.productBomId
            }).count() > 0
        const label = row => [row.methodCode, row.bomName].filter(Boolean).join(" · ") || row.productBomId
        return rowOptions(
            query,
            "productBomId",
            label,
            ["productBomId", "methodCode", "bomName"],
            term,
            selected,
            productBomId => {
                const row = one("mantle.product.bom.ProductBom", {productBomId})
                return row && owns(userScope, row.organizationPartyId) && row.productId === p.productId ? row : null
            }
        ).filter(option => released(one("mantle.product.bom.ProductBom", {productBomId: option.value})))
    },
    // where a run is made: the user's work centers (lines) and plants
    runFacilities: (userScope, term, selected) => {
        const centerIds = workCenterIds()
        const factory = ec.entity.conditionFactory
        const kinds = [factory.makeCondition("facilityTypeEnumId", "in", plantTypes.concat(["FcTpLine"]))]
        if (centerIds.length) kinds.push(factory.makeCondition("facilityId", "in", centerIds))
        const parentIds = plantIdsAbove(centerIds)
        if (parentIds.length) kinds.push(factory.makeCondition("facilityId", "in", parentIds))
        return facilityOptions(facilityFind(userScope).condition(factory.makeCondition(kinds, "or")), term, selected, facility =>
            inScope(userScope, facility)
        )
    },
    // equipment at the user's facilities (not stock)
    runEquipment: (userScope, term, selected) => {
        const facilityIds = Array.from(facilityFind(userScope).selectField("facilityId").list()).map(row => row.facilityId)
        if (!facilityIds.length) return []
        const label = row => [row.assetName || row.assetId, row.serialNumber].filter(Boolean).join(" · ")
        return rowOptions(
            find("mantle.product.asset.Asset")
                .condition("facilityId", "in", facilityIds)
                .condition("assetTypeEnumId", "not-in", ["AstTpInventory", "AstTpSupplies"])
                .orderBy("assetName"),
            "assetId",
            label,
            ["assetId", "assetName", "serialNumber"],
            term,
            selected,
            assetId => {
                const row = one("mantle.product.asset.Asset", {assetId})
                return row && inScope(userScope, facilityById(row.facilityId)) ? row : null
            }
        )
    },
    // the people of the user's organizations (employees and agents), for a run's supervisor or operator
    runPeople: (userScope, term, selected) => {
        let relations = find("mantle.party.PartyRelationship")
            .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent"])
            .condition("thruDate", "is-null", null)
            .selectField("fromPartyId")
            .distinct(true)
        if (userScope.ownerIds) relations = relations.condition("toPartyId", "in", userScope.ownerIds)
        const partyIds = Array.from(relations.limit(2000).list()).map(row => row.fromPartyId)
        if (!partyIds.length) return []
        return rowOptions(
            find("mantle.party.Person").condition("partyId", "in", partyIds).orderBy("firstName"),
            "partyId",
            personName,
            ["partyId", "firstName", "lastName"],
            term,
            selected,
            partyId => (partyIds.includes(partyId) ? one("mantle.party.Person", {partyId}) : null)
        )
    },
    // the active production reasons of the user's organizations for a hold or a cancellation
    holdReasons: (userScope, term, selected) => {
        const now = ec.user.nowTimestamp
        const factory = ec.entity.conditionFactory
        let query = find("mantle.work.production.ProductionReason")
            .condition("reasonCategoryEnumId", "in", ["PrcHold", "PrcDowntime"])
            .condition("fromDate", "less-equals", now)
            .condition(
                factory.makeCondition(
                    [factory.makeCondition("thruDate", "is-null", null), factory.makeCondition("thruDate", "greater-than", now)],
                    "or"
                )
            )
            .orderBy("sequenceNum")
        if (userScope.ownerIds) query = query.condition("organizationPartyId", "in", userScope.ownerIds)
        return rowOptions(
            query,
            "reasonCode",
            row => row.reasonName || row.reasonCode,
            ["reasonCode", "reasonName"],
            term,
            selected,
            () => null
        )
    }
})

// ===== P13: supply planning =====
// The Planning area's shared SupplyPlanning (impl-manufacturing P13), whose route is in sharedLinks, and the closed lists of
// its forms: the suggestion methods.
linkPaths.push("Planning/SupplyPlanning")
Object.assign(choiceSources, {
    planningMethods: (userScope, term, selected) => enumOptions("PlanningSuggestionMethod", term, selected)
})

// ===== P11: downtime and maintenance =====
// Downtime (WorkCenters/Downtime): a stop opens there, by its work center and organization; the shared RequestDetail and
// WorkItemDetail are mounted under WorkCenters with the Manufacturing context, and quick create's report form at the root
// (ReportDowntime, for the operators and supervisors); the drop-downs of a stop's reason and equipment.
function readDowntime(productionDowntimeId) {
    const row = one("mantle.work.production.ProductionDowntime", {productionDowntimeId})
    const facility = facilityById(row?.facilityId)
    if (!row || !facility) return null
    return {
        owners: [row.organizationPartyId],
        facilities: [facility],
        label: "Downtime " + productionDowntimeId,
        detail: [facilityName(facility), row.reasonCode, statusText(row.statusId)].filter(Boolean).join(" · "),
        facility
    }
}
recordKinds.downtime = {
    name: "Downtime",
    icon: "sym_o_running_with_errors",
    destination: "WorkCenters/Downtime?productionDowntimeId=",
    read: readDowntime
}
linkPaths.push("WorkCenters/Downtime", "WorkCenters/RequestDetail", "WorkCenters/WorkItemDetail", "ReportDowntime")
// the reasons a stop may name (downtime and hold), active now, of the center's organization or the user's
const stopCategories = ["PrcDowntime", "PrcHold"]
const stockTypes = ["AstTpInventory", "AstTpSupplies"]
function reasonOrganizations(userScope, facilityId) {
    const center = facilityById(facilityId)
    if (center) return inScope(userScope, center) ? [center.ownerPartyId] : []
    return userScope.ownerIds
}
// the facilities whose equipment serves a work center: the center, the plant above it and the facilities under it
function equipmentFacilityIds(userScope, facilityId) {
    const center = facilityById(facilityId)
    if (!inScope(userScope, center)) return []
    const ids = [center.facilityId]
    const parent = facilityById(center.parentFacilityId)
    if (inScope(userScope, parent)) ids.push(parent.facilityId)
    for (const row of facilityFind(userScope).condition("parentFacilityId", center.facilityId).selectField("facilityId").list())
        ids.push(row.facilityId)
    return ids
}
Object.assign(choiceSources, {
    downtimeReasons: (userScope, term, selected, p) => {
        const factory = ec.entity.conditionFactory
        const organizationIds = reasonOrganizations(userScope, p.facilityId)
        if (organizationIds && !organizationIds.length) return []
        let query = find("mantle.work.production.ProductionReason")
            .condition("reasonCategoryEnumId", "in", stopCategories)
            .condition("fromDate", "less-equals", ec.user.nowTimestamp)
            .condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("thruDate", "is-null", null),
                        factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                    ],
                    "or"
                )
            )
            .orderBy("sequenceNum")
            .orderBy("reasonName")
            .limit(choiceLimit)
        if (organizationIds) query = query.condition("organizationPartyId", "in", organizationIds)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("reasonCode", "like", likeText(term)).ignoreCase(),
                        factory.makeCondition("reasonName", "like", likeText(term)).ignoreCase()
                    ],
                    "or"
                )
            )
        const label = row => (row.reasonName || row.reasonCode) + (row.equipmentFault === "Y" ? " (equipment fault)" : "")
        const options = []
        for (const row of query.list())
            if (!options.some(option => option.value === row.reasonCode)) options.push({value: row.reasonCode, label: label(row)})
        if (selected && !options.some(option => option.value === selected)) {
            let kept = find("mantle.work.production.ProductionReason", {reasonCode: selected}).orderBy("-fromDate")
            if (organizationIds) kept = kept.condition("organizationPartyId", "in", organizationIds)
            const row = Array.from(kept.limit(1).list())[0]
            if (row) options.push({value: row.reasonCode, label: label(row)})
        }
        return options
    },
    // equipment (not stock, not gone) that serves the given work center, else at the user's facilities
    equipment: (userScope, term, selected, p) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.asset.Asset")
            .condition("assetTypeEnumId", "not-in", stockTypes)
            .condition(factory.makeCondition("assetTypeEnumId", "is-not-null", null))
            .condition("statusId", "not-in", ["AstDelivered", "AstDeactivated"])
            .orderBy("assetName")
            .orderBy("assetId")
        if (p.facilityId)
            query = query.condition("facilityId", "in", equipmentFacilityIds(userScope, p.facilityId).concat(["_NA_"]))
        else if (userScope.ownerIds) {
            const facilityIds = Array.from(facilityFind(userScope).selectField("facilityId").list()).map(row => row.facilityId)
            query = query.condition("facilityId", "in", facilityIds.concat(["_NA_"]))
        }
        const label = row => (row.assetName || row.assetId) + (row.serialNumber ? " · " + row.serialNumber : "")
        let found = query.limit(choiceLimit)
        if (term)
            found = found.condition(
                factory.makeCondition(
                    ["assetId", "assetName", "serialNumber"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(found.list()).map(row => ({value: row.assetId, label: label(row)}))
        if (selected && !options.some(option => option.value === selected)) {
            const row = one("mantle.product.asset.Asset", {assetId: selected})
            if (row && !stockTypes.includes(row.assetTypeEnumId) && inScope(userScope, facilityById(row.facilityId)))
                options.push({value: row.assetId, label: label(row)})
        }
        return options
    }
})

// ===== P7: quantities, by-products and loss =====
// WorkOrderDetail's Quantities and By-products tabs, its output labels and Quality's ScrapLoss (impl-manufacturing P7), whose
// routes are in sharedLinks; and the drop-downs of their loss forms: the loss types and the active loss reasons (scrap,
// process loss and rework) of the user's organizations, by category.
linkPaths.push(
    "WorkOrders/WorkOrderDetail/Quantities",
    "WorkOrders/WorkOrderDetail/ByProducts",
    "WorkOrders/WorkOrderDetail/OutputLabels",
    "Quality/ScrapLoss"
)
Object.assign(choiceSources, {
    lossTypes: (userScope, term, selected) => enumOptions("ProductionLossType", term, selected),
    lossReasons: (userScope, term, selected) => {
        const now = ec.user.nowTimestamp
        const factory = ec.entity.conditionFactory
        let query = find("mantle.work.production.ProductionReason")
            .condition("reasonCategoryEnumId", "in", ["PrcScrap", "PrcProcessLoss", "PrcRework"])
            .condition("fromDate", "less-equals", now)
            .condition(
                factory.makeCondition(
                    [factory.makeCondition("thruDate", "is-null", null), factory.makeCondition("thruDate", "greater-than", now)],
                    "or"
                )
            )
            .orderBy("reasonCategoryEnumId")
            .orderBy("sequenceNum")
        if (userScope.ownerIds) query = query.condition("organizationPartyId", "in", userScope.ownerIds)
        const category = {PrcScrap: "Scrap", PrcProcessLoss: "Process loss", PrcRework: "Rework"}
        return rowOptions(
            query,
            "reasonCode",
            row => (row.reasonName || row.reasonCode) + " · " + (category[row.reasonCategoryEnumId] || ""),
            ["reasonCode", "reasonName"],
            term,
            selected,
            () => null
        )
    }
})

// ===== P5b: materials and stock =====
// WorkOrderDetail's Components and Materials (Shared/MaterialIssueReceipt) tabs and the Planning area's shared
// InventoryAvailability (impl-manufacturing P5b), whose routes are in sharedLinks; Stage opens Warehouse's Move for those
// who move stock (STOCK_MOVE, Warehouse's grant); and the drop-downs of Add material.
capabilityPermissions.move = "STOCK_MOVE"
linkPaths.push(
    "WorkOrders/WorkOrderDetail/Components",
    "WorkOrders/WorkOrderDetail/MaterialIssueReceipt",
    "Planning/InventoryAvailability"
)
Object.assign(choiceSources, {
    // the stocked products of the user's organizations and the shared ones (owner _NA_ or none) a manual material line may
    // take (not kits), as store#ProductionMaterial allows
    materialProducts: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product", {productTypeEnumId: "PtAsset"}).orderBy("productName")
        if (userScope.ownerIds)
            query = query.condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("ownerPartyId", "in", userScope.ownerIds.concat(["_NA_"])),
                        factory.makeCondition("ownerPartyId", "is-null", null)
                    ],
                    "or"
                )
            )
        const label = row => [row.pseudoId || row.productId, row.productName].filter(Boolean).join(" · ")
        return rowOptions(query, "productId", label, ["productId", "pseudoId", "productName"], term, selected, productId => {
            const row = one("mantle.product.Product", {productId})
            const shared = !row?.ownerPartyId || row.ownerPartyId === "_NA_"
            return row && row.productTypeEnumId === "PtAsset" && (shared || owns(userScope, row.ownerPartyId)) ? row : null
        })
    },
    // the facilities of the user's organizations a material line's stock is staged from
    stockFacilities: (userScope, term, selected) =>
        facilityOptions(facilityFind(userScope), term, selected, facility => inScope(userScope, facility))
})

// ===== P8: quality =====
// The Quality area's Inspections, InspectionStation (the operator mode) and the shared QualityInspection and
// InspectionTemplates with the Manufacturing context, WorkOrderDetail's Quality tab and the quality prints
// (impl-manufacturing P8), whose routes are in sharedLinks; a production inspection and template are records of their own:
// an inspection of the production context or of a run, by its organization and facility; a template of the production
// context (or a new one's), by its organization.
function readInspection(qualityInspectionId) {
    const inspection = one("mantle.product.quality.QualityInspection", {qualityInspectionId})
    if (!inspection) return null
    const run = inspection.workEffortId ? one("mantle.work.effort.WorkEffort", {workEffortId: inspection.workEffortId}) : null
    if (inspection.inspectionContextEnumId !== "QicProduction" && run?.purposeEnumId !== runPurpose) return null
    const facility = facilityById(inspection.facilityId)
    const product = inspection.productId ? one("mantle.product.Product", {productId: inspection.productId}) : null
    return {
        owners: [inspection.organizationPartyId],
        facilities: facility ? [facility] : [],
        label: "Inspection " + qualityInspectionId,
        detail: [product?.productName || inspection.productId, statusText(inspection.statusId), facilityName(facility)]
            .filter(Boolean)
            .join(" · "),
        facility
    }
}
function readInspectionTemplate(inspectionTemplateId) {
    const template = one("mantle.product.quality.InspectionTemplate", {inspectionTemplateId})
    if (!template || (template.inspectionContextEnumId && template.inspectionContextEnumId !== "QicProduction")) return null
    return {
        owners: [template.organizationPartyId],
        facilities: [],
        label: template.templateName || inspectionTemplateId,
        detail: statusText(template.statusId)
    }
}
recordKinds.inspection = {
    name: "Inspection",
    icon: "sym_o_fact_check",
    destination: "Quality/QualityInspection?qualityInspectionId=",
    read: readInspection
}
recordKinds.inspectionTemplate = {
    name: "Inspection template",
    icon: "sym_o_checklist",
    destination: "Quality/InspectionTemplates?inspectionTemplateId=",
    read: readInspectionTemplate
}
linkPaths.push(
    "WorkOrders/WorkOrderDetail/Quality",
    "Quality/Inspections",
    "Quality/QualityInspection",
    "Quality/InspectionTemplates",
    "Quality/InspectionStation",
    "WorkOrders/WorkOrderDetail/QualityChecklist",
    "Quality/QualityCertificate"
)

// ===== P14: subcontracting =====
// The Subcontracting area (impl-manufacturing P14): SubcontractOperations, SubcontractDetail (by its operation) and its
// instructions, and the shared Supplier360, OrderDetail and ShipmentDetail with the Manufacturing context, whose routes are in
// sharedLinks; the buyer's capability (PURCHASE_ORDER_EDIT, BOSS_PURCHASING_BUYER), which converts outside processing on
// the Planning mount; and the drop-downs of New outside processing.
capabilityPermissions.buy = "PURCHASE_ORDER_EDIT"
linkPaths.push(
    "Subcontracting/SubcontractOperations",
    "Subcontracting/SubcontractDetail",
    "Subcontracting/SubcontractInstructions",
    "Subcontracting/Supplier360",
    "Subcontracting/OrderDetail",
    "Subcontracting/ShipmentDetail"
)
const subcontractRunStatuses = ["WeApproved", "WeInProgress", "WeOnHold"]
Object.assign(choiceSources, {
    // the operations of the user's organizations' released runs, newest run first
    subcontractOperations: (userScope, term, selected) => {
        let runs = find("mantle.work.effort.WorkEffort", {purposeEnumId: runPurpose}).condition(
            "statusId",
            "in",
            subcontractRunStatuses
        )
        if (userScope.ownerIds) runs = runs.condition("ownerPartyId", "in", userScope.ownerIds)
        const runRows = Array.from(runs.orderBy("-workEffortId").limit(200).list())
        if (!runRows.length) return []
        const runNames = new Map(runRows.map(row => [row.workEffortId, row.workEffortName || row.workEffortId]))
        const label = row =>
            (row.workEffortName || row.workEffortId) +
            " · work order " +
            row.parentWorkEffortId +
            " " +
            (runNames.get(row.parentWorkEffortId) || "")
        return rowOptions(
            find("mantle.work.effort.WorkEffort")
                .condition("parentWorkEffortId", "in", Array.from(runNames.keys()))
                .orderBy("-parentWorkEffortId")
                .orderBy("sequenceNum"),
            "workEffortId",
            label,
            ["workEffortId", "workEffortName", "parentWorkEffortId"],
            term,
            selected,
            workEffortId => {
                const row = one("mantle.work.effort.WorkEffort", {workEffortId})
                return row && runNames.has(row.parentWorkEffortId) ? row : null
            }
        )
    },
    // the service products (of the user's organizations, or of no owner)
    serviceProducts: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product", {productTypeEnumId: "PtService"}).orderBy("productName")
        if (userScope.ownerIds)
            query = query.condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("ownerPartyId", "in", userScope.ownerIds),
                        factory.makeCondition("ownerPartyId", "is-null", null)
                    ],
                    "or"
                )
            )
        const label = row => [row.pseudoId || row.productId, row.productName].filter(Boolean).join(" · ")
        return rowOptions(query, "productId", label, ["productId", "pseudoId", "productName"], term, selected, productId => {
            const row = one("mantle.product.Product", {productId})
            return row?.productTypeEnumId === "PtService" && (!row.ownerPartyId || owns(userScope, row.ownerPartyId)) ? row : null
        })
    },
    // the suppliers (the Supplier role, not an organization of the user's), by name
    suppliers: (userScope, term, selected) => {
        const partyIds = Array.from(
            find("mantle.party.PartyRole", {roleTypeId: "Supplier"}).selectField("partyId").limit(2000).list()
        ).map(row => row.partyId)
        if (!partyIds.length) return []
        const label = row => row.organizationName || row.partyId
        return rowOptions(
            find("mantle.party.Organization").condition("partyId", "in", partyIds).orderBy("organizationName"),
            "partyId",
            label,
            ["partyId", "organizationName"],
            term,
            selected,
            partyId => (partyIds.includes(partyId) ? one("mantle.party.Organization", {partyId}) : null)
        )
    },
    // the vendor-custody facilities of the user's organizations (a Custodian facility party), of the supplier when given
    vendorFacilities: (userScope, term, selected, p) => {
        let custodians = find("mantle.facility.FacilityParty", {roleTypeId: "Custodian"}).condition("thruDate", "is-null", null)
        if (p.supplierPartyId) custodians = custodians.condition("partyId", p.supplierPartyId)
        const facilityIds = Array.from(custodians.selectField("facilityId").limit(500).list()).map(row => row.facilityId)
        if (!facilityIds.length) return []
        return facilityOptions(
            facilityFind(userScope).condition("facilityId", "in", facilityIds),
            term,
            selected,
            facility => inScope(userScope, facility) && facilityIds.includes(facility.facilityId)
        )
    }
})

// ===== P12: scheduling and capacity =====
// The Planning area's ProductionSchedule (with its terminal twin and plan snapshot) and Capacity, whose routes are in
// sharedLinks; a schedule change (an override request) is checked by its organization and target work center and opens the
// schedule on it.
function readScheduleChange(scheduleChangeId) {
    const row = one("mantle.work.production.ProductionScheduleChange", {scheduleChangeId})
    if (!row) return null
    const facility = facilityById(row.toFacilityId || row.fromFacilityId)
    return {
        owners: [row.organizationPartyId],
        facilities: facility ? [facility] : [],
        label: "Schedule change " + scheduleChangeId,
        detail: [facilityName(facility), statusText(row.statusId)].filter(Boolean).join(" · "),
        facility
    }
}
recordKinds.scheduleChange = {
    name: "Schedule change",
    icon: "sym_o_view_timeline",
    destination: "Planning/ProductionSchedule?scheduleChangeId=",
    read: readScheduleChange
}
linkPaths.push("Planning/ProductionSchedule", "Planning/ProductionScheduleTui", "Planning/ScheduleSnapshot", "Planning/Capacity")
// P17: the supply plan's snapshot print (design-manufacturing §11), linked from Shared/SupplyPlanning's header
linkPaths.push("Planning/PlanSnapshot")

// ===== P9: controlled changes =====
// WorkOrderDetail's Changes tab (amendments and the cancellation of a run with postings) and SplitWorkOrder, and the
// Work orders area's Disassembly (impl-manufacturing P9), whose routes are in sharedLinks; and Disassembly's drop-down: the
// pick assembly kits on hand in the user's facilities.
linkPaths.push("WorkOrders/WorkOrderDetail/Changes", "WorkOrders/WorkOrderDetail/SplitWorkOrder", "WorkOrders/Disassembly")
Object.assign(choiceSources, {
    kitAssets: (userScope, term, selected) => {
        const kitIds = Array.from(
            find("mantle.product.Product", {productTypeEnumId: "PtPickAssembly"}).selectField("productId").limit(500).list()
        ).map(row => row.productId)
        let query = find("mantle.product.asset.Asset")
            .condition("productId", "in", kitIds.length ? kitIds : ["_NONE_"])
            .condition("quantityOnHandTotal", "greater-than", 0)
            .orderBy("-receivedDate")
        if (userScope.ownerIds) {
            const facilityIds = Array.from(facilityFind(userScope).selectField("facilityId").list()).map(row => row.facilityId)
            query = query.condition("facilityId", "in", facilityIds.length ? facilityIds : ["_NONE_"])
        }
        const label = row =>
            [row.assetId, productNameOf(row.productId), "on hand " + String(row.quantityOnHandTotal)].filter(Boolean).join(" · ")
        return rowOptions(query, "assetId", label, ["assetId", "productId"], term, selected, assetId => {
            const row = one("mantle.product.asset.Asset", {assetId})
            return row && kitIds.includes(row.productId) && inScope(userScope, facilityById(row.facilityId)) ? row : null
        })
    }
})
const productNameOf = productId => (productId ? one("mantle.product.Product", {productId})?.productName || productId : "")

// ===== P10: the shop floor and production time =====
// The Shop floor area's screens (impl-manufacturing P10): the station's board, an operation's execution and instructions and a
// work order's time, whose routes are in sharedLinks; and the production work types a person's timer takes.
linkPaths.push("ShopFloor/Station", "ShopFloor/OperationExecution", "ShopFloor/Instructions", "ShopFloor/ProductionTime")
const productionWorkTypes = ["WktpProductionSetup", "WktpProductionRun", "WktpProductionRework"]
Object.assign(choiceSources, {
    productionWorkTypes: (userScope, term, selected) =>
        rowOptions(
            find("moqui.basic.Enumeration").condition("enumId", "in", productionWorkTypes).orderBy("enumId"),
            "enumId",
            row => row.description || row.enumId,
            ["enumId", "description"],
            term,
            selected,
            enumId => (productionWorkTypes.includes(enumId) ? one("moqui.basic.Enumeration", {enumId}) : null)
        )
})

// ===== P16: reports =====
// The Reports area's index and eight reports (impl-manufacturing P16), whose routes are in sharedLinks for Home's Kpis; and
// the reports' work order drop-down: the production runs of the user's organizations, newest first, by id or name.
const reportNames = [
    "WorkOrderStatusReport",
    "MaterialReport",
    "OperationPerformanceReport",
    "LossReport",
    "QualityReport",
    "ProductionCostReport",
    "BillOfMaterialsVarianceReport",
    "PlanningReport"
]
linkPaths.push("Reports/ReportIndex", ...reportNames.map(name => "Reports/" + name))
Object.assign(choiceSources, {
    workOrders: (userScope, term, selected) => {
        let query = find("mantle.work.effort.WorkEffort", {purposeEnumId: runPurpose}).orderBy("-workEffortId")
        if (userScope.ownerIds) query = query.condition("ownerPartyId", "in", userScope.ownerIds)
        const label = row => [row.workEffortId, row.workEffortName].filter(Boolean).join(" · ")
        return rowOptions(query, "workEffortId", label, ["workEffortId", "workEffortName"], term, selected, workEffortId => {
            const row = one("mantle.work.effort.WorkEffort", {workEffortId})
            return row && row.purposeEnumId === runPurpose && owns(userScope, row.ownerPartyId) ? row : null
        })
    }
})

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
    facilityFind,
    workCenterIds,
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
