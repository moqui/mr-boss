// Admin P12's "usable when" (impl-admin P12; design-admin §9 ProtocolsHome, MailQueue and ServerConfiguration, §15.3 "Protocol
// readiness" and "Unknown provider outcome", its mail half), as an acceptance walk with artifact authorization on, through
// the screens and their transitions, on the demo:
// - ProtocolsHome, as Ziziwork Retail's integration administrator, shows SMTP reception off (the demo sets no listener port),
//   calendars, contacts and files as the web listener stands (ready on a running server; "configured" in a command-line run,
//   which opens no listeners) and a protocol the build leaves out as not in the build, each apart with its reason. On the
//   demo's package call media is built and off (impl-admin F-P12-4; on in a test run, as basic-comms' test conf sets its
//   port), so the absent ones are local speech to text and office documents; ServerConfiguration shows SMTP reception's
//   settings read only and runs its configuration check, and a check of a public address is refused until it is confirmed.
// - a mail send that fails (a relay with no address) shows in MailQueue, as the operations operator, with its owner (the
//   notice's template; the relay's link for the integration administrator, who reads the instance's own mail and is
//   offered no action), the next step and no subject, body or address; the operator sends it
//   again once the relay answers (mail is captured), as the same stored message; a message that may have been sent is
//   offered Settle, never Send again, and settling it sends nothing and never marks it sent: the settlement is kept
//   apart and the message is listed as settled.
// No request leaves the machine. The rules are the framework's AdminProtocols and AdminMailOutcomes and BOSS's
// AdminMailQueue.
// Run: ./moq accept mr-boss --spec AdminProtocolsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, invoke, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const O = "org.moqui.admin.OperationServices."
const MESSAGE = "moqui.basic.email.EmailMessage"
const SERVER = "moqui.basic.email.EmailServer"
const relayId = "AcceptProtoRelay"
const templateId = "ACCEPT_PROTO_NOTICE"
const maybeId = "ACCEPT_PROTO_MAYBE"
const subject = "Acceptance protocols private subject"
const address = "ada@acceptprotocols.example.test"
const capture = ec.factory.getTool("MailCapture")
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const stored = emailMessageId => system(() => find(MESSAGE, {emailMessageId}).one()?.getMap() || null)
const outcome = emailMessageId =>
    asUser(users.operations, () => invoke(O + "find#MailOutcomes", {emailMessageId, state: "all"}).outcomeList[0])
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const protocol = (list, protocolKey) => list.find(row => row.protocolKey === protocolKey)

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.create()
            }
            // a relay whose host has no address: a send through it is known not sent
            make(SERVER, {emailServerId: relayId, smtpHost: "mail.nowhere.invalid", smtpPort: "25", smtpStartTls: "N"})
            make("moqui.basic.email.EmailTemplate", {
                emailTemplateId: templateId,
                description: "Acceptance protocols notice",
                emailServerId: relayId,
                fromAddress: "notices@acceptprotocols.example.test",
                subject,
                bodyScreenLocation: "component://framework/screen/ScreenRenderEmail.xml"
            })
            make(MESSAGE, {
                emailMessageId: maybeId,
                statusId: "ES_READY",
                emailServerId: relayId,
                emailTemplateId: templateId,
                toAddresses: address,
                subject,
                body: "Acceptance protocols private body",
                sendError: "The SMTP session stopped before its end; the message may have been sent",
                sendOutcome: "uncertain"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        ec.entity.find(MESSAGE).condition("emailServerId", relayId).deleteAll()
        ec.entity.find("moqui.basic.email.EmailTemplate").condition("emailTemplateId", templateId).deleteAll()
        ec.entity.find(SERVER).condition("emailServerId", relayId).deleteAll()
        ec.entity.find("moqui.server.ConnectionCheck").condition("adapterKey", "protocol").deleteAll()
        ec.entity
            .find("moqui.server.OperationResult")
            .condition("operationKind", "in", ["mailRetry", "mailReconcile"])
            .deleteAll()
        ec.artifactExecution.enableAuthz()
        capture.reset()
    }
})

