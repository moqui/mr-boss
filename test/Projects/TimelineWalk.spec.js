// The usable-when walk of IronStone Projects P4c (impl-projects.md P4c; design-projects.md §5 Timeline and WorkItemImport, §4
// ProjectTimeline and ProjectCalendar) through the screens' transitions, with authorization on: IRON's Plan tab renders its
// Timeline and Calendar (impl-projects.md F52: AppStructure walks screen files, not tabs mounted from elsewhere); joe sees IRON's
// sprints and items on the timeline with their dependencies (one broken), the milestones view and the projects view; on a project
// of its own (TLW, john.doe its manager and joe.developer a programmer) joe makes a dependency on the timeline (a loop refused),
// moves a bar with Auto-schedule on (the item waiting for it moves on by business days), moves a due date on the project's
// calendar, and removes the dependency; bob.developer, not on the project, sees none of it and moves nothing; john imports a Jira
// CSV (test/files/jira-work-items.csv) into the project through the wizard's steps (the row without a title fails alone, named),
// and the timeline draws what came in. The project is cancelled after, so the other specs' lists keep their records.
// Run: ./moq test mr-boss --spec TimelineWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "TLW"

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
const we = (id) => sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", id).one())
const day = (value) => value == null ? null : ec.l10n.format(value, "yyyy-MM-dd")
const dates = (id) => { const row = we(id); return [day(row.estimatedStartDate), day(row.estimatedCompletionDate)] }
const timelineOf = (who, parameters) => as(who || "joe.developer", () => json("Projects/ProjectDetail/Plan/Timeline/timeline",
        Object.assign({ workEffortId: PROJECT }, parameters || {})).json)
const rowOf = (timeline, id) => Array.from(timeline.rowList || []).find((row) => row.workEffortId === id)
// the newest import of the user (an import id is the time it started and a random number)
function newestImport(userId) {
    const folder = ec.resource.getLocationReference(`dbresource://ironstone/WorkItemImport/${userId}`)
    const ids = sys(() => Array.from(folder.getDirectoryEntries() || []).map((entry) => entry.getFileName())).filter((name) => /^\d+-\d+$/.test(name))
    ids.sort((a, b) => Number(a.split("-")[0]) - Number(b.split("-")[0]))
    return ids.length ? ids[ids.length - 1] : null
}
const draftOf = (importId) => JSON.parse(sys(() => ec.resource.getLocationReference(`dbresource://ironstone/WorkItemImport/EX_JOHN_DOE/${importId}/draft.json`).getText()) || "{}")
let importId

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Timeline walk" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId, roleTypeId }).count())
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: ec.user.nowTimestamp, statusId: "WeptAssigned" })
            }
            // TLW-1 design (Mon Nov 2 to Wed Nov 4), TLW-2 build (Thu Nov 5 to Mon Nov 9), TLW-3 a due-only item
            const task = (name, start, due) => call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortName: name,
                estimatedStartDate: start, estimatedCompletionDate: due, purposeEnumId: "WepNewFeature" }).workEffortId
            task("Design", "2026-11-02", "2026-11-04")
            task("Build", "2026-11-05", "2026-11-09")
            task("Announce", null, "2026-11-20")
        })
    },
    cleanupSpec() {
        sys(() => {
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
        })
    },
})

feature("IRON's Plan tab renders its Timeline (the default) and its Calendar, each its component; the terminal lists the timeline", {
    when() {
        return {
            plan: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Plan", { workEffortId: "IRON" })),
            timeline: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Plan/Timeline", { workEffortId: "IRON" }, "qvue")),
            calendar: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Plan/Calendar", { workEffortId: "IRON" }, "qvue")),
            menuTimeline: as("joe.developer", () => render("apps/Projects/WorkItems/Timeline", { rootWorkEffortId: "IRON" }, "qvue")),
            tui: as("joe.developer", () => render("apps/Projects/WorkItems/TimelineTui", { rootWorkEffortId: "IRON" })),
            agenda: as("john.doe", () => render("apps/Projects/Projects/ProjectDetail/Plan/CalendarTui", { workEffortId: "IRON", date: "2026-10-26" })),
        }
    },
    then({ plan, timeline, calendar, menuTimeline, tui, agenda }) {
        plan.status == 200
        plan.errors == ""
        !plan.broken
        timeline.errors == ""
        timeline.output.includes("BossTimeline")
        calendar.errors == ""
        calendar.output.includes("BossCalendar")
        menuTimeline.output.includes("BossTimeline")
        tui.errors == ""
        tui.output.includes("Weekly timesheet grid")
        tui.output.includes("IRON-7")
        tui.output.includes("Sprint 2")
        agenda.errors == ""
        agenda.output.includes("Sprint 2 review")
        agenda.output.includes("Work item due")
    },
})

