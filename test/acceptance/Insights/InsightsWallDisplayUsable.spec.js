// Insights P11's "usable when" (impl-insights P11; design-insights §4 Playlists, crosscut CX-DEVICE), as an acceptance walk with
// artifact authorization on, through the screens and their transitions: an author makes Ziziwork Retail's operations playlist
// (a dashboard of store checkouts by organization) and shares both with the wall displays (Playlists' Share with wall displays,
// Dashboard's share); the identity operator makes a display account for Retail with the reader and wall display bundles;
// admin.access registers a plant wall screen for the playlist (Security › Devices, RegisterDevice, from Playlists' Register as
// display) and reads its code once; the code makes one browser the device at /Device, which then plays the playlist with no one
// signed in (WallDisplay's page, its island and its data), showing Retail's numbers only, and opens nothing else of Insights or
// the shell; the author's Playlists shows it on the wall displays; with Retail's membership of the display account ended the
// display shows no one's numbers; and revoking the device in Admin refuses its next request. The rules are InsightsWallDisplay's, the
// credential's the framework's (DeviceCredential, SecurityDevice), registering Admin's (AdminDevices).
// Run: ./moq accept mr-boss --spec InsightsWallDisplayUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const admin = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const reports = "org.moqui.report.ReportServices."
const DEVICE = "moqui.security.DeviceCredential"
const run = String(Date.now()).slice(-7)
const boardId = "USABLE_WALL_BOARD_" + run
const playlistId = "USABLE_WALL_OPS_" + run
const displayName = "Usable plant wall display " + run
const deviceName = "Usable plant wall " + run
const codePattern = /[a-z2-9]{4}(-[a-z2-9]{4}){4}/
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
// a request of a browser at the webroot: with the device cookie it is the device's, whoever is signed in on this thread
function request(path, parameters, cookie, mode, method) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (mode) test = test.renderMode(mode)
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
// a page as the /qapps shell asks for it, as a signed-in user
function shellPage(path, parameters) {
    const out = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").renderMode("qvt").withStaticData()
        .render(path, Object.assign({lastStandalone: "1"}, parameters || {}), null)
    ec.message.clearErrors()
    return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || []).join("\n")}
}
const outside = out => out.errors.includes("This device opens only INSIGHTS_PLAYLISTS")
// the organizations of the frame's terms buckets (the panel's organizationPartyId values)
const organizationsOf = data => {
    const frames = Object.values(JSON.parse(data.output || "{}").frames || {}).flat()
    return frames.flatMap(frame => (frame.fields || []).filter(field => field.name === "organizationPartyId").flatMap(field => field.values || []))
}
let display
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

feature("an author makes Retail's operations playlist and shares it and its dashboard with the wall displays", {
    when() {
        return asUser(users.author, () => {
            invoke(reports + "save#Definition", {definition: {id: boardId, type: "dashboard", title: "Retail operations " + run, body: {
                panels: {checkouts: {title: "Checkouts by organization", visualization: "table", queries: [{datasetId: "boss-commerce-checkouts",
                    aggregations: [{id: "org", type: "terms", role: "group", params: {field: "organizationPartyId", size: 20}},
                        {id: "count", type: "count", role: "metric"}]}]}},
                layout: {type: "autoGrid"}}}, note: "Wall display walk"})
            invoke(reports + "save#Definition", {definition: {id: playlistId, type: "report", title: "Retail operations wall " + run,
                body: {kind: "playlist", seconds: 30, playlist: [{definitionId: boardId}]}}, note: "Wall display walk"})
            // Dashboard's Share, with the wall displays
            request("apps/Insights/Dashboard/share", {definitionId: boardId, userGroupId: "BOSS_INSIGHTS_DISPLAY"}, null, null, "post")
            // Playlists' Share with wall displays
            const shared = request("apps/Insights/Playlists/sharePlaylist", {shareDefinitionId: playlistId, userGroupId: "BOSS_INSIGHTS_DISPLAY"}, null, null, "post")
            return {
                shared,
                row: system(() => find("moqui.report.Definition", {definitionId: playlistId}).one()),
                board: system(() => find("moqui.report.Definition", {definitionId: boardId}).one())
            }
        })
    },
    then({shared, row, board}) {
        shared.errors == ""
        row.userGroupId == "BOSS_INSIGHTS_DISPLAY"
        board.userGroupId == "BOSS_INSIGHTS_DISPLAY"
    }
})

