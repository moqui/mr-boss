// Sales' lead intake in BOSS (impl-sales P5; design-sales §1.4 Comms hooks, §3 Leads, §9 LeadSources): Create lead on a mail
// message, offered in Mail's message-actions slot (the ext items of Comms/Inbox/Mail) and posted through Mail's createRecord and
// Comms' create-from provider, makes a lead of sales.rep's with the message as its source (filed on it) and answers the same lead
// again; another app's user is refused, and is not offered Log call on opportunity, which a rep's voicemail and call offer; Create lead on a chat message (Chat's createFrom, kind lead) does the same; the record-lookup and contact-card providers answer the lead to its rep; LeadSources' one
// qvt render shows the UTM map and the teams' intake addresses. The rules are Mantle's SalesLeadIntake; the demo inquiry is
// data/BossZSalesDemoData.xml's P5 block.
// Run: ./moq test mr-boss --spec SalesIntake
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, page} = lib
const comms = "component://mr-boss/screen/Comms.xml"
const OPPORTUNITY = "mantle.sales.opportunity.SalesOpportunity"
const MESSAGE = "BOSS_SAL_SPEC_INQUIRY"

function post(path, parameters) {
    const result = ec.screen
        .makeTest()
        .rootScreen(comms)
        .render(path, parameters || {}, "post")
    let json = null
    try {
        json = JSON.parse(String(result.output || ""))
    } catch (error) {
        json = null
    }
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors, json: json || {}}
}
function extActions(path) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("extItems/apps/" + path, {}, null)
    ec.message.clearErrors()
    try {
        return Array.from(JSON.parse(String(result.output || "{}")).actions || [])
    } catch (error) {
        return []
    }
}
// The providers of a hook as the user (call#Providers checks the user's apps whatever the caller's authorization)
function providers(hook, parameters) {
    return system(
        () =>
            ec.service.sync().name("org.moqui.ui.ShellServices.call#Providers").parameters({hook, parameters}).call()?.results ||
            []
    )
}

spec({
    setupSpec() {
        login("john.doe")
        system(() =>
            call("store#moqui.basic.email.EmailMessage", {
                emailMessageId: MESSAGE,
                emailAccountId: "BOSS_SAL_INTAKE_MAIL",
                statusId: "ES_RECEIVED",
                contentType: "text/plain",
                receivedDate: ec.user.nowTimestamp,
                messageDate: ec.user.nowTimestamp,
                isRead: "N",
                hasAttachment: "N",
                fromAddress: "quinn@fabricam-prospect.example",
                fromName: "Quinn Rivera",
                toAddresses: "sales@retail.example",
                subject: "Fwd: Counters for a pop-up store",
                bodyText: "We open a pop-up store in March and need two counters.",
                messageId: "<spec-popup@fabricam-prospect.example>",
                rootEmailMessageId: MESSAGE
            })
        )
    }
})

