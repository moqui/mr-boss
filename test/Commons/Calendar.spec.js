// Commons Calendar (screen/Commons/Calendar.xml and Calendar.qvue, service/ironstone/commons/CalendarServices.xml; impl-drawers-commons.md
// M7, design-drawers-commons.md §7): the JSON transitions the calendar calls under the Commons app root, as john.doe, on the
// calendar demo (data/BossCalendarDemoData.xml, CalendarDemoServices.load#CalendarDemo, loaded again here so the dates are
// from today in john.doe's time zone). The rail's calendars and defaults; the events of a day, a week, a month and the
// agenda, with the calendars turned off, declined invitations and the tasks (the Tasks list's Calendar link, showTasks=Y);
// the quick event; a move and a resize, notifying the attendees; a move onto another booking of its room refused, then kept
// anyway; a recurring event changed as this event, this and following and all events (mantle.work.EventServices
// update#EventOccurrence), and cancelled the same ways (one instance as an EXDATE of its series); the answer to an
// invitation; the popover; the search and Find a time. Joe
// Developer may not see john.doe's family event nor change john.doe's events (IronStone R5, R28). Authorization stays on.
// Run: ./moq test mr-boss --spec Calendar
const commons = "component://mr-boss/screen/Commons.xml"
const pattern = "yyyy-MM-dd HH:mm:ss.SSS"
let D, weekStart, weekEnd
const made = {}

function call_(name, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(`Calendar/${name}`, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, text: String(str.output || "").substring(0, 300) }
}
const get = (name, parameters) => call_(name, parameters, null)
const post = (name, parameters) => call_(name, parameters, "post")
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const all = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const addDays = (text, days) => { const [y, m, d] = text.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + days)).toISOString().substring(0, 10) }
const day = (offset) => addDays(D, offset)
const message = (answer) => ((answer.json.messageInfos || [])[0] || {}).message || ""
const shownIds = (setup) => (setup.json.calendarList || []).filter((cal) => cal.shown).map((cal) => cal.calendarId).join(",")
const events = (start, end, extra) => get("calendarEvents", Object.assign({ start, end, calendarIds: "BOSS_DEMO_CAL_JD,BOSS_DEMO_CAL_FAMILY,BOSS_DEMO_CAL_TEAM,BOSS_DEMO_CAL_JOE,BOSS_DEMO_CAL_BOB,BOSS_DEMO_CAL_FEED" }, extra || {}))
const titles = (answer) => (answer.json.eventList || []).map((event) => event.title)
const byId = (answer, id) => (answer.json.eventList || []).filter((event) => event.workEffortId === id)
const millisOf = (text) => Number(String(ec.l10n.parseTimestamp(text.length === 10 ? text + " 00:00:00.000" : text + ":00.000", pattern)))
const userText = (value, format) => ec.l10n.format(value, format || "yyyy-MM-dd HH:mm")
// a date field reaches a script as yyyy-MM-dd text or the epoch millis of its UTC midnight
const dateOf = (value) => value == null ? null : (/^-?\d+$/.test(String(value)) ? new Date(Number(String(value))).toISOString().substring(0, 10) : String(value).substring(0, 10))
const notices = (userId, topic) => sys(() => Array.from(ec.entity.find("moqui.security.user.NotificationMessageUser").condition("userId", userId).list())
        .map((row) => ec.entity.find("moqui.security.user.NotificationMessage").condition("notificationMessageId", row.notificationMessageId).one())
        .filter((notice) => notice && notice.topic === topic))

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.CalendarDemoServices.load#CalendarDemo", {}))
        D = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        weekStart = D
        weekEnd = addDays(D, 6)
    },
    cleanup() { login("john.doe") },
    cleanupSpec() {
        // john.doe's answers to the planning are rows of their own (a reload of the demo puts back its row, not this): take them
        // off and load the demo again, so a spec after this one (EventDetail) finds the planning not answered
        sys(() => {
            ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: "BOSS_DEMO_EV_PLANNING", partyId: "EX_JOHN_DOE" }).deleteAll()
            call("ironstone.commons.CalendarDemoServices.load#CalendarDemo", {})
        })
    },
})

