// Warehouse adjustments, scrap, lot corrections and repack (impl-warehouse P6; design-warehouse §6 Adjustments and Lots, §8
// Repack): Adjustments previews a count of an asset with its before and after (its value only with financial read) and
// posts it once through its transition; a backdated adjustment into the demo's closed month is refused; Scrap moves an
// expired lot's stock to the morgue, posts once to the scrap account the demo maps on ORG_ZIZI_CORP and is not a count;
// the quality manager extends a lot's expiry and the correction is listed with its reason, while the adjuster may not
// extend it; unpacking 2 cases into 24 units carries the lot and the unit cost and nets to zero; AssetDetail, Movements and
// the Lots expiry list open these tasks. The Mantle rules themselves are mr-mantle's WarehouseAdjustments spec. Fixture
// stock of BOSS_WH_P6_ITEM and its case in ZIRET_WH, made on the fresh database moqui test gives; the stock
// ledger is immutable, so the stock stays under its own product, and only the fixture lot's corrections remain.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {asUser, invoke, page} = lib
const productId = "BOSS_WH_P6_ITEM"
const lotId = "BOSS_WH_P6_LOT"
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const n = value => (value == null ? 0 : Number(String(value)))
const calendar = value => ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js").calendarDateText(value)
let keySeq = 0
const key = () => "p6-spec-" + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS") + "-" + ++keySeq

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
function create(entity, parameters) {
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(parameters)
        .call()
}
function asset(assetId, product, locationSeqId, quantity, extra = {}) {
    create(
        "mantle.product.asset.Asset",
        Object.assign(
            {
                assetId,
                assetTypeEnumId: "AstTpInventory",
                statusId: "AstAvailable",
                productId: product,
                facilityId: "ZIRET_WH",
                locationSeqId,
                ownerPartyId: "ORG_ZIZI_RETAIL",
                hasQuantity: "Y",
                quantityOnHandTotal: 0,
                availableToPromiseTotal: 0,
                acquireCostUomId: "USD",
                receivedDate: "2026-09-01 00:00:00"
            },
            extra
        )
    )
    create("mantle.product.asset.AssetDetail", {
        assetId,
        productId: product,
        effectiveDate: "2026-09-01 00:00:00",
        quantityOnHandDiff: quantity,
        availableToPromiseDiff: quantity
    })
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}
const qoh = assetId => n(one("mantle.product.asset.Asset", {assetId}).quantityOnHandTotal)
function net(acctgTransIds, glAccountId) {
    return acctgTransIds
        .flatMap(acctgTransId => rows("mantle.ledger.transaction.AcctgTransEntry", {acctgTransId, glAccountId}))
        .reduce((sum, row) => sum + (row.debitCreditFlag === "D" ? 1 : -1) * n(row.amount), 0)
}

