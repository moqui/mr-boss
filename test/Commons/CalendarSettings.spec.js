// Commons Settings/Calendars and the Calendar box of Settings/Preferences (screen/Commons/Settings/Calendars.xml, Preferences.xml,
// service/ironstone/commons/CalendarServices.xml; impl-drawers-commons.md M7, design-drawers-commons.md §11): john.doe's calendars on the
// calendar demo (data/BossCalendarDemoData.xml, loaded again here). The page lists his own, the shared ones and the
// subscription whose fetch failed; a calendar is created, renamed, colored, made the default and deleted; Family is shared with
// Joe Developer, who then sees its events, and unshared; a feed is subscribed to, fetched now from an address that does not
// answer (its status failed, with the reason) and stored from a feed's text (ok, its event on the grid); an .ics file is
// imported into a calendar and a calendar exported. The calendar defaults are saved as preferences that the calendar reads. Joe
// may not change or export john.doe's Family calendar.
// Run: ./moq test mr-boss --spec CalendarSettings
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
let D
const made = {}

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function call_(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output: String(str.output || "") }
}
const post = (name, parameters) => call_(`Settings/Calendars/${name}`, parameters, "post")
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
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
const addDays = (text, days) => { const [y, m, d] = text.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + days)).toISOString().substring(0, 10) }
const day = (offset) => addDays(D, offset)
const calendarEvents = (start, end, ids) => call_("Calendar/calendarEvents", { start, end, calendarIds: ids }).json.eventList || []
const ics = (uid, summary, dayText) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IronStone//Spec//EN", "BEGIN:VEVENT", "UID:" + uid,
    "DTSTAMP:20260101T000000Z", "DTSTART;VALUE=DATE:" + dayText.replace(/-/g, ""), "DTEND;VALUE=DATE:" + addDays(dayText, 1).replace(/-/g, ""),
    "SUMMARY:" + summary, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n")

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.CalendarDemoServices.load#CalendarDemo", {}))
        D = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    },
    cleanup() { login("john.doe") },
})

feature("Settings/Calendars lists john.doe's calendars, the shared ones and the subscription whose fetch failed", {
    when() {
        return { page: render("apps/Commons/Settings/Calendars"), settings: sys(() => call("ironstone.commons.CalendarServices.get#CalendarSettings", {})) }
    },
    then({ page, settings }) {
        page.status == 200
        !page.broken
        page.output.includes("Family")
        page.output.includes("Joe Developer")
        page.output.includes("Holidays (demo feed)")
        page.output.includes("The feed answered 404 Not Found")
        settings.mineList.map((calendar) => calendar.calendarId).includes("BOSS_DEMO_CAL_FAMILY")
        settings.subscriptionList[0].fetchStatus == "error"
        settings.sharedList.some((calendar) => calendar.calendarId === "BOSS_DEMO_CAL_TEAM" && calendar.canManage)
        settings.shareList.some((share) => share.calendarId === "BOSS_DEMO_CAL_TEAM" && share.who === "Joe Developer" && share.permissionEnumId === "CalpEdit")
    },
})

feature("a calendar is created, renamed and colored, made the default and back, and deleted; the default is not deleted", {
    when() {
        const created = post("createCalendar", { calendarName: "BOSS_TEST Garden club", color: "#00897b" })
        const row = all("mantle.work.calendar.Calendar", { calendarName: "BOSS_TEST Garden club" })[0] || {}
        made.calendar = row.calendarId
        const updated = post("updateCalendar", { calendarId: row.calendarId, calendarName: "BOSS_TEST Allotment", color: "#d81b60", description: "Saturdays", isDefault: "Y" })
        const asDefault = one("mantle.work.calendar.Calendar", { calendarId: row.calendarId })
        const refused = post("deleteCalendar", { calendarId: row.calendarId })
        post("updateCalendar", { calendarId: "BOSS_DEMO_CAL_JD", calendarName: "John Doe", isDefault: "Y" })
        const deleted = post("deleteCalendar", { calendarId: row.calendarId })
        return { created, row, updated, asDefault, refused, deleted, gone: one("mantle.work.calendar.Calendar", { calendarId: row.calendarId }),
            johnDefault: one("mantle.work.calendar.Calendar", { calendarId: "BOSS_DEMO_CAL_JD" }).isDefault }
    },
    then({ created, row, updated, asDefault, refused, deleted, gone, johnDefault }) {
        created.errors == ""
        row.color == "#00897b"
        row.calendarKindEnumId == "CalkPersonal"
        updated.errors == ""
        asDefault.calendarName == "BOSS_TEST Allotment"
        asDefault.color == "#d81b60"
        asDefault.description == "Saturdays"
        asDefault.isDefault == "Y"
        refused.errors.includes("default calendar cannot be deleted")
        deleted.errors == ""
        gone == null
        johnDefault == "Y"
    },
})

