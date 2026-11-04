// The terminal of IronStone Projects (impl-projects.md P11; style-guide §4.8): every screen under the Projects root renders in the
// tui render mode as a document of the TUI model (v 1) with no error node, on the demo records AppStructure uses; the twins of the
// .qvue screens (MyTimeTui, BacklogTui, TimelineTui, TeamPlannerTui, ChangesTui, Commons' KnowledgeTui in ProjectDetail's Docs tab)
// show their data and their actions; and the twins' changes are walked through their transitions in a project of this spec's own
// (TUIW, john.doe its manager, joe.developer on its team), with authorization on: time logged, the timer started and stopped, the week
// submitted and returned; items moved between the backlog and a sprint, a sprint made, started and completed; an item's dates moved
// and a dependency added and removed on the timeline; an allocation moved and decided on the planner. The project is cancelled after,
// so the other specs' lists keep their records.
// Run: ./moq test mr-boss --spec ProjectsTui
const base = "component://mr-boss/screen"
const projectsRoot = `${base}/Projects.xml`
const PROJECT = "TUIW"
let screens
let ids = {}

// [path under Projects] of every screen file under the Projects root, as AppStructure finds them (placeholders aside)
function findScreenFiles() {
    const found = []
    const files = []
    ec.resource.getLocationReference(projectsRoot).walkChildTree(files, null)
    for (const file of files) {
        if (file.path === "Projects" || !file.location.endsWith(".xml")) continue
        const text = ec.resource.getLocationReference(file.location).getText()
        if (text.includes('<label text="Placeholder:')) continue
        found.push(file.path.substring("Projects".length + 1))
    }
    return found
}

// the id parameters of the screens that open on one demo record (AppStructure's demoRecords); looked-up ids are filled in setupSpec
const demoParameters = {
    "Reports/Sprints": { rootWorkEffortId: "IRON" },
    "Reports/Progress": { rootWorkEffortId: "IRON" },
    "Projects/List": { list: "all" },
    "Projects/ProjectDetail": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Overview": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Team": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Files": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Settings": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Code": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Plan": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Plan/Calendar": { workEffortId: "IRON" },
    "Projects/ProjectDetail/Plan/CalendarTui": { workEffortId: "IRON", date: "2026-10-26" },
    "Projects/ProjectDetail/Money": { workEffortId: "ACME" },
    // a SubscreensItem of the client group: refused to an internal user (F133)
    "Projects/ProjectDetail/ClientHours": { workEffortId: "ACME", refused: true },
    "Projects/StatusReport": { workEffortId: "IRON" },
    "Projects/EstimatePrint": { workEffortId: "ACME" },
    "Projects/MilestoneDetail": { workEffortId: "IRON-MS-1" },
    "Projects/ReleaseDetail": { workEffortId: "IRON-REL-2" },
    "WorkItems/List": { rootWorkEffortId: "IRON", list: "all" },
    "QuickCreate": { kind: "workItem" },
    "Requests": { list: "all" },
    "Requests/List": { list: "all" },
    "Requests/RequestDetail": { requestId: "BOSS_DEMO_PREQ_ACME1" },
    "Code/Repositories": { list: "all" },
    "Code/RepositoryDetail": { repositoryId: "iron" },
    "Code/RepositoryDetail/Files": { repositoryId: "iron" },
    "Code/RepositoryDetail/Commits": { repositoryId: "iron" },
    "Code/RepositoryDetail/Branches": { repositoryId: "iron" },
    "Code/RepositoryDetail/Tags": { repositoryId: "iron" },
    "Code/RepositoryDetail/MergeRequests": { repositoryId: "iron", list: "all" },
    "Code/RepositoryDetail/Activity": { repositoryId: "iron" },
    "Code/RepositoryDetail/Settings": { repositoryId: "iron" },
    "Code/Compare": { repositoryId: "iron", head: "IRON-3-expand-collapse" },
    "Code/CommitDetail": { repositoryId: "iron", commitId: "main" },
    "Code/MergeRequests": { list: "all" },
    "WorkItems/Backlog": { rootWorkEffortId: "IRON" },
    "WorkItems/BacklogTui": { rootWorkEffortId: "IRON" },
    "WorkItems/SprintDetail": { workEffortId: "IRON-SP-2" },
    "WorkItems/SprintReport": { workEffortId: "IRON-SP-1" },
    "WorkItems/Timeline": { rootWorkEffortId: "IRON" },
    "WorkItems/TimelineTui": { rootWorkEffortId: "IRON" },
    "Time/Timesheets": { list: "toApprove" },
    "Time/TeamTimesheet": { itemId: "SUPP-1" },
    "Time/TimeEntries": { list: "all" },
    "Resources/Allocations": { list: "all" },
    "Resources/PersonDetail": { partyId: "ORG_ZIZI_JD" },
    "Resources/PersonDetail/Overview": { partyId: "ORG_ZIZI_JD" },
    "Resources/PersonDetail/Allocations": { partyId: "ORG_ZIZI_JD" },
    "Resources/PersonDetail/WorkItems": { partyId: "ORG_ZIZI_JD" },
    "Resources/PersonDetail/Time": { partyId: "ORG_ZIZI_JD" },
    "Resources/PersonDetail/Capacity": { partyId: "ORG_ZIZI_JD" },
    "Billing/Unbilled/CreateInvoice": { workEffortId: "SUPP" },
    "Billing/Invoices": { list: "all" },
}

