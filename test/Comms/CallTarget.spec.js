// IronStone's call-target provider (screen/Comms.xml, service/ironstone/comms/ComposeServices.xml get#CallTarget;
// plans/archive/Comms-Framework.md §3.3, the hardening pass): a BOSS user calls, transfers a call to and adds to a call only the users
// whose party they may see, under the rules of the recipient-source provider (the Comms app's organization filter, not
// disabled, not another user's private contact). joe.developer reaches a user of a shared party and a user with no party (in
// no organization), and is refused, with the very same calls, a user of another organization's party: the framework's start#Call answers
// noCallee, transfer#Call and add#CallParticipant notFound, as for a user that does not exist. No media flows: a
// CallMediaNode row stands in for a media node.
// Run: ./moq test mr-boss --spec CallTarget
const NODE = "boss-call-target-spec"
const ORG = "BOSS_TEST_CT_ORG"
const SAME = "BOSS_TEST_CT_SAME"
const OTHER = "BOSS_TEST_CT_OTHER"
const NOPARTY = "BOSS_TEST_CT_NOPARTY"
const REQUEST = "BOSS_TEST_CT_REQUEST"
const CALLS = "org.moqui.call.CallServices."
const TRANSFERS = "org.moqui.call.CallTransferServices."

function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
// as the Calls screens' transitions call them: the services check the signed-in user's part in the call themselves
function as(username, name, parameters) {
    ec.user.internalLoginUser(username)
    let out = {}
    let thrown = ""
    try {
        out = sys(() => ec.service.sync().name(name).parameters(parameters || {}).call()) || {}
    } catch (err) {
        thrown = String(err.message || err)
    }
    const errors = thrown + (ec.message.hasError() ? ec.message.errorsString : "")
    ec.message.clearErrors()
    return Object.assign({ errors }, out)
}
const userIdOf = (username) => sys(() => ec.entity.find("moqui.security.UserAccount").condition("username", username).one().userId)
function makeUser(userId, partyId) {
    sys(() => {
        if (ec.entity.find("moqui.security.UserAccount").condition("userId", userId).count() == 0) {
            const account = ec.entity.makeValue("moqui.security.UserAccount")
            account.setFields({ userId, username: userId.toLowerCase(), userFullName: "Call target " + userId.slice(15), partyId: partyId || null,
                disabled: "N" }, true, null, null)
            account.create()
        }
        // Comms is opened by BOSS_USERS, not ALL_USERS
        if (ec.entity.find("moqui.security.UserGroupMember").condition("userGroupId", "BOSS_USERS").condition("userId", userId).count() == 0) {
            const member = ec.entity.makeValue("moqui.security.UserGroupMember")
            member.setFields({ userGroupId: "BOSS_USERS", userId: userId, fromDate: ec.user.nowTimestamp }, true, null, null)
            member.create()
        }
    })
}
function endCalls() {
    sys(() => {
        for (const s of ec.entity.find("moqui.call.CallSession").condition("mediaNodeId", NODE).condition("statusId", "!=", "CssEnded").list()) {
            s.set("statusId", "CssEnded")
            s.update()
        }
    })
}

