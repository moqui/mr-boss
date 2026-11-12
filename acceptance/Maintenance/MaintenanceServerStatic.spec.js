// Maintenance's server-static sweep (impl-maintenance P20; README "Significant redesigns" 3, mr-moqui plans/archive/QvtServerStatic.md;
// AGENTS.md: one sweep per app per mode, in acceptance): ServerStaticLib's full check of each plain XML Maintenance screen, the
// shared screens it mounts (MaintenanceSpecLib.mountedScreens) and each tab of a mount that Maintenance's menu shows, on the demo's
// records (MaintenanceSpecLib.sweepParameters; the intervention report on a customerRepair), as john.doe. A screen marked server-static="qvt" must come back clean (Commons'
// Report a problem is Maintenance's marked one, in Commons' ServerStatic); the others and why are logged. The .qvue
// ResourceCalendar is left out, as ServerStaticLib leaves every qvue screen out; its terminal twin is MaintenanceTui's.
// Run: ./moq accept mr-boss --spec MaintenanceServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const maintenance = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
let screens, repair
const mountPaths = new Set()
const isMounted = path => mountPaths.has(path)

// [app, path, marked] of a shared screen mounted under Maintenance, unless it is a .qvue screen or a placeholder (as
// ServerStaticLib.screens leaves those out)
function mounted(path, location) {
    const text = String(ec.resource.getLocationReference(location).getText())
    if (/render-modes="[^"]*qvue/.test(text) || text.includes('<label text="Placeholder:')) return null
    return ["Maintenance", path, /server-static="[^"]*\bqvt\b/.test(text)]
}

spec({
    setupSpec() {
        login("john.doe")
        // P12's intervention report opens on a customer repair, which no demo record is
        repair = maintenance.customerRepair("SWEEP")
        screens = lib.screens(["Maintenance"])
        const seen = new Set(screens.map(([, path]) => path))
        for (const [path, location] of maintenance.mountedScreens()) {
            const row = mounted(path, location)
            if (row && !seen.has(path)) {
                screens.push(row)
                seen.add(path)
                mountPaths.add(path)
            }
            // a mount's tabs its menu shows: a file of the mount's own directory, or another shared screen it mounts
            for (const tab of maintenance.mountTabs(path, maintenance.sweepParameters(path))) {
                if (seen.has(tab)) continue
                const tabName = tab.substring(tab.lastIndexOf("/") + 1)
                const own = location.replace(/\.xml$/, "/" + tabName + ".xml")
                const tabLocation = ec.resource.getLocationReference(own).exists ? own : sharedTab(location, tabName)
                const tabRow = tabLocation ? mounted(tab, tabLocation) : null
                if (tabRow) {
                    screens.push(tabRow)
                    seen.add(tab)
                    mountPaths.add(tab)
                }
            }
        }
    }
})
// the location of a tab a shared screen mounts from elsewhere (Product360's Prices, Stock and so on), read from its subscreens-items
function sharedTab(location, tabName) {
    const text = String(ec.resource.getLocationReference(location).getText())
    const item = new RegExp(`<subscreens-item name="${tabName}"[^>]*location="([^"]+)"`).exec(text)
    return item ? item[1] : null
}

feature("the full check of every Maintenance XML screen, shared mount and mounted tab; each one marked server-static is clean", {
    when() {
        // a shared tab its owner marked server-static (FacilityDetail's Files and Conversation) is checked as the qvt client loads it,
        // its own level alone (lastStandalone): its parent's header, rendered with it in a full-path html render, is no part of
        // its template, and a link to another app's route in that header resolves only under the web root
        const markedMounts = new Set(screens.filter(([, path, marked]) => marked && isMounted(path)).map(([, path]) => path))
        return {
            rows: lib.check(screens, (app, path) =>
                Object.assign(markedMounts.has(path) ? {lastStandalone: "true"} : {}, maintenance.sweepParameters(path, repair))
            )
        }
    },
    then({rows}) {
        rows.length > 70
        rows.every(row => row.verdict !== "error")
        lib.unclean(rows) == ""
    }
})
