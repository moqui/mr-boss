// Warehouse P12 in BOSS (impl-warehouse P12): the Pack task shows the demo's picked shipment with its lines, the facility's
// box types and the packer's actions (a reader reads it); Home counts the packing queue; ShipmentDetail's outbound branch
// opens Pack; BoxTypes and FacilityDetail's Box types tab list the demo cartons; MaterialIssueReceipt shows the demo kit's
// components; the packing slip, contents and inserts print; Zizi's books cost kits from their components. The guarded
// packs, completion, reopen and the kit's cost are mr-mantle's WarehousePacking spec; access is WarehouseAccess.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {ids, asUser, invoke} = lib
const packing = "ironstone.warehouse.PackingServices."
spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("the Pack task shows the picked shipment's lines and the facility's cartons, with actions only for the packer", {
    when() {
        return {
            context: asUser("warehouse.pack", () => invoke(packing + "get#PackContext", {shipmentId: "BOSS_WH_SHIP_PACK"})),
            packer: asUser("warehouse.pack", () => lib.page("Shipping/Pack", {shipmentId: "BOSS_WH_SHIP_PACK"}, "html")),
            reader: asUser("warehouse.read", () => lib.page("Shipping/Pack", {shipmentId: "BOSS_WH_SHIP_PACK"}, "html")),
            toPack: asUser("warehouse.pack", () => invoke(packing + "get#PackContext", {facilityId: ids.facilityId})),
            queue: asUser("warehouse.pack", () =>
                invoke("ironstone.warehouse.HomeServices.get#Home", {facilityId: ids.facilityId}).queueRows.find(
                    row => row.operation === "packing"
                )
            )
        }
    },
    then({context, packer, reader, toPack, queue}) {
        context.found == true
        context.canPack == true
        context.lines.length == 1
        context.lines[0].productName == "Pack demo hinge"
        context.lines[0].picked == 4
        context.lines[0].left == 4
        context.boxOptions
            .map(row => row.value)
            .sort()
            .join() == "BOSS_WH_BOX_M,BOSS_WH_BOX_S"
        packer.errors == []
        packer.output.includes("Pack demo hinge")
        packer.output.includes("Pack into a package")
        packer.output.includes("Add package")
        reader.errors == []
        // the Pack task is for the pack capability only (F291): a reader sees no line
        !reader.output.includes("Pack demo hinge")
        reader.output.includes("Packing needs the pack permission")
        !reader.output.includes("Pack into a package")
        toPack.shipmentRows.some(row => row.shipmentId == "BOSS_WH_SHIP_PACK")
        queue.readyCount >= 1
        queue.waitingCount != null
    }
})

feature("ShipmentDetail opens Pack for the packer, and the kit's MaterialIssueReceipt lists its components", {
    when() {
        return asUser("warehouse.pack", () => ({
            detail: lib.page("Shipping/ShipmentDetail", {shipmentId: "BOSS_WH_SHIP_PACK"}, "html"),
            kit: lib.page(
                "Inventory/MaterialIssueReceipt",
                {sourceType: "shipmentAssembly", sourceId: "BOSS_WH_SHIP_KIT"},
                "html"
            ),
            source: invoke(packing + "get#MaterialSource", {sourceType: "shipmentAssembly", sourceId: "BOSS_WH_SHIP_KIT"}),
            pack: invoke(packing + "get#PackContext", {shipmentId: "BOSS_WH_SHIP_KIT"})
        }))
    },
    then({detail, kit, source, pack}) {
        detail.errors == []
        detail.output.includes("Pack demo hinge")
        // the header's Pack (a test render shows a link's text, not its address)
        detail.output.includes("inventory_2</span> Pack</a>")
        kit.errors == []
        kit.output.includes("Kit assembly for shipment BOSS_WH_SHIP_KIT")
        source.materialRows
            .map(row => row.productId + ":" + row.required)
            .sort()
            .join() == "BOSS_WH_KIT_PLATE:1,BOSS_WH_KIT_SCREW:2"
        source.financialRead == false
        pack.assemblyLines.length == 2
        pack.lines[0].assembly == true
    }
})

feature("BoxTypes and FacilityDetail's Box types tab list the demo cartons; the facility admin edits them", {
    when() {
        return {
            reader: asUser("warehouse.read", () => lib.page("Locations/BoxTypes", {}, "html")),
            admin: asUser("warehouse.facility", () => lib.page("Locations/BoxTypes", {}, "html")),
            tab: asUser("warehouse.facility", () =>
                lib.page("Locations/FacilityDetail/BoxTypes", {facilityId: ids.facilityId}, "html")
            ),
            types: asUser("warehouse.read", () => invoke(packing + "get#BoxTypes", {facilityId: ids.facilityId}))
        }
    },
    then({reader, admin, tab, types}) {
        reader.errors == []
        reader.output.includes("Medium carton")
        !reader.output.includes("New box type")
        admin.errors == []
        admin.output.includes("New box type")
        tab.errors == []
        tab.output.includes("Small carton")
        tab.output.includes("Box types used here")
        types.codeRows.some(row => row.carrierPartyId == "UPS" && row.packagingTypeCode == "02")
        types.boxRows.filter(row => row.usedHere).length == 2
    }
})

feature("the packing slip, the package contents and the inserts print, and Zizi's books cost kits from their components", {
    when() {
        return asUser("warehouse.pack", () => ({
            slip: lib.page("Shipping/PackingSlip", {shipmentId: "BOSS_WH_SHIP_PACK"}, "html"),
            contents: lib.page("Shipping/PackingSlip", {shipmentId: "BOSS_WH_SHIP_PACK", document: "contents"}, "html"),
            foreign: lib.page("Shipping/PackingSlip", {shipmentId: ids.otherShipmentId}, "html"),
            kitCost: ec.service
                .sync()
                .name("mantle.ledger.LedgerServices.find#PartyAcctgPreference")
                .parameters({organizationPartyId: "ORG_ZIZI_RETAIL"})
                .disableAuthz()
                .call().partyAcctgPreference?.kitCostFromComponents
        }))
    },
    then({slip, contents, foreign, kitCost}) {
        slip.errors == []
        slip.output.includes("Packing slip · shipment BOSS_WH_SHIP_PACK")
        slip.output.includes("Pack demo hinge")
        contents.errors == []
        contents.output.includes("Package contents")
        foreign.output.includes("This shipment is not available")
        kitCost == "Y"
    }
})
