// Protocols and the mail queue in Admin (impl-admin P12; design-admin §9 ProtocolsHome, MailQueue and ServerConfiguration,
// §15.3 "Protocol readiness" and "Unknown provider outcome"): MailQueue's one qvt render as Ziziwork Retail's operations
// operator lists a failed send with its owner's link and the next step, and no subject, body or address; ProtocolsHome's and
// ServerConfiguration's one qvt render each, as the integration administrator, tell a protocol that is off from one that is
// not in the build and show the configuration read only; the queue's actions go through the screen's transitions (a
// message known not sent is sent again as itself, one that may have gone is settled and never sent, a mail account's is
// left to its sender); the area opens to the operator for these three screens only, and to the reader not at all. The
// framework's rules are the framework's AdminProtocols and AdminMailOutcomes specs, the delivery ledger's Mantle's
// DeliveryLedger. Mail is captured: nothing leaves the machine.
// Run: ./moq test mr-boss --spec AdminMailQueue
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, page} = lib
const MESSAGE = "moqui.basic.email.EmailMessage"
const SERVER = "moqui.basic.email.EmailServer"
const CHECK = "moqui.server.ConnectionCheck"
const serverId = "SpecAdmMqRelay"
const ids = {failed: "SPEC_ADM_MQ_FAILED", maybe: "SPEC_ADM_MQ_MAYBE", account: "SPEC_ADM_MQ_ACCT", other: "SPEC_ADM_MQ_OTHER"}
const subject = "Spec admin queue private subject"
const body = "Spec admin queue private body"
const capture = ec.factory.getTool("MailCapture")
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const message = emailMessageId => system(() => find(MESSAGE, {emailMessageId}).one()?.getMap() || null)
const revision = emailMessageId => String(Number(message(emailMessageId).lastUpdatedStamp))
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0

spec({
    setupSpec() {
        capture.enable()
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.create()
            }
            make(SERVER, {emailServerId: serverId, smtpHost: "127.0.0.1", smtpPort: "9", smtpStartTls: "N"})
            make("moqui.basic.email.EmailAccount", {emailAccountId: ids.account, emailServerId: serverId})
            const failed = (emailMessageId, fields = {}) =>
                make(
                    MESSAGE,
                    Object.assign(
                        {
                            emailMessageId,
                            statusId: "ES_READY",
                            emailServerId: serverId,
                            fromAddress: "notices@adminqueue.example.test",
                            toAddresses: "ada@adminqueue.example.test, bob@adminqueue.example.test",
                            subject,
                            body,
                            bodyText: body,
                            sendError: "451 4.3.0 <ada@adminqueue.example.test>: try again later",
                            sendOutcome: "retryable"
                        },
                        fields
                    )
                )
            failed(ids.failed)
            failed(ids.other)
            failed(ids.maybe, {sendOutcome: "uncertain", sendError: "The SMTP session stopped before its end"})
            failed(ids.account, {emailAccountId: ids.account})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        ec.entity.find(MESSAGE).condition("emailMessageId", "in", Object.values(ids)).deleteAll()
        ec.entity.find("moqui.basic.email.EmailAccount").condition("emailAccountId", ids.account).deleteAll()
        ec.entity.find(SERVER).condition("emailServerId", serverId).deleteAll()
        ec.entity.find(CHECK).condition("adapterKey", "protocol").deleteAll()
        ec.entity.find("moqui.server.OperationResult").condition("targetKey", "in", Object.values(ids)).deleteAll()
        ec.artifactExecution.enableAuthz()
        capture.reset()
    }
})

