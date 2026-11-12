// Wall displays on shared devices (impl-insights P11; design-insights §4 Playlists, CX-DEVICE): an author shares a playlist and
// its dashboards with the wall displays, a display account holding the reader and wall display bundles is registered for it,
// and its browser, once its code is redeemed, opens WallDisplay (the bare page, its qvt island, the data transition) as that
// account: the registered playlist whatever the browser asks for, a dashboard the account may not read left out and refused,
// and every other Insights screen and transition refused by the route group, the framework's own wall display under Tools
// too. Sharing is the framework Playlists' sharePlaylist through Insights' route, under Insights' policy: an author shares
// their playlist with the wall displays (the policy's group, whose share artifact is the author's); a group that is neither
// theirs nor the policy's, a reader, and a distributor who saves a definition with the wall displays' group by the engine
// itself are refused. A new playlist through the same route is the author's: a distributor, who holds the engine's save but
// has no editor under Insights, is refused. Playlists lists the devices showing a playlist and offers Register as display to an access administrator. The credential itself is the framework's (DeviceCredential,
// SecurityDevice, which also has the plain refusal page over HTTP), registering Admin's (AdminDevices).
// Run: ./moq test mr-boss --spec Insights/InsightsWallDisplay
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke, refusal, transition} = lib
const webroot = "component://webroot/screen/webroot.xml"
const sharePlaylist = (user, definitionId, userGroupId) =>
    transition(user, webroot, "apps/Insights/Playlists/sharePlaylist", {shareDefinitionId: definitionId, userGroupId})
const createPlaylist = (user, playlistId) =>
    transition(user, webroot, "apps/Insights/Playlists/createPlaylist", {
        playlistId,
        playlistDashboardIds: "insights-suite",
        playlistSeconds: "20"
    })
