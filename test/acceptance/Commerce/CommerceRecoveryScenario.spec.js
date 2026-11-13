// Commerce P10's "usable when" (impl-commerce P10; design-commerce §12.2 scenario 9), as an acceptance scenario through the
// Shop operations and pages, the email preferences operation, CheckoutSettings' and CartDetail's screens with artifact
// authorization on, and the recovery job's service: a signed-in shopper of the demo store turns on its cart reminders and
// leaves a cart; a guest leaves another; the manager turns the store's recovery on; past the delay the job sends the shopper
// one notice and the guest none, and a second run sends nothing more; in a fresh session the notice's link asks the visitor
// to sign in, then restores the cart for the shopper at today's price with a new capability, and the link does not work
// twice; CartDetail shows the send and the used link. The rules are Mantle's CartRecovery and CommerceRecovery's.
// Run: ./moq accept mr-boss --spec CommerceRecoveryScenario
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system} = lib
const capture = ec.factory.getTool("MailCapture")
const stamp = String(Date.now()).slice(-6)
const SITE = "BOSS_REC_SITE_" + stamp,
    HOST = "recovery" + stamp + ".zizi.example.test"
const productId = "DEMO_1_1"
const O = "mantle.order.StoreOperationsServices."
const A = "mantle.order.StoreCartAccess"
const walk = {}
const make = (entity, values) =>
    system(
        () =>
            ec.service
                .sync()
                .name("create#" + entity)
                .parameters(values)
                .requireNewTransaction(true)
                .call() || {}
    )
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).useCache(false).one())
const list = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).useCache(false).list()))
const update = (entity, values) =>
    system(() =>
        ec.service
            .sync()
            .name("update#" + entity)
            .parameters(values)
            .requireNewTransaction(true)
            .call()
    )
// a Shop operation as an account (null: a visitor), through the facade as a page calls it
function shop(username, operation, input) {
    if (username) login(username)
    else logout()
    try {
        const out = ec.resource
            .script("component://mr-pass/screen/Shared/Portal.js")
            .attempt(operation, Object.assign({siteId: SITE}, input), {newTransaction: true})
        return out.error ? {error: out.error} : {result: out.result}
    } finally {
        login("john.doe")
    }
}
// a Shop page as the browser gets it (the PASS shell), as an account or a visitor, in this spec's one session
function page(username, path, parameters = {}, method = null) {
    if (username) login(username)
    else logout()
    try {
        const rendered = ec.screen
            .makeTest()
            .rootScreen("component://mr-pass/screen/Pass.xml")
            .render(
                "Shop/" + path,
                Object.assign({resolvedSiteId: SITE, publicHost: HOST, publicPath: "/shop/" + path}, parameters),
                method
            )
        return {status: rendered.status, html: String(rendered.output || ""), errors: Array.from(rendered.errorMessages || [])}
    } finally {
        ec.message.clearErrors()
        login("john.doe")
    }
}
// a Commerce transition posted, or a screen rendered (qvt), as the user
function commerce(user, path, parameters, method = null) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, method)
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const session = () => ec.web.sessionAttributes
const deliveries = orderId =>
    list("mantle.party.MessageDelivery", {sourceEnumId: "MdsrcCartRecovery"}).filter(row =>
        String(row.eventKey).startsWith("cartRecovery:" + orderId + ":")
    )
