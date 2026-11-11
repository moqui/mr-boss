// Admin P18's "usable when" (impl-admin P18; design-admin §6 Devices, §14 shared-device registration; crosscut CX-DEVICE),
// as an acceptance walk with artifact authorization on, through the screens and their transitions. The identity operator
// makes a display account for Ziziwork Retail holding only the Insights reader bundle (Users, NewDisplayAccount); admin.access
// registers a browser for the Playlists route group with it (Security › Devices, RegisterDevice) and reads its code once on
// Devices; the code makes one browser the device at /Device and a second use of it makes none; that browser opens nothing
// outside the route group (Admin, Insights' other screens, its account's notifications, a REST path, the app list), a
// route-group request runs as the display account and no other, its web session signs no one in, and nothing signs in as
// the display account (a password someone gave it, Login as); Devices lists the device with when and where it was last
// seen and Services' device only as a count; revoking it in Devices refuses its next request and removes its cookie; and
// the audit reader finds the registration, the redeeming, the refused second use and the revocation in Audit › Changes,
// with no code in any of them. What the display then plays (a playlist's dashboards, ORG_ZIZI_RETAIL's numbers only) is
// Insights P11's walk. The rules are the framework's DeviceCredential and SecurityDevice (over HTTP), Mantle's
// party/SharedDevices and BOSS's AdminDevices and AdminAccess.
// Run: ./moq accept mr-boss --spec AdminDevicesUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.party.IdentityServices."
const DEVICE = "moqui.security.DeviceCredential"
const run = String(Date.now()).slice(-7)
const displayName = "Usable retail wall " + run
const username = "display.usable.retail.wall." + run
const deviceName = "Usable plant wall " + run
const otherDeviceName = "Usable services lobby " + run
const codePattern = /[a-z2-9]{4}(-[a-z2-9]{4}){4}/
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const deviceRow = () => system(() => find(DEVICE, {deviceName}).one())
// a request of a browser at the webroot: with the device cookie it is the device's, whoever is signed in on this thread
function request(path, parameters, method, cookie) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters || {}, method || "get")
    ec.message.clearErrors()
    return {
        status: out.status,
        output: String(out.output || ""),
        errors: Array.from(out.errorMessages || []).join("\n"),
        setCookie: String(out.header("Set-Cookie") || "")
    }
}
const outside = out => out.errors.includes("This device opens only INSIGHTS_PLAYLISTS")
let display
let code
let cookie

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the identity operator makes a display account for Retail with the Insights reader bundle alone", {
    when() {
        const account = {displayName, displayOrganizationPartyId: ids.organizationId, displayBundleIdList: "BOSS_INSIGHTS_READ"}
        const out = {
            // Services is not the Retail operator's to make a display for; a privileged bundle is no display's
            foreign: asUser(users.identity, () =>
                invoke(S + "create#DisplayAccount", {
                    displayName: displayName + " x",
                    organizationPartyId: ids.otherOrganizationId,
                    bundleGroupIdList: ["BOSS_INSIGHTS_READ"]
                })
            ),
            users: asUser(users.identity, () => page("Users/Users", {})),
            made: asUser(users.identity, () => page("Users/Users/createDisplayAccount", account, "html"))
        }
        ec.message.clearErrors()
        display = system(() => find("moqui.security.UserAccount", {username}).one())
        out.groups = system(() =>
            Array.from(find("moqui.security.UserGroupMember", {userId: display?.userId}).list()).map(row => row.userGroupId)
        )
        out.organizations = system(() =>
            invoke("mantle.party.PartyServices.get#PartyInternalOrgIds", {partyId: display?.partyId}).userOrgIds
        )
        // nothing signs in as it: not a password (john.doe's, copied onto it as an instance administrator could), not Login as
        const passwordFields = ["currentPassword", "passwordSalt", "passwordHashType", "passwordBase64"]
        system(() => {
            const source = find("moqui.security.UserAccount", {username: "john.doe"}).one()
            const account = find("moqui.security.UserAccount", {userId: display.userId}).one()
            for (const field of passwordFields) account[field] = source[field]
            account.update()
        })
        out.passwordLogin = ec.user.loginUser(username, "moqui")
        out.userAfterLogin = ec.user.username
        ec.message.clearErrors()
        login("john.doe")
        out.loginAs = asUser(users.system, () =>
            lib.refusal("ironstone.admin.ContextServices.check#Record", {recordType: "user", recordId: display.userId, capability: "identityManage", loginAs: true})
        )
        // the password is taken off again: a display account with one serves no device
        system(() => {
            const account = find("moqui.security.UserAccount", {userId: display.userId}).one()
            for (const field of passwordFields) account[field] = null
            account.update()
        })
        return out
    },
    then({foreign, users, groups, organizations, passwordLogin, userAfterLogin, loginAs}) {
        foreign.applied !== true
        opened(users) && users.output.includes("NewDisplayAccount")
        display != null && display.displayAccount == "Y" && display.emailAddress == null
        groups.join() == "BOSS_INSIGHTS_READ"
        Array.from(organizations).includes(ids.organizationId) && !Array.from(organizations).includes(ids.otherOrganizationId)
        passwordLogin !== true && userAfterLogin != username
        loginAs.includes("display account")
    }
})

