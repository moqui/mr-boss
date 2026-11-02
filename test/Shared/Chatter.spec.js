// Chatter (screen/Shared/Chatter.xml and Chatter.qvue, service/ironstone/shared/ChatterServices.xml, impl-drawers-commons.md M3): the
// JSON transitions the panel calls under the Commons app root, as john.doe. The demo request's timeline (data/BossDemoData.xml,
// DemoServices.load#ChatterDemo) has its notes, the email with its quoted text, the message, the call done, the status change
// and the files; the panel data has its planned call, followers, files and parties. Log note with a mention notifies the user
// mentioned; Send message writes an internal message filed on the request; Reply answers a note; Schedule activity puts the
// activity in the planned list and in john.doe's Today; Mark done with feedback closes it with a Comment and schedules the
// next; Edit and Cancel; Follow and Unfollow and Add followers; the record card and the user search. A note's author edits
// it (marked edited, only the users newly mentioned notified) and deletes it; another user (joe.developer) may do neither, an
// admin deletes another's note, and a note with replies stays until they go. A record the user may
// not see (another user's personal contact) shows nothing and a write on it is refused (IronStone R5), and an activity
// that is not on the record cannot be changed. The record screens render with the chatter and record-files elements, and
// the shell data gives every BOSS app root its Chatter and RecordFiles panels.
// Run: ./moq test mr-boss --spec Chatter
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const request = { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" }
const requestUrl = "/qapps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST"
let scheduledId, nextId
const shared = { recordEntity: "mantle.request.Request", recordId: "BOSS_TEST_CHATTER_SHARED" }
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}

// a transition of the panel as the component calls it: the status, the errors and the JSON
function call_(name, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(`Chatter/${name}`, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, text: String(str.output || "").substring(0, 300) }
}
const get = (name, parameters) => call_(name, Object.assign({}, request, parameters || {}), null)
const post = (name, parameters, record) => call_(name, Object.assign({}, record || request, parameters || {}), "post")
function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const list = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const message = (answer) => ((answer.json.messageInfos || [])[0] || {}).message || ""
const entryOf = (entries, key) => entries.find((entry) => entry.key === key) || {}
const plannedOf = (data, id) => (data.json.plannedActivities || []).find((item) => item.workEffortId === id)

spec({
    setupSpec() {
        login("john.doe")
        // the demo again, so this spec sees its records as loaded whatever ran before
        sys(() => call("ironstone.commons.DemoServices.load#ChatterDemo", {}))
    },
})

feature("the demo request's timeline has its notes, the email with its quoted text, the message, the call done, the change and the files", {
    when() {
        const all = get("timeline")
        const notes = get("timeline", { kinds: "notes" })
        const files = get("timeline", { kinds: "files" })
        return { all, entries: all.json.entryList || [], notes: notes.json.entryList || [], files: files.json.entryList || [] }
    },
    then({ all, entries, notes, files }) {
        all.status == 200
        all.errors == ""
        all.json.failedSources.length == 0
        // newest first
        entries.length >= 8
        entries.every((entry, index) => index === 0 || (entries[index - 1].dateMillis || 0) >= (entry.dateMillis || 0))
        entryOf(entries, "ce-BOSS_DEMO_CE_NOTE1").authorName == "Joe Developer"
        entryOf(entries, "ce-BOSS_DEMO_CE_NOTE1").kindLabel == "Note"
        entryOf(entries, "ce-BOSS_DEMO_CE_NOTE1").bodyHtml.includes("<strong>view</strong>")
        entryOf(entries, "ce-BOSS_DEMO_CE_NOTE1").bodyHtml.includes('data-mention-id="EX_JOHN_DOE"')
        entryOf(entries, "ce-BOSS_DEMO_CE_NOTE1").canReply
        // the email: its delivery status, its body without the quoted reply chain, which is apart
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").kindLabel == "Email"
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").authorName == "Bob Acme"
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").status.label == "Received"
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").bodyHtml.includes("view access for the contractors is fine")
        !entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").bodyHtml.includes("should the contractors see")
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").quotedHtml.includes("&gt; Bob, should the contractors see the shared calendar?")
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").emailReply
        entryOf(entries, "ce-BOSS_DEMO_CE_EMAIL1").threadUrl == "/qapps/Comms/Inbox/MessageDetail?communicationEventId=BOSS_DEMO_CE_EMAIL1"
        entryOf(entries, "ce-BOSS_DEMO_MESSAGE").kindLabel == "Message"
        entryOf(entries, "we-BOSS_DEMO_DONE_CALL").kindLabel == "Call done"
        entryOf(entries, "we-BOSS_DEMO_DONE_CALL").title == "Call Bob Acme about the calendar options"
        entryOf(entries, "audit-BOSS_DEMO_AUDIT_REQ1").title == "Status"
        entryOf(entries, "audit-BOSS_DEMO_AUDIT_REQ1").bodyHtml.includes("→ Submitted")
        entries.some((entry) => entry.kind === "file" && entry.title === "calendar-options.txt")
        // a filter chip asks for one kind
        notes.length >= 2
        notes.every((entry) => entry.kind === "note")
        files.length == 2
        files.every((entry) => entry.kind === "file")
    },
})

