// The Warehouse adjustment, scrap, lot correction and repack screens' reads (impl-warehouse P6, design-warehouse §6
// Adjustments and Lots, §8 Repack): the stock an adjuster or mover works on in one of their facilities, the before and
// after of an adjustment or a repack (Mantle's preview#StockAdjustment and preview#Repack, shaped for the screen with names
// and texts, and a refusal shown as the preview's message), the scrap reasons and morgue locations, a lot's corrections and
// the user's recent stock changes. The postings are Mantle's guarded WarehouseTaskServices entry points, which the screens
// call after AccessServices.check#Record. Value is answered only with financial read, as Mantle leaves it out otherwise.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, denied, dateText, calendarDateText} = lib

const T = "mantle.shipment.WarehouseTaskServices."
const recentLimit = 20
const sourceLimit = 100
const stockTypes = ["AstTpInventory", "AstTpSupplies"]
// the operation types of these tasks on the CX-POSTING record, by what the user calls them
const changeTypes = {StockAdjust: "Adjustment", StockScrap: "Scrap", LotCorrect: "Lot correction", StockRepack: "Repack"}
const fieldLabels = {
    lotNumber: "Lot number",
    mfgPartyId: "Manufacturer",
    manufacturedDate: "Manufactured",
    expirationDate: "Expires"
}
const number = value => (value == null || value === "" ? null : Number(String(value)))
const blank = value => value == null || String(value).trim() === ""
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
function checkRecord(recordType, recordId, extra = {}) {
    return warehouse.execute("checkRecord", Object.assign({recordType, recordId}, extra))
}
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
// A Mantle preview run as a probe: its answer, or the refusal's message for the screen (nothing is posted).
function previewOf(service, parameters) {
    ec.message.pushErrors()
    try {
        // the Mantle preview checks its own permission and organization (the screen checked the record first)
        const out = ec.service.sync().name(service).parameters(parameters).disableAuthz().requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) return {preview: null, previewError: ec.message.getErrorsString()}
        return {preview: out.preview || null, previewError: ""}
    } catch (error) {
        return {preview: null, previewError: String(error.message || error).replace(/^(Error: )+/, "")}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
const quantityText = value => (value == null ? "" : ec.l10n.format(number(value), "#,##0.###"))
function moneyText(value, currencyUomId) {
    if (value == null) return ""
    return currencyUomId ? ec.l10n.formatCurrency(number(value), currencyUomId) : ec.l10n.format(number(value), "#,##0.00")
}
// One asset's summary: product, lot or serial, place, status, on hand, reserved, what is free and its expiry.
function assetRow(assetId) {
    const row = find("mantle.product.asset.AssetFindView", {assetId}).one()
    if (!row) return null
    const status = row.statusId ? one("moqui.basic.StatusItem", {statusId: row.statusId}) : null
    const reservations = Array.from(find("mantle.product.issuance.AssetReservation", {assetId}).list())
    const reserved = reservations.reduce(
        (sum, reservation) =>
            sum +
            (number(reservation.quantityNotIssued ?? reservation.quantity) || 0) -
            (number(reservation.quantityNotAvailable) || 0),
        0
    )
    const onHand = number(row.quantityOnHandTotal) || 0
    const expiry = row.expirationDate ? calendarDateText(row.expirationDate) : null
    const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    return {
        assetId: row.assetId,
        productId: row.productId,
        productName: row.productName || row.productId || "",
        facilityId: row.facilityId,
        locationSeqId: row.locationSeqId || null,
        lotId: row.lotId || null,
        lotNumber: row.lotNumber || null,
        identityText: [row.serialNumber ? "Serial " + row.serialNumber : "", row.lotNumber ? "Lot " + row.lotNumber : ""]
            .filter(Boolean)
            .join(" · "),
        placeText: row.locationSeqId || "no location",
        statusId: row.statusId,
        statusText: status?.description || row.statusId || "",
        held: row.statusId === "AstQuarantine",
        equipment: !!row.assetTypeEnumId && !stockTypes.includes(row.assetTypeEnumId),
        quantityOnHand: onHand,
        availableToPromise: number(row.availableToPromiseTotal) || 0,
        reserved: Math.max(0, reserved),
        free: Math.max(0, onHand - Math.max(0, reserved)),
        expired: !!expiry && expiry < today,
        expiryText: expiry ? (expiry < today ? "Expired " : "Expires ") + expiry : ""
    }
}
// The user's own latest adjustments, scraps, lot corrections and repacks in their facilities' organizations.
function recentChanges(types) {
    const userScope = warehouse.required(warehouse.scope())
    let query = find("mantle.ledger.transaction.PostingOperation", {userId: ec.user.userId})
        .condition("operationType", "in", types)
        .orderBy("-completedDate")
        .limit(recentLimit)
    if (userScope.facilityOwnerIds)
        query = query.condition(
            ec.entity.conditionFactory.makeCondition(
                [
                    ec.entity.conditionFactory.makeCondition("organizationPartyId", "in", userScope.facilityOwnerIds),
                    ec.entity.conditionFactory.makeCondition("organizationPartyId", "is-null", null)
                ],
                "or"
            )
        )
    const answers = Array.from(query.list()).map(row => ({row, result: lib.json(row.resultJson, {})}))
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        answers.flatMap(({result}) => [result.productId, result.sourceProductId, result.targetProductId])
    )
    const name = id => products.get(id) || id || ""
    return answers.map(({row, result}) => ({
        whenText: dateText(row.completedDate),
        kindText: changeTypes[row.operationType] || row.operationType,
        recordText:
            row.operationType === "LotCorrect"
                ? "Lot " + result.lotId
                : row.operationType === "StockRepack"
                  ? quantityText(result.quantity) +
                    " " +
                    name(result.sourceProductId) +
                    " → " +
                    quantityText(result.targetQuantity) +
                    " " +
                    name(result.targetProductId)
                  : [result.assetId, name(result.productId)].filter(Boolean).join(" · "),
        changeText:
            row.operationType === "StockAdjust"
                ? quantityText(result.quantityBefore) + " → " + quantityText(result.quantityAfter)
                : row.operationType === "StockScrap"
                  ? "−" + quantityText(result.quantity)
                  : row.operationType === "LotCorrect"
                    ? (result.changes || []).map(change => fieldLabels[change.field] || change.field).join(", ")
                    : "",
        resultText: [result.resultCode, ...(result.warnings || []).map(warning => warning.message)].filter(Boolean).join(" · ")
    }))
}

