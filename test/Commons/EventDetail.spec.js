// Commons Calendar/EventDetail (screen/Commons/Calendar/EventDetail.xml, service/ironstone/commons/EventServices.xml; impl-drawers-commons.md
// M7, design-drawers-commons.md §7 EventDetail): one event as john.doe sees and changes it, on the calendar demo
// (data/BossCalendarDemoData.xml, loaded again here). The screen renders the weekly sync's instance with its header, repeat and
// tabs, and Joe Developer's planning with john.doe's RSVP; When and Overview save by scope, a changed instance shows itself; the
// repeat editor writes the RRULE; attendees are invited (a user by notification, an outside address as a new personal contact by
// email), made optional and removed (the removed outside address told by email); the user's reminders; meeting rooms and
// equipment booked at once or requested by the policy, a booking cancelled; a new time that clashes with a
// booking of its room refused, then kept anyway; Duplicate and Export .ics; Cancel event telling the attendees; an answer with
// a note; a link to a changed instance by its series and start opens the instance; the linked records as record cards, linked by
// an id (lookup#ById) and taken off, a record the user may not see left out, and Joe Developer may not change them.
// Joe Developer gets "not available" for john.doe's family birthday and may not change john.doe's events (IronStone R5, R28).
// Run: ./moq test mr-boss --spec EventDetail
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
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    const output = String(str.output || "")
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output, messages: (json && json.messageInfos ? json.messageInfos.map((info) => info.message || info).join(" | ") : "") }
}
const detailPost = (name, parameters) => post(`Calendar/EventDetail/${name}`, parameters)
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
const userText = (value) => ec.l10n.format(value, "yyyy-MM-dd HH:mm")
const notices = (userId, topic) => sys(() => Array.from(ec.entity.find("moqui.security.user.NotificationMessageUser").condition("userId", userId).list())
        .map((row) => ec.entity.find("moqui.security.user.NotificationMessage").condition("notificationMessageId", row.notificationMessageId).one())
        .filter((notice) => notice && notice.topic === topic))
const detail = (id, extra) => sys(() => call("ironstone.commons.EventServices.get#EventDetail", Object.assign({ workEffortId: id }, extra || {})))
function quickEvent(name, start, end, extra) {
    const answer = post("Calendar/createEvent", Object.assign({ workEffortName: name, start, end, calendarId: "BOSS_DEMO_CAL_JD" }, extra || {}))
    return answer.json.workEffortId
}

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.CalendarDemoServices.load#CalendarDemo", {}))
        login("john.doe")
        D = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    },
    cleanup() { login("john.doe") },
})

feature("EventDetail shows the sync's instance with its calendar, repeat, room and tabs, and the planning with john.doe's RSVP", {
    when() {
        return { sync: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC", instanceStart: day(7) + " 10:00" }),
            attendees: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC", tab: "attendees" }),
            planning: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_PLANNING" }),
            facts: detail("BOSS_DEMO_EV_SYNC", { instanceStart: D + " 10:00" }) }
    },
    then({ sync, attendees, planning, facts }) {
        sync.status == 200
        !sync.broken
        sync.output.includes("Team sync")
        sync.output.includes("Weekly on")
        sync.output.includes("Maple meeting room")
        sync.output.includes("Send again")
        sync.output.includes("Cancel event")
        sync.output.includes("data-tab=\"attendees\"")
        attendees.output.includes("Bob Developer")
        attendees.output.includes("Optional")
        planning.output.includes("Going?")
        planning.output.includes("Not answered yet")
        !planning.output.includes("Save repeat")
        facts.visible
        facts.canEdit
        facts.pendingInvites == 0
        facts.edit.startDate == D
        facts.edit.startTime == "10:00"
        facts.edit.endTime == "10:30"
        facts.recurrence.freq == "WEEKLY"
        facts.event.attendees.find((party) => party.partyId === "ORG_ZIZI_JD").freeBusyText != null
        // a user among the attendees carries the user id, so the avatar shows the user's photo
        facts.event.attendees.find((party) => party.partyId === "EX_JOHN_DOE").userId == "EX_JOHN_DOE"
        facts.roomOptions.some((room) => room.value === "BOSS_DEMO_ROOM_BOARD")
    },
})