feature("the timeline pages by its cursor (beforeDate and seenKeys): the next page has the older entries, none again and none left out", {
    when() {
        const first = get("timeline", { pageSize: 3 })
        const second = get("timeline", { pageSize: 3, beforeDate: first.json.nextBeforeDate, seenKeys: (first.json.nextSeenKeys || []).join(",") })
        // every page to the end, against the whole timeline in one page
        const paged = []
        let page = first
        for (let i = 0; i < 50 && page.status === 200; i++) {
            paged.push(...(page.json.entryList || []).map((entry) => entry.key))
            if (!page.json.hasMore || !page.json.nextBeforeDate) break
            page = get("timeline", { pageSize: 3, beforeDate: page.json.nextBeforeDate, seenKeys: (page.json.nextSeenKeys || []).join(",") })
        }
        const whole = (get("timeline", { pageSize: 200 }).json.entryList || []).map((entry) => entry.key)
        return { first, second, firstKeys: (first.json.entryList || []).map((entry) => entry.key), secondKeys: (second.json.entryList || []).map((entry) => entry.key),
            paged, whole }
    },
    then({ first, second, firstKeys, secondKeys, paged, whole }) {
        first.status == 200
        first.json.hasMore
        firstKeys.length == 3
        first.json.nextSeenKeys.length > 0
        secondKeys.length > 0
        secondKeys.every((key) => !firstKeys.includes(key))
        second.json.entryList.every((entry) => entry.dateMillis <= first.json.nextBeforeDate)
        new Set(paged).size == paged.length
        paged.slice().sort() == whole.slice().sort()
    },
})

feature("a wiki page's Chatter has the page's title, its first heading", {
    when() {
        const page = sys(() => ec.entity.find("moqui.resource.wiki.WikiPage").condition("wikiSpaceId", "BOSSKB").condition("pagePath", "Onboarding/First week").one())
        return { page, data: call_("chatterData", { recordEntity: "moqui.resource.wiki.WikiPage", recordId: page?.wikiPageId || "" }) }
    },
    then({ page, data }) {
        page != null
        data.json.visible
        data.json.record.title == "Your first week"
        data.json.record.typeLabel == "Page"
    },
})

feature("the panel data has the request, the planned call, the followers, the files and the parties with an email address", {
    when() { return get("chatterData") },
    then({ status, errors, json }) {
        status == 200
        errors == ""
        json.visible
        json.record.title == "Set up the shared team calendar"
        json.record.typeLabel == "Request"
        json.record.url == requestUrl
        json.record.subject == "Set up the shared team calendar (BOSS_DEMO_REQUEST)"
        json.record.hasContent
        json.canMessage
        json.canSchedule
        json.me.partyId == "EX_JOHN_DOE"
        json.isFollowing
        json.followerList.map((follower) => follower.userId).includes("ORG_ZIZI_JD")
        json.plannedActivities.some((item) => item.workEffortId === "BOSS_DEMO_TODAY_CALL" && item.activityType === "call" && item.canUpdate)
        !json.plannedActivities.some((item) => item.workEffortId === "BOSS_DEMO_DONE_CALL")
        json.fileCount == 2
        json.fileList.some((file) => file.fileName === "team-calendar.png" && file.isImage)
        json.partyList.some((party) => party.partyId === "ORG_ACME_BA" && party.name === "Bob Acme" && party.email)
        json.failedSources.length == 0
    },
})

