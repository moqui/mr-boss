// Comms Home (screen/Comms/Home.xml, service/ironstone/comms/CommsHomeServices.xml; design-drawers-commons.md §12 Home): the counters per
// mail account and for the internal messages, flagged, snoozed, mentions and Not sent; the account whose sign-in failed (the demo's
// Support) with Fix for its owner only; Needs reply; a follow-up email and a meeting with a join link of this spec's own; the
// mailboxes with unread (the demo's Office announcements); the shortcuts. Each part stands alone: a user with no party and no mail
// still gets the page. joe.developer sees his own counts, Support (which he shares) without Fix, and none of john.doe's account.
// Run: ./moq test mr-boss --spec CommsHome
const webroot = "component://webroot/screen/webroot.xml"
const FOLLOW_UP = "BOSS_TEST_HOME_FOLLOWUP", MEETING = "BOSS_TEST_HOME_MEETING"

function render(parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render("apps/Comms/Home", Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const home = () => sys(() => call("ironstone.comms.CommsHomeServices.get#CommsHome", {}))
const card = (out, key) => (out.cardList || []).find((item) => item.key == key)

spec({
    setupSpec() {
        sys(() => {
            call("ironstone.comms.MailDemoServices.load#MailDemo", {})
            call("ironstone.comms.MailDemoServices.load#MailSettingsDemo", {})
            const now = Date.now()
            const store = (entityName, fields) => ec.service.sync().name("store#" + entityName).parameters(fields).call()
            store("mantle.work.effort.WorkEffort", { workEffortId: FOLLOW_UP, workEffortTypeEnumId: "WetTask", purposeEnumId: "WepEmail", statusId: "WeApproved",
                workEffortName: "Email the price list to Acme", ownerPartyId: "EX_JOHN_DOE", estimatedCompletionDate: new Date(now + 86400000) })
            store("mantle.work.effort.WorkEffortParty", { workEffortId: FOLLOW_UP, partyId: "EX_JOHN_DOE", roleTypeId: "Assignee", fromDate: new Date(now - 86400000),
                statusId: "WeptAssigned" })
            store("mantle.work.effort.WorkEffort", { workEffortId: MEETING, workEffortTypeEnumId: "WetEvent", purposeEnumId: "WepMeeting", statusId: "WeApproved",
                workEffortName: "Pricing call with Acme", ownerPartyId: "EX_JOHN_DOE", infoUrl: "https://meet.example.com/pricing",
                estimatedStartDate: new Date(now + 2 * 3600000), estimatedCompletionDate: new Date(now + 3 * 3600000) })
            store("mantle.work.effort.WorkEffortParty", { workEffortId: MEETING, partyId: "EX_JOHN_DOE", roleTypeId: "Assignee", fromDate: new Date(now - 86400000),
                statusId: "WeptAssigned" })
            if (ec.entity.find("moqui.security.UserAccount").condition("userId", "commsHomeNobody").count() == 0) {
                const user = ec.entity.makeValue("moqui.security.UserAccount")
                user.setFields({ userId: "commsHomeNobody", username: "commsHomeNobody", userFullName: "No Party" }, true, null, null)
                user.create()
            }
            // Comms is opened by BOSS_USERS, not ALL_USERS
            if (ec.entity.find("moqui.security.UserGroupMember").condition("userGroupId", "BOSS_USERS").condition("userId", "commsHomeNobody").count() == 0) {
                const member = ec.entity.makeValue("moqui.security.UserGroupMember")
                member.setFields({ userGroupId: "BOSS_USERS", userId: "commsHomeNobody", fromDate: ec.user.nowTimestamp }, true, null, null)
                member.create()
            }
        })
        login("john.doe")
    },
    cleanupSpec() {
        login("john.doe")
        sys(() => {
            for (const id of [FOLLOW_UP, MEETING]) {
                ec.entity.find("mantle.work.effort.WorkEffortParty").condition("workEffortId", id).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", id).deleteAll()
            }
        })
    },
})

feature("john.doe's Home: a counter per account and for the messages, the failed sign-in with Fix, the lists and the shortcuts", {
    when() { return { page: render({}), out: home() } },
    then({ page, out }) {
        page.status == 200
        page.errors == ""
        !page.broken
        out.failedParts.length == 0
        out.hasMailAccount
        card(out, "account_BOSS_DEMO_MAIL_ACCT").title == "John Doe"
        card(out, "account_BOSS_DEMO_MAIL_ACCT").link == "/qapps/Comms/Inbox?account=BOSS_DEMO_MAIL_ACCT"
        Number(card(out, "account_BOSS_DEMO_MAIL_ACCT").value) >= 4
        card(out, "account_BOSS_DEMO_MAIL_SUPPORT").title == "Support"
        card(out, "internal").link == "/qapps/Comms/Inbox?view=internal"
        Number(card(out, "flagged").value) >= 1
        card(out, "snoozed") != null
        card(out, "mentions") != null
        card(out, "notSent").link == "/qapps/Comms/Inbox?view=outbox"
        out.problemAccountList.map((problem) => problem.emailAccountId) == ["BOSS_DEMO_MAIL_SUPPORT"]
        out.problemAccountList[0].canManage
        out.problemAccountList[0].link.includes("fix=Y")
        out.followUpList.some((item) => item.workEffortId == FOLLOW_UP && item.kindLabel == "Email")
        out.meetingList.some((item) => item.workEffortId == MEETING && item.joinUrl == "https://meet.example.com/pricing")
        out.needsReplyList.every((row) => row.link.startsWith("/qapps/Comms/Inbox?thread="))
        page.output.includes("Support: the sign-in failed")
        page.output.includes("Email the price list to Acme")
        page.output.includes("Pricing call with Acme")
        page.output.includes("https://meet.example.com/pricing")
        page.output.includes("Office announcements")
        page.output.includes("Snoozed")
        page.output.includes("New room")
        !page.output.includes("Add your email account")
    },
})

feature("joe.developer's Home has his counts and Support without Fix, none of john.doe's mail; a user with no party still gets the page", {
    when() {
        login("joe.developer")
        const joe = { page: render({}), out: sys(() => call("ironstone.comms.CommsHomeServices.get#CommsHome", {})) }
        ec.user.internalLoginUser("commsHomeNobody")
        const nobody = { page: render({}), out: sys(() => call("ironstone.comms.CommsHomeServices.get#CommsHome", {})) }
        login("john.doe")
        return { joe, nobody }
    },
    then({ joe, nobody }) {
        joe.page.errors == ""
        !joe.page.broken
        card(joe.out, "account_BOSS_DEMO_MAIL_ACCT") == null
        card(joe.out, "account_BOSS_DEMO_MAIL_SUPPORT") != null
        joe.out.problemAccountList[0].canManage == false
        joe.page.output.includes("Its owner can fix it")
        !joe.out.followUpList.some((item) => item.workEffortId == FOLLOW_UP)
        !joe.out.meetingList.some((item) => item.workEffortId == MEETING)
        nobody.page.status == 200
        !nobody.page.broken
        nobody.out.hasMailAccount == false
        nobody.page.output.includes("Add your email account")
    },
})

// V3: the Voicemail card (the framework's voicemail) only for a user with a box, into the Calls Voicemail tab; and IronStone's
// recipient-source provider for the Dialer: the parties with their phone numbers, a private contact only for its owner
const DIALTEST = "BOSS_TEST_HOME_DIALTEST"
const DIALORG = "BOSS_TEST_HOME_DIALORG"
const DIALOTHER = "BOSS_TEST_HOME_DIALOTHER"
const userIdOf = (username) => sys(() => ec.entity.find("moqui.security.UserAccount").condition("username", username).one().userId)
feature("the Voicemail card shows for a user with a box, and the recipient-source provider finds a contact's numbers for its owner only, never another organization's", {
    when() {
        const john = userIdOf("john.doe")
        const joe = userIdOf("joe.developer")
        const before = home()
        const box = sys(() => {
            const made = ec.entity.makeValue("moqui.call.VoicemailBox")
            made.setSequencedIdPrimary()
            made.setFields({ userId: john, attachAudio: "N", attachTranscript: "N" }, true, null, null)
            made.create()
            return made.voicemailBoxId
        })
        const after = home()
        sys(() => {
            const store = (entityName, fields) => ec.service.sync().name("store#" + entityName).parameters(fields).call()
            store("mantle.party.Party", { partyId: DIALTEST, partyTypeEnumId: "PtyPerson", privateOwnerUserId: joe })
            store("mantle.party.Person", { partyId: DIALTEST, firstName: "Zed", lastName: "Dialtest" })
            store("mantle.party.contact.ContactMech", { contactMechId: DIALTEST, contactMechTypeEnumId: "CmtTelecomNumber" })
            store("mantle.party.contact.TelecomNumber", { contactMechId: DIALTEST, countryCode: "1", areaCode: "555", contactNumber: "0123456" })
            store("mantle.party.contact.PartyContactMech", { partyId: DIALTEST, contactMechId: DIALTEST, contactMechPurposeId: "PhoneMobile",
                fromDate: new Date(Date.now() - 60000) })
            // another organization's person with a number: kept out by the Comms app's organization filter
            store("mantle.party.Party", { partyId: DIALORG, partyTypeEnumId: "PtyOrganization", ownerPartyId: DIALORG })
            store("mantle.party.Organization", { partyId: DIALORG, organizationName: "Dialtest Other Org" })
            store("mantle.party.Party", { partyId: DIALOTHER, partyTypeEnumId: "PtyPerson", ownerPartyId: DIALORG })
            store("mantle.party.Person", { partyId: DIALOTHER, firstName: "Ann", lastName: "Dialtest" })
            store("mantle.party.contact.ContactMech", { contactMechId: DIALOTHER, contactMechTypeEnumId: "CmtTelecomNumber" })
            store("mantle.party.contact.TelecomNumber", { contactMechId: DIALOTHER, countryCode: "1", areaCode: "555", contactNumber: "0123499" })
            store("mantle.party.contact.PartyContactMech", { partyId: DIALOTHER, contactMechId: DIALOTHER, contactMechPurposeId: "PhoneMobile",
                fromDate: new Date(Date.now() - 60000) })
        })
        const ask = () => sys(() => call("org.moqui.ui.ShellServices.call#Providers", { hook: "recipient-source", parameters: { text: "Dialtest", kinds: "phone", limit: 10 } })) || {}
        const asJohn = ask()
        login("joe.developer")
        const asJoe = ask()
        const byNumber = sys(() => call("org.moqui.ui.ShellServices.call#Providers", { hook: "recipient-source", parameters: { text: "555 012 3456", kinds: "phone" } })) || {}
        // digits both numbers hold: the other organization's person still stays out
        const byDigits = sys(() => call("org.moqui.ui.ShellServices.call#Providers", { hook: "recipient-source", parameters: { text: "01234", kinds: "phone" } })) || {}
        const emailOnly = sys(() => call("org.moqui.ui.ShellServices.call#Providers", { hook: "recipient-source", parameters: { text: "Dialtest", kinds: "person" } })) || {}
        const dialer = sys(() => call("org.moqui.call.CallHandlingServices.search#Dialable", { text: "Dialtest" })) || {}
        login("john.doe")
        sys(() => {
            ec.entity.find("moqui.call.VoicemailBox").condition("voicemailBoxId", box).deleteAll()
            const ids = [DIALTEST, DIALOTHER]
            ec.entity.find("mantle.party.contact.PartyContactMech").condition("partyId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.contact.TelecomNumber").condition("contactMechId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.contact.ContactMech").condition("contactMechId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.Person").condition("partyId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.Party").condition("partyId", DIALOTHER).deleteAll()
            ec.entity.find("mantle.party.Organization").condition("partyId", DIALORG).deleteAll()
            ec.entity.find("mantle.party.Party").condition("partyId", "in", [DIALTEST, DIALORG]).deleteAll()
        })
        const people = (out) => (out.results || []).filter((r) => r.sourceId == "boss.parties").flatMap((r) => r.recipientList || [])
        return { before, after, john: people(asJohn), joe: people(asJoe), byNumber: people(byNumber), byDigits: people(byDigits), emailOnly: people(emailOnly), dialer, asJoe }
    },
    then({ before, after, john, joe, byNumber, byDigits, emailOnly, dialer, asJoe }) {
        card(before, "voicemail") == null
        card(after, "voicemail").value == "0"
        card(after, "voicemail").link == "/qapps/Comms/Calls/History?outcome=voicemail"
        asJoe.failedParts.length == 0
        !john.some((r) => r.itemId == "party:" + DIALTEST)
        joe.length == 1
        joe[0].itemId == "party:" + DIALTEST
        joe[0].name == "Zed Dialtest"
        joe[0].phoneList[0].number == "+15550123456"
        byNumber.some((r) => r.itemId == "party:" + DIALTEST)
        byDigits.some((r) => r.itemId == "party:" + DIALTEST)
        !byDigits.some((r) => r.itemId == "party:" + DIALOTHER)
        emailOnly.length == 0
        dialer.resultList.some((r) => r.sourceId == "boss.parties" && r.phoneList[0].number == "+15550123456")
        dialer.providersAvailable == true
    },
})

// V5: IronStone's call-context provider, the screen pop of an inbound call: the party whose number is the caller's, with a
// link to the contact and their open requests; a private contact only for its owner; another organization's party never,
// even with the very number
const CTXOWN = "BOSS_TEST_HOME_CTXOWN"
const CTXORG = "BOSS_TEST_HOME_CTXORG"
const CTXOTHER = "BOSS_TEST_HOME_CTXOTHER"
const CTXREQ = "BOSS_TEST_HOME_CTXREQ"
feature("the call-context provider pops the caller's party and open requests for whom may see them, never another organization's", {
    when() {
        const joe = userIdOf("joe.developer")
        const ids = [CTXOWN, CTXOTHER]
        sys(() => {
            const store = (entityName, fields) => ec.service.sync().name("store#" + entityName).parameters(fields).call()
            store("mantle.party.Party", { partyId: CTXOWN, partyTypeEnumId: "PtyPerson", privateOwnerUserId: joe })
            store("mantle.party.Person", { partyId: CTXOWN, firstName: "Cal", lastName: "Ctxtest" })
            store("mantle.party.Party", { partyId: CTXORG, partyTypeEnumId: "PtyOrganization", ownerPartyId: CTXORG })
            store("mantle.party.Organization", { partyId: CTXORG, organizationName: "Ctxtest Other Org" })
            store("mantle.party.Party", { partyId: CTXOTHER, partyTypeEnumId: "PtyPerson", ownerPartyId: CTXORG })
            store("mantle.party.Person", { partyId: CTXOTHER, firstName: "Ann", lastName: "Ctxtest" })
            for (const id of ids) {
                store("mantle.party.contact.ContactMech", { contactMechId: id, contactMechTypeEnumId: "CmtTelecomNumber" })
                // the same number for both: only the organization filter tells them apart; the owner's written with a dash,
                // as much of Mantle's data is
                store("mantle.party.contact.TelecomNumber", { contactMechId: id, countryCode: "1", areaCode: "555",
                    contactNumber: id == CTXOWN ? "019-8877" : "0198877" })
                store("mantle.party.contact.PartyContactMech", { partyId: id, contactMechId: id, contactMechPurposeId: "PhoneMobile",
                    fromDate: new Date(Date.now() - 60000) })
            }
            store("mantle.request.Request", { requestId: CTXREQ, requestName: "Ctxtest broken widget", statusId: "ReqSubmitted", requestDate: new Date() })
            store("mantle.request.RequestParty", { requestId: CTXREQ, partyId: CTXOWN, roleTypeId: "Customer", fromDate: new Date(Date.now() - 60000) })
        })
        const ask = (number) => sys(() => call("org.moqui.ui.ShellServices.call#Providers", { hook: "call-context", parameters: { number } })) || {}
        const boss = (out) => (out.results || []).find((r) => r.sourceId == "boss.parties") || {}
        login("john.doe")
        const asJohn = ask("+15550198877")
        login("joe.developer")
        const asJoe = ask("+15550198877")
        const otherNumber = ask("+15550198866")
        // an ordinary user of Ziziwork (BOSS_USERS' own-organization filter); john.doe is an ADMIN, whose ALWAYS row on the Comms
        // root sees every organization until one is active, as on every BOSS root, but still no one else's personal contact
        login("bob.developer")
        const asBob = ask("+15550198877")
        login("john.doe")
        sys(() => {
            ec.entity.find("mantle.request.RequestParty").condition("requestId", CTXREQ).deleteAll()
            ec.entity.find("mantle.request.Request").condition("requestId", CTXREQ).deleteAll()
            ec.entity.find("mantle.party.contact.PartyContactMech").condition("partyId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.contact.TelecomNumber").condition("contactMechId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.contact.ContactMech").condition("contactMechId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.Person").condition("partyId", "in", ids).deleteAll()
            ec.entity.find("mantle.party.Party").condition("partyId", CTXOTHER).deleteAll()
            ec.entity.find("mantle.party.Organization").condition("partyId", CTXORG).deleteAll()
            ec.entity.find("mantle.party.Party").condition("partyId", "in", [CTXOWN, CTXORG]).deleteAll()
        })
        const lists = (r) => ({ contactList: Array.from(r.contactList || []), recordList: Array.from(r.recordList || []) })
        return { john: lists(boss(asJohn)), joe: lists(boss(asJoe)), bob: lists(boss(asBob)), joeAll: asJoe, other: lists(boss(otherNumber)) }
    },
    then({ john, joe, bob, joeAll, other }) {
        !Array.from(joeAll.failedParts || []).some((f) => f.sourceId == "boss.parties")
        joe.contactList.length == 1
        joe.contactList[0].name == "Cal Ctxtest"
        joe.contactList[0].url == "/qapps/Commons/Contacts/ContactDetail?partyId=" + CTXOWN
        joe.recordList.some((r) => r.title == "Ctxtest broken widget" && String(r.url).includes(CTXREQ))
        !bob.contactList.some((c) => String(c.name).includes("Ctxtest"))
        john.contactList.some((c) => c.name == "Ann Ctxtest")
        !john.contactList.some((c) => c.name == "Cal Ctxtest")
        other.contactList.length == 0
    }
})

// C7: an end-to-end encrypted room has no text on the server, so its row in the Chat list shows "Encrypted message" in place of
// a snippet. Two rooms of joe.developer with john.doe, each with the same unread message; the one flagged encrypted on its row
// (the flag alone decides, as the server would still have this message's text) shows no text.
feature("Home's Chat list shows a room's last message, and an encrypted room's as Encrypted message", {
    when() {
        const CHAT = "org.moqui.chat.ChatServices"
        const john = userIdOf("john.doe")
        login("joe.developer")
        const rooms = {}
        try {
            for (const name of ["plain", "encrypted"]) {
                // as joe.developer, authorization disabled: the chat services check the rooms themselves
                rooms[name] = sys(() => call(`${CHAT}.create#Room`, { roomTypeEnumId: "CrtPrivate", roomName: `Home ${name} room`,
                    memberUserIdList: [john] })).chatRoomId
                sys(() => call(`${CHAT}.send#Message`, { chatRoomId: rooms[name], body: "<p>Ship it Friday</p>" }))
            }
        } finally { login("john.doe") }
        sys(() => call("update#moqui.chat.ChatRoom", { chatRoomId: rooms.encrypted, encrypted: "Y" }))
        const out = home()
        const row = (chatRoomId) => (out.roomList || []).find((room) => room.chatRoomId == chatRoomId) || {}
        const result = { failedParts: out.failedParts, plain: row(rooms.plain).snippet, encrypted: row(rooms.encrypted).snippet }
        sys(() => {
            for (const entityName of ["moqui.chat.ChatEventMention", "moqui.chat.ChatEvent", "moqui.chat.ChatRoomMember", "moqui.chat.ChatRoom"])
                ec.entity.find(entityName).condition("chatRoomId", "in", Object.values(rooms)).deleteAll()
        })
        return result
    },
    then({ failedParts, plain, encrypted }) {
        failedParts.length == 0
        plain == "Joe Developer: Ship it Friday"
        encrypted == "Joe Developer: Encrypted message"
    }
})
