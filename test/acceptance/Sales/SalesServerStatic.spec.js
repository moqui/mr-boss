// Sales' server-static sweep (impl-sales P20; README "Significant redesigns" 3, mr-moqui plans/archive/QvtServerStatic.md; AGENTS.md:
// one sweep per app per mode, in acceptance): ServerStaticLib's full check of each plain XML Sales screen, the shared screens it
// mounts (SalesSpecLib.mountedScreens) and each tab of a mount that Sales' menu shows, on the demo's records
// (SalesSpecLib.sweepParameters; the order, its change, a shipment and an invoice made by SalesSpecLib.sweepOrders), as john.doe. A
// screen marked server-static="qvt" must come back clean (LogCall is Sales' own marked one); the others and why are logged.
// ServerStaticLib leaves the .qvue screens out, and this spec the mounts with a qvue mode (Chatter and RecordFiles); their terminal
// renders are SalesTui's. Commons' Notifications under Quotes/Approvals is Commons'.
// Run: ./moq accept mr-boss --spec SalesServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const sales = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
let screens, made
const mountPaths = new Set()
const isMounted = path => mountPaths.has(path)

// [app, path, marked] of a shared screen mounted under Sales, unless it is a .qvue screen or a placeholder (as
// ServerStaticLib.screens leaves those out)
function mounted(path, location) {
    const text = String(ec.resource.getLocationReference(location).getText())
    if (/render-modes="[^"]*qvue/.test(text) || text.includes('<label text="Placeholder:')) return null
    return ["Sales", path, /server-static="[^"]*\bqvt\b/.test(text)]
}
// the location of a tab a shared screen mounts from elsewhere (Product360's Prices, Stock and so on), read from its subscreens-items
function sharedTab(location, tabName) {
    const text = String(ec.resource.getLocationReference(location).getText())
    const item = new RegExp(`<subscreens-item name="${tabName}"[^>]*location="([^"]+)"`).exec(text)
    return item ? item[1] : null
}

spec({
    setupSpec() {
        login("john.doe")
        // the order, its change, a shipment, an invoice and a recurring base: no demo record is one
        made = sales.sweepOrders()
        login("john.doe")
        screens = lib.screens(["Sales"])
        const seen = new Set(screens.map(([, path]) => path))
        for (const [path, location] of sales.mountedScreens()) {
            const row = mounted(path, location)
            if (row && !seen.has(path)) {
                screens.push(row)
                seen.add(path)
                mountPaths.add(path)
            }
            // a mount's tabs its menu shows: a file of the mount's own directory, or another shared screen it mounts
            for (const tab of sales.mountTabs(path, sales.sweepParameters(path, made))) {
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
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the full check of every Sales XML screen, shared mount and mounted tab; each one marked server-static is clean", {
    when() {
        // a shared tab its owner marked server-static is checked as the qvt client loads it, its own level alone (lastStandalone): its
        // parent's header, rendered with it in a full-path html render, is no part of its template
        const markedMounts = new Set(screens.filter(([, path, marked]) => marked && isMounted(path)).map(([, path]) => path))
        return {
            rows: lib.check(screens, (app, path) =>
                Object.assign(markedMounts.has(path) ? {lastStandalone: "true"} : {}, sales.sweepParameters(path, made))
            )
        }
    },
    then({rows}) {
        // 55 screen files under the root, 16 plain XML shared mounts and the tabs of Customer360, Product360 and InventoryAvailability
        rows.length > 95
        rows.some(row => row.key === "Sales/Orders/OrderDetail")
        rows.some(row => row.key === "Sales/Pipeline/LogCall" && row.marked)
        rows.every(row => row.verdict !== "error")
        lib.unclean(rows) == ""
    }
})