feature("ProtocolsHome tells SMTP reception that is off, the web protocols and a protocol not in the build apart", {
    when() {
        const out = {}
        out.read = asUser(users.integrations, () => invoke(C + "get#ProtocolReadiness"))
        out.home = asUser(users.integrations, () => page("Protocols/Home"))
        out.configuration = asUser(users.integrations, () => page("Protocols/ServerConfiguration", {protocolKey: "smtpIn"}))
        post(users.integrations, "Protocols/ServerConfiguration/runCheck", {
            checkProtocolKey: "smtpIn",
            checkKey: "configuration"
        })
        // a check that leaves the server, sent without its confirmation: refused, nothing kept
        post(users.integrations, "Protocols/ServerConfiguration/runCheck", {checkProtocolKey: "dav", checkKey: "publicAddress"})
        out.checks = system(() =>
            Array.from(find("moqui.server.ConnectionCheck", {adapterKey: "protocol"}).list()).map(row => row.getMap())
        )
        out.operator = asUser(users.operations, () => page("Protocols/Home", {}, "html"))
        out.reader = asUser(users.reader, () => page("Protocols/Home", {}, "html"))
        return out
    },
    then(out) {
        const list = out.read.protocolList
        protocol(list, "smtpIn").state == "disabled" && protocol(list, "smtpIn").built == true
        protocol(list, "smtpIn").reason.includes("smtp_listen_port")
        // the web protocols stand with the web listener: ready on a running server, configured in a run that opened none
        protocol(list, "dav").state == (out.read.serverStarted ? "ready" : "notStarted")
        protocol(list, "wopi").state == "absent" && protocol(list, "speechLocal").state == "absent"
        // call media: absent where the build has none; where it has it, on in every test run (basic-comms' test/MoquiConf.xml
        // sets rtc_media_port, for its call specs), so configured and not known to run in this run, which opens no listeners
        protocol(list, "rtc").state ==
            (ec.factory.hasFeature("rtc") ? (out.read.serverStarted ? "ready" : "notStarted") : "absent")
        new Set(["smtpIn", "dav", "wopi"].map(key => protocol(list, key).stateText)).size == 3
        opened(out.home)
        out.home.output.includes("ProtocolReadiness") && out.home.output.includes("Mail reception")
        out.home.output.includes("smtp_listen_port is not set") && out.home.output.includes("Not in this build")
        out.home.output.includes("Comms/Settings/MailAccounts") && out.home.output.includes("Protocols/MailRelays")
        opened(out.configuration)
        out.configuration.output.includes("EffectiveProtocolSettings") &&
            out.configuration.output.includes("Gateway addresses allowed")
        out.configuration.output.includes("After a restart")
        out.checks.length == 1 && out.checks[0].connectionKey == "smtpIn.configuration" && out.checks[0].lastCheckPassed == "N"
        // the operations operator reads the protocols too; the administrative reader does not open the area
        opened(out.operator) && out.operator.output.includes("Mail reception")
        !opened(out.reader)
    }
})

feature(
    "a failed send shows in MailQueue with its owner link and no body, and is sent again as itself; an uncertain one is settled",
    {
        when() {
            const out = {}
            // the instance sends a notice through the relay that has no address
            capture.disable()
            out.send = system(() =>
                invoke("org.moqui.mail.EmailServices.send#EmailTemplate", {
                    emailTemplateId: templateId,
                    toAddresses: address,
                    bodyParameters: {title: "Acceptance"}
                })
            )
            ec.message.clearErrors()
            capture.enable()
            capture.clear()
            const failedId = out.send.emailMessageId
            out.failed = outcome(failedId)
            out.queue = asUser(users.operations, () => page("Protocols/MailQueue", {emailServerId: relayId}))
            out.asIntegrations = asUser(users.integrations, () => page("Protocols/MailQueue", {emailServerId: relayId}, "html"))
            out.maybe = outcome(maybeId)
            // Send again is not offered for the uncertain one, and the request itself is refused
            post(users.operations, "Protocols/MailQueue/retryOutcome", {
                emailMessageId: maybeId,
                expectedRevision: out.maybe.revision
            })
            out.uncertainSends = capture.count()
            post(users.operations, "Protocols/MailQueue/retryOutcome", {
                emailMessageId: failedId,
                expectedRevision: out.failed.revision,
                operationKey: "retry." + failedId
            })
            out.sends = capture.count()
            out.sent = stored(failedId)
            post(users.operations, "Protocols/MailQueue/settleOutcome", {
                emailMessageId: maybeId,
                resolution: "delivered",
                reason: "Acceptance: the relay's log shows it",
                expectedRevision: out.maybe.revision
            })
            out.settled = stored(maybeId)
            out.settledRow = outcome(maybeId)
            out.sendsEnd = capture.count()
            out.messages = system(() => Number(find(MESSAGE, {emailServerId: relayId}).count()))
            return out
        },
        then(out) {
            out.send.deliveryOutcome == "retryable" && !!out.send.emailMessageId
            out.failed.state == "retryable" && out.failed.retryEligible == true && out.failed.recipientCount == 1
            out.failed.ownerKind == "mailService" && out.failed.ownerTitle == "Acceptance protocols notice"
            opened(out.queue)
            out.queue.output.includes(out.send.emailMessageId) && out.queue.output.includes("Not sent")
            out.queue.output.includes("Send again") && out.queue.output.includes("Acceptance protocols notice")
            out.queue.output.includes("May have been sent") && out.queue.output.includes("Settle_" + maybeId)
            !out.queue.output.includes(subject) && !out.queue.output.includes("private body")
            !out.queue.output.includes("acceptprotocols.example.test")
            // the integration administrator, who keeps the relays, reads the instance's own mail and is offered no action
            out.asIntegrations.output.includes(out.send.emailMessageId) && !out.asIntegrations.output.includes("Send again")
            out.asIntegrations.output.includes("Protocols/MailRelayDetail")
            out.maybe.state == "uncertain" && out.maybe.retryEligible == false && out.maybe.reconcileEligible == true
            out.uncertainSends == 0
            out.sends == 1 && out.sent.statusId == "ES_SENT" && out.sent.sendOutcome == null
            // settled apart: the message is never marked Sent by a person and keeps what the transport left; the settlement
            // (what was reported, who, when, why) is beside it and it is listed as settled
            out.settled.statusId == "ES_READY" && out.settled.sendOutcome == "uncertain" && out.sendsEnd == 1
            out.settled.sendSettlement == "delivered" && !!out.settled.sendSettledByUserId && !!out.settled.sendSettledDate
            out.settledRow.state == "settled" && out.settledRow.stateText == "Settled: reported delivered"
            out.settledRow.retryEligible == false && out.settledRow.reconcileEligible == false
            // no second message was made: the failed one, sent again, and the uncertain one
            out.messages == 2
        }
    }
)
