// The Warehouse settings screens' reads and shapes (impl-warehouse P3, design-warehouse §14): the effective policy with
// the source of each value, the forms' values, the product tracking exceptions, the reservation check preview, asset
// pools, the settings index and the choices. Every read checks Warehouse access first (the facility in the user's scope,
// the organization one of theirs); Mantle's WarehousePolicyServices and AssetPoolServices check the organization and
// the policy permissions again, and every change goes to them directly.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, map, ms, denied, dateText, partyNames} = lib
const W = "mantle.facility.WarehousePolicyServices.",
    AP = "mantle.product.AssetPoolServices."
const choiceLimit = 30
const call = (name, parameters = {}) => {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) denied("POLICY_UNAVAILABLE", ec.message.getErrorsString())
    return out
}

const familyNames = {tracking: "Tracking", operation: "Operations", reservation: "Reservation"}
const fieldLabels = {
    receiptSteps: "Receipt steps",
    deliverySteps: "Delivery steps",
    receivingLocationSeqId: "Receiving location",
    quarantineLocationSeqId: "Quarantine location",
    stagingLocationSeqId: "Staging location",
    overReceiptPercent: "Over-receipt tolerance",
    overShipmentPercent: "Over-shipment tolerance",
    backorderEnumId: "Short quantity",
    blindCount: "Blind counts",
    autoPrint: "Print documents automatically",
    reservationOrderEnumId: "Reservation order",
    reservationAutoEnumId: "Reserve automatically",
    lotRequired: "Lot required",
    serialRequired: "Serial required",
    expiryBlock: "Block expired stock",
    shelfLifeDays: "Shelf life days",
    nearExpiryDays: "Near-expiry warning days",
    minimumRemainingShelfLifeDays: "Minimum remaining shelf life days",
    serialPattern: "Serial pattern",
    lotPattern: "Lot pattern"
}
const receiptStepText = {
    1: "1 step: receive to the putaway location",
    2: "2 steps: receive to a receiving location, then put away",
    3: "3 steps: receive to quarantine, inspect, then put away"
}
const deliveryStepText = {
    1: "1 step: ship from stock",
    2: "2 steps: pick to a staging location, then ship",
    3: "3 steps: pick, pack, then ship"
}
const operationFields = [
    "receiptSteps",
    "deliverySteps",
    "receivingLocationSeqId",
    "quarantineLocationSeqId",
    "stagingLocationSeqId",
    "overReceiptPercent",
    "overShipmentPercent",
    "backorderEnumId",
    "blindCount",
    "autoPrint"
]
const reservationFields = ["reservationOrderEnumId", "reservationAutoEnumId"]
const trackingFields = [
    "lotRequired",
    "serialRequired",
    "expiryBlock",
    "shelfLifeDays",
    "nearExpiryDays",
    "minimumRemainingShelfLifeDays",
    "serialPattern",
    "lotPattern"
]
const familyFields = {operation: operationFields, reservation: reservationFields, tracking: trackingFields}
const warningTexts = {
    NO_RECEIVING_LOCATION: "Two-step receipt needs a receiving location at this facility.",
    NO_QUARANTINE_LOCATION: "Three-step receipt needs a quarantine location at this facility.",
    NO_STAGING_LOCATION: "Two-step delivery needs a staging location at this facility.",
    LOCATION_CLOSED: "A default location named here has been closed; choose an open one."
}
const reasonTexts = {
    ASSET_NOT_AVAILABLE: "The stock it is on is no longer available",
    OTHER_FACILITY: "The order ships from another facility",
    POOL_NOT_QUALIFIED: "The order does not qualify for the stock's pool",
    AVAILABLE_ELSEWHERE: "Not available, while other stock of the product is"
}

const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const enumOptions = enumTypeId =>
    Array.from(find("moqui.basic.Enumeration", {enumTypeId}).orderBy("sequenceNum,description").list()).map(row => ({
        value: row.enumId,
        label: row.description || row.enumId
    }))