feature("a display account for Retail is made, and admin.access registers the plant wall from Playlists and reads its code once", {
    when() {
        const out = {}
        asUser(admin.users.identity, () =>
            ec.screen.makeTest().rootScreen("component://mr-boss/screen/Admin.xml").render("Users/Users/createDisplayAccount",
                {displayName, displayOrganizationPartyId: ids.organizationId, displayBundleIdList: "BOSS_INSIGHTS_READ,BOSS_INSIGHTS_DISPLAY"}, "post"))
        display = system(() => find("moqui.security.UserAccount", {userFullName: displayName}).one())
        // Register as display opens RegisterDevice with the route group and the playlist
        const registration = {deviceName, newRouteGroupId: "INSIGHTS_PLAYLISTS", newParameterValue: playlistId, displayUserId: display?.userId}
        asUser(admin.users.access, () =>
            ec.screen.makeTest().rootScreen("component://mr-boss/screen/Admin.xml").render("Security/Devices/registerDevice", registration, "post"))
        const device = system(() => find(DEVICE, {deviceName}).one())
        out.shown = asUser(admin.users.access, () =>
            ec.screen.makeTest().rootScreen("component://mr-boss/screen/Admin.xml").renderMode("html").render("Security/Devices", {revealDeviceId: device?.deviceId}, null))
        const code = (String(out.shown.output || "").match(codePattern) || [""])[0]
        out.redeemed = request("Device/redeem", {code}, null, null, "post")
        cookie = out.redeemed.setCookie.split(";")[0].replace("moqui.device=", "")
        login("john.doe")
        out.device = device
        return out
    },
    then({device}) {
        display != null && display.displayAccount == "Y"
        device != null && device.parameterValue == playlistId && device.routeGroupId == "INSIGHTS_PLAYLISTS"
        cookie.startsWith(device.deviceId + ".")
    }
})

feature("the plant wall plays the playlist with no one signed in, Retail's numbers only, and opens nothing else", {
    when() {
        return {
            page: request("apps/Insights/WallDisplay", {}, cookie),
            island: request("apps/Insights/WallDisplay", {}, cookie, "qvt"),
            data: request("apps/Insights/WallDisplay/data", {index: "0"}, cookie),
            home: request("apps/Insights/Home", {}, cookie),
            playlists: request("apps/Insights/Playlists", {}, cookie),
            explore: request("apps/Insights/ReportBuilder/Explore", {}, cookie),
            shell: request("qapps/Insights/WallDisplay", {}, cookie),
            apps: request("apps/AppList", {}, cookie),
            write: request("apps/Insights/Playlists/sharePlaylist", {shareDefinitionId: playlistId}, cookie, null, "post"),
            // the author's Playlists: the playlist is on the wall displays. Its devices are listed to a reader of the playlist
            // who sees devices (ADMIN_ACCESS_VIEW), here nobody but the display account: a definition has one group (P12), and
            // the regression InsightsWallDisplay lists them for an owner who registers devices
            listed: asUser(users.author, () => shellPage("apps/Insights/Playlists"))
        }
    },
    then({page, island, data, home, playlists, explore, shell, apps, write, listed}) {
        page.status == 200 && page.output.includes('data-moqui-island="wall-display"')
        island.output.includes(':kiosk="true"') && island.output.includes(boardId)
        data.status == 200 && JSON.parse(data.output).dashboard.definitionId == boardId
        organizationsOf(data).every(partyId => partyId == ids.organizationId)
        !organizationsOf(data).includes(ids.otherOrganizationId)
        outside(home) && outside(playlists) && outside(explore) && outside(shell) && outside(apps) && outside(write)
        listed.output.includes("Retail operations wall " + run) && listed.output.includes("Stop sharing with wall displays")
    }
})

feature("with Retail's membership of the display account ended the wall shows no one's numbers, and revoking it ends the display", {
    when() {
        system(() =>
            find("mantle.party.PartyRelationship", {fromPartyId: display.partyId, toPartyId: ids.organizationId, relationshipTypeEnumId: "PrtMember"})
                .updateAll({thruDate: new Date(Date.now() - 1000).toISOString()}))
        const out = {unscoped: request("apps/Insights/WallDisplay/data", {index: "0"}, cookie)}
        const device = system(() => find(DEVICE, {deviceName}).one())
        // the display account is no longer Retail's, so it is out of admin.access's organization scope (Mantle SharedDevices:
        // DEVICE_UNAVAILABLE, as one that does not exist): the instance's administrator revokes it in Admin
        asUser(admin.users.system, () =>
            ec.screen.makeTest().rootScreen("component://mr-boss/screen/Admin.xml").render("Security/Devices/revokeDevice", {deviceId: device.deviceId}, "post"))
        out.next = request("apps/Insights/WallDisplay/data", {index: "0"}, cookie)
        return out
    },
    then({unscoped, next}) {
        unscoped.status == 200 && organizationsOf(unscoped).length == 0
        next.errors.includes("registration was revoked")
    }
})
