// Warehouse putaway (impl-warehouse P9; design-warehouse §4 Putaway, §12 PutawayRules, §13 HandheldPutaway): Putaway's
// queue holds the stock waiting in receiving with its suggested destination, the chosen stock explains why its default
// bin is refused for capacity and suggests the rule's bin, the putawayStock transition puts it there (the asset checked with
// the move capability, then Mantle's guarded putaway#Stock) and releases the receiving hold, another bin needs a reason,
// stock no bin fits stays with the reason named, PutawayRules lists and tests the rules and a facility admin adds one
// (check#Record with facilityEdit, then store#PutawayRule), Home counts the queue, and the sheet prints it. The Mantle
// rules themselves are mr-mantle's WarehousePutaway spec. Fixture stock of BOSS_WH_P9_ITEM in ZIRET_WH (its own product and
// rule, so the demo's sealant stays for the walk); the stock ledger is immutable, so the stock stays under its product and
// the fixture rules are ended after.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {asUser, invoke, page} = lib
const productId = "BOSS_WH_P9_ITEM"
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
// a two-step receipt at the east warehouse (receiving at E0801), for the end-to-end feature
const eastPolicy = {
    organizationPartyId: "ORG_ZIZI_RETAIL",
    policyType: "operation",
    facilityId: "BOSS_WH_EAST",
    productId: "_NA_",
    fromDate: "2026-01-01 00:00:00"
}
let keySeq = 0
const key = () => "p9-spec-" + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS") + "-" + ++keySeq

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
function asset(assetId, locationSeqId, quantity, statusId = "AstOnHold") {
    ec.service
        .sync()
        .name("create#mantle.product.asset.Asset")
        .parameters({
            assetId,
            assetTypeEnumId: "AstTpInventory",
            statusId,
            productId,
            facilityId: "ZIRET_WH",
            locationSeqId,
            ownerPartyId: "ORG_ZIZI_RETAIL",
            hasQuantity: "Y",
            quantityOnHandTotal: 0,
            availableToPromiseTotal: 0,
            receivedDate: "2026-09-01 00:00:00"
        })
        .call()
    ec.service
        .sync()
        .name("create#mantle.product.asset.AssetDetail")
        .parameters({assetId, productId, effectiveDate: "2026-09-01 00:00:00", quantityOnHandDiff: quantity})
        .call()
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}
// the fixture's rules end, so the demo's rules stay as they were for later specs
function endFixtureRules() {
    withAuthzOff(() => {
        for (const rule of Array.from(
            ec.entity.find("mantle.facility.PutawayRule").condition({productId}).condition("thruDate", "is-null", null).list()
        ))
            ec.service
                .sync()
                .name("update#mantle.facility.PutawayRule")
                .parameters({putawayRuleId: rule.putawayRuleId, thruDate: ec.user.nowTimestamp})
                .call()
    })
}

spec({
    setupSpec() {
        withAuthzOff(() => {
            ec.service
                .sync()
                .name("create#mantle.product.Product")
                .parameters({
                    productId,
                    productName: "P9 putaway fixture",
                    productTypeEnumId: "PtAsset",
                    assetTypeEnumId: "AstTpInventory",
                    ownerPartyId: "ORG_ZIZI_RETAIL",
                    amountUomId: "OTH_ea"
                })
                .call()
            // its default is the pick bin 01010401, with room for 5; its rule sends it to the bulk bay 01010402
            ec.service
                .sync()
                .name("update#mantle.facility.FacilityLocation")
                .parameters({facilityId: "ZIRET_WH", locationSeqId: "01010401", capacity: 5, capacityUomId: "OTH_ea"})
                .call()
            ec.service
                .sync()
                .name("create#mantle.facility.ProductFacilityLocation")
                .parameters({productId, facilityId: "ZIRET_WH", locationSeqId: "01010401"})
                .call()
            ec.service
                .sync()
                .name("create#mantle.facility.PutawayRule")
                .parameters({
                    putawayRuleId: "BOSS_WH_P9_RULE",
                    organizationPartyId: "ORG_ZIZI_RETAIL",
                    facilityId: "ZIRET_WH",
                    productId,
                    fromLocationTypeEnumId: "FltReceiving",
                    toLocationSeqId: "01010402",
                    priority: 10,
                    fromDate: "2026-01-01 00:00:00",
                    changeReason: "P9 spec"
                })
                .call()
            asset("BOSS_WH_P9_A", "0801", 8)
            asset("BOSS_WH_P9_B", "0801", 2)
            asset("BOSS_WH_P9_C", "0801", 1)
        })
    },
    cleanupSpec() {
        endFixtureRules()
        // the east warehouse's two-step receipt ends, so later specs receive there as before
        withAuthzOff(() =>
            ec.service
                .sync()
                .name("update#mantle.facility.WarehousePolicy")
                .parameters(Object.assign({thruDate: ec.user.nowTimestamp}, eastPolicy))
                .call()
        )
    }
})

feature("Putaway queues the receiving stock, explains the default bin's refusal for capacity and suggests the rule's bin", {
    when() {
        return {
            mover: asUser("warehouse.move", () =>
                page("Receiving/Putaway", {facilityId: "ZIRET_WH", productId, assetId: "BOSS_WH_P9_A"}, "html")
            ),
            reader: asUser("warehouse.read", () =>
                page("Receiving/Putaway", {facilityId: "ZIRET_WH", productId, assetId: "BOSS_WH_P9_A"}, "html")
            ),
            context: asUser("warehouse.move", () =>
                invoke("ironstone.warehouse.PutawayServices.get#PutawayContext", {
                    facilityId: "ZIRET_WH",
                    productId,
                    assetId: "BOSS_WH_P9_A"
                })
            )
        }
    },
    then({mover, reader, context}) {
        mover.errors == []
        mover.output.includes("BOSS_WH_P9_B")
        mover.output.includes("Suggested: 01010402")
        mover.output.includes("more do not fit")
        mover.output.includes("Confirm move")
        reader.errors == []
        reader.output.includes("needs the move permission")
        !reader.output.includes("Confirm move")
        context.queueRows.length == 3
        context.queueRows.every(row => row.suggestedLocationSeqId == "01010402")
        context.destination.candidates[0].locationSeqId == "01010401"
        context.destination.candidates[0].reasonCode == "CAPACITY_EXCEEDED"
        context.destination.locationSeqId == "01010402"
    }
})

