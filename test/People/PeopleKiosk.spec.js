// The clocking kiosk (impl-people P30; design-people §6 ClockingKiosk, §1.4 Devices, §15 the badge; crosscut CX-DEVICE): HR issues
// Tomas's badge with a one-time PIN and prints it once, by a POST to BadgePrint's print (the barcode and the number; a GET of the
// page before makes nothing and refuses, a GET of the print is refused, and the page after says it was printed: follow-up 4); the
// burst notice's device opens Admin's Security › Devices for the access administrator and nowhere for HR, and a stopped badge's
// notice to its worker opens their SelfService under Commons (follow-up 4); and Tomas,
// with self-service alone, sets his own PIN through SelfService's setMyPin under Commons (the one-time PIN asked); a display account
// for Retail holding the kiosk bundle alone is made and a tablet registered for the PEOPLE_CLOCKING route group and redeemed; as the
// tablet, the bare page (the one html render) and its island (the one qvt render: the form, the employer, no "not a device" note), a
// scan resolved, and Tomas clocking in by badge and PIN, a retry with the scan's key answering the first, and clocking out; People's
// other screens, the directory, self-service, the /qapps shell and the badge print refused by the route group. As an HR officer, a
// person not on a device, the page's one tui render says it is no clocking device and a punch through it is refused. The rules of
// the badge and the punch are Mantle's (KioskIdentity); the credential and the gate are the framework's (DeviceCredential).
// Run: ./moq test mr-boss --spec PeopleKiosk
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const kiosk = "apps/People/Time/ClockingKiosk"
const DEVICE = "moqui.security.DeviceCredential"
const PUNCH = "mantle.humanres.attendance.AttendancePunch"
const pin = "4827"
const oneTimePin = "1590"
const state = {}
// a request of a browser at the web root: with the device cookie it is the device's, whoever is signed in on this thread; its
// messages (a transition's answer) read before they are cleared
function request(path, parameters, cookie, mode, method, json) {
    let test = ec.screen.makeTest().rootScreen(webroot)
    if (mode) test = test.renderMode(mode)
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    if (json) test = test.header("Accept", "application/json")
    const out = test.render(path, parameters || {}, method || "get")
    const messages = Array.from(ec.message.messages || []).join(" | ")
    ec.message.clearAll()
    return {
        status: out.status,
        output: String(out.output || ""),
        errors: Array.from(out.errorMessages || []).join("\n"),
        messages
    }
}
const outside = out => out.errors.includes("This device opens only PEOPLE_CLOCKING")
const kioskPunches = () =>
    system(() => ec.entity.find(PUNCH).condition({partyRelationshipId: ids.employmentId, sourceEnumId: "AtsKiosk"}).count())

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearAll()
        login("john.doe")
        system(() => ec.entity.find(DEVICE).condition("deviceName", "like", "Spec clock%").deleteAll())
    }
})