// the error nodes of a TUI document, and every text it shows, walking its nodes (as TuiRender.spec.js)
function walk(nodes, errors, texts, kinds) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        if (node.t) kinds.push(node.t + (node.id ? ":" + node.id : ""))
        // every text a node carries (a text's text, a dialog's title and button, a field's label, a value)
        for (const key of Object.keys(node)) if (key !== "t" && key !== "id" && typeof node[key] === "string") texts.push(node[key])
        if (node.t === "formList") for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors, texts, kinds)
        walk(node.c, errors, texts, kinds)
    }
}
function cellWalk(cell, errors, texts, kinds) {
    if (typeof cell === "string") texts.push(cell)
    else if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors, texts, kinds)
    else if (cell) walk([cell], errors, texts, kinds)
}
// a screen under Projects in the tui render mode: {status, errors, doc, nodeErrors, texts, kinds}
function tui(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(projectsRoot).renderMode("tui").render(path, Object.assign({ lastStandalone: "-2" }, parameters || {}), null)
    let doc = null
    try { doc = JSON.parse(str.output) } catch (err) { doc = null }
    const nodeErrors = [], texts = [], kinds = []
    if (doc) walk(doc.c, nodeErrors, texts, kinds)
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), doc, nodeErrors, texts, kinds, output: String(str.output || "") }
}
// the dynamic containers of a document: [{id, url}]
function containers(doc) {
    const found = []
    const visit = (nodes) => { for (const node of nodes || []) { if (node && node.t === "dynamicContainer") found.push({ id: node.id, url: node.url }); if (node) visit(node.c) } }
    if (doc) visit(doc.c)
    return found
}
// a transition of a twin posted as the terminal posts it (a tui request): {status, errors, messages, output}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(projectsRoot).renderMode("tui").render(path, parameters || {}, "post")
    const output = String(str.output || "")
    const result = { status: str.status, errors: str.errorMessages.join(" | "), messages: str.messages ? Array.from(str.messages).join(" | ") : "", output }
    ec.message.clearErrors()
    return result
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}