feature("joe sees IRON's sprints and items on the timeline with their dependencies, a parent's span, and the broken one", {
    when() {
        const timeline = as("joe.developer", () => json("Projects/ProjectDetail/Plan/Timeline/timeline", { workEffortId: "IRON" }).json?.timeline)
        const plan = as("joe.developer", () => json("WorkItems/Timeline/timeline", { rootWorkEffortId: "IRON", mode: "plan" }).json?.timeline)
        const portfolio = as("joe.developer", () => json("WorkItems/Timeline/timeline", { mode: "portfolio", projectList: "all" }).json?.timeline)
        return { timeline, plan, portfolio }
    },
    then({ timeline, plan, portfolio }) {
        timeline.mode == "items"
        timeline.project.workEffortId == "IRON"
        timeline.project.canUpdate
        rowOf(timeline, "IRON-3").startDay == "2026-10-19"
        rowOf(timeline, "IRON-3").dueDay == "2026-11-02"
        rowOf(timeline, "IRON-3").sprintId == "IRON-SP-2"
        rowOf(timeline, "IRON-8").sprintName == "Sprint 3"
        // Work items (IRON-1) spans its sub-items: from the starts of IRON-2 and IRON-5 to the due date of IRON-2
        rowOf(timeline, "IRON-1").childCount > 0
        rowOf(timeline, "IRON-1").spanStartDay == "2026-10-12"
        rowOf(timeline, "IRON-1").spanDueDay == "2026-11-13"
        rowOf(timeline, "IRON-10").startDay == null
        timeline.dependencyList.some((link) => link.workEffortId == "IRON-4" && link.toWorkEffortId == "IRON-3" && link.violated)
        timeline.dependencyList.some((link) => link.workEffortId == "IRON-8" && link.toWorkEffortId == "IRON-7")
        // IRON-14 has no dates yet: its dependency is there, not broken (the timeline draws no arrow without both bars)
        timeline.dependencyList.some((link) => link.workEffortId == "IRON-14" && link.toWorkEffortId == "IRON-8" && !link.violated)
        timeline.planItemList.some((item) => item.workEffortId == "IRON-SP-2" && item.kind == "sprint" && item.statusId == "WeInProgress")
        timeline.planItemList.some((item) => item.workEffortId == "IRON-MS-2" && item.kind == "milestone" && item.startDay == "2026-12-21")
        timeline.planItemList.some((item) => item.workEffortId == "IRON-REL-2" && item.kind == "release")
        timeline.filters.sprintOptions.length >= 2
        plan.mode == "plan"
        plan.rowList.some((row) => row.workEffortId == "IRON-MS-2" && row.rowKind == "milestone")
        plan.rowList.some((row) => row.workEffortId == "IRON-SP-3" && row.rowKind == "sprint")
        portfolio.rowList.some((row) => row.workEffortId == "IRON" && row.startDay == "2026-10-05" && row.dueDay == "2027-03-31")
        portfolio.planItemList.some((item) => item.workEffortId == "IRON-MS-2")
    },
})

feature("joe makes a dependency on the timeline; a loop is refused; bob, not on the project, sees no timeline and makes none", {
    when() {
        const saved = as("joe.developer", () => post("Projects/ProjectDetail/Plan/Timeline/saveDependency", { workEffortId: PROJECT, dependentId: "TLW-2",
            predecessorId: "TLW-1", lagDays: "1" }))
        const loop = as("joe.developer", () => post("Projects/ProjectDetail/Plan/Timeline/saveDependency", { workEffortId: PROJECT, dependentId: "TLW-1",
            predecessorId: "TLW-2" }))
        const bobSaved = as("bob.developer", () => post("Projects/ProjectDetail/Plan/Timeline/saveDependency", { workEffortId: PROJECT, dependentId: "TLW-3",
            predecessorId: "TLW-1" }))
        const bobTimeline = timelineOf("bob.developer")
        return { saved, loop, bobSaved, bobTimeline, timeline: timelineOf().timeline }
    },
    then({ saved, loop, bobSaved, bobTimeline, timeline }) {
        saved.errors == ""
        saved.json.saved
        loop.errors.includes("TLW-2 already waits for TLW-1")
        bobSaved.errors != ""
        bobTimeline.notAvailable
        bobTimeline.timeline == null
        // Build starts Thursday, the day after Design: with a day's lag it is too early
        timeline.dependencyList.length == 1
        timeline.dependencyList[0].workEffortId == "TLW-2"
        timeline.dependencyList[0].lagDays == 1
        timeline.dependencyList[0].violated
    },
})

