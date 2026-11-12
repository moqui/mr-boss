// People P13's "usable when" (impl-people P13; design-people §6 Attendance and TimeImport, §3 SelfService's Clock, §14.3 "Attendance,
// timesheets and DST", its evidence half), as an acceptance walk with artifact authorization on, through the screens' transitions:
// Tomas (people.employee, clocking on in the demo) clocks in and out from his self-service on his phone, and his attendance shows the
// day; a door file HR imports has his in-punch of a past day with no out, which his attendance names as a missing out-punch; he asks
// to correct it and Hannah (people.manager) approves it from Approvals, the punch kept as it came; a device file imported twice
// through Time import adds its rows once and names the bad one. The rules themselves are Mantle's Attendance and mr-boss's
// PeopleAttendance.
// Run: ./moq accept mr-boss --spec PeopleAttendanceUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const A = "mantle.humanres.AttendanceServices."
const webroot = "component://webroot/screen/webroot.xml"
// a request under the web root as the user (a transition's post, a page), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .header("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
            .render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const dayText = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd")
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // a Tuesday two weeks back, before today in any zone
        const today = dayText(ec.user.timestampMillis(ec.user.nowTimestamp))
        const weekday = new Date(today + "T12:00:00Z").getUTCDay()
        state.pastDay = dayText(Date.parse(today + "T12:00:00Z") - (14 + ((weekday - 2 + 7) % 7)) * 86400000)
        state.fileDay = dayText(Date.parse(state.pastDay + "T12:00:00Z") - 86400000)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("Tomas clocks in and out from his self-service on his phone, and his attendance shows the day", {
    when() {
        const out = {}
        out.page = request(users.employee, "apps/Commons/People/SelfService", {lastStandalone: "-2"})
        const clock = key => request(users.employee, "apps/Commons/People/SelfService/clock", {operationKey: key}, "post").errors
        out.clockIn = clock("PPL_ACCEPT_CLOCK_IN")
        out.retry = clock("PPL_ACCEPT_CLOCK_IN")
        out.state = read(users.employee, A + "get#MyClock", {}).employments?.[0] || {}
        out.clockOut = clock("PPL_ACCEPT_CLOCK_OUT")
        out.after = read(users.employee, A + "get#MyClock", {}).employments?.[0] || {}
        out.mine = read(users.employee, A + "find#Attendance", {mine: true}).days || []
        return out
    },
    then({page, clockIn, retry, state: clocked, clockOut, after, mine}) {
        page.status == 200 && page.errors == "" && page.output.includes("Clock in")
        clockIn == "" && retry == "" && clocked.clockedIn
        clockOut == "" && !after.clockedIn
        mine.length >= 1 && mine[0].punchCount >= 2 && mine[0].lastOutText != ""
    }
})