feature(
    "MailQueue lists a failed send with its owner link and no body; ProtocolsHome and ServerConfiguration tell the protocols apart",
    {
        when() {
            return {
                // the three screens' one render each
                queue: asUser(users.operations, () => page("Protocols/MailQueue", {emailServerId: serverId})),
                home: asUser(users.integrations, () => page("Protocols/Home")),
                configuration: asUser(users.integrations, () => page("Protocols/ServerConfiguration", {protocolKey: "smtpIn"}))
            }
        },
        then({queue, home, configuration}) {
            opened(queue)
            queue.output.includes("MailQueueList") && queue.output.includes(ids.failed) && queue.output.includes(ids.maybe)
            queue.output.includes("Not sent") && queue.output.includes("May have been sent")
            // what each owner allows: the mail service's own is sent again or settled here, a mail account's is its sender's
            queue.output.includes("Send again") && queue.output.includes("Settle_" + ids.maybe)
            queue.output.includes("Comms/Settings/MailAccounts") && queue.output.includes("Mail account, in Comms")
            queue.output.includes("(address)")
            !queue.output.includes("Settle_" + ids.account)
            // no subject, body or address
            !/private subject|private body|adminqueue\.example\.test/.test(queue.output)
            opened(home)
            home.output.includes("ProtocolReadiness") && home.output.includes("Mail reception")
            // off, and not in the build, are different answers with their reasons
            home.output.includes("smtp_listen_port is not set") && home.output.includes("Office documents")
            home.output.includes("Not in this build") && home.output.includes("No build has it yet")
            home.output.includes("Comms/Settings/MailAccounts") && home.output.includes("Protocols/MailRelays")
            home.output.includes("opened no listeners")
            opened(configuration)
            configuration.output.includes("EffectiveProtocolSettings") && configuration.output.includes("ProtocolChecks")
            configuration.output.includes("Gateway addresses allowed") && configuration.output.includes("After a restart")
            configuration.output.includes("Mail reception: Off")
            // one protocol's settings alone
            !configuration.output.includes("SIP port")
        }
    }
)

feature("the queue's actions go through its transitions; the area opens to the operator for its three screens only", {
    when() {
        const out = {}
        capture.clear()
        const retry = (user, emailMessageId) =>
            post(user, "Protocols/MailQueue/retryOutcome", {
                emailMessageId,
                expectedRevision: revision(emailMessageId),
                operationKey: "retry." + emailMessageId
            })
        // the reader does not open the area, and the integration administrator holds no operation permission
        retry(users.reader, ids.failed)
        retry(users.integrations, ids.failed)
        out.untouched = message(ids.failed).statusId
        out.refusedSends = capture.count()
        retry(users.operations, ids.failed)
        // the same form sent twice answers the first result
        retry(users.operations, ids.failed)
        retry(users.operations, ids.maybe)
        retry(users.operations, ids.account)
        out.sends = capture.count()
        post(users.operations, "Protocols/MailQueue/settleOutcome", {
            emailMessageId: ids.maybe,
            resolution: "notSent",
            reason: "Spec: the relay's log has no such message",
            expectedRevision: revision(ids.maybe)
        })
        post(users.operations, "Protocols/MailQueue/settleOutcome", {
            emailMessageId: ids.other,
            resolution: "abandon",
            reason: "Spec: the notice is out of date",
            expectedRevision: revision(ids.other)
        })
        // a protocol check is the integration administrator's: the operator's request keeps nothing
        post(users.operations, "Protocols/ServerConfiguration/runCheck", {checkProtocolKey: "smtpIn", checkKey: "configuration"})
        out.operatorChecks = system(() => Number(find(CHECK, {adapterKey: "protocol"}).count()))
        post(users.integrations, "Protocols/ServerConfiguration/runCheck", {
            checkProtocolKey: "smtpIn",
            checkKey: "configuration"
        })
        out.checks = system(() => Array.from(find(CHECK, {adapterKey: "protocol"}).list()).map(row => row.connectionKey))
        // the area's other screens stay the integration administrator's, and the reader opens none of it
        out.operatorRelays = post(users.operations, "Protocols/MailRelays", {})
        out.readerQueue = post(users.reader, "Protocols/MailQueue", {})
        return out
    },
    then(out) {
        out.untouched == "ES_READY" && out.refusedSends == 0
        message(ids.failed).statusId == "ES_SENT"
        out.sends == 1
        message(ids.maybe).statusId == "ES_READY" && message(ids.maybe).sendOutcome == "retryable"
        message(ids.account).statusId == "ES_READY" && message(ids.account).sendClaimDate == null
        message(ids.other).statusId == "ES_CANCELLED"
        out.operatorChecks == 0
        out.checks.join() == "smtpIn.configuration"
        !opened(out.operatorRelays)
        !out.operatorRelays.output.includes("RelayList")
        !opened(out.readerQueue)
        !out.readerQueue.output.includes("MailQueueList")
    }
})
