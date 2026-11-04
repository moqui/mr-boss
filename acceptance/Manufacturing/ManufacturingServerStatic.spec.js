// Server-static qvt for the Manufacturing screens (impl-manufacturing P17; README "Significant redesigns" 3): ServerStaticLib's
// full check of each plain XML Manufacturing screen with its route fixture's demo record (ManufacturingSpecLib), as john.doe. A
// screen marked server-static="qvt" must come back clean; the others and why are logged. Apart from ServerStatic so each stays
// well under 30 s.
// Run: ./moq test mr-boss --spec ManufacturingServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
let screens, routes

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["Manufacturing"])
        routes = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js").routeFixtures().routes
    }
})

feature("the full check of every Manufacturing XML screen; each one marked server-static is clean", {
    when() {
        return {rows: lib.check(screens, (app, path) => (routes[path] && routes[path].parameters) || {})}
    },
    then({rows}) {
        rows.length > 60
        rows.filter(row => row.marked).length >= 6
        lib.unclean(rows) == ""
    }
})
