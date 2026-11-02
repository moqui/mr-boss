// The usable-when walk of IronStone Projects P6a (impl-projects.md P6; design-projects.md §8 MyTime, Timesheets, TimesheetDetail, §3
// Home and QuickCreate) through the screens' transitions, with authorization on: in a project of its own (TWK, john.doe its manager
// and joe.developer a programmer), in a week of December 2026, joe adds a row, times work with the timer (one runs at a time: a
// start on another item stops the first), types hours in the grid and logs one entry in full; bob.developer may not see his week;
// joe submits it, and the week is locked; john.doe finds it in Timesheets' To approve, opens TimesheetDetail and returns it with a
// reason; joe sees the reason, fixes the week and submits again; john.doe approves it from Timesheets. The screens render along the
// way: MyTime's component, its terminal twin, Timesheets, TimesheetDetail, QuickTime, Home with the timer strip, and WorkItemDetail's
// timer. The project is cancelled after, so the other specs' lists keep their records.
// Run: ./moq test mr-boss --spec TimeWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "TWK"
// a moment of a day of the week of Monday December 7, 2026, in the session's time zone
const at = (day, hour, minute) => Number(String(ec.l10n.parseTimestamp(`2026-12-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}:00.000`,
        "yyyy-MM-dd HH:mm:ss.SSS")))
let now = null

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
    if (now) ec.user.setEffectiveTime(now)
    try { return run() } finally { login("john.doe"); if (now) ec.user.setEffectiveTime(now) }
}
const setNow = (millis) => { now = millis; ec.user.setEffectiveTime(millis) }
const weekOf = (who, partyId) => as(who, () => json("Time/MyTime/week", Object.assign({ weekDate: "2026-12-09" }, partyId ? { partyId } : {})).json)
const rowOf = (week, id) => Array.from(week.rowList).find((row) => row.workEffortId === id)
const sheetId = () => sys(() => ec.entity.find("mantle.work.time.Timesheet").condition({ partyId: "ORG_ZIZI_JD" })
        .condition("fromDate", "less-equals", new Date(at(9, 12))).condition("thruDate", "greater-than", new Date(at(9, 12))).one()?.timesheetId)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Time walk" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId, roleTypeId }).count())
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: "2026-10-01 00:00:00", statusId: "WeptAssigned" })
            }
            const task = (name) => call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortName: name, estimatedWorkTime: 40,
                remainingWorkTime: 40, assignToPartyId: "ORG_ZIZI_JD", assignRoleTypeId: "Assignee" }).workEffortId
            task("Weekly grid")
            task("Timer bar")
        })
        setNow(at(7, 9))
    },
    cleanupSpec() {
        ec.user.setEffectiveTime(null)
        sys(() => {
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
        })
    },
})

feature("joe opens an empty week, adds a row, and times TWK-1 then switches the timer to TWK-2: one runs at a time", {
    when() {
        const empty = weekOf("joe.developer")
        const added = as("joe.developer", () => post("Time/MyTime/rows", { change: "add", weekDate: "2026-12-09", workEffortId: "TWK-2" }))
        const options = as("joe.developer", () => json("Time/MyTime/itemOptions", { term: "Timer" }).json)
        const started = as("joe.developer", () => post("Time/MyTime/startTimer", { workEffortId: "TWK-1" }))
        setNow(at(7, 10, 30))
        const switched = as("joe.developer", () => post("Time/MyTime/startTimer", { workEffortId: "TWK-2" }))
        const running = weekOf("joe.developer")
        as("joe.developer", () => post("Time/MyTime/updateTimer", { comments: "The bar's layout" }))
        setNow(at(7, 12))
        const stopped = as("joe.developer", () => post("Time/MyTime/stopTimer", {}))
        return { empty, added, options, started, switched, running, stopped, after: weekOf("joe.developer") }
    },
    then({ empty, added, options, started, switched, running, stopped, after }) {
        empty.week.weekStart == "2026-12-07"
        empty.week.rowList.length == 0
        empty.week.timesheet.statusId == "TmshInProcess"
        empty.week.access.canSubmit == true
        added.json.addedCount == 1
        options.some((option) => option.value == "TWK-2")
        started.json.timeEntryId != null
        switched.json.messageInfos[0].message.includes("Switched")
        running.week.timer.workEffortId == "TWK-2"
        rowOf(running.week, "TWK-1").cells["2026-12-07"].hours == 1.5
        stopped.json.stopped == true
        stopped.json.messageInfos[0].message.includes("1.50 h")
        rowOf(after.week, "TWK-2").cells["2026-12-07"].hours == 1.5
        after.week.timer == null
        after.week.total == 3
    },
})

