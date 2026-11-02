// The usable-when walk of IronStone Projects P4a (impl-projects.md P4a; design-projects.md §5 Backlog and SprintDetail) through the
// screens' transitions, with authorization on: in a project of its own (SPW, estimated in points, john.doe its manager and
// joe.developer a programmer), the project's Backlog tab says it ranks without sprints and only its manager turns sprints on; joe
// ranks the backlog by drags (one item, then a ticked pair as one), makes Sprint 1, plans items into it, starts it (a second
// start is refused while it runs), finishes two items, puts one in through the work item's Edit (a scope change with who made
// it), makes Sprint 2, and completes Sprint 1 with the open items carried over to Sprint 2; SprintDetail and the sprint report
// show it. The project is cancelled after, so the other specs' lists keep
// their records.
// Run: ./moq test mr-boss --spec SprintWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "SPW"

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), output, json: parsed }
}
function json(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), json: parsed }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
// the Backlog tab's data, as the component asks for it
const backlogOf = (who) => as(who || "joe.developer", () => json("Projects/ProjectDetail/Backlog/backlog", { workEffortId: PROJECT }).json?.backlog)
const keys = (rows) => Array.from(rows || []).map((row) => row.workEffortId)
const sprintOf = (backlog, name) => Array.from(backlog.sprintList).find((sprint) => sprint.workEffortName === name)
let sprint1, sprint2

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Sprint walk" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId, roleTypeId }).count())
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: ec.user.nowTimestamp, statusId: "WeptAssigned" })
            }
            call("mantle.work.ProjectServices.store#ProjectSetting", { workEffortId: PROJECT, settingTypeEnumId: "WstEstimateUnit", settingValue: "points" })
            call("mantle.work.ProjectServices.store#ProjectSetting", { workEffortId: PROJECT, settingTypeEnumId: "WstModules", settingValue: "code" })
            // SPW-1 an epic over SPW-2 and SPW-3; SPW-4, SPW-5 and SPW-6 at the top
            const task = (name, points, parent) => call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortName: name,
                estimatedPoints: points, parentWorkEffortId: parent || null, purposeEnumId: "WepNewFeature" }).workEffortId
            task("Checkout", null)
            task("Cart page", 3, "SPW-1")
            task("Payment step", 5, "SPW-1")
            task("Order emails", 2)
            task("Address book", 3)
            task("Gift cards", 8)
        })
    },
    cleanupSpec() {
        sys(() => {
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
        })
    },
})

feature("the Backlog tab ranks without sprints until the manager turns them on; joe may not", {
    when() {
        const before = backlogOf()
        const tab = as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Backlog", { workEffortId: PROJECT }, "qvue"))
        const refused = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/turnOnSprints", { workEffortId: PROJECT }))
        const turned = post("Projects/ProjectDetail/Backlog/turnOnSprints", { workEffortId: PROJECT })
        return { before, tab, refused, turned, after: backlogOf() }
    },
    then({ before, tab, refused, turned, after }) {
        before.project.sprintsOn == false
        before.project.canUpdate
        !before.project.canManage
        // the leaves, not the epic, by the number in the key while nothing is ranked
        keys(before.backlogList) == ["SPW-2", "SPW-3", "SPW-4", "SPW-5", "SPW-6"]
        before.backlogList[0].epicId == "SPW-1"
        before.backlogList[0].sizeText == "3"
        before.backlogTotalText == "21"
        tab.status == 200
        tab.output.includes("module.exports")
        refused.errors.includes("Only the managers of SPW change that")
        turned.json.on == true
        after.project.sprintsOn
        after.project.canUpdate
    },
})

feature("joe ranks the backlog: one item to the top, then a ticked pair after another as one", {
    when() {
        const top = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/rank", { workEffortId: PROJECT, workEffortIds: "SPW-6", nextWorkEffortId: "SPW-2" }))
        const pair = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/rank", { workEffortId: PROJECT, workEffortIds: "SPW-4,SPW-5", previousWorkEffortId: "SPW-6" }))
        return { top, pair, backlog: backlogOf() }
    },
    then({ top, pair, backlog }) {
        top.json.doneCount == 1
        pair.json.doneCount == 2
        keys(backlog.backlogList) == ["SPW-6", "SPW-4", "SPW-5", "SPW-2", "SPW-3"]
    },
})

