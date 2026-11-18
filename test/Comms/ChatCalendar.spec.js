// The chat-calendar hook (mr-moqui plans/Comms-Messaging.md §18.3 phase 19) through IronStone's provider: a chat event a
// member answers Going with Add to calendar is one Mantle event (WetEvent, its universalId the chat event's UID) with the
// member as an Assignee (WeptAssigned, WeptTentative for Maybe) on their default calendar; a change of the chat event changes
// it, a cancellation cancels it, and No takes it off the member's calendar. The provider reads the chat rows itself
// (ChatServices.sync#ChatCalendarEntry); the chat event's own rules are mr-moqui's ChatCal spec.
// Run: ./moq test mr-boss --spec ChatCalendar
const comms = "component://mr-boss/screen/Comms.xml"
const START = Date.now() + 3 * 86400000
const END = START + 7200000

function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return run()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// a Chat transition under the Comms root, as the browser posts it (authorization on)
function post(name, parameters) {
    const str = ec.screen.makeTest().rootScreen(comms).render(`Chat/${name}`, parameters || {}, "post")
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = [str.errorMessages.join(" | "), json && json.errors ? String(json.errors) : ""].filter((text) => text).join(" | ")
    ec.message.clearErrors()
    return Object.assign({errors}, json || {})
}
const shared = {}
const effortOf = (uid) => sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition("universalId", uid).list())[0] || null)
const party = () => sys(() => ec.entity.find("moqui.security.UserAccount").condition("userId", ec.user.userId).one().partyId)
// the member's part of the event: the current one, else the last that ended
const assignee = (workEffortId, partyId) => sys(() => {
    const rows = Array.from(ec.entity.find("mantle.work.effort.WorkEffortParty").condition({workEffortId, partyId, roleTypeId: "Assignee"}).orderBy("fromDate").list())
    return rows.find((row) => !row.thruDate) || rows[rows.length - 1] || null
})
const onCalendar = (workEffortId, partyId) => sys(() => {
    const mine = Array.from(ec.entity.find("mantle.work.calendar.Calendar").condition("ownerPartyId", partyId).list()).map((row) => row.calendarId)
    return mine.length ? ec.entity.find("mantle.work.calendar.CalendarWorkEffort").condition("workEffortId", workEffortId).condition("calendarId", "in", mine).count() : 0
})

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        shared.room = post("createRoom", {roomTypeEnumId: "private", roomName: "Chat calendar spec"}).chatRoomId
        const made = post("createCalEvent", {chatRoomId: shared.room, title: "Planning lunch", startDate: START, endDate: END,
            timeZone: "America/Denver", place: "Cafe"})
        shared.seq = made.eventSeq
        shared.uid = made.event && made.event.calEvent ? made.event.calEvent.uid : null
    },
    cleanupSpec() {
        sys(() => {
            const effort = shared.uid ? effortOf(shared.uid) : null
            if (effort) {
                ec.entity.find("mantle.work.calendar.CalendarWorkEffort").condition("workEffortId", effort.workEffortId).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffortParty").condition("workEffortId", effort.workEffortId).deleteAll()
                effort.delete()
            }
            ec.entity.find("moqui.chat.ChatCalAnswer").condition("chatRoomId", shared.room).deleteAll()
            ec.entity.find("moqui.chat.ChatCalEvent").condition("chatRoomId", shared.room).deleteAll()
        })
        login("john.doe")
    }
})

feature("Going with Add to calendar puts the event on the member's calendar; a change changes it; No takes it off", {
    when() {
        const going = post("answerCalEvent", {chatRoomId: shared.room, eventSeq: shared.seq, answer: "going", addToCalendar: "true"})
        const effort = effortOf(shared.uid)
        const partyId = party()
        const asGoing = assignee(effort.workEffortId, partyId)
        const listed = onCalendar(effort.workEffortId, partyId)
        post("updateCalEvent", {chatRoomId: shared.room, eventSeq: shared.seq, title: "Planning lunch, moved", startDate: START + 3600000, endDate: END + 3600000})
        const changed = effortOf(shared.uid)
        const no = post("answerCalEvent", {chatRoomId: shared.room, eventSeq: shared.seq, answer: "no"})
        const after = assignee(effort.workEffortId, partyId)
        return {going, effort, asGoing, listed, changed, no, after, offCalendar: onCalendar(effort.workEffortId, partyId)}
    },
    then({going, effort, asGoing, listed, changed, no, after, offCalendar}) {
        going.errors == ""
        going.calendarFailed == false
        going.eventUrl.includes("workEffortId=" + effort.workEffortId)
        effort.workEffortTypeEnumId == "WetEvent"
        effort.location == "Cafe"
        asGoing.statusId == "WeptAssigned"
        listed == 1
        changed.workEffortName == "Planning lunch, moved"
        Number(changed.estimatedStartDate) == START + 3600000
        no.errors == ""
        after.thruDate != null
        offCalendar == 0
    }
})

feature("one who cannot read the chat room changes nothing; a change reaches every event of the UID", {
    when() {
        const effort = effortOf(shared.uid)
        // a second event of the same UID (made by hand): a change brings both up to date
        const copyId = sys(() => {
            const copy = ec.entity.makeValue("mantle.work.effort.WorkEffort")
            copy.setSequencedIdPrimary()
            copy.setFields({workEffortTypeEnumId: "WetEvent", purposeEnumId: "WepMeeting", statusId: "WeInPlanning", universalId: shared.uid,
                workEffortName: "Copy"}, true, null, null)
            copy.create()
            return copy.workEffortId
        })
        // joe is in no such room: his call of the provider changes nothing
        login("joe.developer")
        ec.service.sync().name("ironstone.comms.ChatServices.sync#ChatCalendarEntry").parameters({chatRoomId: shared.room, eventSeq: shared.seq,
            action: "change"}).disableAuthz().call()
        ec.message.clearErrors()
        const untouched = sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", copyId).one()).workEffortName
        login("john.doe")
        post("updateCalEvent", {chatRoomId: shared.room, eventSeq: shared.seq, title: "Planning lunch, again"})
        const names = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition("universalId", shared.uid).list()).map((one) => one.workEffortName))
        sys(() => {
            ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", copyId).deleteAll()
        })
        return {untouched, names}
    },
    then({untouched, names}) {
        untouched == "Copy"
        names.length == 2
        names.every((name) => name == "Planning lunch, again")
    }
})

feature("a cancelled chat event cancels the calendar's", {
    when() {
        post("answerCalEvent", {chatRoomId: shared.room, eventSeq: shared.seq, answer: "maybe", addToCalendar: "true"})
        const tentative = assignee(effortOf(shared.uid).workEffortId, party())
        post("cancelCalEvent", {chatRoomId: shared.room, eventSeq: shared.seq})
        return {tentative, cancelled: effortOf(shared.uid)}
    },
    then({tentative, cancelled}) {
        tentative.statusId == "WeptTentative"
        cancelled.statusId == "WeCancelled"
    }
})
