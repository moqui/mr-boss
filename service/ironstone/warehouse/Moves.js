// The Warehouse Move task's reads (impl-warehouse P5, design-warehouse §8 Move and §13 Handheld): the stock a mover chooses
// from (MoveSelect and MoveContents) in one of their facilities, the asset they move (MoveConfirm's before summary), a
// production run's staging context, and their recent moves with each operation's stored answer (RecentMoves). Every read
// is limited to the user's Warehouse facilities in the query; the moves themselves are Mantle's guarded
// WarehouseTaskServices entry points, which the screens call after AccessServices.check#Record.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, denied, dateText, calendarDateText} = lib

const contentLimit = 200
const recentLimit = 20
// the operation types of the move tasks on the CX-POSTING record (StockPosting.js)
const moveTypes = {StockMove: "Move", ContainerMove: "Container move", StockAttach: "Put in container", StockDetach: "Taken out"}
const stockTypes = ["AstTpInventory", "AstTpSupplies"]
const statusColors = {AstAvailable: "positive", AstOnHold: "warning", AstQuarantine: "negative", AstMorgue: "grey-8"}
const number = value => (value == null || value === "" ? null : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
function checkRecord(recordType, recordId, extra = {}) {
    return warehouse.execute("checkRecord", Object.assign({recordType, recordId}, extra))
}
function todayText() {
    return ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
}

// The facility of the task: the one given (refused outside the scope) or the user's selected one.
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}

// A production run's staging context (Manufacturing's Stage action opens Move with it): the run and the products it consumes.
function runOf(userScope, workEffortId) {
    if (!workEffortId) return null
    const run = one("mantle.work.effort.WorkEffort", {workEffortId})
    const facility = run?.facilityId ? one("mantle.facility.Facility", {facilityId: run.facilityId}) : null
    if (!run || !warehouse.inScope(userScope, facility))
        denied("RECORD_UNAVAILABLE", "Production run " + workEffortId + " is not available")
    const productIds = Array.from(
        find("mantle.work.effort.WorkEffortProduct", {workEffortId, typeEnumId: "WeptConsume"}).selectField("productId").list()
    ).map(row => row.productId)
    return {workEffortId, label: run.workEffortName || workEffortId, facilityId: run.facilityId, productIds}
}

function contentRows(rows) {
    const owners = lib.partyNames(rows.map(row => row.ownerPartyId))
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        rows.map(row => row.statusId)
    )
    const today = todayText()
    return rows.map(row => {
        const onHand = number(row.quantityOnHandTotal) || 0
        const available = number(row.availableToPromiseTotal) || 0
        const expiry = row.expirationDate ? calendarDateText(row.expirationDate) : null
        return {
            assetId: row.assetId,
            productId: row.productId,
            productName: row.productName || row.productId || "",
            identityText: [row.serialNumber ? "Serial " + row.serialNumber : "", row.lotNumber ? "Lot " + row.lotNumber : ""]
                .filter(Boolean)
                .join(" · "),
            ownerName: owners[row.ownerPartyId] || row.ownerPartyId || "",
            statusId: row.statusId,
            statusText: statuses.get(row.statusId) || row.statusId || "",
            statusColor: statusColors[row.statusId] || "grey",
            held: row.statusId === "AstQuarantine",
            facilityId: row.facilityId,
            locationSeqId: row.locationSeqId || "",
            containerId: row.containerId || null,
            placeText: [row.locationSeqId, row.containerId ? "in " + row.containerId : ""].filter(Boolean).join(" "),
            quantityOnHand: onHand,
            reserved: Math.max(0, onHand - available),
            availableToPromise: available,
            expiryText: expiry ? (expiry < today ? "Expired " : "Expires ") + expiry : ""
        }
    })
}

