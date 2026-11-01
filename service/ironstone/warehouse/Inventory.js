// The Warehouse Inventory area's reads and shapes (impl-warehouse P4, design-warehouse §6): assets, an asset's header,
// reservations and audit, lots, containers, the ledger and lineage through Mantle's TraceabilityServices, the physical
// stock tabs of Product360 and Availability, and the drop-down choices. Every read is limited in the query to the user's
// Warehouse facilities (Warehouse.js scope); every write checks the record and capability there, then calls the Mantle
// service, which checks its permission and organization again. Cost is answered only with financial read.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, denied, call, dateText, calendarDateText} = lib

const ASSET = "mantle.product.asset.Asset"
const choiceLimit = 30
const groupLimit = 500
// an export (pageNoLimit) gets every row on one page, up to this
const noLimitCap = 5000
const nearExpiryDays = 30
const statusColors = {
    AstAvailable: "positive",
    AstOnHold: "warning",
    AstQuarantine: "negative",
    AstMorgue: "grey-8",
    AstDefective: "negative",
    AstInTransfer: "info",
    AstInTransferPromise: "info"
}
// the cost and book fields of an asset's audit, shown only with financial read
const costFields = [
    "acquireCost",
    "acquireCostUomId",
    "salvageValue",
    "depreciation",
    "depreciationTypeEnumId",
    "yearBeginDepreciation",
    "taxDepreciation"
]
const fieldLabels = {
    statusId: "Status",
    ownerPartyId: "Owner",
    assetPoolId: "Pool",
    productId: "Product",
    assetName: "Name",
    comments: "Comments",
    serialNumber: "Serial number",
    facilityId: "Facility",
    locationSeqId: "Location",
    containerId: "Container",
    lotId: "Lot",
    geoPointId: "Map point",
    acquireCost: "Acquire cost",
    acquireCostUomId: "Cost currency",
    salvageValue: "Residual value",
    depreciation: "Depreciation",
    depreciationTypeEnumId: "Depreciation method",
    yearBeginDepreciation: "Depreciation at year start",
    taxDepreciation: "Tax depreciation"
}

const number = value => (value == null ? null : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(
        Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField] || row[field]])
    )
}
const statusNames = values => namesOf("moqui.basic.StatusItem", "statusId", "description", values)
// a LIKE pattern matching the text literally, ignoring case
function like(field, text) {
    const pattern = "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
    return ec.entity.conditionFactory.makeCondition(field, "like", pattern).ignoreCase()
}
function anyOf(conditions) {
    return conditions.length === 1 ? conditions[0] : ec.entity.conditionFactory.makeCondition(conditions, "or")
}
function todayText() {
    return ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
}
function dayText(offsetDays) {
    return ec.l10n.format(new Date(lib.ms(ec.user.nowTimestamp) + offsetDays * 86400000), "yyyy-MM-dd")
}
// the expiry state of a lot or asset by its calendar date: expired, near (within nearExpiryDays) or none
function expiryState(expirationDate) {
    if (expirationDate == null || expirationDate === "") return {expiryText: "", expiryColor: "grey"}
    const day = calendarDateText(expirationDate)
    if (day < todayText()) return {expiryText: "Expired " + day, expiryColor: "negative"}
    if (day <= dayText(nearExpiryDays)) return {expiryText: "Expires " + day, expiryColor: "warning"}
    return {expiryText: "Expires " + day, expiryColor: "positive"}
}
function pageFields(paged, field) {
    return Object.fromEntries(
        ["Count", "PageIndex", "PageSize", "PageMaxIndex", "PageRangeLow", "PageRangeHigh"].map(key => [
            field + key,
            paged[field + key]
        ])
    )
}
function pageOf(list, p, field) {
    const pageSize = Math.min(100, Math.max(1, Number(p.pageSize) || 20))
    const pageMaxIndex = Math.max(0, Math.ceil(list.length / pageSize) - 1)
    const pageIndex = Math.min(pageMaxIndex, Math.max(0, Number(p.pageIndex) || 0))
    return {
        [field]: list.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        [field + "Count"]: list.length,
        [field + "PageIndex"]: pageIndex,
        [field + "PageSize"]: pageSize,
        [field + "PageMaxIndex"]: pageMaxIndex,
        [field + "PageRangeLow"]: list.length ? pageIndex * pageSize + 1 : 0,
        [field + "PageRangeHigh"]: Math.min(list.length, (pageIndex + 1) * pageSize)
    }
}

