// The Warehouse reports (impl-warehouse P17, design-warehouse §14): stock at a date (Shared/StockAtDate's Warehouse branch)
// and operations history, through Mantle's InventoryReportServices with the user's Warehouse facilities, each row with its
// Warehouse links; the organization and facility InventoryValuation's Warehouse branch values (Mantle's
// run#InventoryValuation checks financial read itself); and the reports' drop-downs (owners, parties, carriers).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, denied, call} = lib

const choiceLimit = 30
const blank = value => (value == null || value === "" ? null : value)
const link = (kind, recordId) => (recordId ? warehouse.recordUrl(kind, recordId) : null)
// a LIKE pattern matching the text literally, ignoring case
function like(field, text) {
    const pattern = "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
    return ec.entity.conditionFactory.makeCondition(field, "like", pattern).ignoreCase()
}

// The user's scope and the facilities of a report: the one chosen (refused outside the scope) or all of theirs (null for
// every facility).
function reportScope(p) {
    const userScope = warehouse.required(warehouse.scope())
    let facilityIds = warehouse.facilityIds(userScope)
    let facility = null
    if (p.facilityId) {
        facility = one("mantle.facility.Facility", {facilityId: p.facilityId})
        if (!warehouse.inScope(userScope, facility))
            denied("FACILITY_UNAVAILABLE", "Facility " + p.facilityId + " is not available")
        facilityIds = [p.facilityId]
    }
    return {userScope, facilityIds, facility}
}
function parameters(p, fields) {
    const out = {}
    for (const field of fields) if (blank(p[field]) != null) out[field] = p[field]
    out.pageNoLimit = p.pageNoLimit === true || p.pageNoLimit === "true"
    return out
}

// StockAtDate: Mantle's get#InventoryAtDate in the user's facilities, with links to the product, lot, asset and document.
function stockAtDate(p) {
    const {facilityIds} = reportScope(p)
    const fields = [
        "asOfDate",
        "fromDate",
        "productId",
        "facilityId",
        "locationSeqId",
        "lotId",
        "ownerPartyId",
        "pageIndex",
        "pageSize",
        "historyPageIndex"
    ]
    const out = call(
        "mantle.product.InventoryReportServices.get#InventoryAtDate",
        Object.assign(parameters(p, fields), {facilityIds})
    )
    const placeLinks = row => ({productLink: link("product", row.productId), lotLink: link("lot", row.lotId)})
    // an unknown quantity (history before a facility's first movement) reads Unknown, never blank or zero
    const quantityText = value => (value == null ? "Unknown" : ec.l10n.format(toDecimal(value), "#,##0.###"))
    const texts = row => ({openingText: quantityText(row.openingQuantity), closingText: quantityText(row.closingQuantity)})
    return Object.assign({}, out, {
        totalRows: Array.from(out.totalRows || []).map(row => Object.assign({}, row, texts(row))),
        stockRows: Array.from(out.stockRows || []).map(row => Object.assign({}, row, placeLinks(row), texts(row))),
        historyRows: Array.from(out.historyRows || []).map(row =>
            Object.assign({}, row, placeLinks(row), {
                balanceText: quantityText(row.balance),
                assetLink: link("asset", row.assetId),
                documentLink: ["shipment", "return", "count"].includes(row.documentType)
                    ? link(row.documentType, row.documentId)
                    : null,
                directionColor: row.quantity < 0 ? "negative" : row.quantity > 0 ? "positive" : "grey"
            })
        )
    })
}

// OperationsHistory: Mantle's find#OperationsHistory in the user's facilities, each row with its document's Warehouse
// screen (ReceiptDetail, ShipmentDetail, TransferShipmentDetail, ReturnReceipt or SupplierReturnShipment), its return and
// its movements.
function operationsHistory(p) {
    const {facilityIds} = reportScope(p)
    const fields = [
        "operation",
        "dateBasis",
        "fromDate",
        "thruDate",
        "facilityId",
        "partyId",
        "productId",
        "carrierPartyId",
        "pageIndex",
        "pageSize"
    ]
    const out = call(
        "mantle.product.InventoryReportServices.find#OperationsHistory",
        Object.assign(parameters(p, fields), {facilityIds})
    )
    const documentLinks = new Map()
    const documentLink = shipmentId => {
        if (!documentLinks.has(shipmentId)) documentLinks.set(shipmentId, link("shipment", shipmentId))
        return documentLinks.get(shipmentId)
    }
    return Object.assign({}, out, {
        historyRows: Array.from(out.historyRows || []).map(row =>
            Object.assign({}, row, {
                documentLink: documentLink(row.shipmentId),
                returnLink: link("return", row.returnId),
                productLink: link("product", row.productId),
                movementsLink: "/qapps/Warehouse/Inventory/Movements?shipmentId=" + encodeURIComponent(row.shipmentId)
            })
        )
    })
}