feature("the rail has john.doe's calendars: his own, the subscription with its failed fetch, the Team, Joe's and Bob's; the defaults and his time zone", {
    when() {
        sys(() => call("ironstone.commons.CalendarServices.save#CalendarRailState", { hiddenCalendarIds: "", showTasks: "N", showDeclined: "N" }))
        const setup = get("calendarSetup")
        const of = (id) => (setup.json.calendarList || []).find((cal) => cal.calendarId === id) || {}
        const demoIds = ["BOSS_DEMO_CAL_JD", "BOSS_DEMO_CAL_FAMILY", "BOSS_DEMO_CAL_TEAM", "BOSS_DEMO_CAL_JOE", "BOSS_DEMO_CAL_BOB", "BOSS_DEMO_CAL_FEED"]
        return { setup, mine: of("BOSS_DEMO_CAL_JD"), family: of("BOSS_DEMO_CAL_FAMILY"), team: of("BOSS_DEMO_CAL_TEAM"), joe: of("BOSS_DEMO_CAL_JOE"),
            bob: of("BOSS_DEMO_CAL_BOB"), feed: of("BOSS_DEMO_CAL_FEED"), allShown: demoIds.every((id) => of(id).shown) }
    },
    then({ setup, mine, family, team, joe, bob, feed, allShown }) {
        setup.status == 200
        setup.json.defaultCalendarId == "BOSS_DEMO_CAL_JD"
        setup.json.timeZone == "US/Central"
        setup.json.todayText == D
        mine.group == "mine"
        mine.isDefault
        mine.canAdd
        mine.color == "#1e88e5"
        family.group == "mine"
        feed.group == "subscription"
        !feed.canAdd
        feed.warning.includes("404")
        team.group == "shared"
        team.permissionEnumId == "CalpManage"
        team.canAdd
        joe.permissionEnumId == "CalpView"
        !joe.canAdd
        bob.freeBusyOnly
        allShown
        setup.json.defaults.view == "week"
        setup.json.defaults.workStart == "09:00"
        setup.json.roomOptions.some((room) => room.value === "BOSS_DEMO_ROOM_MAPLE")
        setup.json.me.partyId == "EX_JOHN_DOE"
    },
})

feature("the week has the team sync, the invitation to answer, the closure, the workshop, Joe's dentist and Bob's interview as Busy; not the declined demo", {
    when() {
        const week = events(weekStart, weekEnd)
        const declined = events(weekStart, weekEnd, { showDeclined: "Y" })
        return { week, declined, sync: byId(week, "BOSS_DEMO_EV_SYNC"), planning: byId(week, "BOSS_DEMO_EV_PLANNING")[0] || {},
            closed: byId(week, "BOSS_DEMO_EV_CLOSED")[0] || {}, interview: byId(week, "BOSS_DEMO_EV_INTERVIEW")[0] || {},
            dentist: byId(week, "BOSS_DEMO_EV_DENTIST")[0] || {}, workshop: byId(week, "BOSS_DEMO_EV_WORKSHOP")[0] || {} }
    },
    then({ week, declined, sync, planning, closed, interview, dentist, workshop }) {
        week.status == 200
        // the weekly sync's instance today at 10:00, from the series; its owner may change it
        sync.length == 1
        sync[0].start == D + " 10:00"
        sync[0].end == D + " 10:30"
        sync[0].recurring
        sync[0].instanceStart == D + " 10:00"
        sync[0].color == "#1e88e5"
        sync[0].canEdit
        sync[0].hasAttendees
        sync[0].url.includes("instanceStart=")
        // Joe's planning: an invitation not answered, in Joe's calendar, which john.doe may not change
        planning.partyStatusId == "WeptOffered"
        planning.start == day(2) + " 13:00"
        !planning.canEdit
        planning.color == "#fb8c00"
        // all day on D+3 and D+4: the end the day after the last
        closed.allDay
        closed.start == day(3)
        closed.end == day(5)
        closed.canEdit
        interview.freeBusyOnly
        interview.title == "Busy"
        !interview.url
        dentist.title == "Dentist"
        workshop.start == day(2) + " 09:00"
        !titles(week).includes("Vendor demo: shared printers")
        titles(declined).includes("Vendor demo: shared printers")
        byId(declined, "BOSS_DEMO_EV_VENDOR")[0].partyStatusId == "WeptDeclined"
    },
})