// The user's scope and the facilities of a list: the one chosen (refused outside the scope) or all of theirs (null for
// every facility).
function listScope(p) {
    const userScope = warehouse.required(warehouse.scope())
    let ids = warehouse.facilityIds(userScope)
    if (p.facilityId) {
        const facility = one("mantle.facility.Facility", {facilityId: p.facilityId})
        if (!warehouse.inScope(userScope, facility))
            denied("FACILITY_UNAVAILABLE", "Facility " + p.facilityId + " is not available")
        ids = [p.facilityId]
    }
    return {userScope, facilityIds: ids, financialRead: !!userScope.capabilities.financialRead}
}
function scoped(query, facilityIds, field = "facilityId") {
    return facilityIds == null ? query : query.condition(field, "in", facilityIds)
}
function checkRecord(recordType, recordId, capability, extra = {}) {
    return warehouse.execute("checkRecord", Object.assign({recordType, recordId, capability}, extra))
}
function linkOf(kind, recordId) {
    return recordId ? warehouse.recordUrl(kind, recordId) : null
}

// ===== assets =====
const assetFilterFields = ["productId", "lotId", "statusId", "ownerPartyId", "assetPoolId", "locationSeqId", "containerId"]
function assetQuery(entity, facilityIds, p, withText) {
    let query = scoped(find(entity), facilityIds)
    for (const field of assetFilterFields) if (p[field]) query = query.condition(field, p[field])
    if (p.serialNumber) query = query.condition(like("serialNumber", p.serialNumber))
    if (withText && p.text) {
        const text = String(p.text).trim()
        query = query.condition(anyOf(["assetId", "serialNumber", "productName", "lotNumber"].map(field => like(field, text))))
    }
    // depleted inventory stays AstAvailable at zero: shown only when asked (a grouped find sums, and leaves out empty groups)
    if (!p.showEmpty && entity === "mantle.product.asset.AssetFindView") {
        const factory = ec.entity.conditionFactory
        query = query.condition(
            anyOf([
                factory.makeCondition("quantityOnHandTotal", "not-equals", 0),
                factory.makeCondition("assetTypeEnumId", "not-in", ["AstTpInventory", "AstTpSupplies"])
            ])
        )
    }
    return query
}
function assetRows(rows, financialRead) {
    const owners = lib.partyNames(rows.map(row => row.ownerPartyId))
    const statuses = statusNames(rows.map(row => row.statusId))
    return rows.map(row => {
        const out = {
            assetId: row.assetId,
            productId: row.productId,
            productName: row.productName || row.productId || "",
            assetName: row.assetName || "",
            serialNumber: row.serialNumber || "",
            lotId: row.lotId,
            lotNumber: row.lotNumber || row.lotId || "",
            statusId: row.statusId,
            statusText: statuses.get(row.statusId) || row.statusId || "",
            statusColor: statusColors[row.statusId] || "grey",
            facilityId: row.facilityId,
            facilityName: row.facilityName || row.facilityId || "",
            locationSeqId: row.locationSeqId || "",
            containerId: row.containerId,
            quantityOnHand: number(row.quantityOnHandTotal),
            availableToPromise: number(row.availableToPromiseTotal),
            ownerPartyId: row.ownerPartyId,
            ownerName: owners[row.ownerPartyId] || row.ownerPartyId || "",
            equipment: !["AstTpInventory", "AstTpSupplies"].includes(row.assetTypeEnumId),
            receivedDateText: dateText(row.receivedDate)
        }
        Object.assign(out, expiryState(row.expirationDate))
        if (financialRead) {
            out.acquireCost = number(row.acquireCost)
            out.acquireCostUomId = row.acquireCostUomId
        }
        return out
    })
}
// the assets of a group: the rows' fields, labels and totals by product, lot, location or owner
const groupDefinitions = {
    product: ["productId"],
    lot: ["lotId"],
    location: ["facilityId", "locationSeqId"],
    owner: ["ownerPartyId"]
}
function assetGroups(facilityIds, p) {
    const fields = groupDefinitions[p.groupBy]
    if (!fields) throw new Error("Unknown asset grouping " + p.groupBy)
    const rows = Array.from(
        assetQuery("mantle.product.asset.AssetQuantitySummary", facilityIds, p, false)
            .selectField(fields.concat(["quantityOnHandTotal", "availableToPromiseTotal"]).join(","))
            .orderBy(fields.join(","))
            .limit(groupLimit)
            .list()
    )
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        rows.map(row => row.productId)
    )
    const lots = namesOf(
        "mantle.product.asset.Lot",
        "lotId",
        "lotNumber",
        rows.map(row => row.lotId)
    )
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        rows.map(row => row.facilityId)
    )
    const owners = lib.partyNames(rows.map(row => row.ownerPartyId))
    const labelOf = row =>
        p.groupBy === "product"
            ? products.get(row.productId) || row.productId
            : p.groupBy === "lot"
              ? row.lotId
                  ? "Lot " + (lots.get(row.lotId) || row.lotId)
                  : "No lot"
              : p.groupBy === "location"
                ? [facilities.get(row.facilityId) || row.facilityId || "No facility", row.locationSeqId || "no location"].join(
                      " · "
                  )
                : owners[row.ownerPartyId] || row.ownerPartyId || "No owner"
    const nonEmpty = p.showEmpty ? rows : rows.filter(row => toDecimal(row.quantityOnHandTotal ?? 0).compare(0) !== 0)
    return nonEmpty.map(row => ({
        groupKey: fields.map(field => row[field] || "").join("|"),
        groupLabel: labelOf(row) || "",
        filter: Object.fromEntries(fields.map(field => [field, row[field] || ""])),
        quantityOnHand: number(row.quantityOnHandTotal),
        availableToPromise: number(row.availableToPromiseTotal)
    }))
}
function findAssets(p) {
    const {facilityIds, financialRead} = listScope(p)
    if (p.groupBy) {
        const groups = assetGroups(facilityIds, p)
        return Object.assign(
            {assetList: [], groupBy: p.groupBy, groupTruncated: groups.length >= groupLimit},
            pageOf(groups, p, "groupList")
        )
    }
    const view = "mantle.product.asset.AssetFindView"
    const count = assetQuery(view, facilityIds, p, true).count()
    const query = assetQuery(view, facilityIds, p, true).orderBy("productName").orderBy("assetId")
    const paged = lib.page(query, p, "assetList", count, {noLimitCap})
    return Object.assign(
        {assetList: assetRows(paged.rows, financialRead), groupList: [], costIncluded: financialRead},
        pageFields(paged, "assetList")
    )
}

