// Admin's terminal sweep (impl-admin P19; style-guide §4.8, §8.1; AGENTS.md: one sweep per app per mode, in acceptance): every
// Admin screen, its own files and the shared screen its Data area mounts (AdminSpecLib.sweepScreens; System is Tools' screens,
// ADMIN's, swept with Tools), renders in the tui render mode as a document of the TUI model (v 1) with no error node, on the
// demo's records (AdminSpecLib.sweepParameters), as the Admin administrator (admin.admin, BOSS_ADMIN_ADMIN) with artifact
// authorization on. It checks for errors, not content: a detail screen with no record of its kind shows its "not available"
// render, which is logged. Each screen's own checks are the phases' regression specs; every Admin screen is plain XML, so its
// twin is itself.
// Run: ./moq accept mr-boss --spec AdminTui
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, sweepScreens, sweepParameters} = lib
const root = "component://mr-boss/screen/Admin.xml"
let screens, parameters

// the error nodes of a TUI document, walking its nodes and a form list's cells (TuiRender's walk)
function walk(nodes, errors) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        if (node.t === "formList") for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors)
        walk(node.c, errors)
    }
}
function cellWalk(cell, errors) {
    if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors)
    else if (cell && typeof cell === "object") walk([cell], errors)
}
function tui(path, values) {
    const rendered = ec.screen
        .makeTest()
        .rootScreen(root)
        .renderMode("tui")
        .render(path, Object.assign({lastStandalone: "-2"}, values || {}), null)
    let doc = null
    try {
        doc = JSON.parse(rendered.output)
    } catch (error) {
        doc = null
    }
    const nodeErrors = []
    if (doc) walk(doc.c, nodeErrors)
    const errors = Array.from(rendered.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: rendered.status, errors, doc, nodeErrors, output: String(rendered.output || "")}
}

spec({
    setupSpec() {
        login(users.admin)
        ec.artifactExecution.enableAuthz()
        screens = sweepScreens()
        parameters = sweepParameters()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("every Admin screen renders in tui as a model document with no error node, on the demo's records", {
    when() {
        const failures = []
        const unrecorded = []
        for (const [path] of screens) {
            const got = tui(path, parameters[path])
            if (got.status != 200 || got.errors) failures.push(`${path}: status ${got.status}, ${got.errors}`)
            else if (!got.doc || got.doc.v != 1) failures.push(`${path}: not a TUI document: ${got.output.substring(0, 160)}`)
            else if (got.nodeErrors.length) failures.push(`${path}: ${got.nodeErrors.join(" | ")}`)
            if (/is not available\./.test(got.output)) unrecorded.push(path)
        }
        if (failures.length) log.warn(`Admin TUI failures:\n${failures.join("\n")}`)
        if (unrecorded.length) log.warn(`Admin TUI: rendered with no record of their kind: ${unrecorded.join(", ")}`)
        return {failures, count: screens.length}
    },
    then({failures, count}) {
        count > 55
        failures.join("\n") == ""
    }
})
