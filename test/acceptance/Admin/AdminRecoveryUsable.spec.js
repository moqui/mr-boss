// Admin P13's "usable when" (impl-admin P13; design-admin §8 SystemMessages and SystemMessageDetail, §15.3 "Unknown provider
// outcome" and "Independent failure"), as an acceptance walk with artifact authorization on, through the screens and their
// transitions, on the demo:
// - Ziziwork Retail's operations operator retries a failed Commerce channel order through Commerce's own action
//   (retry#StoreMessages, registered by Mantle's store channels as a recovery): the message keeps its id and external ID and
//   its order is made once. The registration adds no right: until the operator also holds Commerce's channel capability
//   the queue says which permission is missing and nothing is retried; a store integration's message is then listed with
//   its owner's state and link.
// - a batch of three with one ineligible (an order already applied) names it and retries the other two, each on its own,
//   and the same form sent again answers the first results;
// - a message whose outcome is unknown (a send that never answered, of a type whose owner registered the message service's
//   own recovery) is offered Settle and never a retry: a retry of it is refused and sends nothing; settling it records
//   the report beside the message and leaves its status as the transport left it; and once it is settled as reported not
//   sent it is retried as itself.
// The HTTP fixtures answer every send: no request leaves the machine. The rules are the framework's AdminRecovery, Mantle's
// StoreChannels and BOSS's AdminSystemMessages.
// Run: ./moq accept mr-boss --spec AdminRecoveryUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, invoke, page} = lib
const O = "org.moqui.admin.OperationServices."
const I = "mantle.product.StoreChannelServices."
const MESSAGE = "moqui.service.message.SystemMessage"
const TYPE = "moqui.service.message.SystemMessageType"
const REMOTE = "moqui.service.message.SystemMessageRemote"
const storeId = "POPC_DEFAULT"
const channelUser = "commerce.channel"
const operationsUserId = "BOSS_ADM_OPERATIONS"
const commerceGroups = ["BOSS_COMMERCE", "BOSS_COMMERCE_CHANNEL_OPERATOR"]
const stamp = String(Date.now()).slice(-6)
const ext = n => "AR" + stamp + "-" + n
const itemId = "BOSS_ADM13_ITEM_" + stamp
const typeId = "AcceptAdmRecovery"
const remoteId = "AcceptAdmRecovery"
const unknownId = "ACCEPT_ADM_RC_" + stamp
const url = "https://acceptrecovery.example.test/hook"
const walk = {}
const http = ec.factory.getTool("HttpFixtures")
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const list = (entityName, conditions) =>
    system(() => Array.from(find(entityName, conditions).useCache(false).list()).map(row => row.getMap()))
