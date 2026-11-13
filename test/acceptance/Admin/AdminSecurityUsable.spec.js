// Admin P10's "usable when" (impl-admin P10; design-admin §6 SignInPolicy, IdentityProviders, IdentityProviderDetail, §4
// Sessions' new-device notice, §15.3 Endpoint change and Escalation through grants), as an acceptance walk with artifact
// authorization on, through the screens' transitions: Ziziwork Retail's integration administrator starts and configures an
// OpenID Connect provider; the access administrator maps a remote role to a Projects bundle (a privileged group is refused
// with its reason), and after a passing test enables it; a changed issuer clears the secret and disables the provider until
// it is tested and enabled again; a group's sign-in rule is reviewed and saved through SignInPolicy; and a sign-in from a new
// browser sends the account one notice whose link opens Commons Account, where that session is signed out.
//
// The test of an OpenID provider reads its discovery document, so this walk needs the network: the two issuers are public
// discovery documents (the properties admin_accept_oidc_discovery and admin_accept_oidc_discovery_2 name others, such as a
// test Keycloak's). Nobody is signed in at a provider and no account is made. The rules are the framework's
// AdminIdentityProviders and AdminNewDevice specs and BOSS's AdminSecurity.
// Run: ./moq accept mr-boss --spec AdminSecurityUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, ids, asUser, system, invoke, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const flowId = "AcceptSecurityOidc"
const bundleId = "BOSS_PROJECT_TEAM"
const secret = "accept-security-secret-4m"
const issuer = System.getProperty("admin_accept_oidc_discovery") || "https://accounts.google.com/.well-known/openid-configuration"
const otherIssuer =
    System.getProperty("admin_accept_oidc_discovery_2") ||
    "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
const signInUserId = ids.retailUserId
const visitIds = ["ACCEPT_SEC_VISIT_1", "ACCEPT_SEC_VISIT_2", "ACCEPT_SEC_VISIT_3"]
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const provider = () => system(() => invoke(C + "find#IdentityProviders", {authFlowId: flowId}).provider)
const post = (user, transition, parameters) =>
    asUser(user, () =>
        page("Security/IdentityProviderDetail/" + transition, Object.assign({authFlowId: flowId}, parameters), "html")
    )
// Commons Account, as the notice's link opens it
function commons(path, parameters = {}) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/Commons.xml")
        .renderMode("html")
        .render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    ec.message.clearErrors()
    return {status: result.status, output: String(result.output || "")}
}
const group = () => system(() => find("moqui.security.UserGroup", {userGroupId: bundleId}).one())
const notices = () =>
    system(() =>
        Array.from(
            find("moqui.security.user.NotificationMessageByUser", {userId: signInUserId, topic: "AccountSignIn"}).list()
        ).map(row => ({
            title: String(row.titleText || ""),
            link: String(row.linkText || ""),
            message: String(row.messageJson || "")
        }))
    )
function clean() {
    system(() => {
        for (const entityName of ["AuthFlowRoleMap", "AuthFlowFieldMap", "OidcFlow", "AuthFlow"])
            ec.entity
                .find("moqui.security.sso." + entityName)
                .condition({authFlowId: flowId})
                .deleteAll()
        const messageIds = Array.from(
            find("moqui.security.user.NotificationMessageByUser", {userId: signInUserId, topic: "AccountSignIn"}).list()
        ).map(row => row.notificationMessageId)
        if (messageIds.length) {
            ec.entity
                .find("moqui.security.user.NotificationMessageUser")
                .condition("notificationMessageId", "in", messageIds)
                .deleteAll()
            ec.entity
                .find("moqui.security.user.NotificationMessage")
                .condition("notificationMessageId", "in", messageIds)
                .deleteAll()
        }
        ec.entity.find("moqui.security.UserLoginHistory").condition("visitId", "in", visitIds).deleteAll()
        ec.entity.find("moqui.server.HttpSession").condition("visitId", "in", visitIds).deleteAll()
        ec.entity.find("moqui.server.Visit").condition("visitId", "in", visitIds).deleteAll()
        const row = find("moqui.security.UserGroup", {userGroupId: bundleId}).one()
        if (row && row.requireAuthcFactor === "Y") {
            row.requireAuthcFactor = "N"
            row.update()
        }
    })
}

