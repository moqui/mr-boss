// Marketing P22's "usable when" (impl-marketing P22; design-marketing §16.3 scenario 7's SMS half, §5 Compose's SMS counter, §12
// SendingProfiles' SMS readiness), as an acceptance scenario through the screens' transitions with artifact authorization on:
// marketing.admin binds an SMS sending profile to one of Ziziwork Retail's messaging numbers; marketing.author makes a text send to
// the consenting members of a list of phone numbers, prepares it and asks for approval; marketing.approver sees its segment and cost
// estimate on SendDetail and approves it; marketing.dispatch releases it and the dispatch hands each consenting member's text to the
// framework's SMS sender (the provider here a closed local port: each hand-off reaches the framework and is retried, nothing leaves
// the machine), the member with no consent never handed off; a member's STOP withdraws their consent and the next send leaves them
// out; Ziziwork Services, with no messaging number, sees SMS not ready (a text send refused, no list of phone numbers offered in
// NewSend) while its email send is made as before. The rules are Mantle's SmsSends and moqui-channels' tests; the renders
// MarketingSends'.
// Run: ./moq accept mr-boss --spec MarketingSmsScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const D = "mantle.marketing.CampaignSendServices."
const M = "mantle.party.MessageServices."
const SEND = "mantle.marketing.campaign.CampaignSend"
const RECIPIENT = "mantle.marketing.campaign.CampaignRecipient"
const DELIVERY = "mantle.party.MessageDelivery"
const prefix = "MKT_SMS_SCN"
const bridge = prefix + "_BRIDGE"
const OURS = "+15550008800"
const smsList = prefix + "_LIST"
const servicesSmsList = prefix + "_LIST_SERVICES"
const members = [
    {name: "Ana", number: "+15550108801", consent: true},
    {name: "Ben", number: "+15550108802", consent: true},
    {name: "Cy", number: "+15550108803", consent: false}
]
const ago = days => new Date(Date.now() - days * 86400000)

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
const make = (entity, fields) => call("create#" + entity, fields)
function telecom(partyId, number, purpose) {
    make("mantle.party.contact.ContactMech", {contactMechId: partyId + "_SMS_TN", contactMechTypeEnumId: "CmtTelecomNumber"})
    make("mantle.party.contact.TelecomNumber", {
        contactMechId: partyId + "_SMS_TN",
        countryCode: "1",
        areaCode: number.slice(2, 5),
        contactNumber: number.slice(5, 8) + "-" + number.slice(8)
    })
    make("mantle.party.contact.PartyContactMech", {
        partyId,
        contactMechId: partyId + "_SMS_TN",
        contactMechPurposeId: purpose,
        fromDate: ago(30)
    })
    return partyId + "_SMS_TN"
}
// an author's text send of the list, its text saved, prepared and asked for approval: its id
function askedSend(sendName) {
    asUser(users.author, () =>
        post("Sends/Sends/createSend", {
            marketingCampaignId: ids.runningCampaignId,
            sendName,
            contactListId: smsList,
            sendingProfileId: ids.smsProfileId
        })
    )
    const sendId = one(SEND, {sendName})?.campaignSendId
    asUser(users.author, () =>
        post("Sends/Compose/storeSendContent", {
            campaignSendId: sendId,
            expectedRevision: revision(sendId),
            bodyText: "Hi ${firstName}, the spring sale starts Saturday at Ziziwork Retail.",
            variablesText: "firstName | First name | friend"
        })
    )
    const prepared = asUser(users.author, () =>
        post("Sends/SendDetail/prepareSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
    )
    const asked = asUser(users.author, () =>
        post("Sends/SendDetail/requestSendApproval", {
            campaignSendId: sendId,
            targetRevision: Number(one(SEND, {campaignSendId: sendId}).sendRevision)
        })
    )
    return {sendId, prepared, asked}
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            // Retail's messaging number: one of its numbers, through a messaging bridge (Telnyx's adapter at a closed local port)
            make("moqui.chat.ChatBridge", {
                chatBridgeId: bridge,
                typeEnumId: "CbtSms",
                adapterName: "sms",
                name: "Scenario texts",
                statusId: "CbsConnected",
                configJson: JSON.stringify({
                    apiKey: "scenario-key",
                    apiBaseUrl: "http://127.0.0.1:9",
                    allowInternalAddresses: true
                })
            })
            make("moqui.call.PhoneNumber", {phoneNumber: OURS, messagingBridgeId: bridge, description: "Retail texts"})
            telecom(ids.organizationId, OURS, "PhoneWork")
            for (const [contactListId, ownerPartyId, contactListName] of [
                [smsList, ids.organizationId, "Spring sale texts"],
                [servicesSmsList, ids.otherOrganizationId, "Services texts"]
            ])
                make("mantle.marketing.contact.ContactList", {
                    contactListId,
                    contactListName,
                    contactListTypeEnumId: "MARKETING",
                    contactMechTypeEnumId: "CmtTelecomNumber",
                    ownerPartyId
                })
            for (const member of members) {
                const partyId = (member.partyId = prefix + "_" + member.name.toUpperCase())
                make("mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson", ownerPartyId: ids.organizationId})
                make("mantle.party.Person", {partyId, firstName: member.name, lastName: "Texter"})
                const contactMechId = telecom(partyId, member.number, "PhoneMobile")
                make("mantle.marketing.contact.ContactListParty", {
                    contactListId: smsList,
                    partyId,
                    fromDate: ago(20),
                    statusId: "CLPT_ACCEPTED",
                    preferredContactMechId: contactMechId
                })
                if (member.consent)
                    make("mantle.party.PartyConsent", {
                        partyId,
                        contactMechId,
                        contactListId: smsList,
                        purposeEnumId: "PcpSms",
                        statusId: "PconGranted",
                        consentDate: ago(19),
                        sourceEnumId: "PcsForm",
                        evidenceText: "Scenario text sign-up at the store"
                    })
            }
        })
    },
    cleanupSpec() {
        settle()
        system(() => {
            ec.entity.find("moqui.call.SmsOptOut").condition("phoneNumber", OURS).deleteAll()
            ec.entity.find("moqui.call.PhoneNumber").condition("phoneNumber", OURS).deleteAll()
        })
        login("john.doe")
    }
})

