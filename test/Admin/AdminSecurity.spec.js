// Sign-in policy and identity providers in Admin (impl-admin P10; design-admin §6 SignInPolicy, IdentityProviders and
// IdentityProviderDetail): SignInPolicy's one qvt render as Ziziwork Retail's access administrator (the rules the server runs
// with, the groups' sign-in rules and the review of a change, which names what it would do before anything is saved);
// IdentityProviders' and IdentityProviderDetail's one qvt render each, the provider made, mapped, tested and enabled through
// the screens' transitions by the integration administrator and the access administrator, each refused the other's part
// with its reason (a role mapping to a privileged group never written, the secret never shown); the administrative reader
// opens none of it. The framework's rules (role mappings, the endpoint-change rule, the test, the policy's values, the lockout
// preview) are the framework's AdminIdentityProviders spec.
// Run: ./moq test mr-boss --spec AdminSecurity
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, ids, asUser, system, invoke, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const flowId = "SpecSecurityFlow"
const bundleId = "BOSS_PROJECT_TEAM"
const secret = "spec-security-secret-7q"
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const provider = () => system(() => invoke(C + "find#IdentityProviders", {authFlowId: flowId}).provider)
const roleMaps = () =>
    system(() => Array.from(find("moqui.security.sso.AuthFlowRoleMap", {authFlowId: flowId}).list()).map(row => row.userGroupId))
const post = (user, transition, parameters) =>
    asUser(user, () =>
        page("Security/IdentityProviderDetail/" + transition, Object.assign({authFlowId: flowId}, parameters), "html")
    )

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        for (const entityName of ["AuthFlowRoleMap", "AuthFlowFieldMap", "OauthFlow", "AuthFlow"])
            ec.entity
                .find("moqui.security.sso." + entityName)
                .condition({authFlowId: flowId})
                .deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature("SignInPolicy shows the access administrator the rules in force, the groups' rules and the review of a change", {
    when() {
        return {
            rendered: asUser(users.access, () =>
                page("Security/SignInPolicy", {reviewGroupId: bundleId, reviewFactor: "Y", reviewIp: ""})
            ),
            stored: system(() => find("moqui.security.UserGroup", {userGroupId: bundleId}).one().requireAuthcFactor)
        }
    },
    then({rendered, stored}) {
        rendered.status == 200
        rendered.errors.length == 0
        // EffectiveSignInPolicy: the rules with their values and where they come from, read only
        rendered.output.includes("EffectiveSignInPolicy") && rendered.output.includes("Shortest password")
        rendered.output.includes("Failed sign-ins before a lock") && rendered.output.includes("In the deployment")
        rendered.output.includes("New-device sign-in window")
        // GroupSignInRules, and the review of the proposed change with its confirmation
        rendered.output.includes("GroupSignInRules") && rendered.output.includes("Project team")
        rendered.output.includes("ChangeRule") && rendered.output.includes("a factor is required")
        rendered.output.includes("no confirmed factor") && rendered.output.includes("ConfirmRule")
        // a review writes nothing
        stored != "Y"
    }
})

feature("a provider is started and configured by the integration administrator, mapped and enabled by the access administrator", {
    when() {
        const out = {}
        out.readerStart = asUser(users.reader, () =>
            page(
                "Security/IdentityProviders/createProvider",
                {newProviderId: flowId, newTypeEnumId: "AftOauth", newDescription: "Spec sign-in"},
                "html"
            )
        )
        out.afterReader = provider()
        asUser(users.integrations, () =>
            page(
                "Security/IdentityProviders/createProvider",
                {newProviderId: flowId, newTypeEnumId: "AftOauth", newDescription: "Spec sign-in"},
                "html"
            )
        )
        out.afterStart = provider()
        post(users.integrations, "storeConfiguration", {
            expectedRevision: out.afterStart?.revision,
            description: "Spec sign-in",
            clientTypeEnumId: "OctOauth20",
            clientId: "spec-security-client",
            secretPassword: secret,
            authorizeUrl: "https://idp.example.com/authorize",
            tokenUrl: "https://idp.example.com/token"
        })
        // the access administrator maps a Projects bundle, never a privileged group, through the one list the screen keeps
        post(users.access, "changeRoleMap", {
            expectedRevision: provider()?.revision,
            roleName: "admins",
            userGroupId: ids.adminGroupId
        })
        out.afterPrivileged = roleMaps()
        post(users.access, "changeRoleMap", {
            expectedRevision: provider()?.revision,
            roleName: "engineers",
            userGroupId: bundleId
        })
        out.afterMapped = roleMaps()
        post(users.integrations, "testProvider", {testRoles: "engineers"})
        out.tested = provider()
        // enabling is the access administrator's: the integration administrator is refused it
        post(users.integrations, "setEnabled", {expectedRevision: out.tested.revision, enable: "Y"})
        out.stillDisabled = provider().enabled
        post(users.access, "setEnabled", {expectedRevision: out.tested.revision, enable: "Y"})
        out.live = provider()
        return out
    },
    then(out) {
        out.afterReader == null
        out.afterStart.enabled == false && out.afterStart.readiness == "incomplete"
        out.afterPrivileged.length == 0
        out.afterMapped.join() == bundleId
        out.tested.enabled == false && out.tested.readiness == "tested"
        out.stillDisabled == false
        out.live.enabled == true && out.live.readiness == "enabled"
        out.live.configuration.secretSet == true
    }
})

feature("IdentityProviders lists the provider and IdentityProviderDetail shows each administrator their part, never the secret", {
    when() {
        return {
            // the two screens' one render each: the list as the integration administrator, the detail as the access administrator
            list: asUser(users.integrations, () => page("Security/IdentityProviders")),
            detail: asUser(users.access, () => page("Security/IdentityProviderDetail", {authFlowId: flowId}))
        }
    },
    then({list, detail}) {
        list.status == 200 && list.errors.length == 0
        list.output.includes("ProviderList") && list.output.includes("Spec sign-in")
        list.output.includes("New provider") && list.output.includes("/sso/callback") && list.output.includes("Enabled")
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Spec sign-in") && detail.output.includes("RoleMappings")
        detail.output.includes("engineers") && detail.output.includes("Given at sign-in")
        detail.output.includes("IdentityMappings") && detail.output.includes("Callback URL to register")
        // the access administrator holds no ADMIN_CONNECTION_MANAGE: the configuration is read only, the mappings are hers
        !detail.output.includes("OauthConfiguration") && detail.output.includes("AddRoleMap")
        !detail.output.includes(secret) && !list.output.includes(secret)
    }
})
