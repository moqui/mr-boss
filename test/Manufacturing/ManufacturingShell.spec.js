// The Manufacturing shell (impl-manufacturing P1): the menu and providers per group, the launcher, the palette, record links
// and Home, with artifact authorization enabled, on the demo of data/BossManufacturingDemoData.xml. Later phases add their
// quick creates, Today sources and notification topics to the menu feature's rows, and features of their own below.
// Run: ./moq test mr-boss --spec ManufacturingShell
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const root = "component://webroot/screen/webroot.xml"
// the menu of design §1.2; the areas open to every Manufacturing user, and the others by group (BOSS_MFG_<Area>)
const order = [
    "Home",
    "WorkOrders",
    "ShopFloor",
    "BillsOfMaterials",
    "Routings",
    "WorkCenters",
    "Quality",
    "Planning",
    "Subcontracting",
    "Settings",
    "Approvals",
    "Reports"
]
const open = ["Home", "WorkOrders", "BillsOfMaterials", "Routings", "WorkCenters", "Reports"]
const menuOf = extra => order.filter(name => open.includes(name) || extra.includes(name))
function shell(user) {
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Manufacturing/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Manufacturing") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Manufacturing")?.providers
        }
    })
}

// quick create offers the draft work order to the planners and the administrator (P5a), and the downtime report to the
// operators, supervisors and the administrator (P11)
const reportsDowntime = [users.operate, users.supervise, users.admin]
feature("the Manufacturing menu follows the #user grants", {
    where: [
        {user: users.read, extra: []},
        {user: users.plan, extra: ["Planning", "Subcontracting"]},
        {user: users.schedule, extra: ["Planning"]},
        {user: users.method, extra: []},
        {user: users.methodApprove, extra: ["Approvals"]},
        {user: users.operate, extra: ["ShopFloor"]},
        {user: users.supervise, extra: ["ShopFloor", "Quality", "Planning", "Subcontracting", "Approvals"]},
        {user: users.inspect, extra: ["Quality"]},
        {user: users.verify, extra: ["Quality"]},
        {user: users.qualityAdmin, extra: ["Quality"]},
        {user: users.cost, extra: []},
        {user: users.resource, extra: ["Settings"]},
        {user: users.admin, extra: order}
    ],
    when({user}) {
        const found = shell(user)
        return Object.assign(found, {quickKinds: (found.providers?.quickCreate || []).map(item => item.kind)})
    },
    then({status, names, providers, extra, quickKinds, user}) {
        status == 200
        names == menuOf(extra)
        quickKinds.includes("manufacturingWorkOrder") == [users.plan, users.admin].includes(user)
        quickKinds.includes("manufacturingReportDowntime") == reportsDowntime.includes(user)
        quickKinds.filter(kind => kind !== "manufacturingWorkOrder" && kind !== "manufacturingReportDowntime") == []
        providers.paletteSources.some(source => source.group === "Manufacturing")
        providers.keymaps[0].scope == "manufacturing"
    }
})
feature("the production reader has Manufacturing and no other business launcher; the display and other apps' users have none", {
    when() {
        return {
            reader: shell(users.read).apps,
            display: shell(users.display).apps,
            warehouse: shell("warehouse.read").apps,
            method: shell("catalog.method").apps
        }
    },
    then({reader, display, warehouse, method}) {
        reader.includes("Manufacturing")
        !reader.some(app => ["Products", "Accounting", "Purchasing", "Warehouse", "Projects", "Sales"].includes(app))
        !display.includes("Manufacturing")
        !warehouse.includes("Manufacturing")
        // Products' method engineer holds a Manufacturing capability group but not the root user group
        !method.includes("Manufacturing")
    }
})
feature("the palette finds the reader's own runs, work centers and equipment and none of another organization's", {
    when() {
        const search = text => invoke("ironstone.manufacturing.AccessServices.search#Records", {text, limit: 20}).rows
        return {
            retail: asUser(users.read, () => ({
                runs: search("boss_mfg"),
                lines: search("assembly line"),
                equipment: search("EQUIP_AB4")
            })),
            services: asUser(users.services, () => ({runs: search("boss_mfg")})),
            outsider: asUser("warehouse.read", () =>
                lib.refusal("ironstone.manufacturing.AccessServices.search#Records", {text: "boss_mfg"})
            ),
            // with authorization disabled the service itself answers no rows for a user without Manufacturing
            outsiderRows: asUser("warehouse.read", () => search("boss_mfg"), false)
        }
    },
    then({retail, services, outsider, outsiderRows}) {
        // P5a: a run opens WorkOrderDetail
        retail.runs.some(row => row.url.includes("WorkOrders/WorkOrderDetail?workEffortId=" + ids.runId))
        !retail.runs.some(row => row.url.includes(ids.otherRunId) || row.url.includes(ids.otherLineId))
        // P3: a work center opens FacilityDetail and equipment EquipmentDetail under Work centers
        retail.lines.some(row => row.url.includes("WorkCenters/FacilityDetail?facilityId=" + ids.lineId))
        retail.lines.some(row => row.url.includes("facilityId=" + ids.lineBId))
        retail.equipment.some(row => row.url.includes("WorkCenters/EquipmentDetail?assetId=" + ids.equipmentId))
        services.runs.some(row => row.url.includes("workEffortId=" + ids.otherRunId))
        !services.runs.some(row => row.url.includes("workEffortId=" + ids.runId))
        outsider.includes("not authorized")
        outsiderRows == []
    }
})
const link = (recordEntityName, id) =>
    invoke("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName, id}).url || null
feature("a #kind record link opens under Manufacturing for its reader, not another organization's, not another app's user", {
    where: [
        {
            kind: "run",
            entity: "mantle.work.effort.WorkEffort",
            id: ids.runId,
            otherId: ids.otherRunId,
            opens: "WorkOrders/WorkOrderDetail?workEffortId="
        },
        {
            kind: "operation",
            entity: "mantle.work.effort.WorkEffort",
            id: ids.operationId,
            otherId: "BOSS_MFG_NO_SUCH",
            // P5a: its run's Operations with the operation selected
            opens: "WorkOrders/WorkOrderDetail/Operations?workEffortId=" + ids.releasedRunId + "&selectedOperationId="
        },
        // P3: FacilityDetail
        {
            kind: "workCenter",
            entity: "mantle.work.production.WorkCenter",
            id: ids.lineId,
            otherId: ids.otherLineId,
            opens: "WorkCenters/FacilityDetail?facilityId="
        }
    ],
    when({entity, id, otherId}) {
        return {
            own: asUser(users.read, () => link(entity, id)),
            other: asUser(users.read, () => link(entity, otherId)),
            finance: asUser("finance.read", () => link(entity, id))
        }
    },
    then({own, other, finance, opens, id}) {
        // a kind opens its screen once its phase builds it, until then Home's lookup
        own == "/qapps/Manufacturing/" + opens + id
        other == null
        finance == null
    }
})
feature("a run's link is never a Commons task or event: a Warehouse user opens its materials, others nothing (F38, F39)", {
    when() {
        return {
            warehouse: asUser("warehouse.issue", () => link("mantle.work.effort.WorkEffort", ids.releasedRunId)),
            // a Projects team member is not authorized for record links; with authorization disabled the service answers none
            team: asUser("joe.developer", () => link("mantle.work.effort.WorkEffort", ids.runId), false),
            operation: asUser("joe.developer", () => link("mantle.work.effort.WorkEffort", ids.operationId), false)
        }
    },
    then({warehouse, team, operation}) {
        warehouse == "/qapps/Warehouse/Inventory/MaterialIssueReceipt?sourceType=productionRun&sourceId=" + ids.releasedRunId
        team == null
        operation == null
    }
})
feature("Home shows the reader's Summary as unavailable, their plants and the lookup of their own records only", {
    when() {
        return asUser(users.read, () => ({
            home: page("Home"),
            run: page("Home", {lookupType: "run", lookupId: ids.runId}),
            other: page("Home", {lookupType: "run", lookupId: ids.otherRunId}),
            plants: invoke("ironstone.manufacturing.AccessServices.get#Choices", {choice: "plants"}).options.map(row => row.value)
        }))
    },
    then({home, run, other, plants}) {
        home.status == 200
        home.errors == []
        home.output.includes("Completed this month")
        home.output.includes("Unavailable")
        home.output.includes("No work is due.")
        run.output.includes("Work order " + ids.runId)
        run.output.includes("Demo assemblies")
        other.output.includes(ids.otherRunId + " is not available to you.")
        !other.output.includes("Services kits")
        plants.includes(ids.plantId)
        !plants.includes(ids.otherPlantId)
        // a warehouse with no work center is no plant
        !plants.includes("BOSS_WH_EAST")
    }
})
