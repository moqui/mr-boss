// People's shift roster screens (impl-people P14; design-people §6 ShiftRoster, crosscut M11): ShiftRoster's qvue template is the
// shared timeline (Projects' Timeline.qvue in its resource mode), so its own content is its transitions' answer: as the manager, the
// schedule transition answers the timeline's resource contract (her reports as lanes she rosters, the wording, the dialog's fields,
// Publish), a shift dropped on Tomas is previewed and saved through moveShift (the dialog's commit) and shown as a draft bar, and
// Publish publishes it, which Tomas then reads as his own; the terminal twin's one tui render (ShiftRosterTui, its own template) as
// HR shows the person and day table with the shift and the commands. The rules are Mantle's ShiftRoster; access is PeopleAccessLater's.
// A week a year ahead, so no other spec's days are touched.
// Run: ./moq test mr-boss --spec PeopleRoster
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rosterPath = "apps/People/Time/ShiftRoster/"
const state = {}

// a screen transition as the client calls it (its JSON answer), as the user with artifact authorization on
function call(user, path, parameters, method = "post") {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, method === "post" ? "post" : null)
        let json = null
        try {
            json = JSON.parse(String(result.output || ""))
        } catch (error) {
            json = null
        }
        return {status: result.status, json, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the Monday a year ahead, in the demo users' zone
        const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd", null, "America/Chicago")
        const iso = new Date(today + "T12:00:00Z").getUTCDay() || 7
        state.monday = new Date(Date.parse(today + "T12:00:00Z") + (365 + 8 - iso) * 86400000).toISOString().slice(0, 10)
        state.key = "people-roster-spec-" + Date.now()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "the roster as the manager answers the shared timeline's contract; a shift dropped on Tomas is previewed, saved and published",
    {
        when() {
            const out = {}
            const week = {fromDay: state.monday, days: "7"}
            out.before = call(users.manager, rosterPath + "schedule", week, "get").json
            const shift = {
                laneId: ids.employmentId,
                startText: state.monday + " 09:00",
                endText: state.monday + " 17:00",
                breakMinutes: "30"
            }
            out.preview = call(users.manager, rosterPath + "moveShift", Object.assign({moveAction: "preview"}, shift)).json
            out.saved = call(
                users.manager,
                rosterPath + "moveShift",
                Object.assign({moveAction: "apply", operationKey: state.key}, shift)
            ).json
            out.after = call(users.manager, rosterPath + "schedule", week, "get").json
            out.published = call(users.manager, rosterPath + "publishShifts", week).json
            out.mine = asUser(users.employee, () =>
                invoke("mantle.humanres.ScheduleServices.get#MyShifts", {fromDay: state.monday, days: 7})
            )
            return out
        },
        then({before, preview, saved, after, published, mine}) {
            // the contract: the wording, the transitions, the dialog's fields, the lanes (her reports, each rostered by her)
            before.resource.title == "Shift roster" && before.resource.moveTransition == "moveShift" && before.resource.keepLength
            before.resource.fieldList.map(field => field.name).join() == "breakMinutes,facilityId"
            before.resource.legendList.map(item => item.kind).join() == "planned,holiday,leave,draft,conflict"
            const tomas = before.schedule.laneList.find(lane => lane.laneId == ids.employmentId)
            tomas.laneName == "Tomas Lindqvist" && tomas.selectable
            before.schedule.laneList.every(lane => lane.selectable && lane.laneId && lane.laneName)
            before.schedule.canSchedule && before.schedule.fromText.startsWith(state.monday)
            // the dialog's preview, then its commit
            preview.preview.canApply && preview.preview.laneName == "Tomas Lindqvist" && preview.preview.refusals.length == 0
            preview.preview.detailText.startsWith("7.5 h")
            saved.messageInfos[0].message == "Shift saved"
            const bar = after.schedule.barList.find(row => row.laneId == ids.employmentId)
            bar.label == "09:00–17:00 · Draft" && bar.dashed && bar.canMove && bar.moveParameters.shiftAssignmentId
            bar.fieldValues.breakMinutes == "30"
            after.resource.actionList[0].name == "publishShifts" && after.resource.actionList[0].label == "Publish (1)"
            after.resource.actionList[0].primary
            published.messageInfos[0].message == "1 shift published"
            mine.shifts.length == 1 && mine.shifts[0].hours == 7.5
        }
    }
)

feature("the terminal twin as HR: the person and day table with the published shift, and the roster's commands", {
    when() {
        return {rendered: asUser(users.hr, () => page("Time/ShiftRosterTui", {fromDay: state.monday, days: "7"}, "tui"))}
    },
    then({rendered}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Week of " + state.monday)
        rendered.output.includes("Tomas Lindqvist") && rendered.output.includes("09:00–17:00")
        !rendered.output.includes("09:00–17:00 (draft)")
        rendered.output.includes("Add or change a shift") && rendered.output.includes("Remove a shift")
        rendered.output.includes("Shifts of these days") && rendered.output.includes("Published")
    }
})