spec({
    stepwise: true,
    setupSpec() {
        sys(() => {
            const store = (entityName, fields) => ec.service.sync().name("store#" + entityName).parameters(fields).call()
            // a person every organization shares (_NA_), and one of another organization
            store("mantle.party.Party", { partyId: SAME, partyTypeEnumId: "PtyPerson", ownerPartyId: "_NA_" })
            store("mantle.party.Person", { partyId: SAME, firstName: "Sam", lastName: "Calltarget" })
            store("mantle.party.Party", { partyId: ORG, partyTypeEnumId: "PtyOrganization", ownerPartyId: ORG })
            store("mantle.party.Organization", { partyId: ORG, organizationName: "Calltarget Other Org" })
            store("mantle.party.Party", { partyId: OTHER, partyTypeEnumId: "PtyPerson", ownerPartyId: ORG })
            store("mantle.party.Person", { partyId: OTHER, firstName: "Otto", lastName: "Calltarget" })
            call(CALLS + "register#MediaNode", { instanceId: NODE, mediaAddress: "127.0.0.1:10000" })
        })
        makeUser(SAME, SAME)
        makeUser(OTHER, OTHER)
        makeUser(NOPARTY, null)
    },
    cleanupSpec() {
        endCalls()
        sys(() => {
            ec.entity.find("moqui.call.CallMediaNode").condition("instanceId", NODE).deleteAll()
            ec.entity.find("moqui.security.UserGroupMember").condition("userId", "in", [SAME, OTHER, NOPARTY]).deleteAll()
            // the Forum's tracking mode a group membership makes (mantle.forum.TrackingServices.refresh#Mode)
            ec.entity.find("mantle.forum.ForumTrackingMode").condition("partyId", "in", [SAME, OTHER]).deleteAll()
            ec.entity.find("moqui.security.UserAccount").condition("userId", "in", [SAME, OTHER, NOPARTY]).deleteAll()
            ec.entity.find("mantle.party.Person").condition("partyId", "in", [SAME, OTHER]).deleteAll()
            ec.entity.find("mantle.party.Organization").condition("partyId", ORG).deleteAll()
            ec.entity.find("mantle.party.Party").condition("partyId", "in", [SAME, OTHER]).deleteAll()
            ec.entity.find("mantle.party.Party").condition("partyId", ORG).deleteAll()
        })
    },
})

feature("the provider answers which users joe.developer may not reach: another organization's, not one with no party", {
    when() {
        ec.user.internalLoginUser("joe.developer")
        const out = sys(() => call("org.moqui.ui.ShellServices.call#Providers", { hook: "call-target",
            parameters: { userIdList: [SAME, OTHER, NOPARTY, userIdOf("john.doe")] } })) || {}
        return { out, mine: (out.results || []).filter((r) => r.sourceId == "boss.parties") }
    },
    then({ out, mine }) {
        out.unavailable == false
        out.failedParts.length == 0
        mine.length == 1
        mine[0].refusedUserIdList.join() == OTHER
    },
})

let callId = null
feature("a call to another organization's user is refused with the same call that reaches a user of a shared party", {
    when() {
        const refused = as("joe.developer", CALLS + "start#Call", { calleeUserIdList: [OTHER] })
        const noParty = as("joe.developer", CALLS + "start#Call", { calleeUserIdList: [NOPARTY] })
        const started = as("joe.developer", CALLS + "start#Call", { calleeUserIdList: [SAME] })
        callId = started.callSessionId
        const answered = as(SAME.toLowerCase(), CALLS + "answer#Call", { callSessionId: callId })
        return { refused, noParty, started, answered }
    },
    then({ refused, noParty, started, answered }) {
        refused.reasonCode == "noCallee"
        refused.callSessionId == null
        noParty.errors == ""
        started.errors == ""
        started.callSessionId != null
        answered.errors == ""
    },
})

feature("adding to a call another organization's user is refused as a user that does not exist; john.doe is added with the same call", {
    when() {
        const addOther = as("joe.developer", TRANSFERS + "add#CallParticipant", { callSessionId: callId, userId: OTHER })
        const addNobody = as("joe.developer", TRANSFERS + "add#CallParticipant", { callSessionId: callId, userId: "BOSS_TEST_CT_NO_SUCH_USER" })
        const addJohn = as("joe.developer", TRANSFERS + "add#CallParticipant", { callSessionId: callId, userId: userIdOf("john.doe") })
        endCalls()
        return { addOther, addNobody, addJohn }
    },
    then({ addOther, addNobody, addJohn }) {
        addOther.reasonCode == "notFound"
        addOther.errors == addNobody.errors
        addJohn.errors == ""
    },
})