const message = systemMessageId => list(MESSAGE, {systemMessageId})[0] || null
const queueRow = systemMessageId =>
    asUser(users.operations, () => invoke(O + "find#Messages", {reference: systemMessageId, state: "all"}).messageList[0])
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const call = (service, parameters) => ec.service.sync().name(service).parameters(parameters).call()
const orderOf = (externalId, productId) => ({externalId, items: [{lineId: "1", productId, quantity: "1", unitAmount: "15.00"}]})
// the channel orders of the walk's integration by external ID, once the intake's consume has run
function channelOrders(externalIds) {
    const found = () =>
        list(MESSAGE, {systemMessageRemoteId: walk.remoteId, docType: "ChannelOrder"}).filter(row =>
            externalIds.includes(row.messageId)
        )
    const settled = () => found().filter(row => row.orderId || Number(row.failCount || 0) > 0 || row.statusId === "SmsgError")
    const deadline = Date.now() + 20000
    while (settled().length < externalIds.length && Date.now() < deadline) ec.factory.waitWorkerPoolEmpty(50)
    return Object.fromEntries(found().map(row => [row.messageId, row]))
}
const batch = (systemMessageIds, operationKey) => ({
    action: "retry",
    reason: "Acceptance: the product is now sold",
    operationKey,
    targetsJson: JSON.stringify(systemMessageIds.map(targetId => ({targetId, expectedRevision: queueRow(targetId).revision})))
})

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
            // a product of the store's organization that the store does not sell yet
            call("create#mantle.product.Product", {
                productId: itemId,
                productName: "Recovery acceptance item",
                productTypeEnumId: "PtService",
                ownerPartyId: lib.ids.organizationId
            })
            // an outgoing type whose owner registered the message service's own recovery, its remote, and a send of it that
            // never answered
            if (!find(TYPE, {systemMessageTypeId: typeId}).one()) {
                make(TYPE, {
                    systemMessageTypeId: typeId,
                    description: "Recovery acceptance notices",
                    sendServiceName: "org.moqui.impl.SystemMessageServices.send#SystemMessageRest"
                })
                make(REMOTE, {
                    systemMessageRemoteId: remoteId,
                    description: "Recovery acceptance remote",
                    sendUrl: url,
                    sendAuthEnumId: "SmatNone"
                })
                make("moqui.server.RecoveryDescriptor", {
                    descriptorKey: "acceptAdmRecovery",
                    targetKind: "SystemMessage",
                    targetKey: typeId,
                    direction: "out",
                    ownerApp: "Acceptance",
                    title: "Recovery acceptance notices",
                    retryMode: "native",
                    reconcileMode: "native",
                    cancelMode: "native",
                    idempotencyNote: "The receiver keeps one notice for an id."
                })
            }
            make(MESSAGE, {
                systemMessageId: unknownId,
                systemMessageTypeId: typeId,
                systemMessageRemoteId: remoteId,
                statusId: "SmsgSending",
                isOutgoing: "Y",
                initDate: Date.now() - 3 * 3600000,
                lastAttemptDate: Date.now() - 2 * 3600000,
                messageText: '{"notice":"acceptance"}'
            })
        })
        // the demo store bound to the channel order connector by its channel operator, its endpoint's secret set by the
        // operator of the server, then enabled
        const made = asUser(
            channelUser,
            () =>
                invoke(I + "store#StoreIntegration", {
                    productStoreId: storeId,
                    connectorId: "ChannelOrders",
                    description: "Recovery acceptance " + stamp,
                    customerPartyId: "BOSS_COM_MARKETPLACE"
                }),
            false
        )
        walk.remoteId = made.systemMessageRemoteId
        system(() =>
            call("update#moqui.service.message.SystemMessageRemote", {
                systemMessageRemoteId: walk.remoteId,
                sharedSecret: "acceptance-" + stamp
            })
        )
        asUser(
            channelUser,
            () => invoke(I + "store#StoreIntegration", {systemMessageRemoteId: walk.remoteId, enabled: "Y"}),
            false
        )
        // three orders arrive: one of a product the store sells, two of the one it does not sell yet
        system(() =>
            call("org.moqui.impl.SystemMessageServices.receive#IncomingSystemMessage", {
                systemMessageTypeId: "StoreChannelOrders",
                systemMessageRemoteId: walk.remoteId,
                messageText: JSON.stringify({
                    orders: [orderOf(ext(1), "DEMO_1_1"), orderOf(ext(2), itemId), orderOf(ext(3), itemId)]
                })
            })
        )
        const arrived = channelOrders([ext(1), ext(2), ext(3)])
        walk.appliedId = arrived[ext(1)]?.systemMessageId
        walk.failedIds = [arrived[ext(2)]?.systemMessageId, arrived[ext(3)]?.systemMessageId]
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            // the operator leaves Commerce's groups again, and the item the store's assortment
            for (const row of Array.from(
                find("moqui.security.UserGroupMember", {userId: operationsUserId})
                    .condition("userGroupId", "in", commerceGroups)
                    .list()
            ))
                if (row.thruDate == null) {
                    row.set("thruDate", ec.user.nowTimestamp)
                    row.update()
                }
            for (const row of Array.from(
                find("mantle.product.store.ProductStoreProduct", {productStoreId: storeId, productId: itemId}).list()
            ))
                if (row.thruDate == null) {
                    row.set("thruDate", ec.user.nowTimestamp)
                    row.update()
                }
        })
        http.reset()
    }
})

feature(
    "the queue lists a failed channel order with its owner, and retries nothing until the operator holds Commerce's own capability",
    {
        when() {
            const out = {}
            out.before = queueRow(walk.failedIds[0])
            post(
                users.operations,
                "Integrations/SystemMessages/recoverMessages",
                batch([walk.failedIds[0]], "accept-rc-early-" + stamp)
            )
            out.afterEarly = message(walk.failedIds[0])
            // the operator is given Commerce's channel capability, as an access administrator would
            system(() => {
                for (const userGroupId of commerceGroups)
                    call("create#moqui.security.UserGroupMember", {
                        userGroupId,
                        userId: operationsUserId,
                        fromDate: ec.user.nowTimestamp
                    })
            })
            out.held = queueRow(walk.failedIds[0])
            out.listed = post(users.operations, "Integrations/SystemMessages", {
                systemMessageRemoteId: walk.remoteId,
                state: "all"
            })
            return out
        },
        then(out) {
            out.before.state == "retrying" || out.before.state == "failed"
            out.before.ownerApp == "Store channels"
            out.before.retryEligible == false
            // which permission is missing, and nothing of the store's own detail
            out.before.nextStep.includes("COMMERCE_CHANNEL_OPERATE")
            out.before.errorText == "" && !out.before.ownerRef
            !out.afterEarly.orderId
            out.held.retryEligible == true
            out.held.reconcileEligible == false && out.held.cancelEligible == false
            out.held.ownerRef == walk.remoteId
            opened(out.listed)
            out.listed.output.includes("Store channels") && out.listed.output.includes(ext(2))
            out.listed.output.includes("Commerce/Integrations/IntegrationDetail")
            // never a message's content
            !out.listed.output.includes(itemId)
        }
    }
)

