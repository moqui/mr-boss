// Marketing P9's "usable when" (impl-marketing P9; design-marketing §16.3 scenarios 6 and 7, approval and dispatch, transport
// recovery), as an acceptance scenario through the screens' transitions with artifact authorization on: marketing.author makes, prepares
// and asks for a send to forty subscribers of the garden newsletter and may not release it; marketing.approver approves it and may not
// release it; marketing.dispatch releases it. The dispatch stops after a hand-off and before its outcome was recorded (one delivery
// left uncertain); the next run sends the others and nothing twice; the dispatcher reconciles the uncertain one on RecipientDetail with
// the provider's evidence and nothing is resent; a duplicate bounce report changes no count; each email carries the List-Unsubscribe
// header and the link to the organization's unsubscribe page. The rules are Mantle's Sends and Dispatch, the renders MarketingSends and
// MarketingDelivery, the golden path the client MarketingSendWalk.
// Run: ./moq accept mr-boss --spec MarketingDispatchScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const D = "mantle.marketing.CampaignSendServices."
const M = "mantle.party.MessageServices."
const SEND = "mantle.marketing.campaign.CampaignSend"
const RECIPIENT = "mantle.marketing.campaign.CampaignRecipient"
const DELIVERY = "mantle.party.MessageDelivery"
const capture = ec.factory.getTool("MailCapture")
const prefix = "MKT_DISPATCH_SCN"
const count = 40
const addressOf = n => "scn" + n + "@dispatch-scenario.example"

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const revision = id => entityLib.ms(one(SEND, {campaignSendId: id}).lastUpdatedStamp)
const deliveries = id =>
    system(() =>
        Array.from(
            ec.entity
                .find(DELIVERY)
                .condition("eventKey", "like", "CampaignSend:" + id + ":%")
                .list()
        )
    )
const settle = () => ec.factory.waitWorkerPoolEmpty(50)
let sendId = null

spec({
    setupSpec() {
        login("john.doe")
        capture.enable()
        // forty subscribers of Retail's garden newsletter, each with a granted list consent
        system(() => {
            for (let n = 0; n < count; n++) {
                const partyId = prefix + "_" + n
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson", ownerPartyId: ids.organizationId})
                call("create#mantle.party.Person", {partyId, firstName: "Scenario" + n, lastName: "Reader"})
                call("create#mantle.party.contact.ContactMech", {
                    contactMechId: partyId + "_EM",
                    contactMechTypeEnumId: "CmtEmailAddress",
                    infoString: addressOf(n)
                })
                call("create#mantle.party.contact.PartyContactMech", {
                    partyId,
                    contactMechId: partyId + "_EM",
                    contactMechPurposeId: "EmailPrimary",
                    fromDate: new Date(Date.now() - 30 * 86400000)
                })
                call("create#mantle.marketing.contact.ContactListParty", {
                    contactListId: ids.gardenListId,
                    partyId,
                    fromDate: new Date(Date.now() - 20 * 86400000),
                    statusId: "CLPT_ACCEPTED",
                    preferredContactMechId: partyId + "_EM"
                })
                call("create#mantle.party.PartyConsent", {
                    partyId,
                    contactMechId: partyId + "_EM",
                    contactListId: ids.gardenListId,
                    purposeEnumId: "PcpMarketingEmail",
                    statusId: "PconGranted",
                    consentDate: new Date(Date.now() - 19 * 86400000),
                    sourceEnumId: "PcsForm",
                    evidenceText: "Scenario sign-up"
                })
            }
        })
    },
    cleanupSpec() {
        settle()
        capture.reset()
        login("john.doe")
    }
})

