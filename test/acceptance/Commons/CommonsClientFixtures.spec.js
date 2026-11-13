// Disposable fixtures for the manual Commons UI review (ui-review-drawers-commons.md: DC-01–10, and Waves 5–7 mail, queue and moderation).
// Acceptance fixture: this prepares complete-activity data; it is not a regression rule or a screen walk.
// Run on an isolated runtime: moqui test mr-boss --acceptance --spec CommonsClientFixtures --db fresh --serve <host>:<port>.
// Reuse demo users and records. The first three features reset BOSS_UI_* review work and approvals.
// Select only the Wave 5 feature on an existing review database: its account/message setup reuses existing fixture rows
// without resetting demo data. Mail account/folder/identity/message IDs come from the framework services.
// The mail feature only creates a loopback account and imports local data; it does not send. Enable mail capture on the manual UI server.
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
// orgId null: a public member, a person of no organization.
function account(userId, username, firstName, lastName, orgId, groups, zone) {
    const demo = one("moqui.security.UserAccount", {userId: joe})
    if (!demo?.currentPassword) throw new Error("the review actors need Joe's local demo login")
    store("mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson", ownerPartyId: orgId, disabled: "N"})
    store("mantle.party.Person", {partyId: userId, firstName, lastName})
    if (orgId) store("mantle.party.PartyRelationship", {partyRelationshipId: userId + "_ORG", relationshipTypeEnumId: "PrtAgent",
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

feature("Wave 5 local mail review fixtures", {
    when() {
        const MAIL = "org.moqui.mail.EmailClientServices"
        const address = "joe.wave5.review@example.invalid"
        const messageId = "<boss-ui-wave5-multipart@fixture.example.invalid>"
        const attachmentText = "Wave 5 attachment bytes.\n"
        const fixture = as("joe.developer", () => sys(() => {
            let mailAccount = one("moqui.basic.email.EmailAccount", {ownerUserId: joe, emailAddress: address})
            if (!mailAccount) {
                const created = call(MAIL + ".create#EmailAccount", {accountKindEnumId: "EakHosted", emailAddress: address,
                    accountName: "Wave 5 local review mail", displayName: "Joe Developer review", smtpHost: "127.0.0.1",
                    smtpPort: "1", smtpStartTls: "N", smtpSsl: "N", recordFilingEnumId: "ErfLinkedOnly"})
                mailAccount = one("moqui.basic.email.EmailAccount", {emailAccountId: created.emailAccountId})
            }
            if (!mailAccount || mailAccount.statusId === "EasRemoved") throw new Error("Wave 5 review account is missing or removed; restore it explicitly")
            const emailAccountId = mailAccount.emailAccountId
            call(MAIL + ".add#EmailAccountUser", {emailAccountId, userId: bob, permissionEnumId: "EapRead"})
            const inbox = one("moqui.basic.email.EmailFolder", {emailAccountId, folderKindEnumId: "EfkInbox"})
            const identity = one("moqui.basic.email.EmailIdentity", {emailAccountId, emailAddress: address})
            if (!inbox || !identity) throw new Error("Wave 5 review account has no Inbox or identity")
            let message = one("moqui.basic.email.EmailMessage", {emailAccountId, messageId})
            let imported = null
            if (!message) {
                const messageText = [
                    "From: Fictional Review Sender <review.sender@example.invalid>", "To: Joe Developer <" + address + ">",
                    "Subject: Wave 5 local HTML and plain review", "Message-ID: " + messageId,
                    "Date: Sun, 08 Nov 2026 12:00:00 +0000", "MIME-Version: 1.0",
                    'Content-Type: multipart/mixed; boundary="review-mixed"', "",
                    "--review-mixed", 'Content-Type: multipart/alternative; boundary="review-alt"', "",
                    "--review-alt", "Content-Type: text/plain; charset=UTF-8", "",
                    "Wave 5 plain body. The attachment is fictional review data.",
                    "--review-alt", "Content-Type: text/html; charset=UTF-8", "",
                    '<p>Wave 5 <strong>HTML body</strong>. Fictional review data.</p>' +
                        '<img src="http://127.0.0.1:1/review-remote.png" alt="Review remote image">' +
                        '<img src="invalid-review-image" onerror="document.documentElement.dataset.reviewUnsafe=\'yes\'">' +
                        '<script>document.documentElement.dataset.reviewUnsafe="yes"</script>',
                    "--review-alt--", "--review-mixed", 'Content-Type: text/plain; name="wave5-review.txt"',
                    'Content-Disposition: attachment; filename="wave5-review.txt"', "Content-Transfer-Encoding: base64", "",
                    "V2F2ZSA1IGF0dGFjaG1lbnQgYnl0ZXMuCg==", "--review-mixed--", ""
                ].join("\r\n")
                imported = call(MAIL + ".import#EmailMessages", {emailFolderId: inbox.emailFolderId, messageText})
                if (imported.failedCount || imported.importedCount !== 1) throw new Error("Wave 5 RFC822 import did not create its one message")
                message = one("moqui.basic.email.EmailMessage", {emailAccountId, messageId})
            }
            const attachment = message && one("moqui.basic.email.EmailMessageAttachment", {emailMessageId: message.emailMessageId, fileName: "wave5-review.txt"})
            const storedAttachment = attachment ? ec.resource.getLocationReference(attachment.attachmentLocation).getText() : null
            let captureJobName = null
            const captureService = "review.ReviewMailCaptureServices.write#ReviewMailCapture"
            if (String(System.getProperty("boss_ui_review_mail_capture") || "") === "true" &&
                    ec.factory.getComponentInfoList().some(component => component.name === "boss-ui-review-capture") &&
                    ec.service.getServiceDefinition(captureService)) {
                const now = Date.now()
                captureJobName = "BOSS_UI_W5_CAPTURE"
                store("moqui.service.job.ServiceJob", {jobName: captureJobName,
                    description: "Disposable Wave 5 fictional mail capture export (two-hour window)", serviceName: captureService,
                    cronExpression: "0/10 * * * * ?", localOnly: "Y", paused: "N", errorHistoryOnly: "Y", transactionTimeout: 10,
                    fromDate: new Date(now), thruDate: new Date(now + 2 * 60 * 60 * 1000), repeatCount: null})
            }
            return {emailAccountId, emailFolderId: inbox.emailFolderId, emailIdentityId: identity.emailIdentityId,
                emailMessageId: message?.emailMessageId, accountKind: mailAccount.accountKindEnumId,
                body: message?.body || "", bodyText: message?.bodyText || "", storedAttachment, attachmentText, imported, captureJobName}
        }))
        // The internal service computes the current actor's ownership/member levels; screen artifact access is reviewed in the browser.
        const access = (username) => as(username, () => sys(() => call(MAIL + ".get#EmailAccountAccess", {emailAccountId: fixture.emailAccountId})))
        const joeAccess = access("joe.developer")
        const bobAccess = access("bob.developer")
        const otherAccess = access("commons.review.other")
        ec.logger.info("Wave 5 local review fixture IDs: " + JSON.stringify({emailAccountId: fixture.emailAccountId,
            emailFolderId: fixture.emailFolderId, emailIdentityId: fixture.emailIdentityId, emailMessageId: fixture.emailMessageId,
            captureJobName: fixture.captureJobName}))
        return {fixture, joeAccess, bobAccess, otherAccess}
    },
    then({fixture, joeAccess, bobAccess, otherAccess}) {
        fixture.emailAccountId != null
        fixture.emailFolderId != null
        fixture.emailIdentityId != null
        fixture.emailMessageId != null
        fixture.accountKind == "EakHosted"
        fixture.body.includes("Wave 5")
        fixture.bodyText.includes("Wave 5 plain body")
        fixture.storedAttachment == fixture.attachmentText
        joeAccess.level == 3
        bobAccess.level == 1
        !bobAccess.account.canSend
        !bobAccess.account.canManage
        otherAccess.level == 0
    }
})

feature("Wave 7 moderation review fixtures", {
    when() {
        // PASS must be linked before this feature; the matching runtime host allowlist is configured separately.
        if (!ec.resource.getLocationReference("component://mr-pass/component.xml")?.getExists())
            throw new Error("Wave 7 moderation fixtures need mr-pass linked into runtime/components/addon")
        const S = "mantle.public.SiteServices.", F = "mantle.forum.ForumServices.", B = "ironstone.comms.ModerationServices."
        const siteName = "UIReview Wave7 moderation", categoryName = "UIReview Wave7 held questions"
        const actors = [
            {key: "moderator", id: "BOSS_UI_W7_MOD", username: "wave7.moderator", name: "Wave7 Internal Moderator", groups: ["BOSS_USERS", "BOSS_PROJECT_TEAM"], role: "member"},
            {key: "nonmoderator", id: "BOSS_UI_W7_NONMOD", username: "wave7.member", name: "Wave7 Internal Member", groups: ["BOSS_USERS"], role: "member"},
            {key: "author", id: "BOSS_UI_W7_AUTHOR", username: "wave7.author", name: "Wave7 Public Author", groups: [], role: "member"},
            {key: "authorRefuse", id: "BOSS_UI_W7_AUTHOR_REFUSE", username: "wave7.author.refuse", name: "Wave7 Public Refusal Author", groups: [], role: "member"},
            {key: "publicModerator", id: "BOSS_UI_W7_PUBLICMOD", username: "wave7.publicmod", name: "Wave7 Public Moderator", groups: [], role: "moderator"}
        ]
        const invoke = (name, params) => {
            const out = call(name, params || {}) || {}
            if (ec.message.hasError()) throw new Error(name + ": " + ec.message.getErrorsString())
            return out
        }
        const run = (name, input) => invoke(name, {input}).result
        const fixture = sys(() => {
            let site = one("mantle.public.PublicSite", {name: siteName})
            const fresh = !site
            let siteId = site?.siteId, categoryId
            if (fresh) {
                for (const actor of actors)
                    if (one("moqui.security.UserAccount", {username: actor.username}) || one("mantle.party.Party", {partyId: actor.id}))
                        throw new Error("Wave 7 partial actor fixture requires inspection: " + actor.username)
                const at = Date.now()
                siteId = run(S + "create#Site", {name: siteName, ownerPartyId: ec.user.userAccount.partyId}).siteId
                run(S + "update#Site", {siteId, state: "published", expectedRevision: 1})
                run(S + "store#Mounts", {siteId, expectedRevision: 2,
                    hosts: [{hostname: "wave7-forum.localhost", canonical: true}],
                    mounts: [{app: "forum", pathPrefix: "/forum"}, {app: "account", pathPrefix: "/account"}, {app: "members", pathPrefix: "/members"}]})
                categoryId = run(F + "store#Category", {siteId, name: categoryName, operationId: ec.user.randomString(32)}).contactListId
                run(F + "set#CategoryAccess", {siteId, contactListId: categoryId, visibility: "public", publicationState: "published", expectedRevision: 1, confirm: true})
                for (const actor of actors) {
                    // the same local demo login as the other review actors; no organization, as public members
                    account(actor.id, actor.username, actor.name, "Review", null, actor.groups, "America/Chicago")
                    store("mantle.public.PublicSiteParty", {siteId, partyId: actor.id, state: "active", role: actor.role, joinedAt: at, revision: 1})
                    store("mantle.public.PublicSiteProfile", {siteId, partyId: actor.id, handle: "w7-" + actor.key.toLowerCase(), displayName: actor.name,
                        discoverability: "members", revision: 1})
                    store("mantle.marketing.contact.ContactListParty", {contactListId: categoryId, partyId: actor.id,
                        ...(actor.key === "moderator" ? {roleTypeId: "ListModerator"} : {}), statusId: "CLPT_ACCEPTED", fromDate: new Date(0)})
                }
            } else {
                // Read existing review results on repeat; never recreate posts or undo moderation decisions/grants.
                const categories = Array.from(find("mantle.forum.ForumCategory", {siteId}).list())
                if (categories.length !== 1) throw new Error("Wave 7 existing site needs its single category inspected")
                categoryId = categories[0].contactListId
                if (one("mantle.marketing.contact.ContactList", {contactListId: categoryId})?.contactListName !== categoryName)
                    throw new Error("Wave 7 existing category identity differs")
                for (const actor of actors)
                    if (one("moqui.security.UserAccount", {userId: actor.id})?.username !== actor.username)
                        throw new Error("Wave 7 existing actor is missing or differs: " + actor.username)
            }
            const held = []
            for (const decision of ["approve", "refuse"]) {
                const title = "UIReview Wave7 " + decision + " this question"
                let event = one("mantle.party.communication.CommunicationEvent", {contactListId: categoryId, subject: title})
                if (!event) {
                    if (!fresh) throw new Error("Wave 7 existing post is missing; it will not be recreated: " + decision)
                    // Separate new authors respect each member's post interval and both require first-post review.
                    const author = decision === "approve" ? "wave7.author" : "wave7.author.refuse"
                    const posted = as(author, () => run(F + "publish#Post", {siteId, contactListId: categoryId,
                        title, body: "<p>Disposable " + decision + " review item.</p>", operationId: ec.user.randomString(32)}))
                    if (posted.state !== "pending") throw new Error("Wave 7 expected a held first-contribution post: " + decision)
                    event = one("mantle.party.communication.CommunicationEvent", {communicationEventId: posted.rootCommEventId})
                }
                const review = one("mantle.forum.ForumReviewItem", {siteId, targetId: event.communicationEventId})
                const state = one("mantle.forum.ForumPostState", {communicationEventId: event.communicationEventId})
                if (!review || !state) throw new Error("Wave 7 post has no review or publication state: " + decision)
                held.push({decision, rootCommEventId: event.communicationEventId, reviewId: review.reviewId,
                    reviewState: review.state, reviewRevision: Number(review.revision), visibility: state.visibility})
            }
            return {siteId, categoryId, fresh, held, publicHost: "wave7-forum.localhost", publicForumPath: "/forum",
                actors: actors.map(actor => ({username: actor.username, userId: actor.id, groups: actor.groups, publicRole: actor.role}))}
        })
        const moderator = as("wave7.moderator", () => sys(() => invoke(B + "find#Scopes")))
        const scope = moderator.scopeList.find(item => item.siteId === fixture.siteId && item.contactListId === fixture.categoryId)?.key
        const nonmoderator = as("wave7.member", () => sys(() => invoke(B + "find#Scopes")))
        const publicModerator = as("wave7.publicmod", () => sys(() => invoke(B + "find#Scopes")))
        const publicBossGroups = find("moqui.security.UserGroupMember", {userId: "BOSS_UI_W7_PUBLICMOD", userGroupId: "BOSS_USERS"}).count()
        ec.logger.info("Wave 7 review fixture manifest " + JSON.stringify({...fixture, scope,
            queuePath: "/qapps/Comms/Moderation/Queue?scope=" + encodeURIComponent(scope || ""),
            reviewPaths: fixture.held.map(item => "/qapps/Comms/Moderation/Review?siteId=" + encodeURIComponent(fixture.siteId) +
                "&reviewId=" + encodeURIComponent(item.reviewId) + "&scope=" + encodeURIComponent(scope || ""))}))
        return {fixture, moderator, scope, nonmoderator, publicModerator, publicBossGroups}
    },
    then({fixture, moderator, scope, nonmoderator, publicModerator, publicBossGroups}) {
        fixture.held.length == 2
        fixture.held.every(item => item.reviewId && item.rootCommEventId)
        !fixture.fresh || fixture.held.every(item => item.visibility === "pending")
        moderator.internal == true
        scope != null
        nonmoderator.internal == true
        nonmoderator.scopeList.length == 0
        publicModerator.internal == false
        publicModerator.scopeList.length == 0
        publicBossGroups == 0
    }
})

feature("Wave 6 local queue review fixtures", {
    when() {
        const SERVICES = "org.moqui.call.CallQueueServices."
        const name = "UIReview Wave6 local support"
        const invoke = (service, parameters) => {
            const out = call(SERVICES + service, parameters || {}) || {}
            if (ec.message.hasError()) throw new Error(service + ": " + ec.message.getErrorsString())
            return out
        }
        const fixture = as("john.doe", () => sys(() => {
            let queue = one("moqui.call.CallQueue", {name})
            const fresh = !queue
            if (fresh) {
                const made = invoke("store#CallQueue", {name, description: "Disposable UI review queue; no phone number or external trunk",
                    strategyEnumId: "CqsLongestIdle", ringSeconds: 20, maxWaitSeconds: 60, maxLength: 10,
                    wrapUpSeconds: 0, announceSeconds: 0, fallbackTypeEnumId: "CtgEnd"})
                queue = one("moqui.call.CallQueue", {callQueueId: made.callQueueId})
                if (!queue) throw new Error("Wave 6 queue was not created")
                invoke("store#CallQueueAgent", {callQueueId: queue.callQueueId, userId: joe, sequenceNum: 10})
                invoke("store#CallQueueAgent", {callQueueId: queue.callQueueId, userId: bob, sequenceNum: 20})
            }
            // Repeat setup preserves settings and each agent's login/pause state, including results of the manual review.
            for (const userId of [joe, bob])
                if (!one("moqui.call.CallQueueAgent", {callQueueId: queue.callQueueId, userId}))
                    throw new Error("Wave 6 queue is missing a review agent; inspect rather than resetting it: " + userId)
            return {callQueueId: queue.callQueueId, name: queue.name, fresh,
                fallbackTypeEnumId: queue.fallbackTypeEnumId,
                agentIds: [joe, bob], queuePath: "/qapps/Comms/Calls/Queues"}
        }))
        // These internal screen services apply current-user membership themselves; ordinary UI actions remain for the browser review.
        const mine = username => as(username, () => sys(() => invoke("find#MyCallQueues")))
        const joeQueues = mine("joe.developer").queueList || []
        const bobQueues = mine("bob.developer").queueList || []
        const otherQueues = mine("commons.review.other").queueList || []
        const joeQueue = joeQueues.find(queue => queue.callQueueId === fixture.callQueueId)
        const bobQueue = bobQueues.find(queue => queue.callQueueId === fixture.callQueueId)
        ec.logger.info("Wave 6 local queue review fixture manifest " + JSON.stringify({...fixture,
            actors: [{username: "joe.developer", state: joeQueue?.state}, {username: "bob.developer", state: bobQueue?.state}],
            qualification: "Queue membership and agent-state UI fixture only; no fake call, voicemail, recording, SIP trunk or media"}))
        return {fixture, joeQueue, bobQueue, otherQueues}
    },
    then({fixture, joeQueue, bobQueue, otherQueues}) {
        fixture.callQueueId != null
        fixture.name == "UIReview Wave6 local support"
        joeQueue != null
        bobQueue != null
        !fixture.fresh || fixture.fallbackTypeEnumId == "CtgEnd"
        !fixture.fresh || joeQueue.state == "out"
        !fixture.fresh || bobQueue.state == "out"
        !otherQueues.some(queue => queue.callQueueId === fixture.callQueueId)
    }
})