feature("When and Overview save: the series renamed for all, one instance moved for itself, a new place and link", {
    when() {
        made.series = quickEvent("BOSS_TEST detail series", day(2) + " 08:00", day(2) + " 08:30", { repeat: "daily", attendeePartyIds: "ORG_ZIZI_JD" })
        const renamed = detailPost("saveOverview", { workEffortId: made.series, scope: "all", workEffortName: "BOSS_TEST detail standup" })
        const before = notices("ORG_ZIZI_JD", "EventInvitation").length
        const moved = detailPost("saveOverview", { workEffortId: made.series, instanceStart: day(3) + " 08:00", scope: "this", workEffortName: "BOSS_TEST detail standup",
            allDay: "N", startDate: day(3), startTime: "09:15", endDate: day(3), endTime: "09:45", notify: "Y" })
        const override = all("mantle.work.effort.WorkEffortAssoc", { workEffortId: made.series, workEffortAssocTypeEnumId: "WeatRecurrenceInstance" })[0] || {}
        const place = detailPost("saveOverview", { workEffortId: made.series, scope: "all", location: "Room 2", infoUrl: "https://meet.example.com/standup",
            description: "Fifteen minutes", visibilityEnumId: "WevAllUsers", calendarId: "BOSS_DEMO_CAL_FAMILY" })
        const badLink = detailPost("saveOverview", { workEffortId: made.series, scope: "all", infoUrl: "meet.example.com" })
        return { renamed, moved, override, place, badLink, series: one("mantle.work.effort.WorkEffort", { workEffortId: made.series }),
            overrideRow: one("mantle.work.effort.WorkEffort", { workEffortId: override.toWorkEffortId }) || {}, told: notices("ORG_ZIZI_JD", "EventInvitation").length - before,
            calendars: all("mantle.work.calendar.CalendarWorkEffort", { workEffortId: made.series }).map((row) => row.calendarId) }
    },
    then({ renamed, moved, override, place, badLink, series, overrideRow, told, calendars }) {
        renamed.errors == ""
        moved.errors == ""
        userText(override.fromDate) == day(3) + " 08:00"
        overrideRow.workEffortName == "BOSS_TEST detail standup"
        userText(overrideRow.estimatedStartDate) == day(3) + " 09:15"
        told == 1
        place.errors == ""
        series.workEffortName == "BOSS_TEST detail standup"
        series.location == "Room 2"
        series.infoUrl == "https://meet.example.com/standup"
        series.visibilityEnumId == "WevAllUsers"
        calendars == ["BOSS_DEMO_CAL_FAMILY"]
        userText(series.estimatedStartDate) == day(2) + " 08:00"
        badLink.errors.includes("web address")
    },
})

feature("the repeat editor: weekly on Monday and Wednesday until a day, then five times monthly on the same weekday, then none", {
    when() {
        const id = quickEvent("BOSS_TEST repeat", day(1) + " 07:00", day(1) + " 07:30")
        const weekly = detailPost("saveRecurrence", { workEffortId: id, freq: "WEEKLY", interval: "2", byDay: ["MO", "WE"], ends: "until", untilDate: day(60) })
        const weeklyRule = (one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: id }) || {}).rrule
        const parsed = sys(() => call("ironstone.commons.CalendarServices.parse#RRule", { rrule: weeklyRule })).fields
        const weeklyText = sys(() => call("ironstone.commons.CalendarServices.describe#RRule", { rrule: weeklyRule, startText: day(1) })).text
        const monthly = detailPost("saveRecurrence", { workEffortId: id, freq: "MONTHLY", monthlyBy: "weekday", ends: "count", count: "5" })
        const monthlyRule = (one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: id }) || {}).rrule
        const none = detailPost("saveRecurrence", { workEffortId: id, freq: "NONE" })
        const bad = detailPost("saveRecurrence", { workEffortId: id, freq: "WEEKLY", ends: "count", count: "0" })
        return { weekly, weeklyRule, weeklyText, parsed, monthly, monthlyRule, none, bad, after: one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: id }),
            nth: Math.ceil(Number(day(1).substring(8, 10)) / 7) }
    },
    then({ weekly, weeklyRule, weeklyText, parsed, monthly, monthlyRule, none, bad, after, nth }) {
        weekly.errors == ""
        weeklyText.startsWith("Every 2 weeks on Monday and Wednesday until")
        weeklyRule.startsWith("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=")
        parsed.freq == "WEEKLY"
        parsed.byDay == ["MO", "WE"]
        parsed.ends == "until"
        parsed.untilDate == day(60)
        monthly.errors == ""
        monthlyRule.startsWith("FREQ=MONTHLY;BYDAY=" + nth)
        monthlyRule.endsWith(";COUNT=5")
        none.errors == ""
        after == null
        bad.errors.includes("1 to 999")
    },
})

