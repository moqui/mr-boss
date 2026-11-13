// People P30's "usable when" (impl-people P30; design-people §6 ClockingKiosk, §1.4 Devices, §15 the badge; crosscut CX-DEVICE),
// as an acceptance walk with artifact authorization on, through the screens and their transitions: the identity operator makes a
// display account for Ziziwork Retail with the kiosk bundle alone (Admin › Users) and the access administrator registers a tablet
// for the clocking route group and reads its code once (Security › Devices); the code makes one browser the tablet at /Device. HR
// issues Tomas's and Ines's badges from Employee360 (Tomas's with a one-time PIN; Ines's clocking turned on in Attendance's Who
// clocks) and prints each once (a POST to BadgePrint's print, follow-up 4); the instance administrator issues Kenji's (Ziziwork
// Services); Tomas sets his own PIN on SelfService (Ines and Kenji have no account here: their PINs are written as set#MyKioskPin
// writes them, once Ines's badge was refused for having none). As the tablet, with no one signed in: the kiosk's page and its
// form, Tomas and Ines clock in by badge and PIN, Kenji is refused as another employer's worker, and the tablet opens nothing
// else of People, the directory, self-service, the shell or the app list; revoking it in Admin refuses its next request. The
// rules are Mantle's KioskIdentity and mr-boss's PeopleKiosk, the credential the framework's (DeviceCredential).
// Run: ./moq accept mr-boss --spec PeopleKioskUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system} = lib
const admin = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const DEVICE = "moqui.security.DeviceCredential"
const PUNCH = "mantle.humanres.attendance.AttendancePunch"
const webroot = "component://webroot/screen/webroot.xml"
const kiosk = "apps/People/Time/ClockingKiosk"
const run = String(Date.now()).slice(-7)
const displayName = "Usable clock " + run
const deviceName = "Usable store entrance " + run
const codePattern = /[a-z2-9]{4}(-[a-z2-9]{4}){4}/
const numberPattern = /\d{4} \d{4} \d{4} \d{4} \d{4}/
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const state = {}
// a request of a browser at the web root: with the device cookie it is the device's, whoever is signed in on this thread; the
// messages a transition answered with
function request(path, parameters, cookie, mode, method) {
    let test = ec.screen.makeTest().rootScreen(webroot)
    if (mode) test = test.renderMode(mode)
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters || {}, method || "get")
    const messages = Array.from(ec.message.messages || []).join(" | ")
    ec.message.clearAll()
    return {
        status: out.status,
        output: String(out.output || ""),
        errors: Array.from(out.errorMessages || []).join("\n"),
        messages,
        setCookie: String(out.header("Set-Cookie") || "")
    }
}
const asRequest = (user, path, parameters, mode, method) => asUser(user, () => request(path, parameters, null, mode, method))
const outside = out => out.errors.includes("This device opens only PEOPLE_CLOCKING")
// a badge issued from Employee360 by the user with a one-time PIN or none, then printed once: its number
function badge(user, partyId, partyRelationshipId, oneTimePin) {
    asRequest(
        user,
        "apps/People/Employees/Employee360/issueBadge",
        {partyId, partyRelationshipId, newPassword: oneTimePin || ""},
        null,
        "post"
    )
    const issued = system(() =>
        find("mantle.humanres.attendance.KioskBadge", {partyRelationshipId}).orderBy("-issuedDate").limit(1).one()
    )
    // printing is a POST to BadgePrint's print, answered with the printable badge (follow-up 4)
    const printed = asRequest(user, "apps/People/Employees/BadgePrint/print", {kioskBadgeId: issued?.kioskBadgeId}, null, "post")
    return (numberPattern.exec(printed.output) || [""])[0]
}
const latestBadge = partyRelationshipId =>
    system(() => find("mantle.humanres.attendance.KioskBadge", {partyRelationshipId}).orderBy("-issuedDate").limit(1).one())
// the PIN of a worker with no account here, written as set#MyKioskPin writes it
const ownPin = (partyRelationshipId, pin) =>
    system(() =>
        ec.service
            .sync()
            .name("update#mantle.humanres.attendance.KioskBadge")
            .parameters({
                kioskBadgeId: latestBadge(partyRelationshipId).kioskBadgeId,
                pinHash: ec.user.hashPassword(pin),
                pinSetDate: ec.user.nowTimestamp,
                oneTimePinHash: null
            })
            .call()
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearAll()
        login("john.doe")
    }
})

feature(
    "a display account for Retail with the kiosk bundle is made, and admin.access registers the tablet and reads its code once",
    {
        when() {
            asUser(admin.users.identity, () =>
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Admin.xml")
                    .render(
                        "Users/Users/createDisplayAccount",
                        {displayName, displayOrganizationPartyId: ids.organizationId, displayBundleIdList: "BOSS_PEOPLE_KIOSK"},
                        "post"
                    )
            )
            state.display = system(() => find("moqui.security.UserAccount", {userFullName: displayName}).one())
            asUser(admin.users.access, () =>
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Admin.xml")
                    .render(
                        "Security/Devices/registerDevice",
                        {deviceName, newRouteGroupId: "PEOPLE_CLOCKING", displayUserId: state.display?.userId},
                        "post"
                    )
            )
            const device = system(() => find(DEVICE, {deviceName}).one())
            const shown = asUser(admin.users.access, () =>
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Admin.xml")
                    .renderMode("html")
                    .render("Security/Devices", {revealDeviceId: device?.deviceId}, null)
            )
            const code = (String(shown.output || "").match(codePattern) || [""])[0]
            const redeemed = request("Device/redeem", {code}, null, null, "post")
            state.cookie = redeemed.setCookie.split(";")[0].replace("moqui.device=", "")
            state.deviceId = device?.deviceId
            login("john.doe")
            return {device}
        },
        then({device}) {
            state.display != null && state.display.displayAccount == "Y"
            device != null && device.routeGroupId == "PEOPLE_CLOCKING" && device.displayUserId == state.display.userId
            state.cookie.startsWith(device.deviceId + ".")
        }
    }
)

