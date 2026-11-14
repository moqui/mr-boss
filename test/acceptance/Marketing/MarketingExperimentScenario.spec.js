// Marketing P10's "usable when" (impl-marketing P10; design-marketing §16.3 scenario 8, A/B isolation), as an acceptance scenario
// through the screens' transitions with artifact authorization on: marketing.author sets up a two-variant A/B test of a send to the
// garden newsletter (a 20% sample) and changes variant B's subject; marketing.approver approves it; marketing.dispatch releases it and
// the two samples go out, each subscriber one variant and the remainder none; a second dispatch run reassigns no one and sends nothing
// more; after the observation period a subscriber of the remainder unsubscribes, the dispatcher chooses variant B with a reason and
// releases it to the remainder once (a second release answers the first): the unsubscribed subscriber is not sent, and no one gets
// two messages of the send. The rules are Mantle's Experiments, the render MarketingSends' ExperimentDetail.
// Run: ./moq accept mr-boss --spec MarketingExperimentScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const D = "mantle.marketing.CampaignSendServices."
const SEND = "mantle.marketing.campaign.CampaignSend"
const RECIPIENT = "mantle.marketing.campaign.CampaignRecipient"
const EXPERIMENT = "mantle.marketing.campaign.CampaignExperiment"
const VARIANT = "mantle.marketing.campaign.CampaignExperimentVariant"
const capture = ec.factory.getTool("MailCapture")
const prefix = "MKT_EXPT_SCN"
const count = 20
const addressOf = n => "abscn" + n + "@experiment-scenario.example"

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const revision = id => entityLib.ms(one(SEND, {campaignSendId: id}).lastUpdatedStamp)
const settle = () => ec.factory.waitWorkerPoolEmpty(50)
const live = id => all(RECIPIENT, {campaignSendId: id}).filter(r => r.statusId !== "CrsReplaced")
const mailsTo = address => Array.from(capture.getMessages()).filter(m => Array.from(m.toList || []).includes(address))
const scenario = {}

