// System messages, recovery and message types in Admin (impl-admin P13; design-admin §8 MessageTypes, MessageTypeDetail,
// SystemMessages and SystemMessageDetail, §15.3 "Unknown provider outcome" and "Independent failure"): SystemMessages' one qvt
// render as Ziziwork Retail's operations operator lists the failed and stuck messages of a remote with the class of each
// failure and no content, and reviews a chosen batch message by message; SystemMessageDetail's one qvt render offers a
// message whose outcome is unknown Settle and no retry, and says why its content is not shown; MessageTypes' and
// MessageTypeDetail's one qvt render each, as the integration administrator, tell a type changed here from its owner's
// deployment and offer only its registered handlers. The actions go through the screens' transitions: a batch of three with
// one ineligible names it and retries the others, once for its key; the unknown one is settled (its report kept beside it, its
// status left as the transport left it) and never sent; a type is
// given its registered handler by the integration administrator only. The area opens to the operator for the two message
// screens only, and to the reader not at all. The four screens are the framework's System › Integrations screens at Admin's
// locations (mr-moqui plans/archive/Admin-Screens-Down.md): a transition of their instance administrator's part (updateMessage) is
// not on Admin's route, for the operator and for ADMIN. The framework's rules are the framework's AdminRecovery spec, Commerce's
// registered retry Mantle's StoreChannels. The HTTP fixtures answer every send: nothing leaves the machine.
// Run: ./moq test mr-boss --spec AdminSystemMessages
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, page} = lib
const MESSAGE = "moqui.service.message.SystemMessage"
const TYPE = "moqui.service.message.SystemMessageType"
const REMOTE = "moqui.service.message.SystemMessageRemote"
const REST = "org.moqui.impl.SystemMessageServices.send#SystemMessageRest"
const NOOP = "org.moqui.impl.BasicServices.noop"
const types = {out: "SpecAdmSmOut", plain: "SpecAdmSmPlain", incoming: "SpecAdmSmIn"}
const remoteId = "SpecAdmSmRemote"
const ids = {
    first: "SPEC_ADM_SM_1",
    second: "SPEC_ADM_SM_2",
    plain: "SPEC_ADM_SM_PLAIN",
    unknown: "SPEC_ADM_SM_UNKNOWN",
    settled: "SPEC_ADM_SM_SETTLED"
}
const url = "https://adminmessages.example.test/hook"
const payload = '{"order":"spec admin private payload"}'
const http = ec.factory.getTool("HttpFixtures")
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const message = systemMessageId => system(() => find(MESSAGE, {systemMessageId}).one()?.getMap() || null)
const revision = systemMessageId => String(Number(message(systemMessageId).lastUpdatedStamp))
const type = systemMessageTypeId => system(() => find(TYPE, {systemMessageTypeId}).one()?.getMap() || null)
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0