// One asset: its header, the capability to edit its metadata, and its reservations.
function assetDetail(p) {
    const record = checkRecord("asset", p.assetId)
    const {financialRead, userScope} = listScope({})
    // AssetFindView joins the facility and product: an asset without them (equipment, which opens EquipmentDetail) is
    // read from Asset alone
    const row = one("mantle.product.asset.AssetFindView", {assetId: p.assetId}) || one(ASSET, {assetId: p.assetId})
    const [asset] = assetRows([row], financialRead)
    const type = one("moqui.basic.Enumeration", {enumId: row.assetTypeEnumId})
    const pool = row.assetPoolId ? one("mantle.product.asset.AssetPool", {assetPoolId: row.assetPoolId}) : null
    const container = row.containerId ? one("mantle.product.asset.Container", {containerId: row.containerId}) : null
    Object.assign(asset, {
        comments: row.comments || "",
        typeText: type?.description || row.assetTypeEnumId || "",
        poolText: pool ? pool.description || pool.assetPoolId : "",
        containerText: container ? container.description || container.serialNumber || container.containerId : "",
        hasQuantity: row.hasQuantity === "Y",
        lastUpdatedStamp: row.lastUpdatedStamp,
        locationText: [record.facilityName, row.locationSeqId].filter(Boolean).join(" · "),
        productLink: linkOf("product", row.productId),
        lotLink: linkOf("lot", row.lotId),
        containerLink: linkOf("container", row.containerId)
    })
    const reservations = Array.from(
        find("mantle.product.issuance.AssetReservation", {assetId: p.assetId}).orderBy("reservedDate").limit(200).list()
    )
    const parts = reservations.length
        ? Array.from(
              find("mantle.order.OrderPart")
                  .condition("orderId", "in", unique(reservations.map(r => r.orderId)))
                  .list()
          )
        : []
    const customers = lib.partyNames(parts.map(part => part.customerPartyId))
    const reservationRows = reservations.map(r => {
        const part = parts.find(row => row.orderId === r.orderId)
        return {
            assetReservationId: r.assetReservationId,
            orderId: r.orderId,
            orderItemSeqId: r.orderItemSeqId,
            customerName: customers[part?.customerPartyId] || part?.customerPartyId || "",
            quantity: number(r.quantity),
            quantityNotIssued: number(r.quantityNotIssued),
            quantityNotAvailable: number(r.quantityNotAvailable),
            reservedDateText: dateText(r.reservedDate),
            promisedDateText: dateText(r.currentPromisedDate || r.originalPromisedDate)
        }
    })
    return {
        recordFound: true,
        asset,
        canEditMetadata: !!userScope.capabilities.adjust,
        costIncluded: financialRead,
        reservationRows
    }
}
// An asset's audit trail: the audit-logged fields' changes, newest first; cost and book fields only with financial read.
function assetAudit(p) {
    checkRecord("asset", p.assetId)
    const {financialRead} = listScope({})
    let query = find("moqui.entity.EntityAuditLog", {changedEntityName: ASSET, pkPrimaryValue: p.assetId})
    if (!financialRead) query = query.condition("changedFieldName", "not-in", costFields)
    const rows = Array.from(query.orderBy("-changedDate").limit(200).list())
    const users = namesOf(
        "moqui.security.UserAccount",
        "userId",
        "username",
        rows.map(row => row.changedByUserId)
    )
    const statuses = statusNames(
        rows.flatMap(row => (row.changedFieldName === "statusId" ? [row.oldValueText, row.newValueText] : []))
    )
    const valueText = (field, value) => (value == null ? "" : field === "statusId" ? statuses.get(value) || value : String(value))
    return {
        auditRows: rows.map(row => ({
            auditHistorySeqId: row.auditHistorySeqId,
            fieldText: fieldLabels[row.changedFieldName] || row.changedFieldName,
            oldValueText: valueText(row.changedFieldName, row.oldValueText),
            newValueText: valueText(row.changedFieldName, row.newValueText),
            userText: users.get(row.changedByUserId) || row.changedByUserId || "",
            changedDateText: dateText(row.changedDate)
        }))
    }
}
function storeAssetMetadata(p) {
    checkRecord("asset", p.assetId, "adjust")
    // only the fields the form posted: one left out keeps its value
    const parameters = {assetId: p.assetId, expectedLastUpdatedStamp: p.expectedLastUpdatedStamp}
    for (const name of ["assetName", "comments"]) if (p[name] !== undefined) parameters[name] = p[name]
    call("mantle.product.AssetRecordServices.update#AssetMetadata", parameters)
    return {assetId: p.assetId}
}