spec({
    setupSpec() {
        login("john.doe")
        capture.enable()
        // twenty subscribers of Retail's garden newsletter, each with a granted list consent
        system(() => {
            for (let n = 0; n < count; n++) {
                const partyId = prefix + "_" + n
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson", ownerPartyId: ids.organizationId})
                call("create#mantle.party.Person", {partyId, firstName: "Tester" + n, lastName: "Reader"})
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

feature("an author sets up a two-variant test, an approver approves it and the dispatcher's release sends the two samples", {
    when() {
        asUser(users.author, () =>
            post("Sends/Sends/createSend", {
                marketingCampaignId: ids.runningCampaignId,
                sendName: "Scenario subject test",
                contactListId: ids.gardenListId,
                messageTemplateId: ids.newsletterTemplateId,
                sendingProfileId: ids.retailProfileId
            })
        )
        const sendId = (scenario.sendId = one(SEND, {sendName: "Scenario subject test"})?.campaignSendId)
        const setUp = asUser(users.author, () =>
            post("Sends/SendDetail/storeExperiment", {
                campaignSendId: sendId,
                expectedRevision: revision(sendId),
                samplePercent: "20",
                observationHours: "1"
            })
        )
        const experiment = all(EXPERIMENT, {campaignSendId: sendId}).find(r => r.endedDate == null)
        const variantB = all(VARIANT, {campaignExperimentId: experiment.campaignExperimentId}).find(r => r.variantLabel == "B")
        scenario.variantB = variantB.campaignExperimentVariantId
        const edited = asUser(users.author, () =>
            post("Sends/ExperimentDetail/storeExperimentVariant", {
                campaignSendId: sendId,
                campaignExperimentVariantId: scenario.variantB,
                expectedRevision: revision(sendId),
                variantName: "Urgent",
                subject: "Only this week, ${firstName}"
            })
        )
        const prepared = asUser(users.author, () =>
            post("Sends/SendDetail/prepareSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        const targetRevision = Number(one(SEND, {campaignSendId: sendId}).sendRevision)
        const asked = asUser(users.author, () =>
            post("Sends/SendDetail/requestSendApproval", {campaignSendId: sendId, targetRevision})
        )
        const decided = asUser(users.approver, () =>
            post("Sends/SendDetail/decideSendApproval", {campaignSendId: sendId, targetRevision, decision: "approve"})
        )
        capture.clear()
        const released = asUser(users.dispatch, () =>
            post("Sends/SendDetail/releaseSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        settle()
        system(() => call(D + "dispatch#Send", {campaignSendId: sendId}))
        scenario.assignment = Object.fromEntries(
            live(sendId).map(r => [r.destinationKey, r.campaignExperimentVariantId || "held"])
        )
        // a second run reassigns no one and sends nothing more
        const mailCount = capture.getMessages().length
        system(() => call(D + "dispatch#Send", {campaignSendId: sendId}))
        const again = Object.fromEntries(live(sendId).map(r => [r.destinationKey, r.campaignExperimentVariantId || "held"]))
        const sampled = Object.entries(scenario.assignment).filter(([, variant]) => variant != "held")
        return {
            setUp,
            edited,
            prepared,
            asked,
            decided,
            released,
            sampled,
            sampleMails: sampled.map(([address, variant]) => [variant, mailsTo(address).map(m => String(m.subject || ""))]),
            heldMails: Object.entries(scenario.assignment)
                .filter(([, variant]) => variant == "held")
                .reduce((sum, [address]) => sum + mailsTo(address).length, 0),
            mailCount,
            mailCountAfter: capture.getMessages().length,
            againSame: JSON.stringify(again) == JSON.stringify(scenario.assignment),
            status: one(SEND, {campaignSendId: sendId}).statusId
        }
    },
    then({
        setUp,
        edited,
        prepared,
        asked,
        decided,
        released,
        sampled,
        sampleMails,
        heldMails,
        mailCount,
        mailCountAfter,
        againSame,
        status
    }) {
        setUp.errors == "" && edited.errors == "" && prepared.errors == "" && asked.errors == "" && decided.errors == ""
        released.errors == ""
        sampled.length >= 4
        sampleMails.every(
            ([variant, subjects]) =>
                subjects.length == 1 && (variant == scenario.variantB) == subjects[0].startsWith("Only this week")
        )
        heldMails == 0
        mailCountAfter == mailCount
        againSame
        status == "CsSampleSent"
    }
})

feature("after the observation the dispatcher chooses and releases the winner once; an unsubscribed subscriber is not sent", {
    when() {
        const sendId = scenario.sendId
        system(() => call("update#" + SEND, {campaignSendId: sendId, releasedDate: new Date(Date.now() - 2 * 3600000)}))
        // a subscriber of the remainder unsubscribes in between
        const leaver = Object.entries(scenario.assignment).find(([, variant]) => variant == "held")[0]
        const leaverParty = live(sendId).find(r => r.destinationKey == leaver).partyId
        system(() =>
            call("create#mantle.party.PartyConsent", {
                partyId: leaverParty,
                contactListId: ids.gardenListId,
                purposeEnumId: "PcpMarketingEmail",
                statusId: "PconWithdrawn",
                consentDate: new Date(Date.now() - 60000),
                sourceEnumId: "PcsEmailLink"
            })
        )
        const experiment = all(EXPERIMENT, {campaignSendId: sendId}).find(r => r.endedDate == null)
        const chosen = asUser(users.dispatch, () =>
            post("Sends/ExperimentDetail/chooseExperimentWinner", {
                campaignSendId: sendId,
                campaignExperimentVariantId: scenario.variantB,
                expectedRevision: entityLib.ms(experiment.lastUpdatedStamp),
                reason: "More replies to the urgent subject"
            })
        )
        capture.clear()
        const released = asUser(users.dispatch, () =>
            post("Sends/ExperimentDetail/releaseExperimentWinner", {campaignSendId: sendId})
        )
        settle()
        system(() => call(D + "dispatch#Send", {campaignSendId: sendId}))
        const releasedAgain = asUser(users.dispatch, () =>
            post("Sends/ExperimentDetail/releaseExperimentWinner", {campaignSendId: sendId})
        )
        settle()
        const remainder = Object.entries(scenario.assignment).filter(([, variant]) => variant == "held")
        return {
            chosen,
            released,
            releasedAgain,
            leaverMails: mailsTo(leaver).length,
            remainderMails: remainder
                .filter(([address]) => address != leaver)
                .map(([address]) => mailsTo(address).map(m => String(m.subject || ""))),
            sampleMails: Object.entries(scenario.assignment)
                .filter(([, variant]) => variant != "held")
                .reduce((sum, [address]) => sum + mailsTo(address).length, 0),
            experiment: one(EXPERIMENT, {campaignExperimentId: experiment.campaignExperimentId}),
            status: one(SEND, {campaignSendId: sendId}).statusId
        }
    },
    then({chosen, released, releasedAgain, leaverMails, remainderMails, sampleMails, experiment, status}) {
        chosen.errors == "" && released.errors == "" && releasedAgain.errors == ""
        experiment.winnerVariantId == scenario.variantB && experiment.winnerReason == "More replies to the urgent subject"
        Number(experiment.winnerDroppedCount) == 1
        leaverMails == 0
        remainderMails.every(subjects => subjects.length == 1 && subjects[0].startsWith("Only this week"))
        // no sample subscriber got the send twice, and the second release sent nothing
        sampleMails == 0
        status == "CsCompleted"
    }
})
