// Users and sessions in Admin (impl-admin P4; design-admin §4 UserDetail, §4.1): UserDetail's one qvt render (the shared
// identity as the Retail identity operator: its Retail organization alone, the Shared identity marker and why account-wide
// changes need ADMIN_IDENTITY_GLOBAL, its memberships, factors, credentials, sessions and history), and the delegated rule on
// UserDetail's transitions: the Retail operator signs a Retail user's session out, is refused the shared identity's session
// (IDENTITY_GLOBAL) and every Services-only identity (RECORD_UNAVAILABLE). Mantle's rules are Mantle's StaffIdentity, the
// framework's sessions AdminSessions; the golden walk is test/client/Admin/AdminUsersWalk, the "usable when" the acceptance
// AdminUsersUsable.
// Run: ./moq test mr-boss --spec Admin/AdminUsers
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, page} = lib
const visits = {retail: "ADM_USERS_VISIT_RETAIL", shared: "ADM_USERS_VISIT_SHARED"}
const make = (entityName, fields) =>
    system(() => {
        const row = ec.entity.makeValue(entityName)
        row.setFields(fields, true, null, null)
        row.create()
    })
const sessionRow = key => system(() => ec.entity.find("moqui.server.HttpSession").condition("visitId", key).one())

spec({
    setupSpec() {
        login("john.doe")
        for (const [key, userId] of [
            [visits.retail, ids.retailUserId],
            [visits.shared, ids.sharedUserId]
        ]) {
            make("moqui.server.Visit", {
                visitId: key,
                userId,
                fromDate: ec.user.nowTimestamp,
                initialUserAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0",
                clientIpAddress: "192.0.2.10"
            })
            make("moqui.server.HttpSession", {sessionId: key + "_S", userId, visitId: key})
        }
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            for (const key of Object.values(visits)) {
                ec.entity.find("moqui.server.HttpSession").condition("visitId", key).deleteAll()
                ec.entity.find("moqui.server.Visit").condition("visitId", key).deleteAll()
            }
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature("UserDetail shows the shared identity by the operator's organization alone, with its access, credentials and sessions", {
    when() {
        return asUser(users.identity, () => page("Users/UserDetail", {userId: ids.sharedUserId}))
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.includes("Staff Shared")
        output.includes("Shared identity")
        output.includes("ADMIN_IDENTITY_GLOBAL")
        // the Retail organization is named, Services only counted
        output.includes("1 organization(s) you do not administer")
        output.includes("IronStone BOSS users")
        output.includes("Chrome on Windows")
        output.includes("Sessions and history") && output.includes("Credentials")
        !output.includes("Mozilla/5.0")
    }
})

feature("the Retail operator signs a Retail user out, and is refused the shared identity's session and a Services identity", {
    when() {
        return asUser(users.identity, () => ({
            retail: page("Users/UserDetail/revokeSession", {userId: ids.retailUserId, sessionKey: visits.retail}, "html"),
            shared: refusal("ironstone.admin.ContextServices.check#Record", {
                recordType: "user",
                recordId: ids.sharedUserId,
                capability: "identityManage",
                accountWide: true
            }),
            sharedPage: page("Users/UserDetail/revokeSession", {userId: ids.sharedUserId, sessionKey: visits.shared}, "html"),
            other: page("Users/UserDetail", {userId: ids.otherUserId}),
            // Login as is ADMIN_LOGIN_AS's (impl-admin F24), which no Admin group holds
            loginAs: refusal("ironstone.admin.ContextServices.check#Record", {
                recordType: "user",
                recordId: ids.retailUserId,
                capability: "identityManage",
                loginAs: true
            }),
            reader: asUser(users.reader, () => refusal("mantle.party.IdentityServices.find#Users", {}))
        }))
    },
    then({retail, shared, sharedPage, other, loginAs, reader}) {
        retail.errors.length == 0
        sessionRow(visits.retail) == null
        shared.includes("IDENTITY_GLOBAL")
        sessionRow(visits.shared) != null
        other.output.includes("User not available") && !other.output.includes("Sessions and history")
        loginAs.includes("ADMIN_LOGIN_AS")
        reader.includes("ADMIN_IDENTITY_VIEW")
    }
})
