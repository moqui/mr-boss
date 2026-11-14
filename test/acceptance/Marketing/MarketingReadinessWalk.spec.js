// Marketing P6's "usable when" (impl-marketing P6; design-marketing §16.3 scenario 17, bounces and complaints), as an acceptance walk
// through the screens' transitions with artifact authorization on: marketing.admin binds a sending profile on Settings/SendingProfiles
// and sees it ready (its bounce account there); marketing.author publishes a template with a fallback variable on
// MessageTemplateDetail; a DSN and an ARF report sent to the VERP addresses of two transactional deliveries that name the profile
// each suppress their destination once and show on the delivery (its receipt fact), read by the bounce intake as the bounce account
// stores them; a profile with no bounce account reads not ready with its reason and a link to Comms' mail accounts. The rules are
// Mantle's (MessageTemplates, SendingProfiles, DeliveryReports), the renders MarketingTemplates.
// Run: ./moq accept mr-boss --spec MarketingReadinessWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const M = "mantle.party.MessageServices."
const capture = ec.factory.getTool("MailCapture")
const prefix = "MKT_READY_WALK"
const domain = "bounce.readywalk.example"
const deliveries = {}
let profileId, templateId, emailTemplateId

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const revision = (entity, fields) => String(entityLib.ms(one(entity, fields).lastUpdatedStamp))
// a report as the bounce account stores it: the message, its trace field and its report part as a file
function stored(deliveredTo, contentType, text) {
    const emailMessageId = prefix + "_MSG_" + Object.keys(deliveries).length + "_" + contentType.length + "_" + text.length
    system(() => {
        call("create#moqui.basic.email.EmailMessage", {
            emailMessageId,
            emailAccountId: prefix + "_BOUNCES",
            statusId: "ES_RECEIVED",
            subject: "Report",
            toAddresses: deliveredTo,
            headersString: "Delivered-To: " + deliveredTo,
            receivedDate: ec.user.nowTimestamp
        })
        const location = "dbresource://email/walk/" + emailMessageId + "/1"
        ec.resource.getLocationReference(location).putText(text)
        call("create#moqui.basic.email.EmailMessageAttachment", {
            emailMessageAttachmentId: emailMessageId + "_1",
            emailMessageId,
            attachmentLocation: location,
            contentType
        })
    })
    return emailMessageId
}

spec({
    setupSpec() {
        login("john.doe")
        capture.enable()
    },
    cleanupSpec() {
        capture.reset()
    }
})

feature("the administrator binds a profile and sees it not ready until its bounce account exists, then ready", {
    when() {
        const saved = asUser(users.admin, () =>
            post("Settings/SendingProfiles/storeProfile", {
                organizationPartyId: ids.organizationId,
                profileName: "Walk notices",
                emailServerId: "BOSS_COM_DEMO_MAIL",
                fromAddress: "notices@retail.example",
                bounceDomain: domain,
                purposeEnumId: "MtpTransactional"
            })
        )
        profileId = one("mantle.party.MessageSendingProfile", {profileName: "Walk notices"})?.sendingProfileId
        const notReady = asUser(users.admin, () => page("Settings/SendingProfiles", {sendingProfileId: profileId}, "html"))
        system(() =>
            call("create#moqui.basic.email.EmailAccount", {
                emailAccountId: prefix + "_BOUNCES",
                ownerPartyId: ids.organizationId,
                accountKindEnumId: "EakShared",
                emailAddress: "bounces@" + domain,
                statusId: "EasActive"
            })
        )
        const ready = asUser(users.admin, () => page("Settings/SendingProfiles", {sendingProfileId: profileId}, "html"))
        return {saved, notReady, ready}
    },
    then({saved, notReady, ready}) {
        saved.errors == "" && profileId != null
        notReady.output.includes("No bounce account bounces@" + domain) && notReady.output.includes("Comms: mail accounts")
        ready.output.includes("Ready: mail may go out from this profile.")
    }
})

