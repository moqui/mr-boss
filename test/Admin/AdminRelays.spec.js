// Connections and mail relays in Admin (impl-admin P11; design-admin §8 Connections and ConnectionDetail, §9 MailRelays and
// MailRelayDetail, §15.3 "Relay scope", "Endpoint change" and "Settings ownership"): MailRelays' one qvt render as Ziziwork
// Retail's integration administrator lists SYSTEM and no mail account's server; ConnectionDetail's one qvt render shows a
// payment gateway's own form, its organizations and no secret; a relay is started, given its sign-in and repointed through
// the screens' transitions (the password cleared and the relay disabled), a mail account's server is changed on no path, and a
// payment gateway is permitted for the administrator's own organization and no other; the administrative reader opens none of
// it. The framework's rules (the endpoint-change rule, the tests, the write-only secrets) are the framework's
// AdminConnectionServices spec, the gateways' validation and the binding's dates Mantle's GatewayConnections.
// Run: ./moq test mr-boss --spec AdminRelays
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, ids, asUser, system, invoke, refusal, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const SERVER = "moqui.basic.email.EmailServer"
const BINDING = "mantle.account.method.PaymentGatewayOrganization"
const relayId = "SpecAdmRelay"
const ownedId = "SpecAdmOwned"
const gatewayId = "AuthorizeNetDemo"
const secret = "spec-relays-secret-5t"
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const server = emailServerId => system(() => find(SERVER, {emailServerId}).one()?.getMap() || null)
const relay = () => system(() => invoke(C + "get#Connection", {adapterKey: "relay", connectionKey: relayId}).connection)
const binding = organizationPartyId =>
    system(() => find(BINDING, {organizationPartyId, paymentGatewayConfigId: gatewayId}).one()?.getMap() || null)
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
// NativeConnection's rows, as its form posts them
const rows = values =>
    Object.fromEntries(
        Object.entries(values).flatMap(([name, value], index) => [
            ["fieldName_" + index, name],
            // a secret is posted under a name the framework takes for a credential
            [(/password|secret/i.test(name) ? "secretPassword_" : "fieldValue_") + index, value]
        ])
    )

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            // the server of a mail account: the account's, with its password
            const make = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.create()
            }
            make(SERVER, {
                emailServerId: ownedId,
                smtpHost: "mail.example.com",
                smtpPort: "465",
                smtpSsl: "Y",
                mailUsername: "owner",
                mailPassword: secret
            })
            make("moqui.basic.email.EmailAccount", {emailAccountId: ownedId, emailServerId: ownedId, ownsEmailServer: "Y"})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        ec.entity.find("moqui.server.ConnectionCheck").condition("connectionKey", "in", [relayId, ownedId, gatewayId]).deleteAll()
        ec.entity.find("moqui.basic.email.EmailAccount").condition("emailAccountId", ownedId).deleteAll()
        ec.entity.find(SERVER).condition("emailServerId", "in", [relayId, ownedId]).deleteAll()
        ec.entity.find(BINDING).condition("paymentGatewayConfigId", gatewayId).deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a relay is started and repointed through the screens, a mail account's server on no path, and a gateway permitted for one's own organization only",
    {
        when() {
            const out = {}
            post(users.reader, "Protocols/MailRelays/createRelay", {
                newRelayId: relayId,
                newSmtpHost: "smtp.example.com",
                newSmtpPort: "587",
                newTlsMode: "starttls"
            })
            out.afterReader = server(relayId)
            post(users.integrations, "Protocols/MailRelays/createRelay", {
                newRelayId: relayId,
                newSmtpHost: "smtp.example.com",
                newSmtpPort: "587",
                newTlsMode: "starttls"
            })
            out.started = relay()
            post(
                users.integrations,
                "Protocols/MailRelayDetail/storeConnection",
                Object.assign(
                    {connectionKey: relayId, expectedRevision: out.started?.revision},
                    rows({mailUsername: "relay", mailPassword: secret, _reason: "Spec: the relay's sign-in"})
                )
            )
            out.signedIn = server(relayId)
            // the host moves and the password is not entered again
            post(
                users.integrations,
                "Protocols/MailRelayDetail/storeConnection",
                Object.assign(
                    {connectionKey: relayId, expectedRevision: relay()?.revision},
                    rows({smtpHost: "smtp.elsewhere.example.net", mailPassword: ""})
                )
            )
            out.moved = server(relayId)
            out.movedState = relay()?.state
            // the Integrations mount is not the relay's, and a mail account's server is changed on neither
            post(
                users.integrations,
                "Integrations/ConnectionDetail/storeConnection",
                Object.assign(
                    {adapterKey: "relay", connectionKey: relayId, expectedRevision: relay()?.revision},
                    rows({smtpHost: "other.example.org"})
                )
            )
            out.otherMount = server(relayId).smtpHost
            post(
                users.integrations,
                "Protocols/MailRelayDetail/storeConnection",
                Object.assign({connectionKey: ownedId}, rows({smtpHost: "evil.example.com"}))
            )
            post(users.integrations, "Protocols/MailRelayDetail/testConnection", {connectionKey: ownedId})
            out.owned = server(ownedId)
            // a payment gateway for the administrator's own organization, never another's
            post(users.integrations, "Integrations/ConnectionDetail/storeAvailability", {
                adapterKey: "paymentGateway",
                connectionKey: gatewayId,
                organizationPartyId: ids.organizationId,
                isEnabled: "true",
                reason: "Spec: Retail takes cards"
            })
            post(users.integrations, "Integrations/ConnectionDetail/storeAvailability", {
                adapterKey: "paymentGateway",
                connectionKey: gatewayId,
                organizationPartyId: ids.otherOrganizationId,
                isEnabled: "true"
            })
            post(users.reader, "Integrations/ConnectionDetail/storeAvailability", {
                adapterKey: "paymentGateway",
                connectionKey: gatewayId,
                organizationPartyId: ids.accountingOrganizationId,
                isEnabled: "true"
            })
            out.own = binding(ids.organizationId)
            out.other = binding(ids.otherOrganizationId)
            out.readers = binding(ids.accountingOrganizationId)
            return out
        },
        then(out) {
            out.afterReader == null
            out.started.state == "needsTest" && out.started.endpointSummary.includes("smtp.example.com")
            out.signedIn.mailUsername == "relay" && out.signedIn.mailPassword == secret && out.signedIn.disabled == "Y"
            out.moved.smtpHost == "smtp.elsewhere.example.net" && out.moved.mailPassword == null && out.moved.disabled == "Y"
            out.movedState == "incomplete"
            out.otherMount == "smtp.elsewhere.example.net"
            out.owned.smtpHost == "mail.example.com" && out.owned.mailPassword == secret && out.owned.disabled == null
            out.own != null && out.own.isEnabled == "Y" && out.own.thruDate == null
            out.other == null
            out.readers == null
        }
    }
)

