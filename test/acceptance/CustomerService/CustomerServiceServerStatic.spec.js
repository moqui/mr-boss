// Server-static qvt for the Customer Service screens (impl-customer-service P16; README "Significant redesigns" 3):
// ServerStaticLib's full check of each plain XML Customer Service screen with its route fixture's demo record
// (CustomerServiceSpecLib), as john.doe. A screen marked server-static="qvt" must come back clean and render its static qvt
// template without an error (impl-manufacturing F147: a clean report is not enough); the others and why are logged. Apart
// from ServerStatic so each stays well under 30 s.
// Run: ./moq accept mr-boss --spec CustomerServiceServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const customerService = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
let screens, routes

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["CustomerService"])
        routes = customerService.routeFixtures().routes
    }
})

feature("the full check of every Customer Service XML screen; each one marked server-static is clean", {
    when() {
        const rows = lib.check(screens, (app, path) => (routes[path] && routes[path].parameters) || {})
        // the marked screens' qvt page (P16 marks the two the report found clean: SplitCase and StatusCategories)
        const failed = rows
            .filter(row => row.marked)
            .map(row => {
                const path = row.key.substring("CustomerService/".length)
                const got = customerService.page(path, (routes[path] && routes[path].parameters) || {})
                return got.status == 200 && !got.errors.length ? "" : `${row.key}: ${got.status} ${got.errors.join(" | ")}`
            })
            .filter(line => line)
        return {rows, failed}
    },
    then({rows, failed}) {
        rows.length > 40
        rows.filter(row => row.marked).length >= 2
        lib.unclean(rows) == ""
        failed.join("\n") == ""
    }
})