feature("joe makes Sprint 1, plans three items into it by a drag and starts it; a second start is refused while it runs", {
    when() {
        const made = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/saveSprint", { workEffortId: PROJECT, workEffortName: "Sprint 1",
            description: "Checkout first", capacity: "12" }))
        sprint1 = made.json?.sprintWorkEffortId
        const planned = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/rank", { workEffortId: PROJECT, workEffortIds: "SPW-6,SPW-2,SPW-3",
            sprintWorkEffortId: sprint1 }))
        const started = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/startSprint", { workEffortId: PROJECT, sprintWorkEffortId: sprint1 }))
        const other = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/saveSprint", { workEffortId: PROJECT, workEffortName: "Spare" }))
        const refused = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/startSprint", { workEffortId: PROJECT, sprintWorkEffortId: other.json?.sprintWorkEffortId }))
        return { made, planned, started, refused, backlog: backlogOf() }
    },
    then({ made, planned, started, refused, backlog }) {
        sprint1 == "SPW-SP-1"
        made.json.messageInfos[0].message.includes("Sprint 1 made")
        planned.json.doneCount == 3
        started.json.started == true
        started.json.messageInfos[0].message == "Sprint 1 started with 3 work items"
        refused.errors.includes("Sprint 1 is in progress")
        keys(backlog.backlogList) == ["SPW-4", "SPW-5"]
        const sprint = sprintOf(backlog, "Sprint 1")
        sprint.state == "active"
        keys(sprint.rowList) == ["SPW-6", "SPW-2", "SPW-3"]
        sprint.totalText == "16"
        sprint.capacityText == "12"
        sprint.overCapacity == true
    },
})

feature("the team finishes two items and puts one in through the work item's Edit, a scope change with who made it", {
    when() {
        for (const id of ["SPW-2", "SPW-3"]) as("joe.developer", () => post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: id, toStatusId: "WeComplete" }))
        const edit = as("joe.developer", () => post("WorkItems/WorkItemDetail/saveWorkItem", { workEffortId: "SPW-4", sprintId: sprint1 }))
        const detail = as("joe.developer", () => sys(() => call("ironstone.projects.PlanningServices.get#SprintDetail", { workEffortId: sprint1 }).detail))
        return { edit, detail }
    },
    then({ edit, detail }) {
        edit.errors == ""
        detail.state == "active"
        detail.committed == 16
        detail.added == 2
        detail.completed == 8
        detail.remaining == 10
        detail.doneCount == 2
        detail.scopeChangeList.map((change) => `${change.workEffortId} ${change.change} ${change.userName}`) == ["SPW-4 added Joe Developer"]
    },
})

feature("joe completes Sprint 1: the open items are carried over to Sprint 2, which SprintDetail and the report show", {
    when() {
        sprint2 = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/saveSprint", { workEffortId: PROJECT, workEffortName: "Sprint 2" })).json?.sprintWorkEffortId
        const summary = as("joe.developer", () => json("Projects/ProjectDetail/Backlog/sprintSummary", { workEffortId: PROJECT, sprintWorkEffortId: sprint1 }).json?.summary)
        const completed = as("joe.developer", () => post("Projects/ProjectDetail/Backlog/completeSprint", { workEffortId: PROJECT, sprintWorkEffortId: sprint1,
            carryTo: sprint2 }))
        const backlog = backlogOf()
        const page = as("joe.developer", () => render("apps/Projects/WorkItems/SprintDetail", { workEffortId: sprint1 }))
        const report = as("joe.developer", () => render("apps/Projects/WorkItems/SprintReport", { workEffortId: sprint1 }, "html-print"))
        const terminal = as("joe.developer", () => render("apps/Projects/WorkItems/BacklogTui", { rootWorkEffortId: PROJECT }, "tui"))
        return { summary, completed, backlog, page, report, terminal }
    },
    then({ summary, completed, backlog, page, report, terminal }) {
        summary.doneCount == 2
        summary.openCount == 2
        summary.carryOptions.map((option) => option.key).includes(sprint2)
        completed.json.completed == true
        completed.json.carriedToSprintId == sprint2
        completed.json.messageInfos[0].message == "Sprint 1 complete: 2 done, 2 carried over to Sprint 2"
        backlog.sprintList.map((sprint) => sprint.workEffortName).includes("Sprint 1") == false
        keys(sprintOf(backlog, "Sprint 2").rowList) == ["SPW-6", "SPW-4"]
        keys(backlog.backlogList) == ["SPW-5"]
        page.status == 200
        !page.broken
        page.output.includes("SprintStatusBar")
        page.output.includes("Carried over")
        page.output.includes("Checkout first")
        report.output.includes("Sprint report")
        report.output.includes("Carried over")
        report.output.includes("Gift cards")
        terminal.output.includes("Sprint 2")
        terminal.output.includes("Address book")
    },
})
