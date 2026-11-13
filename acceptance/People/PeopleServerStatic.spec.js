// People's server-static sweep (impl-people P31; README "Significant redesigns" 3, mr-moqui plans/archive/QvtServerStatic.md;
// AGENTS.md: one sweep per app per mode, in acceptance): ServerStaticLib's full check (an html render with the real actions and the
// wrapped ec) of each plain XML People screen, each screen People's files mount from elsewhere (PeopleSpecLib.mountedScreens) and
// each tab of a mount that People's menu shows, on the demo's records (PeopleSpecLib.sweepParameters), as john.doe; then People's
// shared screens under Commons (SelfService, MyPayslip, MyInterview, Employee360) as the self-service employee. A screen marked
// server-static="qvt" must come back clean; the others and why are logged. ServerStaticLib leaves the screens with a qvue mode out
// (SkillsMatrix, ShiftRoster, TeamCalendar, Chatter, RecordFiles and Projects' MyTime); their terminal twins are PeopleTui's. ClockingKiosk is checked as john.doe, a
// person off a device: its device render is PeopleTui's and PeopleKiosk's.
// Run: ./moq accept mr-boss --spec PeopleServerStatic
const serverStatic = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {users, commonsMounts} = lib
let screens, commonsScreens
const mountPaths = new Set()

// [app, path, marked] of a screen mounted under People, unless it is a .qvue screen or a placeholder (as ServerStaticLib.screens
// leaves those out)
function mounted(app, path, location) {
    const text = String(ec.resource.getLocationReference(location).getText())
    if (/render-modes="[^"]*qvue/.test(text) || text.includes('<label text="Placeholder:')) return null
    return [app, path, /server-static="[^"]*\bqvt\b/.test(text)]
}
// the location of a tab a mounted screen takes from elsewhere, read from its subscreens-items
function sharedTab(location, tabName) {
    const text = String(ec.resource.getLocationReference(location).getText())
    const item = new RegExp(`<subscreens-item name="${tabName}"[^>]*location="([^"]+)"`).exec(text)
    return item ? item[1] : null
}

spec({
    setupSpec() {
        login("john.doe")
        screens = serverStatic.screens(["People"])
        const seen = new Set(screens.map(([, path]) => path))
        const locations = {}
        for (const [path, location] of lib.mountedScreens()) {
            locations[path] = location
            const row = mounted("People", path, location)
            if (row && !seen.has(path)) {
                screens.push(row)
                seen.add(path)
                mountPaths.add(path)
            }
            // a mount's tabs its menu shows: a file of the mount's own directory, or another screen it mounts
            for (const tab of lib.mountTabs(path, lib.sweepParameters(path))) {
                if (seen.has(tab)) continue
                const tabName = tab.substring(tab.lastIndexOf("/") + 1)
                const own = location.replace(/\.xml$/, "/" + tabName + ".xml")
                const tabLocation = ec.resource.getLocationReference(own).exists ? own : sharedTab(location, tabName)
                const tabRow = tabLocation ? mounted("People", tab, tabLocation) : null
                if (tabRow) {
                    screens.push(tabRow)
                    seen.add(tab)
                    mountPaths.add(tab)
                }
            }
        }
        // People's shared screens under Commons, by the locations Commons' People area mounts
        const commonsText = String(ec.resource.getLocationReference("component://mr-boss/screen/Commons/People.xml").getText())
        commonsScreens = Object.keys(commonsMounts)
            .map(path => {
                const item = new RegExp(
                    `<subscreens-item name="${path.substring("People/".length)}"[^>]*location="([^"]+)"`
                ).exec(commonsText)
                return item ? mounted("Commons", path, item[1]) : null
            })
            .filter(row => row)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the full check of every People XML screen, mount and mounted tab ends without an error; each one marked is clean", {
    when() {
        // a shared screen its owner marked server-static is checked as the qvt client loads it, its own level alone
        // (lastStandalone): its parent's header, rendered with it in a full-path html render, is no part of its template
        const markedMounts = new Set(screens.filter(([, path, marked]) => marked && mountPaths.has(path)).map(([, path]) => path))
        return {
            rows: serverStatic.check(screens, (app, path) =>
                Object.assign(markedMounts.has(path) ? {lastStandalone: "true"} : {}, lib.sweepParameters(path))
            )
        }
    },
    then({rows}) {
        // the root's plain XML files and the mounts with their tabs
        rows.length > 100
        rows.some(row => row.key === "People/Employees/Employee360")
        rows.some(row => row.key === "People/SelfService")
        rows.some(row => row.key === "People/Time/ClockingKiosk")
        rows
            .filter(row => row.verdict === "error")
            .map(row => row.key + ": " + row.why.join("; "))
            .join("\n") == ""
        serverStatic.unclean(rows) == ""
    }
})

feature("the full check of People's shared screens under Commons, as the self-service employee, ends without an error", {
    when() {
        login(users.employee)
        try {
            return {rows: serverStatic.check(commonsScreens, (app, path) => commonsMounts[path] || {})}
        } finally {
            login("john.doe")
        }
    },
    then({rows}) {
        rows.length == 4
        rows
            .filter(row => row.verdict === "error")
            .map(row => row.key + ": " + row.why.join("; "))
            .join("\n") == ""
        serverStatic.unclean(rows) == ""
    }
})