const idle = (orderId, minutes) =>
    update(A, {cartAccessId: list(A, {orderId})[0].cartAccessId, lastActivityDate: new Date(Date.now() - minutes * 60000)})

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
        make("mantle.public.PublicSite", {siteId: SITE, name: "Recovery walk", state: "published", locale: "en", generation: 1})
        make("mantle.public.PublicSiteHost", {hostname: HOST, siteId: SITE, canonical: "Y"})
        for (const [app, pathPrefix, targetId] of [
            ["shop", "/shop", ids.storeId],
            ["account", "/account", ids.organizationId]
        ])
            make("mantle.public.PublicSiteApp", {siteId: SITE, appMountId: app, app, pathPrefix, enabled: "Y", targetId})
        // the shopper: a verified account of the site
        walk.shopper = "BOSS_REC_SHOPPER_" + stamp
        make("mantle.party.Party", {partyId: walk.shopper, partyTypeEnumId: "PtyPerson"})
        make("mantle.party.Person", {partyId: walk.shopper, firstName: "Rosa", lastName: "Shopper"})
        make("mantle.party.PartyRole", {partyId: walk.shopper, roleTypeId: "Customer"})
        walk.email = walk.shopper.toLowerCase() + "@recovery.example.test"
        make("moqui.security.UserAccount", {
            userId: walk.shopper,
            username: walk.shopper,
            partyId: walk.shopper,
            emailAddress: walk.email,
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA",
            timeZone: "UTC"
        })
        make("moqui.security.public.VerifiedAddress", {
            userId: walk.shopper,
            emailAddress: walk.email,
            verifiedAt: ec.user.nowTimestamp
        })
    },
    cleanupSpec() {
        session().remove("passShopCart:" + SITE)
        session().remove("passShopRecovery:" + SITE)
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a signed-in shopper turns on cart reminders and leaves a cart; a guest leaves another; the manager turns recovery on", {
    when() {
        const preferences = shop(walk.shopper, "storeEmailPreferences", {
            choices: {topics: {["cartReminders:" + ids.storeId]: true}}
        })
        const added = shop(walk.shopper, "addCartItem", {productId, quantity: "2"})
        walk.cartId = list(A, {customerPartyId: walk.shopper, siteId: SITE})[0]?.orderId
        const guest = shop(null, "addCartItem", {productId, quantity: "1"})
        walk.guestCartId = list(A, {siteId: SITE}).find(row => !row.customerPartyId)?.orderId
        // both carts left two hours ago; the shopper's line at an older price, which the link's repricing corrects
        idle(walk.cartId, 120)
        idle(walk.guestCartId, 120)
        walk.price = one("mantle.order.OrderItem", {orderId: walk.cartId, orderItemSeqId: "01"}).unitAmount
        update("mantle.order.OrderItem", {orderId: walk.cartId, orderItemSeqId: "01", unitAmount: "1.00"})
        const before = asUser(
            users.operator,
            () =>
                ec.service
                    .sync()
                    .name(O + "get#CartRecovery")
                    .parameters({orderId: walk.cartId})
                    .call().recovery,
            false
        )
        const saved = commerce(
            users.manager,
            "Settings/CheckoutSettings/saveRecovery",
            {
                productStoreId: ids.storeId,
                enabled: "true",
                delayMinutes: "60",
                sender: "builtin",
                maxSends: "1",
                retentionDays: "7",
                changeReason: "Remind shoppers of their carts"
            },
            "post"
        )
        const settings = asUser(users.manager, () => lib.page("Settings/CheckoutSettings", {productStoreId: ids.storeId}))
        return {preferences, added, guest, before, saved, settings}
    },
    then(r) {
        r.preferences.result != null
        r.added.result.cart.items.length == 1
        r.guest.result.token.length == 48
        r.before.reasonCode == "RECOVERY_OFF"
        r.before.consentText == "Cart reminders on"
        r.saved.errors.length == 0
        r.settings.output.includes("Cart recovery")
        r.settings.output.includes("1 hour")
    }
})

feature("past the delay the job sends the shopper one notice and the guest none; a second run sends nothing more", {
    when() {
        capture.clear()
        const run = () =>
            system(() =>
                ec.service
                    .sync()
                    .name(O + "run#CartRecovery")
                    .parameters({productStoreIds: [ids.storeId]})
                    .call()
            )
        const first = run()
        const mails = capture.getMessages()
        const second = run()
        walk.token = decodeURIComponent((/Recover\?r=([A-Za-z0-9_%-]+)/.exec(mails[0]?.body || "") || [])[1] || "")
        const guestReason = asUser(
            users.operator,
            () =>
                ec.service
                    .sync()
                    .name(O + "get#CartRecovery")
                    .parameters({orderId: walk.guestCartId})
                    .call().recovery.reasonCode,
            false
        )
        return {
            first,
            second,
            mails,
            after: capture.count(),
            guestReason,
            shopperSends: deliveries(walk.cartId),
            guestSends: deliveries(walk.guestCartId)
        }
    },
    then(r) {
        r.first.queued >= 1
        r.mails.length == 1
        r.mails[0].toList.includes(walk.email)
        r.mails[0].body.includes("/account/EmailPreferences")
        walk.token.length == 48
        r.shopperSends.length == 1 && r.shopperSends[0].stateEnumId == "MdsSent"
        r.guestSends.length == 0
        r.guestReason == "GUEST"
        r.second.queued == 0
        r.after == 1
    }
})

feature("in a fresh session the link asks the visitor to sign in, then restores the cart repriced for the shopper, once", {
    when() {
        // a fresh session: no cart capability, nobody signed in
        session().remove("passShopCart:" + SITE)
        const opened = page(null, "Recover", {r: walk.token})
        const kept = session()["passShopRecovery:" + SITE]
        const visitor = page(null, "Recover")
        const signedIn = page(walk.shopper, "Recover")
        const restored = page(walk.shopper, "Recover/restore", {}, "post")
        const capability = session()["passShopCart:" + SITE] || null
        const cart = shop(walk.shopper, "getCart", {token: capability})
        const access = list(A, {orderId: walk.cartId})[0]
        const again = shop(walk.shopper, "recoverCart", {token: walk.token})
        const detail = asUser(users.operator, () => lib.page("Orders/CartDetail", {orderId: walk.cartId}))
        return {opened, kept, visitor, signedIn, restored, capability, cart, access, again, detail}
    },
    then(r) {
        r.kept == walk.token
        !r.visitor.html.includes(walk.token)
        r.visitor.html.includes("to open the cart you saved")
        r.signedIn.html.includes('id="RecoverCart"')
        r.restored.errors.length == 0
        r.capability != null && r.capability.length == 48
        r.access.capabilityDigest == ec.user.singleUseCodeHash(r.capability)
        r.access.recoveryUsedDate != null
        Number(r.cart.result.cart.items[0].unitPrice.amount) == Number(String(walk.price))
        r.again.error.kind == "NotFound"
        r.detail.errors.length == 0
        r.detail.output.includes("Recovery history · 1")
        r.detail.output.includes("link used")
    }
})
