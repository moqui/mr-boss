// Commerce cart recovery (impl-commerce P10; design-commerce §6 CartDetail, §8 RecoveryPolicy) in Commerce's context: the
// demo's consenting customer (Joe Q Public, cart reminders on for POPC_DEFAULT) has an idle cart that is not sent while the
// store's recovery is off; the manager turns it on; the store operator (COMMERCE_RECOVERY) previews and sends it once; the
// subscription operator (COMMERCE_ORDER_VIEW without COMMERCE_RECOVERY) reads it and may not send, and another
// organization's manager may not change the store's policy. The rules are Mantle's (CartRecovery); CartDetail's and
// CheckoutSettings' one renders are CommerceOrders' and CommerceCheckoutSettings'. The usable-when is the acceptance
// CommerceRecoveryScenario. Run: ./moq test mr-boss --spec CommerceRecovery
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const O = "mantle.order.StoreOperationsServices."
const P = "mantle.product.StoreAdminServices."
const capture = ec.factory.getTool("MailCapture")
const cartId = "BOSS_COM10_CART"
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")
const make = (entity, values) =>
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(values)
        .call()
const policy = (user, enabled) =>
    asUser(
        user,
        () => refusal(P + "store#CartRecoveryPolicy", {productStoreId: ids.storeId, enabled, changeReason: "Spec"}),
        false
    )

spec({
    setupSpec() {
        capture.enable()
        login("john.doe")
        system(() => {
            make("mantle.order.OrderHeader", {
                orderId: cartId,
                productStoreId: ids.storeId,
                statusId: "OrderOpen",
                currencyUomId: "USD",
                salesChannelEnumId: "ScWeb",
                entryDate: ec.user.nowTimestamp,
                grandTotal: 25
            })
            make("mantle.order.OrderPart", {
                orderId: cartId,
                orderPartSeqId: "01",
                vendorPartyId: ids.organizationId,
                customerPartyId: ids.customerId,
                statusId: "OrderOpen"
            })
            make("mantle.order.OrderItem", {
                orderId: cartId,
                orderItemSeqId: "01",
                orderPartSeqId: "01",
                itemTypeEnumId: "ItemProduct",
                productId: "DEMO_1_1",
                itemDescription: "Recovery spec item",
                quantity: 1,
                unitAmount: 25
            })
            make("mantle.order.StoreCartAccess", {
                cartAccessId: cartId,
                orderId: cartId,
                siteId: ids.siteId,
                appMountId: "shop",
                productStoreId: ids.storeId,
                currencyUomId: "USD",
                customerPartyId: ids.customerId,
                capabilityDigest: ec.user.singleUseCodeHash(cartId),
                lastActivityDate: new Date(Date.now() - 3 * 3600000),
                expireDate: new Date(Date.now() + 30 * 86400000),
                createdDate: ec.user.nowTimestamp
            })
        })
    },
    cleanupSpec() {
        policy(users.manager, "false")
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the operator sends the opted-in idle cart's recovery once the store turns it on; others are refused", {
    when() {
        capture.clear()
        const read = user => asUser(user, () => invoke(O + "get#CartRecovery", {orderId: cartId, preview: true}).recovery, false)
        const off = read(users.operator)
        const other = policy(users.services, "true")
        const on = policy(users.manager, "true")
        const ready = read(users.operator)
        const send = user =>
            asUser(
                user,
                () =>
                    refusal(O + "send#CartRecovery", {
                        orderId: cartId,
                        reason: "Spec send",
                        operationKey: "BOSS-COM10-" + user,
                        orderRevision: ready.orderRevision
                    }),
                false
            )
        const subscriptions = send(users.subscriptions)
        const sent = send(users.operator)
        return {off, other, on, ready, subscriptions, sent, mails: capture.count(), after: read(users.subscriptions)}
    },
    then(r) {
        r.off.reasonCode == "RECOVERY_OFF"
        r.off.consentText == "Cart reminders on"
        code(r.other) == "RECORD_UNAVAILABLE"
        r.on == ""
        r.ready.eligible == true
        r.ready.canSend == true
        r.ready.preview.body.includes("You left items in your cart")
        code(r.subscriptions) == "PERMISSION_DENIED"
        r.sent == ""
        r.mails == 1
        r.after.canSend == false
        r.after.sends.length == 1
        r.after.sends[0].stateText == "Sent"
        r.after.reasonCode == "ALREADY_SENT"
    }
})
