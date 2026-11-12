// Shared devices in Admin (impl-admin P18; design-admin §6 Devices, §14 shared-device registration; crosscut CX-DEVICE): the
// identity operator makes a display account in Users (NewDisplayAccount), the access administrator registers a device for it
// in Security › Devices for Insights' wall display, and Devices' one qvt render shows the device, its code this once and
// another organization's device only as a count; the code makes one browser the device, which is then refused everything
// outside its route group (Admin, Insights' other screens, its own account's pages), and revoking it in Devices refuses its
// next request. The services' rules are Mantle's (party/SharedDevices) and the credential's the framework's
// (DeviceCredential, user::device::tests); who may register is AdminAccess's. What a registered display plays is Insights
// P11's (InsightsWallDisplay).
// Run: ./moq test mr-boss --spec Admin/AdminDevices
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, ids, asUser, system, invoke, page} = lib
const S = "mantle.party.IdentityServices."
const DEVICE = "moqui.security.DeviceCredential"
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const deviceNamed = name => system(() => find(DEVICE, {deviceName: name}).one())
const accountNamed = username => system(() => find("moqui.security.UserAccount", {username}).one())
// a request of a browser at the webroot: with the device cookie it is the device's, whoever is signed in on this thread
function request(path, parameters, method, cookie) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters || {}, method || "get")
    ec.message.clearErrors()
    return {status: out.status, errors: Array.from(out.errorMessages || []).join("\n"), setCookie: out.header("Set-Cookie")}
}
const outsideRouteGroup = out => out.errors.includes("This device opens only INSIGHTS_PLAYLISTS")
let display
let device
let cookie
let rendered

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // a device another component's spec left under a name this one uses (Mantle's SharedDevices, when a run puts both
        // on one database) is not this spec's refusal to find
        ec.artifactExecution.disableAuthz()
        ec.entity.find(DEVICE).condition("deviceName", "like", "Spec %").deleteAll()
        ec.artifactExecution.enableAuthz()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        ec.entity.find(DEVICE).condition("deviceName", "like", "Spec %").deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the identity operator makes a display account in Users and the access administrator registers a device for it", {
    when() {
        const account = {displayName: "Spec retail wall", displayOrganizationPartyId: ids.organizationId, displayBundleIdList: "BOSS_INSIGHTS_READ"}
        const out = {}
        // the access administrator opens no Users area; the identity operator makes the account
        asUser(users.access, () => page("Users/Users/createDisplayAccount", account, "html"))
        out.byAccess = accountNamed("display.spec.retail.wall")
        asUser(users.identity, () => page("Users/Users/createDisplayAccount", account, "html"))
        display = accountNamed("display.spec.retail.wall")
        // another organization's display account and its device, made by an instance administrator
        const other = system(() =>
            invoke(S + "create#DisplayAccount", {
                displayName: "Spec services wall",
                organizationPartyId: ids.otherOrganizationId,
                bundleGroupIdList: ["BOSS_INSIGHTS_READ"]
            })
        )
        system(() =>
            invoke(S + "register#SharedDevice", {
                deviceName: "Spec services lobby",
                routeGroupId: "INSIGHTS_PLAYLISTS",
                displayUserId: other.userId,
                parameterValue: "SpecPlaylist",
                issueCode: false
            })
        )
        const registration = displayUserId => ({
            deviceName: "Spec plant wall",
            newRouteGroupId: "INSIGHTS_PLAYLISTS",
            newParameterValue: "SpecPlaylist",
            displayUserId
        })
        // the configuration administrator opens the Security area and holds no ADMIN_ACCESS_MANAGE; the access administrator
        // is refused Services' display account, and registers Retail's
        asUser(users.configure, () => page("Security/Devices/registerDevice", registration(display?.userId), "html"))
        out.byConfigure = deviceNamed("Spec plant wall")
        asUser(users.access, () => page("Security/Devices/registerDevice", registration(other.userId), "html"))
        out.forOther = deviceNamed("Spec plant wall")
        asUser(users.access, () => page("Security/Devices/registerDevice", registration(display?.userId), "html"))
        device = deviceNamed("Spec plant wall")
        return out
    },
    then({byAccess, byConfigure, forOther}) {
        byAccess == null
        display != null && display.displayAccount == "Y" && display.currentPassword == null && display.emailAddress == null
        byConfigure == null && forOther == null
        // registered without a code: it is made at the render that shows it
        device != null && device.registrationCodeHash == null && device.parameterValue == "SpecPlaylist"
        device.registeredByUserId != null && device.displayUserId == display.userId
    }
})

