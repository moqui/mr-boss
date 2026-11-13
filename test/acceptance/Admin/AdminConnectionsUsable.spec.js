// Admin P11's "usable when" (impl-admin P11; design-admin §8 Connections and ConnectionDetail, §9 MailRelays and
// MailRelayDetail, §15.3 "Relay scope", "Endpoint change" and "Settings ownership", its gateway half), as an acceptance walk
// with artifact authorization on, through the screens and their transitions: MailRelays lists SYSTEM and not a mail
// account's server, which opens on no path; Ziziwork Retail's integration administrator gives the demo payment gateway
// (Mantle's Authorize.Net sandbox, AuthorizeNetDemo) its sign-in, then changes its address to the live one without the
// key: the key is cleared, the connection is disabled, and a test sends no request; with the key entered again a test of
// the new address passes and enables it; the administrator then permits the gateway for Ziziwork Services, and it is a
// choice in that organization's store's checkout settings (Commerce) and among Accounting's gateway providers, neither of
// whose users can change its credentials; ending the permission takes the choice away without deleting the binding.
//
// No request leaves the machine: the HTTP fixtures answer the gateway's address and count what was sent. The rules are the
// framework's AdminConnectionServices, Mantle's GatewayConnections and BOSS's AdminRelays.
// Run: ./moq accept mr-boss --spec AdminConnectionsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, ids, asUser, system, invoke, refusal, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const http = ec.factory.getTool("HttpFixtures")
const gatewayId = "AuthorizeNetDemo"
const remoteId = "AuthorizeNetSandbox"
const storeId = "BOSS_COM_DIGITAL"
const ownedId = "AcceptConnOwned"
const key = "accept-connections-key-9d"
const testAddress = "https://apitest.authorize.net/xml/v1/request.api"
const liveAddress = "https://api.authorize.net/xml/v1/request.api"
const REMOTE = "moqui.service.message.SystemMessageRemote"
const BINDING = "mantle.account.method.PaymentGatewayOrganization"
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const remote = () => system(() => find(REMOTE, {systemMessageRemoteId: remoteId}).one().getMap())
const gateway = () =>
    system(() => invoke(C + "get#Connection", {adapterKey: "paymentGateway", connectionKey: gatewayId}).connection)
const binding = () =>
    system(
        () =>
            find(BINDING, {organizationPartyId: ids.otherOrganizationId, paymentGatewayConfigId: gatewayId}).one()?.getMap() ||
            null
    )
const rows = values =>
    Object.fromEntries(
        Object.entries(values).flatMap(([name, value], index) => [
            ["fieldName_" + index, name],
            // a secret is posted under a name the framework takes for a credential
            [(/password|secret/i.test(name) ? "secretPassword_" : "fieldValue_") + index, value]
        ])
    )
const post = (user, transition, parameters) =>
    asUser(user, () =>
        page(
            "Integrations/ConnectionDetail/" + transition,
            Object.assign({adapterKey: "paymentGateway", connectionKey: gatewayId}, parameters),
            "html"
        )
    )
const save = values =>
    post(users.integrations, "storeConnection", Object.assign({expectedRevision: gateway().revision}, rows(values)))
// the gateways Commerce offers the store's checkout and Accounting offers the organization's payment methods
const checkoutChoices = () =>
    system(() =>
        invoke("mantle.product.StoreAdminServices.find#CheckoutOptions", {productStoreId: storeId, choice: "paymentGateways"})
    )
const financeChoices = () =>
    system(
        () =>
            invoke("mantle.account.PaymentServices.find#PaymentGatewayProviders", {organizationPartyId: ids.otherOrganizationId})
                .rows || []
    )
let before