feature("HR prints Tomas's badge once, and a tablet is registered for Retail's clocking kiosk and redeemed", {
    when() {
        // the service as Employee360's issueBadge calls it, under the People root's grant (Mantle checks the HR officer itself)
        const issued = asUser(users.hr, () =>
            system(() =>
                invoke("mantle.humanres.AttendanceServices.issue#KioskBadge", {partyRelationshipId: ids.employmentId, oneTimePin})
            )
        )
        // a GET makes nothing (a link another site has HR open spends no badge): the page refuses, and the print is a POST
        const page = path =>
            request("apps/People/Employees/BadgePrint" + path, {kioskBadgeId: issued.kioskBadgeId}, null, "html-print")
        const before = asUser(users.hr, () => page(""))
        const printGet = asUser(users.hr, () => page("/print"))
        const unprinted = system(
            () =>
                ec.entity.find("mantle.humanres.attendance.KioskBadge").condition("kioskBadgeId", issued.kioskBadgeId).one()
                    .tokenHash
        )
        // the print, as its issuer: a POST answered with the printable badge, the number made now and shown once
        const printed = asUser(users.hr, () =>
            request("apps/People/Employees/BadgePrint/print", {kioskBadgeId: issued.kioskBadgeId}, null, null, "post")
        )
        state.number = (/\d{4} \d{4} \d{4} \d{4} \d{4}/.exec(printed.output) || [""])[0]
        const after = asUser(users.hr, () => page(""))
        // Tomas sets his own PIN on SelfService under Commons (his self-service grant): the one-time PIN asked, his PIN HR never sees
        const pinSet = asUser(users.employee, () =>
            request(
                "apps/Commons/People/SelfService/setMyPin",
                {kioskBadgeId: issued.kioskBadgeId, currentPassword: oneTimePin, newPassword: pin},
                null,
                null,
                "post"
            )
        )
        // the display account (Retail's, the kiosk bundle alone) made by the identity operator's service, and its device
        let display = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "display.spec.clock").one())
        if (!display) {
            invoke("mantle.party.IdentityServices.create#DisplayAccount", {
                displayName: "Spec clock",
                organizationPartyId: ids.organizationId,
                bundleGroupIdList: ["BOSS_PEOPLE_KIOSK"]
            })
            display = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "display.spec.clock").one())
        }
        state.displayUserId = display?.userId
        const registered = invoke("mantle.party.IdentityServices.register#SharedDevice", {
            deviceName: "Spec clock entrance",
            routeGroupId: "PEOPLE_CLOCKING",
            displayUserId: display?.userId,
            issueCode: false
        })
        state.deviceId = registered.deviceId
        const code = invoke("mantle.party.IdentityServices.reveal#SharedDeviceCode", {
            deviceId: registered.deviceId
        }).registrationCode
        const redeemed = ec.screen.makeTest().rootScreen(webroot).render("Device/redeem", {code}, "post")
        state.cookie = String(redeemed.header("Set-Cookie") || "")
            .split(";")[0]
            .replace("moqui.device=", "")
        login("john.doe")
        return {issued, before, printGet, unprinted, printed, after, pinSet, display, registered}
    },
    then({issued, before, printGet, unprinted, printed, after, pinSet, display, registered}) {
        issued.kioskBadgeId != null
        before.output.includes("not printed yet") && !/\d{4} \d{4} \d{4} \d{4} \d{4}/.test(before.output) && unprinted == null
        printGet.status == 405
        after.output.includes("was printed on") && !after.output.includes(state.number) && !after.output.includes("<svg")
        pinSet.errors == "" && pinSet.messages.includes("Your clocking PIN is set")
        printed.status == 200 &&
            printed.errors == "" &&
            printed.output.includes("<svg") &&
            printed.output.includes("Clocking badge")
        printed.output.includes("Tomas") && state.number != "" && !/Error rendering|Exception in render/.test(printed.output)
        display != null && display.displayAccount == "Y"
        registered.applied === true && registered.deviceId != null && state.cookie.includes(".")
    }
})

feature("as the tablet: the bare page and its form, Tomas clocks in and out by badge and PIN, and nothing else of People opens", {
    when() {
        const out = {
            html: request(kiosk, {}, state.cookie),
            island: request(kiosk, {}, state.cookie, "qvt"),
            resolved: request(
                kiosk + "/scanResolve",
                {scanForm: "IdentifyAndClock", scanField: "badgeText", scanText: state.number},
                state.cookie
            )
        }
        const before = kioskPunches()
        const punch = (parameters, json) =>
            request(
                kiosk + "/punch",
                Object.assign({badgeText: state.number, password: pin}, parameters),
                state.cookie,
                null,
                "post",
                json
            )
        out.wrongPin = punch({password: "0000", operationKey: "spec-kiosk-0"})
        out.clockIn = punch({operationKey: "spec-kiosk-1"})
        // the retry as the island's form posts it: the answer's message, and the page at its own path, which the island loads again
        out.retry = punch({operationKey: "spec-kiosk-1"}, true)
        out.clockOut = punch({operationKey: "spec-kiosk-2"})
        out.added = kioskPunches() - before
        out.lastPunch = system(() =>
            ec.entity
                .find(PUNCH)
                .condition({partyRelationshipId: ids.employmentId, sourceEnumId: "AtsKiosk"})
                .orderBy("-punchDate")
                .limit(1)
                .one()
        )
        out.refused = {
            home: request("apps/People/Home", {}, state.cookie),
            directory: request("apps/People/Employees/List", {}, state.cookie),
            employee: request("apps/People/Employees/Employee360", {partyId: ids.employeePartyId}, state.cookie),
            selfService: request("apps/People/SelfService", {}, state.cookie),
            attendance: request("apps/People/Time/Attendance", {}, state.cookie),
            badgePrint: request("apps/People/Employees/BadgePrint", {kioskBadgeId: "0"}, state.cookie),
            badgePrintPost: request("apps/People/Employees/BadgePrint/print", {kioskBadgeId: "0"}, state.cookie, null, "post"),
            shell: request("qapps/People/Time/ClockingKiosk", {}, state.cookie),
            search: request("apps/People/Employees/List/choices", {}, state.cookie)
        }
        return out
    },
    then({html, island, resolved, wrongPin, clockIn, retry, clockOut, added, lastPunch, refused}) {
        // the bare page: the qvt client's files and the screen as an island, no navigation or app menu
        html.status == 200 && html.errors == ""
        html.output.includes("<!DOCTYPE html>") && html.output.includes('data-moqui-island="clocking-kiosk"')
        html.output.includes("/js/WebrootPublic.qvt.js") && html.output.includes('"basePath":"/apps/People/Time/ClockingKiosk"')
        !html.output.includes("header-menu")
        // the island: the form with the employer, no note for a person
        island.status == 200 &&
            island.errors == "" &&
            island.output.includes("IdentifyAndClock") &&
            island.output.includes("m-scan-input")
        !/Error rendering|Exception in render/.test(html.output + island.output)
        island.output.includes("Ziziwork Retail") && !island.output.includes("Not a clocking device")
        // the scan names no one: the number answered as the badge read
        resolved.status == 200 && JSON.parse(resolved.output).matches[0].label == "Badge read"
        !resolved.output.includes("Tomas")
        // a refusal is a message, never an error kept for the next worker
        wrongPin.errors == "" && wrongPin.messages.includes("The PIN is not right")
        clockIn.errors == "" && clockIn.messages.includes("clocked in at")
        const retried = JSON.parse(retry.output)
        retry.status == 200 && retried.screenUrl == "/apps/People/Time/ClockingKiosk"
        JSON.stringify(retried.messageInfos).includes("clocked in at") && !retry.output.includes(pin)
        clockOut.errors == "" && clockOut.messages.includes("clocked out at")
        added == 2 && lastPunch.directionEnumId == "AtdOut" && lastPunch.deviceId == state.deviceId
        lastPunch.recordedByUserId == state.displayUserId
        Object.entries(refused)
            .filter(([, out]) => !outside(out))
            .map(([name]) => name)
            .join(", ") == ""
    }
})

