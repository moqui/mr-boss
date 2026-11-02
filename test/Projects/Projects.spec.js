// Projects (screen/Projects/Projects/List.xml, service/ironstone/projects/ProjectServices.xml find#Projects, bulk#Projects and
// set#ProjectStatus; design-projects.md §4 Projects; impl-projects.md P2) on the Projects demo (data/BossProjectsDemoData.xml):
// the chips and the find over the projects the user sees, not templates (Joe Developer not HIRE, impl-projects.md F1), each row
// decorated (client, manager, health, items, hours, next milestone); the sub-projects under their program; the list in qvt with
// its board; a board move along the Default flow by a manager and refused for the team; the bulk changes, each project on its
// own. The spec moves back what it moves. Authorization stays on.
// Run: ./moq test mr-boss --spec Projects
const webroot = "component://webroot/screen/webroot.xml"
const projectsRoot = "component://mr-boss/screen/Projects.xml"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(projectsRoot).render(path, parameters || {}, "post")
    const output = String(str.output || "")
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
// a status set as it was, past the flow (the framework checks a status change against the flows)
const setStatus = (workEffortId, statusId) => sys(() => { const row = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", workEffortId).one(); row.statusId = statusId; row.update() })
const rows = (parameters) => sys(() => call("ironstone.projects.ProjectServices.find#Projects", Object.assign({ pageSize: 200 }, parameters || {})))
// the demo's projects (this component's data files), not those another spec made, here or in another component's run before
const demoProjects = new Set()
for (const fileRef of ec.resource.getLocationReference("component://mr-boss/data").getDirectoryEntries())
    if (fileRef.location.endsWith(".xml"))
        for (const match of String(ec.resource.getLocationText(fileRef.location) || "").matchAll(/<mantle\.work\.effort\.WorkEffort workEffortId="([^"]+)" workEffortTypeEnumId="WetProject"/g))
            demoProjects.add(match[1])
const idsOf = (out) => Array.from(out.rowList || []).map((row) => row.workEffortId).filter((id) => demoProjects.has(String(id)))

spec({
    setupSpec() { login("john.doe") },
})

feature("the chips and the find narrow the projects the user sees, templates left out, each row with its numbers", {
    when() {
        return { active: rows({}), all: rows({ list: "all" }), planned: rows({ list: "planned" }), atRisk: rows({ list: "atRisk" }),
            mine: rows({ list: "mine" }), text: rows({ list: "all", text: "portal" }), client: rows({ list: "all", clientPartyId: "ORG_ACME" }),
            health: rows({ list: "all", healthEnumId: "WehOnTrack" }), subs: rows({ list: "all", subProjects: "Y" }), program: rows({ list: "all", parentWorkEffortId: "ACME" }) }
    },
    then(found) {
        const ids = Object.fromEntries(Object.entries(found).map(([key, out]) => [key, idsOf(out)]))
        ids.active.includes("ACME")
        ids.active.includes("IRON")
        !ids.active.includes("HIRE")
        ids.all.includes("HIRE")
        !ids.all.includes("TPLWEB")
        !ids.all.includes("ACMEAPP")
        ids.planned.includes("HIRE")
        ids.atRisk == ["ACME"]
        ids.mine.includes("IRON")
        ids.text == ["ACME"]
        ids.client == ["ACME"]
        ids.health == ["IRON"]
        found.active.counts.active >= 2
        found.active.counts.all >= 3
        // the sub-project after its program, and alone with the program's filter
        ids.subs.indexOf("ACMEAPP") == ids.subs.indexOf("ACME") + 1
        ids.program == ["ACMEAPP"]
        const acme = found.all.rowList.find((row) => row.workEffortId === "ACME")
        acme.clientName == "Another Company Making Everything"
        acme.managerName == "John Doe"
        acme.healthLabel == "At Risk"
        acme.healthColor == "warning"
        acme.statusLabel == "In Progress"
        acme.nextMilestoneName == "Go live"
        acme.subProjectCount == 1
        acme.openItems == 5
        acme.doneCount == 1
        acme.hoursText == "32 of 160 h"
        acme.budgetUsedText != ""
        found.all.withMoney == true
    },
})

feature("Joe Developer sees the projects he is on and the General ones, not the Work group project HIRE, and no money", {
    when() { return as("joe.developer", () => rows({ list: "all" })) },
    then(out) {
        const ids = idsOf(out)
        ids.includes("IRON")
        ids.includes("ACME")
        !ids.includes("HIRE")
        out.withMoney == false
    },
})

feature("the list renders in qvt with its chips, find, board and bulk changes; the team gets no New project", {
    when() {
        return { list: render("apps/Projects/Projects", {}), all: render("apps/Projects/Projects", { list: "all", subProjects: "Y" }),
            joe: as("joe.developer", () => render("apps/Projects/Projects", {})) }
    },
    then({ list, all, joe }) {
        list.status == 200
        list.errors == ""
        !list.broken
        list.output.includes("Acme customer portal")
        list.output.includes("New project")
        list.output.includes("At risk")
        list.output.includes("Show sub-projects")
        list.output.includes("data-health=\"WehAtRisk\"")
        list.output.includes("Put on hold")
        all.output.includes("Acme mobile app")
        all.output.includes("Sub-projects shown")
        joe.status == 200
        !joe.broken
        !joe.output.includes("New project")
        !joe.output.includes("Hiring plan 2027")
    },
})

feature("a board move takes a project along the Default flow for a manager; the team's move is refused", {
    when() {
        const moved = post("Projects/List/moveCard", { workEffortId: "HIRE", statusId: "WeApproved" })
        const status = one("mantle.work.effort.WorkEffort", { workEffortId: "HIRE" }).statusId
        setStatus("HIRE", "WeInPlanning")
        const joe = as("joe.developer", () => post("Projects/List/moveCard", { workEffortId: "IRON", statusId: "WeOnHold" }))
        return { moved, status, joe, iron: one("mantle.work.effort.WorkEffort", { workEffortId: "IRON" }).statusId }
    },
    then({ moved, status, joe, iron }) {
        moved.errors == ""
        moved.json.messageInfos[0].message.includes("Approved")
        status == "WeApproved"
        joe.errors.includes("Only the managers of IRON")
        iron == "WeInProgress"
    },
})

feature("the bulk changes take each project on its own: a manager set, one project held and moved back", {
    when() {
        const held = post("Projects/List/bulkAction", { bulk: "hold", selectedIds: "IRON,NOPE", keep: "{\"list\":\"all\"}" })
        const ironHeld = one("mantle.work.effort.WorkEffort", { workEffortId: "IRON" }).statusId
        setStatus("IRON", "WeInProgress")
        const manager = post("Projects/List/bulkAction", { bulk: "manager", selectedIds: "HIRE", value: "ORG_ZIZI_JD", keep: "{}" })
        const pm = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: "HIRE", roleTypeId: "ProjectManager" })
                .conditionDate("fromDate", "thruDate", null).list()).map((row) => row.partyId))
        // back: John Doe the only project manager of HIRE again
        sys(() => call("mantle.work.WorkEffortServices.remove#WorkEffortParty", { workEffortId: "HIRE", partyId: "ORG_ZIZI_JD", roleTypeId: "ProjectManager" }))
        return { held, ironHeld, manager, pm }
    },
    then({ held, ironHeld, manager, pm }) {
        ironHeld == "WeOnHold"
        held.errors == ""
        manager.errors == ""
        pm == ["ORG_ZIZI_JD"]
    },
})
