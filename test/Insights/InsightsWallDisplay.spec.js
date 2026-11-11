// Wall displays on shared devices (impl-insights P11; design-insights §4 Playlists, CX-DEVICE): an author shares a playlist and
// its dashboards with the wall displays, a display account holding the reader and wall display bundles is registered for it,
// and its browser, once its code is redeemed, opens WallDisplay (the bare page, its qvt island, the data transition) as that
// account: the registered playlist whatever the browser asks for, a dashboard the account may not read left out and refused,
// and every other Insights screen and transition refused by the route group. Playlists lists the devices showing a playlist and
// offers Register as display to an access administrator. The credential itself is the framework's (DeviceCredential,
// SecurityDevice, which also has the plain refusal page over HTTP), registering Admin's (AdminDevices).
// Run: ./moq test mr-boss --spec Insights/InsightsWallDisplay
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const reports = "org.moqui.report.ReportServices."
const DEVICE = "moqui.security.DeviceCredential"
const playlistId = "SPEC_WALL_PLAYLIST"
// a request of a browser at the webroot: with the device cookie it is the device's, whoever is signed in on this thread
function request(path, parameters, cookie, mode) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (mode) test = test.renderMode(mode)
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters || {}, "get")
    ec.message.clearErrors()
    return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || []).join("\n")}
}
const outside = out => out.errors.includes("This device opens only INSIGHTS_PLAYLISTS")
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
        system(() => ec.entity.find(DEVICE).condition("deviceName", "like", "Spec wall%").deleteAll())
    }
})

feature("an author shares a playlist with the wall displays, and a display account is registered and redeemed for it", {
    when() {
        const out = {}
        // an owner's dashboards and playlists, made once (the instance administrator's, an author who also registers devices):
        // two shared with the wall displays, one kept private
        asUser(users.system, () => {
            const save = definition => {
                if (!refusal(reports + "get#Definition", {definitionId: definition.id})) return
                invoke(reports + "save#Definition", {definition, note: "Wall display spec"})
            }
            const board = (id, title) => ({id, type: "dashboard", title, body: {panels: {note: {title, visualization: "text", text: title}}, layout: {type: "autoGrid"}}})
            save(board("SPEC_WALL_SHOWN", "Spec floor board"))
            save(board("SPEC_WALL_PRIVATE", "Spec private board"))
            save(board("SPEC_WALL_ALSO", "Spec other board"))
            const playlist = (id, dashboards) => ({id, type: "report", title: id, body: {kind: "playlist", seconds: 20, playlist: dashboards.map(definitionId => ({definitionId}))}})
            save(playlist(playlistId, ["SPEC_WALL_SHOWN", "SPEC_WALL_PRIVATE"]))
            save(playlist("SPEC_WALL_OTHER", ["SPEC_WALL_ALSO"]))
            for (const definitionId of ["SPEC_WALL_SHOWN", "SPEC_WALL_ALSO", playlistId, "SPEC_WALL_OTHER"])
                invoke("ironstone.insights.DashboardServices.share#Dashboard", {definitionId, userGroupId: "BOSS_INSIGHTS_DISPLAY"})
        })
        // an author shares their own with the wall displays, and with another group they are not in is still refused
        asUser(users.author, () => {
            if (refusal(reports + "get#Definition", {definitionId: "SPEC_WALL_AUTHORS"})) {
                invoke(reports + "save#Definition", {definition: {id: "SPEC_WALL_AUTHOR_BOARD", type: "dashboard", title: "Spec author's board",
                    body: {panels: {note: {title: "Note", visualization: "text", text: "Note"}}, layout: {type: "autoGrid"}}}, note: "Wall display spec"})
                invoke(reports + "save#Definition", {definition: {id: "SPEC_WALL_AUTHORS", type: "report", title: "Spec authors' playlist",
                    body: {kind: "playlist", seconds: 30, playlist: [{definitionId: "SPEC_WALL_AUTHOR_BOARD"}]}}, note: "Wall display spec"})
            }
            out.byAuthor = refusal("ironstone.insights.DashboardServices.share#Dashboard", {definitionId: "SPEC_WALL_AUTHORS", userGroupId: "BOSS_INSIGHTS_DISPLAY"})
            out.otherGroup = refusal("ironstone.insights.DashboardServices.share#Dashboard", {definitionId: "SPEC_WALL_AUTHORS", userGroupId: "BOSS_ADMIN"})
        })
        // a reader, who does not author, shares nothing
        out.byReader = asUser(users.reader, () =>
            refusal("ironstone.insights.DashboardServices.share#Dashboard", {definitionId: "SPEC_WALL_AUTHORS", userGroupId: "BOSS_INSIGHTS_DISPLAY"}))
        out.shared = system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", playlistId).one())
        // the display account (Retail's, the reader and wall display bundles) and its device, registered by an administrator
        display = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "display.spec.wall.display").one())
        if (!display) {
            invoke("mantle.party.IdentityServices.create#DisplayAccount", {displayName: "Spec wall display", organizationPartyId: ids.organizationId,
                bundleGroupIdList: ["BOSS_INSIGHTS_READ", "BOSS_INSIGHTS_DISPLAY"]})
            display = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "display.spec.wall.display").one())
        }
        const registered = invoke("mantle.party.IdentityServices.register#SharedDevice", {deviceName: "Spec wall plant", routeGroupId: "INSIGHTS_PLAYLISTS",
            displayUserId: display?.userId, parameterValue: playlistId, issueCode: false})
        const code = invoke("mantle.party.IdentityServices.reveal#SharedDeviceCode", {deviceId: registered.deviceId}).registrationCode
        const redeemed = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("Device/redeem", {code}, "post")
        cookie = String(redeemed.header("Set-Cookie") || "").split(";")[0].replace("moqui.device=", "")
        login("john.doe")
        return out
    },
    then({byAuthor, byReader, otherGroup, shared}) {
        byAuthor == "" && otherGroup.includes("SHARE_GROUP_UNAVAILABLE") && byReader.includes("INSIGHTS_AUTHOR_REQUIRED")
        shared.userGroupId == "BOSS_INSIGHTS_DISPLAY"
        display != null && display.displayAccount == "Y"
        cookie.includes(".")
    }
})

