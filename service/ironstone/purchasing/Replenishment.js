// Purchasing's Replenishment (impl-purchasing P14a; design-purchasing §8): the reads of its screens and mounts, after
// Purchasing.js's scope. The Mantle services keep the rules and check their own permissions and organization again:
// SupplyPlanningServices (run, read, schedule and convert the shared plan), FacilityServices.store#ProductFacilityPolicy
// (Warehouse's reorder rule, with Purchasing's snooze) and ReorderRuleServices (suggested levels). Here: the planning
// facilities, products and methods of the drop-downs; the reorder rules ReorderRules lists; Home's shortfall count with the
// plan's date; and the Purchasing context of Products' shared InventoryAvailability.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const purchasing = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")

const planningTypes = ["FcTpWarehouse", "FcTpPlant"]
const openStates = ["PssProposed", "PssPartial"]
const choiceLimit = 30
const ruleLimit = 500
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const blank = value => value == null || String(value).trim() === ""
const yes = value => value === true || value === "true" || value === "Y"
const dec = value => toDecimal(value == null || value === "" ? 0 : value)
const text = value => (value == null ? null : String(dec(value).toNumber()))

// The internal organizations of the user's scope (every internal organization for the administrator with none active).
function organizationIds(userScope) {
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}
function replenishmentScope() {
    const userScope = purchasing().required()
    if (!userScope.capabilities.replenishment) denied("PERMISSION_DENIED", "Replenishment is not available")
    return userScope
}
// The facilities a plan may be for: the warehouses and plants of the user's organizations that are not under another of the
// same organization (the planning nodes; the lines under them are netted with them).
function planningFacilityFind(userScope) {
    return find("mantle.facility.Facility")
        .condition("ownerPartyId", "in", organizationIds(userScope))
        .condition("facilityTypeEnumId", "in", planningTypes)
}
const facilityLabel = facility => (facility.facilityName || facility.facilityId) + " · " + facility.ownerPartyId