// a phone call to joe's number, answered by joe: its outside party is what a transfer moves
const NUMBER = "+15550177301"
const TRUNK = "BOSS_TEST_CT_TRUNK"
feature("a phone call is not transferred to another organization's user; the same transfer to a user of a shared party goes", {
    when() {
        const joe = userIdOf("joe.developer")
        sys(() => {
            call("org.moqui.call.VoiceServices.register#SipNode", { instanceId: NODE, sipAddress: "127.0.0.1:5060" })
            ec.entity.find("moqui.call.PhoneNumber").condition("phoneNumber", NUMBER).deleteAll()
            ec.entity.find("moqui.call.VoiceTrunk").condition("voiceTrunkId", TRUNK).deleteAll()
            const trunk = ec.entity.makeValue("moqui.call.VoiceTrunk")
            trunk.setFields({ voiceTrunkId: TRUNK, name: "Call target trunk", host: "sip.example.invalid", transportEnumId: "VtrTls",
                mediaEncryptionEnumId: "VmeSrtp", providerProfileEnumId: "VppGeneric", statusId: "VtsOk", disabled: "N" }, true, null, null)
            trunk.create()
            const number = ec.entity.makeValue("moqui.call.PhoneNumber")
            number.setFields({ phoneNumber: NUMBER, voiceTrunkId: TRUNK, routeTypeEnumId: "PnrUser", routeId: joe }, true, null, null)
            number.create()
        })
        const ring = sys(() => call("org.moqui.call.VoiceServices.receive#PhoneCall", { toNumber: NUMBER, fromNumber: "+15550177399", instanceId: NODE })) || {}
        const answered = as("joe.developer", CALLS + "answer#Call", { callSessionId: ring.callSessionId })
        const revision = () => Number(sys(() => ec.entity.find("moqui.call.CallSession").condition("callSessionId", ring.callSessionId).one()).revision)
        const other = as("joe.developer", TRANSFERS + "transfer#Call", { callSessionId: ring.callSessionId, targetType: "user", targetId: OTHER,
            mode: "blind", revision: revision() })
        const same = as("joe.developer", TRANSFERS + "transfer#Call", { callSessionId: ring.callSessionId, targetType: "user", targetId: SAME,
            mode: "blind", revision: revision() })
        endCalls()
        sys(() => {
            ec.entity.find("moqui.call.PhoneNumber").condition("phoneNumber", NUMBER).deleteAll()
            ec.entity.find("moqui.call.VoiceTrunk").condition("voiceTrunkId", TRUNK).deleteAll()
            ec.entity.find("moqui.call.SipNode").condition("instanceId", NODE).deleteAll()
        })
        return { ring, answered, other, same }
    },
    then({ ring, answered, other, same }) {
        ring.callSessionId != null
        answered.errors == ""
        other.reasonCode == "notFound"
        same.errors == ""
        same.callTransferId != null
    },
})

// the chat-target hook (DC-UI-043): the Comms Chat screen's transitions as a browser calls them, with authorization on. The
// people search leaves out another organization's user, a direct message to them is refused, and adding them to one's own
// private room is refused the same way; a user of a shared party is found, messaged and added with the very same calls.
feature("chat reaches only the users joe.developer may see: search, a direct message and adding to a private room", {
    when() {
        const comms = "component://mr-boss/screen/Comms.xml"
        const chat = (name, parameters, method) => {
            const str = ec.screen
                .makeTest()
                .rootScreen(comms)
                .render(`Chat/${name}`, parameters || {}, method || null)
            let json = null
            try {
                json = JSON.parse(str.output)
            } catch (err) {
                json = null
            }
            const errors = [str.errorMessages.join(" | "), json && !Array.isArray(json) && json.errors ? String(json.errors) : ""]
                .filter(text => text)
                .join(" | ")
            ec.message.clearErrors()
            return {errors, json: json || {}}
        }
        ec.user.internalLoginUser("joe.developer")
        const found = term => {
            const rows = chat("searchUsers", {term}).json
            return Array.isArray(rows) ? rows.map(row => row.value) : []
        }
        const searchOther = found("Otto")
        const searchSame = found("Sam")
        const directOther = chat("createDirect", {userIds: OTHER}, "post")
        const directSame = chat("createDirect", {userIds: SAME}, "post")
        const room = chat("createRoom", {roomTypeEnumId: "private", roomName: "Chat target spec room"}, "post")
        const roomId = room.json.chatRoomId
        const addOther = chat("addMembers", {chatRoomId: roomId, userIds: OTHER}, "post")
        const addSame = chat("addMembers", {chatRoomId: roomId, userIds: SAME}, "post")
        const members = sys(() =>
            Array.from(ec.entity.find("moqui.chat.ChatRoomMember").condition("chatRoomId", roomId).list())
                .filter(row => !row.leftDate)
                .map(row => row.userId)
        )
        return {searchOther, searchSame, directOther, directSame, roomId, addOther, addSame, members}
    },
    then(v) {
        !v.searchOther.includes(OTHER)
        v.searchSame.includes(SAME)
        v.directOther.errors.includes("not found")
        v.directSame.errors == ""
        v.roomId != null
        v.addOther.errors.includes("not found")
        v.addSame.errors == ""
        !v.members.includes(OTHER)
        v.members.includes(SAME)
    }
})

