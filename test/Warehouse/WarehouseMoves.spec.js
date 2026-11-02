// Warehouse moves (impl-warehouse P5; design-warehouse §8 Move, §6 Assets' Relocate and ContainerDetail, §13 Handheld):
// Move lists a location's stock with what is reserved and available and posts a move through its transition (the asset
// checked with the move capability, then Mantle's guarded move#Stock), a retry of the same operation moves nothing more, a
// quarantined asset is refused a pick bin, Relocate moves the valid assets and names the one that cannot move, a container
// takes stock where it is and moves with all of it, the Handheld area mounts Move at handheld density, and a reader sees
// the stock with no move. The Mantle rules themselves are mr-mantle's WarehouseMoves and WarehouseExpiry specs. Fixture
// stock of BOSS_WH_P5_ITEM in ZIRET_WH, made on the fresh database moqui test gives; the stock ledger (AssetDetail) is
// immutable, so the stock stays under its own product, and only the fixture container is removed after.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {asUser, invoke, page} = lib
const productId = "BOSS_WH_P5_ITEM"
const containerId = "BOSS_WH_P5_TOTE"
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const n = value => (value == null ? 0 : Number(String(value)))
const sum = list => list.reduce((total, row) => total + n(row.quantityOnHandTotal), 0)
let keySeq = 0
const key = () => "p5-spec-" + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS") + "-" + ++keySeq

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// the fixture container goes, leaving the stock in it where it is
function cleanupFixtures() {
    withAuthzOff(() => {
        ec.entity.find("mantle.product.asset.Asset").condition("containerId", containerId).updateAll({containerId: null})
        ec.entity.find("mantle.product.asset.Container").condition("containerId", containerId).deleteAll()
    })
}
function asset(assetId, locationSeqId, quantity, statusId = "AstAvailable", extra = {}) {
    ec.service
        .sync()
        .name("create#mantle.product.asset.Asset")
        .parameters(
            Object.assign(
                {
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
                },
                extra
            )
        )
        .call()
    ec.service
        .sync()
        .name("create#mantle.product.asset.AssetDetail")
        .parameters({
            assetId,
            productId,
            effectiveDate: "2026-09-01 00:00:00",
            quantityOnHandDiff: quantity,
            availableToPromiseDiff: quantity
        })
        .call()
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}
const stockAt = locationSeqId => rows("mantle.product.asset.Asset", {productId, locationSeqId})

spec({
    setupSpec() {
        withAuthzOff(() => {
            ec.service
                .sync()
                .name("create#mantle.product.Product")
                .parameters({
                    productId,
                    productName: "P5 move fixture",
                    productTypeEnumId: "PtAsset",
                    assetTypeEnumId: "AstTpInventory",
                    ownerPartyId: "ORG_ZIZI_RETAIL",
                    amountUomId: "OTH_ea"
                })
                .call()
            asset("BOSS_WH_P5_A", "01020302", 10)
            for (const id of ["B", "C", "D", "E"]) asset("BOSS_WH_P5_" + id, "01020402", 3)
            asset("BOSS_WH_P5_HELD", "0901", 2, "AstQuarantine")
            ec.service
                .sync()
                .name("create#mantle.product.asset.Container")
                .parameters({containerId, facilityId: "ZIRET_WH", locationSeqId: "01020502", serialNumber: "P5-TOTE"})
                .call()
            asset("BOSS_WH_P5_IN", "01020502", 2)
            asset("BOSS_WH_P5_AWAY", "01020302", 2)
        })
    },
    cleanupSpec() {
        cleanupFixtures()
    }
})

feature("Move lists a location's stock with reserved and available, and a reader sees it with no move", {
    when() {
        const parameters = {facilityId: "ZIRET_WH", locationSeqId: "01020302", assetId: "BOSS_WH_P5_A"}
        return {
            mover: asUser("warehouse.move", () => page("Transfers/Move", parameters, "html")),
            reader: asUser("warehouse.read", () => page("Transfers/Move", parameters, "html")),
            held: asUser("warehouse.move", () =>
                page("Transfers/Move", {facilityId: "ZIRET_WH", locationSeqId: "0901", assetId: "BOSS_WH_P5_HELD"}, "html")
            )
        }
    },
    then({mover, reader, held}) {
        mover.errors == []
        mover.output.includes("BOSS_WH_P5_A")
        mover.output.includes("P5 move fixture")
        mover.output.includes("Available")
        mover.output.includes("To location")
        reader.errors == []
        reader.output.includes("BOSS_WH_P5_A")
        reader.output.includes("moving it needs the move permission")
        !reader.output.includes("To location")
        held.output.includes("Quarantined stock moves only")
    }
})