feature("the user search answers users for the mentions and the drop-downs", {
    when() { return call_("searchUsers", { term: "joe" }) },
    then({ status, json }) {
        status == 200
        Array.isArray(json)
        json.some((user) => user.id === "ORG_ZIZI_JD" && user.value === "ORG_ZIZI_JD" && user.label === "Joe Developer" && user.partyId === "ORG_ZIZI_JD")
    },
})

feature("Log note with a mention: a Comment on the request, first in the timeline, and the user mentioned notified with the host page", {
    when() {
        const mentions = () => list("moqui.security.user.NotificationMessageByUser", { userId: "ORG_ZIZI_JD", topic: "ChatterMention" })
        const before = mentions().length
        const body = '<p>The rooms are booked, <span data-mention-id="ORG_ZIZI_JD">@Joe Developer</span>.</p><script>alert(1)</script>'
        const logged = post("logNote", { body, recordUrl: requestUrl })
        const id = logged.json.communicationEventId
        const after = mentions()
        const latest = after.map((row) => row.notificationMessageId).sort().pop()
        return { logged, before, after: after.length, comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }),
            link: one("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQUEST", communicationEventId: id }),
            notice: one("moqui.security.user.NotificationMessage", { notificationMessageId: latest }), first: (get("timeline").json.entryList || [])[0] || {} }
    },
    then({ logged, before, after, comm, link, notice, first }) {
        logged.status == 200
        logged.errors == ""
        message(logged) == "Note logged; 1 mentioned"
        comm.communicationEventTypeId == "Comment"
        comm.fromPartyId == "EX_JOHN_DOE"
        comm.contentType == "text/html"
        comm.body.includes('data-mention-id="ORG_ZIZI_JD"')
        !comm.body.includes("<script")
        link != null
        after == before + 1
        notice.linkText == requestUrl
        first.key == `ce-${comm.communicationEventId}`
    },
})

feature("an empty note is refused", {
    allowMessageErrors: true,
    expect() {
        const refused = post("logNote", { body: "<p></p>" })
        refused.status == 500
        refused.json.errors.includes("Write the note first")
    },
})

feature("Send message: an internal message to Joe Developer, filed on the request", {
    when() {
        const sent = post("sendMessage", { toUserIds: "ORG_ZIZI_JD", subject: "Calendar rollout", body: "<p>The calendar is ready to try.</p>", recordUrl: requestUrl })
        const id = sent.json.communicationEventId
        return { sent, comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }),
            recipient: one("mantle.party.communication.CommunicationEventParty", { communicationEventId: id, partyId: "ORG_ZIZI_JD" }),
            link: one("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQUEST", communicationEventId: id }) }
    },
    then({ sent, comm, recipient, link }) {
        sent.status == 200
        sent.errors == ""
        message(sent) == "Message sent to Joe Developer"
        comm.communicationEventTypeId == "Message"
        comm.subject == "Calendar rollout"
        comm.toPartyId == "ORG_ZIZI_JD"
        recipient.roleTypeId == "MessageTo"
        link != null
    },
})

feature("Reply to a note in the timeline: a Comment in its thread, filed on the request", {
    when() {
        const replied = post("reply", { parentCommEventId: "BOSS_DEMO_CE_NOTE1", body: "<p>Confirmed, view only.</p>" })
        const id = replied.json.communicationEventId
        return { replied, comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }) }
    },
    then({ replied, comm }) {
        replied.status == 200
        replied.errors == ""
        comm.communicationEventTypeId == "Comment"
        comm.parentCommEventId == "BOSS_DEMO_CE_NOTE1"
        comm.rootCommEventId == "BOSS_DEMO_CE_NOTE1"
    },
})

feature("Schedule activity: a call due now is planned on the request and in john.doe's Today", {
    when() {
        const due = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd HH:mm")
        const scheduled = post("scheduleActivity", { activityType: "call", workEffortName: "Call Bob Acme about the rooms", dueDate: due,
            description: "Ask which rooms the contractors may book.", recordUrl: requestUrl })
        scheduledId = scheduled.json.workEffortId
        const today = sys(() => call("mantle.work.WorkEffortServices.get#UserTodayItems", {}))
        const todayIds = [].concat(today.overdue || [], today.dueToday || [], today.laterToday || []).map((item) => item.workEffortId)
        return { scheduled, data: get("chatterData"), todayIds, task: one("mantle.work.effort.WorkEffort", { workEffortId: scheduledId }),
            link: one("mantle.request.RequestWorkEffort", { requestId: "BOSS_DEMO_REQUEST", workEffortId: scheduledId }) }
    },
    then({ scheduled, data, todayIds, task, link }) {
        scheduled.status == 200
        scheduled.errors == ""
        message(scheduled) == "Activity scheduled: Call Bob Acme about the rooms"
        task.purposeEnumId == "WepPhoneCall"
        task.description == "Ask which rooms the contractors may book."
        link != null
        plannedOf(data, scheduledId) != null
        plannedOf(data, scheduledId).canUpdate
        plannedOf(data, scheduledId).assigneeName == "John Doe"
        todayIds.includes(scheduledId)
    },
})