// IronStone's own people search and mention ids (service/ironstone/shared/ChatterServices.xml search#Users, get#UserIdsParties)
// follow the same chat-target rule (SEC-COM-01, found during the fixes): joe.developer finds the user of a shared party and not
// another organization's, and a mention of the latter in a note notifies no one, as a forged id of a user that does not exist
feature("the Chatter people search and a note's mentions leave out a user joe.developer may not reach", {
    when() {
        const commons = "component://mr-boss/screen/Commons.xml"
        const screen = (name, parameters, method) => {
            const out = ec.screen.makeTest().rootScreen(commons).render("Chatter/" + name, parameters, method || null)
            ec.message.clearErrors()
            let json = null
            try { json = JSON.parse(out.output) } catch (err) { json = null }
            return { status: out.status, errors: out.errorMessages.join(" | "), json: json || {} }
        }
        const mentions = (userId) => sys(() => ec.entity.find("moqui.security.user.NotificationMessageByUser")
            .condition("userId", userId).condition("topic", "ChatterMention").count())
        // a request joe.developer reports, so he may write on it
        sys(() => {
            if (ec.entity.find("mantle.request.Request").condition("requestId", REQUEST).count() == 0) {
                call("create#mantle.request.Request", { requestId: REQUEST, requestTypeEnumId: "RqtSupport", statusId: "ReqSubmitted",
                    requestName: "Call target mentions", filedByPartyId: "ORG_ZIZI_JD", requestDate: ec.user.nowTimestamp })
                call("create#mantle.request.RequestParty", { requestId: REQUEST, partyId: "ORG_ZIZI_JD", roleTypeId: "Reporter",
                    fromDate: ec.user.nowTimestamp })
            }
        })
        ec.user.internalLoginUser("joe.developer")
        try {
            const found = screen("searchUsers", { term: "Call target", limit: 50 })
            const before = { same: mentions(SAME), other: mentions(OTHER) }
            const body = '<p><span data-mention-id="' + SAME + '">@Sam</span> and <span data-mention-id="' + OTHER + '">@Otto</span></p>'
            const logged = screen("logNote", { recordEntity: "mantle.request.Request", recordId: REQUEST, body, recordUrl: "/qapps/Commons/Requests/RequestDetail?requestId=" + REQUEST }, "post")
            return { found, logged, same: mentions(SAME) - before.same, other: mentions(OTHER) - before.other }
        } finally {
            ec.user.internalLoginUser("john.doe")
        }
    },
    then({ found, logged, same, other }) {
        found.status == 200
        Array.isArray(found.json)
        found.json.some((user) => user.id == SAME) && !found.json.some((user) => user.id == OTHER)
        logged.status == 200 && logged.errors == ""
        same == 1
        other == 0
    },
})
