// Commerce's server-static sweep (impl-commerce P15; README "Significant redesigns" 3; AGENTS.md: one sweep per app per mode,
// in acceptance): ServerStaticLib's full check of each plain XML Commerce screen, its own files and the shared screens its
// areas mount with their tabs (CommerceSpecLib.sweepScreens), on the demo's records, as the Commerce administrator. A screen
// marked server-static="qvt" must come back clean and render its qvt page without an error (impl-manufacturing F147); the
// others and why are logged. No Commerce screen is marked yet (its lists and editors load their data on the client).
// Run: ./moq accept mr-boss --spec CommerceServerStatic
const serverStatic = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {users, sweepScreens, sweepParameters, sweepParametersOf} = lib
let screens, parameters

spec({
    setupSpec() {
        login(users.admin)
        parameters = sweepParameters()
        // [app, path, marked] of the plain XML screens (not .qvue, not placeholders)
        screens = sweepScreens()
            .map(([path, location]) => [path, String(ec.resource.getLocationReference(location).getText())])
            .filter(([, text]) => !/render-modes="[^"]*qvue/.test(text) && !text.includes('<label text="Placeholder:'))
            .map(([path, text]) => ["Commerce", path, /server-static="[^"]*\bqvt\b/.test(text)])
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the full check of every Commerce XML screen; each one marked server-static is clean and renders its qvt page", {
    when() {
        const rows = serverStatic.check(screens, (app, path) => sweepParametersOf(parameters, path))
        const failed = rows
            .filter(row => row.marked)
            .map(row => {
                const path = row.key.substring("Commerce/".length)
                const got = lib.page(path, sweepParametersOf(parameters, path))
                return got.status == 200 && !got.errors.length ? "" : `${row.key}: ${got.status} ${got.errors.join(" | ")}`
            })
            .filter(line => line)
        return {rows, failed}
    },
    then({rows, failed}) {
        rows.length > 100
        rows.every(row => row.verdict !== "error")
        serverStatic.unclean(rows) == ""
        failed.join("\n") == ""
    }
})