feature("a mover moves part of an asset, and a retry of the same operation moves nothing more", {
    when() {
        const parameters = {assetId: "BOSS_WH_P5_A", quantity: 4, toLocationSeqId: "01020102", operationKey: key()}
        const first = asUser("warehouse.move", () => post("Transfers/Move/moveStock", parameters))
        const retry = asUser("warehouse.move", () => post("Transfers/Move/moveStock", parameters))
        const reader = asUser("warehouse.read", () =>
            post("Transfers/Move/moveStock", Object.assign({}, parameters, {operationKey: key()}))
        )
        return {
            first,
            retry,
            reader,
            moved: stockAt("01020102"),
            left: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P5_A"})
        }
    },
    then({first, retry, reader, moved, left}) {
        first == ""
        retry == ""
        reader.includes("PERMISSION_DENIED")
        sum(moved) == 4
        n(left.quantityOnHandTotal) == 6
    }
})

feature("a move of quarantined stock into a pick bin is refused", {
    when() {
        return {
            refused: asUser("warehouse.move", () =>
                post("Transfers/Move/moveStock", {assetId: "BOSS_WH_P5_HELD", toLocationSeqId: "01020301", operationKey: key()})
            ),
            held: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P5_HELD"})
        }
    },
    then({refused, held}) {
        refused.includes("HELD_STOCK")
        held.locationSeqId == "0901"
        held.statusId == "AstQuarantine"
    }
})

feature("Relocate of five assets with one invalid moves the other four and names it", {
    when() {
        const ids = ["BOSS_WH_P5_B", "BOSS_WH_P5_C", "BOSS_WH_P5_D", "BOSS_WH_P5_E", "BOSS_WH_P5_HELD"]
        const relocated = asUser("warehouse.move", () =>
            post("Inventory/Assets/relocateAssets", {assetIdList: ids, toLocationSeqId: "01020201", operationKey: key()})
        )
        return {relocated, moved: stockAt("01020201"), held: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P5_HELD"})}
    },
    then({relocated, moved, held}) {
        // a row that cannot move is a warning of its own, not an error of the whole relocation
        relocated == ""
        moved.length == 4
        sum(moved) == 12
        held.locationSeqId == "0901"
    }
})

feature("a container takes stock where it is, refuses stock away from it, and moves with all its contents", {
    when() {
        const attach = assetId =>
            asUser("warehouse.move", () =>
                post("Inventory/ContainerDetail/attachAsset", {containerId, assetId, operationKey: key()})
            )
        const away = attach("BOSS_WH_P5_AWAY")
        const attached = attach("BOSS_WH_P5_IN")
        const moved = asUser("warehouse.move", () =>
            post("Inventory/ContainerDetail/moveContainer", {containerId, toLocationSeqId: "01020501", operationKey: key()})
        )
        return {
            away,
            attached,
            moved,
            box: one("mantle.product.asset.Container", {containerId}),
            inside: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P5_IN"}),
            awayAsset: one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P5_AWAY"}),
            detail: asUser("warehouse.move", () => page("Inventory/ContainerDetail", {containerId}, "html"))
        }
    },
    then({away, attached, moved, box, inside, awayAsset, detail}) {
        away.includes("ASSET_AWAY_FROM_CONTAINER")
        awayAsset.containerId == null
        attached == ""
        moved == ""
        box.locationSeqId == "01020501"
        inside.containerId == containerId
        inside.locationSeqId == "01020501"
        detail.output.includes("Move container")
        detail.output.includes("Take out")
    }
})

feature("the Handheld area mounts Move at handheld density with the user's recent moves, and Home scans", {
    when() {
        return asUser("warehouse.move", () => ({
            handheld: page("Handheld/Move", {facilityId: "ZIRET_WH"}, "html"),
            home: page("Handheld/Home", {lookupId: "BOSS_WH_P5_A"}, "html"),
            desk: page("Home", {}, "html"),
            scan: invoke("ironstone.warehouse.AccessServices.resolve#Scan", {
                scanText: "BOSS_WH_P5_A",
                allowedTypes: ["asset"],
                facilityId: "ZIRET_WH"
            }),
            locationOnly: invoke("ironstone.warehouse.AccessServices.resolve#Scan", {
                scanText: "BOSS_WH_P5_A",
                allowedTypes: ["location"],
                facilityId: "ZIRET_WH"
            })
        }))
    },
    then({handheld, home, desk, scan, locationOnly}) {
        handheld.errors == []
        handheld.output.includes("Scan the bin")
        !handheld.output.includes("Choose the stock")
        handheld.output.includes("Your recent moves")
        handheld.output.includes("BOSS_WH_P5_A")
        home.output.includes("Move it")
        home.output.includes("Move stock")
        desk.output.includes("Scan or type a code")
        scan.matches.length == 1
        scan.matches[0].identityType == "asset"
        scan.matches[0].id == "BOSS_WH_P5_A"
        locationOnly.matches.length == 0
    }
})