feature("Family shared with Joe Developer: he sees it and its birthday; unshared, he does not", {
    when() {
        const shared = post("shareCalendar", { calendarId: "BOSS_DEMO_CAL_FAMILY", shareUserId: "ORG_ZIZI_JD", permissionEnumId: "CalpView" })
        const share = current("mantle.work.calendar.CalendarShare", { calendarId: "BOSS_DEMO_CAL_FAMILY", userId: "ORG_ZIZI_JD" })[0] || {}
        const joeSees = as("joe.developer", () => calendarEvents(D, day(8), "BOSS_DEMO_CAL_FAMILY").map((event) => event.title))
        const unshared = post("unshareCalendar", { calendarId: "BOSS_DEMO_CAL_FAMILY", calendarShareId: share.calendarShareId })
        const joeAfter = as("joe.developer", () => calendarEvents(D, day(8), "BOSS_DEMO_CAL_FAMILY").map((event) => event.title))
        return { shared, share, joeSees, unshared, joeAfter }
    },
    then({ shared, share, joeSees, unshared, joeAfter }) {
        shared.errors == ""
        share.permissionEnumId == "CalpView"
        joeSees.includes("Mary's birthday")
        unshared.errors == ""
        !joeAfter.includes("Mary's birthday")
    },
})

feature("a feed: subscribed, fetched now from an address that does not answer (failed, with the reason), then read from its text", {
    when() {
        const subscribed = post("subscribe", { url: "http://127.0.0.1:9/school.ics", calendarName: "BOSS_TEST School", refreshMinutes: "1440", fetchNow: "N" })
        const calendar = all("mantle.work.calendar.Calendar", { calendarName: "BOSS_TEST School" })[0] || {}
        made.feed = calendar.calendarId
        const fresh = sys(() => call("ironstone.commons.CalendarServices.get#CalendarSettings", {})).subscriptionList.find((item) => item.calendarId === calendar.calendarId) || {}
        const fetched = post("fetchNow", { calendarId: calendar.calendarId })
        const failed = one("mantle.work.calendar.CalendarSubscription", { calendarId: calendar.calendarId })
        sys(() => call("mantle.work.CalendarServices.store#CalendarFeedText", { calendarId: calendar.calendarId, feedText: ics("boss-test-school-1@example.org", "Parents evening", day(3)) }))
        const ok = one("mantle.work.calendar.CalendarSubscription", { calendarId: calendar.calendarId })
        const grid = calendarEvents(D, day(6), calendar.calendarId).map((event) => event.title)
        const setup = call_("Calendar/calendarSetup", {}).json.calendarList.find((item) => item.calendarId === calendar.calendarId) || {}
        return { subscribed, calendar, fresh, fetched, failed, ok, grid, setup }
    },
    then({ subscribed, calendar, fresh, fetched, failed, ok, grid, setup }) {
        subscribed.errors == ""
        calendar.calendarKindEnumId == "CalkSubscription"
        fresh.fetchStatusText == "Not fetched yet"
        fetched.errors == ""
        failed.lastFetchStatus == "error"
        failed.lastFetchError != null
        ok.lastFetchStatus == "ok"
        grid.includes("Parents evening")
        setup.group == "subscription"
        !setup.canAdd
        setup.warning == null
    },
})

feature("an .ics file imported into Family, a calendar exported as .ics", {
    when() {
        const imported = post("importIcs", { calendarId: "BOSS_DEMO_CAL_FAMILY", calendarFile: uploadedFile("family.ics", ics("boss-test-family-1@example.org", "Piano recital", day(4)), "text/calendar") })
        const grid = calendarEvents(D, day(6), "BOSS_DEMO_CAL_FAMILY").map((event) => event.title)
        const again = post("importIcs", { calendarId: "BOSS_DEMO_CAL_FAMILY", calendarFile: uploadedFile("family.ics", ics("boss-test-family-1@example.org", "Piano recital, hall B", day(4)), "text/calendar") })
        const recitals = all("mantle.work.effort.WorkEffort", { universalId: "boss-test-family-1@example.org" })
        const exported = call_("Settings/Calendars/exportCalendar", { calendarId: "BOSS_DEMO_CAL_FAMILY" }, null)
        return { imported, grid, again, recitals, exported }
    },
    then({ imported, grid, again, recitals, exported }) {
        imported.errors == ""
        grid.includes("Piano recital")
        again.errors == ""
        recitals.length == 1
        recitals[0].workEffortName == "Piano recital, hall B"
        exported.output.includes("BEGIN:VCALENDAR")
        exported.output.includes("SUMMARY:Mary's birthday")
        exported.output.includes("RRULE:FREQ=YEARLY")
    },
})

