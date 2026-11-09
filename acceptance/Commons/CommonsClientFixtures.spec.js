// Disposable fixtures for the manual Commons UI review (ui-review-drawers-commons.md, DC-01–10).
// Acceptance fixture: this prepares complete-activity data; it is not a regression rule or a screen walk.
// Run on an isolated runtime: moqui test mr-boss --acceptance --spec CommonsClientFixtures --db fresh --serve <host>:<port>.
// Reuse the demo users, contact books, duplicate pairs, calendars, rooms and equipment. Only BOSS_UI_* rows are added.
// Reloading resets the disposable review work and approvals; no external provider or recipient is contacted.
const joe = "ORG_ZIZI_JD"
const bob = "ORG_ZIZI_BD"
const contacts = "BOSS_UI_CONTACT_ADMIN"
const other = "BOSS_UI_OTHER_STAFF"
const otherOrg = "BOSS_UI_OTHER_ORG"
const taskId = "BOSS_UI_TASK"
const requestId = "BOSS_UI_REQUEST"
const find = (entityName, fields) => ec.entity.find(entityName).condition(fields).disableAuthz()
const one = (entityName, fields) => find(entityName, fields).one()
const store = (entityName, fields) => {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.createOrUpdate()
}
function sys(run) {
    const disabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!disabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
function account(userId, username, firstName, lastName, orgId, groups, zone) {
    const demo = one("moqui.security.UserAccount", {userId: joe})
    store("mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson", ownerPartyId: orgId, disabled: "N"})
    store("mantle.party.Person", {partyId: userId, firstName, lastName})
    store("mantle.party.PartyRelationship", {partyRelationshipId: userId + "_ORG", relationshipTypeEnumId: "PrtAgent",
        fromPartyId: userId, toPartyId: orgId, toRoleTypeId: "OrgInternal", fromDate: new Date(0), thruDate: null})
    // The disposable actors use the same local demo login secret; never print it or include it in review evidence.
    store("moqui.security.UserAccount", {userId, username, userFullName: firstName + " " + lastName, partyId: userId,
        emailAddress: username + "@example.invalid", locale: "en_US", currencyUomId: "USD", timeZone: zone,
        currentPassword: demo.currentPassword, passwordSalt: demo.passwordSalt, passwordHashType: demo.passwordHashType,
        passwordBase64: demo.passwordBase64, passwordSetDate: ec.user.nowTimestamp, requirePasswordChange: "N",
        disabled: "N", disabledDateTime: null, terminateDate: null, successiveFailedLogins: 0})
    for (const userGroupId of groups)
        store("moqui.security.UserGroupMember", {userGroupId, userId, fromDate: new Date(0), thruDate: null})
}
function reviewTask(id, title, owner, parties, due) {
    store("mantle.work.effort.WorkEffort", {workEffortId: id, workEffortTypeEnumId: "WetTask", purposeEnumId: "WepTask",
        workEffortName: title, statusId: "WeInPlanning", resolutionEnumId: "WerUnresolved", ownerPartyId: owner,
        visibilityEnumId: "WevWorkGroup", priority: 5, timeUomId: "TF_hr", estimatedCompletionDate: due,
        actualCompletionDate: null, description: "Disposable Commons review work; safe to edit and complete."})
    for (const partyId of parties)
        store("mantle.work.effort.WorkEffortParty", {workEffortId: id, partyId, roleTypeId: "Assignee", fromDate: new Date(0),
            thruDate: null, statusId: "WeptAssigned", snoozedThruDate: null})
}

spec({
    setupSpec() { login("john.doe") },
    cleanup() { login("john.doe") }
})

