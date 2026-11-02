// Commons Tasks and TaskDetail (screen/Commons/Tasks/List.xml and TaskDetail.xml, service/ironstone/commons/TaskServices.xml,
// template/StatusBar.xml; impl-drawers-commons.md M6, design-drawers-commons.md §8): john.doe's smart lists on the demo
// (data/BossDemoData.xml, DemoServices.load#TasksDemo with the Today demo of load#CommonsDemo); the list with its chips, the
// quick-add row, the done checks, the in-place due and priority, the bulk actions and the row actions; TaskDetail with its
// stage chips, tabs and actions: complete through the status action, reassign, set due, clone, convert to request, time
// (clock in and out, add time), add to Today, sub-tasks and delete own; the list's board (a card moved to another status
// column, along the flow) and calendar (a task moved to another day, a task added on an empty day). A task Joe Developer is
// not on is "not available" to him and its changes are refused (IronStone R5, R28). The spec changes only the tasks it makes (BOSS_TEST_* names),
// so the demo stays for the specs after it. Authorization stays on, as for a browser request.
// Run: ./moq test mr-boss --spec Tasks
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
let todayText, tomorrowText, inThreeText
const made = {}

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
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
// the stages of the framework's status-bar (m-status-bar :bar, as get#StatusBar answered it): statusId to "state color"
const stagesOf = (output) => Object.fromEntries(Array.from(output.matchAll(/\{'statusId':'([^']+)','label':'(?:[^'\\]|\\.)*','color':'([^']*)','state':'(\w+)'\}/g))
        .map((match) => [match[1], match[3] + " " + match[2]]))
// the transitions of the status-bar: label to "next", "danger" or "other"
const transitionsOf = (output) => Object.fromEntries(Array.from(output.matchAll(/'label':'((?:[^'\\]|\\.)*)','color':'[^']*','isNext':(true|false),'isDanger':(true|false)/g))
        .map((match) => [match[1], match[2] === "true" ? "next" : match[3] === "true" ? "danger" : "other"]))
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const all = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
// a smart list as the screen asks for it, every row on one page
const rows = (list, parameters) => sys(() => call("ironstone.commons.TaskServices.find#TaskRows", Object.assign({ list, pageSize: 200 }, parameters || {})))
const idsOf = (out) => (out.rowList || []).map((row) => row.workEffortId)
const dayOf = (value) => value == null || value === "" ? "" : ec.l10n.format(value, "yyyy-MM-dd")
const keep = (map) => JSON.stringify(map || { list: "all" })
// a task of john.doe's made through the quick-add row, by its name
function quickAdd(name, dueDate, list) {
    const added = post("Tasks/List/quickAdd", { workEffortName: name, dueDate: dueDate || "", list: list || "all", keep: keep({ list: list || "all" }) })
    const task = all("mantle.work.effort.WorkEffort", { workEffortName: name })[0] || null
    return { added, task, id: task ? task.workEffortId : null }
}

