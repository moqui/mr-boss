// Commerce P13's "usable when" (impl-commerce P13; design-commerce §12.2 scenario 12, its import half), as an acceptance
// scenario through the channel operator's services and Commerce's Integrations screens with artifact authorization on: the
// channel operator binds the demo store to the channel order connector; the operator sets its credentials and the channel
// operator enables it; two marketplace orders arrive over the API's intake (receive#IncomingSystemMessage, as /rest/sm calls
// it) and are made; a file is imported with one of them again unchanged, the other changed, a new order and one of a product
// the store does not sell: the duplicate makes no second order, the conflict is quarantined with what differs, the new order
// is made and the failing one does not stop the rest; once the product is published, retrying the failed order keeps its
// message and external ID and makes its order once. The rules are Mantle's StoreChannels and CommerceChannels'.
// Run: ./moq accept mr-boss --spec CommerceChannelsScenario
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const I = "mantle.product.StoreChannelServices."
const SM = "moqui.service.message.SystemMessage"
const stamp = String(Date.now()).slice(-6)
const ext = n => "ZM" + stamp + "-" + n
const itemId = "BOSS_COM13_ITEM_" + stamp
const walk = {}
const list = (entity, conditions) =>
    system(() => Array.from(ec.entity.find(entity).condition(conditions).useCache(false).list()).map(row => row.getMap()))
const as = (user, service, parameters) => asUser(user, () => invoke(I + service, parameters), false)
const orderOf = externalId => ({externalId, items: [{lineId: "1", productId: "DEMO_1_1", quantity: "1", unitAmount: "15.00"}]})

spec({
    setupSpec() {
        login("john.doe")
        // a product of the store's organization that the store does not sell yet
        system(() => {
            ec.service
                .sync()
                .name("create#mantle.product.Product")
                .parameters({
                    productId: itemId,
                    productName: "Marketplace-only item",
                    productTypeEnumId: "PtService",
                    ownerPartyId: ids.organizationId
                })
                .call()
        })
    }
})

feature("the channel operator binds the demo store; it is enabled only once the operator has set its credentials", {
    when() {
        const made = as(users.channel, "store#StoreIntegration", {
            productStoreId: ids.storeId,
            connectorId: "ChannelOrders",
            description: "Marketplace API " + stamp,
            customerPartyId: "BOSS_COM_MARKETPLACE"
        })
        walk.remoteId = made.systemMessageRemoteId
        const early = asUser(
            users.channel,
            () => lib.refusal(I + "store#StoreIntegration", {systemMessageRemoteId: walk.remoteId, enabled: "Y"}),
            false
        )
        // the operator sets the endpoint's secret in the System tools
        system(() =>
            ec.service
                .sync()
                .name("update#moqui.service.message.SystemMessageRemote")
                .parameters({
                    systemMessageRemoteId: walk.remoteId,
                    sharedSecret: "acceptance-" + stamp
                })
                .call()
        )
        const enabled = asUser(
            users.channel,
            () => lib.refusal(I + "store#StoreIntegration", {systemMessageRemoteId: walk.remoteId, enabled: "Y"}),
            false
        )
        const read = as(users.channel, "get#StoreIntegration", {systemMessageRemoteId: walk.remoteId})
        return {early, enabled, read: read.integration, shown: JSON.stringify(read)}
    },
    then({early, enabled, read, shown}) {
        early.includes("CREDENTIALS_REQUIRED")
        enabled == ""
        read.enabled == true
        read.credentialsText == "Set"
        !shown.includes("acceptance-" + stamp)
    }
})

feature("orders arrive over the API's intake and are made", {
    when() {
        system(() =>
            ec.service
                .sync()
                .name("org.moqui.impl.SystemMessageServices.receive#IncomingSystemMessage")
                .parameters({
                    systemMessageTypeId: "StoreChannelOrders",
                    systemMessageRemoteId: walk.remoteId,
                    messageText: JSON.stringify({orders: [orderOf(ext(1)), orderOf(ext(2))]})
                })
                .call()
        )
        const deadline = Date.now() + 20000
        const made = () => list(SM, {systemMessageRemoteId: walk.remoteId, docType: "ChannelOrder"}).filter(row => row.orderId)
        while (made().length < 2 && Date.now() < deadline) ec.factory.waitWorkerPoolEmpty(50)
        return {made: made(), orders: list("mantle.order.OrderHeader", {productStoreId: ids.storeId, externalId: ext(1)})}
    },
    then({made, orders}) {
        made.length == 2
        orders.length == 1
        orders[0].statusId == "OrderPlaced"
    }
})