feature("a day, a month and the agenda: the moved instance next week in place of its own, the cancelled one gone, the yearly birthday", {
    when() {
        const today = events(D, D)
        const month = events(day(-3), day(38))
        const agenda = events(D, day(30))
        return { today, month, agenda, syncs: byId(month, "BOSS_DEMO_EV_SYNC").map((event) => event.start),
            moved: byId(month, "BOSS_DEMO_EV_SYNC_MOVED")[0] || {}, birthday: byId(agenda, "BOSS_DEMO_EV_BIRTHDAY")[0] || {} }
    },
    then({ today, month, syncs, moved, birthday }) {
        titles(today).includes("Team sync")
        !titles(today).includes("Dentist")
        // the rule's instances: today and in three and four weeks; a week on moved to the next day at 15:00, two weeks on cancelled
        syncs.includes(D + " 10:00")
        !syncs.includes(day(7) + " 10:00")
        !syncs.includes(day(14) + " 10:00")
        syncs.includes(day(21) + " 10:00")
        moved.start == day(8) + " 15:00"
        moved.recurringEventId == "BOSS_DEMO_EV_SYNC"
        moved.instanceStart == day(7) + " 10:00"
        !byId(month, "BOSS_DEMO_EV_SYNC_OFF").length
        birthday.allDay
        birthday.start == day(5)
        birthday.recurring
    },
})

feature("a calendar turned off leaves the grid, and stays off; an invitation in it still shows", {
    when() {
        post("saveRailState", { hiddenCalendarIds: "BOSS_DEMO_CAL_JOE,BOSS_DEMO_CAL_TEAM" })
        const setup = get("calendarSetup")
        const week = get("calendarEvents", { start: weekStart, end: weekEnd, calendarIds: shownIds(setup), hiddenCalendarIds: "BOSS_DEMO_CAL_JOE,BOSS_DEMO_CAL_TEAM" })
        const pref = sys(() => ec.user.getPreference("CALENDAR_HIDDEN"))
        post("saveRailState", { hiddenCalendarIds: "" })
        return { setup, week, pref, joe: (setup.json.calendarList || []).find((cal) => cal.calendarId === "BOSS_DEMO_CAL_JOE") || {} }
    },
    then({ week, pref, joe }) {
        pref == "BOSS_DEMO_CAL_JOE,BOSS_DEMO_CAL_TEAM"
        !joe.shown
        !titles(week).includes("Dentist")
        !titles(week).includes("Office closed for training")
        // Joe's planning is an invitation to john.doe: it shows with Joe's calendar off
        titles(week).includes("Release planning")
        titles(week).includes("Team sync")
    },
})

feature("with showTasks (the Tasks list's Calendar link) john.doe's tasks come at their due time", {
    when() {
        sys(() => call("ironstone.commons.DemoServices.load#TasksDemo", {}))
        const withTasks = events(day(-1), day(8), { showTasks: "Y" })
        const without = events(day(-1), day(8))
        const tasks = (withTasks.json.eventList || []).filter((event) => event.kind === "task")
        return { tasks, withoutTasks: (without.json.eventList || []).filter((event) => event.kind === "task").length }
    },
    then({ tasks, withoutTasks }) {
        tasks.length > 0
        tasks.every((task) => task.url.startsWith("/qapps/Commons/Tasks/TaskDetail?workEffortId="))
        tasks.some((task) => task.workEffortId === "BOSS_DEMO_TASK_PLAN")
        withoutTasks == 0
    },
})