// ===== movements and lineage =====
function findMovements(p) {
    const {facilityIds, financialRead} = listScope(p)
    if (p.assetId) checkRecord("asset", p.assetId)
    if (p.lotId) checkRecord("lot", p.lotId)
    const parameters = {facilityIds, pageIndex: p.pageIndex, pageSize: p.pageSize, pageNoLimit: !!p.pageNoLimit}
    const fields = ["assetId", "productId", "lotId", "sourceType", "varianceReasonEnumId", "fromDate", "thruDate", "shipmentId"]
    for (const field of fields) if (p[field]) parameters[field] = p[field]
    const out = call("mantle.product.TraceabilityServices.find#Movements", parameters)
    const rows = Array.from(out.movementList || []).map(row =>
        Object.assign({}, row, {
            assetLink: linkOf("asset", row.assetId),
            otherAssetLink: row.otherAssetId ? linkOf("asset", row.otherAssetId) : null,
            documentLink: ["shipment", "return", "count"].includes(row.documentType)
                ? linkOf(row.documentType, row.documentId)
                : null,
            directionColor: Number(row.quantityOnHandDiff) < 0 ? "negative" : "positive"
        })
    )
    return Object.assign({}, out, {movementList: rows, costIncluded: financialRead && !!out.costIncluded})
}
const traceKinds = {asset: "asset", lot: "lot", shipment: "shipment"}
function trace(p) {
    const {facilityIds, financialRead} = listScope({})
    if (!p.rootId) return {treeRows: [], nodeList: [], edgeList: [], traced: false}
    const rootType = traceKinds[p.rootType || "lot"]
    if (!rootType) throw new Error("Unknown trace root " + p.rootType)
    // a lot by its id or by its printed lot number (the one lot of that number the user may open)
    let rootId = String(p.rootId).trim()
    if (rootType === "lot" && !one("mantle.product.asset.Lot", {lotId: rootId})) {
        const userScope = warehouse.scope()
        const matches = Array.from(find("mantle.product.asset.Lot", {lotNumber: rootId}).limit(20).list()).filter(lot => {
            try {
                return !!warehouse.recordOf(userScope, "lot", lot.lotId)
            } catch (error) {
                return false
            }
        })
        if (matches.length === 1) rootId = matches[0].lotId
    }
    checkRecord(rootType, rootId)
    const out = call("mantle.product.TraceabilityServices.get#Traceability", {
        rootType,
        rootId,
        direction: p.direction || "both",
        maxDepth: p.maxDepth,
        facilityIds,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: !!p.pageNoLimit
    })
    const linkFor = row =>
        ["asset", "shipment", "return", "count"].includes(row.kind) && row.recordId ? linkOf(row.kind, row.recordId) : null
    const decorate = row => Object.assign({}, row, {link: linkFor(row)})
    return Object.assign({}, out, {
        traced: true,
        treeRows: Array.from(out.treeRows || []).map(decorate),
        nodeList: Array.from(out.nodeList || []).map(decorate),
        costIncluded: financialRead && !!out.costIncluded
    })
}