feature("least-privilege review actors and disposable shared work exist", {
    when() {
        sys(() => {
            store("mantle.party.Party", {partyId: otherOrg, partyTypeEnumId: "PtyOrganization", ownerPartyId: otherOrg})
            store("mantle.party.Organization", {partyId: otherOrg, organizationName: "Commons review other organization"})
            store("mantle.party.PartyRole", {partyId: otherOrg, roleTypeId: "OrgInternal"})
            account(contacts, "commons.review.contacts", "Review", "Contact administrator", "ORG_ZIZI_SERVICES",
                ["BOSS_USERS", "BOSS_CONTACT_ADMIN"], "Europe/Berlin")
            account(other, "commons.review.other", "Review", "Other staff", otherOrg, ["BOSS_USERS"], "UTC")
            const due = new Date(Number(String(ec.user.nowTimestamp)) + 3600000)
            reviewTask(taskId, "Review shared task — assign, comment and complete", joe, [joe, bob], due)
            reviewTask("BOSS_UI_OTHER_TASK", "Other organization private review task", other, [other], due)
            store("mantle.request.Request", {requestId, requestTypeEnumId: "RqtSupport", statusId: "ReqSubmitted",
                requestResolutionEnumId: "RrUnresolved", requestName: "Review shared request — respond and collaborate",
                priority: 5, filedByPartyId: joe, requestDate: ec.user.nowTimestamp,
                description: "Disposable review request for two staff users and two addressed demo approvals."})
            for (const [partyId, roleTypeId] of [[joe, "Reporter"], [bob, "Assignee"]])
                store("mantle.request.RequestParty", {requestId, partyId, roleTypeId, fromDate: new Date(0), thruDate: null})
            store("mantle.request.RequestWorkEffort", {requestId, workEffortId: taskId})
            for (const [suffix, author] of [["JOE", joe], ["BOB", bob]]) {
                const communicationEventId = "BOSS_UI_NOTE_" + suffix
                store("mantle.party.communication.CommunicationEvent", {communicationEventId, communicationEventTypeId: "Comment",
                    contactMechTypeEnumId: "CmtWebForm", statusId: "CeSent", fromPartyId: author, entryDate: ec.user.nowTimestamp,
                    subject: "Review note by " + suffix, contentType: "text/plain", body: "Disposable authored note for edit and refusal checks."})
                store("mantle.request.RequestCommEvent", {requestId, communicationEventId})
                store("mantle.work.effort.WorkEffortCommEvent", {workEffortId: taskId, communicationEventId})
            }
        })
        const permissions = as("commons.review.contacts", () => ({boss: ec.user.isInGroup("BOSS_USERS"),
            contactAdmin: ec.user.hasPermission("CONTACT_ADMIN"), admin: ec.user.isInGroup("ADMIN")}))
        const joeTask = as("joe.developer", () => sys(() => call("ironstone.commons.TaskServices.get#TaskAccess", {workEffortId: taskId})))
        const bobTask = as("bob.developer", () => sys(() => call("ironstone.commons.TaskServices.get#TaskAccess", {workEffortId: taskId})))
        const otherTask = as("commons.review.other", () => sys(() => call("ironstone.commons.TaskServices.get#TaskAccess", {workEffortId: "BOSS_UI_OTHER_TASK"})))
        // Use the app's authorization context: setup's sys() deliberately bypasses organization filters.
        const otherDenied = as("joe.developer", () => {
            const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commons.xml")
                .render("Chatter/chatterData", {recordEntity: "mantle.work.effort.WorkEffort", recordId: "BOSS_UI_OTHER_TASK"}, null)
            if (result.errorMessages.length) throw new Error(result.errorMessages.join(" | "))
            return JSON.parse(result.output)
        })
        return {permissions, joeTask, bobTask, otherTask, otherDenied,
            otherGroups: Array.from(find("moqui.security.UserGroupMember", {userId: other}).list()).map(row => row.userGroupId)}
    },
    then({permissions, joeTask, bobTask, otherTask, otherDenied, otherGroups}) {
        permissions.boss
        permissions.contactAdmin
        !permissions.admin
        joeTask.visible
        bobTask.visible
        otherTask.visible
        !otherDenied.visible
        otherGroups == ["BOSS_USERS"]
    }
})