const facilityText = facilityId =>
    facilityId && facilityId !== "_NA_" ? one("mantle.facility.Facility", {facilityId})?.facilityName || facilityId : ""
const productText = productId =>
    productId && productId !== "_NA_" ? one("mantle.product.Product", {productId})?.productName || productId : ""
const storeText = productStoreId =>
    productStoreId ? one("mantle.product.store.ProductStore", {productStoreId})?.storeName || productStoreId : ""
const organizationText = partyId => (partyId ? partyNames([partyId])[partyId] || partyId : "")
const blank = value => (value == null ? "" : String(value))

function valueText(field, value) {
    if (value == null || value === "") return "Not set"
    if (value === "Y") return "Yes"
    if (value === "N") return "No"
    if (field === "receiptSteps") return receiptStepText[Number(String(value))] || String(value)
    if (field === "deliverySteps") return deliveryStepText[Number(String(value))] || String(value)
    if (field.endsWith("Percent")) return String(Number(String(value))) + "%"
    if (field.endsWith("EnumId")) return enumText(value)
    return String(value)
}
function sourceText(row, names) {
    switch (row.level) {
        case "organization":
            return "Organization: " + names.organization
        case "facility":
            return "Facility: " + facilityText(row.facilityId)
        case "store":
            return "Store: " + storeText(row.productStoreId)
        case "product":
            return "Product exception: " + productText(row.productId)
        case "facility product":
            return "Product exception at " + facilityText(row.facilityId)
        case "location type":
            return "The facility's first location of that type"
        default:
            return row.source || "Built-in default"
    }
}

// The scope of a settings read: the facility (in the user's scope) or else an organization of theirs.
function scopeOf(p) {
    const shared = call("ironstone.warehouse.AccessServices.get#SharedContext", {appRoot: p.appRoot, facilityId: p.facilityId})
    const organizationIds = Array.from(shared.organizationPartyIds || [])
    let organizationPartyId = null
    if (p.facilityId) organizationPartyId = one("mantle.facility.Facility", {facilityId: p.facilityId}).ownerPartyId
    else if (p.productStoreId) {
        // a store's policy is its organization's, which must be one of the user's (not only the active one)
        const store = one("mantle.product.store.ProductStore", {productStoreId: p.productStoreId})
        if (!store || !(organizationIds.includes(store.organizationPartyId) || shared.allFacilities))
            denied("STORE_UNAVAILABLE", "Store " + p.productStoreId + " is not available")
        organizationPartyId = store.organizationPartyId
    } else if (p.organizationPartyId && (organizationIds.includes(p.organizationPartyId) || shared.allFacilities))
        organizationPartyId = p.organizationPartyId
    else if (p.organizationPartyId)
        denied("ORGANIZATION_UNAVAILABLE", "Organization " + p.organizationPartyId + " is not available")
    else organizationPartyId = shared.activeOrganizationPartyId || organizationIds[0] || null
    return {shared, organizationPartyId, facilityId: p.facilityId || null}
}