spec({
    setupSpec() {
        withAuthzOff(() => {
            create("mantle.product.Product", {
                productId,
                productName: "Warehouse P6 fixture",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                assetClassEnumId: "AsClsInventoryFin",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                amountUomId: "OTH_ea"
            })
            // a case of 12 of the fixture product, so the repack changes no demo product's stock
            create("mantle.product.Product", {
                productId: "BOSS_WH_P6_CASE",
                productName: "Warehouse P6 fixture, case of 12",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                assetClassEnumId: "AsClsInventoryFin",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                amountUomId: "OTH_ea"
            })
            create("mantle.product.ProductAssoc", {
                productId: "BOSS_WH_P6_CASE",
                toProductId: productId,
                productAssocTypeEnumId: "PatPackagingFor",
                fromDate: "2026-01-01 00:00:00",
                quantity: 12
            })
            // and a pallet of two cases, so a unit's targets reach through two levels
            create("mantle.product.Product", {
                productId: "BOSS_WH_P6_PALLET",
                productName: "Warehouse P6 fixture, pallet of 2 cases",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                amountUomId: "OTH_ea"
            })
            create("mantle.product.ProductAssoc", {
                productId: "BOSS_WH_P6_PALLET",
                toProductId: "BOSS_WH_P6_CASE",
                productAssocTypeEnumId: "PatPackagingFor",
                fromDate: "2026-01-01 00:00:00",
                quantity: 2
            })
            create("mantle.product.asset.Lot", {lotId, lotNumber: "P6-LOT", expirationDate: "2027-03-31"})
            create("mantle.product.asset.Lot", {lotId: "BOSS_WH_P6_PACK", lotNumber: "P6-PACK", expirationDate: "2027-06-30"})
            asset("BOSS_WH_P6_A", productId, "01020302", 10, {acquireCost: 4, classEnumId: "AsClsInventoryFin"})
            asset("BOSS_WH_P6_DATED", productId, "01020302", 6, {acquireCost: 4, classEnumId: "AsClsInventoryFin"})
            asset("BOSS_WH_P6_OLD", productId, "01020402", 3, {
                acquireCost: 11.75,
                classEnumId: "AsClsInventoryFin",
                lotId: "BOSS_WH_LOT_B"
            })
            asset("BOSS_WH_P6_FIX", productId, "01020402", 2, {
                acquireCost: 4,
                classEnumId: "AsClsInventoryFin",
                lotId,
                expectedEndOfLife: "2027-03-31"
            })
            asset("BOSS_WH_P6_CASES", "BOSS_WH_P6_CASE", "01020202", 3, {
                acquireCost: 120,
                classEnumId: "AsClsInventoryFin",
                lotId: "BOSS_WH_P6_PACK"
            })
        })
    }
})

feature("Adjustments previews a count of an asset, with its value only for financial read, and AssetDetail opens it", {
    when() {
        const parameters = {assetId: "BOSS_WH_P6_A", mode: "count", quantity: 7}
        return {
            adjuster: asUser("warehouse.adjust", () => page("Inventory/Adjustments", parameters, "html")),
            finance: page("Inventory/Adjustments", parameters, "html"),
            reader: asUser("warehouse.read", () => page("Inventory/Adjustments", parameters, "html")),
            detail: asUser("warehouse.adjust", () => page("Inventory/AssetDetail", {assetId: "BOSS_WH_P6_A"}, "html")),
            readerDetail: asUser("warehouse.read", () => page("Inventory/AssetDetail", {assetId: "BOSS_WH_P6_A"}, "html")),
            movements: asUser("warehouse.adjust", () => page("Inventory/Movements", {productId}, "html"))
        }
    },
    then({adjuster, finance, reader, detail, readerDetail, movements}) {
        adjuster.errors == []
        adjuster.output.includes("Adjust this asset")
        adjuster.output.includes("10 on hand, change -3, after 7")
        adjuster.output.includes("Post adjustment")
        adjuster.output.includes("Scrap")
        !adjuster.output.includes("Value change")
        finance.output.includes("Value change")
        reader.output.includes("needs the adjust permission")
        !reader.output.includes("Post adjustment")
        detail.output.includes("Record adjustment")
        !readerDetail.output.includes("Record adjustment")
        movements.output.includes("originalMovement=")
    }
})