feature("the device plays its registered playlist on the bare page as its display account, and opens nothing else", {
    when() {
        return {
            html: request("apps/Insights/WallDisplay", {}, cookie),
            // the browser asks for another playlist: the registration's is played
            island: request("apps/Insights/WallDisplay", {definitionId: "SPEC_WALL_OTHER"}, cookie, "qvt"),
            first: request("apps/Insights/WallDisplay/data", {definitionId: "SPEC_WALL_OTHER", index: "0"}, cookie),
            hidden: request("apps/Insights/WallDisplay/data", {index: "1"}, cookie),
            playlists: request("apps/Insights/Playlists", {}, cookie),
            playlistData: request("apps/Insights/Playlists/data", {index: "0"}, cookie),
            dashboard: request("apps/Insights/Dashboard", {definitionId: "SPEC_WALL_SHOWN"}, cookie),
            shell: request("qapps/Insights/WallDisplay", {}, cookie)
        }
    },
    then({html, island, first, hidden, playlists, playlistData, dashboard, shell}) {
        // the bare page: the qvt client's files and this screen as an island, with no navigation or app menu
        html.status == 200 && html.errors == ""
        html.output.includes("<!DOCTYPE html>") && html.output.includes('data-moqui-island="wall-display"')
        html.output.includes("/js/WebrootReport.js") && html.output.includes("/js/WebrootPublic.qvt.js")
        html.output.includes('"basePath":"/apps/Insights/WallDisplay"') && !html.output.includes("header-menu")
        // the registered playlist in kiosk mode, the private dashboard left out
        island.status == 200 && island.errors == ""
        island.output.includes("m-report-playlist") && island.output.includes(':kiosk="true"') && island.output.includes(':seconds="20"')
        island.output.includes("definitionId=" + playlistId) && !island.output.includes("SPEC_WALL_OTHER")
        island.output.includes("SPEC_WALL_SHOWN") && !island.output.includes("SPEC_WALL_PRIVATE") && !island.output.includes("SPEC_WALL_ALSO")
        // the data of the registered playlist's dashboard by its index; the private one refused as the display account
        first.status == 200 && JSON.parse(first.output).dashboard.definitionId == "SPEC_WALL_SHOWN"
        hidden.errors != "" && !outside(hidden) && !hidden.output.includes("Spec private board")
        // nothing else of Insights, nor the shell
        outside(playlists) && outside(playlistData) && outside(dashboard) && outside(shell)
    }
})

feature("Playlists lists the devices showing a playlist and offers Register as display to an access administrator", {
    when() {
        // under the webroot, as the shell asks for it, so the link to Admin resolves
        return asUser(users.system, () => {
            const out = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").renderMode("qvt").withStaticData()
                .render("apps/Insights/Playlists", {lastStandalone: "1"}, null)
            return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || [])}
        })
    },
    then(rendered) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Spec wall plant (") && rendered.output.includes("Register as display")
        rendered.output.includes("newParameterValue=" + playlistId) && rendered.output.includes("Play full screen")
    }
})