const day = (offset) => ec.l10n.format(new Date(Number(String(ec.user.nowTimestamp)) + offset * 86400000), "yyyy-MM-dd")
const entity = (name, condition) => sys(() => Array.from(ec.entity.find(name).condition(condition).list()))
const sprintsOf = () => entity("mantle.work.effort.WorkEffort", { rootWorkEffortId: PROJECT, workEffortTypeEnumId: "WetSprint" })
const itemOf = (id) => sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", id).one())
// a day of the walk's week (the week of Monday September 13, 2027, far from the demo's weeks and the other specs')
const WEEK = "2027-09-15"

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        screens = findScreenFiles()
        sys(() => {
            if (!ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).count()) {
                call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Terminal walk" })
                call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
                for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]])
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: ec.user.nowTimestamp, statusId: "WeptAssigned" })
                call("mantle.work.ProjectServices.store#ProjectSetting", { workEffortId: PROJECT, settingTypeEnumId: "WstEstimateUnit", settingValue: "points" })
                // TUIW-1 to TUIW-4, open leaves of the backlog
                for (const [name, points] of [["Terminal log", 3], ["Terminal backlog", 5], ["Terminal timeline", 2], ["Terminal planner", 1]])
                    call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortName: name, estimatedPoints: points, purposeEnumId: "WepNewFeature" })
            }
        })
        sys(() => {
            const mergeRequest = ec.entity.find("moqui.resource.GitMergeRequest").condition({ repositoryId: "iron", mergeRequestNum: 1 }).one()
            const mr = { mergeRequestId: mergeRequest ? mergeRequest.mergeRequestId : "_NA_" }
            for (const path of ["Code/MergeRequestDetail", "Code/MergeRequestDetail/Overview", "Code/MergeRequestDetail/Commits", "Code/MergeRequestDetail/Changes",
                "Code/MergeRequestDetail/ChangesTui"]) demoParameters[path] = mr
            ids.mergeRequestId = mr.mergeRequestId
            const sheet = Array.from(ec.entity.find("mantle.work.time.Timesheet").condition({ partyId: "ORG_ZIZI_JD", statusId: "TmshCompleted" }).list())[0]
            for (const path of ["Time/TimesheetDetail", "Time/TimesheetPrint"]) demoParameters[path] = { timesheetId: sheet ? sheet.timesheetId : "_NA_" }
            const placeholder = Array.from(ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition({ rootWorkEffortId: "ACME" })
                    .condition("partyId", "is-null", null).list())[0]
            demoParameters["Resources/Allocations/Staff"] = { workEffortAllocationId: placeholder ? placeholder.workEffortAllocationId : "_NA_" }
            const invoiceLink = Array.from(ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition({ workEffortId: "SUPP" }).list())[0]
            demoParameters["Billing/InvoicePrint"] = { invoiceId: invoiceLink ? invoiceLink.invoiceId : "_NA_" }
        })
    },
    cleanupSpec() {
        sys(() => {
            for (const row of ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("rootWorkEffortId", PROJECT).list()) { row.statusId = "WealCancelled"; row.update() }
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
        })
    },
})

feature("every Projects screen renders in tui as a model document with no error node", {
    when() {
        const failures = []
        sys(() => {
            for (const path of screens) {
                const parameters = Object.assign({}, demoParameters[path])
                const refused = !!parameters.refused
                delete parameters.refused
                const got = tui(path, parameters)
                if (refused) { if (!/is not available/.test(got.errors + got.output)) failures.push(`${path}: not refused`); continue }
                if (got.status != 200 || got.errors) failures.push(`${path}: status ${got.status}, ${got.errors}`)
                else if (!got.doc || got.doc.v != 1) failures.push(`${path}: not a TUI document: ${got.output.substring(0, 160)}`)
                else if (got.nodeErrors.length) failures.push(`${path}: ${got.nodeErrors.join(" | ")}`)
            }
        })
        if (failures.length) log.warn(`Projects TUI failures:\n${failures.join("\n")}`)
        return { failures }
    },
    then({ failures }) {
        screens.length > 60
        failures.join("\n") == ""
    },
})

