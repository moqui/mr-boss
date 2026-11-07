// Commerce integrations and channel import (impl-commerce P13; design-commerce §9, §1.4): the channel operator imports a file
// into the demo store's marketplace integration through ChannelImport's services and reads the outcome in Commerce's
// context (the order made, its message's safe summary), with the one qvt render of IntegrationDetail (with a message's
// detail) and of ChannelImport (the committed batch; Integrations' list is the acceptance scenario's); "Log as note" files
// an Assist answer as an internal note on a store order for the store operator and refuses the channel operator. The
// intake, deduplication, retry and import rules are Mantle's (StoreChannels); the access case is CommerceAccess's. The
// scenario is the acceptance CommerceChannelsScenario.
// Run: ./moq test mr-boss --spec CommerceChannels
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const I = "mantle.product.StoreChannelServices."
const remoteId = "BOSS_COM_MARKETPLACE"
const state = {}

feature(
    "the channel operator imports a file into the demo store's marketplace and reads its outcome in IntegrationDetail and ChannelImport",
    {
        when() {
            const orders = [
                {externalId: "BOSS-CC-1", items: [{lineId: "1", productId: "DEMO_1_1", quantity: "1", unitAmount: "15.00"}]},
                {externalId: "BOSS-CC-2", items: [{lineId: "1", productId: "NO_SUCH_ITEM", quantity: "1", unitAmount: "1.00"}]}
            ]
            return asUser(
                users.channel,
                () => {
                    const prepared = invoke(I + "prepare#ChannelImport", {
                        systemMessageRemoteId: remoteId,
                        formatEnumId: "SciJson",
                        importText: JSON.stringify({orders}),
                        fileName: "marketplace.json"
                    })
                    const committed = invoke(I + "commit#ChannelImport", {
                        systemMessageId: prepared.batch.systemMessageId,
                        digest: prepared.batch.digest,
                        reason: "Spec import"
                    })
                    const outcome = Object.fromEntries(Array.from(committed.rows).map(row => [row.rowKey, row]))
                    const failedId = outcome["BOSS-CC-2"]?.systemMessageId
                    const pages = {
                        detail: page("Integrations/IntegrationDetail", {
                            systemMessageRemoteId: remoteId,
                            systemMessageId: failedId
                        }),
                        batch: page("Integrations/ChannelImport", {systemMessageId: prepared.batch.systemMessageId})
                    }
                    return {prepared, outcome, pages}
                },
                false
            )
        },
        then({prepared, outcome, pages}) {
            Array.from(prepared.rows)
                .map(row => row.outcome)
                .join() == "new,error"
            outcome["BOSS-CC-1"].outcome == "applied"
            !!outcome["BOSS-CC-1"].orderId
            outcome["BOSS-CC-2"].outcome == "failed"
            outcome["BOSS-CC-2"].detail.startsWith("ITEM_UNKNOWN")
            pages.detail.errors.length == 0
            pages.detail.output.includes("Ziziwork Marketplace orders")
            pages.detail.output.includes("NO_SUCH_ITEM")
            !pages.detail.output.includes("sharedSecret")
            pages.batch.errors.length == 0
            pages.batch.output.includes("Spec import")
        }
    }
)

feature("Log as note files an internal note on a store order for its operator; the channel operator is refused", {
    when() {
        const text = "Assist: paid in full, shipped " + ec.user.nowTimestamp
        const logged = asUser(
            users.operator,
            () => refusal("mantle.order.StoreOperationsServices.add#StoreOrderNote", {orderId: ids.storeOrderId, noteText: text}),
            false
        )
        const channel = asUser(
            users.channel,
            () => refusal("mantle.order.StoreOperationsServices.add#StoreOrderNote", {orderId: ids.storeOrderId, noteText: text}),
            false
        )
        const notes = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.order.OrderNote")
                    .condition({orderId: ids.storeOrderId, noteText: text})
                    .disableAuthz()
                    .list()
            )
        )
        return {logged, channel, notes}
    },
    then({logged, channel, notes}) {
        logged == ""
        channel.includes("PERMISSION_DENIED")
        notes.length == 1
        notes[0].internalNote == "Y"
    }
})