feature(
    "as an HR officer, not a device: the page says it records nothing here, a punch through it is refused, and the tablet's refusals notice links nowhere for them; a stopped badge's notice opens its worker's SelfService",
    {
        when() {
            // the burst notice on the tablet as Commons' notification lists show it (its record the device): Admin's Devices for the
            // access administrator, no link for HR, who has no Admin
            const notice = {
                notificationMessageId: "SpecKiosk",
                topic: "PeopleKioskRefusals",
                recordEntityName: DEVICE,
                recordId: state.deviceId
            }
            const openUrl = () =>
                ec.artifactExecution.runAsUser(
                    "component://mr-boss/screen/Commons.xml",
                    () =>
                        invoke("ironstone.commons.CommonsServices.decorate#Notifications", {notificationList: [notice]}).rows[0]
                            .openUrl
                ) || null
            return asUser(users.hr, () => ({
                tui: request(kiosk, {}, null, "tui"),
                punched: request(kiosk + "/punch", {badgeText: state.number, password: pin}, null, null, "post"),
                punches: kioskPunches(),
                hrLink: openUrl(),
                adminLink: asUser("admin.access", openUrl),
                // a stopped badge's notice to its worker (follow-up 4) opens their SelfService under Commons
                workerLink: asUser(users.employee, () => {
                    const sent = system(() =>
                        ec
                            .makeNotificationMessage()
                            .topic("PeopleMyKioskBadgeDisabled")
                            .message({organizationName: "Ziziwork Retail", wrongCount: 20})
                            .userIds([ec.user.userId])
                            .directOnly()
                            .send()
                    )
                    const link = sent.getLink()
                    const notice = {
                        notificationMessageId: "SpecKioskStopped",
                        topic: "PeopleMyKioskBadgeDisabled",
                        linkText: link
                    }
                    const shown = ec.artifactExecution.runAsUser("component://mr-boss/screen/Commons.xml", () =>
                        invoke("ironstone.commons.CommonsServices.decorate#Notifications", {notificationList: [notice]})
                    ).rows[0]
                    return {link, openUrl: shown.openUrl, screen: shown.openIsScreen}
                })
            }))
        },
        then({tui, punched, punches, hrLink, adminLink, workerLink}) {
            hrLink == null && adminLink == "/qapps/Admin/Security/Devices?deviceId=" + encodeURIComponent(state.deviceId)
            workerLink.link == "/qapps/Commons/People/SelfService" && workerLink.openUrl == workerLink.link
            workerLink.screen === true
            tui.status == 200 && tui.errors == "" && tui.output.includes("Not a clocking device") && tui.output.includes("PIN")
            !/Error rendering|Exception in render/.test(tui.output)
            punched.errors == "" && punched.messages.includes("recorded only at a registered clocking device")
            punches == 2
        }
    }
)