feature("the twins show their data and the terminal's actions: My time, Backlog, Timeline, Team planner, Changes and the Docs tab", {
    when() {
        return sys(() => ({
            myTime: tui("Time/MyTimeTui", {}),
            backlog: tui("WorkItems/BacklogTui", { rootWorkEffortId: "IRON" }),
            timeline: tui("WorkItems/TimelineTui", { rootWorkEffortId: "IRON" }),
            planner: tui("Resources/TeamPlannerTui", {}),
            changes: tui("Code/MergeRequestDetail/ChangesTui", { mergeRequestId: ids.mergeRequestId }),
            // the Docs tab's container names the project's KnowledgeTui, which shows the project's space (IRON's is in the iron repository)
            docsTab: tui("Projects/ProjectDetail/Docs", { workEffortId: "IRON" }),
            docs: tui("Projects/ProjectDetail/KnowledgeTui", { workEffortId: "IRON" }),
            // a project with no space: says so, and its manager may set it up
            noDocs: tui("Projects/ProjectDetail/KnowledgeTui", { workEffortId: PROJECT }),
            codeHosting: !!call("ironstone.projects.CodeServices.get#CodeHosting", {}).available,
            // the plain screens the design's terminal deferrals named: a request's triage dialogs (P5) and a time entry's edit (P6b)
            triage: tui("Requests/RequestDetail", { requestId: "BOSS_DEMO_PREQ_ACME2" }),
            entryEdit: tui("Time/TimeEntries/EditEntry", { timeEntryId: Array.from(ec.entity.find("mantle.work.time.TimeEntry").condition({ partyId: "EX_JOHN_DOE" })
                .condition("thruDate", "is-not-null", null).condition("invoiceItemSeqId", "is-null", null).orderBy("-fromDate").limit(1).list())[0]?.timeEntryId || "_NA_" }),
        }))
    },
    then({ myTime, backlog, timeline, planner, changes, docsTab, docs, noDocs, codeHosting, triage, entryEdit }) {
        // My time: john.doe's week with his running timer, Stop timer, Log time and the entries' Edit and Delete
        myTime.nodeErrors.length == 0
        myTime.texts.some((text) => text.includes("Triage of the new tickets"))
        myTime.texts.includes("Stop timer")
        myTime.texts.includes("Log time")
        myTime.texts.includes("Delete")
        // Backlog: IRON's sprints and backlog, Move and the sprint dialogs
        backlog.nodeErrors.length == 0
        backlog.texts.some((text) => text.includes("Approve submitted time"))
        backlog.texts.includes("Move")
        backlog.texts.includes("New sprint")
        backlog.texts.includes("Complete sprint")
        // Timeline: Move dates and the dependency dialogs
        timeline.nodeErrors.length == 0
        timeline.texts.includes("Move dates")
        timeline.texts.includes("Add dependency")
        timeline.texts.includes("Remove dependency")
        // Team planner: Move and Decide for the Projects manager
        planner.nodeErrors.length == 0
        planner.texts.includes("Move")
        planner.texts.includes("Decide")
        // Changes: the first file's diff lines and the comment dialogs (git built in), else not available
        changes.nodeErrors.length == 0
        !codeHosting || changes.texts.includes("Comment on a line")
        !codeHosting || changes.texts.some((text) => /^[+-] /.test(text))
        // the Docs tab: its container is the project's KnowledgeTui
        docsTab.nodeErrors.length == 0
        containers(docsTab.doc).some((one) => one.id == "KnowledgeTui" && one.url.includes("ProjectDetail/KnowledgeTui"))
        docs.nodeErrors.length == 0
        !codeHosting || docs.texts.some((text) => text.includes("Open"))
        noDocs.texts.includes("This project has no documentation space yet.")
        noDocs.texts.includes("Set up documentation")
        // a submitted request's triage in the terminal: its dialogs are the plain screen's
        triage.nodeErrors.length == 0
        triage.texts.includes("Make work item")
        triage.texts.includes("Assign")
        triage.texts.includes("Set project")
        triage.texts.includes("Resolve")
        // a time entry's edit dialog renders its form in the terminal
        entryEdit.nodeErrors.length == 0
        entryEdit.kinds.some((kind) => kind.startsWith("form"))
    },
})

