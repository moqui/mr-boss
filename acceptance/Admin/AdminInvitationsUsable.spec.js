// Admin P5's "usable when" (impl-admin P5; design-admin §15.3 "Hire and invitation", its invitation half), as an acceptance
// walk with artifact authorization on and no mail server: the Retail identity operator (admin.identity) invites a new staff
// member with a Purchasing bundle from InviteStaff and copies the link Invitations shows once; a resend makes the first link
// read "This invitation is no longer valid"; the second link's account step creates the account, which then opens Commons with
// IronStone BOSS users and the Purchasing group; a bundle whose group requires a factor stops the acceptance at the factor step;
// a site account's address is the identity operator's to invite only with ADMIN_IDENTITY_GLOBAL (review Nov 7 (P5)), and,
// invited by the instance administrator, it gets no internal access without the invitation's token, and with it is linked,
// not duplicated. The rules are Mantle's StaffInvitation and BOSS's AdminInvitations.
// Run: ./moq accept mr-boss --spec AdminInvitationsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const S = "mantle.party.IdentityServices."
const run = String(Date.now()).slice(-7)
const addresses = {
    hire: "usable.hire." + run + "@example.com",
    factor: "usable.factor." + run + "@example.com",
    site: "usable.site." + run + "@example.com"
}
const password = "Usable-pass-" + run
const FACTOR_GROUP = "BOSS_PURCHASING_BUYER"
let factorFlagBefore = null
let siteUserId

const invitationOf = emailAddress =>
    system(() => ec.entity.find("mantle.party.UserInvitation").condition("emailAddress", emailAddress).one())
// InviteStaff's transition as the operator (or another inviter), then Invitations with the link shown once: the token of
// the link
function inviteAndCopy(emailAddress, bundleGroupIdList, names = {}, inviter = users.identity) {
    return asUser(inviter, () => {
        page(
            "Users/InviteStaff/inviteStaff",
            Object.assign({emailAddress, organizationPartyId: ids.organizationId, bundleGroupIdList}, names),
            "html"
        )
        const invitation = invitationOf(emailAddress)
        if (!invitation) return null
        const shown = page("Users/Invitations", {revealInvitationId: invitation.invitationId})
        return (shown.output.match(/\/i\/([A-Za-z0-9_-]{43})/) || [])[1]
    })
}
// AcceptInvitation as the token route serves it: the page (qvt) or one of its transitions, for whoever is signed in
function route(token, path = "", parameters = {}) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/AcceptInvitation.xml")
        .renderMode("qvt")
        .render(path, Object.assign({token, tokenRoute: {name: "i", token, basePath: "/i/" + token}}, parameters), null)
    const errors = Array.from(result.errorMessages || [])
    ec.message.clearErrors()
    return {status: result.status, output: String(result.output || ""), errors}
}
const groupsOf = userId =>
    system(() =>
        Array.from(
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", userId)
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .list()
        )
    ).map(row => row.userGroupId)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const group = ec.entity.find("moqui.security.UserGroup").condition("userGroupId", FACTOR_GROUP).one()
            factorFlagBefore = group?.requireAuthcFactor || null
            // a site account (no organization) holding the third invited address
            const partyId = ec.service
                .sync()
                .name("mantle.party.PartyServices.create#Person")
                .parameters({firstName: "Sita", lastName: "Site"})
                .call().partyId
            siteUserId = ec.service
                .sync()
                .name("mantle.party.PartyServices.create#PartyUserAccount")
                .parameters({
                    partyId,
                    emailAddress: addresses.site,
                    username: "usable.site." + run,
                    newPassword: password,
                    newPasswordVerify: password
                })
                .call().userId
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            const value = ec.entity.makeValue("moqui.security.UserGroup")
            value.setFields({userGroupId: FACTOR_GROUP, requireAuthcFactor: factorFlagBefore}, true, null, null)
            value.update()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an invitation's resend makes the first link no longer valid; the second creates the account, which opens Commons with BOSS users and Purchasing",
    {
        when() {
            const first = inviteAndCopy(addresses.hire, "BOSS_PURCHASING", {firstName: "Hana", lastName: "Hire"})
            const second = asUser(users.identity, () => {
                const listed = ec.service
                    .sync()
                    .name(S + "find#Invitations")
                    .parameters({text: addresses.hire})
                    .call().invitationList[0]
                page(
                    "Users/Invitations/resendInvitation",
                    {invitationId: listed.invitationId, expectedRevision: listed.revision},
                    "html"
                )
                const shown = page("Users/Invitations", {revealInvitationId: listed.invitationId})
                return (shown.output.match(/\/i\/([A-Za-z0-9_-]{43})/) || [])[1]
            })
            logout()
            const stale = route(first)
            const created = route(second, "createAccount", {
                username: "usable.hire." + run,
                userFullName: "Hana Hire",
                newPassword: password,
                newPasswordVerify: password
            })
            const done = route(second)
            login("john.doe")
            const account = system(() =>
                ec.entity
                    .find("moqui.security.UserAccount")
                    .condition("username", "usable.hire." + run)
                    .one()
            )
            login("usable.hire." + run, password)
            ec.artifactExecution.enableAuthz()
            const commons = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Commons.xml")
                .renderMode("qvt")
                .render("", {lastStandalone: "-2"}, null)
            ec.message.clearErrors()
            login("john.doe")
            return {first, second, stale, created, done, account, commons}
        },
        then({first, second, stale, created, done, account, commons}) {
            first && second && first != second
            stale.output.includes("This invitation is no longer valid")
            created.errors.length == 0
            done.output.includes("You have joined Ziziwork Retail")
            account != null && account.emailAddress == addresses.hire
            const groups = groupsOf(account.userId)
            groups.includes("BOSS_USERS") && groups.includes("BOSS_PURCHASING") && !groups.includes("ADMIN")
            commons.status == 200
            invitationOf(addresses.hire).statusId == "UinvAccepted"
        }
    }
)

