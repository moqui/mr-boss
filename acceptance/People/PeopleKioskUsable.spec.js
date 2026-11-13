// People P30's "usable when" (impl-people P30; design-people §6 ClockingKiosk, §1.4 Devices, §15 the badge; crosscut CX-DEVICE), as
// an acceptance walk with artifact authorization on, through the screens and their transitions: the identity operator makes a
// display account for Ziziwork Retail with the kiosk bundle alone (Admin › Users) and the access administrator registers a tablet
// for the clocking route group and reads its code once (Security › Devices); the code makes one browser the tablet at /Device. HR
// issues Tomas's and Ines's badges from Employee360 with their PINs (Ines's clocking turned on in Attendance's Who clocks) and
// prints each once; the instance administrator issues Kenji's (Ziziwork Services). As the tablet, with no one signed in: the
// kiosk's page and its form, Tomas and Ines clock in by badge and PIN, Kenji is refused as another employer's worker, and the tablet
// opens nothing else of People, the directory, self-service, the shell or the app list; revoking it in Admin refuses its next
// request. The rules are Mantle's KioskIdentity and mr-boss's PeopleKiosk, the credential the framework's (DeviceCredential).
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
// a badge issued from Employee360 by the user with the PIN, then printed once: its number
function badge(user, partyId, partyRelationshipId, pin) {
    asRequest(
        user,
        "apps/People/Employees/Employee360/issueBadge",
        {partyId, partyRelationshipId, newPassword: pin},
        null,
        "post"
    )
    const issued = system(() =>
        find("mantle.humanres.attendance.KioskBadge", {partyRelationshipId}).orderBy("-issuedDate").limit(1).one()
    )
    const printed = asRequest(user, "apps/People/Employees/BadgePrint", {kioskBadgeId: issued?.kioskBadgeId}, "html-print")
    return (numberPattern.exec(printed.output) || [""])[0]
}

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
        state.tomas = badge(users.hr, ids.employeePartyId, ids.employmentId, "3816")
        state.ines = badge(users.hr, ids.reportPartyId, ids.reportEmploymentId, "5270")
        state.kenji = badge(users.system, ids.otherEmployeePartyId, ids.otherEmploymentId, "9044")
        // a second print of Tomas's badge says it was printed
        const tomasBadge = system(() =>
            find("mantle.humanres.attendance.KioskBadge", {partyRelationshipId: ids.employmentId})
                .orderBy("-issuedDate")
                .limit(1)
                .one()
        )
        const again = asRequest(
            users.hr,
            "apps/People/Employees/BadgePrint",
            {kioskBadgeId: tomasBadge.kioskBadgeId},
            "html-print"
        )
        return {again}
    },
    then({again}) {
        state.tomas != "" && state.ines != "" && state.kenji != ""
        again.output.includes("printed already") && !numberPattern.test(again.output)
    }
})

feature(
    "as the tablet, with no one signed in: Tomas and Ines clock in by badge and PIN, Kenji is refused, and nothing else opens",
    {
        when() {
            const punch = (number, pin, key) =>
                request(kiosk + "/punch", {badgeText: number, password: pin, operationKey: key + run}, state.cookie, null, "post")
            const before = system(() => find(PUNCH, {deviceId: state.deviceId}).count())
            return {
                page: request(kiosk, {}, state.cookie),
                island: request(kiosk, {}, state.cookie, "qvt"),
                tomas: punch(state.tomas, "3816", "tomas-"),
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
        then({page, island, tomas, ines, kenji, wrong, added, refused}) {
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
        next.status == 403 && !next.output.includes("IdentifyAndClock")
    }
})