// get#PolicyContext: the effective policy at the scope with the source of each value, and for each family asked for
// the form values of the row in effect at that exact scope and its history.
function context(p) {
    const scope = scopeOf(p)
    if (!scope.organizationPartyId)
        return {available: false, message: "You belong to no organization with a warehouse policy.", traceRows: []}
    const names = {organization: organizationText(scope.organizationPartyId)}
    const base = {
        // with a facility, or a store and no facility (Mantle then takes the store's inventory facility), the
        // organization follows from it
        organizationPartyId: scope.facilityId || p.productStoreId ? null : scope.organizationPartyId,
        facilityId: scope.facilityId,
        productId: p.productId || null,
        productStoreId: p.productStoreId || null,
        asOfDate: p.asOfDate || null
    }
    const families = String(p.policyTypes || "operation,reservation,tracking")
        .split(",")
        .map(type => type.trim())
        .filter(type => familyFields[type])
    const resolved = call(W + "resolve#WarehousePolicy", Object.assign({}, base, {policyType: families[0] || "operation"}))
    // the facility the policy was resolved at: the given one, or a store's inventory facility
    const resolvedFacilityId = resolved.facilityId === "_NA_" ? null : resolved.facilityId
    const out = {
        available: true,
        organizationPartyId: scope.organizationPartyId,
        organizationName: names.organization,
        facilityId: resolvedFacilityId,
        facilityName: facilityText(resolvedFacilityId),
        productId: resolved.productId === "_NA_" ? null : resolved.productId,
        productName: productText(resolved.productId),
        productStoreId: resolved.productStoreId,
        storeName: storeText(resolved.productStoreId),
        scopeText: resolvedFacilityId ? facilityText(resolvedFacilityId) : names.organization + ", every facility",
        asOfText: dateText(resolved.asOfDate),
        canManage: !!resolved.canManage,
        canPlan: !!resolved.canPlan,
        traceRows: Array.from(resolved.trace).map(row => ({
            policyType: row.policyType,
            policyTypeText: familyNames[row.policyType],
            field: row.field,
            fieldLabel: fieldLabels[row.field] || row.field,
            valueText: valueText(row.field, row.value),
            sourceText: sourceText(row, names),
            fromDateText: dateText(row.fromDate),
            changeReason: row.changeReason || ""
        })),
        warningRows: Array.from(resolved.warnings || []).map(row => ({text: warningTexts[row.code] || row.code})),
        summary: {
            receiptSteps: valueText("receiptSteps", resolved.operationPolicy.receiptSteps),
            deliverySteps: valueText("deliverySteps", resolved.operationPolicy.deliverySteps),
            reservationOrder: valueText("reservationOrderEnumId", resolved.reservationPolicy.reservationOrderEnumId),
            lotRequired: valueText("lotRequired", resolved.trackingPolicy.lotRequired)
        }
    }
    // the form values and history of each family at the exact scope (tracking without a product: the defaults)
    for (const type of families) {
        const exact =
            type === families[0] && (type !== "tracking" || !p.productId)
                ? resolved
                : call(W + "resolve#WarehousePolicy", Object.assign({}, base, {policyType: type, productId: null}))
        const configured = map(exact.configuredPolicy)
        const settings = {
            organizationPartyId: scope.facilityId ? "" : scope.organizationPartyId,
            facilityId: scope.facilityId || "",
            expectedFromDate: configured.fromDate == null ? "" : String(ms(configured.fromDate)),
            effectiveFromDate: "",
            changeReason: ""
        }
        for (const field of familyFields[type]) settings[field] = blank(configured[field])
        out[type + "Settings"] = settings
        out[type + "History"] = Array.from(exact.history).map(row => ({
            fromDateText: dateText(row.fromDate),
            thruDateText: dateText(row.thruDate) || "Open",
            summary: familyFields[type]
                .filter(field => row[field] != null && row[field] !== "")
                .map(field => fieldLabels[field] + ": " + valueText(field, row[field]))
                .join("; "),
            changeReason: row.changeReason || ""
        }))
    }
    out.options = {
        backorder: enumOptions("WarehouseBackorder"),
        reservationOrder: enumOptions("AssetReservationOrder"),
        reservationAuto: enumOptions("AssetReservationAuto"),
        receiptSteps: Object.entries(receiptStepText).map(([value, label]) => ({value, label})),
        deliverySteps: Object.entries(deliveryStepText).map(([value, label]) => ({value, label})),
        receivingLocations: locationOptions(scope.facilityId, "FltReceiving"),
        quarantineLocations: locationOptions(scope.facilityId, "FltQuarantine"),
        stagingLocations: locationOptions(scope.facilityId, "FltStaging")
    }
    if (resolved.productStoreId) out.store = storeSettings(resolved.productStoreId)
    return out
}
function locationOptions(facilityId, locationTypeEnumId) {
    if (!facilityId) return []
    return Array.from(
        find("mantle.facility.FacilityLocation", {facilityId, locationTypeEnumId}).orderBy("locationSeqId").limit(100).list()
    ).map(row => ({value: row.locationSeqId, label: [row.locationSeqId, row.description].filter(Boolean).join(" · ")}))
}
function storeSettings(productStoreId) {
    const store = one("mantle.product.store.ProductStore", {productStoreId})
    return {
        productStoreId,
        storeName: store.storeName || productStoreId,
        inventoryFacilityId: blank(store.inventoryFacilityId),
        inventoryFacilityName: facilityText(store.inventoryFacilityId),
        reservationOrderEnumId: blank(store.reservationOrderEnumId),
        reservationAutoEnumId: blank(store.reservationAutoEnumId),
        requireInventory: blank(store.requireInventory),
        expectedLastUpdatedStamp: store.lastUpdatedStamp == null ? "" : String(ms(store.lastUpdatedStamp)),
        changeReason: ""
    }
}