feature("author, approver and dispatcher each do only their part", {
    when() {
        asUser(users.author, () =>
            post("Sends/Sends/createSend", {
                marketingCampaignId: ids.runningCampaignId,
                sendName: "Scenario newsletter",
                contactListId: ids.gardenListId,
                messageTemplateId: ids.newsletterTemplateId,
                sendingProfileId: ids.retailProfileId
            })
        )
        sendId = one(SEND, {sendName: "Scenario newsletter"})?.campaignSendId
        // a schedule a day out, so the release waits and the dispatch runs here, page by page
        const scheduled = asUser(users.author, () =>
            post("Sends/SendDetail/scheduleSend", {
                campaignSendId: sendId,
                expectedRevision: revision(sendId),
                scheduledDate: ec.l10n.format(new Date(Date.now() + 86400000), "yyyy-MM-dd HH:mm")
            })
        )
        const prepared = asUser(users.author, () =>
            post("Sends/SendDetail/prepareSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        const targetRevision = Number(one(SEND, {campaignSendId: sendId}).sendRevision)
        const asked = asUser(users.author, () =>
            post("Sends/SendDetail/requestSendApproval", {campaignSendId: sendId, targetRevision})
        )
        const authorRelease = asUser(users.author, () =>
            post("Sends/SendDetail/releaseSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        const decided = asUser(users.approver, () =>
            post("Sends/SendDetail/decideSendApproval", {campaignSendId: sendId, targetRevision, decision: "approve"})
        )
        const approverRelease = asUser(users.approver, () =>
            post("Sends/SendDetail/releaseSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        const released = asUser(users.dispatch, () =>
            post("Sends/SendDetail/releaseSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        return {
            scheduled,
            prepared,
            asked,
            authorRelease,
            decided,
            approverRelease,
            released,
            row: one(SEND, {campaignSendId: sendId})
        }
    },
    then({scheduled, prepared, asked, authorRelease, decided, approverRelease, released, row}) {
        scheduled.errors == "" && prepared.errors == "" && asked.errors == "" && decided.errors == ""
        // the author holds no dispatch; the approver neither (and would be refused as the approver)
        authorRelease.errors != ""
        approverRelease.errors != ""
        released.errors == ""
        row.statusId == "CsScheduled"
        row.releasedByUserId == "BOSS_MKT_DISPATCH"
        Number(row.releasedCount) >= count
    }
})

feature("a stop after a hand-off leaves one delivery uncertain; the dispatcher reconciles it and nothing is resent", {
    when() {
        capture.clear()
        // its time comes; the first page of twenty is handed off, the first delivery stopped after its hand-off (uncertain)
        system(() => {
            call("update#" + SEND, {campaignSendId: sendId, scheduledDate: new Date(Date.now() - 60000)})
            call(D + "start#DueSend", {campaignSendId: sendId})
            const claim = call(D + "claim#RecipientPage", {campaignSendId: sendId, pageSize: 20})
            for (const campaignRecipientId of Array.from(claim.campaignRecipientIdList))
                call(D + "handOff#Recipient", {campaignRecipientId, claimKey: claim.claimKey, verdict: {eligible: true}})
        })
        const first = deliveries(sendId).sort((a, b) => (a.deliveryId < b.deliveryId ? -1 : 1))[0]
        system(() =>
            call("update#" + DELIVERY, {
                deliveryId: first.deliveryId,
                stateEnumId: "MdsUncertain",
                attempts: 1,
                lastError: "The worker stopped after the hand-off"
            })
        )
        // the next run: the rest handed off and sent, the uncertain one never tried again
        system(() => {
            call(D + "run#DueSends", {})
            call(M + "run#Deliveries", {})
            call(D + "dispatch#Send", {campaignSendId: sendId})
        })
        const before = one(SEND, {campaignSendId: sendId}).statusId
        const uncertainRecipient = one(RECIPIENT, {messageDeliveryId: first.deliveryId})
        const uncertainMail = Array.from(capture.getMessages()).filter(m =>
            Array.from(m.toList || []).includes(first.toAddress)
        ).length
        const reconciled = asUser(users.dispatch, () =>
            post("Sends/RecipientDetail/reconcileRecipient", {
                campaignRecipientId: uncertainRecipient.campaignRecipientId,
                outcome: "sent",
                providerReference: "relay queue id 7F3A",
                evidenceText: "The relay's log shows the message accepted",
                reason: "Confirmed with the relay's operator"
            })
        )
        settle()
        system(() => call(D + "dispatch#Send", {campaignSendId: sendId}))
        const mails = Array.from(capture.getMessages())
        const sample = mails.find(m => Array.from(m.toList || []).some(to => to.includes("@dispatch-scenario.example"))) || {}
        return {
            before,
            uncertainMail,
            reconciled,
            after: one(SEND, {campaignSendId: sendId}).statusId,
            all: deliveries(sendId),
            againMail: mails.filter(m => Array.from(m.toList || []).includes(first.toAddress)).length,
            header: String((sample.headers || {})["List-Unsubscribe"] || ""),
            body: String(sample.body || "")
        }
    },
    then({before, uncertainMail, reconciled, after, all, againMail, header, body}) {
        before == "CsSending"
        uncertainMail == 0
        reconciled.errors == ""
        after == "CsCompleted"
        all.filter(d => d.stateEnumId == "MdsSent").length == all.length
        new Set(all.map(d => d.eventKey)).size == all.length
        againMail == 0
        header.startsWith("<http")
        body.includes("Unsubscribe")
    }
})

feature("a duplicate bounce report changes no count", {
    when() {
        const delivery = deliveries(sendId).find(d => d.stateEnumId == "MdsSent")
        const account = one("moqui.basic.email.EmailAccount", {emailAddress: "bounces@bounce.retail.example"})
        const verp = "bounces+" + delivery.deliveryId + "." + delivery.bounceKey + "@bounce.retail.example"
        const emailMessageId = prefix + "_DSN"
        system(() => {
            call("create#moqui.basic.email.EmailMessage", {
                emailMessageId,
                emailAccountId: account.emailAccountId,
                statusId: "ES_RECEIVED",
                subject: "Report",
                toAddresses: verp,
                headersString: "Delivered-To: " + verp,
                receivedDate: ec.user.nowTimestamp
            })
            const location = "dbresource://email/scenario/" + emailMessageId + "/1"
            ec.resource
                .getLocationReference(location)
                .putText(
                    "Reporting-MTA: dns; mx.example.net\n\nFinal-Recipient: rfc822; " +
                        delivery.toAddress +
                        "\nAction: failed\nStatus: 5.1.1\n"
                )
            call("create#moqui.basic.email.EmailMessageAttachment", {
                emailMessageAttachmentId: emailMessageId + "_1",
                emailMessageId,
                attachmentLocation: location,
                contentType: "message/delivery-status"
            })
        })
        const read = system(() => [1, 2].map(() => call(M + "process#DeliveryReport", {emailMessageId})))
        const summary = asUser(users.dispatch, () =>
            system(() => call(D + "find#Recipients", {campaignSendId: sendId, state: "sent"}))
        )
        return {
            read,
            suppressions: all("mantle.party.MessageSuppression", {destinationKey: delivery.toAddress}).length,
            receipts: all("mantle.party.MessageDeliveryReceipt", {deliveryId: delivery.deliveryId}).length,
            summary
        }
    },
    then({read, suppressions, receipts, summary}) {
        read[0].receiptEnumId == "MdrHardBounce"
        read[1].duplicate == true
        suppressions == 1
        receipts == 1
        summary.summary.sentCount == summary.summary.handedOffCount
    }
})