feature("Mark done with feedback: the activity is done, the feedback a Comment on the request, and the next activity scheduled", {
    when() {
        const done = post("markDone", { workEffortId: scheduledId, feedback: "<p>Bob wants room B for the contractors.</p>", scheduleNext: "Y",
            nextActivityType: "email", nextName: "Email Bob the room booking link", nextDueDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd HH:mm"),
            recordUrl: requestUrl })
        nextId = done.json.nextWorkEffortId
        return { done, task: one("mantle.work.effort.WorkEffort", { workEffortId: scheduledId }),
            comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: done.json.communicationEventId }),
            link: one("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQUEST", communicationEventId: done.json.communicationEventId }),
            next: one("mantle.work.effort.WorkEffort", { workEffortId: nextId }), data: get("chatterData"),
            entries: get("timeline", { kinds: "activities" }).json.entryList || [] }
    },
    then({ done, task, comm, link, next, data, entries }) {
        done.status == 200
        done.errors == ""
        message(done) == "Done: Call Bob Acme about the rooms; the next activity is scheduled"
        task.statusId == "WeComplete"
        comm.communicationEventTypeId == "Comment"
        comm.subject == "Call done: Call Bob Acme about the rooms"
        comm.body.includes("room B")
        link != null
        next.purposeEnumId == "WepEmail"
        plannedOf(data, scheduledId) == null
        plannedOf(data, nextId) != null
        entries.some((entry) => entry.key === `we-${scheduledId}`)
    },
})

feature("Edit and Cancel a planned activity", {
    when() {
        const edited = post("updateActivity", { workEffortId: nextId, workEffortName: "Email Bob the booking link and the rules",
            dueDate: "2026-12-01 10:30", description: "With the house rules." })
        const afterEdit = one("mantle.work.effort.WorkEffort", { workEffortId: nextId })
        const cancelled = post("cancelActivity", { workEffortId: nextId })
        return { edited, afterEdit, cancelled, task: one("mantle.work.effort.WorkEffort", { workEffortId: nextId }), data: get("chatterData") }
    },
    then({ edited, afterEdit, cancelled, task, data }) {
        edited.status == 200
        edited.errors == ""
        afterEdit.workEffortName == "Email Bob the booking link and the rules"
        ec.l10n.format(afterEdit.estimatedCompletionDate, "yyyy-MM-dd HH:mm") == "2026-12-01 10:30"
        cancelled.status == 200
        task.statusId == "WeCancelled"
        plannedOf(data, nextId) == null
    },
})