feature("joe types hours in the grid and logs one entry in full; the grid's rules hold; bob may not see the week", {
    when() {
        setNow(at(11, 16))
        const cell = (workEffortId, day, hours) => as("joe.developer", () => post("Time/MyTime/saveCell", { workEffortId, day, hours }))
        const monday = cell("TWK-2", "2026-12-07", "3")
        const second = as("joe.developer", () => post("Time/MyTime/saveEntry", { workEffortId: "TWK-2", day: "2026-12-07", fromTime: "14:00", thruTime: "15:00" }))
        const tuesday = cell("TWK-1", "2026-12-08", "7.6")
        const tuesday2 = cell("TWK-2", "2026-12-08", "0.5")
        const several = cell("TWK-2", "2026-12-07", "2")
        const full = as("joe.developer", () => post("Time/MyTime/saveEntry", { workEffortId: "TWK-1", day: "2026-12-09", fromTime: "08:30", thruTime: "17:00",
            breakHours: "0.5", billable: "N", workTypeEnumId: "WktpDevelopment", comments: "Keyboard moves between cells" }))
        const thursday = cell("TWK-1", "2026-12-10", "6")
        const cleared = cell("TWK-1", "2026-12-10", "")
        const bob = weekOf("bob.developer", "ORG_ZIZI_JD")
        return { monday, second, tuesday, tuesday2, several, full, thursday, cleared, bob, week: weekOf("joe.developer").week }
    },
    then({ monday, second, tuesday, tuesday2, several, full, thursday, cleared, bob, week }) {
        // the timer's entry of Monday takes the hours typed; a second entry that day makes the cell several
        monday.json.hours == 3
        second.json.messageInfos[0].message == "1 h logged"
        tuesday.json.hours == 7.5
        tuesday2.json.hours == 0.5
        several.errors.includes("several entries")
        full.json.messageInfos[0].message == "8 h logged"
        thursday.json.hours == 6
        cleared.json != null
        bob.notAvailable == true
        rowOf(week, "TWK-1").cells["2026-12-08"].hours == 7.5
        rowOf(week, "TWK-1").cells["2026-12-09"].hours == 8
        rowOf(week, "TWK-1").cells["2026-12-10"].hours == 0
        week.entryList.find((entry) => entry.day == "2026-12-09").billable == false
        rowOf(week, "TWK-2").cells["2026-12-07"].hours == 4
        rowOf(week, "TWK-2").cells["2026-12-07"].entryIds.length == 2
        week.total == 21.5
        week.billableTotal == 13.5
        week.dayList[0].below == true
    },
})

feature("joe submits the week: it is locked; john.doe finds it in To approve and opens TimesheetDetail; bob may not", {
    when() {
        const submitted = as("joe.developer", () => post("Time/MyTime/decide", { action: "submit", weekDate: "2026-12-09" }))
        const locked = as("joe.developer", () => post("Time/MyTime/saveCell", { workEffortId: "TWK-1", day: "2026-12-11", hours: "4" }))
        const list = render("apps/Projects/Time/Timesheets", { list: "toApprove" })
        const rows = sys(() => call("ironstone.projects.TimeServices.find#TimesheetRows", { list: "toApprove" })).rowList
        const detail = render("apps/Projects/Time/TimesheetDetail", { timesheetId: sheetId() })
        const bobDetail = as("bob.developer", () => render("apps/Projects/Time/TimesheetDetail", { timesheetId: sheetId() }))
        return { submitted, locked, list, rows, detail, bobDetail, week: weekOf("joe.developer").week }
    },
    then({ submitted, locked, list, rows, detail, bobDetail, week }) {
        submitted.json.messageInfos[0].message == "Week submitted for approval"
        locked.errors.includes("This week is submitted")
        week.timesheet.statusId == "TmshCompleted"
        week.access.canEdit == false
        list.status == 200
        !list.broken
        list.output.includes("Joe Developer")
        Array.from(rows).some((row) => row.timesheetId == sheetId() && row.canApprove && row.hoursText == "21.5")
        detail.status == 200
        !detail.broken
        detail.output.includes("Joe Developer")
        detail.output.includes("Keyboard moves between cells")
        detail.output.includes("Return")
        bobDetail.output.includes("is not available")
    },
})

