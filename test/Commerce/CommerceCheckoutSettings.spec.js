// Commerce checkout settings (impl-commerce P6; design-commerce §8 CheckoutSettings): the demo store's checkout by store
// scope (the manager is refused a payment gateway outside Ziziwork Retail's enabled rows, the disabled TEST_DECLINE; the
// reader reads the settings without changing them; the other organization's manager is refused them), the owners' links
// (F6) for a user who may open them and not for one who may not, and CheckoutSettings' one qvt render. The rules themselves
// are Mantle's (StoreCheckout, StoreShippingRates). The walk is the acceptance CommerceCheckoutWalk.
// Run: ./moq test mr-boss --spec Commerce/CommerceCheckoutSettings
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, refusal, invoke} = lib
const A = "mantle.product.StoreAdminServices."
// a Mantle call as the user, as a Commerce screen makes it (its authorization inherited from the screen)
const as = (user, service, parameters = {}) => asUser(user, () => invoke(A + service, parameters), false)
const refused = (user, service, parameters = {}) => asUser(user, () => refusal(A + service, parameters), false)
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")
const links = user =>
    asUser(user, () => invoke("ironstone.commerce.ContextServices.get#OwnerLinks", {organizationPartyId: ids.organizationId}))
        .links

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the demo store's checkout by scope: a disabled gateway refused, the reader reads, the other organization is refused", {
    when() {
        const bind = {productStoreId: ids.storeId, paymentInstrumentEnumId: "PiCreditCard"}
        return {
            disabled: refused(
                users.manager,
                "store#StorePaymentGateway",
                Object.assign({paymentGatewayConfigId: "TEST_DECLINE"}, bind)
            ),
            // the same binding the store has: no change, so a refusal is the permission's or the scope's
            // (Shop P5 review: the demo's card gateway is BOSS_COM_HOSTED)
            same: refused(
                users.manager,
                "store#StorePaymentGateway",
                Object.assign({paymentGatewayConfigId: "BOSS_COM_HOSTED"}, bind)
            ),
            reader: refused(
                users.read,
                "store#StorePaymentGateway",
                Object.assign({paymentGatewayConfigId: "BOSS_COM_HOSTED"}, bind)
            ),
            readerRead: as(users.read, "get#CheckoutSettings", {productStoreId: ids.storeId}),
            other: refused(users.services, "get#CheckoutSettings", {productStoreId: ids.storeId}),
            managerLinks: links(users.manager),
            adminLinks: links("john.doe")
        }
    },
    then(r) {
        code(r.disabled) == "GATEWAY_NOT_ENABLED"
        r.same == ""
        code(r.reader) == "PERMISSION_DENIED"
        r.readerRead.canEdit == false
        r.readerRead.paymentGateways.some(row => row.paymentGatewayConfigId == "BOSS_COM_HOSTED" && row.enabled)
        r.readerRead.policy.supportQueueId == "BOSS_CS_Q_SUPPORT"
        code(r.other) == "RECORD_UNAVAILABLE"
        r.managerLinks.carriers == null
        r.adminLinks.carriers.startsWith("/qapps/Warehouse/Locations/Carriers")
        r.adminLinks.taxAuthorities.includes("organizationPartyId=" + ids.organizationId)
    }
})

// CheckoutSettings, rendered once (qvt) for the manager: the readiness strip (the local gateway with no rate blocks), each
// group and the manager's actions
feature("CheckoutSettings shows the readiness strip and each group of the demo store's checkout, with the manager's actions", {
    when() {
        return asUser(users.manager, () => lib.page("Settings/CheckoutSettings", {productStoreId: ids.storeId}))
    },
    then(result) {
        result.status == 200
        result.errors == []
        result.output.includes("Readiness for purchase")
        result.output.includes("Blocks checkout")
        result.output.includes("Local rates")
        result.output.includes("Checkout policy")
        result.output.includes("Change policy")
        result.output.includes("Ship options")
        result.output.includes("Shipping gateways")
        result.output.includes("Payment gateways")
        result.output.includes("Enabled for the organization")
        result.output.includes("Simulator")
        result.output.includes("Preview tax")
        // P10: the cart recovery policy, off until the store turns it on, with the store's recovery email (F118's opt-ins beside it)
        result.output.includes("Cart recovery")
        result.output.includes("Off: nothing is sent")
        result.output.includes("Change recovery")
        result.output.includes("Checkout's optional emails")
        !result.output.includes("Not available")
    }
})