feature("My time in the terminal: joe logs time, starts and stops the timer, deletes an entry and submits; john.doe returns the week", {
    when() {
        const week = () => as("joe.developer", () => sys(() => call("ironstone.projects.TimeServices.get#MyWeek", { weekDate: WEEK }).myWeek))
        const twin = as("joe.developer", () => tui("Time/MyTimeTui", { weekDate: WEEK }))
        const logged = as("joe.developer", () => post("Time/MyTimeTui/logTime", { weekDate: WEEK, entryItemId: "TUIW-1", day: "2027-09-14", hours: "2.5",
            billable: "Y", comments: "Terminal entry" }))
        const second = as("joe.developer", () => post("Time/MyTimeTui/logTime", { weekDate: WEEK, entryItemId: "TUIW-1", day: "2027-09-15", hours: "1",
            billable: "N", comments: "To delete" }))
        const afterLog = week()
        const toDelete = Array.from(afterLog.entryList).find((entry) => entry.comments == "To delete")
        const deleted = as("joe.developer", () => post("Time/MyTimeTui/deleteEntry", { timeEntryId: toDelete ? toDelete.timeEntryId : "_NA_", weekDate: WEEK }))
        const started = as("joe.developer", () => post("Time/MyTimeTui/startTimer", { timerItemId: "TUIW-1", comments: "Terminal timer" }))
        const running = as("joe.developer", () => sys(() => call("mantle.work.TimesheetServices.get#Timer", {}).timer))
        const runningTwin = as("joe.developer", () => tui("Time/MyTimeTui", {}))
        const stopped = as("joe.developer", () => post("Time/MyTimeTui/stopTimer", { timeEntryId: running ? running.timeEntryId : "_NA_" }))
        const afterStop = as("joe.developer", () => sys(() => call("mantle.work.TimesheetServices.get#Timer", {}).timer))
        const submitted = as("joe.developer", () => post("Time/MyTimeTui/decide", { action: "submit", weekDate: WEEK }))
        const afterSubmit = week()
        const approverTwin = tui("Time/MyTimeTui", { partyId: "ORG_ZIZI_JD", weekDate: WEEK })
        const returned = post("Time/MyTimeTui/decide", { action: "return", partyId: "ORG_ZIZI_JD", weekDate: WEEK, timesheetId: afterSubmit.timesheet.timesheetId,
            reason: "Split the terminal entry by day" })
        const afterReturn = week()
        return { twin, logged, second, afterLog, deleted, started, running, runningTwin, stopped, afterStop, submitted, afterSubmit, approverTwin, returned, afterReturn }
    },
    then({ twin, logged, second, afterLog, deleted, started, running, runningTwin, stopped, afterStop, submitted, afterSubmit, approverTwin, returned, afterReturn }) {
        twin.nodeErrors.length == 0
        twin.texts.includes("Log time")
        twin.texts.includes("Start timer")
        logged.errors == "" && second.errors == ""
        // a tui post answers where the terminal goes next: My time on the same week
        logged.output.includes("MyTime") && logged.output.includes(WEEK)
        afterLog.entryList.some((entry) => entry.comments == "Terminal entry" && Number(entry.hours) == 2.5)
        deleted.errors == ""
        started.errors == ""
        running.workEffortId == "TUIW-1"
        runningTwin.texts.includes("Stop timer")
        stopped.errors == ""
        afterStop == null
        submitted.errors == ""
        afterSubmit.timesheet.statusId == "TmshCompleted"
        afterSubmit.entryList.length == 1
        approverTwin.texts.includes("Return")
        approverTwin.texts.includes("Approve")
        returned.errors == ""
        afterReturn.timesheet.statusId == "TmshInProcess"
        afterReturn.timesheet.reason == "Split the terminal entry by day"
    },
})

