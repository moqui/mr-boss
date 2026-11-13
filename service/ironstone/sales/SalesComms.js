// Sales' Comms hooks (design-sales §1.4 Comms hooks, §3 Leads; impl-sales P5, F64): what the Sales root answers Comms with and the
// actions it adds to Comms' screens, each as the user, under the user's own Sales scope (Mantle's SalesAccess.js) and refusing a
// user without Sales:
// - leadFromMessage: "Create lead" on a mail message (Mail's message-actions slot), an internal message, a chat message (Chat's
//   chat-message-actions, through Comms' create-from provider) or a voicemail (Calls/Voicemail's transition): the message read as
//   the user may read it, Mantle's store#LeadIntake as the user (their organization, themselves the owner), the message filed on
//   the lead as its source; the same message again answers the same lead.
// - lookup: the record-lookup provider for leads and opportunities (info, card, search, links), so a message's deal card and
//   "File on a record" find the deals the user sees.
// - callContext: the caller's open deals the user sees, for the ring bar and the call.
// - contactCard: an inquirer who is no party yet, by the email of an open lead's intake the user sees, as the lead's card.
// - logCall: "Log call on opportunity" from a call or a voicemail, Mantle's log#OpportunityCall.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const salesAccess = ec.resource.script("component://mr-mantle/service/mantle/sales/SalesAccess.js")
const intake = ec.resource.script("component://mr-mantle/service/mantle/sales/SalesIntake.js")
const {find, one, rows, denied} = lib

const OPPORTUNITY = "mantle.sales.opportunity.SalesOpportunity"
const INTAKE = "mantle.sales.opportunity.SalesLeadIntake"
const detailPath = "/qapps/Sales/Pipeline/OpportunityDetail?salesOpportunityId="
const callRecordLimit = 20
const blank = value => value == null || String(value).trim() === ""
const text = value => (blank(value) ? null : String(value).trim())
const L = value => ec.l10n.localize(value)
const urlOf = salesOpportunityId => detailPath + encodeURIComponent(salesOpportunityId)