// ===== choices (Purchasing.js choiceSources) =====
function facilityChoices(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    let query = planningFacilityFind(userScope).orderBy("facilityName").limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["facilityId", "facilityName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({value: row.facilityId, label: facilityLabel(row)}))
    if (selected && !options.some(option => option.value === selected)) {
        const facility = one("mantle.facility.Facility", {facilityId: selected})
        if (facility && organizationIds(userScope).includes(facility.ownerPartyId))
            options.push({value: selected, label: facilityLabel(facility)})
    }
    return options
}
// The products of the user's organizations and the shared ones, by id, pseudo id and name.
function productChoices(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.product.Product")
        .condition("ownerPartyId", "in", ["_NA_"].concat(organizationIds(userScope)))
        .condition("productTypeEnumId", "in", ["PtAsset", "PtDigitalAsset", "PtAssetUse", "PtPickAssembly"])
        .orderBy("pseudoId")
        .limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["productId", "pseudoId", "productName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const label = row => (row.pseudoId || row.productId) + " · " + (row.productName || "")
    const options = Array.from(query.list()).map(row => ({value: row.productId, label: label(row)}))
    if (selected && !options.some(option => option.value === selected)) {
        const product = one("mantle.product.Product", {productId: selected})
        if (product && ["_NA_"].concat(organizationIds(userScope)).includes(product.ownerPartyId))
            options.push({value: selected, label: label(product)})
    }
    return options
}
// The plan's methods, with All (Purchasing's list shows buy suggestions unless another method or all is chosen).
function methodChoices(term) {
    const options = [{value: "_ALL_", label: "All methods"}].concat(
        rows("moqui.basic.Enumeration", {enumTypeId: "PlanningSuggestionMethod"})
            .sort((a, b) => Number(a.sequenceNum || 0) - Number(b.sequenceNum || 0))
            .map(row => ({value: row.enumId, label: row.description || row.enumId}))
    )
    return term ? options.filter(option => option.label.toLowerCase().includes(term.toLowerCase())) : options
}

// ===== the plan's context =====
// get#PlanContext: the planning facility of a Purchasing SupplyPlanning or ReorderRules screen: the one given, checked in
// the user's organizations, else the facility of the latest current plan of their organizations (the active one first),
// else the first planning facility of the active organization (or of their first).
function planContext(p) {
    const userScope = replenishmentScope()
    let facilityId = blank(p.facilityId) ? null : String(p.facilityId)
    if (facilityId) purchasing().recordOf(userScope, "facility", facilityId)
    else {
        const preferred = userScope.activeOrganizationPartyId
        const facilities = Array.from(planningFacilityFind(userScope).orderBy("facilityId").limit(choiceLimit).list())
        const planned = Array.from(
            find("mantle.request.requirement.PlanningRun")
                .condition("organizationPartyId", "in", organizationIds(userScope))
                .condition("isCurrent", "Y")
                .orderBy("-startedDate")
                .limit(20)
                .list()
        )
        const run = planned.find(row => row.organizationPartyId === preferred) || planned[0]
        const plannedId = run
            ? rows("mantle.request.requirement.PlanningRunFacility", {planningRunId: run.planningRunId})[0]?.facilityId
            : null
        facilityId = plannedId || (facilities.find(row => row.ownerPartyId === preferred) || facilities[0])?.facilityId || null
    }
    const facility = facilityId ? one("mantle.facility.Facility", {facilityId}) : null
    return {
        facilityId,
        facilityName: facility ? facility.facilityName || facilityId : null,
        organizationPartyId: facility?.ownerPartyId || null,
        capabilities: userScope.capabilities
    }
}

// ===== reorder rules =====
// find#ReorderRules: the reorder rules (ProductFacility rows) at the facilities of the user's organizations, filtered by
// product, facility, a supplier with a purchase price of the product, below minimum (available stock under the minimum)
// and snoozed, with their product and facility names, stock, method, snooze and supplier; at most 500, paged.
function findRules(p) {
    const userScope = replenishmentScope()
    const factory = ec.entity.conditionFactory
    const facilities = Array.from(
        find("mantle.facility.Facility").condition("ownerPartyId", "in", organizationIds(userScope)).list()
    )
    const facilityIds = facilities.map(row => row.facilityId)
    let query = find("mantle.facility.ProductFacility").condition("facilityId", "in", facilityIds.length ? facilityIds : ["_NA_"])
    if (!blank(p.facilityId)) query = query.condition("facilityId", p.facilityId)
    if (!blank(p.productId)) query = query.condition("productId", p.productId)
    if (!blank(p.supplierPartyId)) {
        if (!purchasing().supplierOf(userScope, p.supplierPartyId)) denied("RECORD_UNAVAILABLE", "Supplier is not available")
        const productIds = Array.from(
            find("mantle.product.ProductPrice", {vendorPartyId: p.supplierPartyId, pricePurposeEnumId: "PppPurchase"})
                .selectField("productId")
                .distinct(true)
                .limit(ruleLimit)
                .list()
        ).map(row => row.productId)
        query = query.condition("productId", "in", productIds.length ? productIds : ["_NA_"])
    }
    if (yes(p.snoozedOnly)) query = query.condition("snoozeThruDate", "greater-than", ec.user.nowTimestamp)
    const ruleRows = Array.from(query.orderBy("facilityId").orderBy("productId").limit(ruleLimit).list())
    const productIds = Array.from(new Set(ruleRows.map(row => row.productId)))
    const products = new Map(
        productIds.length
            ? Array.from(find("mantle.product.Product").condition("productId", "in", productIds).list()).map(row => [
                  row.productId,
                  row
              ])
            : []
    )
    // available stock by facility and product, in one query
    const available = new Map()
    if (productIds.length)
        for (const asset of Array.from(
            find("mantle.product.asset.Asset")
                .condition("productId", "in", productIds)
                .condition("facilityId", "in", Array.from(new Set(ruleRows.map(row => row.facilityId))))
                .condition("statusId", "AstAvailable")
                .selectField("productId,facilityId,availableToPromiseTotal")
                .list()
        )) {
            const key = asset.facilityId + "|" + asset.productId
            available.set(key, (available.get(key) || toDecimal(0)).add(dec(asset.availableToPromiseTotal)))
        }
    const facilityNames = new Map(facilities.map(row => [row.facilityId, row.facilityName || row.facilityId]))
    const methods = new Map(
        rows("moqui.basic.Enumeration", {enumTypeId: "ReorderMethod"}).map(row => [row.enumId, row.description || row.enumId])
    )
    const now = lib.ms(ec.user.nowTimestamp)
    let listed = ruleRows.map(row => {
        const product = products.get(row.productId)
        const stock = available.get(row.facilityId + "|" + row.productId) || toDecimal(0)
        const below = row.minimumStock != null && stock.compare(dec(row.minimumStock)) < 0
        const snoozed = row.snoozeThruDate != null && lib.ms(row.snoozeThruDate) > now
        return {
            productId: row.productId,
            pseudoId: product?.pseudoId || row.productId,
            productName: product?.productName || row.productId,
            facilityId: row.facilityId,
            facilityName: facilityNames.get(row.facilityId) || row.facilityId,
            minimumStock: text(row.minimumStock),
            maximumStock: text(row.maximumStock),
            reorderQuantity: text(row.reorderQuantity),
            daysToShip: row.daysToShip,
            reorderMethodEnumId: row.reorderMethodEnumId || null,
            reorderMethodText: row.reorderMethodEnumId ? methods.get(row.reorderMethodEnumId) || row.reorderMethodEnumId : "",
            availableQuantity: text(stock),
            below,
            snoozed,
            snoozeThruDate: snoozed ? row.snoozeThruDate : null,
            snoozeThruText: snoozed ? lib.dateText(row.snoozeThruDate) : "",
            snoozeReason: snoozed ? row.snoozeReason || "" : "",
            stateText: snoozed ? "Snoozed" : below ? "Below minimum" : "Covered",
            stateColor: snoozed ? "grey" : below ? "warning" : "positive",
            lastUpdatedStamp: row.lastUpdatedStamp
        }
    })
    if (yes(p.belowMinimum)) listed = listed.filter(row => row.below)
    const reorderOptions = rows("moqui.basic.Enumeration", {enumTypeId: "ReorderMethod"})
        .sort((a, b) => Number(a.sequenceNum || 0) - Number(b.sequenceNum || 0))
        .map(row => ({value: row.enumId, label: row.description || row.enumId}))
    return Object.assign({truncated: ruleRows.length >= ruleLimit, reorderOptions}, lib.pageList(listed, p, "ruleList"))
}

// ===== Home =====
// Home's shortfall count: the open buy suggestions with something left to cover in the current plans of the user's
// organizations, and the date of the latest of those plans; null without Replenishment.
function shortfalls(userScope) {
    if (!userScope.capabilities.replenishment) return {shortfallCount: null, planRunText: null}
    const runs = Array.from(
        find("mantle.request.requirement.PlanningRun")
            .condition("organizationPartyId", "in", organizationIds(userScope))
            .condition("isCurrent", "Y")
            .orderBy("-planDate")
            .limit(50)
            .list()
    )
    if (!runs.length) return {shortfallCount: 0, planRunText: null}
    const count = find("mantle.request.requirement.PlanningSuggestion")
        .condition(
            "planningRunId",
            "in",
            runs.map(row => row.planningRunId)
        )
        .condition("methodEnumId", "PsmBuy")
        .condition("stateEnumId", "in", openStates)
        .condition("exceptionCode", "is-null", null)
        .count()
    return {shortfallCount: Number(count), planRunText: lib.dateText(runs[0].planDate)}
}

// ===== Products' shared InventoryAvailability =====
// The Purchasing context of the shared catalog mounts (SharedContext.js; crosscut §3.7's Purchasing row: Summary,
// Projection and Policy over the buying organizations' facilities): the Replenishment users read the stock of their
// organizations' products, and a stock planner (STOCK_POLICY_PLAN) edits the facility policy through
// store#ProductFacilityPolicy; nothing of the catalog, prices or costs.
function catalogContext() {
    const userScope = purchasing().scope()
    if (!userScope.read) throw new Error("Shared catalog context is not available")
    const catalog = call("ironstone.products.CatalogServices.get#CatalogAccess")
    const read = !!userScope.capabilities.replenishment
    const capabilities = {systemAdmin: !!catalog.capabilities?.systemAdmin, read}
    for (const name of ["catalogEdit", "catalogAdmin", "priceRead", "priceEdit", "supplierPriceRead", "supplierPriceEdit"])
        capabilities[name] = false
    for (const name of ["costRead", "costEstimate", "costApprove", "methodRead", "methodEdit", "methodApprove", "methodAdmin"])
        capabilities[name] = false
    Object.assign(capabilities, {
        stockPlan: read && !!userScope.capabilities.stockPolicy,
        stockManage: false,
        glPost: false,
        marginRead: false
    })
    return {
        capabilities,
        appRoot: "Purchasing",
        linkBase: "//Purchasing",
        webBase: "/qapps/Purchasing",
        printBase: "/apps/Purchasing",
        sharedLinks: {"": "//Purchasing/Replenishment"},
        productTabs: read ? ["Stock"] : [],
        connectionTypes: [],
        ownerPartyIds: read ? catalog.ownerPartyIds : [],
        organizationPartyIds: read ? userScope.organizationPartyIds : [],
        activeOrganizationPartyId: read ? userScope.activeOrganizationPartyId : null
    }
}

const operations = {planContext, findRules}
;({
    facilityChoices,
    productChoices,
    methodChoices,
    shortfalls,
    catalogContext,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Replenishment operation " + op)
        return operations[op](parameters || {})
    }
})
