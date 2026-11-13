// Server-static qvt for the Warehouse screens (impl-warehouse P18; README "Significant redesigns" 3): ServerStaticLib's full
// check of each plain XML Warehouse screen with its route fixture's demo record (WarehouseSpecLib), as john.doe. A screen marked
// server-static="qvt" must come back clean; the others and why are logged. Apart from ServerStatic so each stays well under 30 s.
// Run: ./moq test mr-boss --spec WarehouseServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
let screens, routes

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["Warehouse"])
        routes = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js").routeFixtures().routes
    }
})

feature("the full check of every Warehouse XML screen; each one marked server-static is clean", {
    when() {
        return {rows: lib.check(screens, (app, path) => (routes[path] && routes[path].parameters) || {})}
    },
    then({rows}) {
        rows.length > 40
        lib.unclean(rows) == ""
    }
})