// MoveSelect, MoveContents and MoveConfirm's before summary.
function moveContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const run = runOf(userScope, p.workEffortId)
    const facility = facilityOf(userScope, p.facilityId || run?.facilityId)
    const answer = {
        canMove: !!userScope.capabilities.move,
        facilityId: facility?.facilityId || null,
        facilityName: facility ? facility.facilityName || facility.facilityId : "",
        run,
        contentRows: [],
        contentTruncated: false,
        selectedAsset: null,
        selectionText: ""
    }
    if (!facility) return answer
    let query = find("mantle.product.asset.AssetFindView", {facilityId: facility.facilityId})
        .condition("quantityOnHandTotal", "greater", 0)
        .condition(
            ec.entity.conditionFactory.makeCondition(
                [
                    ec.entity.conditionFactory.makeCondition("assetTypeEnumId", "in", stockTypes),
                    ec.entity.conditionFactory.makeCondition("assetTypeEnumId", "is-null", null)
                ],
                "or"
            )
        )
    const selection = []
    if (p.containerId) {
        checkRecord("container", p.containerId)
        query = query.condition("containerId", p.containerId)
        selection.push("container " + p.containerId)
    }
    if (p.locationSeqId) {
        checkRecord("location", p.locationSeqId, {facilityId: facility.facilityId})
        query = query.condition("locationSeqId", p.locationSeqId)
        selection.push("location " + p.locationSeqId)
    }
    if (p.productId) {
        query = query.condition("productId", p.productId)
        selection.push("product " + (one("mantle.product.Product", {productId: p.productId})?.productName || p.productId))
    } else if (run) query = query.condition("productId", "in", run.productIds.length ? run.productIds : ["_none_"])
    if (p.lotId) query = query.condition("lotId", p.lotId)
    // a scanned asset alone lists just that asset
    if (p.assetId && !selection.length && !run) query = query.condition("assetId", p.assetId)
    answer.selectionText = selection.join(", ")
    const selected = selection.length || run || p.assetId
    if (selected) {
        const found = Array.from(
            query
                .orderBy("productName,locationSeqId,assetId")
                .limit(contentLimit + 1)
                .list()
        )
        answer.contentTruncated = found.length > contentLimit
        answer.contentRows = contentRows(found.slice(0, contentLimit))
    }
    if (p.assetId) {
        const record = checkRecord("asset", p.assetId)
        if (record.facilityId !== facility.facilityId)
            denied("OTHER_FACILITY", "Asset " + p.assetId + " is in " + record.facilityName + "; choose that facility")
        const [row] = contentRows(Array.from(find("mantle.product.asset.AssetFindView", {assetId: p.assetId}).list()))
        answer.selectedAsset = row || null
    }
    return answer
}

// The user's latest moves in their facilities, each with the answer its operation stored.
function recentMoves() {
    const userScope = warehouse.required(warehouse.scope())
    // each operation's organization is the owner of the facility it moved stock in (StockPosting.js complete)
    let query = find("mantle.ledger.transaction.PostingOperation", {userId: ec.user.userId})
        .condition("operationType", "in", Object.keys(moveTypes))
        .orderBy("-completedDate")
        .limit(recentLimit)
    if (userScope.facilityOwnerIds) query = query.condition("organizationPartyId", "in", userScope.facilityOwnerIds)
    const answers = Array.from(query.list()).map(row => ({row, result: lib.json(row.resultJson, {})}))
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        answers.map(({result}) => result.productId)
    )
    return {
        recentRows: answers.map(({row, result}) => ({
            operationKey: result.operationKey,
            whenText: dateText(row.completedDate),
            kindText: moveTypes[row.operationType] || row.operationType,
            recordText: result.containerId && !result.assetId ? "Container " + result.containerId : result.assetId || "",
            productName: products.get(result.productId) || result.productId || "",
            fromText: result.fromLocationSeqId || result.locationSeqId || "",
            toText: [result.toLocationSeqId || result.locationSeqId, result.toContainerId || result.containerId]
                .filter(Boolean)
                .join(" in "),
            quantityText:
                result.quantity != null ? String(result.quantity) : result.assets ? result.assets.length + " assets" : "",
            resultText: [result.resultCode, ...(result.warnings || []).map(warning => warning.message)]
                .filter(Boolean)
                .join(" · ")
        }))
    }
}

const operations = {moveContext, recentMoves}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse move operation " + op)
        return operations[op](parameters)
    }
})