feature("the quick event: in the default calendar with an attendee invited, a weekly repeat, a reminder and the Maple room; More options opens it", {
    when() {
        const answer = post("createEvent", { workEffortName: "BOSS_TEST quick planning", start: day(4) + " 15:00", end: day(4) + " 16:00", allDay: "N",
            calendarId: "BOSS_DEMO_CAL_JD", attendeePartyIds: "ORG_ZIZI_JD", repeat: "weekly", reminderMinutes: "15", facilityId: "BOSS_DEMO_ROOM_MAPLE", andOpen: "Y" })
        made.quick = answer.json.workEffortId
        const id = made.quick
        return { answer, row: one("mantle.work.effort.WorkEffort", { workEffortId: id }) || {}, inCalendar: one("mantle.work.calendar.CalendarWorkEffort", { calendarId: "BOSS_DEMO_CAL_JD", workEffortId: id }),
            joe: all("mantle.work.effort.WorkEffortParty", { workEffortId: id, partyId: "ORG_ZIZI_JD" })[0] || {},
            recurrence: one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: id }) || {},
            reminder: all("mantle.work.effort.WorkEffortReminder", { workEffortId: id, partyId: "EX_JOHN_DOE" })[0] || {},
            room: one("mantle.work.effort.WorkEffortFacility", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" }) || {},
            invited: notices("ORG_ZIZI_JD", "EventInvitation").filter((notice) => String(notice.messageJson || "").includes(id)).length,
            weekday: ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][new Date(Date.UTC(...day(4).split("-").map((part, index) => index === 1 ? Number(part) - 1 : Number(part)))).getUTCDay()] }
    },
    then({ answer, row, inCalendar, joe, recurrence, reminder, room, invited, weekday }) {
        answer.status == 200
        answer.errors == ""
        message(answer).startsWith("Event created")
        answer.json.screenUrl == "/qapps/Commons/Calendar/EventDetail?workEffortId=" + row.workEffortId
        row.workEffortName == "BOSS_TEST quick planning"
        userText(row.estimatedStartDate) == day(4) + " 15:00"
        userText(row.estimatedCompletionDate) == day(4) + " 16:00"
        row.purposeEnumId == "WepMeeting"
        inCalendar != null
        joe.statusId == "WeptOffered"
        joe.invitationSentDate != null
        invited == 1
        recurrence.rrule == "FREQ=WEEKLY;BYDAY=" + weekday
        reminder.offsetMinutes == 15
        room.statusId == "WefAssigned"
    },
})

feature("a single event moves and resizes; with notify the attendee gets the update", {
    when() {
        const created = post("createEvent", { workEffortName: "BOSS_TEST one-off", start: day(5) + " 09:00", end: day(5) + " 10:00", attendeePartyIds: "ORG_ZIZI_JD" })
        made.single = created.json.workEffortId
        const before = notices("ORG_ZIZI_JD", "EventInvitation").length
        const moved = post("moveEvent", { workEffortId: made.single, start: day(6) + " 13:30", end: day(6) + " 14:30", allDay: "N", notify: "Y" })
        const afterMove = one("mantle.work.effort.WorkEffort", { workEffortId: made.single })
        const resized = post("moveEvent", { workEffortId: made.single, start: day(6) + " 13:30", end: day(6) + " 15:00", allDay: "N", notify: "N" })
        const afterResize = one("mantle.work.effort.WorkEffort", { workEffortId: made.single })
        const allDay = post("moveEvent", { workEffortId: made.single, start: day(7), end: day(8), allDay: "Y" })
        const afterAllDay = one("mantle.work.effort.WorkEffort", { workEffortId: made.single })
        const backTimed = post("moveEvent", { workEffortId: made.single, start: day(6) + " 13:30", end: day(6) + " 15:00", allDay: "N" })
        return { moved, resized, allDay, backTimed, afterMove, afterResize, afterAllDay, updates: notices("ORG_ZIZI_JD", "EventInvitation").length - before,
            week: byId(events(day(5), day(9)), made.single) }
    },
    then({ moved, resized, allDay, backTimed, afterMove, afterResize, afterAllDay, updates, week }) {
        moved.errors == ""
        message(moved).includes("1 attendees told")
        userText(afterMove.estimatedStartDate) == day(6) + " 13:30"
        userText(afterMove.estimatedCompletionDate) == day(6) + " 14:30"
        updates == 1
        resized.errors == ""
        userText(afterResize.estimatedCompletionDate) == day(6) + " 15:00"
        allDay.errors == ""
        dateOf(afterAllDay.allDayStart) == day(7)
        dateOf(afterAllDay.allDayEnd) == day(8)
        afterAllDay.estimatedStartDate == null
        backTimed.errors == ""
        week.length == 1
        week[0].start == day(6) + " 13:30"
        week[0].end == day(6) + " 15:00"
        !week[0].allDay
    },
})

