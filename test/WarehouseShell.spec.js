// The Warehouse shell (impl-warehouse P1): the menu and providers per group, the palette, record links and Home, with
// artifact authorization enabled, on the demo of data/BossWarehouseDemoData.xml.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {ids, asUser, invoke, page} = lib
const root = "component://webroot/screen/webroot.xml"
const open = [
    "Home",
    "Receiving",
    "Inventory",
    "Transfers",
    "Shipping",
    "Returns",
    "Locations",
    "Handheld",
    "Reports",
    "Settings"
]
const order = [
    "Home",
    "Receiving",
    "Inspection",
    "Inventory",
    "Counts",
    "Transfers",
    "Picking",
    "Shipping",
    "Returns",
    "Locations",
    "Handheld",
    "Reports",
    "Settings"
]
const menuOf = extra => order.filter(name => open.includes(name) || extra.includes(name))
function shell(user) {
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Warehouse/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Warehouse") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Warehouse")?.providers
        }
    })
}

feature("the Warehouse menu follows the #user grants, with no quick create yet", {
    where: [
        {user: "warehouse.read", extra: []},
        {user: "warehouse.receive", extra: []},
        {user: "warehouse.inspect", extra: ["Inspection"]},
        {user: "warehouse.quality", extra: ["Inspection"]},
        {user: "warehouse.count", extra: ["Counts"]},
        {user: "warehouse.countreview", extra: ["Counts"]},
        {user: "warehouse.adjust", extra: ["Counts"]},
        {user: "warehouse.pick", extra: ["Picking"]},
        {user: "warehouse.picksupervisor", extra: ["Picking"]},
        {user: "warehouse.pack", extra: []},
        {user: "warehouse.facility", extra: []},
        {user: "warehouse.admin", extra: ["Inspection", "Counts", "Picking"]}
    ],
    when({user}) {
        return shell(user)
    },
    then({status, names, providers, extra}) {
        status == 200
        names == menuOf(extra)
        providers.quickCreate == []
        providers.paletteTypes == ["MantleShipment", "MantleAsset"]
        providers.paletteSources.some(source => source.group === "Warehouse")
        providers.keymaps[0].scope == "warehouse"
    }
})
feature("the warehouse reader has Warehouse and no other business launcher; other apps' users have no Warehouse", {
    when() {
        return {reader: shell("warehouse.read").apps, finance: shell("finance.read").apps}
    },
    then({reader, finance}) {
        reader.includes("Warehouse")
        !reader.some(app => ["Products", "Accounting", "Purchasing", "Manufacturing", "Projects", "Sales"].includes(app))
        !finance.includes("Warehouse")
    }
})
feature("the palette finds the reader's own records and none of another organization's", {
    when() {
        return asUser("warehouse.read", () => ({
            own: invoke("ironstone.warehouse.AccessServices.search#Records", {text: "boss_wh_s", limit: 20}).rows,
            lots: invoke("ironstone.warehouse.AccessServices.search#Records", {text: "lot_a", limit: 20}).rows,
            other: invoke("ironstone.warehouse.AccessServices.search#Records", {text: "BOSS_PRD", limit: 20}).rows,
            otherShipment: invoke("ironstone.warehouse.AccessServices.search#Records", {text: "SHIP_OTHER", limit: 20}).rows
        }))
    },
    then({own, lots, other, otherShipment}) {
        own.some(row => row.url.includes("lookupType=shipment&lookupId=" + ids.shipmentId))
        own.some(row => row.url.includes("lookupType=asset&lookupId=" + ids.assetId))
        own.some(row => row.url.includes("lookupType=asset&lookupId=" + ids.eastAssetId))
        lots.some(row => row.url.includes("lookupType=lot&lookupId=" + ids.lotId))
        other == []
        otherShipment == []
    }
})
const kinds = [
    {docType: "MantleShipment", id: ids.shipmentId, otherId: ids.otherShipmentId, kind: "shipment"},
    {docType: "MantleAsset", id: ids.assetId, otherId: ids.otherAssetId, kind: "asset"},
    {docType: "MantleFacility", id: ids.eastFacilityId, otherId: ids.otherFacilityId, kind: "facility"},
    {entity: "mantle.product.asset.Lot", id: ids.lotId, otherId: "BOSS_WH_NO_SUCH_LOT", kind: "lot"},
    {entity: "mantle.product.asset.Container", id: ids.containerId, otherId: "ZWH_NO_SUCH", kind: "container"},
    {entity: "mantle.product.asset.PhysicalInventory", id: ids.countId, otherId: "BOSS_WH_NO_SUCH", kind: "count"},
    {entity: "mantle.order.return.ReturnHeader", id: ids.returnId, otherId: "BOSS_WH_NO_SUCH", kind: "return"}
]
feature("a #kind record link opens under Warehouse for its reader, not another organization's, not another app's user", {
    where: kinds,
    when({docType, entity, id, otherId}) {
        const link = recordId => {
            const parameters = docType ? {docType, id: recordId} : {recordEntityName: entity, id: recordId}
            return invoke("ironstone.commons.PaletteServices.get#RecordLink", parameters).url || null
        }
        return {
            own: asUser("warehouse.read", () => link(id)),
            other: asUser("warehouse.read", () => link(otherId)),
            finance: asUser("finance.read", () => link(id))
        }
    },
    then({own, other, finance, kind, id}) {
        own == "/qapps/Warehouse/Home?lookupType=" + kind + "&lookupId=" + id
        other == null
        finance == null
    }
})
feature("Home shows the reader's queues as unavailable, their facilities and the lookup of their own stock only", {
    when() {
        return asUser("warehouse.read", () => ({
            home: page("Home"),
            own: page("Home", {scanText: "SCN-1001"}),
            link: page("Home", {lookupType: "shipment", lookupId: ids.transferShipmentId}),
            other: page("Home", {scanText: ids.otherAssetId}),
            choices: invoke("ironstone.warehouse.AccessServices.get#Choices", {choice: "facilities"}).options
        }))
    },
    then({home, own, link, other, choices}) {
        home.status == 200
        home.errors == []
        home.output.includes("Operation queues")
        home.output.includes("Unavailable")
        home.output.includes("Nothing is assigned to you.")
        !home.output.includes("Counts")
        own.output.includes("Serialized scanner")
        own.output.includes(ids.assetId)
        link.output.includes("Shipment " + ids.transferShipmentId)
        link.output.includes("Ziziwork Retail Warehouse")
        other.output.includes("Nothing in your facilities matches " + ids.otherAssetId)
        choices.some(option => option.value === ids.facilityId)
        choices.some(option => option.value === ids.eastFacilityId)
        !choices.some(option => option.value === ids.otherFacilityId)
    }
})
feature("Home's queues follow the capabilities: a counter sees counts, a picker picking", {
    when() {
        return {
            count: asUser("warehouse.count", () => page("Home").output),
            pick: asUser("warehouse.pick", () => page("Home").output)
        }
    },
    then({count, pick}) {
        count.includes("Counts")
        !count.includes("Picking")
        pick.includes("Picking")
        !pick.includes("Counts")
    }
})