feature("joe moves Design a day later with Auto-schedule on: Build moves on by business days past the weekend and the lag, keeping its length", {
    when() {
        const moved = as("joe.developer", () => post("Projects/ProjectDetail/Plan/Timeline/moveItem", { workEffortId: PROJECT, itemWorkEffortId: "TLW-1",
            shiftDays: "1", autoSchedule: "Y" }))
        const resized = as("joe.developer", () => post("Projects/ProjectDetail/Plan/Timeline/moveItem", { workEffortId: PROJECT, itemWorkEffortId: "TLW-3",
            dueDay: "2026-11-23" }))
        return { moved, resized, design: dates("TLW-1"), build: dates("TLW-2"), announce: dates("TLW-3"), timeline: timelineOf().timeline }
    },
    then({ moved, resized, design, build, announce, timeline }) {
        moved.errors == ""
        moved.json.movedCount == 2
        moved.json.messageInfos[0].message.includes("TLW-2")
        design == ["2026-11-03", "2026-11-05"]
        // the next business day after Thursday the 5th is Friday, a day's lag makes it Monday the 9th; three business days long (to Wednesday)
        build == ["2026-11-09", "2026-11-11"]
        resized.errors == ""
        announce == [null, "2026-11-23"]
        !timeline.dependencyList[0].violated
    },
})

feature("the project's calendar has its items by due day and the meetings linked to it; a drag moves a due date", {
    when() {
        const setup = as("joe.developer", () => json("Projects/ProjectDetail/Plan/Calendar/calendarSetup", { workEffortId: "IRON" }).json)
        const iron = as("john.doe", () => json("Projects/ProjectDetail/Plan/Calendar/calendarEvents", { workEffortId: "IRON", start: "2026-10-26", end: "2026-11-15" }).json)
        const tlw = as("joe.developer", () => json("Projects/ProjectDetail/Plan/Calendar/calendarEvents", { workEffortId: PROJECT, start: "2026-11-01", end: "2026-11-30" }).json)
        const moved = as("joe.developer", () => post("Projects/ProjectDetail/Plan/Calendar/moveEvent", { workEffortId: PROJECT, eventWorkEffortId: "TLW-3",
            start: "2026-11-24", end: "2026-11-24", allDay: "Y", scope: "all", notify: "N" }))
        const bob = as("bob.developer", () => json("Projects/ProjectDetail/Plan/Calendar/calendarEvents", { workEffortId: PROJECT, start: "2026-11-01", end: "2026-11-30" }).json)
        return { setup, iron, tlw, moved, bob, announce: dates("TLW-3") }
    },
    then({ setup, iron, tlw, moved, bob, announce }) {
        setup.project.workEffortId == "IRON"
        setup.project.canUpdate
        iron.eventList.some((event) => event.kind == "event" && event.title == "Sprint 2 review")
        iron.eventList.some((event) => event.kind == "sprint" && event.workEffortId == "IRON-SP-3" && event.start == "2026-11-02")
        iron.eventList.some((event) => event.kind == "task" && event.workEffortId == "IRON-3" && event.start == "2026-11-02" && event.movable)
        iron.eventList.some((event) => event.kind == "release" && event.workEffortId == "IRON-REL-2")
        tlw.eventList.filter((event) => event.kind == "task").map((event) => event.workEffortId).sort() == ["TLW-1", "TLW-2", "TLW-3"]
        moved.errors == ""
        announce == [null, "2026-11-24"]
        bob.eventList == null
    },
})

feature("joe removes the dependency on its DependencyForm", {
    when() {
        const removed = as("joe.developer", () => post("Projects/ProjectDetail/Plan/Timeline/removeDependency", { workEffortId: PROJECT, dependentId: "TLW-2",
            predecessorId: "TLW-1" }))
        return { removed, timeline: timelineOf().timeline }
    },
    then({ removed, timeline }) {
        removed.errors == ""
        removed.json.removed
        timeline.dependencyList.length == 0
    },
})

