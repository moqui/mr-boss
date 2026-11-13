// People P14's "usable when" (impl-people P14; design-people §6 ShiftRoster, §3 SelfService, §13 TeamCalendar), as an acceptance
// walk with artifact authorization on: Hannah (people.manager) rosters next week for Tomas (people.employee), her report, through
// the roster's transitions as the browser's timeline calls them (a drop previewed, then Save shift), and is refused a shift on the
// Wednesday he has approved leave (asked by him and approved by her first); she publishes, and Tomas finds his shifts on his
// SelfService (under Commons, as a self-service employee opens it) and on the team calendar, and is told once; then the HR officer
// changes his Friday from the terminal (ShiftRosterTui: Shift, the preview box, Save shift) and Tomas is told of the change. The
// rules themselves are Mantle's ShiftRoster and mr-boss's PeopleRoster.
// Run: ./moq accept mr-boss --spec PeopleRosterUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const L = "mantle.humanres.LeaveServices."
const webroot = "component://webroot/screen/webroot.xml"
const rosterPath = "apps/People/Time/ShiftRoster/"
// a request under the web root as the user (a transition's post, a page), its JSON when it answers one
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, method || null)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        let json = null
        try {
            json = JSON.parse(String(result.output || ""))
        } catch (error) {
            json = null
        }
        return {status: result.status, output: String(result.output || ""), json, errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const addDay = (day, count) => new Date(Date.parse(day + "T12:00:00Z") + count * 86400000).toISOString().substring(0, 10)
// the shift notices of the walk's week: the publication names its first day, a changed shift its own day
const notices = () =>
    system(() =>
        Array.from(
            ec.entity
                .find("moqui.security.user.NotificationMessage")
                .condition("topic", "PeopleShiftChange")
                .orderBy("-sentDate")
                .list()
        ).filter(row => state.days.some(day => String(row.messageJson || "").includes(day)))
    )
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // next week, Monday to Friday, in the demo users' zone
        const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd", null, "America/Chicago")
        const weekday = new Date(today + "T12:00:00Z").getUTCDay() || 7
        state.monday = addDay(today, 8 - weekday)
        state.days = [0, 1, 2, 3, 4].map(i => addDay(state.monday, i))
        state.wednesday = state.days[2]
        // Tomas under an annual leave policy of Retail on his Wednesday with two more days (HR's, through the services the screens
        // call): the policy he follows then (Retail's annual leave from another spec, or in a whole run the one
        // PeopleLeavePoliciesUsable put him under), else Retail's annual leave from now; the days added as an adjustment, since
        // another spec may have granted him this year already; then his Wednesday asked and approved by Hannah
        state.setup = asUser(users.hr, () =>
            system(() => {
                let policyId = lib.annualPolicyOn(ids.employmentId, state.wednesday)
                if (!policyId) {
                    invoke(L + "assign#Policy", {
                        leavePolicyId: ids.leavePolicyId,
                        partyRelationshipIds: [ids.employmentId],
                        fromDate: today.substring(0, 4) + "-01-02",
                        reason: "Acceptance"
                    })
                    policyId = ids.leavePolicyId
                }
                return invoke(L + "allocate#Leave", {
                    leavePolicyId: policyId,
                    partyRelationshipIds: [ids.employmentId],
                    amount: "2",
                    adjustment: true,
                    reason: "Acceptance: two days for the walk",
                    periodFromDate: today.substring(0, 4) + "-01-01",
                    periodThruDate: state.wednesday.substring(0, 4) + "-12-31",
                    operationKey: "PPL_ACCEPT_ROSTER_LEAVE"
                }).allocatedCount
            })
        )
        const asked = read(users.employee, L + "submit#Request", {
            leaveTypeEnumId: "PltAnnual",
            fromDate: state.wednesday,
            reason: "Moving house",
            operationKey: "PPL_ACCEPT_ROSTER_ASK"
        })
        state.leaveRequestId = asked.leaveRequestId
        state.approved = read(users.manager, L + "decide#Request", {leaveRequestId: asked.leaveRequestId, decision: "approve"})
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("Hannah rosters Tomas's week in the timeline: each drop previewed and saved; his Wednesday on leave is refused", {
    when() {
        const out = {saved: [], previews: []}
        const shift = day => ({laneId: ids.employmentId, startText: day + " 09:00", endText: day + " 17:00", breakMinutes: "30"})
        for (const day of state.days.filter(day => day !== state.wednesday)) {
            const previewed = request(
                users.manager,
                rosterPath + "moveShift",
                Object.assign({moveAction: "preview"}, shift(day)),
                "post"
            )
            out.previews.push(previewed.json?.preview?.canApply)
            const saved = request(
                users.manager,
                rosterPath + "moveShift",
                Object.assign({moveAction: "apply", operationKey: "PPL_ACCEPT_ROSTER_" + day}, shift(day)),
                "post"
            )
            out.saved.push(saved.json?.messageInfos?.[0]?.message)
        }
        out.leavePreview = request(
            users.manager,
            rosterPath + "moveShift",
            Object.assign({moveAction: "preview"}, shift(state.wednesday)),
            "post"
        ).json
        out.leaveApply = request(
            users.manager,
            rosterPath + "moveShift",
            Object.assign({moveAction: "apply", operationKey: "PPL_ACCEPT_ROSTER_WED"}, shift(state.wednesday)),
            "post"
        ).json
        out.roster = request(users.manager, rosterPath + "schedule", {fromDay: state.monday, days: "7"}).json
        return out
    },
    then({saved, previews, leavePreview, leaveApply, roster}) {
        state.setup >= 1 && state.leaveRequestId && !state.approved.error
        previews.every(Boolean) && previews.length == 4
        saved.every(message => message == "Shift saved")
        leavePreview.preview.canApply == false && leavePreview.preview.refusals.map(row => row.code).join() == "LEAVE_CONFLICT"
        leaveApply.failed == true && leaveApply.messageInfos[0].message.includes("approved leave")
        // his lane: the leave shaded (never its type or reason), four draft bars, Publish (4)
        const lane = roster.schedule.laneList.find(row => row.laneId == ids.employmentId)
        lane.shadeList.some(shade => shade.kind == "leave" && shade.fromText.startsWith(state.wednesday))
        !JSON.stringify(lane).includes("Moving house") && !JSON.stringify(lane).includes("PltAnnual")
        roster.schedule.barList.filter(bar => bar.laneId == ids.employmentId && bar.dashed).length == 4
        roster.resource.actionList[0].label == "Publish (4)"
    }
})

feature("Hannah publishes; Tomas finds his shifts on his SelfService and the team calendar, and is told once", {
    when() {
        const out = {}
        out.published = request(users.manager, rosterPath + "publishShifts", {fromDay: state.monday, days: "7"}, "post").json
        out.selfService = asUser(users.employee, () => page("People/SelfService", {}, "html", "Commons"))
        out.calendar = request(users.employee, "apps/People/Time/TeamCalendar/calendarEvents", {
            start: state.monday,
            end: addDay(state.monday, 6)
        }).json
        out.notices = notices()
        return out
    },
    then({published, selfService, calendar, notices}) {
        published.messageInfos[0].message == "4 shifts published"
        selfService.status == 200 && selfService.errors.length == 0
        selfService.output.includes("My shifts") && selfService.output.includes(state.monday + " 09:00")
        calendar.eventList.filter(event => event.kind == "workHours" && event.title.startsWith("Tomas Lindqvist · Shift"))
            .length == 4
        calendar.eventList.some(event => event.leaveRequestId == state.leaveRequestId)
        notices.length == 1 && String(notices[0].titleText).includes("4 shifts published")
    }
})

feature("the HR officer changes Tomas's Friday from the terminal: Shift, its preview, Save shift; Tomas is told", {
    when() {
        const out = {}
        const tui = "apps/People/Time/ShiftRosterTui"
        const friday = state.days[4]
        const rosterOf = () =>
            read(users.hr, "mantle.humanres.ScheduleServices.get#Roster", {fromDay: state.monday, days: 7}).roster
        const shiftId = rosterOf().shifts.find(
            row => row.shiftDate == friday && row.partyRelationshipId == ids.employmentId
        ).shiftAssignmentId
        const values = {
            fromDay: state.monday,
            days: "7",
            shiftAssignmentId: shiftId,
            shiftStart: friday + " 10:00",
            shiftEnd: friday + " 18:00"
        }
        out.previewed = request(users.hr, tui, Object.assign({renderMode: "tui"}, values))
        const revision = rosterOf().shifts.find(row => row.shiftAssignmentId == shiftId).revision
        out.saved = request(
            users.hr,
            tui + "/saveShift",
            Object.assign({}, values, {shiftBreak: "30", expectedRevision: revision, operationKey: "PPL_ACCEPT_ROSTER_TUI"}),
            "post"
        )
        out.after = rosterOf().shifts.find(row => row.shiftAssignmentId == shiftId)
        out.notices = notices()
        return out
    },
    then({previewed, saved, after, notices}) {
        previewed.status == 200 && previewed.output.includes("Shift preview") && previewed.output.includes("Save shift")
        saved.errors == ""
        after.startText.endsWith("10:00") && after.endText.endsWith("18:00") && after.statusEnumId == "ShsPublished"
        notices.length == 2 && notices.some(row => String(row.titleText).includes("a shift changed"))
    }
})