feature("an activity that is not on the record cannot be changed from its Chatter", {
    allowMessageErrors: true,
    when() {
        const refused = post("markDone", { workEffortId: "BOSS_DEMO_TASK_EMAIL" })
        return { refused, task: one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_TASK_EMAIL" }) }
    },
    then({ refused, task }) {
        refused.status == 500
        refused.json.errors.includes("is not on this record")
        task.statusId == "WeInPlanning"
    },
})

feature("Unfollow, Follow and Add followers", {
    when() {
        const unfollowed = post("unfollow")
        const afterUnfollow = get("chatterData").json
        const followed = post("follow")
        const kinds = post("follow", { kinds: "notes,changes" })
        const mine = one("mantle.party.communication.RecordFollower", { recordEntityName: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST", userId: "EX_JOHN_DOE" })
        const added = post("addFollowers", { userIds: "ORG_ZIZI_BD" })
        const withBob = get("chatterData").json
        const removed = post("unfollow", { userId: "ORG_ZIZI_BD" })
        const afterRemove = get("chatterData").json
        // the demo's kinds again
        post("follow", { kinds: "messages,notes,activities" })
        return { unfollowed, afterUnfollow, followed, kinds, mine, added, withBob, removed, afterRemove }
    },
    then({ unfollowed, afterUnfollow, followed, kinds, mine, added, withBob, removed, afterRemove }) {
        unfollowed.status == 200
        !afterUnfollow.isFollowing
        !afterUnfollow.followerList.some((follower) => follower.userId === "EX_JOHN_DOE")
        followed.status == 200
        message(followed) == "You follow Set up the shared team calendar"
        kinds.status == 200
        mine.notifyNotes == "Y"
        mine.notifyChanges == "Y"
        mine.notifyMessages == "N"
        added.status == 200
        added.json.addedUserIds.includes("ORG_ZIZI_BD")
        withBob.followerList.some((follower) => follower.userId === "ORG_ZIZI_BD")
        removed.status == 200
        !afterRemove.followerList.some((follower) => follower.userId === "ORG_ZIZI_BD")
    },
})

feature("the record card of the demo request, from lookup#ById and its Commons screen", {
    when() { return get("recordCard") },
    then({ status, json }) {
        status == 200
        json.title == "Set up the shared team calendar"
        json.typeLabel == "Request"
        json.id == "BOSS_DEMO_REQUEST"
        json.url == requestUrl
        json.status.label == "Submitted"
        json.fields.some((field) => field.label === "Type")
    },
})

feature("Unlink takes a message off the request; the message stays", {
    when() {
        const logged = post("logNote", { body: "<p>A note to take off again.</p>" })
        const id = logged.json.communicationEventId
        const unlinked = post("unlink", { communicationEventId: id })
        return { unlinked, comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }),
            link: one("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQUEST", communicationEventId: id }) }
    },
    then({ unlinked, comm, link }) {
        unlinked.status == 200
        unlinked.json.unlinked
        comm != null
        link == null
    },
})

feature("the author edits a note: the new text, the timeline marks it edited, and only the user newly mentioned is notified", {
    when() {
        const mentions = (userId) => list("moqui.security.user.NotificationMessageByUser", { userId, topic: "ChatterMention" }).length
        const logged = post("logNote", { body: '<p>The rooms, <span data-mention-id="ORG_ZIZI_JD">@Joe Developer</span>.</p>', recordUrl: requestUrl })
        const id = logged.json.communicationEventId
        const before = { joe: mentions("ORG_ZIZI_JD"), bob: mentions("ORG_ZIZI_BD") }
        const before0 = entryOf(get("timeline").json.entryList || [], `ce-${id}`)
        const edited = post("editEntry", { communicationEventId: id, recordUrl: requestUrl,
            body: '<p>The rooms B and C, <span data-mention-id="ORG_ZIZI_JD">@Joe Developer</span> and <span data-mention-id="ORG_ZIZI_BD">@Bob</span>.</p>' })
        return { id, before0, edited, before, after: { joe: mentions("ORG_ZIZI_JD"), bob: mentions("ORG_ZIZI_BD") },
            comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }), entry: entryOf(get("timeline").json.entryList || [], `ce-${id}`) }
    },
    then({ before0, edited, before, after, comm, entry }) {
        before0.canEdit
        before0.canDelete
        !before0.edited
        before0.editBody.includes("The rooms")
        edited.status == 200
        edited.errors == ""
        message(edited) == "Note changed; 1 newly mentioned"
        comm.body.includes("The rooms B and C")
        comm.editedDate != null
        comm.fromPartyId == "EX_JOHN_DOE"
        after.joe == before.joe
        after.bob == before.bob + 1
        entry.edited
        entry.editedText.startsWith("Edited ")
        entry.bodyHtml.includes("The rooms B and C")
    },
})

feature("the author deletes a note: it leaves the timeline and the request", {
    when() {
        const id = post("logNote", { body: "<p>A note to delete.</p>" }).json.communicationEventId
        const deleted = post("deleteEntry", { communicationEventId: id })
        return { deleted, comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }),
            link: one("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQUEST", communicationEventId: id }),
            shown: (get("timeline").json.entryList || []).some((entry) => entry.key === `ce-${id}`) }
    },
    then({ deleted, comm, link, shown }) {
        deleted.status == 200
        deleted.json.deleted
        message(deleted) == "Note deleted"
        comm == null
        link == null
        !shown
    },
})