feature(
    "MailRelays lists SYSTEM and no mail account's server, and ConnectionDetail shows a gateway's form, its organizations and no secret",
    {
        when() {
            return {
                // the two screens' one render each, as the integration administrator
                relays: asUser(users.integrations, () => page("Protocols/MailRelays")),
                detail: asUser(users.integrations, () =>
                    page("Integrations/ConnectionDetail", {adapterKey: "paymentGateway", connectionKey: gatewayId})
                ),
                listed: asUser(users.integrations, () =>
                    invoke(C + "find#Connections", {adapterGroup: "mail"}).connectionList.map(row => row.connectionKey)
                ),
                reader: asUser(users.reader, () => refusal(C + "find#Connections", {}))
            }
        },
        then({relays, detail, listed, reader}) {
            relays.status == 200 && relays.errors.length == 0
            relays.output.includes("RelayList") && relays.output.includes("SYSTEM") && relays.output.includes(relayId)
            relays.output.includes("New relay") && relays.output.includes("smtp.elsewhere.example.net")
            !relays.output.includes(ownedId) && !relays.output.includes("mail.example.com")
            listed.includes("SYSTEM") && !listed.includes(ownedId)
            detail.status == 200 && detail.errors.length == 0
            detail.output.includes("Authorize.Net sandbox") && detail.output.includes("NativeConnection")
            detail.output.includes("Public client key") &&
                detail.output.includes("(endpoint)") &&
                detail.output.includes("apitest.authorize.net")
            // the organizations it is permitted for, those the administrator administers; the checks and the uses
            detail.output.includes("OrganizationAvailability") && detail.output.includes("Ziziwork Retail")
            detail.output.includes("ConnectionChecks") && detail.output.includes("Consumers")
            !detail.output.includes(secret) && !relays.output.includes(secret)
            // a secret is entered under a name the framework takes for a credential (kept in no session after a refusal)
            detail.output.includes("secretPassword") && detail.output.includes("Save configuration")
            reader.includes("ADMIN_CONNECTION_VIEW")
        }
    }
)