feature("HR issues Tomas's and Ines's badges from Employee360 and prints each once; Kenji's is issued at Ziziwork Services", {
    when() {
        // Ines clocks too: HR turns it on in Attendance's Who clocks
        asRequest(
            users.hr,
            "apps/People/Time/Attendance/storeClocking",
            {partyRelationshipId: ids.reportEmploymentId, clockingEnabled: "Y", reason: "Kiosk at the store entrance"},
            null,
            "post"
        )
        state.tomas = badge(users.hr, ids.employeePartyId, ids.employmentId, "6402")
        state.ines = badge(users.hr, ids.reportPartyId, ids.reportEmploymentId)
        state.kenji = badge(users.system, ids.otherEmployeePartyId, ids.otherEmploymentId)
        // Tomas sets his own PIN on SelfService under Commons, with the one-time PIN HR gave him
        const pinSet = asRequest(
            users.employee,
            "apps/Commons/People/SelfService/setMyPin",
            {kioskBadgeId: latestBadge(ids.employmentId).kioskBadgeId, currentPassword: "6402", newPassword: "3816"},
            null,
            "post"
        )
        ownPin(ids.otherEmploymentId, "9044")
        // a second print of Tomas's badge says it was printed, and its page shows when, never the number
        const tomasBadge = system(() =>
            find("mantle.humanres.attendance.KioskBadge", {partyRelationshipId: ids.employmentId})
                .orderBy("-issuedDate")
                .limit(1)
                .one()
        )
        const again = asRequest(
            users.hr,
            "apps/People/Employees/BadgePrint/print",
            {kioskBadgeId: tomasBadge.kioskBadgeId},
            null,
            "post"
        )
        const shown = asRequest(
            users.hr,
            "apps/People/Employees/BadgePrint",
            {kioskBadgeId: tomasBadge.kioskBadgeId},
            "html-print"
        )
        return {again, shown, pinSet}
    },
    then({again, shown, pinSet}) {
        state.tomas != "" && state.ines != "" && state.kenji != ""
        pinSet.messages.includes("Your clocking PIN is set")
        again.output.includes("printed already") && !numberPattern.test(again.output)
        shown.output.includes("was printed on") && !numberPattern.test(shown.output)
    }
})

feature(
    "as the tablet, with no one signed in: Tomas and Ines clock in by badge and PIN, Kenji is refused, and nothing else opens",
    {
        when() {
            const punch = (number, pin, key) =>
                request(kiosk + "/punch", {badgeText: number, password: pin, operationKey: key + run}, state.cookie, null, "post")
            const before = system(() => find(PUNCH, {deviceId: state.deviceId}).count())
            const inesNoPin = punch(state.ines, "5270", "ines-none-")
            ownPin(ids.reportEmploymentId, "5270")
            return {
                page: request(kiosk, {}, state.cookie),
                island: request(kiosk, {}, state.cookie, "qvt"),
                tomas: punch(state.tomas, "3816", "tomas-"),
                inesNoPin,
                ines: punch(state.ines, "5270", "ines-"),
                kenji: punch(state.kenji, "9044", "kenji-"),
                wrong: punch(state.ines, "0000", "ines-wrong-"),
                added: system(() => find(PUNCH, {deviceId: state.deviceId}).count()) - before,
                refused: {
                    home: request("apps/People/Home", {}, state.cookie),
                    directory: request("apps/People/Employees/List", {}, state.cookie),
                    selfService: request("apps/People/SelfService", {}, state.cookie),
                    attendance: request("apps/People/Time/Attendance", {}, state.cookie),
                    rates: request("apps/People/Payroll/Rates", {}, state.cookie),
                    shell: request("qapps/People/Time/ClockingKiosk", {}, state.cookie),
                    apps: request("apps/AppList", {}, state.cookie),
                    commons: request("apps/Commons/Home", {}, state.cookie)
                }
            }
        },
        then({page, island, tomas, inesNoPin, ines, kenji, wrong, added, refused}) {
            inesNoPin.messages.includes("Set your PIN in self-service first")
            page.status == 200 && page.output.includes('data-moqui-island="clocking-kiosk"')
            island.status == 200 && island.output.includes("IdentifyAndClock") && island.output.includes("Ziziwork Retail")
            tomas.messages.includes("Tomas") && tomas.messages.includes("clocked in at")
            ines.messages.includes("clocked in at")
            kenji.messages.includes("not for this clock's employer") && !kenji.messages.includes("clocked")
            wrong.messages.includes("The PIN is not right")
            added == 2
            Object.entries(refused)
                .filter(([, out]) => !outside(out))
                .map(([name]) => name)
                .join(", ") == ""
        }
    }
)

feature("revoking the tablet in Admin refuses its next request", {
    when() {
        asUser(admin.users.access, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Admin.xml")
                .render("Security/Devices/revokeDevice", {deviceId: state.deviceId, reason: "Tablet replaced"}, "post")
        )
        return {next: request(kiosk, {}, state.cookie)}
    },
    then({next}) {
        // the screen test answers a refused device's request with its error and no status; over HTTP it is a 403
        // (the framework's DeviceCredential and SecurityDevice specs)
        next.errors.includes("registration was revoked") && !next.output.includes("IdentifyAndClock")
    }
})