feature("joe.developer, who sees the request, may neither edit nor delete john.doe's note; john.doe, an admin, deletes joe's note but may not edit it", {
    allowMessageErrors: true,
    when() {
        sys(() => {
            if (!one("mantle.request.Request", { requestId: "BOSS_TEST_CHATTER_SHARED" })) {
                call("create#mantle.request.Request", { requestId: "BOSS_TEST_CHATTER_SHARED", requestTypeEnumId: "RqtSupport", statusId: "ReqSubmitted",
                    requestName: "Chatter edit test", filedByPartyId: "EX_JOHN_DOE", requestDate: ec.user.nowTimestamp })
                for (const partyId of ["EX_JOHN_DOE", "ORG_ZIZI_JD"]) call("create#mantle.request.RequestParty", { requestId: "BOSS_TEST_CHATTER_SHARED",
                    partyId, roleTypeId: "Reporter", fromDate: ec.user.nowTimestamp })
            }
        })
        const johnNote = post("logNote", { body: "<p>John's note.</p>" }, shared).json.communicationEventId
        const joe = as("joe.developer", () => {
            const entries = call_("timeline", shared).json.entryList || []
            const own = post("logNote", { body: "<p>Joe's note.</p>" }, shared).json.communicationEventId
            return { entry: entryOf(entries, `ce-${johnNote}`), own,
                remove: post("deleteEntry", { communicationEventId: johnNote }, shared) }
        })
        const joeEntry = entryOf(call_("timeline", shared).json.entryList || [], `ce-${joe.own}`)
        const johnEdit = post("editEntry", { communicationEventId: joe.own, body: "<p>John was here.</p>" }, shared)
        const johnDelete = post("deleteEntry", { communicationEventId: joe.own }, shared)
        return { joe, joeEntry, johnEdit, johnDelete, johnNoteRow: one("mantle.party.communication.CommunicationEvent", { communicationEventId: johnNote }),
            joeNoteRow: one("mantle.party.communication.CommunicationEvent", { communicationEventId: joe.own }) }
    },
    then({ joe, joeEntry, johnEdit, johnDelete, johnNoteRow, joeNoteRow }) {
        joe.entry.key != null
        !joe.entry.canEdit
        !joe.entry.canDelete
        joe.remove.status == 500
        joe.remove.json.errors.includes("You may delete only your own notes")
        johnNoteRow.body.includes("John's note")
        !joeEntry.canEdit
        joeEntry.canDelete
        johnEdit.status == 500
        johnEdit.json.errors.includes("You may change only your own notes")
        johnDelete.status == 200
        johnDelete.json.deleted
        joeNoteRow == null
    },
})

feature("a note with a reply is not deleted until the reply is", {
    allowMessageErrors: true,
    when() {
        const id = post("logNote", { body: "<p>A note to answer.</p>" }).json.communicationEventId
        const replyId = post("reply", { parentCommEventId: id, body: "<p>An answer.</p>" }).json.communicationEventId
        const entries = get("timeline").json.entryList || []
        const refused = post("deleteEntry", { communicationEventId: id })
        const reply = post("deleteEntry", { communicationEventId: replyId })
        const note = post("deleteEntry", { communicationEventId: id })
        return { entry: entryOf(entries, `ce-${id}`), replyEntry: entryOf(entries, `ce-${replyId}`), refused, reply, note,
            gone: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }) == null }
    },
    then({ entry, replyEntry, refused, reply, note, gone }) {
        entry.canEdit
        !entry.canDelete
        replyEntry.canDelete
        refused.status == 500
        refused.json.errors.includes("This note has replies")
        reply.json.deleted
        note.json.deleted
        gone
    },
})

feature("a record the user may not see, another user's personal contact: the panel shows nothing and a write is refused", {
    allowMessageErrors: true,
    when() {
        sys(() => {
            if (!one("mantle.party.Party", { partyId: "BOSS_TEST_CHATTER_PRIVATE" }))
                call("create#mantle.party.Party", { partyId: "BOSS_TEST_CHATTER_PRIVATE", partyTypeEnumId: "PtyPerson", privateOwnerUserId: "ORG_ZIZI_JD" })
        })
        const hidden = { recordEntity: "mantle.party.Party", recordId: "BOSS_TEST_CHATTER_PRIVATE" }
        const notes = () => list("mantle.party.communication.CommunicationEvent", { fromPartyId: "EX_JOHN_DOE", body: "<p>Should not be written</p>" }).length
        const before = notes()
        return {
            data: call_("chatterData", hidden), timeline: call_("timeline", hidden), card: call_("recordCard", hidden),
            // every write first finds the record with requireVisible (get#RecordInfo): one write shows the refusal
            note: post("logNote", { body: "<p>Should not be written</p>" }, hidden), before, after: notes() }
    },
    then({ data, timeline, card, note, before, after }) {
        data.status == 200
        data.json.visible === false
        data.json.record === undefined
        timeline.status == 500
        card.json.title == "BOSS_TEST_CHATTER_PRIVATE"
        card.json.status === undefined
        note.status == 500
        after == before
    },
})

