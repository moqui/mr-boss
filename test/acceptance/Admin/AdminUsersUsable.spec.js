// Admin P4's "usable when" (impl-admin P4; design-admin §15.3 "Delegated administration", its account half), as an acceptance
// walk with artifact authorization on: the Retail identity operator (admin.identity) sends the shared identity a reset request
// for its Retail relationship but is refused its account-wide changes (a factor reset, revoking its access) without
// ADMIN_IDENTITY_GLOBAL, and cannot open a Services-only identity; a session it revokes for a Retail user is gone, so that
// browser's next request starts signed out; and Commons Account signs the user's other browser out. The rules themselves are
// Mantle's StaffIdentity, the framework's AdminSessions and BOSS's AdminUsers; the golden walk is the client AdminUsersWalk.
// Run: ./moq accept mr-boss --spec AdminUsersUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const identity = "mantle.party.IdentityServices."
const factorId = "ADM_USABLE_FACTOR"
const visits = {retail: "ADM_USABLE_RETAIL", other: "ADM_USABLE_OTHER", own: "ADM_USABLE_OWN"}
const make = (entityName, fields) =>
    system(() => {
        const row = ec.entity.makeValue(entityName)
        row.setFields(fields, true, null, null)
        row.create()
    })
const sessionOf = key => system(() => ec.entity.find("moqui.server.HttpSession").condition("visitId", key).one())
const browser = (key, userId) => {
    make("moqui.server.Visit", {
        visitId: key,
        userId,
        fromDate: ec.user.nowTimestamp,
        initialUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/605.1",
        clientIpAddress: "203.0.113.44"
    })
    make("moqui.server.HttpSession", {sessionId: key + "_S", userId, visitId: key})
}
const sharedEmail = "shared.staff@ziziwork.example.com"
const setEmail = emailAddress =>
    system(() => {
        const account = ec.entity.find("moqui.security.UserAccount").condition("userId", ids.sharedUserId).one()
        account.set("emailAddress", emailAddress)
        account.update()
    })

spec({
    setupSpec() {
        login("john.doe")
        make("moqui.security.UserAuthcFactor", {
            factorId,
            userId: ids.sharedUserId,
            factorTypeEnumId: "UafTotp",
            fromDate: ec.user.nowTimestamp,
            needsValidation: "N"
        })
        browser(visits.retail, ids.retailUserId)
        browser(visits.other, ids.sharedUserId)
        browser(visits.own, ids.sharedUserId)
        // a reset is mailed to the account's address, which the demo shared identity has none of (Identity.js refuses NO_EMAIL)
        setEmail(sharedEmail)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        setEmail(null)
        system(() => {
            ec.entity.find("moqui.security.UserAuthcFactor").condition("factorId", factorId).deleteAll()
            for (const key of Object.values(visits)) {
                ec.entity.find("moqui.server.HttpSession").condition("visitId", key).deleteAll()
                ec.entity.find("moqui.server.Visit").condition("visitId", key).deleteAll()
            }
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the Retail operator sends the shared identity a reset, and is refused its account-wide changes and a Services identity",
    {
        when() {
            return asUser(users.identity, () => ({
                detail: page("Users/UserDetail", {userId: ids.sharedUserId}),
                reset: invoke(identity + "reset#Authentication", {
                    userId: ids.sharedUserId,
                    resetKind: "password",
                    reason: "Forgot it"
                }),
                factor: invoke(identity + "reset#Authentication", {userId: ids.sharedUserId, resetKind: "factor", factorId}),
                revoke: refusal("ironstone.admin.ContextServices.check#Record", {
                    recordType: "user",
                    recordId: ids.sharedUserId,
                    capability: "identityManage",
                    accountWide: true
                }),
                services: page("Users/UserDetail", {userId: ids.otherUserId}),
                // by username: an unfiltered find is a page of 50 of Retail's staff, by name
                find: ["shared.staff", "commerce.manager", "commerce.services"].flatMap(text =>
                    invoke(identity + "find#Users", {text}).userList.map(row => row.userId)
                )
            }))
        },
        then({detail, reset, factor, revoke, services, find}) {
            detail.errors.length == 0 && detail.output.includes("Shared identity")
            reset.applied == true
            factor.applied == false && factor.reasonCode == "IDENTITY_GLOBAL"
            system(() => ec.entity.find("moqui.security.UserAuthcFactor").condition("factorId", factorId).one()).thruDate == null
            revoke.includes("IDENTITY_GLOBAL")
            services.output.includes("User not available")
            find.includes(ids.sharedUserId) && find.includes(ids.retailUserId) && !find.includes(ids.otherUserId)
        }
    }
)

feature("a session the operator revokes is gone at once, and Commons Account signs the user's other browser out", {
    when() {
        const revoked = asUser(users.identity, () =>
            page("Users/UserDetail/revokeSession", {userId: ids.retailUserId, sessionKey: visits.retail}, "html")
        )
        // shared.staff in Commons Account: its other browser (visits.other) signed out, never another user's
        // the setup's factor means shared.staff signs in with a second factor, not a password alone (asUser's login)
        let commons
        try {
            ec.user.internalLoginUser(users.shared)
            ec.artifactExecution.enableAuthz()
            commons = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Commons.xml")
                .render("Settings/Account/signOutSession", {sessionKey: visits.other}, "post")
        } finally {
            ec.message.clearErrors()
            login("john.doe")
        }
        return {revoked, commons}
    },
    then({revoked, commons}) {
        revoked.errors.length == 0
        sessionOf(visits.retail) == null
        system(() => ec.entity.find("moqui.server.Visit").condition("visitId", visits.retail).one()).thruDate != null
        sessionOf(visits.other) == null
        sessionOf(visits.own) != null
    }
})