feature("the administrator binds an SMS profile to Retail's messaging number, and it is ready", {
    when() {
        const stored = asUser(users.admin, () =>
            ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(
                "Settings/SendingProfiles/storeSmsProfile",
                {
                    organizationPartyId: ids.organizationId,
                    profileName: "Retail texts",
                    fromPhoneNumber: OURS,
                    purposeEnumId: "MtpPromotional",
                    segmentCost: "0.0079",
                    segmentCostUomId: "USD"
                },
                "post"
            )
        )
        ec.message.clearErrors()
        const profile = one("mantle.party.MessageSendingProfile", {profileName: "Retail texts"})
        ids.smsProfileId = profile?.sendingProfileId
        const listed = asUser(users.admin, () => page("Settings/SendingProfiles", {sendingProfileId: ids.smsProfileId}))
        return {stored, profile, listed}
    },
    then({profile, listed}) {
        profile.channelEnumId == "MdcSms"
        profile.fromPhoneNumber == OURS
        listed.errors.length == 0
        listed.output.includes("Ready")
    }
})

feature("a text send to the consenting members shows its segment estimate at approval and goes to each of them", {
    when() {
        const {sendId, prepared, asked} = askedSend("Spring sale text")
        ids.firstSendId = sendId
        const detail = asUser(users.approver, () => page("Sends/SendDetail", {campaignSendId: sendId}))
        const decided = asUser(users.approver, () =>
            post("Sends/SendDetail/decideSendApproval", {
                campaignSendId: sendId,
                targetRevision: Number(one(SEND, {campaignSendId: sendId}).sendRevision),
                decision: "approve"
            })
        )
        const released = asUser(users.dispatch, () =>
            post("Sends/SendDetail/releaseSend", {campaignSendId: sendId, expectedRevision: revision(sendId)})
        )
        settle()
        system(() => {
            call(D + "dispatch#Send", {campaignSendId: sendId})
            call(M + "run#Deliveries", {})
        })
        return {
            prepared,
            asked,
            detail,
            decided,
            released,
            recipients: all(RECIPIENT, {campaignSendId: sendId}).filter(r => r.statusId !== "CrsReplaced"),
            handedOff: deliveries(sendId)
        }
    },
    then({prepared, asked, detail, decided, released, recipients, handedOff}) {
        prepared.errors == "" && asked.errors == "" && decided.errors == "" && released.errors == ""
        detail.errors.length == 0
        detail.output.includes("1 segment")
        detail.output.includes("for 2 recipients")
        // Cy, on the list with no PcpSms consent, is no recipient
        recipients.length == 2
        recipients.every(r => r.partyId != members[2].partyId)
        // each consenting member's text was handed to the framework (the closed port refuses it, so it waits to be tried again)
        handedOff.length == 2
        handedOff.every(d => d.channelEnumId == "MdcSms" && d.attempts == 1 && ["MdsRetry", "MdsSent"].includes(d.stateEnumId))
    }
})