// ===== lots =====
const lotFields = "lotId,lotNumber,mfgPartyId,manufacturedDate,expirationDate"
// The lots with stock in the user's facilities, and the lots with no stock anywhere (a new lot names no organization's
// stock), found and paged in the query.
function lotQuery(facilityIds, p) {
    const factory = ec.entity.conditionFactory
    // one query: a lot with an asset in the facilities, or a lot with no asset at all (its asset fields empty)
    let query =
        facilityIds == null
            ? find("mantle.product.asset.Lot")
            : find("mantle.product.asset.LotAndAsset")
                  .condition(
                      anyOf([
                          factory.makeCondition("assetFacilityId", "in", facilityIds),
                          factory.makeCondition("assetId", "is-null", null)
                      ])
                  )
                  .selectField(lotFields)
                  .distinct(true)
    if (p.text) query = query.condition(anyOf([like("lotNumber", p.text), like("lotId", p.text)]))
    if (p.expiry === "expired") query = query.condition("expirationDate", "less", todayText())
    else if (p.expiry === "near")
        query = query
            .condition("expirationDate", "greater-equals", todayText())
            .condition("expirationDate", "less-equals", dayText(nearExpiryDays))
    else if (p.expiry === "none") query = query.condition("expirationDate", "is-null", null)
    return query
}
function findLots(p) {
    const {facilityIds} = listScope(p)
    const count = lotQuery(facilityIds, p).count()
    const paged = lib.page(lotQuery(facilityIds, p).orderBy("expirationDate").orderBy("lotNumber"), p, "lotList", count, {
        noLimitCap
    })
    const lotIds = paged.rows.map(row => row.lotId)
    const totals = new Map()
    if (lotIds.length)
        for (const row of Array.from(
            scoped(find("mantle.product.asset.AssetQuantitySummary"), facilityIds)
                .condition("lotId", "in", lotIds)
                .selectField("lotId,quantityOnHandTotal")
                .list()
        ))
            totals.set(row.lotId, number(row.quantityOnHandTotal))
    const makers = lib.partyNames(paged.rows.map(row => row.mfgPartyId))
    return Object.assign(
        {
            lotList: paged.rows.map(row =>
                Object.assign(
                    {
                        lotId: row.lotId,
                        lotNumber: row.lotNumber || row.lotId,
                        mfgPartyId: row.mfgPartyId,
                        mfgName: makers[row.mfgPartyId] || row.mfgPartyId || "",
                        manufacturedDateText: dateText(row.manufacturedDate),
                        expirationDateText: row.expirationDate ? calendarDateText(row.expirationDate) : "",
                        quantityOnHand: totals.get(row.lotId) ?? 0
                    },
                    expiryState(row.expirationDate)
                )
            )
        },
        pageFields(paged, "lotList")
    )
}
// One lot (LotStock): its metadata and its stock in the user's facilities, with each product the lot is of.
function lotDetail(p) {
    checkRecord("lot", p.lotId)
    const {facilityIds, financialRead} = listScope({})
    const lot = one("mantle.product.asset.Lot", {lotId: p.lotId})
    const makers = lib.partyNames([lot.mfgPartyId])
    const assets = Array.from(
        scoped(find("mantle.product.asset.AssetFindView", {lotId: p.lotId}), facilityIds)
            .orderBy("facilityName,locationSeqId")
            .limit(500)
            .list()
    )
    const rows = assetRows(assets, financialRead)
    const products = new Map()
    for (const row of rows)
        if (row.productId && !products.has(row.productId))
            products.set(row.productId, {
                productId: row.productId,
                productName: row.productName,
                link: linkOf("product", row.productId)
            })
    return {
        lot: Object.assign(
            {
                lotId: lot.lotId,
                lotNumber: lot.lotNumber || lot.lotId,
                mfgName: makers[lot.mfgPartyId] || lot.mfgPartyId || "",
                manufacturedDateText: dateText(lot.manufacturedDate),
                expirationDateText: lot.expirationDate ? calendarDateText(lot.expirationDate) : ""
            },
            expiryState(lot.expirationDate)
        ),
        lotStockRows: rows,
        lotProducts: Array.from(products.values())
    }
}
function createLot(p) {
    const userScope = warehouse.required(warehouse.scope())
    if (!userScope.capabilities.receive) denied("PERMISSION_DENIED", "STOCK_RECEIVE is required")
    return call("mantle.product.AssetRecordServices.create#Lot", {
        lotNumber: p.lotNumber,
        mfgPartyId: p.mfgPartyId || null,
        manufacturedDate: p.manufacturedDate || null,
        expirationDate: p.expirationDate || null
    })
}