feature(
    "a door file has Tomas in with no out; he asks to correct the day and Hannah approves it from Approvals, the punch kept",
    {
        when() {
            const out = {}
            const file = "worker,time,direction,id\n" + ids.employeePartyId + "," + state.pastDay + " 07:58,in,DOOR-ACC-1\n"
            out.previewed = request(
                users.hr,
                "apps/People/Time/TimeImport/previewImport",
                {
                    organizationPartyId: ids.organizationId,
                    importText: file,
                    sourceSystem: "Acceptance door",
                    timeZone: "America/Chicago",
                    workerIdKind: "partyId"
                },
                "post"
            ).errors
            const batch = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.humanres.attendance.AttendanceImport")
                            .condition({sourceSystem: "Acceptance door"})
                            .orderBy("-createdDate")
                            .limit(1)
                            .list()
                    )[0]
            )
            out.imported = request(
                users.hr,
                "apps/People/Time/TimeImport/importRecords",
                {attendanceImportId: batch?.attendanceImportId},
                "post"
            ).errors
            const missing =
                read(users.employee, A + "find#Attendance", {mine: true, exceptionsOnly: true, fromDate: state.pastDay}).days ||
                []
            out.missing = missing.find(row => row.attendanceDate === state.pastDay) || {}
            out.list = request(users.employee, "apps/People/Time/Attendance", {
                show: "mine",
                exceptionsOnly: "Y",
                lastStandalone: "-2"
            })
            out.asked = request(
                users.employee,
                "apps/People/Time/Attendance/requestCorrection",
                {
                    attendanceDayId: out.missing.attendanceDayId,
                    fromTime: "08:00",
                    thruTime: "16:00",
                    reason: "Left by the back door"
                },
                "post"
            ).errors
            const notices = asUser(users.manager, () =>
                system(() =>
                    Array.from(
                        ec.entity
                            .find("moqui.security.user.NotificationMessageByUser")
                            .condition({userId: ec.user.userId, topic: "PeopleAttendanceApproval"})
                            .list()
                    )
                )
            )
            out.notices = notices.length
            out.approved = notices
                .map(
                    notice =>
                        request(
                            users.manager,
                            "apps/People/Approvals/Notifications/approve",
                            {notificationMessageId: notice.notificationMessageId},
                            "post"
                        ).errors
                )
                .join("")
            out.day = read(users.employee, A + "get#Day", {attendanceDayId: out.missing.attendanceDayId})
            return out
        },
        then({previewed, imported, missing, list, asked, notices, approved, day}) {
            previewed == "" && imported == ""
            missing.flagsText == "Missing out-punch"
            list.status == 200 && list.output.includes("Missing out-punch")
            asked == "" && notices >= 1 && approved == ""
            day.day.statusEnumId == "AdsCorrected" && day.day.workedText == "8:00"
            day.punches.length == 1 && day.punches[0].externalKey == "DOOR-ACC-1"
        }
    }
)

feature("a device file imported twice through Time import adds its rows once and names the bad one", {
    when() {
        const file =
            "worker,time,direction,id\n" +
            ids.reportPartyId +
            "," +
            state.fileDay +
            " 09:00,in,DEV-1\n" +
            ids.reportPartyId +
            "," +
            state.fileDay +
            " 17:00,out,DEV-2\n" +
            "BOSS_PPL_NOBODY," +
            state.fileDay +
            " 09:05,in,DEV-3\n"
        const once = () => {
            const errors = request(
                users.hr,
                "apps/People/Time/TimeImport/previewImport",
                {
                    organizationPartyId: ids.organizationId,
                    importText: file,
                    sourceSystem: "Acceptance device",
                    timeZone: "America/Chicago",
                    workerIdKind: "partyId"
                },
                "post"
            ).errors
            const batch = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.humanres.attendance.AttendanceImport")
                            .condition({sourceSystem: "Acceptance device"})
                            .orderBy("-createdDate")
                            .limit(1)
                            .list()
                    )[0]
            )
            const imported = request(
                users.hr,
                "apps/People/Time/TimeImport/importRecords",
                {attendanceImportId: batch.attendanceImportId},
                "post"
            ).errors
            const result = read(users.hr, A + "get#Import", {attendanceImportId: batch.attendanceImportId})
            return {errors: errors + imported, batch: result.attendanceImport, rows: result.rows}
        }
        const first = once()
        const second = once()
        const page = request(users.hr, "apps/People/Time/TimeImport", {
            attendanceImportId: second.batch.attendanceImportId,
            outcome: "problems",
            lastStandalone: "-2"
        })
        const punches = system(() =>
            ec.entity.find("mantle.humanres.attendance.AttendancePunch").condition({sourceSystem: "Acceptance device"}).count()
        )
        return {first, second, page, punches}
    },
    then({first, second, page, punches}) {
        first.errors == "" && first.batch.importedCount == 2 && first.batch.errorCount == 1
        second.errors == "" && second.batch.importedCount == 0 && second.batch.skippedCount == 2 && second.batch.errorCount == 1
        punches == 2
        second.rows.find(row => row.outcome == "refused").reasonCode == "WORKER_UNKNOWN"
        page.status == 200 && page.output.includes("BOSS_PPL_NOBODY") && page.output.includes("No person is BOSS_PPL_NOBODY")
    }
})
