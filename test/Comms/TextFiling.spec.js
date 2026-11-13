// The external-conversation hook (mr-moqui plans/archive/Comms-Framework.md §3.3) through IronStone's provider: the first
// text of a new outside number (SmsServices receive#Sms, as the provider's webhook hands it over) is filed on the one party
// the number's user may see with that number (ChatServices.file#ExternalConversation: File on a record, so the party's
// Chatter shows it), and the mapping is marked filed so the next text is not filed again; a number no party has files
// nothing, and its next text tries again. The webhook and the provider themselves are moqui-channels' tests.
// Run: ./moq test mr-boss --spec TextFiling
const BRIDGE = "BOSS_TEXT_FILING_SMS"
const OURS = "+15550004100"
const MARY = "+15550100161"
const UNKNOWN = "+15550104199"
const RECORD = "mantle.party.communication.CommunicationEventRecord"

function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return run()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
let seq = 0
function text(theirs, body) {
    seq += 1
    ec.user.logoutUser()
    // as the bridge's webhook marks its context once its adapter checked the provider's signature (chat_bridge_web.rs marked)
    ec.context.sharedMap._chatBridgeWebhook = BRIDGE
    const out = sys(() => ec.service.sync().name("org.moqui.call.SmsServices.receive#Sms").parameters({chatBridgeId: BRIDGE, ourNumber: OURS,
        theirNumber: theirs, text: body, messageId: "boss-text-filing-" + seq, eventId: "boss-text-filing-event-" + seq}).call()) || {}
    ec.message.clearErrors()
    delete ec.context.sharedMap._chatBridgeWebhook
    return out
}
const mapping = (theirs) => sys(() => Array.from(ec.entity.find("moqui.chat.ChatRoomBridge").condition("chatBridgeId", BRIDGE)
    .condition("externalRoomId", OURS + "/" + theirs).condition("thruDate", null).list())[0] || null)
// the room's messages filed on the party: their communication events (named by a CommunicationEventRecord of the chat event)
// with the party on them (link#CommunicationEventRecord files on a party by its CommunicationEventParty row)
const filedOn = (partyId, chatRoomId) => sys(() => Array.from(ec.entity.find(RECORD).condition("recordEntityName", "moqui.chat.ChatEvent")
    .condition("recordId", "like", chatRoomId + "::%").list()).filter((chat) => ec.entity.find("mantle.party.communication.CommunicationEventParty")
        .condition({communicationEventId: chat.communicationEventId, partyId}).count() > 0))

spec({
    stepwise: true,
    setupSpec() {
        sys(() => {
            const bridge = ec.entity.makeValue("moqui.chat.ChatBridge")
            bridge.setFields({chatBridgeId: BRIDGE, typeEnumId: "CbtSms", adapterName: "spec-missing", name: "Text filing spec"}, true, null, null)
            bridge.createOrUpdate()
            const number = ec.entity.makeValue("moqui.call.PhoneNumber")
            number.setFields({phoneNumber: OURS, messagingBridgeId: BRIDGE, routeTypeEnumId: "PnrUser", routeId: "EX_JOHN_DOE"}, true, null, null)
            number.createOrUpdate()
        })
    },
    cleanupSpec() {
        sys(() => {
            for (const row of ec.entity.find("moqui.chat.ChatRoomBridge").condition("chatBridgeId", BRIDGE).list()) {
                ec.entity.find("moqui.chat.ChatRoomMember").condition("chatRoomId", row.chatRoomId).deleteAll()
                ec.entity.find("moqui.chat.ChatBridgeDelivery").condition("chatRoomId", row.chatRoomId).deleteAll()
                row.delete()
            }
            ec.entity.find("moqui.call.PhoneNumber").condition("phoneNumber", OURS).deleteAll()
        })
        login("john.doe")
    }
})

feature("a new outside number's first text is filed on the party with that number, once; a number nobody has files nothing and tries again", {
    when() {
        const first = text(MARY, "Is the gutter job still on for Monday?")
        const filed = mapping(MARY)
        const second = text(MARY, "Also, bring the ladder")
        const stranger = text(UNKNOWN, "Who is this?")
        const strangerMapping = mapping(UNKNOWN)
        login("john.doe")
        return {first, filed, second, stranger, strangerMapping, onMary: filed ? filedOn("BOSS_DEMO_PC_MARY", filed.chatRoomId) : []}
    },
    then({first, filed, second, stranger, strangerMapping, onMary}) {
        first.outcome == "accepted"
        filed.filedDate != null
        second.outcome == "accepted"
        onMary.length == 1
        stranger.outcome == "accepted"
        strangerMapping.filedDate == null
    }
})