feature(
    "Create lead on a mail message makes the rep's lead with the message as its source, once; another app's user is refused",
    {
        when() {
            const offered = asUser(users.rep, () => extActions("Comms/Inbox/Mail"))
            // a Sales user who cannot read the intake mailbox (sales.rep3, Ziziwork Sales) files nothing, refused as for a message
            // that is not there (P5 review)
            const unread = asUser(users.otherRep, () => post("Inbox/Mail/createRecord", {kind: "lead", emailMessageId: MESSAGE}))
            const missing = asUser(users.otherRep, () =>
                post("Inbox/Mail/createRecord", {kind: "lead", emailMessageId: "BOSS_SAL_SPEC_NONE"})
            )
            const unreadIntakes = system(() =>
                ec.entity
                    .find("mantle.sales.opportunity.SalesLeadIntake")
                    .condition("organizationPartyId", ids.otherOrganizationId)
                    .condition("receivedByUserId", "in", ["BOSS_SAL_REP3"])
                    .count()
            )
            const made = asUser(users.rep, () => post("Inbox/Mail/createRecord", {kind: "lead", emailMessageId: MESSAGE}))
            const again = asUser(users.rep, () => post("Inbox/Mail/createRecord", {kind: "lead", emailMessageId: MESSAGE}))
            const refused = asUser(users.otherApp, () => post("Inbox/Mail/createRecord", {kind: "lead", emailMessageId: MESSAGE}))
            const leadId = made.json.recordId
            const lead = system(() =>
                ec.entity
                    .find(OPPORTUNITY)
                    .condition("salesOpportunityId", leadId || "-")
                    .one()
            )
            const owner = system(() =>
                Array.from(
                    ec.entity
                        .find("mantle.sales.opportunity.SalesOpportunityParty")
                        .condition({salesOpportunityId: leadId || "-", roleTypeId: "SalesRepresentative"})
                        .list()
                ).map(row => row.partyId)
            )
            const filed = system(() =>
                ec.entity
                    .find("mantle.party.communication.CommunicationEventRecord")
                    .condition({recordEntityName: OPPORTUNITY, recordId: leadId || "-"})
                    .count()
            )
            const intake = system(() =>
                ec.entity
                    .find("mantle.sales.opportunity.SalesLeadIntake")
                    .condition("salesOpportunityId", leadId || "-")
                    .one()
            )
            // the providers as the rep: the lead's card, and the inquirer (no party) as the lead
            const card = asUser(users.rep, () =>
                providers("record-lookup", {operation: "card", recordEntityName: OPPORTUNITY, recordId: leadId})
                    .map(result => result.card)
                    .find(found => found && found.id === leadId)
            )
            const contact = asUser(users.rep, () =>
                providers("contact-card", {address: "quinn@fabricam-prospect.example"})
                    .map(result => result.card)
                    .find(found => found && found.url)
            )
            // Log call on opportunity: in a voicemail's and a call's actions for a Sales user only (BOSS_SAL_LOG_CALL)
            const repVoicemail = asUser(users.rep, () => extActions("Comms/Calls/Voicemail")).map(action => action.name)
            const repCall = asUser(users.rep, () => extActions("Comms/Calls/Call")).map(action => action.name)
            const otherVoicemail = asUser(users.otherApp, () => extActions("Comms/Calls/Voicemail")).map(action => action.name)
            return {
                offered,
                unread,
                missing,
                unreadIntakes,
                made,
                again,
                refused,
                leadId,
                lead,
                owner,
                filed,
                intake,
                card,
                contact,
                repVoicemail,
                repCall,
                otherVoicemail
            }
        },
        then(r) {
            r.offered.some(action => action.name === "sales.createLead" && action.slot === "message-actions")
            r.unread.errors != ""
            r.unread.json.recordId == null
            r.unread.errors.replace(MESSAGE, "-") == r.missing.errors.replace("BOSS_SAL_SPEC_NONE", "-")
            r.unreadIntakes == 0
            r.made.errors == ""
            r.leadId != null
            r.made.json.url.includes("OpportunityDetail?salesOpportunityId=" + r.leadId)
            r.lead.typeEnumId == "SotLead"
            r.lead.organizationPartyId == ids.organizationId
            r.lead.opportunityName == "Counters for a pop-up store"
            r.owner.includes("BOSS_SAL_REP")
            r.filed == 1
            r.intake.sourceKindEnumId == "SlisEmailMessage"
            r.intake.submittedEmail == "quinn@fabricam-prospect.example"
            r.again.errors == ""
            r.again.json.recordId == r.leadId
            r.refused.errors != ""
            r.refused.json.recordId == null
            r.card.title == "Counters for a pop-up store"
            r.contact.url.includes(r.leadId)
            r.contact.name == "Quinn Rivera"
            r.repVoicemail.includes("sales.logCall")
            r.repVoicemail.includes("sales.createLead")
            r.repCall.includes("sales.logCall")
            !r.otherVoicemail.includes("sales.logCall")
        }
    }
)

feature("LeadSources renders once in qvt with the UTM map and the teams' intake addresses", {
    when() {
        return {sources: asUser(users.admin, () => page("Settings/LeadSources", {organizationPartyId: ids.organizationId}))}
    },
    then({sources}) {
        sources.errors.length == 0
        sources.output.includes("Tracked links")
        sources.output.includes("newsletter")
        sources.output.includes("Mail intake")
        sources.output.includes("sales+leads@")
    }
})

feature(
    "Create lead on a chat message makes the rep's lead from it, the message filed on it; one not in the room files nothing",
    {
        when() {
            const {room, sent} = asUser(users.rep, () => {
                const room = post("Chat/createRoom", {roomTypeEnumId: "private", roomName: "Sales intake spec"})
                const sent = post("Chat/send", {
                    chatRoomId: room.json.chatRoomId,
                    body: "<p>Walk-in asked about racking for two stores</p>",
                    clientRef: "sal-intake-1"
                })
                return {room, sent}
            })
            const chatRoomId = room.json.chatRoomId
            // sales.rep2, a Sales user not in the room (P5 review)
            const outsider = asUser(users.rep2, () =>
                post("Chat/createFrom", {chatRoomId, eventSeq: sent.json.eventSeq, kind: "lead"})
            )
            const outsiderIntakes = system(() =>
                ec.entity
                    .find("mantle.sales.opportunity.SalesLeadIntake")
                    .condition({sourceKindEnumId: "SlisChatMessage", sourceId: chatRoomId + ":" + sent.json.eventSeq})
                    .count()
            )
            const made = asUser(users.rep, () =>
                post("Chat/createFrom", {chatRoomId, eventSeq: sent.json.eventSeq, kind: "lead"})
            )
            const leadId = made.json.recordId
            const lead = system(() =>
                ec.entity
                    .find(OPPORTUNITY)
                    .condition("salesOpportunityId", leadId || "-")
                    .one()
            )
            const filed = system(() =>
                ec.entity
                    .find("mantle.party.communication.CommunicationEventRecord")
                    .condition({recordEntityName: OPPORTUNITY, recordId: leadId || "-"})
                    .count()
            )
            return {room, outsider, outsiderIntakes, made, leadId, lead, filed}
        },
        then(r) {
            r.room.errors == ""
            r.outsider.errors != ""
            r.outsider.json.recordId == null
            r.outsiderIntakes == 0
            r.made.errors == ""
            r.leadId != null
            r.lead.opportunityName == "Walk-in asked about racking for two stores"
            r.filed == 1
        }
    }
)