spec({
    setupSpec() {
        login("john.doe")
        clean()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        clean()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an OpenID Connect provider is configured, mapped to a Projects bundle, tested and enabled, each part by its administrator",
    {
        when() {
            const out = {}
            asUser(users.integrations, () =>
                page(
                    "Security/IdentityProviders/createProvider",
                    {newProviderId: flowId, newTypeEnumId: "AftOidc", newDescription: "Company sign-in"},
                    "html"
                )
            )
            post(users.integrations, "storeConfiguration", {
                expectedRevision: provider()?.revision,
                description: "Company sign-in",
                clientTypeEnumId: "OctOther",
                clientId: "accept-security-client",
                secretPassword: secret,
                discoveryUri: issuer,
                reason: "Acceptance: the company's identity provider"
            })
            post(users.integrations, "changeFieldMap", {
                expectedRevision: provider()?.revision,
                srcFieldName: "name",
                dstFieldName: "userFullName"
            })
            out.configured = provider()
            // the role mappings are the access administrator's: a privileged group never, a Projects bundle yes
            post(users.access, "changeRoleMap", {
                expectedRevision: provider()?.revision,
                roleName: "it-admins",
                userGroupId: ids.adminGroupId
            })
            out.afterPrivileged = provider().roleMapList.length
            post(users.access, "changeRoleMap", {
                expectedRevision: provider()?.revision,
                roleName: "engineering",
                userGroupId: bundleId
            })
            post(users.access, "storeAccess", {
                expectedRevision: provider()?.revision,
                accountLinkEnumId: "AflVerifiedEmail",
                defaultUserGroupId: ""
            })
            out.mapped = provider()
            // not enabled before a test passes, nor by the integration administrator after it
            post(users.access, "setEnabled", {expectedRevision: out.mapped.revision, enable: "Y"})
            out.beforeTest = provider().enabled
            out.tested = asUser(users.integrations, () =>
                invoke(C + "test#IdentityProvider", {authFlowId: flowId, testRoles: "engineering, sales"})
            )
            post(users.integrations, "setEnabled", {expectedRevision: provider()?.revision, enable: "Y"})
            out.byIntegrations = provider().enabled
            post(users.access, "setEnabled", {expectedRevision: provider()?.revision, enable: "Y"})
            out.live = provider()
            out.list = asUser(users.access, () => page("Security/IdentityProviders"))
            out.detail = asUser(users.integrations, () => page("Security/IdentityProviderDetail", {authFlowId: flowId}))
            return out
        },
        then(out) {
            out.configured.enabled == false && out.configured.readiness == "needsTest"
            out.configured.configuration.secretSet == true && out.configured.fieldMapList.length == 1
            out.afterPrivileged == 0
            out.mapped.roleMapList.length == 1 &&
                out.mapped.roleMapList[0].userGroupId == bundleId &&
                out.mapped.roleMapList[0].allowed == true
            out.mapped.accountLinkEnumId == "AflVerifiedEmail"
            out.beforeTest == false
            out.tested.passed == true
            out.tested.checkList.every(row => row.state == "ok")
            out.tested.callbackUrl.endsWith("/sso/callback")
            out.tested.grantPreview.find(row => row.roleName == "engineering").given == true
            out.tested.grantPreview.find(row => row.roleName == "sales").given == false
            out.byIntegrations == false
            out.live.enabled == true && out.live.readiness == "enabled"
            out.list.status == 200 && out.list.errors.length == 0 && out.list.output.includes("Company sign-in")
            out.detail.status == 200 && out.detail.errors.length == 0
            out.detail.output.includes("OidcConfiguration") && out.detail.output.includes("engineering")
            !out.detail.output.includes(secret) && !out.list.output.includes(secret)
        }
    }
)

feature("a changed issuer clears the secret and disables the provider until it is tested and enabled again", {
    when() {
        const out = {}
        post(users.integrations, "storeConfiguration", {
            expectedRevision: provider()?.revision,
            discoveryUri: otherIssuer,
            reason: "Acceptance: the issuer moved"
        })
        out.moved = provider()
        out.secretAfter = system(() => find("moqui.security.sso.OidcFlow", {authFlowId: flowId}).one().secret)
        out.audit = system(() =>
            Array.from(
                find("moqui.entity.EntityAuditLog", {
                    changedEntityName: "moqui.security.sso.OidcFlow",
                    pkPrimaryValue: flowId
                }).list()
            ).map(row => row.changedFieldName + ":" + (row.newValueText || ""))
        )
        // not enabled against the new issuer until it is tested
        post(users.access, "setEnabled", {expectedRevision: out.moved.revision, enable: "Y"})
        out.untested = provider().enabled
        post(users.integrations, "storeConfiguration", {
            expectedRevision: provider()?.revision,
            secretPassword: secret,
            reason: "Acceptance: the new issuer's secret"
        })
        post(users.integrations, "testProvider", {})
        out.retested = provider()
        post(users.access, "setEnabled", {expectedRevision: out.retested.revision, enable: "Y"})
        out.live = provider()
        return out
    },
    then(out) {
        out.moved.enabled == false && out.moved.readiness == "needsTest"
        out.moved.configuration.secretSet == false && out.moved.configuration.discoveryUri == otherIssuer
        !out.secretAfter
        out.audit.some(text => text.startsWith("discoveryUri:") && text.includes(otherIssuer))
        out.audit.some(text => text.startsWith("secret:") && text.includes("cleared"))
        !out.audit.join().includes(secret)
        out.untested == false
        out.retested.readiness == "tested" && out.retested.configuration.secretSet == true
        out.live.enabled == true
    }
})

feature("a group's sign-in rule is reviewed, then saved, through SignInPolicy", {
    when() {
        const out = {}
        out.review = asUser(users.access, () =>
            page("Security/SignInPolicy", {reviewGroupId: bundleId, reviewFactor: "Y", reviewIp: ""})
        )
        out.afterReview = group().requireAuthcFactor
        const preview = asUser(users.access, () =>
            invoke("org.moqui.admin.AccessServices.preview#GroupSignInRules", {userGroupId: bundleId, requireAuthcFactor: "Y"})
        )
        asUser(users.access, () =>
            page(
                "Security/SignInPolicy/storeRule",
                {
                    userGroupId: bundleId,
                    expectedRevision: preview.revision,
                    requireAuthcFactor: "Y",
                    ipAllowed: "",
                    reason: "Acceptance: project work needs a factor"
                },
                "html"
            )
        )
        out.saved = group().requireAuthcFactor
        out.byConfigure = asUser(users.configure, () => page("Security/SignInPolicy"))
        return out
    },
    then(out) {
        out.review.status == 200 && out.review.errors.length == 0
        out.review.output.includes("Shortest password") && out.review.output.includes("ConfirmRule")
        out.afterReview != "Y"
        out.saved == "Y"
        // the configuration administrator reads the policy and not the groups' rules
        out.byConfigure.status == 200 && out.byConfigure.output.includes("Shortest password")
        out.byConfigure.output.includes("for an access administrator")
    }
})

feature("a sign-in from a new browser sends the account one notice, whose link opens Commons Account to sign that session out", {
    when() {
        const out = {}
        const username = system(() => find("moqui.security.UserAccount", {userId: signInUserId}).one().username)
        const visit = (n, agent, address, daysAgo) =>
            system(() => {
                const row = ec.entity.makeValue("moqui.server.Visit")
                row.setFields(
                    {
                        visitId: visitIds[n],
                        userId: signInUserId,
                        fromDate: new Date(Date.now() - daysAgo * 86400000),
                        initialUserAgent: agent,
                        clientIpAddress: address
                    },
                    true,
                    null,
                    null
                )
                row.create()
            })
        const signIn = (n, secondsAgo) =>
            system(() => {
                ec.service
                    .sync()
                    .name("create#moqui.security.UserLoginHistory")
                    .parameters({
                        userId: signInUserId,
                        fromDate: new Date(Date.now() - secondsAgo * 1000),
                        visitId: visitIds[n],
                        successfulLogin: "Y"
                    })
                    .call()
                ec.message.clearErrors()
            })
        // the browser the account is known from, then a new one, then the new one again
        visit(0, "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Firefox/140.0", "203.0.113.5", 5)
        signIn(0, 5 * 86400)
        out.before = notices().length
        visit(1, "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0", "198.51.100.7", 0)
        system(() => {
            const session = ec.entity.makeValue("moqui.server.HttpSession")
            session.setFields(
                {sessionId: "ACCEPT_SEC_SESSION_1", userId: signInUserId, visitId: visitIds[1], sessionToken: "accept"},
                true,
                null,
                null
            )
            session.create()
        })
        signIn(1, 120)
        out.afterNew = notices()
        visit(2, "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0", "198.51.100.90", 0)
        signIn(2, 30)
        out.afterAgain = notices().length
        // the account's owner opens the link and signs that session out
        out.account = asUser(username, () => commons("Settings/Account"))
        asUser(username, () => commons("Settings/Account/signOutSession", {sessionKey: visitIds[1]}))
        out.ended = system(() => find("moqui.server.Visit", {visitId: visitIds[1]}).one().thruDate)
        return out
    },
    then(out) {
        out.before == 0
        out.afterNew.length == 1
        out.afterNew[0].title.includes("Chrome on Windows")
        out.afterNew[0].link == "/qapps/Commons/Settings/Account"
        out.afterNew[0].message.includes("198.51.100.x") && !out.afterNew[0].message.includes("198.51.100.7")
        out.afterAgain == 1
        out.account.output.includes("Chrome on Windows")
        out.ended != null
    }
})