feature("john imports a Jira CSV into the project: the file and the project, the mapping from the Jira preset, the options and the preview", {
    when() {
        const text = ec.resource.getLocationReference("component://mr-boss/test/files/jira-work-items.csv").getText()
        // the wizard's own screen, as its root
        const wizard = sys(() => {
            const str = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Projects/WorkItems/Import.xml").renderMode("qvt").withStaticData().render("", {}, null)
            ec.message.clearErrors()
            return { errors: str.errorMessages.join(" | "), output: String(str.output || "") }
        })
        const joeWizard = as("joe.developer", () => render("apps/Projects/WorkItems/Import/Source", {}))
        const saved = post("WorkItems/Import/Source/saveSource", { workItemFile: uploadedFile("jira-work-items.csv", text, "text/csv"), presetId: "",
            characterSet: "UTF-8", rootWorkEffortId: PROJECT })
        importId = newestImport("EX_JOHN_DOE")
        const mapping = render("apps/Projects/WorkItems/Import/Mapping", { importId })
        // the mapping step's fields as the wizard posts them: each target's column, the value maps as shown
        const info = sys(() => call("ironstone.projects.WorkItemImportServices.get#ImportMappingInfo", { importId }).info)
        const fields = { importId, estimateUnit: info.estimateUnit }
        for (const target of info.targets) fields["map_" + target.fieldName] = target.column
        info.typeValues.forEach((entry, index) => { fields["vt_" + index] = entry.value === "Epic" ? "WepFeatureEnhance" : entry.mapped })
        info.statusValues.forEach((entry, index) => { fields["vs_" + index] = entry.mapped })
        info.priorityValues.forEach((entry, index) => { fields["vp_" + index] = entry.mapped })
        const savedMapping = post("WorkItems/Import/Mapping/saveMapping", fields)
        const options = post("WorkItems/Import/Options/saveOptions", { importId, createMissing: "Y", existingPolicy: "skip" })
        const preview = render("apps/Projects/WorkItems/Import/Preview", { importId })
        return { wizard, joeWizard, saved, mapping, info, savedMapping, options, preview, draft: draftOf(importId) }
    },
    then({ wizard, joeWizard, saved, mapping, info, savedMapping, options, preview, draft }) {
        wizard.errors == ""
        wizard.output.includes("m-subscreens-wizard")
        wizard.output.includes('finish-text="Import"')
        joeWizard.status != 200 || joeWizard.errors != ""
        saved.errors == ""
        importId != null
        mapping.errors == ""
        !mapping.broken
        info.presetLabel == "Jira CSV"
        info.estimateUnit == "seconds"
        info.targets.find((target) => target.fieldName == "title").column == "Summary"
        info.targets.find((target) => target.fieldName == "start").column == "Custom field (Start date)"
        info.statusValues.find((entry) => entry.value == "In Review").mapped == "WeInReview"
        savedMapping.errors == ""
        options.errors == ""
        draft.rootWorkEffortId == PROJECT
        draft.valueMaps.type.Epic == "WepFeatureEnhance"
        draft.options.existingPolicy == "skip"
        preview.errors == ""
        preview.output.includes("5 rows: 4 to create, 0 to update, 0 to skip, 1 failing, 1 with warnings")
        preview.output.includes("No title")
        preview.output.includes("someone.else")
    },
})

feature("the import makes the items with their parent, sprints and release; the row without a title fails alone, named; the timeline draws them", {
    when() {
        const ran = post("WorkItems/Import/Result/runImport", { importId })
        const result = render("apps/Projects/WorkItems/Import/Result", { importId })
        const byKey = (key) => sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("rootWorkEffortId", PROJECT).condition("sourceReferenceId", key).one())
        const assignees = (id) => sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortParty").condition("workEffortId", id).condition("roleTypeId", "Assignee").list())
                .map((row) => row.partyId))
        const epic = byKey("SHOP-1"), cart = byKey("SHOP-2"), payment = byKey("SHOP-3"), receipt = byKey("SHOP-5")
        const again = post("WorkItems/Import/Result/runImport", { importId })
        return { ran, result, draft: draftOf(importId), epic, cart, payment, receipt, cartAssignees: assignees(cart.workEffortId), again,
            timeline: timelineOf("joe.developer").timeline }
    },
    then({ ran, result, draft, epic, cart, payment, receipt, cartAssignees, again, timeline }) {
        ran.errors == ""
        draft.status == "done"
        draft.result.createdCount == 4
        draft.result.failedCount == 1
        draft.result.failureList[0].key == "SHOP-4"
        draft.result.failureList[0].error == "No title"
        result.errors == ""
        result.output.includes("Rows that failed")
        result.output.includes("SHOP-4")
        epic.purposeEnumId == "WepFeatureEnhance"
        epic.priority == 3
        cart.parentWorkEffortId == epic.workEffortId
        cart.statusId == "WeComplete"
        cart.estimatedWorkTime == 16
        cart.estimatedPoints == 5
        cartAssignees == ["ORG_ZIZI_JD"]
        payment.parentWorkEffortId == epic.workEffortId
        payment.statusId == "WeInProgress"
        receipt.parentWorkEffortId == epic.workEffortId
        // a second run of a done import answers its result and makes nothing
        again.errors == ""
        timeline.rowList.some((row) => row.workEffortId == epic.workEffortId && row.childCount == 3 && row.spanStartDay == "2026-10-05")
        timeline.planItemList.some((item) => item.kind == "sprint" && item.workEffortName == "Shop Sprint 1" && item.statusId == "WeComplete")
        timeline.planItemList.some((item) => item.kind == "sprint" && item.workEffortName == "Shop Sprint 2" && item.statusId == "WeInPlanning")
        timeline.planItemList.some((item) => item.kind == "release" && item.workEffortName == "2.0")
    },
})