feature(
    "a batch of three with one ineligible names it and retries the others through Commerce's action, each keeping its identity",
    {
        when() {
            const out = {}
            system(() => {
                call("create#mantle.product.store.ProductStoreProduct", {
                    productStoreId: storeId,
                    productId: itemId,
                    fromDate: ec.user.nowTimestamp,
                    publicationKindEnumId: "PspkPublished",
                    changeReason: "Recovery acceptance"
                })
                call("create#mantle.product.category.ProductCategoryMember", {
                    productCategoryId: "PopcAllProducts",
                    productId: itemId,
                    fromDate: ec.user.nowTimestamp
                })
            })
            const chosen = [walk.failedIds[0], walk.appliedId, walk.failedIds[1]]
            out.review = post(users.operations, "Integrations/SystemMessages", {
                systemMessageRemoteId: walk.remoteId,
                state: "all",
                bulkIds: chosen.join(","),
                bulkAction: "retry"
            })
            const form = batch(chosen, "accept-rc-batch-" + stamp)
            out.done = asUser(users.operations, () =>
                invoke(O + "execute#Recovery", {
                    targetKind: "SystemMessage",
                    action: "retry",
                    reason: form.reason,
                    operationKey: "accept-rc-direct-" + stamp,
                    targetList: JSON.parse(form.targetsJson)
                })
            )
            // the same batch through the screen, with the revisions it now has: the two are applied, so nothing is retried again
            post(users.operations, "Integrations/SystemMessages/recoverMessages", batch(chosen, "accept-rc-batch-" + stamp))
            out.repeat = asUser(users.operations, () =>
                invoke(O + "execute#Recovery", {
                    targetKind: "SystemMessage",
                    action: "retry",
                    reason: form.reason,
                    operationKey: "accept-rc-direct-" + stamp,
                    targetList: JSON.parse(form.targetsJson)
                })
            )
            out.messages = walk.failedIds.map(message)
            out.orders = [ext(2), ext(3)].map(
                externalId => list("mantle.order.OrderHeader", {productStoreId: storeId, externalId}).length
            )
            return out
        },
        then(out) {
            const result = systemMessageId => Array.from(out.done.resultList).find(row => row.targetId === systemMessageId)
            opened(out.review)
            out.review.output.includes("BulkRecoveryReview") && out.review.output.includes("never made again")
            out.done.appliedCount == 2 && out.done.refusedCount == 1
            result(walk.failedIds[0]).applied == true && result(walk.failedIds[1]).applied == true
            // the applied one is named and left
            result(walk.appliedId).applied == false && result(walk.appliedId).reasonCode == "NOT_FAILED"
            // the same messages, with their external IDs, each with its one order
            out.messages[0].messageId == ext(2) && out.messages[1].messageId == ext(3)
            out.messages.every(row => !!row.orderId)
            out.orders.join() == "1,1"
            out.repeat.repeated == true && out.repeat.appliedCount == 2
        }
    }
)

feature("a message whose outcome is unknown is offered Settle, never a retry; settled as not sent, it is retried as itself", {
    when() {
        const out = {}
        http.clear()
        http.add({method: "POST", url, status: 200, contentType: "application/json", body: "{}"})
        out.detail = post(users.operations, "Integrations/SystemMessageDetail", {systemMessageId: unknownId})
        const act = (action, extra = {}) =>
            post(
                users.operations,
                "Integrations/SystemMessageDetail/recoverMessage",
                Object.assign(
                    {
                        systemMessageId: unknownId,
                        action,
                        reason: "Acceptance: the remote's log",
                        expectedRevision: queueRow(unknownId).revision
                    },
                    extra
                )
            )
        act("retry")
        out.afterRetry = message(unknownId).statusId
        out.sendsAfterRetry = http.count()
        act("reconcile", {resolution: "notDone"})
        out.afterSettle = queueRow(unknownId)
        out.sendsAfterSettle = http.count()
        act("retry")
        out.sends = http.count()
        return out
    },
    then(out) {
        opened(out.detail)
        out.detail.output.includes("May have been sent")
        out.detail.output.includes("Recover_reconcile") && !out.detail.output.includes("Recover_retry")
        out.afterRetry == "SmsgSending" && out.sendsAfterRetry == 0
        // the report is beside the message, which stays as the transport left it until the retry's claim takes it
        out.afterSettle.state == "settled" && out.afterSettle.settlement == "notDone" && out.afterSettle.retryEligible == true
        out.afterSettle.statusId == "SmsgSending"
        out.sendsAfterSettle == 0
        out.sends == 1
        message(unknownId).statusId == "SmsgSent"
        http.requests()[0].body == '{"notice":"acceptance"}'
    }
})