spec({
    setupSpec() {
        http.enable()
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.create()
            }
            make(TYPE, {systemMessageTypeId: types.out, description: "Spec admin outgoing", sendServiceName: REST})
            make(TYPE, {systemMessageTypeId: types.plain, description: "Spec admin unregistered", sendServiceName: REST})
            make(TYPE, {systemMessageTypeId: types.incoming, description: "Spec admin incoming"})
            make(REMOTE, {
                systemMessageRemoteId: remoteId,
                description: "Spec admin remote",
                sendUrl: url,
                sendAuthEnumId: "SmatNone"
            })
            make("moqui.server.RecoveryDescriptor", {
                descriptorKey: "specAdmSmOut",
                targetKind: "SystemMessage",
                targetKey: types.out,
                direction: "out",
                ownerApp: "Spec owner",
                title: "Spec admin messages",
                retryMode: "native",
                reconcileMode: "native",
                cancelMode: "native",
                idempotencyNote: "The receiver keeps one message for an id."
            })
            make("moqui.server.MessageHandler", {
                handlerKey: "specAdmSmConsume",
                systemMessageTypeId: types.incoming,
                handlerRole: "consume",
                serviceName: NOOP,
                title: "Spec admin consumer",
                ownerApp: "Spec owner"
            })
            const hours = 3600000
            const failed = (systemMessageId, fields = {}) => {
                make(
                    MESSAGE,
                    Object.assign(
                        {
                            systemMessageId,
                            systemMessageTypeId: types.out,
                            systemMessageRemoteId: remoteId,
                            statusId: "SmsgError",
                            isOutgoing: "Y",
                            initDate: Date.now() - 3 * hours,
                            lastAttemptDate: Date.now() - 2 * hours,
                            failCount: 2,
                            messageId: "ENV-" + systemMessageId,
                            messageText: payload
                        },
                        fields
                    )
                )
                if (!fields.statusId)
                    make("moqui.service.message.SystemMessageError", {
                        systemMessageId,
                        errorDate: Date.now() - 2 * hours,
                        attemptedStatusId: "SmsgSent",
                        errorText:
                            "System message " +
                            systemMessageId +
                            ' send error response (500): {"detail":"spec admin private remote body"}'
                    })
            }
            failed(ids.first)
            failed(ids.second)
            failed(ids.plain, {systemMessageTypeId: types.plain})
            // a send that never answered
            failed(ids.unknown, {statusId: "SmsgSending", failCount: 0})
            // and one a person settled: the report is beside it, its status as the transport left it
            failed(ids.settled, {
                statusId: "SmsgSending",
                failCount: 0,
                outcomeSettlement: "notDone",
                outcomeSettledDate: Date.now() - hours,
                outcomeSettledReason: "Spec: not in the log of the remote"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const messageIds = Object.values(ids)
        ec.entity.find("moqui.service.message.SystemMessageError").condition("systemMessageId", "in", messageIds).deleteAll()
        ec.entity.find(MESSAGE).condition("systemMessageId", "in", messageIds).deleteAll()
        ec.entity.find("moqui.server.OperationResult").condition("operationKey", "like", "recovery:spec-adm-sm%").deleteAll()
        ec.entity.find("moqui.server.RecoveryDescriptor").condition("descriptorKey", "specAdmSmOut").deleteAll()
        ec.entity.find("moqui.server.MessageHandler").condition("handlerKey", "specAdmSmConsume").deleteAll()
        ec.entity.find(REMOTE).condition("systemMessageRemoteId", remoteId).deleteAll()
        ec.entity.find(TYPE).condition("systemMessageTypeId", "in", Object.values(types)).deleteAll()
        ec.artifactExecution.enableAuthz()
        http.reset()
    }
})

feature(
    "SystemMessages lists failures with no content and reviews a batch; SystemMessageDetail settles an unknown outcome; the message types tell what is changed here",
    {
        when() {
            return {
                // the four screens' one render each
                list: asUser(users.operations, () =>
                    page("Integrations/SystemMessages", {
                        state: "all",
                        systemMessageRemoteId: remoteId,
                        bulkIds: [ids.first, ids.plain, ids.unknown].join(","),
                        bulkAction: "retry"
                    })
                ),
                detail: asUser(users.operations, () =>
                    page("Integrations/SystemMessageDetail", {systemMessageId: ids.unknown, showContent: "Y"})
                ),
                types: asUser(users.integrations, () => page("Integrations/MessageTypes", {term: "Spec admin"})),
                typeDetail: asUser(users.integrations, () =>
                    page("Integrations/MessageTypeDetail", {systemMessageTypeId: types.incoming})
                )
            }
        },
        then({list, detail, types: typeList, typeDetail}) {
            opened(list)
            list.output.includes("MessageList") && Object.values(ids).every(id => list.output.includes(id))
            list.output.includes("Failed") && list.output.includes("May have been sent")
            list.output.includes("HTTP 500: the remote failed") && list.output.includes("Spec owner")
            list.output.includes("No recovery is registered")
            // a settled one is its own state, with the report and no word that it was sent
            list.output.includes("Settled: reported not sent") && list.output.includes("Spec: not in the log of the remote")
            list.output.includes("Settled by a person")
            // the review: each message's own answer for the chosen action
            list.output.includes("BulkRecoveryReview") && list.output.includes("BulkRecoveryConfirm")
            list.output.includes("it is settled first") && list.output.includes("The receiver keeps one message for an id.")
            // no content of a message and nothing a remote answered
            !/private payload|private remote body/.test(list.output)
            opened(detail)
            detail.output.includes("MessageEvidence") && detail.output.includes("MessageAttempts")
            detail.output.includes("May have been sent") && detail.output.includes("ENV-" + ids.unknown)
            // an unknown outcome: settled, never retried
            detail.output.includes("Recover_reconcile") && !detail.output.includes("Recover_retry")
            detail.output.includes("Reported sent (the remote has it)")
            // its owner registered no permission that reads its content: asked for or not, it is not shown
            detail.output.includes("shows what this message holds in its own screens only")
            !detail.output.includes("private payload")
            opened(typeList)
            typeList.output.includes("MessageTypeList") && typeList.output.includes("Spec admin incoming")
            typeList.output.includes("Changed here") && typeList.output.includes("deployment")
            opened(typeDetail)
            typeDetail.output.includes("MessageContract") && typeDetail.output.includes("MessageContractUse")
            typeDetail.output.includes("Spec admin consumer")
            typeDetail.output.includes("How the instance takes what a remote posts is not chosen here")
        }
    }
)

feature(
    "a batch names its ineligible message and retries the others once; the area opens to the operator for its two screens only",
    {
        when() {
            const out = {}
            http.clear()
            http.add({method: "POST", url, status: 200, contentType: "application/json", body: "{}"})
            const batch = () => ({
                action: "retry",
                reason: "Spec: the remote is back",
                operationKey: "spec-adm-sm-batch",
                targetsJson: JSON.stringify(
                    [ids.first, ids.plain, ids.second].map(targetId => ({targetId, expectedRevision: revision(targetId)}))
                )
            })
            // the reader does not open the area, and the integration administrator holds no operation permission
            post(users.reader, "Integrations/SystemMessages/recoverMessages", batch())
            post(users.integrations, "Integrations/SystemMessages/recoverMessages", batch())
            out.untouched = message(ids.first).statusId
            out.refusedSends = http.count()
            post(users.operations, "Integrations/SystemMessages/recoverMessages", batch())
            out.afterBatch = [ids.first, ids.plain, ids.second].map(id => message(id).statusId).join()
            // the same form sent twice answers the first results
            post(users.operations, "Integrations/SystemMessages/recoverMessages", batch())
            out.sends = http.count()
            // the unknown one: what was found, with the reason; nothing is sent
            post(users.operations, "Integrations/SystemMessageDetail/recoverMessage", {
                systemMessageId: ids.unknown,
                action: "retry",
                reason: "Spec: try anyway",
                expectedRevision: revision(ids.unknown)
            })
            out.unknownAfterRetry = message(ids.unknown).statusId
            post(users.operations, "Integrations/SystemMessageDetail/recoverMessage", {
                systemMessageId: ids.unknown,
                action: "reconcile",
                resolution: "done",
                reason: "Spec: the remote's log has it",
                expectedRevision: revision(ids.unknown)
            })
            out.sendsAtEnd = http.count()
            // the System screen's own transitions for an instance administrator (a message's record changed directly) are not
            // taken in here, so they do not exist on Admin's route: for the operator, whose area grant is an inheritable
            // always-allow, and for ADMIN
            for (const user of [users.operations, users.system])
                post(user, "Integrations/SystemMessageDetail/updateMessage", {
                    systemMessageId: ids.plain,
                    remoteMessageId: "SPEC-DIRECT",
                    statusId: "SmsgCancelled"
                })
            out.direct = message(ids.plain)
            // a type's handler: the integration administrator's, among the registered, never the operator's
            const save = user =>
                post(user, "Integrations/MessageTypeDetail/saveType", {
                    systemMessageTypeId: types.incoming,
                    expectedRevision: String(Number(type(types.incoming).lastUpdatedStamp)),
                    description: "Spec admin incoming",
                    consumeHandlerKey: "specAdmSmConsume",
                    reason: "Spec: its consumer"
                })
            save(users.operations)
            out.operatorHandler = type(types.incoming).consumeServiceName
            save(users.integrations)
            // the area's other screens stay the integration administrator's, and the reader opens none of it
            out.operatorConnections = post(users.operations, "Integrations/Connections", {})
            out.operatorTypes = post(users.operations, "Integrations/MessageTypes", {})
            out.readerMessages = post(users.reader, "Integrations/SystemMessages", {})
            return out
        },
        then(out) {
            out.untouched == "SmsgError" && out.refusedSends == 0
            // the two registered ones went, as themselves; the unregistered one is named and left
            out.afterBatch == "SmsgSent,SmsgError,SmsgSent"
            out.sends == 2
            http.requests().every(request => request.body === payload)
            out.unknownAfterRetry == "SmsgSending"
            // settled: the report is beside the message, which is not marked sent
            message(ids.unknown).statusId == "SmsgSending"
            message(ids.unknown).outcomeSettlement == "done"
            message(ids.unknown).outcomeSettledReason == "Spec: the remote's log has it"
            out.sendsAtEnd == 2
            out.direct.statusId == "SmsgError" && out.direct.remoteMessageId != "SPEC-DIRECT"
            out.operatorHandler == null
            type(types.incoming).consumeServiceName == NOOP
            !opened(out.operatorConnections) && !out.operatorConnections.output.includes("ConnectionList")
            !opened(out.operatorTypes) && !out.operatorTypes.output.includes("MessageTypeList")
            !opened(out.readerMessages) && !out.readerMessages.output.includes("MessageList")
        }
    }
)