feature("attendees: Joe invited at once by notification, an outside address made a personal contact and emailed, optional, removed", {
    when() {
        made.meeting = quickEvent("BOSS_TEST detail meeting", day(3) + " 15:00", day(3) + " 16:00")
        const before = notices("ORG_ZIZI_JD", "EventInvitation").length
        const added = detailPost("addAttendees", { workEffortId: made.meeting, partyIds: "ORG_ZIZI_JD", emails: "pat.outside@example.org", optional: "N", sendNow: "Y" })
        const outside = sys(() => {
            const mech = ec.entity.find("mantle.party.contact.ContactMech").condition("infoString", "pat.outside@example.org").one()
            const pcm = mech ? ec.entity.find("mantle.party.contact.PartyContactMech").condition("contactMechId", mech.contactMechId).one() : null
            return pcm ? ec.entity.find("mantle.party.Party").condition("partyId", pcm.partyId).one() : null
        })
        // the address alone, or with the contact's name ("pat.outside" <pat.outside@example.org>)
        const email = sys(() => Array.from(ec.entity.find("moqui.basic.email.EmailMessage").condition("toAddresses", "like", "%pat.outside@example.org%").list())[0] || null)
        const optional = detailPost("setOptional", { workEffortId: made.meeting, partyId: outside.partyId, optional: "Y" })
        const optionalRow = current("mantle.work.effort.WorkEffortParty", { workEffortId: made.meeting, partyId: outside.partyId })[0] || {}
        const again = detailPost("sendInvitations", { workEffortId: made.meeting })
        const emailsBefore = sys(() => ec.entity.find("moqui.basic.email.EmailMessage").condition("toAddresses", "like", "%pat.outside@example.org%").count())
        const removed = detailPost("removeAttendee", { workEffortId: made.meeting, partyId: outside.partyId })
        const cancelEmails = sys(() => ec.entity.find("moqui.basic.email.EmailMessage").condition("toAddresses", "like", "%pat.outside@example.org%").count()) - emailsBefore
        const bad = detailPost("addAttendees", { workEffortId: made.meeting, emails: "not-an-address" })
        return { added, outside, email, optional, optionalRow, again, removed, cancelEmails, bad, told: notices("ORG_ZIZI_JD", "EventInvitation").length - before,
            joe: current("mantle.work.effort.WorkEffortParty", { workEffortId: made.meeting, partyId: "ORG_ZIZI_JD" })[0] || {},
            outsideRows: current("mantle.work.effort.WorkEffortParty", { workEffortId: made.meeting, partyId: outside.partyId }).length }
    },
    then({ added, outside, email, optional, optionalRow, again, removed, cancelEmails, bad, told, joe, outsideRows }) {
        added.errors == ""
        told == 1
        joe.statusId == "WeptOffered"
        joe.expectationEnumId == "WepeInvRequired"
        joe.invitationSentDate != null
        outside.privateOwnerUserId == "EX_JOHN_DOE"
        email != null
        email.subject.startsWith("Invitation: BOSS_TEST detail meeting")
        optional.errors == ""
        optionalRow.expectationEnumId == "WepeInvRequested"
        again.errors == ""
        removed.errors == ""
        cancelEmails == 1
        outsideRows == 0
        bad.errors.includes("not an email address")
    },
})