// ===== containers =====
function containerQuery(facilityIds, p) {
    let query = scoped(find("mantle.product.asset.Container"), facilityIds)
    if (p.containerTypeEnumId) query = query.condition("containerTypeEnumId", p.containerTypeEnumId)
    if (p.locationSeqId) query = query.condition("locationSeqId", p.locationSeqId)
    if (p.text) query = query.condition(anyOf(["containerId", "serialNumber", "description"].map(field => like(field, p.text))))
    return query
}
function containerRows(rows) {
    const types = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        rows.map(row => row.containerTypeEnumId)
    )
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        rows.map(row => row.facilityId)
    )
    const counts = new Map()
    const ids = rows.map(row => row.containerId)
    if (ids.length)
        for (const asset of Array.from(find(ASSET).condition("containerId", "in", ids).selectField("containerId").list()))
            counts.set(asset.containerId, (counts.get(asset.containerId) || 0) + 1)
    return rows.map(row => ({
        containerId: row.containerId,
        serialNumber: row.serialNumber || "",
        description: row.description || "",
        containerTypeEnumId: row.containerTypeEnumId,
        typeText: types.get(row.containerTypeEnumId) || row.containerTypeEnumId || "",
        facilityId: row.facilityId,
        facilityName: facilities.get(row.facilityId) || row.facilityId || "",
        locationSeqId: row.locationSeqId || "",
        assetCount: counts.get(row.containerId) || 0,
        createdDateText: dateText(row.createdDate)
    }))
}
function findContainers(p) {
    const {facilityIds} = listScope(p)
    const count = containerQuery(facilityIds, p).count()
    const paged = lib.page(containerQuery(facilityIds, p).orderBy("containerId"), p, "containerList", count, {noLimitCap})
    return Object.assign({containerList: containerRows(paged.rows)}, pageFields(paged, "containerList"))
}
function containerDetail(p) {
    checkRecord("container", p.containerId)
    const {facilityIds, financialRead} = listScope({})
    const [container] = containerRows([one("mantle.product.asset.Container", {containerId: p.containerId})])
    const assets = Array.from(
        scoped(find("mantle.product.asset.AssetFindView", {containerId: p.containerId}), facilityIds)
            .orderBy("assetId")
            .limit(500)
            .list()
    )
    return {recordFound: true, container, contentRows: assetRows(assets, financialRead)}
}
function createContainer(p) {
    checkRecord("facility", p.facilityId, "move")
    if (p.locationSeqId) checkRecord("location", p.locationSeqId, null, {facilityId: p.facilityId})
    return call("mantle.product.AssetRecordServices.create#Container", {
        facilityId: p.facilityId,
        locationSeqId: p.locationSeqId || null,
        containerTypeEnumId: p.containerTypeEnumId || null,
        serialNumber: p.serialNumber || null,
        description: p.description || null
    })
}