feature("admin.access registers a browser for the Playlists route group and reads its code once", {
    when() {
        // Services' display account and device, an instance administrator's
        const other = system(() =>
            invoke(S + "create#DisplayAccount", {
                displayName: "Usable services wall " + run,
                organizationPartyId: ids.otherOrganizationId,
                bundleGroupIdList: ["BOSS_INSIGHTS_READ"]
            })
        )
        system(() =>
            invoke(S + "register#SharedDevice", {
                deviceName: otherDeviceName,
                routeGroupId: "INSIGHTS_PLAYLISTS",
                displayUserId: other.userId,
                parameterValue: "UsablePlaylist",
                issueCode: false
            })
        )
        const registration = displayUserId => ({deviceName, newRouteGroupId: "INSIGHTS_PLAYLISTS", newParameterValue: "UsablePlaylist", displayUserId, reason: "Usable: plant floor"})
        const out = {}
        asUser(users.reader, () => page("Security/Devices/registerDevice", registration(display.userId), "html"))
        asUser(users.configure, () => page("Security/Devices/registerDevice", registration(display.userId), "html"))
        asUser(users.access, () => page("Security/Devices/registerDevice", registration(other.userId), "html"))
        out.before = deviceRow()
        asUser(users.access, () => page("Security/Devices/registerDevice", registration(display.userId), "html"))
        const device = deviceRow()
        out.shown = asUser(users.access, () => page("Security/Devices", {revealDeviceId: device.deviceId}))
        code = (out.shown.output.match(codePattern) || [""])[0]
        out.again = asUser(users.access, () => page("Security/Devices", {revealDeviceId: device.deviceId}))
        out.stored = deviceRow()
        return out
    },
    then({before, shown, again, stored}) {
        before == null
        opened(shown) && code.length == 24 && shown.output.includes("shown only now")
        shown.output.includes(deviceName) && shown.output.includes(displayName) && shown.output.includes("Insights wall display")
        // Services' device is a count, and the code is not shown twice or stored
        !shown.output.includes(otherDeviceName) && shown.output.includes("other device(s) belong to organizations you do not administer")
        opened(again) && !codePattern.test(again.output.replace(/display\.[a-z0-9.]+/g, "")) && again.output.includes("shown only once")
        stored.registrationCodeHash != null && !JSON.stringify(stored.getMap()).includes(code)
    }
})

feature("the code works once; the browser opens nothing outside the route group and signs no one in", {
    when() {
        const out = {redeemed: request("Device/redeem", {code}, "post")}
        cookie = out.redeemed.setCookie.split(";")[0].replace("moqui.device=", "")
        out.replayed = request("Device/redeem", {code}, "post")
        login("john.doe")
        out.page = request("Device", {}, "get", cookie)
        out.data = request("apps/Insights/WallDisplay/data", {definitionId: "AnotherPlaylist"}, "get", cookie)
        out.refused = [
            "apps/Admin/Home",
            "apps/Admin/Security/Devices",
            "apps/Insights/Home",
            "apps/Insights/Dashboards",
            "apps/Commons/Notifications",
            "apps/AppList",
            "rest/s1/moqui/basic/geos/USA",
            "Login"
        ].filter(path => !outside(request(path, {}, "get", cookie)))
        out.userAfter = ec.user.username
        out.listed = asUser(users.access, () => page("Security/Devices", {}, "html"))
        return out
    },
    then({redeemed, replayed, page, data, refused, userAfter, listed}) {
        redeemed.setCookie.includes("HttpOnly") && redeemed.setCookie.includes("SameSite=Strict") && cookie.length > 40
        replayed.setCookie == ""
        page.output.includes("registered as " + deviceName)
        // admitted by the route group, then decided as the display account (the reader bundle alone, no launcher)
        !outside(data) && data.errors.includes("User " + display.userId + " is not authorized")
        refused.join() == ""
        userAfter == "john.doe"
        opened(listed) && listed.output.includes(deviceName) && listed.output.includes("Active")
        !JSON.stringify(deviceRow().getMap()).includes(cookie.split(".")[1])
    }
})

feature("revoking the device in Devices refuses its next request, and the audit reader finds what happened to it", {
    when() {
        const device = deviceRow()
        const out = {}
        asUser(users.configure, () => page("Security/Devices/revokeDevice", {deviceId: device.deviceId}, "html"))
        out.afterConfigure = deviceRow().revokedDate
        asUser(users.access, () => page("Security/Devices/revokeDevice", {deviceId: device.deviceId}, "html"))
        out.next = request("apps/Insights/WallDisplay/data", {}, "get", cookie)
        out.revoked = deviceRow()
        out.audit = asUser(users.audit, () => page("Audit/AuditChanges", {recordKey: display.userId}, "html"))
        // the page's text as read: the html render escapes an apostrophe ("Shared device's code redeemed")
        out.audit.output = out.audit.output.replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
        return out
    },
    then({afterConfigure, next, revoked, audit}) {
        afterConfigure == null
        next.errors.includes("registration was revoked")
        revoked.revokedDate != null && revoked.stopReason == "revoked"
        opened(audit)
        audit.output.includes("Shared device registered") && audit.output.includes("Shared device's code redeemed")
        audit.output.includes("Shared device refused") && audit.output.includes("Shared device revoked")
        !audit.output.includes(code)
    }
})