feature("the calendar defaults are saved as preferences the calendar reads; a bad value is refused", {
    when() {
        const saved = call_("Settings/Preferences/saveCalendarDefaults", { view: "month", weekStart: "1", workStart: "08:30", workEnd: "18:00", workDays: ["1", "2", "3", "4"],
            defaultDuration: "30", defaultReminder: "", showDeclined: "Y", showWeekNumbers: "Y", defaultCalendarId: "BOSS_DEMO_CAL_FAMILY" }, "post")
        const defaults = call_("Calendar/calendarSetup", {}).json
        const page = render("apps/Commons/Settings/Preferences")
        const backwards = call_("Settings/Preferences/saveCalendarDefaults", { workStart: "18:00", workEnd: "08:00" }, "post")
        const notMine = call_("Settings/Preferences/saveCalendarDefaults", { defaultCalendarId: "BOSS_DEMO_CAL_TEAM" }, "post")
        // back to the demo's
        call_("Settings/Preferences/saveCalendarDefaults", { view: "week", weekStart: "0", workStart: "09:00", workEnd: "17:00", workDays: ["1", "2", "3", "4", "5"],
            defaultDuration: "60", defaultReminder: "10", showDeclined: "N", showWeekNumbers: "N", defaultCalendarId: "BOSS_DEMO_CAL_JD" }, "post")
        return { saved, defaults, page, backwards, notMine }
    },
    then({ saved, defaults, page, backwards, notMine }) {
        saved.errors == ""
        defaults.defaults.view == "month"
        defaults.defaults.weekStart == 1
        defaults.defaults.workStart == "08:30"
        defaults.defaults.workEnd == "18:00"
        defaults.defaults.workDays == [1, 2, 3, 4]
        defaults.defaults.defaultDuration == 30
        defaults.defaults.defaultReminder == ""
        defaults.defaults.showDeclined
        defaults.defaults.showWeekNumbers
        defaults.defaultCalendarId == "BOSS_DEMO_CAL_FAMILY"
        page.output.includes("Week starts on")
        backwards.errors.includes("end after they start")
        notMine.errors.includes("own personal calendars")
    },
})

feature("the working hours are john.doe's for free/busy: Find a time keeps to them", {
    when() {
        call_("Settings/Preferences/saveCalendarDefaults", { workStart: "10:00", workEnd: "15:00", workDays: ["1", "2", "3", "4", "5"] }, "post")
        const hours = all("mantle.work.effort.WorkEffort", { ownerPartyId: "EX_JOHN_DOE", workEffortTypeEnumId: "WetAvailable", sourceReferenceId: "BossWorkingHours" })
        const slots = call_("Calendar/findTime", { durationMinutes: "60", fromDay: day(7), dayCount: "5", workingHoursOnly: "Y" }).json.slotList || []
        call_("Settings/Preferences/saveCalendarDefaults", { workStart: "09:00", workEnd: "17:00", workDays: ["1", "2", "3", "4", "5"] }, "post")
        return { hours, slots, rule: (one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: (hours[0] || {}).workEffortId }) || {}).rrule }
    },
    then({ hours, slots, rule }) {
        hours.length == 1
        rule == "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
        slots.length > 0
        slots.every((slot) => slot.start.substring(11) >= "10:00" && slot.end.substring(11) <= "15:00")
    },
})

feature("Joe Developer may not change or export john.doe's Family calendar", {
    when() {
        return as("joe.developer", () => ({
            // a calendar not his is not found to every write (Mantle's rule): one shows it
            update: post("updateCalendar", { calendarId: "BOSS_DEMO_CAL_FAMILY", calendarName: "Mine now" }),
            exported: call_("Settings/Calendars/exportCalendar", { calendarId: "BOSS_DEMO_CAL_FAMILY" }, null),
            page: render("apps/Commons/Settings/Calendars")
        }))
    },
    then({ update, exported, page }) {
        update.errors.includes("not found")
        !exported.output.includes("BEGIN:VCALENDAR")
        one("mantle.work.calendar.Calendar", { calendarId: "BOSS_DEMO_CAL_FAMILY" }).calendarName == "Family"
        !page.output.includes("Mary")
        page.output.includes("Joe Developer")
    },
})