// ===== a product's physical stock (Product360's Replenishment, Availability's Locations and Reservations tabs) =====
function productScope(p) {
    checkRecord("product", p.productId)
    return listScope(p)
}
// the product's facility levels in the user's facilities, beside what is on hand there
function replenishment(p) {
    const {facilityIds} = productScope(p)
    const policies = Array.from(scoped(find("mantle.facility.ProductFacility", {productId: p.productId}), facilityIds).list())
    const onHand = new Map(
        Array.from(
            scoped(find("mantle.product.asset.AssetQuantitySummary", {productId: p.productId}), facilityIds)
                .selectField("facilityId,quantityOnHandTotal")
                .list()
        ).map(row => [row.facilityId, number(row.quantityOnHandTotal)])
    )
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        policies.map(row => row.facilityId)
    )
    const methods = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        policies.map(row => row.reorderMethodEnumId)
    )
    const levelRows = policies.map(row => {
        const quantity = onHand.get(row.facilityId) ?? 0
        const minimum = number(row.minimumStock)
        return {
            facilityId: row.facilityId,
            facilityName: facilities.get(row.facilityId) || row.facilityId,
            minimumStock: minimum,
            maximumStock: number(row.maximumStock),
            reorderQuantity: number(row.reorderQuantity),
            reorderMethodText: methods.get(row.reorderMethodEnumId) || "",
            daysToShip: number(row.daysToShip),
            quantityOnHand: quantity,
            levelText: minimum == null ? "No minimum" : quantity < minimum ? "Below minimum" : "At or above minimum",
            levelColor: minimum == null ? "grey" : quantity < minimum ? "warning" : "positive"
        }
    })
    const locations = Array.from(
        scoped(find("mantle.facility.ProductFacilityLocation", {productId: p.productId}), facilityIds).list()
    )
    const locationFacilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        locations.map(row => row.facilityId)
    )
    return {
        levelRows,
        pickLocationRows: locations.map(row => ({
            facilityName: locationFacilities.get(row.facilityId) || row.facilityId,
            locationSeqId: row.locationSeqId,
            minimumStock: number(row.minimumStock),
            moveQuantity: number(row.moveQuantity)
        }))
    }
}
// the product's stock by facility, location, lot and status
function productLocations(p) {
    const {facilityIds} = productScope(p)
    const rows = Array.from(
        scoped(find("mantle.product.asset.AssetQuantitySummary", {productId: p.productId}), facilityIds)
            .selectField("facilityId,locationSeqId,lotId,statusId,quantityOnHandTotal,availableToPromiseTotal")
            .orderBy("facilityId,locationSeqId,lotId")
            .limit(groupLimit)
            .list()
    ).filter(row => toDecimal(row.quantityOnHandTotal ?? 0).compare(0) !== 0)
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        rows.map(row => row.facilityId)
    )
    const lots = Array.from(
        unique(rows.map(row => row.lotId)).length
            ? find("mantle.product.asset.Lot")
                  .condition("lotId", "in", unique(rows.map(row => row.lotId)))
                  .list()
            : []
    )
    const lotById = new Map(lots.map(row => [row.lotId, row]))
    const statuses = statusNames(rows.map(row => row.statusId))
    // each row's assets, for Relocate (P5): the bucket's assets with something on hand
    const bucketOf = row => [row.facilityId, row.locationSeqId || "", row.lotId || "", row.statusId || ""].join("|")
    const assetIdsByBucket = new Map()
    const bucketAssets = Array.from(
        scoped(find(ASSET, {productId: p.productId}), facilityIds)
            .condition("quantityOnHandTotal", "not-equals", 0)
            .selectField("assetId,facilityId,locationSeqId,lotId,statusId")
            .orderBy("assetId")
            .limit(groupLimit * 4)
            .list()
    )
    for (const asset of bucketAssets)
        assetIdsByBucket.set(bucketOf(asset), (assetIdsByBucket.get(bucketOf(asset)) || []).concat([asset.assetId]))
    return {
        locationRows: rows.map(row =>
            Object.assign(
                {
                    assetIds: (assetIdsByBucket.get(bucketOf(row)) || []).join(","),
                    facilityId: row.facilityId,
                    facilityName: facilities.get(row.facilityId) || row.facilityId || "",
                    locationSeqId: row.locationSeqId || "",
                    lotId: row.lotId,
                    lotNumber: lotById.get(row.lotId)?.lotNumber || row.lotId || "",
                    lotLink: linkOf("lot", row.lotId),
                    statusText: statuses.get(row.statusId) || row.statusId || "",
                    statusColor: statusColors[row.statusId] || "grey",
                    quantityOnHand: number(row.quantityOnHandTotal),
                    availableToPromise: number(row.availableToPromiseTotal)
                },
                expiryState(lotById.get(row.lotId)?.expirationDate)
            )
        )
    }
}
// the product's open reservations on stock in the user's facilities
function productReservations(p) {
    const {facilityIds} = productScope(p)
    const rows = Array.from(
        scoped(find("mantle.product.issuance.AssetAndReservation", {productId: p.productId}), facilityIds)
            .condition("quantityNotIssued", "greater", 0)
            .orderBy("reservedDate")
            .limit(groupLimit)
            .list()
    )
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        rows.map(row => row.facilityId)
    )
    return {
        reservationRows: rows.map(row => ({
            assetReservationId: row.assetReservationId,
            orderId: row.orderId,
            orderItemSeqId: row.orderItemSeqId,
            assetId: row.assetId,
            assetLink: linkOf("asset", row.assetId),
            facilityName: facilities.get(row.facilityId) || row.facilityId || "",
            locationSeqId: row.locationSeqId || "",
            quantityNotIssued: number(row.quantityNotIssued),
            quantityNotAvailable: number(row.quantityNotAvailable),
            reservedDateText: dateText(row.reservedDate),
            promisedDateText: dateText(row.currentPromisedDate || row.originalPromisedDate)
        }))
    }
}

