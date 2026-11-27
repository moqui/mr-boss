// Invitations in Admin (impl-admin P5; design-admin §4 Invitations and AcceptInvitation, §4.1): with no mail server InviteStaff
// sends the invitation and Invitations shows its acceptance link once, as text with a copy button and not a link, a second
// render refusing it; AcceptInvitation's one qvt render at /i/<token> (who invited, the organization, the access by name, the
// account step's form posting under the route) and its stale-token page, "This invitation is no longer valid" for a revoked
// token. Mantle's rules are Mantle's StaffInvitation; the "usable when" is the acceptance AdminInvitationsUsable.
// Run: ./moq test mr-boss --spec Admin/AdminInvitations
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const S = "mantle.party.IdentityServices."
const run = String(Date.now()).slice(-7)
const address = "adm.invite." + run + "@example.com"
let invitationId
let token

// AcceptInvitation as the token route renders it in the public shell (qvt, no one signed in); method "post" for a form's post
function acceptPage(routeToken, parameters = {}, path = "", method = null) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/AcceptInvitation.xml")
        .renderMode("qvt")
        .render(
            path,
            Object.assign(
                {token: routeToken, tokenRoute: {name: "i", token: routeToken, basePath: "/i/" + routeToken}},
                parameters
            ),
            method
        )
    ec.message.clearErrors()
    return {status: result.status, output: String(result.output || ""), errors: Array.from(result.errorMessages || [])}
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("with no mail server InviteStaff's link is shown once on Invitations, as text with a copy button, never as a link", {
    when() {
        return asUser(users.identity, () => {
            const sent = page(
                "Users/InviteStaff/inviteStaff",
                {
                    emailAddress: address,
                    firstName: "Ida",
                    lastName: "Invited",
                    organizationPartyId: ids.organizationId,
                    bundleGroupIdList: "BOSS_PURCHASING"
                },
                "html"
            )
            invitationId = system(() =>
                ec.entity.find("mantle.party.UserInvitation").condition("emailAddress", address).one()
            )?.invitationId
            const shown = page("Users/Invitations", {revealInvitationId: invitationId})
            const again = page("Users/Invitations", {revealInvitationId: invitationId})
            return {sent, shown, again}
        })
    },
    then({sent, shown, again}) {
        sent.errors.length == 0 && invitationId
        const row = system(() => ec.entity.find("mantle.party.UserInvitation").condition("invitationId", invitationId).one())
        // BOSS_USERS always comes with the proposal
        row.bundleGroupIds == "BOSS_USERS,BOSS_PURCHASING" && row.linkShownDate != null && row.mailSent == "N"
        shown.status == 200 && shown.errors.length == 0
        token = (shown.output.match(/\/i\/([A-Za-z0-9_-]{43})/) || [])[1]
        token && shown.output.includes("m-invitation-link") && shown.output.includes("Copy the link")
        !shown.output.includes('href="' + "/i/" + token) && !shown.output.includes("/i/" + token + '"' + " class")
        shown.output.includes(address) && shown.output.includes("Purchasing app users")
        !again.output.includes("/i/" + token) && again.output.includes("shown only once")
        !JSON.stringify(row).includes(token)
    }
})

feature(
    "AcceptInvitation shows the invitation and its account step under the route; a revoked token's page says only that it is no longer valid",
    {
        when() {
            logout()
            const open = acceptPage(token, {stage: "account"})
            login("john.doe")
            asUser(users.identity, () => {
                const listed = ec.service
                    .sync()
                    .name(S + "find#Invitations")
                    .parameters({text: address})
                    .call()
                ec.service
                    .sync()
                    .name(S + "revoke#Invitation")
                    .parameters({invitationId, expectedRevision: listed.invitationList[0].revision, reason: "Spec"})
                    .call()
            })
            logout()
            const stale = acceptPage(token)
            login("john.doe")
            return {open, stale}
        },
        then({open, stale}) {
            open.status == 200 && open.errors.length == 0
            open.output.includes("Step 2 of 3: your account") && open.output.includes("Create your account")
            open.output.includes(address)
            open.output.includes('action="/i/' + token + '/createAccount"')
            stale.status == 200
            stale.output.includes("This invitation is no longer valid")
            !stale.output.includes(address) && !stale.output.includes("Ziziwork") && !stale.output.includes("m-form")
        }
    }
)

// SEC-BOS-146: each step of the invitation is a POST, as its forms send it: a GET of the account step (a link a mail client
// or a page of this site opens) makes no account, the form's post does
feature("a GET of the invitation's account step makes no account; the form's post makes it", {
    when() {
        const invited = "adm.invite.get." + run + "@example.com"
        const username = "adm.get." + run
        const tokenOf = () =>
            asUser(users.identity, () => {
                page(
                    "Users/InviteStaff/inviteStaff",
                    {emailAddress: invited, firstName: "Gia", lastName: "Get", organizationPartyId: ids.organizationId, bundleGroupIdList: "BOSS_PURCHASING"},
                    "html"
                )
                const id = system(() => ec.entity.find("mantle.party.UserInvitation").condition("emailAddress", invited).one())?.invitationId
                return (page("Users/Invitations", {revealInvitationId: id}).output.match(/\/i\/([A-Za-z0-9_-]{43})/) || [])[1]
            })
        const inviteToken = tokenOf()
        const account = {username, userFullName: "Gia Get", newPassword: "Get-" + run + "-Passw0rd!", newPasswordVerify: "Get-" + run + "-Passw0rd!"}
        const accountOf = () => system(() => ec.entity.find("moqui.security.UserAccount").condition("username", username).one())
        logout()
        acceptPage(inviteToken, account, "createAccount")
        const afterGet = accountOf()
        acceptPage(inviteToken, account, "createAccount", "post")
        const afterPost = accountOf()
        login("john.doe")
        return {inviteToken, afterGet, afterPost}
    },
    then({inviteToken, afterGet, afterPost}) {
        inviteToken != null
        afterGet == null
        afterPost != null
    }
})
