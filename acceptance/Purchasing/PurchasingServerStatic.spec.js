// Server-static qvt for the Purchasing screens (impl-purchasing P17; README "Significant redesigns" 3): ServerStaticLib's full
// check of each plain XML Purchasing screen with its route fixture's demo record (PurchasingSpecLib), as john.doe. A screen
// marked server-static="qvt" must come back clean and render its static qvt template without an error (impl-manufacturing
// F147: a clean report is not enough); the others and why are logged. Apart from ServerStatic so each stays well under 30 s.
// Run: ./moq accept mr-boss --spec PurchasingServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const purchasing = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
let screens, routes

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["Purchasing"])
        routes = purchasing.routeFixtures().routes
    }
})

feature("the full check of every Purchasing XML screen; each one marked server-static is clean", {
    when() {
        const rows = lib.check(screens, (app, path) => (routes[path] && routes[path].parameters) || {})
        // the marked screens' qvt page (P17 marks the three quick creates and ProductFind)
        const failed = rows
            .filter(row => row.marked)
            .map(row => {
                const path = row.key.substring("Purchasing/".length)
                const got = purchasing.page(path, (routes[path] && routes[path].parameters) || {})
                return got.status == 200 && !got.errors.length ? "" : `${row.key}: ${got.status} ${got.errors.join(" | ")}`
            })
            .filter(line => line)
        return {rows, failed}
    },
    then({rows, failed}) {
        rows.length > 40
        rows.filter(row => row.marked).length >= 4
        lib.unclean(rows) == ""
        failed.join("\n") == ""
    }
})
