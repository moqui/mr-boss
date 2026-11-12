// People's attendance screens (impl-people P13; design-people §6 Attendance and TimeImport, §1.4 Quick create): a door file for Retail
// read by work email (Tomas in with no out, and a worker People does not know) through Time import; Attendance's one qvt render as
// the manager with Tomas's day open (the punch as it came, what is missing, the correction he asked waiting and Approve), approved
// from her Approvals (the tray's approve service); Time import's one html render as HR with the problem rows; Admin's Imports listing
// the run with People's owner place; and the Clock in quick create: the employee's shell offers it from Commons and a People user
// who does not clock is not offered it (its condition-service), and its screen's one html render shows him his clock. SelfService's
// clock is checked on PeopleSelfService's render; the rules are Mantle's Attendance; access is PeopleAccess's (the self-service
// clock, Time import HR's).
// Run: ./moq test mr-boss --spec PeopleAttendance
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const A = "mantle.humanres.AttendanceServices."
const REASON = "Forgot to clock out at the till"
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // HR reads a door file of Retail: Tomas in on a Monday with no out, and a worker People does not know
        state.preview = asUser(users.hr, () =>
            system(() =>
                invoke(A + "preview#Import", {
                    organizationPartyId: ids.organizationId,
                    importText:
                        "worker,time,direction,id\n" +
                        "tomas.lindqvist@ziziwork.example,2026-10-05 08:02,in,DOOR-1\n" +
                        "nobody@ziziwork.example,2026-10-05 08:10,in,DOOR-2\n",
                    fileName: "shop-door.csv",
                    sourceSystem: "Shop door",
                    timeZone: "America/Chicago",
                    workerIdKind: "workEmail"
                })
            )
        )
        state.imported = asUser(users.hr, () =>
            system(() => invoke(A + "import#Records", {attendanceImportId: state.preview.attendanceImportId}))
        )
        state.dayId = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.humanres.attendance.AttendanceDay")
                        .condition({partyRelationshipId: ids.employmentId, attendanceDate: "2026-10-05"})
                        .list()
                )[0]?.attendanceDayId
        )
        // Tomas asks to correct it, through Mantle's own checks (the screen's transition is the time area's grant)
        state.asked = asUser(users.employee, () =>
            system(() =>
                invoke(A + "request#Correction", {
                    attendanceDayId: state.dayId,
                    fromTime: "08:00",
                    thruTime: "16:30",
                    reason: REASON
                })
            )
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "Attendance as the manager: Tomas's day open with its punch as it came, what is missing, his correction and Approve; she approves it from Approvals",
    {
        when() {
            const rendered = asUser(users.manager, () => page("Time/Attendance", {attendanceDayId: state.dayId}))
            const notice = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("moqui.security.user.NotificationMessage")
                            .condition({topic: "PeopleAttendanceApproval", recordId: state.asked.attendanceCorrectionId})
                            .list()
                    )[0]
            )
            const approved = asUser(users.manager, () =>
                system(() =>
                    invoke("org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                        notificationMessageId: notice?.notificationMessageId
                    })
                )
            )
            const day = asUser(users.employee, () => system(() => invoke(A + "get#Day", {attendanceDayId: state.dayId})))
            return {rendered, notice, approved, day}
        },
        then({rendered, notice, approved, day}) {
            state.imported.importedCount == 1 && state.imported.errorCount == 1
            state.asked.statusEnumId == "AcsRequested"
            rendered.status == 200 && rendered.errors.length == 0
            rendered.output.includes("Tomas Lindqvist: Mon 2026-10-05")
            rendered.output.includes("Missing out-punch") &&
                rendered.output.includes("Shop door") &&
                rendered.output.includes("DOOR-1")
            rendered.output.includes(REASON) && rendered.output.includes("Approve") && rendered.output.includes("Refuse")
            // the notice names the person and the day, never the reason
            String(notice.titleText).includes("Tomas Lindqvist on 2026-10-05") && !String(notice.titleText).includes(REASON)
            !String(notice.messageJson).includes(REASON)
            day.day.statusEnumId == "AdsCorrected" && day.day.workedText == "8:30" && day.punches.length == 1
        }
    }
)

feature("Time import as HR shows the rows that were not imported and why; Admin's Imports lists the run with People's place", {
    when() {
        const rendered = asUser(users.hr, () =>
            page("Time/TimeImport", {attendanceImportId: state.preview.attendanceImportId, outcome: "problems"}, "html")
        )
        const listed = system(() => invoke("org.moqui.admin.DataTransferServices.find#ImportRuns", {}))
        return {rendered, listed}
    },
    then({rendered, listed}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("shop-door.csv: Ziziwork Retail") && rendered.output.includes("Shop door")
        rendered.output.includes("nobody@ziziwork.example") && rendered.output.includes("No person is nobody@ziziwork.example")
        !rendered.output.includes("DOOR-1")
        const run = Array.from(listed.transferList || []).find(found => found.runId === state.preview.attendanceImportId)
        run.targetId == ids.timeImportTargetId && run.ownerApp == "People" && run.ownerRoute == "peopleTimeImport"
        run.appliedCount == 1 && run.errorCount == 1 && run.ownerParameters.attendanceImportId == state.preview.attendanceImportId
    }
})

// the quick create kinds the user's shell offers from Commons
const clockInOffered = username =>
    asUser(username, () => {
        const shell = JSON.parse(
            ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("shellData", {}, null).output
        )
        const commons = Array.from(shell.apps || []).find(app => app.name === "Commons")
        return Array.from(commons?.providers?.quickCreate || []).some(
            entry => entry.kind === "peopleClockIn" && String(entry.url).includes("People/Time/Clock")
        )
    })

feature(
    "the Clock in quick create: offered to the employee who clocks, not to a People user who does not; its screen shows his clock",
    {
        when() {
            const offered = clockInOffered(users.employee)
            // the reader's employment does not clock (no setting, and Retail's default is off): no Clock in in their + menu
            const notOffered = clockInOffered(users.reader)
            const rendered = asUser(users.employee, () => page("Time/Clock", {}, "html"))
            const reader = asUser(users.reader, () => system(() => invoke(A + "get#MyClock", {})))
            return {offered, notOffered, rendered, reader}
        },
        then({offered, notOffered, rendered, reader}) {
            offered && !notOffered
            rendered.status == 200 && rendered.errors.length == 0
            rendered.output.includes("Clocked") && rendered.output.includes("Clock")
            !rendered.output.includes("Clocking is not on")
            // a People user whose employment has no clocking has no clock to show
            reader.clocking == false
        }
    }
)