feature("reminders: john.doe's own, added by email and by notification and removed", {
    when() {
        const id = made.meeting
        detailPost("addReminder", { workEffortId: id, offsetMinutes: "30", methodEnumId: "WermEmail" })
        detailPost("addReminder", { workEffortId: id, offsetMinutes: "1440", methodEnumId: "WermNotification" })
        const two = all("mantle.work.effort.WorkEffortReminder", { workEffortId: id, partyId: "EX_JOHN_DOE" })
        const shown = detail(id).reminderList
        const removed = detailPost("removeReminder", { workEffortId: id, reminderSeqId: two.find((row) => Number(String(row.offsetMinutes)) === 30).reminderSeqId })
        const notOn = as("joe.developer", () => detailPost("addReminder", { workEffortId: "BOSS_DEMO_EV_WORKSHOP", offsetMinutes: "10" }))
        return { two, shown, removed, left: all("mantle.work.effort.WorkEffortReminder", { workEffortId: id, partyId: "EX_JOHN_DOE" }), notOn }
    },
    then({ two, shown, removed, left, notOn }) {
        two.length == 2
        shown.map((row) => row.offsetText) == ["30 minutes before", "1 day(s) before"]
        shown[0].methodText == "Email"
        removed.errors == ""
        left.length == 1
        left[0].offsetMinutes == 1440
        notOn.errors != ""
    },
})