// get#TrackingExceptions: the product tracking exceptions in effect for the organization (and facility), the records
// Products' Product360 Stock tab also shows, with their values for the edit form.
function exceptions(p) {
    const scope = scopeOf(p)
    if (!scope.organizationPartyId) return {exceptionRows: [], canPlan: false}
    const now = ms(ec.user.nowTimestamp)
    let query = find("mantle.facility.WarehousePolicy")
        .condition({organizationPartyId: scope.organizationPartyId, policyType: "tracking"})
        .condition("productId", "not-equals", "_NA_")
        .condition("fromDate", "less-equals", ec.user.nowTimestamp)
    if (scope.facilityId) query = query.condition("facilityId", "in", [scope.facilityId, "_NA_"])
    const found = Array.from(query.orderBy("productId,facilityId,-fromDate").limit(500).list())
        .map(map)
        .filter(row => row.thruDate == null || ms(row.thruDate) > now)
    const seen = new Set()
    const exceptionRows = []
    for (const row of found) {
        const key = row.productId + "|" + row.facilityId
        if (seen.has(key)) continue
        seen.add(key)
        const settings = {
            organizationPartyId: scope.organizationPartyId,
            productId: row.productId,
            facilityId: row.facilityId === "_NA_" ? "" : row.facilityId,
            expectedFromDate: String(ms(row.fromDate)),
            changeReason: ""
        }
        for (const field of trackingFields) settings[field] = blank(row[field])
        exceptionRows.push(
            Object.assign(settings, {
                rowKey: (row.productId + "_" + row.facilityId).replace(/[^A-Za-z0-9_]/g, "_"),
                productName: productText(row.productId),
                facilityText: row.facilityId === "_NA_" ? "Every facility" : facilityText(row.facilityId),
                lotText: valueText("lotRequired", row.lotRequired),
                serialText: valueText("serialRequired", row.serialRequired),
                shelfLifeText: row.shelfLifeDays == null ? "Not set" : String(row.shelfLifeDays) + " days",
                fromDateText: dateText(row.fromDate),
                reasonText: row.changeReason || ""
            })
        )
    }
    const resolved = call(W + "resolve#WarehousePolicy", {organizationPartyId: scope.organizationPartyId})
    return {
        organizationPartyId: scope.organizationPartyId,
        facilityId: scope.facilityId,
        exceptionRows,
        canPlan: !!resolved.canPlan
    }
}

// get#ReservationCheck: the reservations at the facility that a repair would change, named by reason. Reads only.
function reservationCheck(p) {
    if (!p.facilityId) return {findingRows: [], checkedCount: 0, truncated: false, needsFacility: true}
    scopeOf(p)
    const preview = call(W + "preview#FacilityReservations", {facilityId: p.facilityId, productId: p.productId || null})
    return {
        needsFacility: false,
        checkedCount: preview.checkedCount,
        truncated: !!preview.truncated,
        // what the repair confirms it repairs (WarehouseTaskServices.repair#FacilityReservations)
        previewFingerprint: preview.previewFingerprint,
        findingRows: Array.from(preview.findings).map(row => ({
            assetReservationId: row.assetReservationId,
            orderText: [row.orderId, row.orderItemSeqId].filter(Boolean).join(" · "),
            productName: productText(row.productId),
            assetId: row.assetId,
            quantityText: String(row.quantity ?? ""),
            reasonText: reasonTexts[row.reasonCode] || row.reasonCode,
            reasonCode: row.reasonCode
        }))
    }
}

