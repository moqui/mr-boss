// Warehouse P4, Inventory and traceability (impl-warehouse P4, design-warehouse §6): the asset list and its groups, an
// asset's detail, ledger and audit with its metadata edit, lots, containers, movements, Traceability, and Products'
// Product360 and InventoryAvailability with the Warehouse context; on the demo of data/BossWarehouseDemoData.xml, with
// artifact authorization enabled. Cost reaches only a Warehouse user with financial read (a spec-local group holding
// ACCOUNTING_VIEW).
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {ids, asUser, refusal, invoke, page} = lib
const inventory = "ironstone.warehouse.InventoryServices."
const financeGroup = "BOSS_WH_SPEC_FINANCE"

// Run action as warehouse.read with financial read for the moment (the spec-local group), then remove it.
function withFinancialRead(action) {
    const userId = ec.entity
        .find("moqui.security.UserAccount")
        .condition("username", "warehouse.read")
        .disableAuthz()
        .one().userId
    const fromDate = "2000-01-01T00:00:00Z"
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        call("create#moqui.security.UserGroupMember", {userGroupId: financeGroup, userId, fromDate})
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
    try {
        return asUser("warehouse.read", action)
    } finally {
        ec.artifactExecution.disableAuthz()
        ec.entity.find("moqui.security.UserGroupMember").condition({userGroupId: financeGroup, userId}).disableAuthz().deleteAll()
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// the fixtures this spec creates, removed at its end
const created = {lots: [], containers: []}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        call("store#moqui.security.UserGroup", {userGroupId: financeGroup, description: "Warehouse spec financial read"})
        call("store#moqui.security.UserGroupPermission", {
            userGroupId: financeGroup,
            userPermissionId: "ACCOUNTING_VIEW",
            fromDate: "2000-01-01T00:00:00Z"
        })
        ec.artifactExecution.enableAuthz()
    },
    cleanupSpec() {
        ec.artifactExecution.disableAuthz()
        for (const lotId of created.lots) ec.entity.find("mantle.product.asset.Lot").condition("lotId", lotId).deleteAll()
        for (const containerId of created.containers)
            ec.entity.find("mantle.product.asset.Container").condition("containerId", containerId).deleteAll()
        ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", financeGroup).deleteAll()
        ec.entity.find("moqui.security.UserGroup").condition("userGroupId", financeGroup).deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature("a reader lists their organization's assets, grouped and by lot across locations, with no cost", {
    when() {
        return asUser("warehouse.read", () => {
            const all = invoke(inventory + "find#Assets", {pageSize: 100})
            return {
                all,
                lot: invoke(inventory + "find#Assets", {lotId: ids.lotId, pageSize: 100}).assetList,
                byProduct: invoke(inventory + "find#Assets", {groupBy: "product"}).groupList,
                other: refusal(inventory + "find#Assets", {facilityId: ids.otherFacilityId}),
                page: page("Inventory/Assets", {}, "html")
            }
        })
    },
    then({all, lot, byProduct, other, page}) {
        all.assetList.some(row => row.assetId === ids.assetId)
        !all.assetList.some(row => ["BOSS_PRD_STOCK", "BOSS_PRD_FOREIGN_STOCK"].includes(row.assetId))
        all.costIncluded == false
        all.assetList.every(row => !("acquireCost" in row))
        lot.map(row => row.assetId).sort() == ["BOSS_WH_LOT_AVAIL", "BOSS_WH_LOT_EAST", "BOSS_WH_LOT_HOLD"]
        new Set(lot.map(row => row.facilityId)).size == 2
        byProduct.some(row => row.groupLabel === "Lot-tracked sealant" && row.quantityOnHand === 78)
        other.includes("FACILITY_UNAVAILABLE")
        page.errors == []
        page.output.includes(ids.assetId)
        !page.output.includes("Unit cost")
    }
})
feature("financial read adds cost to the asset list, the ledger and the trace", {
    when() {
        return withFinancialRead(() => ({
            assets: invoke(inventory + "find#Assets", {productId: "BOSS_WH_SERIAL"}),
            ledger: invoke(inventory + "find#Movements", {assetId: ids.assetId}),
            trace: invoke(inventory + "get#Traceability", {rootType: "lot", rootId: ids.lotId}),
            page: page("Inventory/Assets", {productId: "BOSS_WH_SERIAL"}, "html")
        }))
    },
    then({assets, ledger, trace, page}) {
        assets.costIncluded == true
        assets.assetList.every(row => row.acquireCost === 300)
        ledger.costIncluded == true
        trace.costIncluded == true
        trace.edgeList.some(row => row.event === "receipt" && row.unitCost === 12.5)
        page.output.includes("Unit cost")
    }
})
feature("an asset's ledger reaches its receipt and its sale, with the source documents and no cost for a reader", {
    when() {
        return asUser("warehouse.read", () => invoke(inventory + "find#Movements", {assetId: "BOSS_WH_LOT_AVAIL"}))
    },
    then(ledger) {
        ledger.costIncluded == false
        ledger.movementList.some(
            row => row.sourceText === "Receipt BOSS_WH_RCPT_A" && row.documentText === "Shipment BOSS_WH_SHIP_IN"
        )
        ledger.movementList.some(row => row.sourceType === "issuance" && row.documentId === "BOSS_WH_SHIP_OUT")
        ledger.movementList.every(row => !("unitCost" in row))
    }
})
feature("an asset's detail offers an adjuster only its name and comments, and the edit is audited", {
    when() {
        const reader = asUser("warehouse.read", () => ({
            detail: invoke(inventory + "get#AssetDetail", {assetId: ids.assetId}),
            page: page("Inventory/AssetDetail", {assetId: ids.assetId}, "html"),
            save: refusal(inventory + "store#AssetMetadata", {assetId: ids.assetId, assetName: "Front desk scanner"})
        }))
        const adjuster = asUser("warehouse.adjust", () => ({
            page: page("Inventory/AssetDetail", {assetId: ids.assetId}, "html"),
            save: refusal(inventory + "store#AssetMetadata", {
                assetId: ids.assetId,
                assetName: "Front desk scanner",
                comments: "Kept at receiving"
            }),
            other: refusal(inventory + "store#AssetMetadata", {assetId: ids.otherAssetId, assetName: "Not ours"}),
            audit: invoke(inventory + "get#AssetAudit", {assetId: ids.assetId}).auditRows,
            missing: page("Inventory/AssetDetail", {assetId: ids.otherAssetId}, "html")
        }))
        return {reader, adjuster}
    },
    then({reader, adjuster}) {
        reader.detail.canEditMetadata == false
        reader.detail.asset.serialNumber == "SCN-1001"
        !("acquireCost" in reader.detail.asset)
        reader.page.errors == []
        reader.page.output.includes("SCN-1001")
        !reader.page.output.includes("Edit details")
        reader.save.includes("PERMISSION_DENIED")
        adjuster.page.output.includes("Edit details")
        // the edit form has the name and comments, and nothing for quantity, location, status, owner or cost
        adjuster.page.output.includes('name="assetName"')
        !/name="(quantityOnHandTotal|locationSeqId|statusId|ownerPartyId|acquireCost|facilityId)"/.test(adjuster.page.output)
        adjuster.save == ""
        adjuster.other.includes("RECORD_UNAVAILABLE")
        adjuster.audit.some(row => row.fieldText === "Name" && row.newValueText === "Front desk scanner")
        adjuster.audit.some(row => row.fieldText === "Comments" && row.userText === "warehouse.adjust")
        adjuster.missing.output.includes("is not available")
    }
})
feature("a receiver creates a lot the reader then finds; a reader may not create one", {
    when() {
        const lotNumber = "SEAL-SPEC-" + Date.now()
        const reader = asUser("warehouse.read", () => refusal(inventory + "create#Lot", {lotNumber}))
        const lot = asUser("warehouse.receive", () => invoke(inventory + "create#Lot", {lotNumber, expirationDate: "2027-03-31"}))
        if (lot.lotId) created.lots.push(lot.lotId)
        const found = asUser("warehouse.read", () => ({
            list: invoke(inventory + "find#Lots", {text: lotNumber}).lotList,
            detail: refusal(inventory + "get#LotDetail", {lotId: lot.lotId}),
            stock: invoke(inventory + "get#LotDetail", {lotId: ids.lotId})
        }))
        return {reader, lot, found, lotNumber}
    },
    then({reader, lot, found, lotNumber}) {
        reader.includes("PERMISSION_DENIED")
        lot.lotId != null
        found.list.map(row => row.lotNumber) == [lotNumber]
        found.detail == ""
        found.stock.lotStockRows.length == 3
        found.stock.lotProducts.map(row => row.productId) == ["BOSS_WH_LOTTED"]
    }
})
feature("a mover creates an empty container at their facility, not at another organization's; a reader may not", {
    when() {
        const parameters = {facilityId: ids.eastFacilityId, locationSeqId: "E0101", containerTypeEnumId: "CtPalletUs4048"}
        const reader = asUser("warehouse.read", () => refusal(inventory + "create#Container", parameters))
        const mover = asUser("warehouse.move", () => {
            const out = invoke(inventory + "create#Container", parameters)
            if (out.containerId) created.containers.push(out.containerId)
            return {
                out,
                other: refusal(inventory + "create#Container", {facilityId: ids.otherFacilityId}),
                badLocation: refusal(inventory + "create#Container", {facilityId: ids.eastFacilityId, locationSeqId: "0901"})
            }
        })
        const list = asUser("warehouse.read", () => ({
            list: invoke(inventory + "find#Containers", {facilityId: ids.eastFacilityId}).containerList,
            detail: invoke(inventory + "get#ContainerDetail", {containerId: mover.out.containerId})
        }))
        return {reader, mover, list}
    },
    then({reader, mover, list}) {
        reader.includes("PERMISSION_DENIED")
        mover.out.containerId != null
        mover.other.includes("RECORD_UNAVAILABLE")
        mover.badLocation.includes("RECORD_UNAVAILABLE")
        list.list.some(row => row.containerId === ids.containerId)
        list.list.some(row => row.containerId === mover.out.containerId && row.assetCount === 0)
        list.detail.container.typeText == "Pallet US 40x48in"
    }
})
feature("a trace of the received lot reaches its purchase and its sale, shows Unknown for stock with no receipt, and no cost", {
    when() {
        return asUser("warehouse.read", () => ({
            trace: invoke(inventory + "get#Traceability", {rootType: "lot", rootId: ids.lotId}),
            other: refusal(inventory + "get#Traceability", {rootType: "asset", rootId: ids.otherAssetId}),
            page: page("Inventory/Traceability", {rootType: "lot", rootId: ids.lotId}, "html")
        }))
    },
    then({trace, other, page}) {
        trace.traced == true
        trace.nodeList.some(row => row.nodeKey === "shipment:BOSS_WH_SHIP_IN")
        trace.nodeList.some(row => row.nodeKey === "shipment:BOSS_WH_SHIP_OUT")
        trace.unknownCount == 2
        trace.costIncluded == false
        trace.edgeList.every(row => !("unitCost" in row))
        trace.treeRows.some(row => row.label === "Unknown provenance")
        other.includes("RECORD_UNAVAILABLE")
        page.errors == []
        page.output.includes("Unknown provenance")
        !page.output.includes("Unit cost")
    }
})
feature("Product360 and Availability under Warehouse: physical tabs, master read only, stock in the reader's facilities", {
    when() {
        // Products' services are reached through the mounted screens (inherited authorization): called here without
        // artifact authorization, they check the user themselves
        const products = asUser(
            "warehouse.read",
            () => ({
                shared: invoke("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Warehouse"}),
                summary: invoke("ironstone.products.InventoryServices.get#InventorySummary", {
                    appRoot: "Warehouse",
                    productId: "BOSS_WH_LOTTED"
                })
            }),
            false
        )
        const outsider = asUser(
            "catalog.admin",
            () => refusal("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Warehouse"}),
            false
        )
        return Object.assign(
            {outsider},
            products,
            asUser("warehouse.read", () => ({
                locations: invoke(inventory + "get#ProductStock", {productId: "BOSS_WH_LOTTED", part: "locations"}).locationRows,
                levels: invoke(inventory + "get#ProductStock", {productId: "BOSS_WH_LOTTED", part: "replenishment"}),
                product: page("Inventory/Product360", {productId: "BOSS_WH_LOTTED"}, "html"),
                stock: page("Inventory/Availability", {productId: "BOSS_WH_LOTTED"}, "html"),
                otherProduct: refusal(inventory + "get#ProductStock", {productId: "BOSS_PRD_OWN", part: "locations"})
            }))
        )
    },
    then({shared, summary, outsider, locations, levels, product, stock, otherProduct}) {
        shared.productTabs == ["Summary", "Identifiers", "Dimensions", "Stock", "Replenishment", "Documents", "History"]
        shared.capabilities.read == true
        shared.capabilities.catalogEdit == false
        shared.capabilities.priceRead == false
        outsider.includes("not available")
        summary.stockRows.map(row => row.facilityId).sort() == [ids.eastFacilityId, ids.facilityId]
        // held by status: on hold 10, quarantine 5 and morgue 2 at the main warehouse, though their ATP may count
        summary.stockRows.find(row => row.facilityId === ids.facilityId).held == 17
        locations.some(row => row.statusText === "Quarantine" && row.quantityOnHand === 5)
        levels.levelRows.every(row => [ids.facilityId, ids.eastFacilityId].includes(row.facilityId))
        product.errors == []
        product.output.includes("Lot-tracked sealant")
        !product.output.includes("Clone Lot-tracked sealant")
        stock.errors == []
        otherProduct.includes("RECORD_UNAVAILABLE")
    }
})