feature("a bundle whose group requires a factor stops the acceptance at the factor step", {
    when() {
        system(() => {
            const value = ec.entity.makeValue("moqui.security.UserGroup")
            value.setFields({userGroupId: FACTOR_GROUP, requireAuthcFactor: "Y"}, true, null, null)
            value.update()
        })
        const token = inviteAndCopy(addresses.factor, FACTOR_GROUP, {firstName: "Fern", lastName: "Factor"})
        logout()
        const invitation = route(token)
        route(token, "createAccount", {
            username: "usable.factor." + run,
            userFullName: "Fern Factor",
            newPassword: password,
            newPasswordVerify: password
        })
        // the key is the accepting session's or the account's: here the account, signed in (its factor not yet confirmed)
        ec.user.internalLoginUser("usable.factor." + run)
        const factor = route(token)
        login("john.doe")
        return {invitation, factor}
    },
    then({invitation, factor}) {
        invitation.output.includes("A second sign-in factor")
        factor.output.includes("Set up your authenticator app") && factor.output.includes("otpauth://totp/")
        factor.output.includes('action="/i/')
    }
})

feature(
    "a site account's address needs ADMIN_IDENTITY_GLOBAL to invite; it gets no internal access without the token, and with it is linked",
    {
        when() {
            // the identity operator, without ADMIN_IDENTITY_GLOBAL, is refused; the instance administrator invites it
            const refused = inviteAndCopy(addresses.site, "BOSS_PURCHASING")
            const notInvited = invitationOf(addresses.site) == null
            const token = inviteAndCopy(addresses.site, "BOSS_PURCHASING", {}, users.system)
            login("usable.site." + run, password)
            ec.artifactExecution.enableAuthz()
            const without = (() => {
                const out = ec.service
                    .sync()
                    .name(S + "accept#Invitation")
                    .parameters({token: "NotTheInvitationToken00000000000000000000"})
                    .call()
                ec.message.clearErrors()
                return out
            })()
            const groupsBefore = groupsOf(siteUserId)
            const withToken = route(token, "acceptExisting")
            login("john.doe")
            return {refused, notInvited, without, groupsBefore, withToken}
        },
        then({refused, notInvited, without, groupsBefore, withToken}) {
            refused == null && notInvited
            without.applied == false && without.reasonCode == "INVITATION_SPENT"
            !groupsBefore.includes("BOSS_USERS")
            withToken.errors.length == 0
            groupsOf(siteUserId).includes("BOSS_USERS")
            system(() => ec.entity.find("moqui.security.UserAccount").condition("emailAddress", addresses.site).count()) == 1
        }
    }
)