// get#Pools and get#PoolDetail: the pools of the user's organizations and one pool with its members and the open
// reservations on its stock.
function pools(p) {
    scopeOf({appRoot: p.appRoot})
    const found = call(AP + "find#AssetPools", {term: p.term || null})
    const owners = partyNames(Array.from(found.poolList).map(row => row.ownerPartyId))
    return {
        poolRows: Array.from(found.poolList).map(row => ({
            assetPoolId: row.assetPoolId,
            pseudoId: row.pseudoId || row.assetPoolId,
            description: row.description || "",
            ownerName: owners[row.ownerPartyId] || row.ownerPartyId,
            memberText: row.partyCount + " parties · " + row.storeCount + " stores"
        })),
        truncated: !!found.truncated,
        canManage: !!found.canManage
    }
}
function poolDetail(p) {
    scopeOf({appRoot: p.appRoot})
    const found = call(AP + "get#AssetPool", {assetPoolId: p.assetPoolId})
    const pool = map(found.pool)
    const parties = Array.from(found.parties).map(map),
        stores = Array.from(found.stores).map(map)
    const names = partyNames([pool.ownerPartyId, ...parties.map(row => row.partyId)])
    const state = row => (row.current ? "In effect" : row.ended ? "Ended" : "Starts " + dateText(row.fromDate))
    const preview = call(AP + "preview#AssetPoolReservations", {assetPoolId: pool.assetPoolId})
    return {
        pool: Object.assign(pool, {
            pseudoId: pool.pseudoId || pool.assetPoolId,
            ownerName: names[pool.ownerPartyId] || pool.ownerPartyId,
            changeReason: ""
        }),
        partyRows: parties.map(row => ({
            assetPoolId: pool.assetPoolId,
            partyId: row.partyId,
            partyName: names[row.partyId] || row.partyId,
            roleTypeId: blank(row.roleTypeId),
            roleText: row.roleTypeId === "Vendor" ? "Vendor" : row.roleTypeId === "Customer" ? "Customer" : "Vendor or customer",
            fromDateText: dateText(row.fromDate) || "Always",
            thruDate: dateText(row.thruDate),
            thruDateText: dateText(row.thruDate) || "Open",
            stateText: state(row),
            rowKey: row.partyId.replace(/[^A-Za-z0-9_]/g, "_"),
            changeReason: ""
        })),
        storeRows: stores.map(row => ({
            assetPoolId: pool.assetPoolId,
            productStoreId: row.productStoreId,
            storeName: storeText(row.productStoreId),
            fromDateText: dateText(row.fromDate) || "Always",
            thruDate: dateText(row.thruDate),
            thruDateText: dateText(row.thruDate) || "Open",
            stateText: state(row),
            rowKey: row.productStoreId.replace(/[^A-Za-z0-9_]/g, "_"),
            changeReason: ""
        })),
        reservationRows: Array.from(preview.reservations).map(row => ({
            assetReservationId: row.assetReservationId,
            orderText: [row.orderId, row.orderItemSeqId].filter(Boolean).join(" · "),
            productName: productText(row.productId),
            facilityName: facilityText(row.facilityId),
            quantityText: String(row.quantity ?? ""),
            qualifiesText: row.qualifies ? "Qualifies" : "No longer qualifies"
        })),
        unqualifiedCount: preview.unqualifiedCount,
        truncated: !!preview.truncated,
        canManage: !!found.canManage
    }
}