feature("an author publishes a template with a fallback variable", {
    when() {
        const created = asUser(users.author, () =>
            post("Sends/MessageTemplates/createTemplate", {
                organizationPartyId: ids.organizationId,
                templateName: "Walk receipt",
                purposeEnumId: "MtpTransactional"
            })
        )
        const template = one("mantle.party.MessageTemplate", {templateName: "Walk receipt"})
        templateId = template.messageTemplateId
        emailTemplateId = template.emailTemplateId
        const content = asUser(users.author, () =>
            post("Sends/MessageTemplateDetail/storeContent", {
                messageTemplateId: templateId,
                expectedRevision: revision("mantle.party.MessageTemplate", {messageTemplateId: templateId}),
                subject: "Your receipt, ${firstName}",
                body: "<p>Thank you, ${firstName}.</p>",
                bodyText: "Thank you, ${firstName}.",
                variablesText: "firstName | First name | customer"
            })
        )
        const published = asUser(users.author, () =>
            post("Sends/MessageTemplateDetail/publishTemplate", {
                messageTemplateId: templateId,
                expectedRevision: revision("mantle.party.MessageTemplateContent", {
                    messageTemplateId: templateId,
                    contentSeqId: "001"
                }),
                reason: "Receipts from the walk"
            })
        )
        const detail = asUser(users.author, () => page("Sends/MessageTemplateDetail", {messageTemplateId: templateId}, "html"))
        return {created, content, published, detail}
    },
    then({created, content, published, detail}) {
        created.errors == "" && content.errors == "" && published.errors == ""
        one("mantle.party.MessageTemplateContent", {messageTemplateId: templateId, contentSeqId: "001"}).fromDate != null
        detail.output.includes("Your receipt, customer")
    }
})

feature(
    "a DSN and an ARF report to the VERP addresses of deliveries naming the profile each suppress once and show on the delivery",
    {
        when() {
            for (const name of ["dsn", "arf"]) {
                const partyId = prefix + "_" + name.toUpperCase()
                system(() => call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"}))
                deliveries[name] = system(
                    () =>
                        call(M + "queue#Delivery", {
                            eventKey: "walk:" + name,
                            sourceEnumId: "MdsrcMessageTemplate",
                            recipientPartyId: partyId,
                            toAddress: name + "@readywalk-customers.example",
                            templateKey: emailTemplateId,
                            bodyParameters: {firstName: "Walker"},
                            sendingProfileId: profileId,
                            sendNow: true
                        }).deliveryId
                )
            }
            const sentBounce = capture.getMessages().map(mail => mail.bounceAddress)
            // the VERP address carries the delivery's random key (P6 review)
            const verp = name =>
                "bounces+" +
                deliveries[name] +
                "." +
                one("mantle.party.MessageDelivery", {deliveryId: deliveries[name]}).bounceKey +
                "@" +
                domain
            const dsn = stored(
                verp("dsn"),
                "message/delivery-status",
                "Reporting-MTA: dns; mx.example.net\n\nFinal-Recipient: rfc822; dsn@readywalk-customers.example\nAction: failed\nStatus: 5.1.1\n"
            )
            const arf = stored(
                "abuse@" + domain,
                "message/feedback-report",
                "Feedback-Type: abuse\nVersion: 1\nOriginal-Mail-From: <" + verp("arf") + ">\n"
            )
            const read = system(() => [dsn, arf, dsn].map(emailMessageId => call(M + "process#DeliveryReport", {emailMessageId})))
            return {sentBounce, read, verpDsn: verp("dsn")}
        },
        then({sentBounce, read, verpDsn}) {
            sentBounce.includes(verpDsn)
            read[0].receiptEnumId == "MdrHardBounce" && read[1].receiptEnumId == "MdrComplaint" && read[2].duplicate == true
            all("mantle.party.MessageSuppression", {destinationKey: "dsn@readywalk-customers.example"}).length == 1
            all("mantle.party.MessageSuppression", {destinationKey: "arf@readywalk-customers.example"}).length == 1
            one("mantle.party.MessageDelivery", {deliveryId: deliveries.dsn}).receiptEnumId == "MdrHardBounce"
            one("mantle.party.MessageDelivery", {deliveryId: deliveries.arf}).receiptEnumId == "MdrComplaint"
        }
    }
)

feature("a profile with no bounce account reads not ready with its reason and a link to the mail accounts", {
    when() {
        return {
            profiles: asUser(users.admin, () =>
                page("Settings/SendingProfiles", {sendingProfileId: ids.servicesProfileId}, "html")
            )
        }
    },
    then({profiles}) {
        profiles.output.includes("Not ready: nothing goes out from this profile")
        profiles.output.includes("No bounce account bounces@bounce.services.example")
        profiles.output.includes("/qapps/Comms/Settings/MailAccounts")
    }
})