feature("an adjuster posts the previewed count once, and a retry of the same operation posts nothing more", {
    when() {
        const scope = {assetId: "BOSS_WH_P6_A", mode: "count", quantity: 7}
        const preview = asUser("warehouse.adjust", () =>
            invoke("ironstone.warehouse.AdjustmentServices.get#AdjustmentContext", scope)
        )
        const parameters = Object.assign({}, scope, {
            facilityId: "ZIRET_WH",
            operationKey: key(),
            previewFingerprint: preview.preview?.previewFingerprint,
            varianceReasonEnumId: "InVrLost",
            comments: "P6 count"
        })
        const first = asUser("warehouse.adjust", () => post("Inventory/Adjustments/adjustStock", parameters))
        const retry = asUser("warehouse.adjust", () => post("Inventory/Adjustments/adjustStock", parameters))
        const stale = asUser("warehouse.adjust", () =>
            post("Inventory/Adjustments/adjustStock", Object.assign({}, parameters, {operationKey: key()}))
        )
        return {preview, first, retry, stale, inventories: rows("mantle.product.asset.AssetDetail", {assetId: "BOSS_WH_P6_A"})}
    },
    then({preview, first, retry, stale, inventories}) {
        preview.previewError == ""
        first == ""
        retry == ""
        // the same preview again, after the posting moved the stock, is stale
        stale.includes("PREVIEW_CHANGED")
        qoh("BOSS_WH_P6_A") == 7
        inventories.filter(row => row.physicalInventoryId).length == 1
    }
})

feature("a backdated adjustment into a closed period is refused", {
    when() {
        const scope = {assetId: "BOSS_WH_P6_DATED", mode: "count", quantity: 5, physicalInventoryDate: "2024-06-15 12:00"}
        const preview = asUser("warehouse.adjust", () =>
            invoke("ironstone.warehouse.AdjustmentServices.get#AdjustmentContext", scope)
        )
        const refused = asUser("warehouse.adjust", () =>
            post(
                "Inventory/Adjustments/adjustStock",
                Object.assign({}, scope, {
                    facilityId: "ZIRET_WH",
                    operationKey: key(),
                    previewFingerprint: preview.preview?.previewFingerprint,
                    varianceReasonEnumId: "InVrFound"
                })
            )
        )
        return {preview, refused}
    },
    then({preview, refused}) {
        preview.previewError == "" && preview.preview.quantityBefore == "0"
        refused.includes("PERIOD_CLOSED")
        qoh("BOSS_WH_P6_DATED") == 6
    }
})

feature("a scrapped expired lot moves to the morgue, posts once to the demo's scrap account and is not a count", {
    when() {
        const parameters = {
            assetId: "BOSS_WH_P6_OLD",
            operationKey: key(),
            scrapQuantity: 3,
            varianceReasonEnumId: "InVrExpired",
            toLocationSeqId: "0991",
            comments: "Expired lot"
        }
        const lots = asUser("warehouse.adjust", () => page("Inventory/Lots", {lotId: "BOSS_WH_LOT_B"}, "html"))
        const first = asUser("warehouse.adjust", () => post("Inventory/Adjustments/scrapAsset", parameters))
        const retry = asUser("warehouse.adjust", () => post("Inventory/Adjustments/scrapAsset", parameters))
        const inventory = rows("mantle.product.asset.PhysicalInventory", {comments: "Expired lot"})[0]
        const trans = inventory
            ? rows("mantle.ledger.transaction.AcctgTrans", {physicalInventoryId: inventory.physicalInventoryId})
            : []
        const count = id =>
            asUser("warehouse.adjust", () =>
                lib.refusal("ironstone.warehouse.AccessServices.check#Record", {recordType: "count", recordId: id})
            )
        return {
            lots,
            first,
            retry,
            inventory,
            trans,
            scrapCount: count(inventory?.physicalInventoryId),
            demoCount: count("BOSS_WH_COUNT")
        }
    },
    then({lots, first, retry, inventory, trans, scrapCount, demoCount}) {
        lots.output.includes("_openDialog=ScrapDialog")
        first == ""
        retry == ""
        qoh("BOSS_WH_P6_OLD") == 0
        one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P6_OLD"}).locationSeqId == "0991"
        inventory.scrapIndicator == "Y"
        trans.length == 1
        net([trans[0].acctgTransId], "519200000") == 35.25
        scrapCount.includes("RECORD_UNAVAILABLE")
        demoCount == ""
    }
})