spec({
    setupSpec() {
        login("john.doe")
        todayText = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const start = Number(String(ec.l10n.parseTimestamp(todayText + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")))
        tomorrowText = ec.l10n.format(String(start + 30 * 3600000), "yyyy-MM-dd")
        inThreeText = ec.l10n.format(String(start + 78 * 3600000), "yyyy-MM-dd")
        // the demo again, so this spec sees its records as loaded whatever ran before
        sys(() => call("ironstone.commons.DemoServices.load#TasksDemo", {}))
    },
})

feature("each smart list has john.doe's tasks of the demo, with the counts of every list", {
    when() {
        const lists = {}
        for (const list of ["all", "today", "week", "overdue", "assigned", "created", "watching", "done"]) lists[list] = rows(list)
        return { lists, ids: Object.fromEntries(Object.entries(lists).map(([key, out]) => [key, idsOf(out)])), counts: lists.all.counts }
    },
    then({ lists, ids, counts }) {
        // all open: the project's tasks, the watched one and the one from Joe; nothing done
        ids.all.includes("BOSS_DEMO_TASK_PLAN")
        ids.all.includes("BOSS_DEMO_TASK_FROMJOE")
        ids.all.includes("BOSS_DEMO_TASK_WATCH")
        ids.all.includes("BOSS_DEMO_SUB_FLOORPLAN")
        !ids.all.includes("BOSS_DEMO_SUB_BOXES")
        // today: the Today demo's call and shared task
        ids.today.includes("BOSS_DEMO_TODAY_CALL")
        ids.today.includes("BOSS_DEMO_TODAY_DUE")
        !ids.today.includes("BOSS_DEMO_TASK_PLAN")
        // the next seven days, today on; not overdue, not without a due date
        ids.week.includes("BOSS_DEMO_TASK_PLAN")
        ids.week.includes("BOSS_DEMO_SUB_MOVERS")
        ids.week.includes("BOSS_DEMO_TASK_WATCH")
        ids.week.includes("BOSS_DEMO_TODAY_DUE")
        !ids.week.includes("BOSS_DEMO_TASK_FROMJOE")
        !ids.week.includes("BOSS_DEMO_TODAY_OVERDUE")
        ids.overdue.includes("BOSS_DEMO_TODAY_OVERDUE")
        !ids.overdue.includes("BOSS_DEMO_TASK_PLAN")
        // assigned to me, from Joe too; not the one john.doe watches or gave Joe
        ids.assigned.includes("BOSS_DEMO_TASK_FROMJOE")
        ids.assigned.includes("BOSS_DEMO_TASK_PLAN")
        !ids.assigned.includes("BOSS_DEMO_TASK_WATCH")
        !ids.assigned.includes("BOSS_DEMO_SUB_FLOORPLAN")
        // created by me: the floor plan john.doe gave Joe; not what Joe made
        ids.created.includes("BOSS_DEMO_SUB_FLOORPLAN")
        ids.created.includes("BOSS_DEMO_TASK_PLAN")
        !ids.created.includes("BOSS_DEMO_TASK_FROMJOE")
        !ids.created.includes("BOSS_DEMO_TASK_WATCH")
        ids.watching.includes("BOSS_DEMO_TASK_WATCH")
        !ids.watching.includes("BOSS_DEMO_TASK_PLAN")
        ids.done.includes("BOSS_DEMO_SUB_BOXES")
        !ids.done.includes("BOSS_DEMO_TASK_PLAN")
        // the counts are those of the lists
        counts.today == ids.today.length
        counts.watching == ids.watching.length
        counts.done == ids.done.length
        counts.all >= 6
        // a row: its project, record, assignees and what john.doe may do
        const plan = lists.all.rowList.find((row) => row.workEffortId === "BOSS_DEMO_TASK_PLAN")
        plan.projectName == "Office move"
        plan.statusLabel == "In Progress"
        plan.statusColor == "primary"
        plan.canUpdate
        plan.priorityText == "2"
        plan.url == "/qapps/Commons/Tasks/TaskDetail?workEffortId=BOSS_DEMO_TASK_PLAN"
        const call_ = lists.today.rowList.find((row) => row.workEffortId === "BOSS_DEMO_TODAY_CALL")
        call_.recordCaption.includes("Set up the shared team calendar")
        call_.recordUrl == "/qapps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST"
        call_.dueText.startsWith("Today")
        const watched = lists.watching.rowList.find((row) => row.workEffortId === "BOSS_DEMO_TASK_WATCH")
        !watched.canUpdate
        watched.assigneeText == "Joe Developer"
        lists.overdue.rowList[0].overdue
    },
})

feature("the find narrows a list: text, status, purpose, project, due period and a linked record", {
    when() {
        return {
            text: idsOf(rows("all", { text: "floor plan" })),
            status: idsOf(rows("all", { statusId: "WeInProgress" })),
            doneStatus: idsOf(rows("assigned", { statusId: "WeComplete" })),
            purpose: idsOf(rows("all", { purposeEnumId: "WepPhoneCall" })),
            project: idsOf(rows("all", { rootWorkEffortId: "BOSS_DEMO_PROJECT" })),
            record: idsOf(rows("all", { recordId: "BOSS_DEMO_REQUEST" })),
            due: idsOf(rows("all", { dueFrom: ec.l10n.parseTimestamp(todayText + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS"),
                dueThru: ec.l10n.parseTimestamp(tomorrowText + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS") })),
            sorted: idsOf(rows("all", { rootWorkEffortId: "BOSS_DEMO_PROJECT", orderByField: "priority" })),
        }
    },
    then({ text, status, doneStatus, purpose, project, record, due, sorted }) {
        text == ["BOSS_DEMO_SUB_FLOORPLAN"]
        status.includes("BOSS_DEMO_TASK_PLAN")
        !status.includes("BOSS_DEMO_SUB_MOVERS")
        // a status in the find takes the place of the list's open
        doneStatus.includes("BOSS_DEMO_SUB_BOXES")
        purpose.includes("BOSS_DEMO_TODAY_CALL")
        !purpose.includes("BOSS_DEMO_TASK_PLAN")
        project.includes("BOSS_DEMO_TASK_PLAN")
        project.includes("BOSS_DEMO_SUB_MOVERS")
        !project.includes("BOSS_DEMO_TASK_WATCH")
        record.includes("BOSS_DEMO_TODAY_CALL")
        !record.includes("BOSS_DEMO_TASK_PLAN")
        due.includes("BOSS_DEMO_TODAY_DUE")
        !due.includes("BOSS_DEMO_TASK_PLAN")
        sorted[0] == "BOSS_DEMO_TASK_PLAN"
    },
})

feature("the list renders in qvt with the chips and counts, the views, the find, the quick-add row, the done checks and the in-place edits", {
    // a task without a due date sorts after the dated ones, past the first page once the demo's project items have dates (P4c): found by its text
    when() { return { shown: render("apps/Commons/Tasks", {}), found: render("apps/Commons/Tasks", { text: "backup restore" }),
        week: render("apps/Commons/Tasks", { list: "week" }), done: render("apps/Commons/Tasks", { list: "done", pageNoLimit: "true" }) } },
    then({ shown, found, week, done }) {
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes("All open · ")
        shown.output.includes("Next 7 days · ")
        shown.output.includes("Watching · ")
        // the views of the list: the board by status and the calendar by due day, over the rows of the page; no more links away
        shown.output.includes('<m-list-views id="Tasks_views"')
        shown.output.includes("moveTaskStatus")
        shown.output.includes("moveTaskDue")
        shown.output.includes("calendarAdd")
        !shown.output.includes("Projects/WorkItems")
        !shown.output.includes("showTasks")
        shown.output.includes("v-slot:card_0")
        shown.output.includes("Add a task")
        shown.output.includes('id="Tasks_table"')
        shown.output.includes("Plan the office move")
        found.output.includes("Check the backup restore")
        shown.output.includes("<m-editable")
        shown.output.includes("updateTaskField")
        shown.output.includes("sym_o_radio_button_unchecked")
        shown.output.includes("Move to project")
        shown.output.includes("Set priority")
        shown.output.includes('<m-screen-context selection-form="Tasks"')
        // the watched task is Joe's: no done check or in-place edit on it, as on the others
        week.status == 200
        !week.broken
        week.output.includes("Renew the domain name")
        !week.output.includes("Check the backup restore")
        done.output.includes("Order packing boxes")
        done.output.includes("sym_o_check_circle")
    },
})

feature("the quick-add row makes a task for john.doe, due on the date given, or today on the Today list", {
    when() {
        const dated = quickAdd("BOSS_TEST Buy a label printer", tomorrowText, "week")
        const today = quickAdd("BOSS_TEST Call the landlord", "", "today")
        made.printer = dated.id
        made.landlord = today.id
        return { dated, today, assignees: current("mantle.work.effort.WorkEffortParty", { workEffortId: dated.id, roleTypeId: "Assignee" }),
            week: idsOf(rows("week")), todayIds: idsOf(rows("today")) }
    },
    then({ dated, today, assignees, week, todayIds }) {
        dated.added.errors == ""
        dated.id != null
        dated.task.ownerPartyId == "EX_JOHN_DOE"
        dayOf(dated.task.estimatedCompletionDate) == tomorrowText
        assignees.length == 1
        assignees[0].partyId == "EX_JOHN_DOE"
        week.includes(dated.id)
        today.added.errors == ""
        dayOf(today.task.estimatedCompletionDate) == todayText
        todayIds.includes(today.id)
    },
})

feature("the due date and the priority change in place, as JSON for m-editable; a task john.doe may not change is refused", {
    allowMessageErrors: true,
    when() {
        const due = post("Tasks/List/updateTaskField", { workEffortId: made.printer, field: "due", value: inThreeText })
        const priority = post("Tasks/List/updateTaskField", { workEffortId: made.printer, field: "priority", value: "2" })
        const loaded = post("Tasks/List/taskFieldValue", { workEffortId: made.printer, field: "due" })
        const watched = post("Tasks/List/updateTaskField", { workEffortId: "BOSS_DEMO_TASK_WATCH", field: "priority", value: "1" })
        return { due, priority, loaded, watched, task: one("mantle.work.effort.WorkEffort", { workEffortId: made.printer }),
            watchedTask: one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_TASK_WATCH" }) }
    },
    then({ due, priority, loaded, watched, task, watchedTask }) {
        due.errors == ""
        due.json.valueText == inThreeText
        due.json.messageInfos[0].message.includes("due " + inThreeText)
        priority.errors == ""
        priority.json.valueText == "2"
        loaded.json.value == inThreeText
        dayOf(task.estimatedCompletionDate) == inThreeText
        // a date only keeps the time of day: none
        ec.l10n.format(task.estimatedCompletionDate, "HH:mm") == "00:00"
        task.priority == 2
        watched.status == 500
        watched.errors.includes("You may not change task BOSS_DEMO_TASK_WATCH")
        watchedTask.priority == 3
    },
})

feature("the bulk actions take each selected task on its own: complete, reassign, set due, set priority, move to project", {
    when() {
        const ids = ["BOSS_TEST Bulk one", "BOSS_TEST Bulk two", "BOSS_TEST Bulk three"].map((name) => quickAdd(name, "", "all").id)
        made.bulk = ids
        const selected = ids.slice(0, 2).join(",")
        const due = post("Tasks/List/bulkAction", { bulk: "setDue", selectedTaskIds: selected, dueDate: tomorrowText, keep: keep() })
        const priority = post("Tasks/List/bulkAction", { bulk: "setPriority", selectedTaskIds: ids.join(","), priority: "8", keep: keep() })
        const moved = post("Tasks/List/bulkAction", { bulk: "moveToProject", selectedTaskIds: selected, projectId: "BOSS_DEMO_PROJECT", keep: keep() })
        // the watched task is not john.doe's to complete: it is skipped, the others are done
        const completed = post("Tasks/List/bulkAction", { bulk: "complete", selectedTaskIds: ids[0] + ",BOSS_DEMO_TASK_WATCH," + ids[1], keep: keep() })
        const reassigned = post("Tasks/List/bulkAction", { bulk: "reassign", selectedTaskIds: ids[2], assignToPartyId: "ORG_ZIZI_JD", keep: keep() })
        const outOfProject = post("Tasks/List/bulkAction", { bulk: "moveToProject", selectedTaskIds: ids[1], projectId: "", keep: keep() })
        const tasks = ids.map((id) => one("mantle.work.effort.WorkEffort", { workEffortId: id }))
        return { due, priority, moved, completed, reassigned, outOfProject, tasks, watched: one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_TASK_WATCH" }),
            thirdAssignees: current("mantle.work.effort.WorkEffortParty", { workEffortId: ids[2], roleTypeId: "Assignee" }).map((row) => row.partyId),
            done: idsOf(rows("done")) }
    },
    allowMessageErrors: true,
    then({ due, priority, moved, completed, reassigned, outOfProject, tasks, watched, thirdAssignees, done }) {
        due.errors == ""
        priority.errors == ""
        moved.errors == ""
        completed.errors == ""
        reassigned.errors == ""
        outOfProject.errors == ""
        dayOf(tasks[0].estimatedCompletionDate) == tomorrowText
        dayOf(tasks[1].estimatedCompletionDate) == tomorrowText
        tasks[2].estimatedCompletionDate == null
        tasks.every((task) => task.priority == 8)
        tasks[0].rootWorkEffortId == "BOSS_DEMO_PROJECT"
        tasks[1].rootWorkEffortId == null
        tasks[0].statusId == "WeComplete"
        tasks[1].statusId == "WeComplete"
        tasks[2].statusId == "WeInPlanning"
        watched.statusId != "WeComplete"
        thirdAssignees == ["ORG_ZIZI_JD"]
        done.includes(tasks[0].workEffortId)
    },
})

feature("the row actions: the done check completes a task and opens it again; Add to Today makes it due today", {
    when() {
        const doneOnce = post("Tasks/List/toggleDone", { workEffortId: made.landlord, keep: keep({ list: "today" }) })
        const afterDone = one("mantle.work.effort.WorkEffort", { workEffortId: made.landlord })
        const doneTwice = post("Tasks/List/toggleDone", { workEffortId: made.landlord, keep: keep({ list: "done" }) })
        const afterOpen = one("mantle.work.effort.WorkEffort", { workEffortId: made.landlord })
        const toToday = post("Tasks/List/addToToday", { workEffortId: made.printer, keep: keep() })
        const today = sys(() => call("mantle.work.WorkEffortServices.get#UserTodayItems", {}))
        return { doneOnce, afterDone, doneTwice, afterOpen, toToday, printer: one("mantle.work.effort.WorkEffort", { workEffortId: made.printer }),
            onToday: (today.dueToday || []).some((item) => item.workEffortId === made.printer) }
    },
    then({ doneOnce, afterDone, doneTwice, afterOpen, toToday, printer, onToday }) {
        doneOnce.errors == ""
        afterDone.statusId == "WeComplete"
        afterDone.resolutionEnumId == "WerCompleted"
        afterDone.actualCompletionDate != null
        doneTwice.errors == ""
        afterOpen.statusId == "WeInProgress"
        afterOpen.actualCompletionDate == null
        toToday.errors == ""
        dayOf(printer.estimatedCompletionDate) == todayText
        onToday
    },
})

feature("the board moves a task's status along the flow and refuses a move the flow has not; the calendar moves its due day and adds a task on an empty day", {
    allowMessageErrors: true,
    when() {
        const task = quickAdd("BOSS_TEST Board card", tomorrowText, "week").id
        made.board = task
        const status = () => one("mantle.work.effort.WorkEffort", { workEffortId: task }).statusId
        // the row as the views read it: the key, the group, the due day as a whole day
        const row = rows("week").rowList.find((entry) => entry.workEffortId === task)
        // In Planning to On Hold: the flow has no such step, so the card goes back
        const held = post("Tasks/List/moveTaskStatus", { workEffortId: task, toStatusId: "WeOnHold" })
        const afterHeld = status()
        const begun = post("Tasks/List/moveTaskStatus", { workEffortId: task, toStatusId: "WeInProgress" })
        const afterBegin = status()
        const completed = post("Tasks/List/moveTaskStatus", { workEffortId: task, toStatusId: "WeComplete" })
        const afterComplete = one("mantle.work.effort.WorkEffort", { workEffortId: task })
        // the calendar: to another day, as the in-place edit (the time of day stays)
        const moved = post("Tasks/List/moveTaskDue", { workEffortId: task, estimatedCompletionDate: inThreeText })
        const afterMove = one("mantle.work.effort.WorkEffort", { workEffortId: task })
        const added = post("Tasks/List/calendarAdd", { workEffortName: "BOSS_TEST Calendar add", estimatedCompletionDate: tomorrowText, dueAllDay: "Y", list: "all" })
        const addedTask = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST Calendar add" })[0] || null
        made.calendarAdd = addedTask ? addedTask.workEffortId : null
        return { row, held, afterHeld, begun, afterBegin, completed, afterComplete, moved, afterMove, added, addedTask,
            addedAssignees: addedTask ? current("mantle.work.effort.WorkEffortParty", { workEffortId: addedTask.workEffortId, roleTypeId: "Assignee" }) : [] }
    },
    then({ row, held, afterHeld, begun, afterBegin, completed, afterComplete, moved, afterMove, added, addedTask, addedAssignees }) {
        row.statusId == "WeInPlanning"
        row.estimatedCompletionDate == tomorrowText
        row.dueAllDay == "Y"
        row.workEffortName == "BOSS_TEST Board card"
        held.status == 500
        held.errors.includes("Status change not allowed from In Planning to On Hold")
        afterHeld == "WeInPlanning"
        begun.errors == ""
        begun.json.messageInfos[0].message == "BOSS_TEST Board card: In Progress"
        afterBegin == "WeInProgress"
        completed.errors == ""
        afterComplete.statusId == "WeComplete"
        afterComplete.resolutionEnumId == "WerCompleted"
        afterComplete.actualCompletionDate != null
        moved.errors == ""
        moved.json.messageInfos[0].message.includes("due " + inThreeText)
        dayOf(afterMove.estimatedCompletionDate) == inThreeText
        ec.l10n.format(afterMove.estimatedCompletionDate, "HH:mm") == "00:00"
        added.errors == ""
        addedTask != null
        dayOf(addedTask.estimatedCompletionDate) == tomorrowText
        addedTask.ownerPartyId == "EX_JOHN_DOE"
        addedAssignees.length == 1
    },
})

feature("the calendar asks for the tasks due on the dates it shows (range-find), so a task past the list's page shows in its range", {
    when() {
        // 26 tasks of john.doe's due a day apart from 400 days on: the list's page (25, by due) leaves out the last
        const start = Number(String(ec.l10n.parseTimestamp(todayText + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")))
        const dayStart = (offset) => Number(String(ec.l10n.parseTimestamp(ec.l10n.format(String(start + offset * 86400000 + 6 * 3600000), "yyyy-MM-dd")
                + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")))
        const ids = []
        for (let i = 0; i < 26; i++) ids.push(quickAdd(`BOSS_TEST Range ${String(i + 1).padStart(2, "0")}`,
            ec.l10n.format(String(dayStart(400 + i) + 6 * 3600000), "yyyy-MM-dd"), "all").id)
        const last = ids[25]
        // the form request the calendar asks (the screen's actions, the list's rows as JSON), with the list's find and without
        const ask = (parameters) => {
            const str = ec.screen.makeTest().rootScreen(commons).render("Tasks/List/actions/Tasks", Object.assign({ list: "all", text: "BOSS_TEST Range" }, parameters || {}), null)
            let json = null
            try { json = JSON.parse(String(str.output || "")) } catch (err) { json = null }
            ec.message.clearErrors()
            return { status: str.status, ids: ((json && json.taskRows) || []).map((row) => row.workEffortId) }
        }
        const page = ask({})
        // the month the last one is in, as the calendar asks for it: a day wider each side, thru inclusive, no paging
        const range = ask({ estimatedCompletionDate_from: String(dayStart(424 - 1)), estimatedCompletionDate_thru: String(dayStart(425 + 2) - 1), pageNoLimit: "true" })
        // dates with none of them due
        const empty = ask({ estimatedCompletionDate_from: String(dayStart(10)), estimatedCompletionDate_thru: String(dayStart(20) - 1), pageNoLimit: "true" })
        // another list's find stays: Done has none of them
        const done = ask({ list: "done", estimatedCompletionDate_from: String(dayStart(399)), estimatedCompletionDate_thru: String(dayStart(430) - 1), pageNoLimit: "true" })
        const shown = render("apps/Commons/Tasks", { text: "BOSS_TEST Range" })
        // taken out of john.doe's open lists again, so the specs after this one see the demo as it was
        sys(() => ids.forEach((id) => { const row = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", id).one(); row.statusId = "WeCancelled"; row.update() }))
        return { ids, last, page, range, empty, done, shown }
    },
    then({ ids, last, page, range, empty, done, shown }) {
        ids.length == 26
        page.status == 200
        page.ids.length == 25
        !page.ids.includes(last)
        range.status == 200
        range.ids.includes(last)
        range.ids.includes(ids[24])
        range.ids.includes(ids[23])
        !range.ids.includes(ids[0])
        empty.ids == []
        done.ids == []
        shown.errors == ""
        shown.output.includes("'rangeFind':true")
        shown.output.includes("/actions/Tasks")
        shown.output.includes("'listName':'taskRows'")
    },
})

feature("TaskDetail renders the task with its stage chips, the next status as the primary action, the facts, the tabs and Chatter", {
    when() {
        return { overview: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TASK_PLAN" }),
            subtasks: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TASK_PLAN", tab: "subtasks" }),
            time: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TASK_PLAN", tab: "time" }),
            files: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TASK_PLAN", tab: "files" }),
            watched: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TASK_WATCH" }) }
    },
    then({ overview, subtasks, time, files, watched }) {
        overview.status == 200
        overview.errors == ""
        !overview.broken
        overview.output.includes("Plan the office move")
        // an assignee who is a user has an avatar with the user id (the user's photo)
        /<m-avatar name="[^"]*" user-id="EX_JOHN_DOE"/.test(overview.output)
        stagesOf(overview.output) == { WeInPlanning: "done grey-7", WeInProgress: "current primary", WeComplete: "todo positive" }
        // the next status, Complete, is the primary action; Hold and Cancel are the others, Cancel in the danger color
        transitionsOf(overview.output).Complete == "next"
        transitionsOf(overview.output).Hold == "other"
        transitionsOf(overview.output).Cancel == "danger"
        overview.output.includes("changeStatus")
        overview.output.includes('parameter-name="toStatusId"')
        overview.output.includes("Reassign")
        overview.output.includes("Convert to request")
        overview.output.includes("Office move")
        overview.output.includes('<m-chatter id="TaskChatter" record-entity="mantle.work.effort.WorkEffort" record-id="BOSS_DEMO_TASK_PLAN" default-tab="log">')
        overview.output.includes('<m-screen-context record-entity="mantle.work.effort.WorkEffort" record-id="BOSS_DEMO_TASK_PLAN"')
        // the planning fields of Projects are not shown
        !overview.output.includes("Estimated Hours")
        subtasks.output.includes("Get quotes from two movers")
        subtasks.output.includes("Draw the new floor plan")
        subtasks.output.includes("Order packing boxes")
        subtasks.output.includes("Add a sub-task")
        time.output.includes("Walked the new floor and listed the rooms")
        time.output.includes("Clock in")
        time.output.includes("Add time")
        files.output.includes('<m-record-files id="TaskFiles" record-entity="mantle.work.effort.WorkEffort" record-id="BOSS_DEMO_TASK_PLAN"')
        // Joe's task john.doe watches: shown, without the changes of its people
        watched.status == 200
        watched.output.includes("Renew the domain name")
        !watched.output.includes("TaskReassignDialog")
        !watched.output.includes("changeStatus")
    },
})

feature("TaskDetail's status action completes a task along the flow; reassign, set due and add a sub-task", {
    when() {
        const task = quickAdd("BOSS_TEST Detail actions", inThreeText, "all").id
        made.detail = task
        const begun = post("Tasks/TaskDetail/changeStatus", { workEffortId: task, toStatusId: "WeInProgress" })
        const afterBegin = one("mantle.work.effort.WorkEffort", { workEffortId: task }).statusId
        const shownInProgress = render("apps/Commons/Tasks/TaskDetail", { workEffortId: task }).output
        const completed = post("Tasks/TaskDetail/changeStatus", { workEffortId: task, toStatusId: "WeComplete" })
        const afterComplete = one("mantle.work.effort.WorkEffort", { workEffortId: task })
        const approved = post("Tasks/TaskDetail/changeStatus", { workEffortId: task, toStatusId: "WeApproved" })
        const reopened = post("Tasks/TaskDetail/changeStatus", { workEffortId: task, toStatusId: "WeInProgress" })
        const due = post("Tasks/TaskDetail/setDue", { workEffortId: task, dueDate: tomorrowText })
        const sub = post("Tasks/TaskDetail/addSubTask", { workEffortId: task, workEffortName: "BOSS_TEST Detail sub-task", dueDate: inThreeText })
        const subTask = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST Detail sub-task" })[0]
        const subDone = post("Tasks/TaskDetail/toggleSubTask", { workEffortId: task, subTaskId: subTask.workEffortId })
        const reassigned = post("Tasks/TaskDetail/reassign", { workEffortId: task, assignToPartyId: "ORG_ZIZI_JD" })
        return { begun, afterBegin, shownInProgress, completed, afterComplete, approved, reopened, due, sub, subTask, subDone,
            subAfter: one("mantle.work.effort.WorkEffort", { workEffortId: subTask.workEffortId }), reassigned,
            assignees: current("mantle.work.effort.WorkEffortParty", { workEffortId: task, roleTypeId: "Assignee" }).map((row) => row.partyId),
            after: one("mantle.work.effort.WorkEffort", { workEffortId: task }) }
    },
    allowMessageErrors: true,
    then({ begun, afterBegin, shownInProgress, completed, afterComplete, approved, reopened, due, sub, subTask, subDone, subAfter, reassigned, assignees, after }) {
        begun.errors == ""
        afterBegin == "WeInProgress"
        stagesOf(shownInProgress).WeInProgress == "current primary"
        completed.errors == ""
        afterComplete.statusId == "WeComplete"
        afterComplete.resolutionEnumId == "WerCompleted"
        // Approved is the Projects app's
        approved.errors.includes("cannot be set to WeApproved")
        reopened.errors == ""
        due.errors == ""
        dayOf(after.estimatedCompletionDate) == tomorrowText
        sub.errors == ""
        subTask.parentWorkEffortId == made.detail
        subDone.errors == ""
        subAfter.statusId == "WeComplete"
        reassigned.errors == ""
        assignees == ["ORG_ZIZI_JD"]
        // john.doe still owns it
        after.ownerPartyId == "EX_JOHN_DOE"
    },
})

feature("TaskDetail: clone copies the task for john.doe; convert to request drafts a request linked to the task", {
    when() {
        const cloned = post("Tasks/TaskDetail/cloneTask", { workEffortId: "BOSS_DEMO_TASK_WATCH" })
        const copy = all("mantle.work.effort.WorkEffort", { workEffortName: "Renew the domain name (copy)" })[0]
        const converted = post("Tasks/TaskDetail/convertToRequest", { workEffortId: "BOSS_DEMO_TASK_FROMJOE" })
        const link = all("mantle.request.RequestWorkEffort", { workEffortId: "BOSS_DEMO_TASK_FROMJOE" })[0]
        const request = link ? one("mantle.request.Request", { requestId: link.requestId }) : null
        return { cloned, copy, copyParties: copy ? current("mantle.work.effort.WorkEffortParty", { workEffortId: copy.workEffortId }) : [],
            converted, link, request, reporter: request ? current("mantle.request.RequestParty", { requestId: request.requestId, roleTypeId: "Reporter" }) : [] }
    },
    then({ cloned, copy, copyParties, converted, link, request, reporter }) {
        cloned.errors == ""
        copy != null
        copy.ownerPartyId == "EX_JOHN_DOE"
        copy.statusId == "WeInPlanning"
        copy.description == "The company domain expires at the end of the month."
        copyParties.length == 1
        copyParties[0].partyId == "EX_JOHN_DOE"
        copyParties[0].roleTypeId == "Assignee"
        converted.errors == ""
        link != null
        request.requestName == "Check the backup restore"
        request.statusId == "ReqDraft"
        request.filedByPartyId == "EX_JOHN_DOE"
        reporter.length == 1
    },
})

feature("TaskDetail time: clock in and out count the hours, add time logs more, and john.doe removes an entry of his", {
    when() {
        const task = made.detail
        const startMillis = Date.now() - 90 * 60000
        ec.user.setEffectiveTime(startMillis)
        const clockedIn = post("Tasks/TaskDetail/clockIn", { workEffortId: task })
        const again = post("Tasks/TaskDetail/clockIn", { workEffortId: task })
        ec.user.setEffectiveTime(startMillis + 90 * 60000)
        const shownOpen = render("apps/Commons/Tasks/TaskDetail", { workEffortId: task, tab: "time" }).output
        const clockedOut = post("Tasks/TaskDetail/clockOut", { workEffortId: task })
        ec.user.setEffectiveTime(null)
        const added = post("Tasks/TaskDetail/addTime", { workEffortId: task, hours: "1.5", comments: "BOSS_TEST wrote the summary" })
        const entries = all("mantle.work.time.TimeEntry", { workEffortId: task })
        const logged = entries.find((entry) => entry.comments === "BOSS_TEST wrote the summary")
        const removed = post("Tasks/TaskDetail/deleteTime", { workEffortId: task, timeEntryId: logged.timeEntryId })
        return { clockedIn, again, shownOpen, clockedOut, added, entries, removed, left: all("mantle.work.time.TimeEntry", { workEffortId: task }),
            shown: render("apps/Commons/Tasks/TaskDetail", { workEffortId: task, tab: "time" }).output }
    },
    allowMessageErrors: true,
    then({ clockedIn, again, shownOpen, clockedOut, added, entries, removed, left, shown }) {
        clockedIn.errors == ""
        again.errors.includes("already clocked in")
        shownOpen.includes("Clock out")
        shownOpen.includes("Clocked in since")
        clockedOut.errors == ""
        added.errors == ""
        entries.length == 2
        entries.some((entry) => entry.thruDate != null && Number(String(entry.hours)) > 1.4 && Number(String(entry.hours)) < 1.6 && entry.comments == null)
        removed.errors == ""
        left.length == 1
        shown.includes("Clock in")
    },
})

feature("TaskDetail: Add to Today, and Delete own only for a task john.doe made with no time", {
    when() {
        const today = post("Tasks/TaskDetail/addToToday", { workEffortId: made.bulk[2] })
        const plain = quickAdd("BOSS_TEST Delete me", "", "all").id
        const shown = render("apps/Commons/Tasks/TaskDetail", { workEffortId: plain }).output
        const deleted = post("Tasks/TaskDetail/deleteTask", { workEffortId: plain })
        // the detail task has time logged
        const withTime = post("Tasks/TaskDetail/deleteTask", { workEffortId: made.detail })
        return { today, shown, deleted, withTime, gone: one("mantle.work.effort.WorkEffort", { workEffortId: plain }),
            kept: one("mantle.work.effort.WorkEffort", { workEffortId: made.detail }), watched: one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_TASK_WATCH" }) }
    },
    allowMessageErrors: true,
    then({ today, shown, deleted, withTime, gone, kept, watched }) {
        // the third bulk task went to Joe: john.doe is not on it any more, so not on his Today
        today.errors.includes("assign this one to yourself first")
        shown.includes("deleteTask")
        deleted.errors == ""
        gone == null
        withTime.errors.includes("has time logged")
        kept != null
        watched != null
    },
})

feature("a task Joe Developer is not on is not available to him, and its changes are refused; his own shows", {
    allowMessageErrors: true,
    when() {
        return as("joe.developer", () => ({
            hidden: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TASK" }),
            status: post("Tasks/TaskDetail/changeStatus", { workEffortId: "BOSS_DEMO_TASK", toStatusId: "WeComplete" }),
            loaded: post("Tasks/List/taskFieldValue", { workEffortId: "BOSS_DEMO_TASK", field: "due" }),
            own: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "BOSS_DEMO_TODAY_DUE" }),
            list: render("apps/Commons/Tasks", {}),
        }))
    },
    then({ hidden, status, loaded, own, list }) {
        hidden.status == 200
        hidden.output.includes("is not available")
        !hidden.output.includes("Review the open support requests")
        !hidden.output.includes("<m-chatter")
        status.errors.includes("Task BOSS_DEMO_TASK is not available")
        !loaded.json.value
        one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_TASK" }).statusId != "WeComplete"
        own.output.includes("Compare the calendar options for the team")
        !own.output.includes("is not available")
        !list.output.includes("Review the open support requests")
        list.output.includes("Draw the new floor plan")
    },
})
