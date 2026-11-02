// QuickCreate (screen/Commons/QuickCreate.xml, impl-drawers-commons.md M2): each kind renders in qvt, with the record of the
// screen context as a chip; each kind's transition creates its record through service/ironstone/commons/QuickCreateServices.xml and
// answers JSON messageInfos (so the shell's dialog closes) with the record's screen: a task (on a record), an activity on the
// demo request (a call, and a meeting), an event with an attendee, a note on a record (its Chatter) and one without (the
// user's notes space), a personal and a directory contact, and a request. A record the user may not see is refused.
// Run: ./moq test mr-boss --spec QuickCreate
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const request = { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST", recordTitle: "Set up the shared team calendar" }

function render(parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render("apps/Commons/QuickCreate", Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(name, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(`QuickCreate/${name}`, parameters || {}, "post")
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, text: String(str.output || "").substring(0, 300) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const list = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const message = (answer) => ((answer.json.messageInfos || [])[0] || {}).message || ""

spec({
    setupSpec() { login("john.doe") },
})

feature("the #kind form renders in qvt (#label)", {
    where: [
        { kind: "task", label: "Due", parameters: {} },
        // the server-static form composes "Linked to <record>" in the browser: the record's title is in its data
        { kind: "task", label: "Set up the shared team calendar", parameters: request },
        { kind: "activity", label: "An activity is always on a record", parameters: {} },
        { kind: "activity", label: "Meeting", parameters: request },
        { kind: "event", label: "Attendees", parameters: {} },
        { kind: "note", label: "Saved in your notes", parameters: {} },
        { kind: "note", label: "A note on", parameters: request },
        { kind: "note", label: "rich-light", parameters: request },
        { kind: "contact", label: "Directory (everyone)", parameters: {} },
        { kind: "request", label: "Customer", parameters: {} },
    ],
    expect({ kind, label, parameters }) {
        const shown = render(Object.assign({ kind }, parameters))
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes(label)
    },
})

feature("a task on the record in context, assigned to john.doe and due on the day given", {
    when() {
        const created = post("createTask", Object.assign({ workEffortName: "Order the calendar subscription", estimatedCompletionDate: "2026-11-02", priority: "2" },
            { recordEntity: "mantle.party.Party", recordId: "ORG_ACME_BA" }))
        const id = created.json.workEffortId
        return { created, task: one("mantle.work.effort.WorkEffort", { workEffortId: id }),
            assignee: one("mantle.work.effort.WorkEffortParty", { workEffortId: id, partyId: "EX_JOHN_DOE", roleTypeId: "Assignee" }),
            link: one("mantle.work.effort.WorkEffortRecord", { workEffortId: id, recordEntityName: "mantle.party.Party", recordId: "ORG_ACME_BA" }) }
    },
    then({ created, task, assignee, link }) {
        created.errors == ""
        message(created) == "Task created: Order the calendar subscription"
        created.json.url == `/qapps/Commons/Tasks/TaskDetail?workEffortId=${task.workEffortId}`
        created.json.messageInfos[0].link == created.json.url
        !created.json.screenUrl
        task.workEffortTypeEnumId == "WetTask"
        task.priority == 2
        ec.l10n.format(task.estimatedCompletionDate, "yyyy-MM-dd") == "2026-11-02"
        assignee != null
        link != null
    },
})

feature("an activity on the demo request: a call is a task, a meeting an event, both on the request", {
    when() {
        const callMade = post("createActivity", Object.assign({ activityType: "call", workEffortName: "Call about the calendar invoice",
            dueDate: "2026-11-03 10:00" }, request))
        const meetingMade = post("createActivity", Object.assign({ activityType: "meeting", workEffortName: "Walk through the calendar",
            dueDate: "2026-11-03 14:00", endDate: "2026-11-03 15:00" }, request))
        return { callMade, meetingMade,
            call_: one("mantle.work.effort.WorkEffort", { workEffortId: callMade.json.workEffortId }),
            meeting: one("mantle.work.effort.WorkEffort", { workEffortId: meetingMade.json.workEffortId }),
            links: list("mantle.request.RequestWorkEffort", { requestId: "BOSS_DEMO_REQUEST" }).map((row) => row.workEffortId) }
    },
    then({ callMade, meetingMade, call_, meeting, links }) {
        callMade.errors == ""
        message(callMade) == "Activity scheduled: Call about the calendar invoice"
        call_.workEffortTypeEnumId == "WetTask"
        call_.purposeEnumId == "WepPhoneCall"
        meetingMade.errors == ""
        meeting.workEffortTypeEnumId == "WetEvent"
        meeting.purposeEnumId == "WepMeeting"
        ec.l10n.format(meeting.estimatedCompletionDate, "HH:mm") == "15:00"
        links.includes(call_.workEffortId)
        links.includes(meeting.workEffortId)
        meetingMade.json.url == `/qapps/Commons/Calendar/EventDetail?workEffortId=${meeting.workEffortId}`
    },
})

feature("an event with an attendee, in john.doe's default calendar", {
    when() {
        const created = post("createEvent", { workEffortName: "Calendar training", estimatedStartDate: "2026-11-04 09:00",
            estimatedCompletionDate: "2026-11-04 10:30", attendeePartyIds: "ORG_ZIZI_JD" })
        const id = created.json.workEffortId
        return { created, event: one("mantle.work.effort.WorkEffort", { workEffortId: id }),
            attendee: one("mantle.work.effort.WorkEffortParty", { workEffortId: id, partyId: "ORG_ZIZI_JD", roleTypeId: "Assignee" }),
            mine: one("mantle.work.effort.WorkEffortParty", { workEffortId: id, partyId: "EX_JOHN_DOE", roleTypeId: "Assignee" }),
            calendars: list("mantle.work.calendar.CalendarWorkEffort", { workEffortId: id }).length }
    },
    then({ created, event, attendee, mine, calendars }) {
        created.errors == ""
        message(created) == "Event created: Calendar training"
        event.workEffortTypeEnumId == "WetEvent"
        event.purposeEnumId == "WepMeeting"
        attendee.statusId == "WeptOffered"
        mine.statusId == "WeptAssigned"
        calendars == 1
    },
})

feature("an all-day event has its days and no time", {
    when() {
        const created = post("createEvent", { workEffortName: "Team offsite", estimatedStartDate: "2026-11-05 00:00", estimatedCompletionDate: "2026-11-06 00:00", allDay: "Y" })
        return { created, event: one("mantle.work.effort.WorkEffort", { workEffortId: created.json.workEffortId }) }
    },
    then({ created, event }) {
        created.errors == ""
        event.estimatedStartDate == null
        // a date field reaches a script as the epoch millis of its UTC midnight
        new Date(Number(String(event.allDayStart))).toISOString().substring(0, 10) == "2026-11-05"
        new Date(Number(String(event.allDayEnd))).toISOString().substring(0, 10) == "2026-11-06"
    },
})

feature("a note on the demo request is a rich text comment on its timeline, its mention notified", {
    when() {
        const mentions = () => list("moqui.security.user.NotificationMessageByUser", { userId: "ORG_ZIZI_JD", topic: "ChatterMention" }).length
        const before = mentions()
        const body = '<p>Contractors get <strong>view</strong> access only, <span data-mention-id="ORG_ZIZI_JD">@Joe Developer</span>.</p>'
        const created = post("createNote", Object.assign({ title: "Access", noteText: body }, request))
        const id = created.json.communicationEventId
        return { created, before, after: mentions(), comm: one("mantle.party.communication.CommunicationEvent", { communicationEventId: id }),
            link: one("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQUEST", communicationEventId: id }) }
    },
    then({ created, before, after, comm, link }) {
        created.errors == ""
        message(created) == "Note added to Set up the shared team calendar"
        created.json.url == "/qapps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST"
        comm.communicationEventTypeId == "Comment"
        comm.contentType == "text/html"
        comm.body.includes("<strong>view</strong>")
        comm.body.includes('data-mention-id="ORG_ZIZI_JD"')
        link != null
        after == before + 1
    },
})

feature("a note without a record goes in john.doe's notes space, made on first use", {
    when() {
        const created = post("createNote", { title: "Gift ideas", noteText: "A shared calendar for the family." })
        const again = post("createNote", { title: "Gift ideas", noteText: "A second note with the same title." })
        return { created, again, page: one("moqui.resource.wiki.WikiPage", { wikiPageId: created.json.wikiPageId }),
            secondPage: one("moqui.resource.wiki.WikiPage", { wikiPageId: again.json.wikiPageId }) }
    },
    then({ created, again, page, secondPage }) {
        created.errors == ""
        message(created) == "Note saved in your notes: Gift ideas"
        page.wikiSpaceId == "NOTES_EX_JOHN_DOE"
        page.pagePath == "Gift ideas"
        created.json.url == `/qapps/Commons/Notes?wikiPageId=${page.wikiPageId}`
        again.errors == ""
        secondPage.pagePath != "Gift ideas"
        secondPage.pagePath.startsWith("Gift ideas (")
    },
})

feature("a contact is personal by default, in john.doe's default book; or a directory contact", {
    when() {
        const personal = post("createContact", { partyTypeEnumId: "PtyPerson", contactName: "Mary Ann Smith", emailAddress: "mary.smith@example.com", phone: "(801) 555-0134" })
        const directory = post("createContact", { partyTypeEnumId: "PtyOrganization", contactName: "Calendar Experts Inc", contactBookId: "DIRECTORY" })
        const person = one("mantle.party.Person", { partyId: personal.json.partyId })
        return { personal, directory, party: one("mantle.party.Party", { partyId: personal.json.partyId }), person,
            inBook: one("mantle.party.contact.ContactBookParty", { contactBookId: personal.json.contactBookId, partyId: personal.json.partyId }),
            org: one("mantle.party.Party", { partyId: directory.json.partyId }), orgRole: one("mantle.party.PartyRole", { partyId: directory.json.partyId, roleTypeId: "Account" }) }
    },
    then({ personal, directory, party, person, inBook, org, orgRole }) {
        personal.errors == ""
        message(personal) == "Contact added: Mary Ann Smith"
        party.privateOwnerUserId == "EX_JOHN_DOE"
        person.firstName == "Mary Ann"
        person.lastName == "Smith"
        inBook != null
        personal.json.url == `/qapps/Commons/Contacts/ContactDetail?partyId=${party.partyId}`
        directory.errors == ""
        message(directory) == "Contact added to the directory: Calendar Experts Inc"
        org.privateOwnerUserId == null
        org.partyTypeEnumId == "PtyOrganization"
        orgRole != null
    },
})

feature("a request with the party in context as its customer", {
    when() {
        const created = post("createRequest", { requestName: "Calendar access for Bob", requestTypeEnumId: "RqtSupport", priority: "5",
            recordEntity: "mantle.party.Party", recordId: "ORG_ACME_BA" })
        const id = created.json.requestId
        const onTask = post("createRequest", { requestName: "Follow up the call", recordEntity: "mantle.work.effort.WorkEffort", recordId: "BOSS_DEMO_TODAY_CALL" })
        return { created, req: one("mantle.request.Request", { requestId: id }),
            customer: one("mantle.request.RequestParty", { requestId: id, partyId: "ORG_ACME_BA", roleTypeId: "Customer" }),
            partyLink: one("mantle.request.RequestRecord", { requestId: id, recordEntityName: "mantle.party.Party", recordId: "ORG_ACME_BA" }),
            onTask, taskLink: one("mantle.request.RequestWorkEffort", { requestId: onTask.json.requestId, workEffortId: "BOSS_DEMO_TODAY_CALL" }),
            taskGeneric: one("mantle.request.RequestRecord", { requestId: onTask.json.requestId, recordEntityName: "mantle.work.effort.WorkEffort", recordId: "BOSS_DEMO_TODAY_CALL" }) }
    },
    then({ created, req, customer, partyLink, onTask, taskLink, taskGeneric }) {
        created.errors == ""
        message(created) == "Request created: Calendar access for Bob"
        created.json.url == `/qapps/Commons/Requests/RequestDetail?requestId=${req.requestId}`
        req.statusId == "ReqSubmitted"
        customer != null
        partyLink != null
        onTask.errors == ""
        taskLink != null
        taskGeneric == null
    },
})

feature("an activity on another user's personal contact is refused and makes nothing", {
    allowMessageErrors: true,
    when() {
        sys(() => call("create#mantle.party.Party", { partyId: "BOSS_TEST_PRIVATE", partyTypeEnumId: "PtyPerson", privateOwnerUserId: "ORG_ZIZI_JD" }))
        const before = list("mantle.work.effort.WorkEffort", { workEffortName: "Call a private contact" }).length
        const refused = post("createActivity", { activityType: "call", workEffortName: "Call a private contact", dueDate: "2026-11-03 10:00",
            recordEntity: "mantle.party.Party", recordId: "BOSS_TEST_PRIVATE" })
        return { refused, before, after: list("mantle.work.effort.WorkEffort", { workEffortName: "Call a private contact" }).length }
    },
    then({ refused, before, after }) {
        refused.status == 500
        after == before
    },
})