feature(
    "an import with a duplicate and a conflict makes one order for the duplicate, quarantines the conflict and finishes the rest",
    {
        when() {
            const csv = [
                "externalId,lineId,productId,quantity,unitAmount",
                ext(1) + ",1,DEMO_1_1,1,15.00",
                ext(2) + ",1,DEMO_1_1,3,15.00",
                ext(3) + ",1,DEMO_1_1,2,15.00",
                ext(4) + ",1," + itemId + ",1,9.00"
            ].join("\n")
            const prepared = as(users.channel, "prepare#ChannelImport", {
                systemMessageRemoteId: walk.remoteId,
                formatEnumId: "SciCsv",
                importText: csv,
                fileName: "marketplace-" + stamp + ".csv"
            })
            walk.batchId = prepared.batch.systemMessageId
            const committed = as(users.channel, "commit#ChannelImport", {
                systemMessageId: walk.batchId,
                digest: prepared.batch.digest,
                reason: "Marketplace export " + stamp
            })
            const preview = Object.fromEntries(Array.from(prepared.rows).map(row => [row.rowKey, row.outcome]))
            const outcome = Object.fromEntries(Array.from(committed.rows).map(row => [row.rowKey, row]))
            walk.failedId = outcome[ext(4)]?.systemMessageId
            const conflict = outcome[ext(2)]
            const evidence = conflict
                ? list("moqui.service.message.SystemMessageError", {systemMessageId: conflict.systemMessageId})[0]?.errorText
                : ""
            return {
                preview,
                outcome,
                evidence,
                firstOrders: list("mantle.order.OrderHeader", {productStoreId: ids.storeId, externalId: ext(1)}),
                newOrders: list("mantle.order.OrderHeader", {productStoreId: ids.storeId, externalId: ext(3)})
            }
        },
        then({preview, outcome, evidence, firstOrders, newOrders}) {
            preview[ext(1)] == "duplicate"
            preview[ext(2)] == "conflict"
            preview[ext(3)] == "new"
            preview[ext(4)] == "error"
            outcome[ext(1)].outcome == "duplicate"
            outcome[ext(2)].outcome == "conflict"
            outcome[ext(3)].outcome == "applied"
            outcome[ext(4)].outcome == "failed"
            firstOrders.length == 1
            newOrders.length == 1
            evidence.includes("items.0.quantity 1 → 3")
        }
    }
)

feature("retrying the failed order once its product is sold keeps its identity and makes its order once", {
    when() {
        system(() =>
            ec.service
                .sync()
                .name("create#mantle.product.store.ProductStoreProduct")
                .parameters({
                    productStoreId: ids.storeId,
                    productId: itemId,
                    fromDate: ec.user.nowTimestamp,
                    publicationKindEnumId: "PspkPublished",
                    changeReason: "Channel acceptance"
                })
                .call()
        )
        // and in the store's view and purchase category (PopcAllProducts)
        const memberFrom = ec.user.nowTimestamp
        system(() =>
            ec.service
                .sync()
                .name("create#mantle.product.category.ProductCategoryMember")
                .parameters({
                    productCategoryId: "PopcAllProducts",
                    productId: itemId,
                    fromDate: memberFrom
                })
                .call()
        )
        const retry = {
            systemMessageRemoteId: walk.remoteId,
            systemMessageIds: walk.failedId,
            reason: "Product now sold",
            operationKey: "accept-retry-" + stamp
        }
        const first = as(users.channel, "retry#StoreMessages", retry)
        const second = as(users.channel, "retry#StoreMessages", retry)
        const message = list(SM, {systemMessageId: walk.failedId})[0]
        const orders = list("mantle.order.OrderHeader", {productStoreId: ids.storeId, externalId: ext(4)})
        // the item is withdrawn again and leaves the category, so the demo store's assortment is as it was
        system(() => {
            const row = ec.entity
                .find("mantle.product.store.ProductStoreProduct")
                .condition({productStoreId: ids.storeId, productId: itemId})
                .one()
            ec.service
                .sync()
                .name("update#mantle.product.store.ProductStoreProduct")
                .parameters({
                    productStoreId: ids.storeId,
                    productId: itemId,
                    fromDate: row.fromDate,
                    thruDate: ec.user.nowTimestamp
                })
                .call()
            ec.service
                .sync()
                .name("update#mantle.product.category.ProductCategoryMember")
                .parameters({
                    productCategoryId: "PopcAllProducts",
                    productId: itemId,
                    fromDate: memberFrom,
                    thruDate: ec.user.nowTimestamp
                })
                .call()
        })
        return {first, second, message, orders}
    },
    then({first, second, message, orders}) {
        first.retriedCount == 1
        second.alreadyApplied == true
        message.messageId == ext(4)
        message.orderId == orders[0].orderId
        orders.length == 1
    }
})

feature("Integrations, IntegrationDetail and ChannelImport show it to the channel operator (qvt, artifact authorization on)", {
    when() {
        return asUser(users.channel, () => ({
            list: page("Integrations/Integrations"),
            detail: page("Integrations/IntegrationDetail", {systemMessageRemoteId: walk.remoteId, state: "conflict"}),
            batch: page("Integrations/ChannelImport", {systemMessageId: walk.batchId}),
            source: page("Integrations/ChannelImport")
        }))
    },
    then({list, detail, batch, source}) {
        list.errors.length == 0
        list.output.includes("Marketplace API " + stamp)
        detail.errors.length == 0
        detail.output.includes("Conflict, quarantined")
        batch.errors.length == 0
        batch.output.includes("Marketplace export " + stamp)
        source.errors.length == 0
        source.output.includes("Read the file")
    }
})