// A call of a service as the user (authorization on, as the caller has it): its result, or its errors thrown as one refusal.
function asUser(name, parameters) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) {
        const errors = ec.message.getErrorsString()
        ec.message.clearErrors()
        throw new Error(errors)
    }
    return out
}
// The same, read only and in an error frame of its own: null when it refuses.
function readAsUser(name, parameters) {
    ec.message.pushErrors()
    try {
        const out = ec.service.sync().name(name).parameters(parameters).call() || {}
        return ec.message.hasError() ? null : out
    } catch (error) {
        return null
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function salesScope() {
    const userScope = salesAccess.scope()
    if (!ec.user.userId || !userScope.capabilities.anyRead) denied("SALES_UNAVAILABLE", "Sales is not available")
    return userScope
}
const firstLine = value =>
    String(value || "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(Boolean) || ""

// ===== Create lead from a message =====
function messageSource(p) {
    if (!blank(p.emailMessageId)) {
        const emailMessageId = text(p.emailMessageId)
        // the message as the user may read it (another's is "not found")
        if (!readAsUser("org.moqui.mail.EmailClientServices.get#Thread", {emailMessageId}))
            denied("RECORD_UNAVAILABLE", "Message " + emailMessageId + " is not available")
        const message = one("moqui.basic.email.EmailMessage", {emailMessageId})
        const event = asUser("mantle.party.CommunicationServices.findOrCreate#EmailCommunicationEvent", {emailMessageId})
        return {
            sourceKind: "emailMessage",
            sourceId: intake.emailIdentity(message),
            submittedName: message.fromName || null,
            submittedEmail: message.fromAddress || null,
            opportunityName:
                String(message.subject || "")
                    .replace(/^((re|fwd?|aw|wg)\s*:\s*)+/i, "")
                    .trim() || null,
            description: String(message.bodyText || message.snippet || "").substring(0, 20000) || null,
            communicationEventId: event.communicationEventId || null
        }
    }
    if (!blank(p.communicationEventId)) {
        const communicationEventId = text(p.communicationEventId)
        const thread = readAsUser("mantle.party.CommunicationServices.get#InternalThread", {communicationEventId})
        const message = Array.from(thread?.messageList || []).find(item => item.communicationEventId === communicationEventId)
        if (!message) denied("RECORD_UNAVAILABLE", "Message " + communicationEventId + " is not available")
        const sender = (Array.from(thread.participantList || []).find(item => item.partyId === message.fromPartyId) || {}).name
        return {
            sourceKind: "communicationEvent",
            sourceId: communicationEventId,
            submittedName: sender || null,
            opportunityName: String(message.subject || thread.subject || "").trim() || null,
            description:
                String(message.body || "")
                    .replace(/<[^>]*>/g, " ")
                    .trim()
                    .substring(0, 20000) || null,
            communicationEventId
        }
    }
    if (!blank(p.chatRoomId)) {
        const found = asUser("mantle.party.CommunicationServices.findOrCreate#ChatCommunicationEvent", {
            chatRoomId: p.chatRoomId,
            eventSeq: p.eventSeq
        })
        const chat = found.chatMessage || {}
        const body = String(chat.bodyText || "").trim()
        return {
            sourceKind: "chatMessage",
            sourceId: p.chatRoomId + ":" + p.eventSeq,
            submittedName: chat.senderName || null,
            opportunityName: firstLine(body).substring(0, 100) || null,
            description: body.substring(0, 20000) || null,
            communicationEventId: found.communicationEventId
        }
    }
    if (!blank(p.voicemailId)) {
        const voicemail = readAsUser("org.moqui.call.VoicemailServices.get#Voicemail", {voicemailId: p.voicemailId})?.voicemail
        if (!voicemail) denied("RECORD_UNAVAILABLE", "Voicemail " + p.voicemailId + " is not available")
        // its transcript, never its audio (a recording plays only through Comms)
        return {
            sourceKind: "voicemail",
            sourceId: String(p.voicemailId),
            submittedName: voicemail.fromName || null,
            submittedPhone: voicemail.fromNumber || null,
            opportunityName: (L("Voicemail") + " " + (voicemail.fromName || voicemail.fromNumber || "")).trim(),
            description: voicemail.transcriptText || null,
            communicationEventId: null
        }
    }
    denied("RECORD_UNAVAILABLE", "Which message?")
}
function leadFromMessage(p) {
    const userScope = salesScope()
    salesAccess.requireCapability(userScope, "opportunityEdit")
    const organizationPartyId = text(p.organizationPartyId) || salesAccess.defaultOrganization(userScope)
    if (!organizationPartyId)
        denied("ORGANIZATION_DENIED", "You sell for more than one organization: make the lead with New lead in Sales' Leads")
    const source = messageSource(p)
    const made = asUser("mantle.sales.OpportunityServices.store#LeadIntake", {
        organizationPartyId,
        sourceKind: source.sourceKind,
        sourceId: source.sourceId,
        submittedName: source.submittedName || null,
        submittedEmail: source.submittedEmail || null,
        submittedPhone: source.submittedPhone || null,
        opportunityName: source.opportunityName || null,
        description: source.description || null
    })
    // the message on the lead's conversation, as its source (once: a retry made nothing new)
    if (source.communicationEventId && !made.alreadyApplied)
        asUser("mantle.party.CommunicationServices.link#CommunicationEventRecord", {
            communicationEventId: source.communicationEventId,
            recordEntityName: OPPORTUNITY,
            recordId: made.salesOpportunityId
        })
    const words = made.alreadyApplied
        ? "Already lead ${id}"
        : made.duplicate
          ? "Added to open lead ${id} (the same email)"
          : "Lead ${id} made from the message"
    return {
        recordEntityName: OPPORTUNITY,
        recordId: made.salesOpportunityId,
        url: urlOf(made.salesOpportunityId),
        message: ec.resource.expand(words, "", {id: made.salesOpportunityId}),
        roomRecordLinked: false
    }
}

// ===== record-lookup =====
// A deal the user sees as a card: its name, kind and stage or outcome, account and owner; never its amount.
function dealCard(userScope, salesOpportunityId) {
    if (!salesAccess.opportunityOf(userScope, salesOpportunityId)) return null
    const found = readAsUser("mantle.sales.OpportunityServices.get#Opportunity", {salesOpportunityId})
    const deal = found?.opportunityFound ? found.opportunity : null
    if (!deal) return null
    return {
        title: deal.opportunityName,
        typeLabel: deal.typeText || (deal.isLead ? L("Lead") : L("Opportunity")),
        status: deal.statusId === "SalesOppOpen" ? deal.stageText || deal.statusText : deal.statusText,
        lines: [deal.accountName, deal.ownerName ? L("Owner") + ": " + deal.ownerName : ""].filter(Boolean)
    }
}
function lookup(p) {
    const empty = {recordList: [], card: null, optionList: []}
    if (!ec.user.userId) return empty
    const userScope = salesAccess.scope()
    if (!userScope.capabilities.anyRead) return empty
    const isDeal = name => name === OPPORTUNITY || name === "SalesOpportunity"
    if (p.operation === "info") {
        const recordList = []
        for (const wanted of Array.from(p.records || [])) {
            if (!isDeal(wanted.recordEntityName)) continue
            // a deal the user does not see is left to the other providers
            const card = dealCard(userScope, wanted.recordId)
            if (!card) continue
            recordList.push({
                recordEntityName: wanted.recordEntityName,
                recordId: wanted.recordId,
                entity: OPPORTUNITY,
                visible: true,
                title: card.title,
                typeLabel: card.typeLabel,
                url: urlOf(wanted.recordId),
                icon: "sym_o_trending_up"
            })
        }
        return Object.assign(empty, {recordList})
    }
    if (p.operation === "card") {
        if (!isDeal(p.recordEntityName) || !p.recordId) return empty
        const card = dealCard(userScope, p.recordId)
        return card
            ? Object.assign(empty, {
                  card: {
                      entityName: OPPORTUNITY,
                      id: p.recordId,
                      title: card.title,
                      status: card.status,
                      url: urlOf(p.recordId),
                      lines: card.lines
                  }
              })
            : empty
    }
    if (p.operation === "search") {
        const term = String(p.text || "").trim()
        if (term.length < 2) return empty
        const found = readAsUser("mantle.sales.OpportunityServices.find#Opportunities", {
            text: term,
            statusId: "SalesOppOpen",
            pageSize: Math.max(1, Math.min(20, Number(p.limit || 10)))
        })
        return Object.assign(empty, {
            optionList: Array.from(found?.opportunityList || []).map(row => ({
                value: OPPORTUNITY + "|" + row.salesOpportunityId,
                label: row.typeText + " · " + row.opportunityName + (row.accountName ? " (" + row.accountName + ")" : "")
            }))
        })
    }
    if (p.operation === "links") {
        const ids = Array.from(
            String(p.body || "").matchAll(
                /\/qapps\/[A-Za-z]+\/Pipeline\/OpportunityDetail\?salesOpportunityId=([A-Za-z0-9_.-]+)/g
            )
        ).map(match => decodeURIComponent(match[1]))
        return Object.assign(empty, {
            recordList: Array.from(new Set(ids))
                .slice(0, 5)
                .map(id => ({entity: OPPORTUNITY, id}))
        })
    }
    throw new Error("Unknown record lookup " + p.operation)
}

// ===== call-context =====
// The parties with a phone number like the one ringing (its last seven digits in the stored number, checked against the whole number
// when it has a country code), as Maintenance's call context reads them.
function partiesOfNumber(number) {
    const wanted = String(number || "").replace(/[^0-9+]/g, "")
    const digits = wanted.replace(/\D/g, "")
    if (digits.length < 7) return []
    const factory = ec.entity.conditionFactory
    const last7 = digits.slice(-7)
    const written = [last7, ...["-", " ", "."].map(separator => last7.slice(0, 3) + separator + last7.slice(3))]
    const partyIds = new Set()
    for (const row of Array.from(
        find("mantle.party.contact.PartyContactMechTelecomNumber")
            .condition(
                factory.makeCondition(
                    written.map(form => factory.makeCondition("contactNumber", "like", "%" + form + "%")),
                    "or"
                )
            )
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .limit(60)
            .list()
    )) {
        const local = String(row.areaCode || "") + String(row.contactNumber || "")
        const countryCode = String(row.countryCode || "").replace(/\D/g, "")
        const e164 = countryCode ? "+" + countryCode + local.replace(/\D/g, "") : null
        if (!e164 || e164 === wanted || e164.replace(/\D/g, "").endsWith(digits.slice(-10))) partyIds.add(row.partyId)
    }
    return Array.from(partyIds)
}
// The caller's open deals the user sees: those of the accounts the caller is or is a contact of, each with its Sales link; Comms' own
// provider answers who the caller is.
function callContext(p) {
    const empty = {contactList: [], recordList: []}
    if (!ec.user.userId) return empty
    const userScope = salesAccess.scope()
    if (!userScope.capabilities.anyRead) return empty
    const accountIds = new Set()
    for (const partyId of partiesOfNumber(p.number)) {
        if (salesAccess.accountOf(userScope, partyId)) accountIds.add(partyId)
        for (const account of salesAccess.contactAccounts(userScope, partyId)) accountIds.add(account.party.partyId)
    }
    const recordList = []
    for (const accountPartyId of accountIds) {
        if (recordList.length >= callRecordLimit) break
        const found = readAsUser("mantle.sales.OpportunityServices.find#Opportunities", {
            accountPartyId,
            statusId: "SalesOppOpen",
            pageSize: callRecordLimit
        })
        for (const row of Array.from(found?.opportunityList || [])) {
            if (recordList.length >= callRecordLimit) break
            recordList.push({
                title: row.typeText + ": " + row.opportunityName + (row.accountName ? " · " + row.accountName : ""),
                status: row.stageText || row.statusText,
                url: urlOf(row.salesOpportunityId)
            })
        }
    }
    return {contactList: [], recordList}
}

// ===== contact-card =====
// An inquirer who is no party yet: the open lead the user sees whose intake holds this email (the latest), as its card; a known party
// is Comms' own card, which comes first.
function contactCard(p) {
    if (!ec.user.userId || blank(p.address) || !blank(p.partyId)) return {card: null}
    const userScope = salesAccess.scope()
    if (!userScope.capabilities.anyRead) return {card: null}
    const email = String(p.address).trim().toLowerCase()
    const organizationPartyIds = userScope.organizationPartyIds
    if (organizationPartyIds != null && !organizationPartyIds.length) return {card: null}
    let query = find(INTAKE, {submittedEmail: email}).condition("purgedDate", null).orderBy("-receivedDate").limit(20)
    if (organizationPartyIds != null) query = query.condition("organizationPartyId", "in", Array.from(organizationPartyIds))
    for (const row of Array.from(query.list())) {
        const found = row.salesOpportunityId ? salesAccess.opportunityOf(userScope, row.salesOpportunityId) : null
        if (!found || found.opportunity.statusId !== "SalesOppOpen") continue
        return {
            card: {
                emailAddress: email,
                name: row.submittedName || p.name || null,
                partyId: null,
                isPrivate: false,
                organizationName: row.submittedOrganization || null,
                phone: row.submittedPhone || null,
                emailList: [email],
                url: urlOf(row.salesOpportunityId),
                recentList: []
            }
        }
    }
    return {card: null}
}

// ===== Log call on opportunity =====
// The deals a call may be logged on: the open ones the user sees by name or id, at most 20, as {value, label}.
function dealOptions(p) {
    salesScope()
    const found = readAsUser("mantle.sales.OpportunityServices.find#Opportunities", {
        text: text(p.term),
        statusId: "SalesOppOpen",
        pageSize: 20
    })
    return {
        options: Array.from(found?.opportunityList || []).map(row => ({
            value: row.salesOpportunityId,
            label: row.typeText + " · " + row.opportunityName + (row.accountName ? " (" + row.accountName + ")" : "")
        }))
    }
}
function logCall(p) {
    salesScope()
    let summary = text(p.summary)
    let direction = p.direction || "out"
    let occurredDate = null
    let durationMinutes = blank(p.durationMinutes) ? null : p.durationMinutes
    if (!blank(p.voicemailId)) {
        const voicemail = readAsUser("org.moqui.call.VoicemailServices.get#Voicemail", {voicemailId: p.voicemailId})?.voicemail
        if (!voicemail) denied("RECORD_UNAVAILABLE", "Voicemail " + p.voicemailId + " is not available")
        direction = "in"
        occurredDate = voicemail.receivedDate ? new Date(Number(voicemail.receivedDate)) : null
        if (durationMinutes == null) durationMinutes = Math.round(Number(voicemail.durationMs || 0) / 60000)
        if (!summary) summary = voicemail.transcriptText || L("Voicemail from") + " " + (voicemail.fromNumber || "")
    }
    const out = asUser("mantle.sales.OpportunityServices.log#OpportunityCall", {
        salesOpportunityId: p.salesOpportunityId,
        summary,
        direction,
        occurredDate,
        durationMinutes
    })
    return {
        communicationEventId: out.communicationEventId,
        url: urlOf(p.salesOpportunityId),
        message: L("Call logged on the deal")
    }
}

const operations = {leadFromMessage, lookup, callContext, contactCard, dealOptions, logCall}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Sales Comms operation " + op)
        return operations[op](parameters || {})
    }
})