feature("local attachments and two independently addressed demo approvals are ready", {
    when() {
        as("joe.developer", () => sys(() => {
            if (!find("mantle.request.RequestContent", {requestId, description: "Commons review local attachment"}).one())
                call("mantle.request.RequestServices.create#RequestContent", {requestId, contentTypeEnumId: "RqCntInternal",
                    description: "Commons review local attachment", userId: joe,
                    contentFile: uploadedFile("commons-review-request.txt", "Disposable request attachment for the Commons review.")})
            if (!find("mantle.work.effort.WorkEffortContent", {workEffortId: taskId, description: "Commons review local attachment"}).one())
                call("mantle.work.WorkEffortServices.create#WorkEffortContent", {workEffortId: taskId, contentTypeEnumId: "WectSupportingMedia",
                    description: "Commons review local attachment", userId: joe,
                    contentFile: uploadedFile("commons-review-task.txt", "Disposable task attachment for the Commons review.")})
            for (const suffix of ["APPROVE", "REFUSE"]) {
                const notificationMessageId = "BOSS_UI_NM_" + suffix
                store("moqui.security.user.NotificationMessage", {notificationMessageId, topic: "BossDemoApproval", reasonEnumId: "NrApproval",
                    titleText: "Review purchase to " + suffix.toLowerCase(), sentDate: ec.user.nowTimestamp, appName: "Commons", actorUserId: bob,
                    recordEntityName: "mantle.request.Request", recordId: requestId,
                    messageJson: JSON.stringify({summary: "Disposable review purchase " + suffix.toLowerCase()}),
                    linkText: "/qapps/Commons/Requests/RequestDetail?requestId=" + requestId})
                store("moqui.security.user.NotificationMessageUser", {notificationMessageId, userId: joe,
                    sentDate: ec.user.nowTimestamp, viewedDate: null})
            }
        }))
        const attachment = one("mantle.request.RequestContent", {requestId, description: "Commons review local attachment"})
        const text = attachment ? sys(() => ec.resource.getLocationReference(attachment.contentLocation).getText()) : ""
        return {text, approvals: ["APPROVE", "REFUSE"].map(suffix => one("moqui.security.user.NotificationMessageUser",
            {notificationMessageId: "BOSS_UI_NM_" + suffix, userId: joe}))}
    },
    then({text, approvals}) {
        text == "Disposable request attachment for the Commons review."
        approvals.every(row => row != null && row.viewedDate == null)
    }
})

feature("shared calendar roles, a DST recurrence and existing resource fixtures are available", {
    when() {
        sys(() => {
            for (const [calendarId, calendarName, owner] of [["BOSS_UI_CAL", "Review shared calendar", joe],
                ["BOSS_UI_CAL_READONLY", "Review read-only calendar", contacts]])
                store("mantle.work.calendar.Calendar", {calendarId, calendarName, ownerPartyId: owner,
                    calendarKindEnumId: "CalkPersonal", color: "#1e88e5", isDefault: "N", createdDate: ec.user.nowTimestamp})
            store("mantle.work.calendar.CalendarShare", {calendarShareId: "BOSS_UI_CAL_BOB", calendarId: "BOSS_UI_CAL",
                userId: bob, permissionEnumId: "CalpEdit", fromDate: new Date(0), thruDate: null})
            store("mantle.work.calendar.CalendarShare", {calendarShareId: "BOSS_UI_CAL_JOE_READ", calendarId: "BOSS_UI_CAL_READONLY",
                userId: joe, permissionEnumId: "CalpView", fromDate: new Date(0), thruDate: null})
            store("mantle.work.effort.WorkEffort", {workEffortId: "BOSS_UI_DST_EVENT", workEffortTypeEnumId: "WetEvent",
                purposeEnumId: "WepMeeting", statusId: "WeApproved", ownerPartyId: joe, workEffortName: "Review DST meeting at 09:00 Central",
                estimatedStartDate: new Date("2027-03-13T15:00:00Z"), estimatedCompletionDate: new Date("2027-03-13T15:30:00Z")})
            store("mantle.work.effort.WorkEffortRecurrence", {workEffortId: "BOSS_UI_DST_EVENT", rrule: "FREQ=DAILY;COUNT=3", timeZone: "US/Central"})
            store("mantle.work.calendar.CalendarWorkEffort", {calendarId: "BOSS_UI_CAL", workEffortId: "BOSS_UI_DST_EVENT", addedDate: ec.user.nowTimestamp})
            store("mantle.work.effort.WorkEffortParty", {workEffortId: "BOSS_UI_DST_EVENT", partyId: joe,
                roleTypeId: "Assignee", fromDate: new Date(0), thruDate: null, statusId: "WeptAssigned", mustRsvp: "N"})
        })
        return {recurrence: one("mantle.work.effort.WorkEffortRecurrence", {workEffortId: "BOSS_UI_DST_EVENT"}),
            room: one("mantle.facility.Facility", {facilityId: "BOSS_DEMO_ROOM_MAPLE"}),
            board: one("mantle.facility.Facility", {facilityId: "BOSS_DEMO_ROOM_BOARD"}),
            book: one("mantle.party.contact.ContactBook", {contactBookId: "BOSS_DEMO_BOOK_TEAM"}),
            adminZone: one("moqui.security.UserAccount", {userId: contacts}).timeZone}
    },
    then({recurrence, room, board, book, adminZone}) {
        recurrence.timeZone == "US/Central"
        room.bookable == "Y"
        board.bookable == "Y"
        book != null
        adminZone == "Europe/Berlin"
    }
})