feature("a member's STOP withdraws their consent and the next send leaves them out", {
    when() {
        system(() =>
            call("org.moqui.call.SmsServices.note#SmsKeyword", {ourNumber: OURS, theirNumber: members[0].number, keyword: "STOP"})
        )
        const {sendId, prepared} = askedSend("Spring sale reminder")
        return {
            prepared,
            withdrawals: all("mantle.party.PartyConsent", {
                partyId: members[0].partyId,
                purposeEnumId: "PcpSms",
                statusId: "PconWithdrawn"
            }),
            suppressions: all("mantle.party.MessageSuppression", {channelEnumId: "MdcSms", destinationKey: members[0].number}),
            recipients: all(RECIPIENT, {campaignSendId: sendId}).filter(r => r.statusId !== "CrsReplaced")
        }
    },
    then({prepared, withdrawals, suppressions, recipients}) {
        prepared.errors == ""
        withdrawals.length == 1
        suppressions.length == 1
        recipients.length == 1
        recipients[0].partyId == members[1].partyId
    }
})

feature("an organization with no messaging number sees SMS not ready while its email sends work", {
    when() {
        const textSend = asUser(users.otherAuthor, () =>
            post("Sends/Sends/createSend", {
                marketingCampaignId: ids.servicesCampaignId,
                sendName: "Services text",
                contactListId: servicesSmsList,
                sendingProfileId: ids.servicesProfileId
            })
        )
        const topics = asUser(users.otherAuthor, () =>
            system(() =>
                call("ironstone.marketing.ContextServices.get#Choices", {
                    choice: "sendTopics",
                    organizationPartyId: ids.otherOrganizationId
                })
            )
        )
        const emailTopic = Array.from(topics.options || []).find(option => option.value != servicesSmsList)
        const emailSend = emailTopic
            ? asUser(users.otherAuthor, () =>
                  post("Sends/Sends/createSend", {
                      marketingCampaignId: ids.servicesCampaignId,
                      sendName: "Services email",
                      contactListId: emailTopic.value,
                      sendingProfileId: ids.servicesProfileId
                  })
              )
            : {errors: "no email topic"}
        return {textSend, topics, emailSend, made: one(SEND, {sendName: "Services email"})}
    },
    then({textSend, topics, emailSend, made}) {
        textSend.errors.includes("CHANNEL_UNAVAILABLE") || textSend.errors.includes("PROFILE_CHANNEL")
        Array.from(topics.options || []).every(option => option.value != servicesSmsList)
        emailSend.errors == ""
        made.channelEnumId == "MdcEmail"
    }
})