// Adjustments: the facility, the fixed asset (from AssetDetail, Movements' Correct, Move or the Lots expiry list), the
// scrap reasons and morgue locations, and the preview of the adjustment when its quantity is given.
function adjustmentContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const asset = p.assetId ? (checkRecord("asset", p.assetId), assetRow(p.assetId)) : null
    const facility = facilityOf(userScope, asset?.facilityId || p.facilityId)
    const answer = {
        canAdjust: !!userScope.capabilities.adjust,
        financialRead: !!userScope.capabilities.financialRead,
        facilityId: facility?.facilityId || null,
        facilityName: facility ? facility.facilityName || facility.facilityId : "",
        asset,
        morgueLocations: [],
        scrapReasons: Array.from(
            find("moqui.basic.Enumeration", {enumTypeId: "InventoryVarianceReason"}).orderBy("sequenceNum,description").list()
        )
            .filter(row => row.enumCode === "scrap" || row.enumId === "InVrDamaged")
            .map(row => ({value: row.enumId, label: row.description || row.enumId})),
        originalMovement: null,
        preview: null,
        previewError: "",
        summaryText: "",
        valueText: "",
        recentRows: recentChanges(["StockAdjust", "StockScrap", "LotCorrect"])
    }
    if (!facility) return answer
    answer.morgueLocations = Array.from(
        find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId, locationTypeEnumId: "FltMorgue"})
            .condition("thruDate", "is-null", null)
            .orderBy("locationSeqId")
            .list()
    ).map(row => ({value: row.locationSeqId, label: [row.locationSeqId, row.description].filter(Boolean).join(" · ")}))
    // Correct from Movements: the movement being corrected, shown with the adjustment
    if (p.originalMovement && asset) {
        const detail = one("mantle.product.asset.AssetDetail", {assetDetailId: p.originalMovement})
        if (detail && detail.assetId === asset.assetId)
            answer.originalMovement = {
                assetDetailId: detail.assetDetailId,
                text:
                    "Correcting the movement of " +
                    dateText(detail.effectiveDate) +
                    " (" +
                    quantityText(detail.quantityOnHandDiff) +
                    ")"
            }
    }
    if (!answer.canAdjust || blank(p.quantity) || (!asset && blank(p.productId))) return answer
    const parameters = {
        assetId: asset?.assetId || null,
        productId: asset ? null : p.productId,
        facilityId: facility.facilityId,
        locationSeqId: p.locationSeqId || null,
        locationScope: p.locationScope || null,
        lotId: p.lotId || null,
        lotScope: p.lotScope || null,
        statusId: p.statusId || null,
        mode: p.mode || "count",
        quantity: p.quantity,
        physicalInventoryDate: p.physicalInventoryDate || null
    }
    Object.assign(answer, previewOf(T + "preview#StockAdjustment", parameters))
    const preview = answer.preview
    if (preview) {
        const product = one("mantle.product.Product", {productId: preview.productId})
        const lot = preview.lotId ? one("mantle.product.asset.Lot", {lotId: preview.lotId}) : null
        const scopeText = [
            product?.productName || preview.productId,
            preview.assetId ? "asset " + preview.assetId : "",
            preview.locationScope === "value"
                ? "location " + preview.locationSeqId
                : preview.locationScope === "any"
                  ? "any location"
                  : "no location",
            preview.lotScope === "value"
                ? "lot " + (lot?.lotNumber || preview.lotId)
                : preview.lotScope === "any"
                  ? "any lot"
                  : "no lot"
        ]
        answer.summaryText =
            scopeText.filter(Boolean).join(" · ") +
            ": " +
            quantityText(preview.quantityBefore) +
            " on hand" +
            (preview.physicalInventoryDate && p.physicalInventoryDate ? " on " + dateText(preview.physicalInventoryDate) : "") +
            ", change " +
            (number(preview.quantityChange) > 0 ? "+" : "") +
            quantityText(preview.quantityChange) +
            ", after " +
            quantityText(preview.quantityAfter)
        if (preview.valueIncluded)
            answer.valueText = preview.valueAvailable
                ? "Value change " + moneyText(preview.valueChange, preview.costUomId)
                : "Value unavailable: stock this changes has no cost"
        preview.assetRows = Array.from(preview.assets || []).map(row =>
            Object.assign({}, row, {quantityOnHandText: quantityText(row.quantityOnHand)})
        )
    }
    return answer
}