feature("a move onto another booking of its room is refused and offered to keep anyway; kept, the booking stays and the clash is named", {
    when() {
        // the Maple room is the planning's on D+2 from 13:00 to 14:00
        const created = post("createEvent", { workEffortName: "BOSS_TEST room clash", start: day(5) + " 13:00", end: day(5) + " 14:00",
            facilityId: "BOSS_DEMO_ROOM_MAPLE" })
        const id = created.json.workEffortId
        const refused = post("moveEvent", { workEffortId: id, start: day(2) + " 13:30", end: day(2) + " 14:30", allDay: "N" })
        const afterRefused = one("mantle.work.effort.WorkEffort", { workEffortId: id })
        const kept = post("moveEvent", { workEffortId: id, start: day(2) + " 13:30", end: day(2) + " 14:30", allDay: "N", allowConflicts: "Y" })
        const warnings = (kept.json.messageInfos || []).filter((info) => info.type === "warning").map((info) => info.message)
        return { created, refused, afterRefused, kept, warnings, after: one("mantle.work.effort.WorkEffort", { workEffortId: id }),
            room: one("mantle.work.effort.WorkEffortFacility", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" }) || {} }
    },
    then({ created, refused, afterRefused, kept, warnings, after, room }) {
        created.errors == ""
        refused.status == 500
        refused.json.bookingClash == true
        refused.errors.includes("Maple meeting room is booked then: Release planning")
        userText(afterRefused.estimatedStartDate) == day(5) + " 13:00"
        kept.errors == ""
        warnings.some((text) => text.includes("Maple meeting room (Release planning)"))
        userText(after.estimatedStartDate) == day(2) + " 13:30"
        room.statusId == "WefAssigned"
    },
})

feature("a weekly series changes as this event, this and following, and all events", {
    when() {
        const created = post("createEvent", { workEffortName: "BOSS_TEST weekly review", start: day(1) + " 09:00", end: day(1) + " 09:30", repeat: "weekly",
            attendeePartyIds: "ORG_ZIZI_JD", reminderMinutes: "" })
        const series = created.json.workEffortId
        made.series = series
        // this event: the second instance two hours later
        const thisOne = post("moveEvent", { workEffortId: series, instanceStart: day(8) + " 09:00", scope: "this", start: day(8) + " 11:00", end: day(8) + " 11:30" })
        const override = thisOne.json.targetWorkEffortId
        const assoc = all("mantle.work.effort.WorkEffortAssoc", { workEffortId: series, toWorkEffortId: override, workEffortAssocTypeEnumId: "WeatRecurrenceInstance" })[0] || {}
        const afterThis = events(day(0), day(30)).json.eventList || []
        // this and following: from the fourth instance at 14:00
        const following = post("moveEvent", { workEffortId: series, instanceStart: day(22) + " 09:00", scope: "following", start: day(22) + " 14:00", end: day(22) + " 14:30" })
        const next = following.json.targetWorkEffortId
        const afterFollowing = events(day(0), day(36)).json.eventList || []
        // all events of the new series: a day later
        const allMove = post("moveEvent", { workEffortId: next, instanceStart: day(29) + " 14:00", scope: "all", start: day(30) + " 14:00", end: day(30) + " 14:30" })
        const afterAll = events(day(0), day(40)).json.eventList || []
        const startsOf = (list, id) => list.filter((event) => event.workEffortId === id || event.recurringEventId === id).map((event) => event.start)
        return { thisOne, override, assoc, afterThis: startsOf(afterThis, series), following, next, afterFollowing: startsOf(afterFollowing, series),
            nextStarts: startsOf(afterFollowing, next), allMove, afterAllNext: startsOf(afterAll, next),
            seriesRule: (one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: series }) || {}).rrule,
            nextRule: (one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: next }) || {}).rrule,
            nextJoe: all("mantle.work.effort.WorkEffortParty", { workEffortId: next, partyId: "ORG_ZIZI_JD" }).length,
            overrideJoe: all("mantle.work.effort.WorkEffortParty", { workEffortId: override, partyId: "ORG_ZIZI_JD" }).length }
    },
    then({ thisOne, override, assoc, afterThis, following, next, afterFollowing, nextStarts, allMove, afterAllNext, seriesRule, nextRule, nextJoe, overrideJoe }) {
        thisOne.errors == ""
        override != made.series
        userText(assoc.fromDate) == day(8) + " 09:00"
        overrideJoe == 1
        afterThis.includes(day(1) + " 09:00")
        afterThis.includes(day(8) + " 11:00")
        !afterThis.includes(day(8) + " 09:00")
        afterThis.includes(day(15) + " 09:00")
        following.errors == ""
        next != made.series
        seriesRule.includes("UNTIL=")
        // the old series ends before the fourth instance; its changed one stays
        afterFollowing.includes(day(15) + " 09:00")
        afterFollowing.includes(day(8) + " 11:00")
        !afterFollowing.includes(day(22) + " 09:00")
        nextStarts.includes(day(22) + " 14:00")
        nextStarts.includes(day(29) + " 14:00")
        nextJoe == 1
        allMove.errors == ""
        // the whole new series a day later, its weekday with it
        afterAllNext.includes(day(23) + " 14:00")
        afterAllNext.includes(day(30) + " 14:00")
        !afterAllNext.includes(day(22) + " 14:00")
        nextRule != null
    },
})

