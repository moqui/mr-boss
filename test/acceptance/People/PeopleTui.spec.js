// People's terminal sweep (impl-people P31; style-guide §4.8, §8.1; AGENTS.md: one sweep per app per mode, in acceptance): every
// People screen file under its root (the custom screens' terminal twins ShiftRosterTui, TeamCalendarTui, InterviewsCalendarTui and
// SkillsMatrixTui among them), each screen People's files mount from elsewhere (PeopleSpecLib.mountedScreens: Employee360,
// PeopleSelfService, PeopleMyInterview, PeopleMyPayslip, Chatter and RecordFiles, EquipmentDetail, RequestDetail, InvoiceDetail,
// WorkItemDetail, the survey builder's screens, the employees import's DataImport, Projects' time screens and Rates, Commons'
// Notifications and EventDetail) and each tab of a mount that People's menu shows, renders in the tui render mode as a document of
// the TUI model (v 1) with no error node, on the demo's records (PeopleSpecLib.sweepParameters: the demo ids, else the first record
// of its kind, else the screen's own "not available" state), as john.doe (ADMIN, who holds every PEOPLE_* and PAYROLL_* permission)
// with artifact authorization on. Then People's shared screens under Commons (SelfService, MyPayslip, MyInterview, Employee360) as
// the self-service employee (people.employee), and the clocking kiosk as a registered tablet of Retail (PeopleSpecLib.kioskTablet),
// whose tui render is the kiosk's form, not the "Not a clocking device" note a person off a device gets. TuiRender does not sweep
// People; the server-static sweep is PeopleServerStatic. Each screen's own render checks are the phases' regression specs.
// Run: ./moq accept mr-boss --spec PeopleTui
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {users, asUser, system, invoke, commonsMounts} = lib
let screens, tablet

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
// a rendered answer read as a TUI document: its status, request errors, the document and its error nodes
function read(rendered) {
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
function tui(root, path, values) {
    return read(
        ec.screen
            .makeTest()
            .rootScreen(`component://mr-boss/screen/${root}.xml`)
            .renderMode("tui")
            .render(path, Object.assign({lastStandalone: "-2"}, values || {}), null)
    )
}
// a failure line of a render, or "" when it is a TUI document with no error node
function failure(path, got) {
    if (got.status != 200 || got.errors) return `${path}: status ${got.status}, ${got.errors}`
    if (!got.doc || got.doc.v != 1) return `${path}: not a TUI document: ${got.output.substring(0, 160)}`
    if (got.nodeErrors.length) return `${path}: ${got.nodeErrors.join(" | ")}`
    return ""
}

spec({
    setupSpec() {
        login("john.doe")
        // the tablet first, by the identity and access services (as PeopleKiosk's setup)
        tablet = lib.kioskTablet("People sweep clock")
        // redeeming the code at /Device signs the browser's person out (a registered device is no one's session), so the sweep
        // signs in again
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        screens = lib.sweepScreens()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        if (tablet?.deviceId)
            system(() =>
                invoke("mantle.party.IdentityServices.revoke#SharedDevice", {
                    deviceId: tablet.deviceId,
                    reason: "People sweep done"
                })
            )
    }
})

feature(
    "every People screen, mount and mounted tab renders in tui as a model document with no error node, on the demo's records",
    {
        when() {
            const failures = []
            const unrecorded = []
            for (const path of screens) {
                const got = tui("People", path, lib.sweepParameters(path))
                const line = failure(path, got)
                if (line) failures.push(line)
                if (/is not available|Not available/.test(got.output)) unrecorded.push(path)
            }
            if (failures.length) log.warn(`People TUI failures:\n${failures.join("\n")}`)
            if (unrecorded.length) log.warn(`People TUI: rendered with no record of their kind: ${unrecorded.join(", ")}`)
            return {failures, screens}
        },
        then({failures, screens}) {
            // 96 screen files under the root, then the mounts and their tabs
            screens.length > 110
            screens.includes("Employees/Employee360")
            screens.includes("SelfService")
            screens.includes("MyInterview")
            screens.includes("MyPayslip")
            screens.includes("Time/ClockingKiosk")
            screens.includes("Time/ShiftRosterTui")
            screens.includes("Development/SkillsMatrixTui")
            screens.includes("Payroll/Rates")
            screens.includes("Employees/RequestDetail")
            screens.includes("Chatter")
            failures.join("\n") == ""
        }
    }
)

feature("People's shared screens under Commons render in tui for the self-service employee, with no error node", {
    when() {
        const failures = []
        const texts = {}
        for (const [path, parameters] of Object.entries(commonsMounts)) {
            const got = asUser(users.employee, () => tui("Commons", path, parameters))
            const line = failure("Commons/" + path, got)
            if (line) failures.push(line)
            texts[path] = got.output
        }
        if (failures.length) log.warn(`People TUI under Commons failures:\n${failures.join("\n")}`)
        return {failures, texts}
    },
    then({failures, texts}) {
        failures.join("\n") == ""
        // his own record and self-service, not a refusal
        texts["People/Employee360"].includes("Tomas")
        !/not available/i.test(texts["People/SelfService"])
    }
})

feature("the clocking kiosk renders in tui as Retail's registered tablet: its form, no note for a person, no error node", {
    when() {
        const out = lib.deviceRequest("apps/People/Time/ClockingKiosk", {}, tablet.cookie, "tui")
        const got = read({status: out.status, output: out.output, errorMessages: out.errors ? [out.errors] : []})
        return {got, line: failure("Time/ClockingKiosk (tablet)", got)}
    },
    then({got, line}) {
        !!tablet.cookie
        line == ""
        got.output.includes("IdentifyAndClock")
        !got.output.includes("Not a clocking device")
    }
})