feature("Devices shows the device and its code this once, and another organization's device only as a count", {
    when() {
        rendered = asUser(users.access, () => page("Security/Devices", {revealDeviceId: device.deviceId}))
        return {
            rendered,
            again: asUser(users.access, () => invoke(S + "reveal#SharedDeviceCode", {deviceId: device.deviceId})),
            stored: deviceNamed("Spec plant wall")
        }
    },
    then({rendered, again, stored}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("DeviceFind") && rendered.output.includes("DeviceList") && rendered.output.includes("RegisterDevice")
        rendered.output.includes("Spec plant wall") && rendered.output.includes("Insights wall display")
        rendered.output.includes("Spec retail wall") && rendered.output.includes("Waiting for its code")
        // the code, shown at this render and never again
        const codes = rendered.output.match(/[a-z2-9]{4}(-[a-z2-9]{4}){4}/g) || []
        new Set(codes).size == 1
        rendered.output.includes("shown only now")
        again.applied === false && again.reasonCode == "CODE_SHOWN"
        stored.registrationCodeHash != null && !String(stored.registrationCodeHash).includes(codes[0])
        // Services' device is counted, never named
        !rendered.output.includes("Spec services lobby") && !rendered.output.includes("Spec services wall")
        rendered.output.includes("1 other device(s) belong to organizations you do not administer")
    }
})

feature("the code makes one browser the device, which opens nothing outside its route group, until it is revoked in Devices", {
    when() {
        const code = (rendered.output.match(/[a-z2-9]{4}(-[a-z2-9]{4}){4}/) || [""])[0]
        const out = {redeemed: request("Device/redeem", {code}, "post")}
        cookie = String(out.redeemed.setCookie || "")
            .split(";")[0]
            .replace("moqui.device=", "")
        // redeeming signs out whoever was signed in on the browser's session (this thread's, here)
        login("john.doe")
        out.data = request("apps/Insights/WallDisplay/data", {definitionId: "AnotherPlaylist"}, "get", cookie)
        out.admin = request("apps/Admin/Security/Devices", {}, "get", cookie)
        out.insightsHome = request("apps/Insights/Home", {}, "get", cookie)
        out.account = request("apps/Commons/Notifications", {}, "get", cookie)
        out.editor = request("apps/Insights/Playlists/createPlaylist", {playlistId: "SpecDevicePlaylist"}, "post", cookie)
        out.seen = deviceNamed("Spec plant wall")
        asUser(users.access, () => page("Security/Devices/revokeDevice", {deviceId: device.deviceId}, "html"))
        out.revoked = deviceNamed("Spec plant wall")
        out.next = request("apps/Insights/WallDisplay/data", {}, "get", cookie)
        return out
    },
    then({redeemed, data, admin, insightsHome, account, editor, seen, revoked, next}) {
        String(redeemed.setCookie).includes("HttpOnly") && cookie.startsWith(device.deviceId + ".")
        // its route group's transition is not refused it; everything else is, whatever its account may read
        // (admitted, and then decided as the display account, which holds the reader bundle alone and not the launcher's)
        !outsideRouteGroup(data) && data.errors.includes("User " + display.userId + " is not authorized")
        outsideRouteGroup(admin) && outsideRouteGroup(insightsHome) && outsideRouteGroup(account) && outsideRouteGroup(editor)
        seen.redeemedDate != null && seen.lastSeenDate != null
        revoked.revokedDate != null && revoked.revokedByUserId != null
        next.errors.includes("registration was revoked")
    }
})
