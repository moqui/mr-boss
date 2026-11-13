// People P9's "usable when" (impl-people P9; design-people §6 WorkingSchedules and WorkingScheduleDetail, §7 HolidayCalendars), as
// an acceptance walk with artifact authorization on: people.hr defines a four-day week in another zone (Berlin, Monday to Thursday,
// ten hours a day) through WorkingSchedules and WorkingScheduleDetail, makes a holiday calendar of Retail and adds a holiday on the
// Wednesday of the second week through Holidays, names it the schedule's calendar, and assigns the schedule to Greta from next
// Monday; the capacity preview on WorkingScheduleDetail and Projects' PersonDetail show the same hours for his weeks (40, then 30
// with the holiday) and both say they come from the working schedule. The rules themselves are Mantle's PeopleSchedules and
// mr-boss's PeopleSchedules and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeopleSchedulesUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.ScheduleServices."
const webroot = "component://webroot/screen/webroot.xml"
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const day = 24 * 60 * 60 * 1000
// Greta, who leads Retail, an employee whose employment no other spec changes (PeopleOrganizationUsable changes Rafael's
// manager from next month, which a schedule from next Monday may not come before)
const workerPartyId = "BOSS_PPL_GRETA"
const workerEmploymentId = "BOSS_PPL_GRETA_EMP"
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a Mantle read as the user, for the walk's checks (the screens show the same answer)
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const dayText = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd")
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // next Monday, and the Wednesday of the week after it
        const now = ec.user.timestampMillis(ec.user.nowTimestamp)
        const weekday = new Date(dayText(now) + "T12:00:00Z").getUTCDay()
        const monday = now + ((8 - weekday) % 7 || 7) * day
        state.monday = dayText(monday)
        state.secondMonday = dayText(monday + 7 * day)
        state.holiday = dayText(monday + 9 * day)
        state.lastDay = dayText(monday + 13 * day)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "people.hr defines a four-day week in Berlin with a holiday calendar and a holiday, and assigns it to Greta from next Monday",
    {
        when() {
            const problems = []
            const created = request(
                users.hr,
                "apps/People/Time/WorkingSchedules/storeSchedule",
                {organizationPartyId: ids.organizationId, scheduleName: "Berlin four-day week", timeZone: "Europe/Berlin"},
                "post"
            )
            if (created.errors) problems.push(`the schedule: ${created.errors}`)
            state.scheduleId = read(users.hr, S + "find#Schedules", {
                term: "Berlin four-day week"
            }).schedules[0]?.workingScheduleId
            const revision = () => read(users.hr, S + "get#Schedule", {workingScheduleId: state.scheduleId}).schedule.revision
            for (const isoDay of ["1", "2", "3", "4"]) {
                const added = request(
                    users.hr,
                    "apps/People/Time/WorkingScheduleDetail/storeLine",
                    {
                        workingScheduleId: state.scheduleId,
                        expectedRevision: revision(),
                        isoDay,
                        startTime: "08:00",
                        endTime: "18:30",
                        breakMinutes: "30"
                    },
                    "post"
                )
                if (added.errors) problems.push(`day ${isoDay}: ${added.errors}`)
            }
            const calendar = request(
                users.hr,
                "apps/People/Time/HolidayCalendars/storeCalendar",
                {calendarName: "Berlin office holidays", organizationPartyId: ids.organizationId},
                "post"
            )
            if (calendar.errors) problems.push(`the calendar: ${calendar.errors}`)
            state.calendarId = read(users.hr, S + "get#Holidays", {}).calendars.find(
                row => row.calendarName === "Berlin office holidays"
            )?.holidayCategoryId
            const holiday = request(
                users.hr,
                "apps/People/Time/HolidayCalendars/storeHoliday",
                {holidayCategoryId: state.calendarId, workEffortName: "Office closed", holidayDate: state.holiday},
                "post"
            )
            if (holiday.errors) problems.push(`the holiday: ${holiday.errors}`)
            const named = request(
                users.hr,
                "apps/People/Time/WorkingScheduleDetail/storeSchedule",
                {workingScheduleId: state.scheduleId, expectedRevision: revision(), holidayCategoryId: state.calendarId},
                "post"
            )
            if (named.errors) problems.push(`the schedule's calendar: ${named.errors}`)
            const assigned = request(
                users.hr,
                "apps/People/Time/WorkingScheduleDetail/assignSchedule",
                {
                    workingScheduleId: state.scheduleId,
                    partyRelationshipId: workerEmploymentId,
                    fromDate: state.monday,
                    reason: "Moves to Berlin"
                },
                "post"
            )
            if (assigned.errors) problems.push(`the assignment: ${assigned.errors}`)
            const schedule = read(users.hr, S + "get#Schedule", {workingScheduleId: state.scheduleId})
            if (schedule.schedule.weeklyHours !== 40 || schedule.schedule.holidayCalendarName !== "Berlin office holidays")
                problems.push(`the schedule: ${JSON.stringify(schedule.schedule)}`)
            if (!schedule.assignments.some(row => row.partyId === workerPartyId))
                problems.push("Greta does not follow the schedule")
            const list = asUser(users.hr, () => page("Time/WorkingSchedules", {term: "Berlin"}, "html"))
            if (!opened(list) || !list.output.includes("Berlin four-day week") || !list.output.includes("Europe/Berlin"))
                problems.push(`WorkingSchedules: ${list.status} ${list.errors}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the capacity preview and Projects' PersonDetail show Greta the same hours from the working schedule", {
    when() {
        const problems = []
        const preview = read(users.hr, S + "get#CapacityPreview", {
            partyId: workerPartyId,
            fromDate: state.monday,
            thruDate: state.lastDay
        })
        const previewWeeks = Object.fromEntries(
            Array.from(preview.weeks || []).map(week => [week.weekStart, Number(week.capacity)])
        )
        if (preview.source !== "schedule") problems.push(`the preview's source: ${preview.source}`)
        if (previewWeeks[state.monday] !== 40 || previewWeeks[state.secondMonday] !== 30)
            problems.push(`the preview's weeks: ${JSON.stringify(previewWeeks)}`)
        const detail = asUser(users.hr, () =>
            page(
                "Time/WorkingScheduleDetail",
                {
                    workingScheduleId: state.scheduleId,
                    previewPartyId: workerPartyId,
                    previewFromDate: state.monday,
                    previewThruDate: state.lastDay
                },
                "html"
            )
        )
        if (!opened(detail) || !detail.output.includes("The working schedule") || !detail.output.includes("Office closed"))
            problems.push(`WorkingScheduleDetail's preview: ${detail.status} ${detail.errors}`)
        // Projects' PersonDetail, as a Projects manager sees it
        const overview = asUser(users.system, () =>
            system(() => invoke("ironstone.projects.ResourceServices.get#PersonOverview", {partyId: workerPartyId, weeks: 4}))
        ).overview
        const projectsWeeks = Object.fromEntries(
            Array.from(overview?.weekList || []).map(week => [week.weekStart, Number(week.capacity)])
        )
        for (const weekStart of [state.monday, state.secondMonday])
            if (projectsWeeks[weekStart] !== previewWeeks[weekStart])
                problems.push(
                    `the week of ${weekStart}: PersonDetail ${projectsWeeks[weekStart]}, the preview ${previewWeeks[weekStart]}`
                )
        if (overview?.sourceText !== "Their working schedule (People)")
            problems.push(`PersonDetail's source: ${overview?.sourceText}`)
        const personDetail = asUser(users.system, () =>
            page("Resources/PersonDetail", {partyId: workerPartyId}, "html", "Projects")
        )
        if (!opened(personDetail) || !personDetail.output.includes("Their working schedule (People)"))
            problems.push(`Projects' PersonDetail: ${personDetail.status} ${personDetail.errors}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