feature("rooms and equipment: Maple booked at once, the Board room requested (Bob approves it), a booking cancelled", {
    when() {
        const id = made.meeting
        const maple = detailPost("bookResource", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" })
        const board = detailPost("bookResource", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_BOARD", comments: "For the client" })
        const projector = detailPost("bookResource", { workEffortId: id, assetId: "BOSS_DEMO_PROJECTOR" })
        // a booking that clashes is Mantle's rule (and a new time that clashes, the next feature)
        const cancel = detailPost("cancelBooking", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" })
        return { maple, board, projector, cancel, boardRow: one("mantle.work.effort.WorkEffortFacility", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_BOARD" }) || {},
            mapleRow: one("mantle.work.effort.WorkEffortFacility", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" }),
            projectorRow: current("mantle.work.effort.WorkEffortAssetAssign", { workEffortId: id, assetId: "BOSS_DEMO_PROJECTOR" })[0] || {},
            facts: detail(id).event }
    },
    then({ maple, board, projector, cancel, boardRow, mapleRow, projectorRow, facts }) {
        maple.errors == ""
        board.errors == ""
        boardRow.statusId == "WefRequested"
        boardRow.comments == "For the client"
        projector.errors == ""
        projectorRow.statusId == "WeaaAssigned"
        cancel.errors == ""
        mapleRow == null
        facts.rooms.find((room) => room.facilityId === "BOSS_DEMO_ROOM_BOARD").statusLabel == "Pending approval"
        facts.equipment[0].statusLabel == "Booked"
    },
})

feature("a new time that clashes with another booking of its room is refused; with allowConflicts it is kept and the booking stays", {
    when() {
        // the planning has the Maple room on D+2 from 13:00
        const id = quickEvent("BOSS_TEST detail room move", day(5) + " 10:00", day(5) + " 11:00")
        const booked = detailPost("bookResource", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" })
        const shown = render("apps/Commons/Calendar/EventDetail", { workEffortId: id })
        const move = { workEffortId: id, scope: "all", workEffortName: "BOSS_TEST detail room move", allDay: "N", startDate: day(2), startTime: "13:00",
            endDate: day(2), endTime: "14:00", moquiFormName: "EventWhen" }
        const refused = detailPost("saveOverview", move)
        const afterRefused = one("mantle.work.effort.WorkEffort", { workEffortId: id })
        const kept = detailPost("saveOverview", Object.assign({ allowConflicts: "Y" }, move))
        return { booked, shown, refused, afterRefused, kept, after: one("mantle.work.effort.WorkEffort", { workEffortId: id }),
            room: one("mantle.work.effort.WorkEffortFacility", { workEffortId: id, facilityId: "BOSS_DEMO_ROOM_MAPLE" }) || {} }
    },
    then({ booked, shown, refused, afterRefused, kept, after, room }) {
        booked.errors == ""
        shown.output.includes("Change it even when a room or equipment is booked then")
        refused.errors.includes("Maple meeting room is booked then")
        userText(afterRefused.estimatedStartDate) == day(5) + " 10:00"
        kept.errors == ""
        userText(after.estimatedStartDate) == day(2) + " 13:00"
        room.statusId == "WefAssigned"
    },
})

feature("a link to a changed instance, by its series and the instance's start, opens the instance", {
    when() {
        return { moved: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC", instanceStart: day(7) + " 10:00" }),
            generated: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC", instanceStart: day(21) + " 10:00" }) }
    },
    then({ moved, generated }) {
        moved.errors == ""
        moved.output.includes("Changed instance")
        moved.output.includes("Open the series")
        !generated.output.includes("Changed instance")
        generated.output.includes("Team sync")
    },
})

feature("Duplicate makes a planned copy with the attendees to invite again; Export .ics answers the file", {
    when() {
        const copy = detailPost("duplicateEvent", { workEffortId: made.meeting })
        const copies = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortName", "BOSS_TEST detail meeting")
                .condition("workEffortId", "not-equals", made.meeting).list()))
        const copyId = copies.length ? copies[0].workEffortId : null
        const str = ec.screen.makeTest().rootScreen(commons).render("Calendar/EventDetail/exportIcs", { workEffortId: "BOSS_DEMO_EV_SYNC" }, null)
        const ics = String(str.output || "")
        ec.message.clearErrors()
        return { copy, copyId, copyRow: copies[0] || {}, joe: current("mantle.work.effort.WorkEffortParty", { workEffortId: copyId, partyId: "ORG_ZIZI_JD" })[0] || {},
            inCalendar: one("mantle.work.calendar.CalendarWorkEffort", { calendarId: "BOSS_DEMO_CAL_JD", workEffortId: copyId }), ics }
    },
    then({ copy, copyId, copyRow, joe, inCalendar, ics }) {
        copy.errors == ""
        copyId != null
        copyRow.statusId == "WeInPlanning"
        copyRow.ownerPartyId == "EX_JOHN_DOE"
        joe.statusId == "WeptOffered"
        joe.invitationSentDate == null
        inCalendar != null
        ics.includes("BEGIN:VCALENDAR")
        ics.includes("SUMMARY:Team sync")
        ics.includes("RRULE:FREQ=WEEKLY")
    },
})

feature("Cancel event tells the attendees; an attendee answers with a note", {
    when() {
        const before = notices("ORG_ZIZI_JD", "EventInvitation").length
        const cancelled = detailPost("cancelEvent", { workEffortId: made.meeting, scope: "all", notify: "Y" })
        const answer = as("joe.developer", () => detailPost("respond", { workEffortId: "BOSS_DEMO_EV_SYNC", response: "tentative", message: "Late by ten minutes" }))
        return { cancelled, answer, row: one("mantle.work.effort.WorkEffort", { workEffortId: made.meeting }), told: notices("ORG_ZIZI_JD", "EventInvitation").length - before,
            joe: current("mantle.work.effort.WorkEffortParty", { workEffortId: "BOSS_DEMO_EV_SYNC", partyId: "ORG_ZIZI_JD" })[0] || {} }
    },
    then({ cancelled, answer, row, told, joe }) {
        cancelled.errors == ""
        row.statusId == "WeCancelled"
        told == 1
        answer.errors == ""
        joe.statusId == "WeptTentative"
        joe.comments == "Late by ten minutes"
    },
})

feature("linked records: the sync linked to a request found by its id and to Mary, shown as record cards with who linked them; Joe sees neither and changes nothing", {
    when() {
        sys(() => {
            if (!one("mantle.request.Request", { requestId: "BOSS_TEST_EVENT_LINK" })) call("create#mantle.request.Request", { requestId: "BOSS_TEST_EVENT_LINK",
                requestTypeEnumId: "RqtSupport", statusId: "ReqSubmitted", requestName: "Book the sync room", filedByPartyId: "EX_JOHN_DOE", requestDate: ec.user.nowTimestamp })
        })
        const str = ec.screen.makeTest().rootScreen(commons).render("Calendar/EventDetail/searchRecords", { workEffortId: "BOSS_DEMO_EV_SYNC", term: "BOSS_TEST_EVENT_LINK" }, null)
        let options = []
        try { options = JSON.parse(String(str.output || "[]")) } catch (err) { options = [] }
        ec.message.clearErrors()
        const linkRequest = detailPost("linkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", record: "mantle.request.Request|BOSS_TEST_EVENT_LINK" })
        const linkMary = detailPost("linkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.party.Party", recordId: "BOSS_DEMO_PC_MARY" })
        // Joe Developer's personal contact is not john.doe's to link
        const linkSam = detailPost("linkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.party.Party", recordId: "BOSS_DEMO_PC_SAM" })
        const self = detailPost("linkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.work.effort.WorkEffort", recordId: "BOSS_DEMO_EV_SYNC" })
        const list = detail("BOSS_DEMO_EV_SYNC").linkedRecordList
        const shown = render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC" })
        const joe = as("joe.developer", () => ({ shown: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC" }),
            unlink: detailPost("unlinkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.party.Party", recordId: "BOSS_DEMO_PC_MARY" }) }))
        const unlinkMary = detailPost("unlinkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.party.Party", recordId: "BOSS_DEMO_PC_MARY" })
        const unlinkRequest = detailPost("unlinkRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.request.Request", recordId: "BOSS_TEST_EVENT_LINK" })
        return { options, linkRequest, linkMary, linkSam, self, list, shown, joe, unlinkMary, unlinkRequest,
            requestJoin: one("mantle.request.RequestWorkEffort", { requestId: "BOSS_TEST_EVENT_LINK", workEffortId: "BOSS_DEMO_EV_SYNC" }),
            records: all("mantle.work.effort.WorkEffortRecord", { workEffortId: "BOSS_DEMO_EV_SYNC", recordEntityName: "mantle.party.Party" }) }
    },
    then({ options, linkRequest, linkMary, linkSam, self, list, shown, joe, unlinkMary, unlinkRequest, requestJoin, records }) {
        options.some((option) => option.value === "mantle.request.Request|BOSS_TEST_EVENT_LINK" && option.label.includes("Book the sync room"))
        linkRequest.errors == ""
        linkMary.errors == ""
        linkSam.errors != ""
        self.errors.includes("not linked to itself")
        list.some((item) => item.recordEntityName === "mantle.request.Request" && item.recordId === "BOSS_TEST_EVENT_LINK" && item.canRemove
            && item.linkEntityName === "mantle.request.RequestWorkEffort")
        list.find((item) => item.recordId === "BOSS_DEMO_PC_MARY").linkedText.endsWith("by John Doe")
        !list.some((item) => item.recordId === "BOSS_DEMO_PC_SAM")
        shown.errors == ""
        !shown.broken
        shown.output.includes('<m-record-card record-entity="mantle.request.Request" record-id="BOSS_TEST_EVENT_LINK" card-url="/apps/Commons/Chatter/recordCard"')
        shown.output.includes('record-id="BOSS_DEMO_PC_MARY"')
        shown.output.includes("Linked records")
        shown.output.includes("Link to a record")
        !joe.shown.output.includes("BOSS_DEMO_PC_MARY")
        !joe.shown.output.includes("BOSS_TEST_EVENT_LINK")
        !joe.shown.output.includes("Link to a record")
        joe.unlink.errors != ""
        unlinkMary.errors == ""
        unlinkRequest.errors == ""
        requestJoin == null
        records.length == 0
    },
})