// get#SettingsIndex: each settings section with the effective value at the selected facility (or the organization).
function settingsIndex(p) {
    const policy = context(Object.assign({}, p, {policyTypes: "operation"}))
    if (!policy.available) return {indexRows: [], scopeText: "", message: policy.message}
    const editText = policy.canManage ? "You can change it" : "Warehouse managers change it"
    return {
        scopeText: policy.scopeText,
        indexRows: [
            {
                section: "Stock policies",
                url: "../StockPolicies",
                summary: policy.summary.receiptSteps + "; " + policy.summary.deliverySteps,
                editText
            },
            {section: "Reservation policies", url: "../ReservationPolicies", summary: policy.summary.reservationOrder, editText},
            {section: "Asset pools", url: "../AssetPools", summary: "Stock set aside for parties and stores", editText}
        ]
    }
}

// get#PolicyChoices: the server-search drop-downs of the settings screens, each searched in the query and answering a
// selected value outside the page.
function choices(p) {
    const scope = scopeOf({appRoot: p.appRoot})
    const organizationIds = Array.from(scope.shared.organizationPartyIds || [])
    const term = String(p.term || "").trim(),
        like = "%" + term.replace(/[\\%_]/g, character => "\\" + character) + "%",
        cf = ec.entity.conditionFactory
    const anyOf = fields =>
        cf.makeCondition(
            fields.map(field => cf.makeCondition(field, "like", like).ignoreCase()),
            "or"
        )
    const withSelected = (options, selected, read) => {
        if (selected && !options.some(option => option.value === selected)) {
            const found = read(selected)
            if (found) options.push(found)
        }
        return options
    }
    const sources = {
        organizations: () =>
            withSelected(
                organizationIds
                    .map(partyId => ({value: partyId, label: organizationText(partyId)}))
                    .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase())),
                null,
                null
            ),
        stores: () => {
            let query = find("mantle.product.store.ProductStore")
                .condition("organizationPartyId", "in", organizationIds.length ? organizationIds : ["_NONE_"])
                .orderBy("storeName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["productStoreId", "storeName"]))
            return withSelected(
                Array.from(query.list()).map(row => ({value: row.productStoreId, label: row.storeName || row.productStoreId})),
                p.selected,
                id => {
                    const store = one("mantle.product.store.ProductStore", {productStoreId: id})
                    return store && organizationIds.includes(store.organizationPartyId)
                        ? {value: id, label: store.storeName || id}
                        : null
                }
            )
        },
        products: () => {
            let query = find("mantle.product.Product")
                .condition("ownerPartyId", "in", organizationIds.length ? organizationIds : ["_NONE_"])
                .condition("productTypeEnumId", "in", ["PtAsset", "PtDigitalAsset", "PtAssetUse", "PtPickAssembly"])
                .orderBy("productName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["productId", "pseudoId", "productName"]))
            return withSelected(
                Array.from(query.list()).map(row => ({value: row.productId, label: row.productName || row.productId})),
                p.selected,
                id => {
                    const product = one("mantle.product.Product", {productId: id})
                    return product && organizationIds.includes(product.ownerPartyId)
                        ? {value: id, label: product.productName || id}
                        : null
                }
            )
        },
        parties: () => {
            // organizations and people with a customer or vendor role, never another user's private contact
            let query = find("mantle.party.PartyDetailAndRole")
                .condition("roleTypeId", "in", ["Customer", "Vendor", "Supplier"])
                .condition("privateOwnerUserId", "is-null", null)
                .selectField("partyId,organizationName,firstName,lastName")
                .distinct(true)
                .orderBy("organizationName,lastName,firstName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["partyId", "organizationName", "firstName", "lastName"]))
            const label = row => row.organizationName || [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
            return withSelected(
                Array.from(query.list()).map(row => ({value: row.partyId, label: label(row)})),
                p.selected,
                id => {
                    const names = partyNames([id])
                    return names[id] ? {value: id, label: names[id]} : null
                }
            )
        }
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown Warehouse policy choice " + p.choice)
    return {options: sources[p.choice]()}
}

function execute(op, p) {
    const operations = {context, exceptions, reservationCheck, pools, poolDetail, settingsIndex, choices}
    if (!operations[op]) throw new Error("Unknown Warehouse policy operation " + op)
    return operations[op](p)
}
;({execute})