feature("an instance, the following ones and a whole series cancel; the attendees are told", {
    when() {
        const series = made.series
        const before = notices("ORG_ZIZI_JD", "EventInvitation").length
        const one_ = post("cancelEvent", { workEffortId: series, instanceStart: day(15) + " 09:00", scope: "this", notify: "Y" })
        const afterOne = events(day(0), day(20)).json.eventList || []
        // one instance is left out of the series (an EXDATE, UTC), not made an event of its own
        const exdate = new Date(millisOf(day(15) + " 09:00")).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
        const exdates = String((one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: series }) || {}).exdates || "")
        const instanceRows = all("mantle.work.effort.WorkEffortAssoc", { workEffortId: series, workEffortAssocTypeEnumId: "WeatRecurrenceInstance" })
                .filter((assoc) => userText(assoc.fromDate) === day(15) + " 09:00").length
        const quick = made.quick
        const whole = post("cancelEvent", { workEffortId: quick, instanceStart: day(4) + " 15:00", scope: "all", notify: "Y" })
        const quickRow = one("mantle.work.effort.WorkEffort", { workEffortId: quick })
        return { one_, whole, starts: afterOne.filter((event) => event.recurringEventId === series || event.workEffortId === series).map((event) => event.start),
            quickRow, told: notices("ORG_ZIZI_JD", "EventInvitation").length - before,
            quickShown: byId(events(day(0), day(20)), quick).length, exdate, exdates, instanceRows }
    },
    then({ one_, whole, starts, quickRow, told, quickShown, exdate, exdates, instanceRows }) {
        one_.errors == ""
        message(one_).startsWith("Event cancelled")
        !starts.includes(day(15) + " 09:00")
        exdates.split(",").includes(exdate)
        instanceRows == 0
        starts.includes(day(1) + " 09:00")
        whole.errors == ""
        quickRow.statusId == "WeCancelled"
        quickShown == 0
        told >= 2
    },
})

feature("the answer to an invitation: accepted, then declined and off the grid; the organizer hears of it", {
    when() {
        const before = notices("ORG_ZIZI_JD", "EventInvitationResponse").length
        const accept = post("respond", { workEffortId: "BOSS_DEMO_EV_PLANNING", response: "accept" })
        const accepted = all("mantle.work.effort.WorkEffortParty", { workEffortId: "BOSS_DEMO_EV_PLANNING", partyId: "EX_JOHN_DOE" })[0]
        const decline = post("respond", { workEffortId: "BOSS_DEMO_EV_PLANNING", response: "decline", message: "On leave that day" })
        const declined = all("mantle.work.effort.WorkEffortParty", { workEffortId: "BOSS_DEMO_EV_PLANNING", partyId: "EX_JOHN_DOE" })[0]
        const week = events(weekStart, weekEnd)
        post("respond", { workEffortId: "BOSS_DEMO_EV_PLANNING", response: "tentative" })
        const notOn = post("respond", { workEffortId: "BOSS_DEMO_EV_DENTIST", response: "accept" })
        return { accept, accepted, decline, declined, week, told: notices("ORG_ZIZI_JD", "EventInvitationResponse").length - before, notOn }
    },
    then({ accept, accepted, decline, declined, week, told, notOn }) {
        accept.errors == ""
        message(accept) == "You accepted"
        accepted.statusId == "WeptAssigned"
        decline.errors == ""
        declined.statusId == "WeptDeclined"
        declined.comments == "On leave that day"
        !titles(week).includes("Release planning")
        told >= 2
        notOn.errors.includes("not invited")
    },
})

