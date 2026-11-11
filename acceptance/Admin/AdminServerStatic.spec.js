// Admin's server-static sweep (impl-admin P19; README "Significant redesigns" 3; AGENTS.md: one sweep per app per mode, in
// acceptance): ServerStaticLib's full check (an html render with the real actions and the wrapped ec) of every Admin screen, its
// own files and the shared screen its Data area mounts (AdminSpecLib.sweepScreens; System is Tools'), on the demo's records
// (AdminSpecLib.sweepParameters), as the Admin administrator (admin.admin). It checks for errors, not content: no screen's check
// ends in an error, and a screen marked server-static="qvt" must come back clean and render its qvt page without an error.
// No Admin screen is marked yet (each reads through services that check the viewer's own permission and scope); the others
// and why are logged.
// Run: ./moq accept mr-boss --spec AdminServerStatic
const serverStatic = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, sweepScreens, sweepParameters} = lib
let screens, parameters

spec({
    setupSpec() {
        login(users.admin)
        parameters = sweepParameters()
        // [app, path, marked] of the plain XML screens (not .qvue, not placeholders)
        screens = sweepScreens()
            .map(([path, location]) => [path, String(ec.resource.getLocationReference(location).getText())])
            .filter(([, text]) => !/render-modes="[^"]*qvue/.test(text) && !text.includes('<label text="Placeholder:'))
            .map(([path, text]) => ["Admin", path, /server-static="[^"]*\bqvt\b/.test(text)])
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "the full check of every Admin XML screen ends without an error; each one marked server-static is clean and renders its qvt page",
    {
        when() {
            const rows = serverStatic.check(screens, (app, path) => parameters[path])
            const failed = rows
                .filter(row => row.marked)
                .map(row => {
                    const path = row.key.substring("Admin/".length)
                    const got = lib.asUser(users.admin, () => lib.page(path, parameters[path] || {}))
                    return got.status == 200 && !got.errors.length ? "" : `${row.key}: ${got.status} ${got.errors.join(" | ")}`
                })
                .filter(line => line)
            return {rows, failed}
        },
        then({rows, failed}) {
            rows.length > 55
            rows
                .filter(row => row.verdict === "error")
                .map(row => row.key + ": " + row.why.join("; "))
                .join("\n") == ""
            serverStatic.unclean(rows) == ""
            failed.join("\n") == ""
        }
    }
)