// Repack: the facility, the source stock of a product (or a scanned asset), the selected asset with what it can become
// (unpacked into its contents, or repacked into a pack of it, by Products' packaging), and the repack's preview.
function repackContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const asset = p.assetId ? (checkRecord("asset", p.assetId), assetRow(p.assetId)) : null
    const facility = facilityOf(userScope, asset?.facilityId || p.facilityId)
    const productId = asset?.productId || p.productId || null
    const answer = {
        canMove: !!userScope.capabilities.move,
        financialRead: !!userScope.capabilities.financialRead,
        facilityId: facility?.facilityId || null,
        facilityName: facility ? facility.facilityName || facility.facilityId : "",
        productId,
        productName: productId ? one("mantle.product.Product", {productId})?.productName || productId : "",
        sourceRows: [],
        asset,
        targetOptions: [],
        preview: null,
        previewError: "",
        previewText: "",
        costText: "",
        recentRows: recentChanges(["StockRepack"])
    }
    if (!facility || !productId) return answer
    answer.sourceRows = Array.from(
        find("mantle.product.asset.AssetFindView", {facilityId: facility.facilityId, productId})
            .condition("quantityOnHandTotal", "greater", 0)
            .orderBy("locationSeqId,assetId")
            .limit(sourceLimit)
            .list()
    ).map(row => assetRow(row.assetId))
    if (!asset) return answer
    // what the asset's product can become: its contents (it is a pack) or a pack of it, as Products defines them
    const now = ec.user.nowTimestamp
    const active = row => lib.active(row, now)
    const packs = Array.from(
        find("mantle.product.ProductAssoc", {productAssocTypeEnumId: "PatPackagingFor"})
            .condition(
                ec.entity.conditionFactory.makeCondition(
                    [
                        ec.entity.conditionFactory.makeCondition("productId", "equals", productId),
                        ec.entity.conditionFactory.makeCondition("toProductId", "equals", productId)
                    ],
                    "or"
                )
            )
            .list()
    ).filter(active)
    const names = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        packs.flatMap(row => [row.productId, row.toProductId])
    )
    answer.targetOptions = packs.map(row =>
        row.productId === productId
            ? {
                  value: row.toProductId,
                  label:
                      "Unpack into " +
                      (names.get(row.toProductId) || row.toProductId) +
                      " (" +
                      quantityText(row.quantity) +
                      " each)"
              }
            : {
                  value: row.productId,
                  label:
                      "Repack into " + (names.get(row.productId) || row.productId) + " (" + quantityText(row.quantity) + " each)"
              }
    )
    if (!answer.canMove || blank(p.quantity)) return answer
    const targetProductId = p.targetProductId || (answer.targetOptions.length === 1 ? answer.targetOptions[0].value : null)
    Object.assign(answer, previewOf(T + "preview#Repack", {assetId: asset.assetId, quantity: p.quantity, targetProductId}))
    const preview = answer.preview
    if (preview) {
        const target = one("mantle.product.Product", {productId: preview.targetProductId})
        answer.previewText =
            (preview.direction === "unpack" ? "Unpack " : "Repack ") +
            quantityText(preview.quantity) +
            " " +
            answer.productName +
            " into " +
            quantityText(preview.targetQuantity) +
            " " +
            (target?.productName || preview.targetProductId) +
            (asset.lotNumber ? ", lot " + asset.lotNumber + " carried over" : "")
        if (preview.costIncluded && preview.unitCost != null)
            answer.costText =
                "Unit cost " +
                moneyText(preview.sourceUnitCost, preview.costUomId) +
                " → " +
                moneyText(preview.unitCost, preview.costUomId) +
                "; " +
                moneyText(preview.issuedCost, preview.costUomId) +
                " in and out, netting to zero"
    }
    return answer
}

// A lot's corrections (LotMetadata history): each audit-logged change of its metadata, newest first, with the old and new
// values, the reason and who made it.
function lotCorrections(p) {
    checkRecord("lot", p.lotId)
    const rows = Array.from(
        find("moqui.entity.EntityAuditLog", {changedEntityName: "mantle.product.asset.Lot", pkPrimaryValue: p.lotId})
            .orderBy("-changedDate")
            .limit(50)
            .list()
    )
    const users = namesOf(
        "moqui.security.UserAccount",
        "userId",
        "userFullName",
        rows.map(row => row.changedByUserId)
    )
    return {
        correctionRows: rows.map(row => ({
            changedDateText: dateText(row.changedDate),
            fieldText: fieldLabels[row.changedFieldName] || row.changedFieldName,
            oldValueText: row.oldValueText || "—",
            newValueText: row.newValueText || "—",
            changeReason: row.changeReason || "",
            userText: users.get(row.changedByUserId) || row.changedByUserId || ""
        }))
    }
}

const operations = {adjustmentContext, repackContext, lotCorrections}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse adjustment operation " + op)
        return operations[op](parameters)
    }
})