spec({
    setupSpec() {
        login("john.doe")
        http.enable()
        system(() => {
            before = find(REMOTE, {systemMessageRemoteId: remoteId}).one().getMap()
            const make = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.create()
            }
            make("moqui.basic.email.EmailServer", {
                emailServerId: ownedId,
                smtpHost: "mail.example.com",
                smtpPort: "465",
                smtpSsl: "Y",
                mailUsername: "owner",
                mailPassword: key
            })
            make("moqui.basic.email.EmailAccount", {emailAccountId: ownedId, emailServerId: ownedId, ownsEmailServer: "Y"})
        })
    },
    cleanupSpec() {
        http.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        // the demo gateway's connection as it was
        const row = ec.entity.makeValue(REMOTE)
        row.setFields(
            {
                systemMessageRemoteId: remoteId,
                sendUrl: before.sendUrl,
                usageCode: before.usageCode,
                username: before.username ?? null,
                password: before.password ?? null,
                sharedSecret: before.sharedSecret ?? null,
                disabled: before.disabled ?? null,
                allowPrivateNetwork: before.allowPrivateNetwork ?? null
            },
            true,
            null,
            null
        )
        row.update()
        ec.entity.find("moqui.server.ConnectionCheck").condition("connectionKey", "in", [gatewayId, ownedId]).deleteAll()
        ec.entity
            .find(BINDING)
            .condition({organizationPartyId: ids.otherOrganizationId, paymentGatewayConfigId: gatewayId})
            .deleteAll()
        ec.entity.find("moqui.basic.email.EmailAccount").condition("emailAccountId", ownedId).deleteAll()
        ec.entity.find("moqui.basic.email.EmailServer").condition("emailServerId", ownedId).deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature("MailRelays lists SYSTEM and no mail account's server, which opens on no path", {
    when() {
        return {
            relays: asUser(users.integrations, () => page("Protocols/MailRelays")),
            system: asUser(users.integrations, () => page("Protocols/MailRelayDetail", {connectionKey: "SYSTEM"})),
            owned: asUser(users.integrations, () => page("Protocols/MailRelayDetail", {connectionKey: ownedId})),
            ownedTest: asUser(users.integrations, () =>
                invoke(C + "test#Connection", {adapterKey: "relay", connectionKey: ownedId})
            ),
            reader: asUser(users.reader, () => page("Protocols/MailRelays"))
        }
    },
    then({relays, system, owned, ownedTest, reader}) {
        relays.status == 200 && relays.errors.length == 0
        relays.output.includes("RelayList") && relays.output.includes("SYSTEM")
        !relays.output.includes(ownedId) && !relays.output.includes("mail.example.com")
        system.status == 200 && system.output.includes("NativeConnection") && system.output.includes("SMTP host")
        owned.output.includes("not available") && !owned.output.includes("mail.example.com") && !owned.output.includes(key)
        ownedTest.applied == false && ownedTest.reasonCode == "ACCOUNT_OWNED"
        reader.status != 200 || reader.output.includes("not available")
    }
})

feature(
    "the demo gateway's address changed without its key is disabled with no request sent, and a test of the new address enables it",
    {
        when() {
            const out = {}
            save({username: "accept-login", password: key, _reason: "Accept: the sandbox sign-in"})
            out.signedIn = remote()
            http.add({method: "HEAD", url: testAddress, status: 405})
            post(users.integrations, "testConnection", {})
            out.tested = gateway()
            out.testedRequests = http.count()
            // the live address, without the key
            save({sendUrl: liveAddress, usageCode: "P", password: "", _reason: "Accept: going live"})
            out.moved = remote()
            out.movedState = gateway()
            post(users.integrations, "testConnection", {})
            out.afterEmptyTest = gateway()
            out.movedRequests = http.count()
            // the key entered again, and the new address answers
            save({password: key + "-live"})
            http.add({method: "HEAD", url: liveAddress, status: 405})
            post(users.integrations, "testConnection", {})
            out.live = gateway()
            out.liveRow = remote()
            out.sent = http.requests().map(request => ({
                url: request.url,
                headers: Object.keys(request.headers || {})
                    .join(",")
                    .toLowerCase(),
                body: String(request.body || "")
            }))
            out.detail = asUser(users.integrations, () =>
                page("Integrations/ConnectionDetail", {adapterKey: "paymentGateway", connectionKey: gatewayId})
            )
            return out
        },
        then(out) {
            out.signedIn.username == "accept-login" && out.signedIn.password == key
            out.tested.state == "ready" && out.testedRequests == 1
            // the address moved: the key cleared, the connection disabled, and its test sent nothing
            out.moved.sendUrl == liveAddress && out.moved.password == null && out.moved.disabled == "Y"
            out.movedState.secretCleared == true && out.movedState.enabled == false
            out.afterEmptyTest.lastCheckPassed == false && out.afterEmptyTest.enabled == false
            out.movedRequests == 1
            // entered again and tested against the new address: enabled, with no credentials in the request
            out.live.state == "ready" && out.live.enabled == true && out.liveRow.disabled == "N"
            out.liveRow.password == key + "-live"
            out.sent.length == 2 && out.sent[1].url == liveAddress
            out.sent.every(request => !request.headers.includes("authorization") && request.body == "")
            out.detail.status == 200 && out.detail.errors.length == 0
            out.detail.output.includes("api.authorize.net") && out.detail.output.includes("ConnectionChecks")
            !out.detail.output.includes(key)
        }
    }
)

feature(
    "permitted for Ziziwork Services it is a choice in its store's checkout and in Accounting, whose users cannot change its credentials",
    {
        when() {
            const out = {}
            const offered = () => ({
                checkout: JSON.stringify(checkoutChoices()).includes(gatewayId),
                finance: financeChoices().some(row => row.paymentGatewayConfigId === gatewayId)
            })
            out.before = offered()
            // Retail's integration administrator does not administer Services: refused, nothing written
            post(users.integrations, "storeAvailability", {organizationPartyId: ids.otherOrganizationId, isEnabled: "true"})
            out.afterOutsider = binding()
            post(users.admin, "storeAvailability", {
                organizationPartyId: ids.otherOrganizationId,
                isEnabled: "true",
                reason: "Accept: Services takes cards"
            })
            out.permitted = binding()
            out.after = offered()
            // the store's and the finance users choose it and change no credential (the revision read as the administrator:
            // get#Connection checks ADMIN_CONNECTION_VIEW itself and refuses these users, even with authorization off)
            const revision = gateway().revision
            out.storeUser = asUser("commerce.services", () =>
                refusal(C + "store#Connection", {
                    adapterKey: "paymentGateway",
                    connectionKey: gatewayId,
                    values: {password: "theirs"},
                    expectedRevision: revision
                })
            )
            out.storeRead = asUser("commerce.services", () =>
                refusal(C + "get#Connection", {adapterKey: "paymentGateway", connectionKey: gatewayId})
            )
            out.financeUser = asUser("finance.read", () =>
                refusal(C + "store#Connection", {
                    adapterKey: "paymentGateway",
                    connectionKey: gatewayId,
                    values: {sendUrl: testAddress}
                })
            )
            out.key = remote().password
            // ended: offered no more, the binding kept
            post(users.admin, "storeAvailability", {
                organizationPartyId: ids.otherOrganizationId,
                bindingRevision: String(Number(out.permitted.lastUpdatedStamp)),
                remove: "Y"
            })
            out.ended = binding()
            out.afterEnd = offered()
            return out
        },
        then(out) {
            out.before.checkout == false && out.before.finance == false
            out.afterOutsider == null
            out.permitted != null && out.permitted.isEnabled == "Y" && out.permitted.thruDate == null
            out.after.checkout == true && out.after.finance == true
            out.storeUser.includes("ADMIN_CONNECTION_MANAGE") && out.storeRead.includes("ADMIN_CONNECTION_VIEW")
            out.financeUser.includes("ADMIN_CONNECTION_MANAGE")
            out.key == key + "-live"
            out.ended != null && out.ended.thruDate != null
            out.afterEnd.checkout == false && out.afterEnd.finance == false
        }
    }
)