feature("john.doe returns the week with a reason; joe sees it, fixes Friday and submits again", {
    when() {
        const returned = post("Time/TimesheetDetail/decide", { timesheetId: sheetId(), action: "return", reason: "Friday is missing: add the review you did" })
        const seen = weekOf("joe.developer").week
        setNow(at(11, 17))
        const fixed = as("joe.developer", () => post("Time/MyTime/saveCell", { workEffortId: "TWK-2", day: "2026-12-11", hours: "4" }))
        const again = as("joe.developer", () => post("Time/MyTime/decide", { action: "submit", weekDate: "2026-12-09" }))
        return { returned, seen, fixed, again, tui: as("joe.developer", () => render("apps/Projects/Time/MyTimeTui", { weekDate: "2026-12-09" })) }
    },
    then({ returned, seen, fixed, again, tui }) {
        returned.errors == ""
        seen.timesheet.returned == true
        seen.timesheet.reason == "Friday is missing: add the review you did"
        seen.access.canEdit == true
        fixed.json.hours == 4
        again.json.messageInfos != null
        tui.status == 200
        !tui.broken
        tui.output.includes("Keyboard moves between cells")
    },
})

feature("john.doe approves it from Timesheets; the week is approved and read only, with who approved it", {
    when() {
        const approved = post("Time/Timesheets/bulkAction", { bulk: "approve", selectedIds: sheetId(), list: "toApprove" })
        const week = weekOf("joe.developer").week
        return { approved, week, detail: render("apps/Projects/Time/TimesheetDetail", { timesheetId: sheetId() }) }
    },
    then({ approved, week, detail }) {
        approved.errors == ""
        week.timesheet.statusId == "TmshApproved"
        week.timesheet.approvedByName == "John Doe"
        week.total == 25.5
        week.access.canEdit == false
        detail.output.includes("Approved")
        detail.output.includes("Returned")
    },
})

feature("the other screens: MyTime's component, QuickTime, WorkItemDetail's timer and Home's timer strip", {
    when() {
        setNow(null)
        now = null
        ec.user.setEffectiveTime(null)
        const component = as("joe.developer", () => render("apps/Projects/Time/MyTime", {}, "qvue"))
        const quick = as("joe.developer", () => render("apps/Projects/QuickCreate", { kind: "time", recordEntity: "mantle.work.effort.WorkEffort", recordId: "TWK-2" }))
        const logged = as("joe.developer", () => post("QuickCreate/createTime", { timeWorkEffortId: "TWK-2", day: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
            hours: "0.75", billable: "Y", comments: "From QuickTime" }))
        const itemStart = as("joe.developer", () => post("WorkItems/WorkItemDetail/startTimer", { workEffortId: "TWK-1", tab: "overview" }))
        const itemPage = as("joe.developer", () => render("apps/Projects/WorkItems/WorkItemDetail", { workEffortId: "TWK-1" }))
        const home = as("joe.developer", () => render("apps/Projects/Home", {}))
        const homeTime = as("joe.developer", () => sys(() => call("ironstone.projects.ProjectServices.get#ProjectsHome", {})).home)
        const itemStop = as("joe.developer", () => post("WorkItems/WorkItemDetail/stopTimer", { workEffortId: "TWK-1", tab: "overview" }))
        const managerHome = render("apps/Projects/Home", {})
        return { component, quick, logged, itemStart, itemPage, home, homeTime, itemStop, managerHome }
    },
    then({ component, quick, logged, itemStart, itemPage, home, homeTime, itemStop, managerHome }) {
        component.status == 200
        component.output.includes("module.exports")
        quick.status == 200
        !quick.broken
        quick.output.includes("Log time")
        quick.output.includes("TWK-2")
        logged.json.messageInfos[0].message == "0.75 h logged"
        itemStart.errors == ""
        itemPage.output.includes("Stop timer")
        home.output.includes("Weekly grid")
        home.output.includes("My hours")
        homeTime.timer.workEffortId == "TWK-1"
        itemStop.errors == ""
        managerHome.output.includes("Approve time")
        !managerHome.broken
    },
})