feature("the popover: the sync's time, repeat, room, join link and the answers; a moved instance; a free/busy event seen by ADMIN through the record rule", {
    when() {
        return { sync: get("eventSummary", { workEffortId: "BOSS_DEMO_EV_SYNC", instanceStart: D + " 10:00" }),
            moved: get("eventSummary", { workEffortId: "BOSS_DEMO_EV_SYNC_MOVED" }),
            interview: get("eventSummary", { workEffortId: "BOSS_DEMO_EV_INTERVIEW" }) }
    },
    then({ sync, moved, interview }) {
        sync.json.visible
        sync.json.event.name == "Team sync"
        sync.json.event.startText == D + " 10:00"
        sync.json.event.endText == D + " 10:30"
        sync.json.event.recurrenceText.startsWith("Weekly on")
        sync.json.event.joinUrl == "https://meet.example.com/team-sync"
        sync.json.event.canEdit
        !sync.json.event.canRsvp
        sync.json.event.rooms[0].statusLabel == "Booked"
        sync.json.event.attendees.find((party) => party.partyId === "ORG_ZIZI_BD").statusLabel == "Maybe"
        sync.json.event.attendees.find((party) => party.partyId === "ORG_ZIZI_BD").optional
        sync.json.event.attendees.find((party) => party.partyId === "ORG_ZIZI_JD").statusLabel == "Accepted"
        sync.json.event.url.includes("instanceStart=")
        moved.json.event.isInstance
        moved.json.event.recurrenceText.startsWith("Weekly on")
        moved.json.event.startText == day(8) + " 15:00"
        // Bob's interview is in a calendar john.doe sees as free/busy only, and he is not on it; ADMIN sees it by the record rule
        interview.json.visible
    },
})

feature("the search finds john.doe's events by name and place", {
    when() {
        return { sync: get("searchEvents", { text: "sync" }).json.resultList || [], acme: get("searchEvents", { text: "Acme", calendarIds: "BOSS_DEMO_CAL_JD" }).json.resultList || [],
            short: get("searchEvents", { text: "s" }).json.resultList || [] }
    },
    then({ sync, acme, short }) {
        sync.some((result) => result.workEffortId === "BOSS_DEMO_EV_SYNC" && result.recurring)
        acme.some((result) => result.workEffortId === "BOSS_DEMO_EV_WORKSHOP")
        short.length == 0
    },
})

feature("Find a time suggests slots when john.doe and Joe are both free, in working hours", {
    when() {
        const answer = get("findTime", { partyIds: "ORG_ZIZI_JD", durationMinutes: "60", fromDay: day(1), dayCount: "3", workingHoursOnly: "Y" })
        return { answer, slots: answer.json.slotList || [] }
    },
    then({ answer, slots }) {
        answer.status == 200
        slots.length > 0
        answer.json.partyIds.includes("EX_JOHN_DOE")
        // Joe's dentist is at 08:00 on D+1, before working hours anyway; no slot is at the time of the closure-free planning hour
        slots.every((slot) => slot.start.substring(11) >= "09:00" && slot.end.substring(11) <= "17:00")
        !slots.some((slot) => slot.start === day(2) + " 13:00")
    },
})

feature("Joe Developer may not see john.doe's family birthday, nor change his events", {
    when() {
        return as("joe.developer", () => ({
            summary: get("eventSummary", { workEffortId: "BOSS_DEMO_EV_BIRTHDAY" }),
            move: post("moveEvent", { workEffortId: "BOSS_DEMO_EV_WORKSHOP", start: day(2) + " 10:00", end: day(2) + " 12:00" }),
            week: get("calendarEvents", { start: day(-1), end: day(8), calendarIds: "BOSS_DEMO_CAL_FAMILY,BOSS_DEMO_CAL_JD" }),
            respond: post("respond", { workEffortId: "BOSS_DEMO_EV_BIRTHDAY", response: "accept" })
        }))
    },
    then({ summary, move, week, respond }) {
        !summary.json.visible
        move.errors.includes("not available") || move.errors.includes("Only the organizer")
        !titles(week).includes("Mary's birthday")
        week.json.skippedCalendarIdList.includes("BOSS_DEMO_CAL_FAMILY")
        respond.errors.includes("not available")
    },
})
