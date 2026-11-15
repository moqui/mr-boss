// Marketing's server-static sweep (impl-marketing P23; design-marketing §16.3 scenario 16; README "Significant redesigns" 3, mr-moqui
// plans/archive/QvtServerStatic.md; AGENTS.md: one sweep per app per mode, in acceptance): ServerStaticLib's full check of each plain XML
// Marketing screen, the screens it mounts from elsewhere (MarketingSpecLib.mountedScreens) and each tab of a mount that Marketing's menu
// shows, on the demo's records (MarketingSpecLib.sweepParameters; a staff registration made by MarketingSpecLib.sweepMade), as john.doe.
// A screen marked server-static="qvt" must come back clean (Marketing marks none of its own; a marked tab of a mount, such as
// PageDetail's PageContent, is checked as the qvt client loads it); the others and why are logged. ServerStaticLib leaves the .qvue
// screens out (Calendar), and this spec the mounts with a qvue mode (Chatter, RecordFiles, Knowledge) and the two redirects of the old
// placeholders' routes (Newsletters, Segments); their terminal renders are MarketingTui's.
// Run: ./moq accept mr-boss --spec MarketingServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const marketing = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
let screens, made
const mountPaths = new Set()
const isMounted = path => mountPaths.has(path)

// [app, path, marked] of a screen mounted under Marketing, unless it is a .qvue screen or a placeholder (as ServerStaticLib.screens
// leaves those out)
function mounted(path, location) {
    const text = String(ec.resource.getLocationReference(location).getText())
    if (/render-modes="[^"]*qvue/.test(text) || text.includes('<label text="Placeholder:')) return null
    return ["Marketing", path, /server-static="[^"]*\bqvt\b/.test(text)]
}
// the location of a tab a mounted screen mounts from elsewhere, read from its subscreens-items
function sharedTab(location, tabName) {
    const text = String(ec.resource.getLocationReference(location).getText())
    const item = new RegExp(`<subscreens-item name="${tabName}"[^>]*location="([^"]+)"`).exec(text)
    return item ? item[1] : null
}

spec({
    setupSpec() {
        login("john.doe")
        made = marketing.sweepMade()
        login("john.doe")
        const redirects = marketing.redirectScreens()
        screens = lib.screens(["Marketing"]).filter(([, path]) => !redirects.includes(path))
        const seen = new Set(screens.map(([, path]) => path))
        for (const [path, location] of marketing.mountedScreens()) {
            const row = mounted(path, location)
            if (row && !seen.has(path)) {
                screens.push(row)
                seen.add(path)
                mountPaths.add(path)
            }
            // a mount's tabs its menu shows: a file of the mount's own directory, or another screen it mounts
            for (const tab of marketing.mountTabs(path, marketing.sweepParameters(path, made))) {
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

feature("the full check of every Marketing XML screen, mount and mounted tab; each one marked server-static is clean", {
    when() {
        // a mounted tab its owner marked server-static is checked as the qvt client loads it, its own level alone (lastStandalone)
        const markedMounts = new Set(screens.filter(([, path, marked]) => marked && isMounted(path)).map(([, path]) => path))
        return {
            rows: lib.check(screens, (app, path) =>
                Object.assign(markedMounts.has(path) ? {lastStandalone: "true"} : {}, marketing.sweepParameters(path, made))
            )
        }
    },
    then({rows}) {
        // 66 plain XML screen files under the root, about 22 plain XML mounts and their tabs
        rows.length > 80
        rows.some(row => row.key === "Marketing/Sends/SendDetail")
        rows.some(row => row.key === "Marketing/Sends/CampaignDelivery")
        rows.some(row => row.key === "Marketing/Surveys/Responses")
        rows.some(row => row.key === "Marketing/Events/EventDetail")
        !rows.some(row => row.key === "Marketing/Calendar")
        rows.every(row => row.verdict !== "error")
        lib.unclean(rows) == ""
    }
})
