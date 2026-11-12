// The design §15.3 review of Admin (impl-admin P19, §8; design-admin §1.1, §15.3 "Delegated administration" and "Escalation
// through grants"), as one cross-cutting acceptance walk with artifact authorization on: a user of each Admin group, each a
// Ziziwork Retail agent in BOSS_ADMIN and that one group with no other app's launcher (the demo's admin.reader to admin.backup,
// and admin.delegate, who holds ADMIN_ACCESS_MANAGE through a custom group), is refused
// - another organization's identity (a Ziziwork Services staff member): its UserDetail by URL, its account through
//   UserDetail's storeAccount transition, the palette, the drop-downs (organizations, members), Assist's admin_find_users
//   tool (never offered to MCP) and direct services (get#Account, store#Account, reset#Authentication, start#Lifecycle), and a
//   shared identity's account-wide change without ADMIN_IDENTITY_GLOBAL (the record check UserDetail's revokeAccess asks first;
//   the framework's revoke#AccountAccess knows no organization and is not a remote service, F73);
// - another organization's records: its OrganizationDetail by URL, and its contact book through the export wizard;
// - secrets: a relay's password and an identity provider's client secret set here appear on no page, print, summary, JSON or
//   service answer;
// - sealed rights and privileged memberships: through GroupDetail's addMember transition, store#Membership, a grant
//   proposal (a privileged group only by a member of it, as the framework's rule: admin.access's own group is allowed), an
//   invitation (whose rules a bulk invitation import applies to each row: AdminImportsUsable walks the import),
//   an SSO role mapping and direct entity writes, and nothing of it is written;
// - the System mount: by URL (System and its group screens) and in the menu.
// The scenarios each phase wrote stay theirs (AdminFoundationWalk, AdminGroupsWalk, AdminUsersUsable, AdminImportsUsable,
// AdminSecurityUsable, AdminExportsUsable, AdminConnectionsUsable and the others); this walk is the one place every group is
// put through the same refusals. The rules themselves are the regression specs' (AdminAccess, the framework's
// AdminAccessServices, Mantle's StaffIdentity).
// Run: ./moq accept mr-boss --spec AdminReviewWalk
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, shell} = lib
const C = "org.moqui.admin.ConfigurationServices."
const A = "org.moqui.admin.AccessServices."
const I = "mantle.party.IdentityServices."
const groupUsers = [
    "reader",
    "identity",
    "access",
    "configure",
    "integrations",
    "operations",
    "data",
    "audit",
    "privacy",
    "backup",
    "delegate"
].map(key => users[key])
const relayId = "SYSTEM"
const relaySecret = "review-walk-relay-secret-4k"
const flowId = "ReviewWalkFlow"
const flowSecret = "review-walk-client-secret-9m"
const privilegedGroups = [ids.adminGroupId, ids.backupGroupId, ids.accessGroupId, "ADMIN"]
const sealedPermissions = ["ADMIN_BACKUP_DOWNLOAD", "ADMIN_IDENTITY_GLOBAL", "ADMIN_ACCESS_MANAGE", "ADMIN_CONSTITUTION_GLOBAL"]
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
let other, relayBefore, bookId, startedAt