feature("the Backlog in the terminal: john.doe turns sprints on, makes a sprint, moves two items into it, starts it and completes it to the backlog", {
    when() {
        const before = tui("WorkItems/BacklogTui", { rootWorkEffortId: PROJECT })
        const turnedOn = post("WorkItems/BacklogTui/turnOnSprints", { rootWorkEffortId: PROJECT })
        const made = post("WorkItems/BacklogTui/saveSprint", { rootWorkEffortId: PROJECT, workEffortName: "Terminal sprint", description: "Ship the terminal",
            startDay: day(0), endDay: day(13), capacity: "10" })
        const sprint = sprintsOf()[0]
        const moved = post("WorkItems/BacklogTui/move", { rootWorkEffortId: PROJECT, workEffortIds: "TUIW-3,TUIW-2", sprintWorkEffortId: sprint ? sprint.workEffortId : "",
            place: "top" })
        const bottom = post("WorkItems/BacklogTui/move", { rootWorkEffortId: PROJECT, workEffortIds: "TUIW-1", place: "bottom" })
        const after = tui("WorkItems/BacklogTui", { rootWorkEffortId: PROJECT })
        const backlog = sys(() => call("ironstone.projects.PlanningServices.get#Backlog", { rootWorkEffortId: PROJECT }).backlog)
        const started = post("WorkItems/BacklogTui/startSprint", { rootWorkEffortId: PROJECT, sprintWorkEffortId: sprint ? sprint.workEffortId : "", startDay: day(0),
            endDay: day(13) })
        const active = itemOf(sprint ? sprint.workEffortId : "_NA_")
        const completed = post("WorkItems/BacklogTui/completeSprint", { rootWorkEffortId: PROJECT, sprintWorkEffortId: sprint ? sprint.workEffortId : "", carryTo: "backlog" })
        const done = itemOf(sprint ? sprint.workEffortId : "_NA_")
        const carried = itemOf("TUIW-2")
        return { before, turnedOn, made, sprint, moved, bottom, after, backlog, started, active, completed, done, carried }
    },
    then({ before, turnedOn, made, sprint, moved, bottom, after, backlog, started, active, completed, done, carried }) {
        before.texts.includes("Plan in sprints")
        !before.texts.includes("New sprint")
        turnedOn.errors == ""
        made.errors == ""
        sprint != null
        moved.errors == "" && bottom.errors == ""
        // into an empty sprint the items keep the project's order
        backlog.sprintList[0].rowList.map((row) => row.workEffortId).sort().join(",") == "TUIW-2,TUIW-3"
        backlog.backlogList.map((row) => row.workEffortId).join(",") == "TUIW-4,TUIW-1"
        after.texts.includes("Start sprint")
        started.errors == ""
        active.statusId == "WeInProgress"
        completed.errors == ""
        done.statusId == "WeComplete"
        carried.sprintId == null
    },
})

feature("the Timeline in the terminal: john.doe moves an item's dates, adds a dependency and removes it", {
    when() {
        const twin = tui("WorkItems/TimelineTui", { rootWorkEffortId: PROJECT })
        const moved = post("WorkItems/TimelineTui/moveItem", { rootWorkEffortId: PROJECT, itemWorkEffortId: "TUIW-1", startDay: "2027-02-01", dueDay: "2027-02-05",
            moveSubtree: "N", autoSchedule: "N" })
        const item = itemOf("TUIW-1")
        const shifted = post("WorkItems/TimelineTui/moveItem", { rootWorkEffortId: PROJECT, itemWorkEffortId: "TUIW-1", shiftDays: "7", moveSubtree: "N", autoSchedule: "N" })
        const shiftedItem = itemOf("TUIW-1")
        const added = post("WorkItems/TimelineTui/saveDependency", { rootWorkEffortId: PROJECT, dependentId: "TUIW-3", predecessorId: "TUIW-1", lagDays: "1" })
        const withDependency = tui("WorkItems/TimelineTui", { rootWorkEffortId: PROJECT })
        const removed = post("WorkItems/TimelineTui/removeDependency", { rootWorkEffortId: PROJECT, dependencyKey: "TUIW-3|TUIW-1" })
        const links = entity("mantle.work.effort.WorkEffortAssoc", { workEffortId: "TUIW-3", toWorkEffortId: "TUIW-1" })
        const fmt = (value) => value ? ec.l10n.format(value, "yyyy-MM-dd") : null
        return { twin, moved, start: fmt(item.estimatedStartDate), shifted, shiftedStart: fmt(shiftedItem.estimatedStartDate), added, withDependency, removed, links }
    },
    then({ twin, moved, start, shifted, shiftedStart, added, withDependency, removed, links }) {
        twin.texts.includes("Move dates")
        moved.errors == ""
        start == "2027-02-01"
        shifted.errors == ""
        shiftedStart == "2027-02-08"
        added.errors == ""
        withDependency.texts.includes("Remove dependency")
        withDependency.texts.some((text) => text.includes("TUIW-1 +1d"))
        removed.errors == ""
        links.filter((link) => !link.thruDate).length == 0
    },
})