feature("the quality manager extends a lot's expiry with a reason, the adjuster may not, and the correction is listed", {
    when() {
        const parameters = {lotId, operationKey: key(), expirationDate: "2027-09-30", changeReason: "Stability retest"}
        const adjuster = asUser("warehouse.adjust", () => post("Inventory/Lots/correctLot", parameters))
        const quality = asUser("warehouse.quality", () =>
            post("Inventory/Lots/correctLot", Object.assign({}, parameters, {operationKey: key()}))
        )
        const lots = asUser("warehouse.read", () => page("Inventory/Lots", {lotId}, "html"))
        return {adjuster, quality, lots}
    },
    then({adjuster, quality, lots}) {
        adjuster.includes("PERMISSION_DENIED")
        quality == ""
        calendar(one("mantle.product.asset.Lot", {lotId}).expirationDate) == "2027-09-30"
        calendar(one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P6_FIX"}).expectedEndOfLife) == "2027-09-30"
        lots.output.includes("Corrections")
        lots.output.includes("Stability retest")
        !lots.output.includes("Correct lot")
    }
})

feature("unpacking 2 cases into 24 units carries the lot and the unit cost and nets to zero, once", {
    when() {
        const preview = asUser("warehouse.move", () =>
            page("Transfers/Repack", {assetId: "BOSS_WH_P6_CASES", quantity: 2}, "html")
        )
        const parameters = {assetId: "BOSS_WH_P6_CASES", quantity: 2, operationKey: key(), toLocationSeqId: "01020302"}
        const first = asUser("warehouse.move", () => post("Transfers/Repack/repackStock", parameters))
        const retry = asUser("warehouse.move", () => post("Transfers/Repack/repackStock", parameters))
        const receipts = rows("mantle.product.receipt.AssetReceipt", {productId}).filter(row => row.sourceAssetIssuanceId)
        const issuance = receipts[0]
            ? one("mantle.product.issuance.AssetIssuance", {assetIssuanceId: receipts[0].sourceAssetIssuanceId})
            : null
        const units = receipts[0] ? one("mantle.product.asset.Asset", {assetId: receipts[0].assetId}) : null
        const trans = receipts.length
            ? [
                  ...rows("mantle.ledger.transaction.AcctgTrans", {assetReceiptId: receipts[0].assetReceiptId}),
                  ...rows("mantle.ledger.transaction.AcctgTrans", {assetIssuanceId: issuance.assetIssuanceId})
              ].map(row => row.acctgTransId)
            : []
        return {preview, first, retry, receipts, issuance, units, trans}
    },
    then({preview, first, retry, receipts, issuance, units, trans}) {
        preview.errors == []
        preview.output.includes("Unpack 2")
        preview.output.includes("into 24")
        first == ""
        retry == ""
        receipts.length == 1
        issuance.assetId == "BOSS_WH_P6_CASES" && n(issuance.quantity) == 2
        qoh("BOSS_WH_P6_CASES") == 1
        n(units.quantityOnHandTotal) == 24 && units.lotId == "BOSS_WH_P6_PACK" && n(units.acquireCost) == 10
        trans.length == 2
        net(trans, "141200000") == 0
    }
})

feature("Repack offers the packs of every level by the repack's resolver, and Adjustments offers no scrap reason", {
    when() {
        return asUser("warehouse.adjust", () => ({
            repack: invoke("ironstone.warehouse.AdjustmentServices.get#RepackContext", {assetId: "BOSS_WH_P6_A"}),
            adjust: invoke("ironstone.warehouse.AdjustmentServices.get#AdjustmentContext", {assetId: "BOSS_WH_P6_A"})
        }))
    },
    then({repack, adjust}) {
        repack.targetOptions.some(option => option.value == "BOSS_WH_P6_CASE" && option.label.includes("(12 each)"))
        repack.targetOptions.some(option => option.value == "BOSS_WH_P6_PALLET" && option.label.includes("(24 each)"))
        adjust.adjustReasons.some(option => option.value == "InVrLost")
        !adjust.adjustReasons.some(option => ["InVrScrap", "InVrExpired"].includes(option.value))
    }
})