// ===== choices =====
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const term = String(p.term || "").trim()
    const option = (value, label) => ({value, label})
    const sources = {
        products: () => {
            let query = find("mantle.product.Product").orderBy("productName").limit(choiceLimit)
            if (!userScope.unrestricted)
                query = query.condition(
                    anyOf([
                        ec.entity.conditionFactory.makeCondition(
                            "ownerPartyId",
                            "in",
                            userScope.organizationPartyIds.concat(["_NA_"])
                        ),
                        ec.entity.conditionFactory.makeCondition("ownerPartyId", "is-null", null)
                    ])
                )
            if (term) query = query.condition(anyOf(["productId", "productName", "pseudoId"].map(field => like(field, term))))
            const options = Array.from(query.list()).map(row =>
                option(row.productId, (row.productName || row.productId) + " · " + row.productId)
            )
            if (p.selected && !options.some(row => row.value === p.selected)) {
                try {
                    const record = warehouse.recordOf(userScope, "product", p.selected)
                    options.push(option(p.selected, record.label + " · " + p.selected))
                } catch (error) {
                    if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
                }
            }
            return options
        },
        lots: () => {
            let query = lotQuery(warehouse.facilityIds(userScope), {text: term}).orderBy("lotNumber").limit(choiceLimit)
            const options = Array.from(query.list()).map(row => option(row.lotId, row.lotNumber || row.lotId))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                try {
                    const record = warehouse.recordOf(userScope, "lot", p.selected)
                    options.push(option(p.selected, record.label))
                } catch (error) {
                    if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
                }
            }
            return options
        },
        locations: () => {
            if (!p.facilityId) return []
            const facility = one("mantle.facility.Facility", {facilityId: p.facilityId})
            if (!warehouse.inScope(userScope, facility))
                denied("FACILITY_UNAVAILABLE", "Facility " + p.facilityId + " is not available")
            let query = find("mantle.facility.FacilityLocation", {facilityId: p.facilityId})
                .orderBy("locationSeqId")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf([like("locationSeqId", term), like("description", term)]))
            const label = row => [row.locationSeqId, row.description].filter(Boolean).join(" · ")
            const options = Array.from(query.list()).map(row => option(row.locationSeqId, label(row)))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                const selected = one("mantle.facility.FacilityLocation", {facilityId: p.facilityId, locationSeqId: p.selected})
                if (selected) options.push(option(selected.locationSeqId, label(selected)))
            }
            return options
        },
        // the organizations a lot may be made by, by name
        manufacturers: () => {
            let query = find("mantle.party.PartyDetail", {partyTypeEnumId: "PtyOrganization"})
                .condition("privateOwnerUserId", "is-null", null)
                .orderBy("organizationName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf([like("organizationName", term), like("partyId", term)]))
            const options = Array.from(query.list()).map(row => option(row.partyId, row.organizationName || row.partyId))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                const selected = one("mantle.party.PartyDetail", {partyId: p.selected})
                if (selected && !selected.privateOwnerUserId)
                    options.push(option(selected.partyId, selected.organizationName || selected.partyId))
            }
            return options
        },
        containerTypes: () => enumOptions("ContainerType"),
        varianceReasons: () => enumOptions("InventoryVarianceReason"),
        assetStatuses: () =>
            Array.from(find("moqui.basic.StatusItem", {statusTypeId: "Asset"}).orderBy("sequenceNum").list()).map(row =>
                option(row.statusId, row.description || row.statusId)
            )
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown Warehouse inventory choice " + p.choice)
    return {options: sources[p.choice]()}
}
function enumOptions(enumTypeId) {
    return Array.from(find("moqui.basic.Enumeration", {enumTypeId}).orderBy("sequenceNum,description").list()).map(row => ({
        value: row.enumId,
        label: row.description || row.enumId
    }))
}

const operations = {
    findAssets,
    assetDetail,
    assetAudit,
    storeAssetMetadata,
    findMovements,
    trace,
    findLots,
    lotDetail,
    createLot,
    findContainers,
    containerDetail,
    createContainer,
    replenishment,
    productLocations,
    productReservations,
    choices
}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse inventory operation " + op)
        return operations[op](parameters)
    }
})