feature("the Team planner in the terminal: john.doe moves joe's requested allocation a week later and approves it", {
    when() {
        const made = sys(() => call("ironstone.projects.ResourceServices.save#Allocation", { workEffortId: PROJECT, partyId: "ORG_ZIZI_JD", fromDate: day(7), thruDate: day(20),
            amount: "8", unit: "h", request: "Y" }))
        const id = made.workEffortAllocationId
        const twin = tui("Resources/TeamPlannerTui", { rootWorkEffortId: PROJECT })
        const millisOf = (value) => Number(String(value.getTime ? value.getTime() : value))
        const fromBefore = millisOf(sys(() => ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("workEffortAllocationId", id).one()).fromDate)
        const moved = post("Resources/TeamPlannerTui/moveAllocation", { rootWorkEffortId: PROJECT, workEffortAllocationId: id, shiftDays: "7" })
        const row = sys(() => ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("workEffortAllocationId", id).one())
        const approved = post("Resources/TeamPlannerTui/decideAllocation", { rootWorkEffortId: PROJECT, workEffortAllocationId: id, action: "approve" })
        const decided = sys(() => ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("workEffortAllocationId", id).one())
        return { id, twin, moved, shiftedDays: Math.round((millisOf(row.fromDate) - fromBefore) / 86400000), approved, status: decided.statusId }
    },
    then({ id, twin, moved, shiftedDays, approved, status }) {
        id != null
        twin.texts.includes("Decide")
        moved.errors == ""
        shiftedDays == 7
        approved.errors == ""
        status == "WealAllocated"
    },
})

feature("Changes in the terminal: a file's diff, a line comment refused off the diff, then made and resolved (with git built in)", {
    when() {
        if (!sys(() => !!call("ironstone.projects.CodeServices.get#CodeHosting", {}).available)) return { skipped: true }
        const changes = sys(() => call("ironstone.projects.CodeServices.get#MergeRequestChanges", { mergeRequestId: ids.mergeRequestId }).changes)
        const file = Array.from(changes.fileList).find((one) => Array.from(one.hunkList || []).some((hunk) => Array.from(hunk.lineList).some((line) => line.tag == "insert")))
        const line = Array.from(file.hunkList).flatMap((hunk) => Array.from(hunk.lineList)).find((one) => one.tag == "insert")
        const twin = tui("Code/MergeRequestDetail/ChangesTui", { mergeRequestId: ids.mergeRequestId, path: file.path })
        const before = new Set(entity("mantle.party.communication.CommunicationEventGitAnchor", { mergeRequestId: ids.mergeRequestId }).map((row) => row.communicationEventId))
        const offDiff = post("Code/MergeRequestDetail/ChangesTui/comment", { mergeRequestId: ids.mergeRequestId, path: file.path, lineSide: "new", lineNumber: "99999",
            body: "Not a line here" })
        const commented = post("Code/MergeRequestDetail/ChangesTui/comment", { mergeRequestId: ids.mergeRequestId, path: file.path, lineSide: "new",
            lineNumber: String(line.newNo), body: "A terminal comment" })
        const made = entity("mantle.party.communication.CommunicationEventGitAnchor", { mergeRequestId: ids.mergeRequestId }).filter((row) => !before.has(row.communicationEventId))
        const madeId = made.length ? made[0].communicationEventId : "_NA_"
        const resolved = post("Code/MergeRequestDetail/ChangesTui/resolveThread", { mergeRequestId: ids.mergeRequestId, communicationEventId: madeId, resolved: "true",
            path: file.path })
        const thread = sys(() => Array.from(call("mantle.work.GitServices.get#ReviewThreads", { mergeRequestId: ids.mergeRequestId }).threadList).find((one) => one.communicationEventId == madeId))
        // the comment is this spec's own: removed, so the demo's threads stay as the other specs read them
        sys(() => {
            for (const name of ["mantle.party.communication.CommunicationEventGitAnchor", "mantle.party.communication.CommunicationEventRecord"])
                ec.entity.find(name).condition("communicationEventId", madeId).deleteAll()
            ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", madeId).deleteAll()
        })
        return { skipped: false, twin, path: file.path, lineText: line.text, offDiff, commented, made, resolved, thread }
    },
    then({ skipped, twin, path, lineText, offDiff, commented, made, resolved, thread }) {
        skipped || twin.texts.some((text) => text.includes(lineText))
        skipped || offDiff.errors.includes("is not in the diff")
        skipped || commented.errors == ""
        skipped || made.length == 1
        skipped || resolved.errors == ""
        skipped || thread.resolved == true
    },
})