feature("a mover puts away to the suggestion and the hold is released; another bin needs a reason; a retry moves nothing more", {
    when() {
        return asUser("warehouse.move", () => {
            const operationKey = key()
            const first = post("Receiving/Putaway/putawayStock", {assetId: "BOSS_WH_P9_A", operationKey})
            const again = post("Receiving/Putaway/putawayStock", {assetId: "BOSS_WH_P9_A", operationKey})
            const noReason = post("Receiving/Putaway/putawayStock", {
                assetId: "BOSS_WH_P9_B",
                operationKey: key(),
                toLocationSeqId: "01010502"
            })
            const withReason = post("Receiving/Putaway/putawayStock", {
                assetId: "BOSS_WH_P9_B",
                operationKey: key(),
                toLocationSeqId: "01010502",
                reason: "Bay 1 is blocked"
            })
            return {
                first,
                again,
                noReason,
                withReason,
                moved: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P9_A"}),
                chosen: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P9_B"})
            }
        })
    },
    then({first, again, noReason, withReason, moved, chosen}) {
        first == ""
        again == ""
        moved.locationSeqId == "01010402"
        moved.statusId == "AstAvailable"
        noReason.includes("REASON_REQUIRED")
        withReason == ""
        chosen.locationSeqId == "01010502"
    }
})

feature("Handheld Putaway shows the scan, Home counts the queue, and the sheet prints it", {
    when() {
        return asUser("warehouse.move", () => ({
            handheld: page("Handheld/Putaway", {facilityId: "ZIRET_WH", assetId: "BOSS_WH_P9_C"}, "html"),
            home: invoke("ironstone.warehouse.HomeServices.get#Home", {appRoot: "Warehouse", facilityId: "ZIRET_WH"}),
            sheet: page("Receiving/PutawaySheet", {facilityId: "ZIRET_WH"}, "html")
        }))
    },
    then({handheld, home, sheet}) {
        handheld.errors == []
        handheld.output.includes("Scan the stock")
        handheld.output.includes("Scan the bin")
        handheld.output.includes("Put away at 0101040")
        home.queueRows.find(row => row.operation == "putaway").readyCount >= 1
        sheet.errors == []
        sheet.output.includes("BOSS_WH_P9_C")
    }
})

feature("PutawayRules lists and tests the rules; a facility admin adds one and a mover cannot", {
    when() {
        const parameters = {
            facilityId: "ZIRET_WH",
            productId,
            fromLocationTypeEnumId: "FltStaging",
            toLocationTypeEnumId: "FltBulk",
            priority: 30,
            changeReason: "P9 spec staging rule"
        }
        return {
            rules: asUser("warehouse.read", () =>
                page("Locations/PutawayRules", {facilityId: "ZIRET_WH", testProductId: productId, testQuantity: 6}, "html")
            ),
            mover: asUser("warehouse.move", () => post("Locations/PutawayRules/storeRule", parameters)),
            admin: asUser("warehouse.facility", () => post("Locations/PutawayRules/storeRule", parameters)),
            added: one("mantle.facility.PutawayRule", {productId, fromLocationTypeEnumId: "FltStaging"})
        }
    },
    then({rules, mover, admin, added}) {
        rules.errors == []
        rules.output.includes("BOSS_WH_P9_RULE")
        rules.output.includes("Sealant overflow to the bulk bay")
        rules.output.includes("Put away at 01010402")
        !rules.output.includes("New rule")
        mover.includes("PERMISSION_DENIED")
        admin == ""
        added.toLocationTypeEnumId == "FltBulk"
    }
})

feature("a two-step receipt queues its stock in receiving, and Putaway lists it there", {
    when() {
        withAuthzOff(() =>
            ec.service
                .sync()
                .name("create#mantle.facility.WarehousePolicy")
                .parameters(
                    Object.assign(
                        {receiptSteps: 2, receivingLocationSeqId: "E0801", changeReason: "P9 spec two-step"},
                        eastPolicy
                    )
                )
                .call()
        )
        // the receipt entry point as the receiver; the Warehouse groups reach it only through the screens (F3)
        const received = asUser(
            "warehouse.receive",
            () =>
                invoke("mantle.shipment.WarehouseTaskServices.receive#AdHocStock", {
                    operationKey: key(),
                    facilityId: "BOSS_WH_EAST",
                    productId,
                    quantity: 4,
                    reason: "P9 spec delivery"
                }),
            false
        ).result
        const queue = asUser("warehouse.move", () =>
            invoke("ironstone.warehouse.PutawayServices.get#PutawayContext", {facilityId: "BOSS_WH_EAST", productId})
        )
        return {received, row: queue.queueRows.find(row => row.assetId == received.assetIds[0])}
    },
    then({received, row}) {
        received.receiptSteps == 2
        received.locationSeqId == "E0801"
        row.locationSeqId == "E0801"
        row.statusId == "AstOnHold"
        row.quantityOnHand == 4
        row.suggestionOk == false
    }
})