// a page as the shell fetches it (qvt), or with a transition posted ("html")
const page = (user, path, parameters = {}, mode = "qvt") => asUser(user, () => lib.page(path, parameters, mode))
// a service's answer as the user, or its refusal: {out, refused}
function call(user, service, parameters = {}) {
    return asUser(user, () => {
        ec.message.pushErrors()
        try {
            const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            return ec.message.hasError() ? {out: null, refused: ec.message.getErrorsString()} : {out, refused: ""}
        } catch (error) {
            return {out: null, refused: String(error.message)}
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
// refused: an error, or an answer that says it was not applied (a reason, never written)
const notApplied = got => !!got.refused || got.out?.applied === false || got.out?.allowed === false || got.out?.refused === true
// A direct entity create's refusal as the current user: "" when it is stored, else its message (AdminFoundationWalk's).
function entityRefusal(entityName, fields) {
    ec.message.pushErrors()
    try {
        const value = ec.entity.makeValue(entityName)
        value.setFields(fields, true, null, null)
        value.create()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

spec({
    setupSpec() {
        login("john.doe")
        startedAt = ec.user.nowTimestamp
        // the Services staff member, as the demo has it
        other = system(() => find("moqui.security.UserAccount", {userId: ids.otherUserId}).one().getMap())
        // a relay password and an identity provider's client secret to look for
        system(() => {
            const relay = find("moqui.basic.email.EmailServer", {emailServerId: relayId}).one()
            relayBefore = {mailPassword: relay.mailPassword, smtpPassword: relay.smtpPassword}
            relay.set("smtpPassword", relaySecret)
            relay.update()
            ec.service
                .sync()
                .name(C + "store#IdentityProvider")
                .parameters({
                    authFlowId: flowId,
                    authFlowTypeEnumId: "AftOauth",
                    description: "Review walk provider",
                    clientTypeEnumId: "OctOauth20",
                    clientId: "review-walk-client",
                    secret: flowSecret,
                    authorizeUrl: "https://idp.example.com/authorize",
                    tokenUrl: "https://idp.example.com/token"
                })
                .call()
        })
        // a contact book of the Services staff member's own, with one contact
        asUser(
            other.username,
            () => {
                lib.invoke("mantle.party.ContactBookServices.create#PersonalContact", {
                    firstName: "Rhea",
                    lastName: "Reviewwalk",
                    emailAddress: "rhea.reviewwalk@example.com"
                })
                bookId = (lib.invoke("mantle.party.ContactBookServices.get#UserContactBooks").contactBookList || [])[0]
                    ?.contactBookId
            },
            false
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            const relay = find("moqui.basic.email.EmailServer", {emailServerId: relayId}).one()
            relay.set("smtpPassword", relayBefore.smtpPassword)
            relay.update()
            for (const entityName of ["AuthFlowRoleMap", "AuthFlowFieldMap", "OauthFlow", "AuthFlow"])
                find("moqui.security.sso." + entityName, {authFlowId: flowId}).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "no Admin group's user reads or changes another organization's identity, by URL, transition, palette, choice, Assist tool or service",
    {
        when() {
            const problems = []
            const named = text => String(text || "").includes(other.username) || String(text || "").includes(ids.otherUserId)
            for (const user of groupUsers) {
                const detail = page(user, "Users/UserDetail", {userId: ids.otherUserId})
                if (detail.output.includes(other.username)) problems.push(`${user}: UserDetail names ${other.username}`)
                page(
                    user,
                    "Users/UserDetail/storeAccount",
                    {userId: ids.otherUserId, emailAddress: "review.walk.taken@example.com"},
                    "html"
                )
                const palette = call(user, "ironstone.admin.ContextServices.search#Records", {text: other.username})
                if (named(JSON.stringify(palette.out?.rows || []))) problems.push(`${user}: the palette finds ${other.username}`)
                for (const choice of ["organizations", "members", "lifecycleUsers"]) {
                    const options =
                        call(user, "ironstone.admin.ContextServices.get#Choices", {appRoot: "Admin", choice, term: ""}).out
                            ?.options || []
                    if (options.some(option => option.value === ids.otherOrganizationId || option.value === ids.otherUserId))
                        problems.push(`${user}: the ${choice} choices offer ${ids.otherOrganizationId} or ${ids.otherUserId}`)
                }
                // Assist's admin_find_users is find#Users with the user's own permissions
                const tool = call(user, I + "find#Users", {text: other.username})
                if (named(JSON.stringify(tool.out?.userList || []))) problems.push(`${user}: find#Users finds ${other.username}`)
                if (!call(user, I + "get#Account", {userId: ids.otherUserId}).refused)
                    problems.push(`${user}: get#Account answered`)
                const stored = call(user, I + "store#Account", {
                    userId: ids.otherUserId,
                    emailAddress: "review.walk.taken@example.com"
                })
                if (!notApplied(stored)) problems.push(`${user}: store#Account applied`)
                if (
                    !notApplied(
                        call(user, I + "reset#Authentication", {
                            userId: ids.otherUserId,
                            resetKind: "password",
                            reason: "Review walk"
                        })
                    )
                )
                    problems.push(`${user}: a password reset was sent`)
                if (
                    !notApplied(
                        call(user, I + "start#Lifecycle", {userId: ids.otherUserId, kind: "disable", reason: "Review walk"})
                    )
                )
                    problems.push(`${user}: a lifecycle was started`)
                // the shared identity is in Retail too: an account-wide change needs ADMIN_IDENTITY_GLOBAL, which none holds; Admin's
                // record check is what UserDetail's revokeAccess transition asks before the framework's revoke#AccountAccess, which
                // knows no organization and is no remote service (F73)
                const accountWide = {
                    appRoot: "Admin",
                    recordType: "user",
                    recordId: ids.sharedUserId,
                    capability: "identityManage",
                    accountWide: true
                }
                if (!call(user, "ironstone.admin.ContextServices.check#Record", accountWide).refused)
                    problems.push(`${user}: an account-wide change of the shared identity is allowed`)
                const organization = page(user, "Settings/OrganizationDetail", {organizationPartyId: ids.otherOrganizationId})
                if (organization.output.includes("Ziziwork Services") && !organization.output.includes("is not available"))
                    problems.push(`${user}: OrganizationDetail shows Ziziwork Services`)
                const exported = call(user, "org.moqui.admin.DataTransferServices.run#ExportRequest", {
                    targetId: "contactBookVCard",
                    scopeKey: bookId
                })
                if (String(exported.out?.fileText || "").includes("Reviewwalk"))
                    problems.push(`${user}: exported the Services member's contact book`)
            }
            const exposure = system(() => find("moqui.agent.AgentToolExposure", {toolName: "admin_find_users"}).one())
            const after = system(() => find("moqui.security.UserAccount", {userId: ids.otherUserId}).one().getMap())
            const lifecycles = system(() =>
                find("mantle.party.UserLifecycleOperation", {userId: ids.otherUserId})
                    .condition("requestedDate", "greater-equals", startedAt)
                    .count()
            )
            return {problems, exposure, after, lifecycles}
        },
        then({problems, exposure, after, lifecycles}) {
            problems.join("\n") == ""
            exposure.exposeAssistant == "Y"
            exposure.exposeMcp == "N"
            after.emailAddress == other.emailAddress
            after.disabled == other.disabled
            lifecycles == 0
        }
    }
)

feature("no Admin group's user is given a secret, on a page, a print, the support summary, its JSON or a service's answer", {
    when() {
        const problems = []
        const secrets = [relaySecret, flowSecret]
        const holds = text => secrets.some(secret => String(text || "").includes(secret))
        for (const user of groupUsers) {
            const seen = {
                relay: page(user, "Protocols/MailRelayDetail", {connectionKey: relayId}).output,
                relays: page(user, "Protocols/MailRelays").output,
                connections: page(user, "Integrations/Connections").output,
                provider: page(user, "Security/IdentityProviderDetail", {authFlowId: flowId}).output,
                server: page(user, "Protocols/ServerConfiguration").output,
                instance: page(user, "Settings/InstanceSettings").output,
                summary: page(user, "Operations/SupportSummary").output,
                summaryPrint: page(user, "Operations/SupportSummary", {}, "html-print").output,
                changes: page(user, "Audit/AuditChanges").output,
                connection: JSON.stringify(call(user, C + "get#Connection", {adapterKey: "relay", connectionKey: relayId}).out),
                providers: JSON.stringify(call(user, C + "find#IdentityProviders", {authFlowId: flowId}).out),
                settings: JSON.stringify(call(user, C + "get#EffectiveSettings").out),
                summaryJson: JSON.stringify(
                    call(user, "org.moqui.admin.ReadinessServices.get#SupportSummary", {redacted: true}).out
                ),
                readiness: JSON.stringify(call(user, "org.moqui.admin.ReadinessServices.get#Readiness").out)
            }
            for (const [where, text] of Object.entries(seen)) if (holds(text)) problems.push(`${user}: a secret in ${where}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "no Admin group's user gains a sealed right or a privileged membership, by transition, service, proposal, invitation, SSO or entity",
    {
        when() {
            const problems = []
            for (const user of groupUsers) {
                const userId = system(() => find("moqui.security.UserAccount", {username: user}).one().userId)
                for (const groupId of privilegedGroups) {
                    page(user, "Access/GroupDetail/addMember", {userGroupId: groupId, memberUserId: userId}, "html")
                    if (!notApplied(call(user, A + "store#Membership", {userGroupId: groupId, userId})))
                        problems.push(`${user}: store#Membership into ${groupId}`)
                    if (
                        !asUser(user, () =>
                            entityRefusal("moqui.security.UserGroupMember", {
                                userGroupId: groupId,
                                userId,
                                fromDate: ec.user.nowTimestamp
                            })
                        )
                    )
                        problems.push(`${user}: a direct UserGroupMember into ${groupId}`)
                }
                // a privileged group only by a member of it (design §1.1, the framework's UserGroupMemberPrivileged): the
                // proposal allows admin.access its own BOSS_ADMIN_ACCESS, as store#Membership would, and nothing else here
                const memberOf = system(() =>
                    Array.from(
                        find("moqui.security.UserGroupMember", {userId}).condition("userGroupId", "in", privilegedGroups).list()
                    )
                        .filter(row => row.thruDate == null || Number(String(row.thruDate)) > Date.now())
                        .map(row => row.userGroupId)
                )
                const proposal = call(user, A + "check#GrantProposal", {bundleGroupIdList: privilegedGroups})
                for (const row of Array.from(proposal.out?.bundleList || []))
                    if (row.allowed && !memberOf.includes(row.bundleGroupId))
                        problems.push(`${user}: a grant proposal allows the privileged group ${row.bundleGroupId}, not theirs`)
                const invited = call(user, I + "invite#User", {
                    emailAddress: "review.walk.invitee@example.com",
                    firstName: "Review",
                    lastName: "Invitee",
                    organizationPartyId: ids.organizationId,
                    bundleGroupIdList: ["BOSS_USERS", ids.adminGroupId]
                })
                if (!notApplied(invited)) problems.push(`${user}: an invitation with ${ids.adminGroupId}`)
                const mapped = call(user, C + "store#IdentityProvider", {
                    authFlowId: flowId,
                    expectedRevision: system(
                        () => lib.invoke(C + "find#IdentityProviders", {authFlowId: flowId}).provider?.revision
                    ),
                    roleMapList: [{roleName: "review-walk-admins", userGroupId: ids.adminGroupId}]
                })
                if (!notApplied(mapped)) problems.push(`${user}: an SSO role mapping to ${ids.adminGroupId}`)
                for (const permission of sealedPermissions)
                    if (
                        !asUser(user, () =>
                            entityRefusal("moqui.security.UserGroupPermission", {
                                userGroupId: ids.delegateGroupId,
                                userPermissionId: permission,
                                fromDate: ec.user.nowTimestamp
                            })
                        )
                    )
                        problems.push(`${user}: a direct grant of ${permission}`)
            }
            const userIds = system(() =>
                Array.from(find("moqui.security.UserAccount", {}).condition("username", "in", groupUsers).list()).map(
                    row => row.userId
                )
            )
            const written = system(() => ({
                memberships: find("moqui.security.UserGroupMember", {})
                    .condition("userGroupId", "in", privilegedGroups)
                    .condition("userId", "in", userIds)
                    .condition("fromDate", "greater-equals", startedAt)
                    .count(),
                // the delegate group grants ADMIN_ACCESS_MANAGE on the demo: only a row of this walk counts
                grants: find("moqui.security.UserGroupPermission", {userGroupId: ids.delegateGroupId})
                    .condition("userPermissionId", "in", sealedPermissions)
                    .condition("fromDate", "greater-equals", startedAt)
                    .count(),
                roleMaps: find("moqui.security.sso.AuthFlowRoleMap", {authFlowId: flowId}).count(),
                invitations: find("mantle.party.UserInvitation", {emailAddress: "review.walk.invitee@example.com"}).count()
            }))
            return {problems, written}
        },
        then({problems, written}) {
            problems.join("\n") == ""
            written.memberships == 0
            written.grants == 0
            written.roleMaps == 0
            written.invitations == 0
        }
    }
)

feature("no Admin group's user opens the System mount, by URL or the menu", {
    when() {
        const problems = []
        for (const user of groupUsers) {
            for (const path of ["System", "System/Access/GroupDetail", "System/Security/UserAccount/UserAccountDetail"]) {
                const rendered = page(user, path, {userGroupId: "ADMIN", userId: ids.otherUserId}, "html")
                if (rendered.status == 200 && rendered.errors.length == 0) problems.push(`${user}: ${path} opened`)
            }
            if (shell(user, true).names.includes("System")) problems.push(`${user}: System in the menu`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