const createdIds = ["SPEC_WALL_BY_AUTHOR", "SPEC_WALL_BY_DISTRIBUTOR"]
function removeCreated() {
    system(() => {
        for (const entityName of [
            "moqui.report.DefinitionReference",
            "moqui.report.DefinitionVersion",
            "moqui.report.Definition"
        ])
            ec.entity.find(entityName).condition("definitionId", "in", createdIds).deleteAll()
    })
}
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
        removeCreated()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        removeCreated()
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
            // the instance administrator shares with any group (the framework's share grant of ADMIN)
            const display = "BOSS_INSIGHTS_DISPLAY"
            const board = (id, title, userGroupId) => ({id, type: "dashboard", title, userGroupId, body: {panels: {note: {title, visualization: "text", text: title}}, layout: {type: "autoGrid"}}})
            // the shown board also has a panel whose query fails: a wall shows it as not available, not the failure's text
            const shown = board("SPEC_WALL_SHOWN", "Spec floor board", display)
            shown.body.panels.broken = {title: "Broken", visualization: "table", queries: [{refId: "A", datasetId: "otel_spans"}]}
            save(shown)
            save(board("SPEC_WALL_PRIVATE", "Spec private board"))
            save(board("SPEC_WALL_ALSO", "Spec other board", display))
            const playlist = (id, dashboards) => ({id, type: "report", title: id, userGroupId: display, body: {kind: "playlist", seconds: 20, playlist: dashboards.map(definitionId => ({definitionId}))}})
            save(playlist(playlistId, ["SPEC_WALL_SHOWN", "SPEC_WALL_PRIVATE"]))
            save(playlist("SPEC_WALL_OTHER", ["SPEC_WALL_ALSO"]))
        })
        // an author shares their own with the wall displays, and with another group they are not in is still refused
        asUser(users.author, () => {
            if (refusal(reports + "get#Definition", {definitionId: "SPEC_WALL_AUTHORS"})) {
                invoke(reports + "save#Definition", {definition: {id: "SPEC_WALL_AUTHOR_BOARD", type: "dashboard", title: "Spec author's board",
                    body: {panels: {note: {title: "Note", visualization: "text", text: "Note"}}, layout: {type: "autoGrid"}}}, note: "Wall display spec"})
                invoke(reports + "save#Definition", {definition: {id: "SPEC_WALL_AUTHORS", type: "report", title: "Spec authors' playlist",
                    body: {kind: "playlist", seconds: 30, playlist: [{definitionId: "SPEC_WALL_AUTHOR_BOARD"}]}}, note: "Wall display spec"})
            }
        })
        const groupOf = definitionId => system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", definitionId).one())?.userGroupId || null
        // through Insights' route: the wall displays (the policy's group, the author's to name), then a group that is neither
        out.byAuthor = sharePlaylist(users.author, "SPEC_WALL_AUTHORS", "BOSS_INSIGHTS_DISPLAY").errors
        out.authorsGroup = groupOf("SPEC_WALL_AUTHORS")
        out.otherGroup = sharePlaylist(users.author, "SPEC_WALL_AUTHORS", "BOSS_ADMIN").errors
        // a reader, who does not author, shares nothing
        out.byReader = sharePlaylist(users.reader, "SPEC_WALL_AUTHORS", "BOSS_INSIGHTS_DISPLAY").errors
        // a distributor holds the engine's save, not the wall displays' share artifact: the save itself refuses the group
        out.byDistributor = asUser(users.distributor, () =>
            refusal(reports + "save#Definition", {definition: {id: "SPEC_WALL_DISTRIBUTORS", type: "report", title: "Spec distributor's playlist",
                userGroupId: "BOSS_INSIGHTS_DISPLAY", body: {kind: "playlist", seconds: 30, playlist: [{definitionId: "SPEC_WALL_SHOWN"}]}}, note: "Wall display spec"}))
        out.afterRefusals = groupOf("SPEC_WALL_AUTHORS")
        // a new playlist through Insights' route: the author's taken; the distributor holds the engine's save (for alert
        // rules) but has no editor under Insights, so the same request is refused and nothing is stored
        out.createdByAuthor = createPlaylist(users.author, "SPEC_WALL_BY_AUTHOR").errors
        out.createdByDistributor = createPlaylist(users.distributor, "SPEC_WALL_BY_DISTRIBUTOR").errors
        const stored = definitionId =>
            system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", definitionId).one())
        out.authorsCreated = stored("SPEC_WALL_BY_AUTHOR")
        out.distributorsCreated = stored("SPEC_WALL_BY_DISTRIBUTOR")
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
    then({
        byAuthor,
        authorsGroup,
        byReader,
        otherGroup,
        byDistributor,
        afterRefusals,
        shared,
        createdByAuthor,
        createdByDistributor,
        authorsCreated,
        distributorsCreated
    }) {
        byAuthor == "" && authorsGroup == "BOSS_INSIGHTS_DISPLAY"
        otherGroup.includes("Share only with a group you belong to") && byReader.includes("Sharing is not offered to you here")
        byDistributor.includes("SHARE_GROUP_UNAVAILABLE")
        afterRefusals == "BOSS_INSIGHTS_DISPLAY"
        createdByAuthor == "" && authorsCreated?.ownerId == "BOSS_INS_AUTHOR"
        createdByDistributor.includes("Making a playlist is not offered to you here") && distributorsCreated == null
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
            // and another playlist and a range of decades: the registration's playlist over the page's own 30 days
            first: request("apps/Insights/WallDisplay/data", {definitionId: "SPEC_WALL_OTHER", index: "0", from: "now-30y", thru: "now"}, cookie),
            hidden: request("apps/Insights/WallDisplay/data", {index: "1"}, cookie),
            playlists: request("apps/Insights/Playlists", {}, cookie),
            playlistData: request("apps/Insights/Playlists/data", {index: "0"}, cookie),
            dashboard: request("apps/Insights/Dashboard", {definitionId: "SPEC_WALL_SHOWN"}, cookie),
            shell: request("qapps/Insights/WallDisplay", {}, cookie),
            // the framework's own wall display, under Tools: not the device's route
            tools: request("apps/dashboards/WallDisplay", {}, cookie),
            toolsData: request("apps/dashboards/WallDisplay/data", {index: "0"}, cookie)
        }
    },
    then({html, island, first, hidden, playlists, playlistData, dashboard, shell, tools, toolsData}) {
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
        const data = JSON.parse(first.output).dashboard
        first.status == 200 && data.definitionId == "SPEC_WALL_SHOWN"
        Date.now() - Date.parse(data.range.from) < 32 * 86400000
        data.panels.broken.notices.length == 1 && data.panels.broken.notices[0].message == "This panel is not available to this display."
        hidden.errors != "" && !outside(hidden) && !hidden.output.includes("Spec private board")
        // nothing else of Insights, nor the shell
        outside(playlists) && outside(playlistData) && outside(dashboard) && outside(shell)
        outside(tools) && outside(toolsData)
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