feature("the record screens render with their chatter and record-files elements, opening on the per-app default tab", {
    where: [
        { path: "apps/Commons/Requests/RequestDetail", parameters: { requestId: "BOSS_DEMO_REQUEST" }, id: "RequestChatter", entity: "mantle.request.Request",
            recordId: "BOSS_DEMO_REQUEST", tab: "log", files: "RequestFiles", filesParameters: { requestId: "BOSS_DEMO_REQUEST", tab: "files" } },
        { path: "apps/Commons/Tasks/TaskDetail", parameters: { workEffortId: "BOSS_DEMO_TASK" }, id: "TaskChatter", entity: "mantle.work.effort.WorkEffort",
            recordId: "BOSS_DEMO_TASK", tab: "log", files: "TaskFiles", filesParameters: { workEffortId: "BOSS_DEMO_TASK", tab: "files" } },
        { path: "apps/Commons/Calendar/EventDetail", parameters: { workEffortId: "BOSS_DEMO_EVENT" }, id: "EventChatter", entity: "mantle.work.effort.WorkEffort",
            recordId: "BOSS_DEMO_EVENT", tab: "log", files: "EventFiles", filesParameters: { workEffortId: "BOSS_DEMO_EVENT", tab: "files" } },
        { path: "apps/Commons/Contacts/ContactDetail", parameters: { partyId: "ORG_ACME_BA" }, id: "ContactChatter", entity: "mantle.party.Party",
            recordId: "ORG_ACME_BA", tab: "message", files: "ContactFiles", filesParameters: { partyId: "ORG_ACME_BA", tab: "files" } },
    ],
    expect({ path, parameters, id, entity, recordId, tab, files, filesParameters }) {
        const shown = render(path, parameters)
        // the contact record (M4), the task and the request (M6) and the event (M7) have their files on the Files tab
        const filesShown = filesParameters ? render(path, filesParameters) : shown
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes(`<m-chatter id="${id}" record-entity="${entity}" record-id="${recordId}" default-tab="${tab}">`)
        filesShown.output.includes(`<m-record-files id="${files}" record-entity="${entity}" record-id="${recordId}"`)
        shown.output.includes(`<m-screen-context record-entity="${entity}" record-id="${recordId}"`)
    },
})

feature("a contact the user may not see shows the not available box, without Chatter", {
    expect() {
        const shown = render("apps/Commons/Contacts/ContactDetail", { partyId: "BOSS_TEST_CHATTER_PRIVATE" })
        shown.status == 200
        shown.output.includes("is not available")
        !shown.output.includes("<m-chatter")
    },
})

feature("every BOSS app root mounts its Chatter and RecordFiles panels, which answer their components in qvue", {
    when() {
        const str = ec.screen.makeTest().rootScreen(webroot).render("shellData", {}, null)
        const json = JSON.parse(str.output)
        // Sales, Insights and Admin have no grant until they are implemented
        const boss = (json.apps || []).filter((app) => /^\/qapps\/(Commons|Comms)$/.test(app.path))
        return { shell: json.shell || {}, boss, chatter: render("apps/Commons/Chatter", {}, "qvue"), files: render("apps/Commons/RecordFiles", {}, "qvue") }
    },
    then({ shell, boss, chatter, files }) {
        shell.chatterScreen == "Chatter"
        shell.recordFilesScreen == "RecordFiles"
        boss.length >= 2
        boss.every((app) => app.recordScreens.chatter.url === app.path + "/Chatter" && app.recordScreens.chatter.renderModes.includes("qvue"))
        boss.every((app) => app.recordScreens.recordFiles.url === app.path + "/RecordFiles")
        chatter.status == 200
        chatter.output.includes("module.exports")
        chatter.output.includes("inject: { mRecordPanel")
        files.status == 200
        files.output.includes("module.exports")
    },
})