// InventoryValuation's Warehouse branch: the organization valued (the chosen facility's owner, else the chosen or active
// organization of the user's, else their only one or their own, FacilityScope.js defaultOrganization) and whether the user
// reads values (financial read). Values are never read here: the screen calls Mantle's run#InventoryValuation, which refuses
// a user without ACCOUNTING_VIEW.
function valuationScope(p) {
    const {userScope, facility} = reportScope(p)
    const organizations = userScope.organizationPartyIds || []
    let organizationPartyId = facility ? facility.ownerPartyId : blank(p.organizationPartyId)
    if (!facility && organizationPartyId && !userScope.unrestricted && !organizations.includes(organizationPartyId))
        denied("ORGANIZATION_UNAVAILABLE", "Organization " + organizationPartyId + " is not available")
    if (!organizationPartyId)
        organizationPartyId = ec.resource
            .script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
            .defaultOrganization({
                activeOrganizationPartyId: userScope.activeOrganizationPartyId,
                organizationPartyIds: organizations
            })
    const names = lib.partyNames(organizations.concat(organizationPartyId ? [organizationPartyId] : []))
    return {
        financialRead: !!userScope.capabilities.financialRead,
        organizationPartyId,
        organizationName: organizationPartyId ? names[organizationPartyId] || organizationPartyId : "",
        facilityId: facility?.facilityId || null,
        facilityName: facility ? facility.facilityName || facility.facilityId : "",
        organizationOptions: organizations.map(value => ({value, label: names[value] || value}))
    }
}

// The reports' drop-downs: owners (the user's organizations), parties (by name or id) and carriers (parties in the Carrier
// role), searched ignoring case in the query, with the selected value's label.
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const term = String(p.term || "").trim()
    const factory = ec.entity.conditionFactory
    const option = row => ({
        value: row.partyId,
        label: (row.organizationName || nameOf(row) || row.partyId) + " · " + row.partyId
    })
    const nameOf = row => [row.firstName, row.lastName].filter(Boolean).join(" ")
    const partyQuery = () => {
        let query = find("mantle.party.PartyDetail").orderBy("organizationName").orderBy("lastName").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["partyId", "organizationName", "firstName", "lastName"].map(field => like(field, term)),
                    "or"
                )
            )
        return query
    }
    const selected = (options, allowed) => {
        if (!p.selected || options.some(row => row.value === p.selected)) return options
        const row = one("mantle.party.PartyDetail", {partyId: p.selected})
        return row && allowed(row) ? options.concat([option(row)]) : options
    }
    const sources = {
        // the user's facilities (AccessServices' choice), for a screen whose choices transition is another app's
        facilities: () => warehouse.execute("choices", {choice: "facilities", term: p.term, selected: p.selected}).options,
        owners: () => {
            let query = partyQuery()
            if (!userScope.unrestricted)
                query = query.condition("partyId", "in", (userScope.organizationPartyIds || []).concat(["_NA_"]))
            else query = query.condition("partyTypeEnumId", "PtyOrganization")
            const options = Array.from(query.list()).map(option)
            return selected(options, row => userScope.unrestricted || userScope.organizationPartyIds.includes(row.partyId))
        },
        parties: () => {
            const options = Array.from(partyQuery().list())
                .filter(row => !row.privateOwnerUserId || row.privateOwnerUserId === ec.user.userId)
                .map(option)
            return selected(options, row => !row.privateOwnerUserId || row.privateOwnerUserId === ec.user.userId)
        },
        carriers: () => {
            const carrierIds = Array.from(
                find("mantle.party.PartyRole", {roleTypeId: "Carrier"}).selectField("partyId").limit(500).list()
            ).map(row => row.partyId)
            const options = Array.from(
                partyQuery()
                    .condition("partyId", "in", carrierIds.concat(["_NA_"]))
                    .list()
            ).map(option)
            return selected(options, row => carrierIds.includes(row.partyId))
        }
    }
    if (!sources[p.choice]) throw new Error("Unknown Warehouse report choice " + p.choice)
    return {options: sources[p.choice]()}
}

// Home's quantity indicators for a facility (design §3's KPI strip): the products in stock and the stock lines on hold and
// quarantined, counted (never a sum of quantities across units). One that fails is logged and left unknown (null).
function homeIndicators(p) {
    const {facility} = reportScope(p)
    if (!facility) return {}
    const stockQuery = () =>
        find("mantle.product.asset.Asset", {facilityId: facility.facilityId})
            .condition("assetTypeEnumId", "in", ["AstTpInventory", "AstTpSupplies"])
            .condition("quantityOnHandTotal", "greater", 0)
    const counted = (name, count) => {
        try {
            return count()
        } catch (error) {
            ec.logger.error("Warehouse Home indicator " + name + ": " + error.message)
            return null
        }
    }
    return {
        productCount: counted(
            "products",
            () => Array.from(stockQuery().selectField("productId").distinct(true).limit(10000).list()).length
        ),
        onHoldCount: counted("on hold", () => stockQuery().condition("statusId", "AstOnHold").count()),
        quarantineCount: counted("quarantine", () => stockQuery().condition("statusId", "AstQuarantine").count())
    }
}

const operations = {stockAtDate, operationsHistory, valuationScope, choices, homeIndicators}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse report operation " + op)
        return operations[op](parameters)
    }
})