feature("Joe Developer: john.doe's family birthday is not available, and john.doe's workshop is not his to change", {
    when() {
        return as("joe.developer", () => ({
            birthday: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_BIRTHDAY" }),
            workshop: render("apps/Commons/Calendar/EventDetail", { workEffortId: "BOSS_DEMO_EV_SYNC" }),
            // a change of the event (saveOverview) and of its repeat (saveRecurrence); attendees and bookings are Mantle's organizer rule
            save: detailPost("saveOverview", { workEffortId: "BOSS_DEMO_EV_WORKSHOP", scope: "all", workEffortName: "Taken over" }),
            repeat: detailPost("saveRecurrence", { workEffortId: "BOSS_DEMO_EV_SYNC", freq: "DAILY" }),
        }))
    },
    then({ birthday, workshop, save, repeat }) {
        birthday.output.includes("is not available")
        !birthday.output.includes("Mary's birthday")
        // on the sync Joe is an attendee: he sees it read-only, with his answer
        workshop.output.includes("Team sync")
        workshop.output.includes("Going?")
        !workshop.output.includes("Save repeat")
        save.errors != ""
        one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_EV_WORKSHOP" }).workEffortName == "Client workshop: Acme rollout"
        repeat.errors.includes("Only the organizer")
    },
})
