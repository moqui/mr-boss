// Projects' access spec: client access is its access model (impl-projects.md P10a, P10b; design-projects.md §1.1, §4
// ProjectCode, §7 Code, §15 Client access and Chatter for client users). With authorization on, a client contact who signs in
// (sheldon.acme of Acme on ACME; gob.bluth of Bluth Corp on BLUTH, both in BOSS_PROJECT_CLIENT, which holds Mantle's
// PROJECT_CLIENT and the framework's EXTERNAL_USER; data/BossUsersDemoData.xml) opens Projects alone; reads its own project's
// part and never another client's record, an internal note, a rate or a cost; writes only through ironstone.client.ClientServices
// (every other IronStone write is in the deny pattern BOSS_PROJECTS_INTERNAL, data/BossSetupData.xml); reaches no record chat
// room, records drive, internal presence or agent; and reads, read only, the repositories its project shares. Internal users
// keep what they had: Commons and Comms are AUTHZT_ALLOW for ALL_USERS (not ALWAYS), so the client group's deny reaches.
// Screens whose logic another spec owns (Home, ProjectDetail, WorkItemDetail, Billing, Code) are not rendered here: a refusal
// is checked by a service, a transition or the status of a refused render. The sentinels are made in setupSpec with
// authorization off and removed after: internal notes on ACME-1, ACME and Acme's request, a client rate and budget and item
// costs on ACME with amounts found nowhere else, record chat rooms of ACME-1 and BLUTH-1 with a secret, and a records drive file.
// Run: ./moq test mr-boss --spec ProjectsAccess
const webroot = "component://webroot/screen/webroot.xml"
const SHELDON = "sheldon.acme"
const GOB = "gob.bluth"
const SHELDON_ID = "ORG_ACME_SA"
const GOB_ID = "ORG_BLUTH_GOB"
const JOHN_ID = "EX_JOHN_DOE"
const CHAT = "org.moqui.impl.ChatServices"
const FILES = "org.moqui.impl.FileServices"
const CLIENT = "ironstone.client.ClientServices."
const CODE = "ironstone.projects.CodeServices."
const ROOM_SECRET = "ZQX-ROOM-SECRET"
const DRIVE_FILE = "work/ACME-1/zqx/drive-secret.txt"
const REPO = "acme-portal"
const BRANCH = "cc-theme"
const made = { notes: [] }

// what must never reach a client of Acme (and the reverse for Bluth)
const ACME_SECRETS = ["ZQX-INTERNAL-NOTE", "987.65", "987,65", "43,210", "43210", "7,777", "7777", "8,888", "8888", "24,000", "4,800", "19,200", "150.00", "135.00", "keep the sign-on estimate padded",
    "Bluth banana stand site", "Frozen banana menu page", "Price the stand", "Single sign-on with their directory", "Weekly status report to Acme",
    "Hiring plan 2027", "Expand and collapse rows", "Leave holidays out of the burndown", "Brightwater"]
const BLUTH_SECRETS = ["ZQX-INTERNAL-NOTE", "987.65", "43,210", "Acme customer portal", "Customer sign-in", "Export the portal's users",
    "Price the stand", "Hiring plan 2027", "Expand and collapse rows", "Brightwater"]
// what the client must never see of the code: the team's review, CI and internal items, and the other repositories
const CODE_SECRETS = ["ZQX-REVIEW-NOTE", "ZQX-LINE-COMMENT", "ZQX-CI-NOTE", "ci.internal.example", "Single sign-on with their directory",
    "IronStone Projects, the app", "Expand and collapse rows", "Bluth banana stand site", "ssh://"]
// an amount counts as a number of its own, not digits inside a longer one (a timestamp such as 1793777737346 holds 7777)
const leaksOf = (text, secrets) => secrets.filter((secret) => /^[\d.,]+$/.test(secret)
    ? new RegExp(`(^|[^\\d])${secret.replace(/[.,]/g, "\\$&")}([^\\d]|$)`).test(String(text || ""))
    : String(text || "").includes(secret))

// a screen under apps/Projects, rendered
function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render("apps/Projects/" + path,
        Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    const errors = str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors, output, refused: str.status == 401 || str.status == 403 || /not authorized/i.test(errors + output),
        broken: /Error rendering|Exception in render/.test(output) }
}
// a transition or JSON path under the apps root, or with ../ one under the webroot (shellData, menuData, rest)
function hit(path, parameters, method) {
    const full = path.startsWith("../") ? path.substring(3) : "apps/" + path
    const str = ec.screen.makeTest().rootScreen(webroot).render(full, parameters || {}, method || null)
    const output = String(str.output || "")
    const errors = str.errorMessages.join(" | ")
    ec.message.clearErrors()
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    return { status: str.status, errors, output, json, refused: str.status == 401 || str.status == 403 || /not authorized/i.test(errors) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
// as the user, with authorization on as for a request
function as(username, run) {
    login(username)
    const wasDisabled = ec.artifactExecution.authzDisabled()
    if (wasDisabled) ec.artifactExecution.enableAuthz()
    try { return run() } finally {
        if (wasDisabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
// as the user with authorization disabled, as the webroot chat transitions and other framework paths call for them
function asOff(username, run) {
    login(username)
    try { return sys(run) } finally { login("john.doe") }
}
// a service call as the current user: its result, with its errors (a refusal) in _errors
const service = (name, parameters) => {
    let out = {}
    let thrown = ""
    try { out = ec.service.sync().name(name).parameters(parameters || {}).call() || {} } catch (err) { thrown = String(err && err.message ? err.message : err) }
    const errors = (ec.message.getErrorsString ? ec.message.getErrorsString() : "") + thrown
    ec.message.clearErrors()
    return Object.assign({}, out, { _errors: errors || "" })
}
// a transition the client tried: refused, or answered with an error
const refusedHit = (found) => found.refused || found.errors != "" || found.json?.errors != null
const one = (entityName, fields) => sys(() => { const row = ec.entity.find(entityName).condition(fields).one(); return row ? row.getMap() : null })
const rows = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()).map((row) => row.getMap()))
const count = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).count())
const menuLevels = (found) => {
    const levels = {}
    for (const level of Array.isArray(found.json) ? found.json : [])
        levels[level.name] = (level.subscreens || []).filter((item) => item.menuInclude).map((item) => item.name)
    return levels
}
const level = (roomId) => Number(service(`${CHAT}.get#RoomAccess`, { chatRoomId: roomId }).level || 0)

spec({
    stepwise: false,
    setupSpec() {
        login("john.doe")
        sys(() => {
            // an internal note on an item, the project and a request of Acme's, each with the sentinel
            for (const [joinEntity, keyField, id] of [["mantle.work.effort.WorkEffortCommEvent", "workEffortId", "ACME-1"],
                    ["mantle.work.effort.WorkEffortCommEvent", "workEffortId", "ACME"], ["mantle.request.RequestCommEvent", "requestId", "BOSS_DEMO_PREQ_ACME1"]]) {
                const out = ec.service.sync().name("create#mantle.party.communication.CommunicationEvent").parameters({ communicationEventTypeId: "Comment",
                    contactMechTypeEnumId: "CmtWebForm", statusId: "CeSent", fromPartyId: JOHN_ID, entryDate: ec.user.nowTimestamp,
                    subject: "ZQX-INTERNAL-NOTE subject", contentType: "text/html", body: "<p>ZQX-INTERNAL-NOTE: the margin on this is thin</p>" }).call()
                made.notes.push(out.communicationEventId)
                ec.service.sync().name("create#" + joinEntity).parameters({ [keyField]: id, communicationEventId: out.communicationEventId }).call()
            }
            // a note's attachment, which must not download for the client
            const attachment = ec.service.sync().name("create#mantle.party.communication.CommunicationEventContent").parameters({
                communicationEventId: made.notes[0], contentLocation: "dbresource://test/ZQX-INTERNAL-NOTE.pdf", contentDate: ec.user.nowTimestamp }).call()
            made.attachmentId = attachment.communicationEventContentId
            // a client rate and a client budget on ACME, with amounts found nowhere else
            ec.service.sync().name("create#mantle.humanres.rate.RateAmount").parameters({ rateAmountId: "BOSS_TEST_CLI_RATE", rateTypeEnumId: "RatpStandard",
                ratePurposeEnumId: "RaprClient", timePeriodUomId: "TF_hr", workEffortId: "ACME", partyId: "ORG_ZIZI_JD", fromDate: "2020-01-01 00:00:00",
                rateAmount: "987.65", rateCurrencyUomId: "USD" }).call()
            const acme = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "ACME").one()
            made.acmeBudget = acme.totalClientCostAllowed
            acme.totalClientCostAllowed = 43210.98
            acme.update()
            // and the cost of an item's time
            const item = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "ACME-1").one()
            made.itemCosts = [item.actualCost, item.actualClientCost]
            item.actualCost = 7777.77
            item.actualClientCost = 8888.88
            item.update()
            // a status update on ACME not posted for the client
            const update = ec.service.sync().name("create#mantle.party.communication.CommunicationEvent").parameters({ communicationEventTypeId: "StatusUpdate",
                statusId: "CeSent", fromPartyId: JOHN_ID, entryDate: ec.user.nowTimestamp, subject: "ZQX-INTERNAL-NOTE update",
                contentType: "text/plain", body: "ZQX-INTERNAL-NOTE: the team's own update" }).call()
            made.notes.push(update.communicationEventId)
            ec.service.sync().name("create#mantle.work.effort.WorkEffortUpdate").parameters({ workEffortId: "ACME", communicationEventId: update.communicationEventId,
                updateDate: ec.user.nowTimestamp, healthEnumId: "WehAtRisk", clientVisible: "N" }).call()
            ec.service.sync().name("create#mantle.work.effort.WorkEffortCommEvent").parameters({ workEffortId: "ACME", communicationEventId: update.communicationEventId }).call()
            // a user in no group but ALL_USERS
            if (!ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_TEST_ALLUSERS").one())
                ec.service.sync().name("create#moqui.security.UserAccount").parameters({ userId: "BOSS_TEST_ALLUSERS", username: "boss.test.allusers",
                    userFullName: "Bob Acme", partyId: "ORG_ACME_BA", currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394", passwordHashType: "SHA" }).call()
            // the record rooms of a work item shared with Acme (ACME-1) and of one shared with Bluth (BLUTH-1), with a member row of
            // each client as one made before P10b (or by a path that did not ask), and a public room the clients are not in
            for (const [key, recordId, userId] of [["acmeRoom", "ACME-1", SHELDON_ID], ["bluthRoom", "BLUTH-1", GOB_ID]]) {
                made[key] = ec.service.sync().name(`${CHAT}.create#Room`).parameters({ roomTypeEnumId: "CrtRecord",
                    recordEntityName: "mantle.work.effort.WorkEffort", recordId }).call().chatRoomId
                if (!ec.entity.find("moqui.chat.ChatRoomMember").condition("chatRoomId", made[key]).condition("userId", userId).one()) {
                    const chatActorId = ec.service.sync().name(`${CHAT}.get#LocalActors`).parameter("userIdList", [userId]).call().actorMap[userId]
                    ec.service.sync().name("create#moqui.chat.ChatRoomMember").parameters({ chatRoomId: made[key], chatActorId, userId, roleEnumId: "CmrMember",
                        joinedDate: ec.user.nowTimestamp, lastReadEventSeq: 0, notificationLevelEnumId: "CnlAll", isPinned: "N", isMuted: "N" }).call()
                }
            }
            made.publicRoom = ec.service.sync().name(`${CHAT}.create#Room`).parameters({ roomTypeEnumId: "CrtPublic", roomName: "ZQX Lobby" }).call().chatRoomId
            // a file in the records drive's folder of ACME-1, which Acme's client sees as a work item
            ec.resource.getLocationReference(`dbresource://mantle/content/${DRIVE_FILE}`).putText("ZQX-DRIVE-SECRET")
            // the agent permission granted to the client group: the framework must withhold it
            if (!ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", "BOSS_PROJECT_CLIENT").condition("userPermissionId", "AgentUse").one()) {
                ec.service.sync().name("create#moqui.security.UserGroupPermission").parameters({ userGroupId: "BOSS_PROJECT_CLIENT",
                    userPermissionId: "AgentUse", fromDate: 0 }).call()
                made.agentGrant = true
            }
        })
        // john.doe's message in each room, mentioning the client
        for (const [roomId, clientId] of [[made.acmeRoom, SHELDON_ID], [made.bluthRoom, GOB_ID]]) {
            sys(() => ec.service.sync().name(`${CHAT}.send#Message`).parameters({ chatRoomId: roomId,
                body: `<p>${ROOM_SECRET}: the margin is thin, <span data-mention-id="${clientId}">@client</span></p>` }).call())
            ec.message.clearErrors()
        }
    },
    cleanupSpec() {
        setTypes("AUTHZT_ALLOW")
        sys(() => {
            for (const id of made.notes) {
                for (const entityName of ["mantle.work.effort.WorkEffortCommEvent", "mantle.request.RequestCommEvent", "mantle.work.effort.WorkEffortUpdate",
                        "mantle.party.communication.CommunicationEventContent"])
                    ec.entity.find(entityName).condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", id).deleteAll()
            }
            ec.entity.find("mantle.humanres.rate.RateAmount").condition("rateAmountId", "BOSS_TEST_CLI_RATE").deleteAll()
            const acme = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "ACME").one()
            acme.totalClientCostAllowed = made.acmeBudget ?? null
            acme.update()
            const item = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "ACME-1").one()
            item.actualCost = made.itemCosts?.[0] ?? null
            item.actualClientCost = made.itemCosts?.[1] ?? null
            item.update()
            ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_TEST_ALLUSERS").deleteAll()
            if (made.agentGrant) ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", "BOSS_PROJECT_CLIENT")
                .condition("userPermissionId", "AgentUse").deleteAll()
            for (const userId of [SHELDON_ID, GOB_ID]) ec.entity.find("moqui.chat.ChatRoomMember").condition("userId", userId)
                .condition("chatRoomId", "in", [made.acmeRoom, made.bluthRoom].filter((id) => id)).deleteAll()
            try { ec.resource.getLocationReference(`dbresource://mantle/content/${DRIVE_FILE}`).delete() } catch (err) { /* gone */ }
        })
    },
})

const setTypes = (type) => sys(() => {
    for (const id of ["BOSS_COMMONS_ALL_USERS", "BOSS_COMMS_ALL_USERS"]) {
        const row = ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", id).one()
        row.authzTypeEnumId = type
        row.update()
    }
})

feature("who opens what: a client opens Projects alone, refused the internal screens, Accounting's and the REST API; the team opens them", {
    when() {
        // the internal sections and mounts a client is denied by location (BOSS_PROJECTS_INTERNAL), as menu data: 403 or 200
        const MENUS = ["Commons", "Comms", "Projects/Time", "Projects/Reports", "Projects/Settings", "Projects/Billing/Rates", "Projects/Code/GitAccess"]
        const menus = () => MENUS.map((path) => `${path} ${hit("../menuData/apps/" + path).status}`)
        const client = as(SHELDON, () => {
            const shell = hit("../shellData")
            const projects = (shell.json?.apps || []).find((app) => app.name === "Projects")
            const levels = {}
            Object.assign(levels, menuLevels(hit("../menuData/apps/Projects/WorkItems")))
            return { apps: (shell.json?.apps || []).map((app) => app.name), menus: menus(), levels,
                quickKinds: (projects?.providers?.quickCreate || []).map((kind) => kind.kind),
                paletteActions: (projects?.providers?.paletteActions || []).map((action) => action.label),
                // a refused render's status: a section, a ProjectDetail tab mounted elsewhere, a Shared screen at its mount, Compare
                refused: [render("Time"), render("Projects/ProjectDetail/Money", { workEffortId: "ACME" }), render("Billing/OrderDetail", {}),
                    render("Code/Compare", { repositoryId: REPO }), render("WorkItems/Backlog", { rootWorkEffortId: "ACME" }, "qvue")].map((out) => out.refused),
                commonsHome: hit("Commons/Home").refused,
                // the entity and Mantle REST APIs
                rest: [hit("../rest/e1/mantle.work.effort.WorkEffort", { workEffortId: "BLUTH" }), hit("../rest/e1/mantle.work.effort.WorkEffort/ACME"),
                    hit("../rest/e1/mantle.request.Request"), hit("../rest/s1/mantle/parties", { partyId: "ORG_BLUTH" })],
                myInfo: hit("../rest/s1/mantle/my/userOrgInfo").output,
                permissions: { external: ec.user.hasPermission("EXTERNAL_USER"), projectClient: ec.user.hasPermission("PROJECT_CLIENT") },
                customerMount: hit("Accounting/Receivables/Customer360", { organizationPartyId: "BOSS_ACCT_ORG", customerPartyId: "ORG_ACME", lastStandalone: "true" }),
            }
        })
        const team = as("john.doe", () => ({ apps: (hit("../shellData").json?.apps || []).map((app) => app.name), menus: menus(),
            permissions: { external: ec.user.hasPermission("EXTERNAL_USER"), projectClient: ec.user.hasPermission("PROJECT_CLIENT") } }))
        // the shared Customer360's own guard (its service), which the mount does not reach when the screen is rendered at its root
        const accounting = ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js")
        const customer = { organizationPartyId: "BOSS_ACCT_ORG", customerPartyId: "ORG_ACME", appRoot: "Accounting" }
        const nativeClient = as(SHELDON, () => accounting.refusal("mantle.account.CustomerFinanceServices.get#CustomerFinance", customer))
        const nativeAr = accounting.asUser("finance.ar", () => accounting.refusal("mantle.account.CustomerFinanceServices.get#CustomerFinance", customer), true)
        return { client, team, nativeClient, nativeAr }
    },
    then({ client, team, nativeClient, nativeAr }) {
        client.apps == ["Projects"]
        team.apps.includes("Projects")
        team.apps.includes("Commons")
        team.apps.includes("Comms")
        client.menus == ["Commons 403", "Comms 403", "Projects/Time 403", "Projects/Reports 403", "Projects/Settings 403", "Projects/Billing/Rates 403", "Projects/Code/GitAccess 403"]
        team.menus == ["Commons 200", "Comms 200", "Projects/Time 200", "Projects/Reports 200", "Projects/Settings 200", "Projects/Billing/Rates 200", "Projects/Code/GitAccess 200"]
        // the client's menu: Home, Projects, Work items, Requests, and P10b's Code (shared repositories) and Billing (its own invoices)
        client.levels.Projects.slice().sort() == ["Billing", "Code", "Home", "Projects", "Requests", "WorkItems"]
        client.levels.WorkItems == ["Timeline"]
        // no quick-create kind or palette action of an internal screen
        client.quickKinds == []
        client.paletteActions == []
        client.refused == [true, true, true, true, true]
        client.commonsHome
        client.rest.map((out) => out.status != 200) == [true, true, true, true]
        leaksOf(client.rest.map((out) => out.output).join("\n") + client.myInfo, ACME_SECRETS.concat(["Bluth Corp"])) == []
        client.permissions == { external: true, projectClient: true }
        team.permissions == { external: false, projectClient: false }
        // Accounting's customer screen: refused at its mount, its service refused natively; the same request answers the AR user
        client.customerMount.refused || /Accounting access is required/i.test(client.customerMount.output)
        !client.customerMount.output.includes("billing.acme@test.com")
        nativeClient.includes("PERMISSION_DENIED")
        nativeAr == ""
    },
})

feature("internal users are unchanged by client access: Commons and Comms as under ALWAYS, the team's menus, denies, items, rooms and drive", {
    when() {
        const types = sys(() => ["BOSS_COMMONS_ALL_USERS", "BOSS_COMMS_ALL_USERS", "BOSS_COMMONS_CLIENT", "BOSS_COMMS_CLIENT"].map((id) =>
            ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", id).one()?.authzTypeEnumId))
        // a project manager, a team member and a user in no group but ALL_USERS: the menu data of the apps' main screens (each
        // level lists the subscreens the user may open) are the same with the records as ALWAYS (put back for the comparison) and as ALLOW
        const USERS = ["john.doe", "joe.developer", "boss.test.allusers"]
        const MAIN = ["Commons", "Comms", "Commons/Home", "Commons/Tasks", "Commons/Contacts", "Commons/Calendar", "Commons/Knowledge", "Commons/Notes",
            "Commons/Files", "Commons/Settings", "Comms/Home", "Comms/Inbox", "Comms/Chat", "Comms/Settings"]
        const fingerprint = () => MAIN.map((path) => {
            const found = hit("../menuData/apps/" + path)
            return `${path} ${found.status} ${JSON.stringify((Array.isArray(found.json) ? found.json : []).map((one) => one.name + ":" + (one.subscreens || []).map((item) => item.name).join(",")))}`
        })
        setTypes("AUTHZT_ALWAYS")
        const always = USERS.map((user) => as(user, fingerprint))
        setTypes("AUTHZT_ALLOW")
        const allow = USERS.map((user) => as(user, fingerprint))
        const problems = []
        USERS.forEach((user, index) => allow[index].forEach((line, at) => {
            if (line !== always[index][at]) problems.push(`${user}: ALWAYS ${always[index][at]} / ALLOW ${line}`)
            if (!/^\S+ 200 /.test(line)) problems.push(`${user} refused: ${line}`)
        }))
        // the Projects menus, and the team's denies
        const john = as("john.doe", () => menuLevels(hit("../menuData/apps/Projects/WorkItems")))
        const joe = as("joe.developer", () => ({ menu: menuLevels(hit("../menuData/apps/Projects/WorkItems")), settings: hit("../menuData/apps/Projects/Settings").status,
            // no client filter reaches the team: Joe sees the Work group item (ACME-3) the client does not, and IronStone's own project
            vis: sys(() => service("mantle.work.ProjectServices.get#VisibleProjectInfo")),
            workGroupItem: hit("Projects/Chatter/chatterData", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-3" }).json?.visible }))
        // the record rooms and the records drive: John reads the room of his item and lists it, Joe reads it without joining
        const johnChat = asOff("john.doe", () => {
            const timeline = service(`${CHAT}.get#Timeline`, { chatRoomId: made.acmeRoom })
            return { level: level(made.acmeRoom), errors: timeline._errors, read: JSON.stringify(timeline.eventList || []).includes(ROOM_SECRET),
                listed: Array.from(service(`${CHAT}.find#Rooms`, {}).roomList || []).map((room) => room.chatRoomId).includes(made.acmeRoom),
                chatter: Array.from(service("mantle.party.CommunicationServices.get#RecordTimeline", { recordEntityName: "mantle.work.effort.WorkEffort",
                    recordId: "ACME-1", kinds: "chat" }).entryList || []).filter((entry) => entry.kind === "chat").length,
                recordVisible: service(`${CHAT}.check#RecordVisible`, { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }).recordVisible }
        })
        const joeChat = asOff("joe.developer", () => ({ record: level(made.acmeRoom), lobby: level(made.publicRoom) }))
        const johnDrive = as("john.doe", () => {
            const info = service(`${FILES}.get#ResourceInfo`, { driveId: "BOSS_RECORDS", path: DRIVE_FILE })
            return { drives: Array.from(service(`${FILES}.get#UserDrives`, {}).driveList || []).map((drive) => drive.driveId), errors: info._errors,
                name: info.resource ? info.resource.name : null, agentUse: ec.user.hasPermission("AgentUse") }
        })
        return { types, problems, john, joe, johnChat, joeChat, johnDrive }
    },
    then({ types, problems, john, joe, johnChat, joeChat, johnDrive }) {
        types == ["AUTHZT_ALLOW", "AUTHZT_ALLOW", "AUTHZT_DENY", "AUTHZT_DENY"]
        problems.join("\n") == ""
        john.Projects == ["Home", "Projects", "WorkItems", "Requests", "Code", "Time", "Resources", "Billing", "Reports", "Settings"]
        john.WorkItems == ["Backlog", "Timeline", "Import"]
        joe.menu.Projects == ["Home", "Projects", "WorkItems", "Requests", "Code", "Time", "Resources", "Reports"]
        joe.menu.WorkItems == ["Backlog", "Timeline"]
        joe.settings == 403
        joe.vis.isClient == false
        joe.vis.itemVisibilityIds == null
        joe.vis.visibleProjectIds.includes("IRON")
        joe.workGroupItem === true
        johnChat.level >= 2
        johnChat.errors == ""
        johnChat.read
        johnChat.listed
        johnChat.chatter > 0
        johnChat.recordVisible === true
        joeChat.record >= 1
        joeChat.lobby == 1
        johnDrive.drives.includes("BOSS_RECORDS")
        johnDrive.errors == ""
        johnDrive.name == "drive-secret.txt"
        johnDrive.agentUse === true
    },
})

feature("the client's own project: its lists, timeline and services hold its project, shared items and requests, nothing internal or of another client", {
    when() {
        const sheldon = as(SHELDON, () => {
            // a record as Chatter finds it (get#RecordLinkInfo under the client's authorization)
            const seen = (entityName, id) => hit("Projects/Chatter/chatterData", { recordEntity: entityName, recordId: id }).json?.visible === true
            return {
                projects: render("Projects/List", { list: "all" }), workItems: render("WorkItems/List", { list: "all" }), requests: render("Requests/List", { list: "all" }),
                timeline: hit("Projects/WorkItems/Timeline/timeline", { rootWorkEffortId: "ACME" }),
                json: [hit("Projects/WorkItems/List/fieldValue", { workEffortId: "ACME-1", field: "due" }),
                    hit("Projects/WorkItems/List/workItemAncestors", { ids: "ACME-2,ACME-3" }),
                    hit("Projects/WorkItems/WorkItemDetail/subItemLevel", { workEffortId: "ACME-1" }),
                    hit("Projects/Projects/Roadmap/fieldValue", { planWorkEffortId: "ACME-MS-1", field: "due" }),
                    hit("Projects/Chatter/recordCard", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }),
                    hit("Projects/Projects/List", { list: "all", renderMode: "json" })].map((found) => found.output).join("\n"),
                records: { acme: seen("mantle.work.effort.WorkEffort", "ACME"), acme1: seen("mantle.work.effort.WorkEffort", "ACME-1"),
                    acme3: seen("mantle.work.effort.WorkEffort", "ACME-3"), milestone: seen("mantle.work.effort.WorkEffort", "ACME-MS-1"),
                    request1: seen("mantle.request.Request", "BOSS_DEMO_PREQ_ACME1"), request2: seen("mantle.request.Request", "BOSS_DEMO_PREQ_ACME2"),
                    note: seen("mantle.party.communication.CommunicationEvent", made.notes[0]),
                    message: seen("mantle.party.communication.CommunicationEvent", "BOSS_DEMO_ACME_MSG1"),
                    demoNote: seen("mantle.party.communication.CommunicationEvent", "BOSS_DEMO_ACME_NOTE1"),
                    update: seen("mantle.party.communication.CommunicationEvent", "BOSS_DEMO_ACME_UPD1"),
                    internalUpdate: seen("mantle.party.communication.CommunicationEvent", made.notes[3]),
                    party: seen("mantle.party.Party", "ORG_ACME"), rate: seen("mantle.humanres.rate.RateAmount", "BOSS_TEST_CLI_RATE") },
                // the services that do not depend on the caller's authorization, as the client
                direct: sys(() => ({
                    vis: service("mantle.work.ProjectServices.get#VisibleProjectInfo"),
                    activity: JSON.stringify(service("mantle.work.ProjectServices.get#ProjectActivity", { workEffortId: "ACME", pageSize: 100 }).activityList || []),
                    tree: (service("mantle.work.ProjectServices.get#WorkItemTree", { rootWorkEffortId: "ACME", topLevel: true }).workItemList || []).map((row) => row.workEffortId),
                    time: (service("mantle.work.TimeServices.find#TimeEntries", { rootWorkEffortId: "ACME", withRates: true }).rowList || []).length,
                    sprints: (service("ironstone.projects.PlanningServices.get#ProjectSprints", { rootWorkEffortId: "IRON", includeClosed: true }).sprintList || []).length,
                    access: service("ironstone.projects.ProjectServices.get#ProjectAccess", { workEffortId: "ACME", need: "none" }),
                    task: service("ironstone.commons.TaskServices.get#TaskAccess", { workEffortId: "ACME-1", app: "projects", need: "check" }),
                    clientInfo: service("mantle.work.ProjectServices.get#ClientProjectInfo"),
                })),
            }
        })
        const gob = as(GOB, () => ({ projects: render("Projects/List", { list: "all" }), workItems: render("WorkItems/List", { list: "all" }) }))
        return { sheldon, gob }
    },
    then({ sheldon, gob }) {
        const pages = { projects: sheldon.projects, workItems: sheldon.workItems, requests: sheldon.requests, gobProjects: gob.projects, gobWorkItems: gob.workItems }
        Object.entries(pages).filter(([name, page]) => page.status != 200 || page.refused || page.broken).map(([name, page]) => `${name} ${page.status}`) == []
        sheldon.projects.output.includes("Acme customer portal")
        !sheldon.projects.output.includes("Acme mobile app")
        sheldon.workItems.output.includes("Customer sign-in")
        sheldon.workItems.output.includes("Sign-in page")
        !sheldon.workItems.output.includes("ACME-3")
        !sheldon.workItems.output.includes("ACME-6")
        sheldon.requests.output.includes("Export the portal's users to a spreadsheet")
        sheldon.requests.output.includes("The sign-in page is slow on phones")
        !sheldon.requests.output.includes("Bring over the tickets of the old tracker")
        leaksOf([sheldon.projects, sheldon.workItems, sheldon.requests, sheldon.timeline].map((page) => page.output).join("\n") + sheldon.json, ACME_SECRETS) == []
        sheldon.json.includes("Sign-in page")
        gob.projects.output.includes("Bluth banana stand site")
        gob.workItems.output.includes("Frozen banana menu page")
        !gob.workItems.output.includes("Price the stand")
        leaksOf(gob.projects.output + gob.workItems.output, BLUTH_SECRETS) == []
        sheldon.records == { acme: true, acme1: true, acme3: false, milestone: true, request1: true, request2: true, note: false, message: true,
            demoNote: false, update: true, internalUpdate: false, party: false, rate: false }
        sheldon.direct.vis.isClient == true
        sheldon.direct.vis.allProjects == false
        sheldon.direct.vis.visibleProjectIds == ["ACME"]
        sheldon.direct.vis.memberProjectIds == []
        sheldon.direct.vis.managedProjectIds == []
        leaksOf(sheldon.direct.activity, ACME_SECRETS) == []
        !sheldon.direct.activity.includes("\"kind\":\"comment\"")
        sheldon.direct.tree.length > 0
        !sheldon.direct.tree.includes("ACME-3")
        !sheldon.direct.tree.includes("ACME-6")
        sheldon.direct.time == 0
        sheldon.direct.sprints == 0
        sheldon.direct.access.canView == true
        sheldon.direct.access.canUpdate == false
        sheldon.direct.access.canManage == false
        sheldon.direct.task.visible == true
        sheldon.direct.task.canUpdate == false
        sheldon.direct.clientInfo.clientProjectIds == ["ACME"]
        sheldon.direct.clientInfo.clientOrgIds == ["ORG_ACME"]
        sheldon.direct.clientInfo.clientContactPartyIds.includes("ORG_ACME_BA")
        !sheldon.direct.clientInfo.scopePartyIds.includes("ORG_BLUTH")
    },
})

feature("a client writes only its own: its request, file, message, reply and gate are taken; the same on another's record, and every other write, refused", {
    given() {
        made.gate = one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: "BOSS_DEMO_ACME_AP1" })
        made.milestoneStatus = one("mantle.work.effort.WorkEffort", { workEffortId: "ACME-MS-1" }).statusId
        made.requestIds = []
        made.eventIds = []
    },
    when() {
        const item = one("mantle.work.effort.WorkEffort", { workEffortId: "ACME-1" })
        const refusedBody = "<p>ZQW-REFUSED</p>"
        const messages = () => count("mantle.party.communication.CommunicationEvent", { fromPartyId: SHELDON_ID, body: refusedBody })
        const messagesBefore = messages()
        // the refusals: each the same call as a write below that is taken, on a record or in a state the client may not write
        const tried = as(SHELDON, () => ({
            // every write verb of an IronStone service is one deny (BOSS_PROJECTS_INTERNAL): a status change, a roadmap and a release move
            status: hit("Projects/WorkItems/WorkItemDetail/changeStatus", { workEffortId: "ACME-1", toStatusId: "WeComplete" }, "post"),
            plan: hit("Projects/Projects/Roadmap/savePlanItem", { rootWorkEffortId: "ACME", workEffortTypeEnumId: "WetMilestone", workEffortName: "Client milestone" }, "post"),
            release: hit("Projects/Projects/ReleaseDetail/releaseRelease", { workEffortId: "ACME-MS-1" }, "post"),
            // a message on a record the client does not see (a Work group item, another client's item, a party), a reply to a note or off its record
            messageWorkGroup: hit("Projects/Chatter/sendMessage", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-3", body: refusedBody }, "post"),
            messageOtherClient: hit("Projects/Chatter/sendMessage", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "BLUTH-1", body: refusedBody }, "post"),
            messageParty: hit("Projects/Chatter/sendMessage", { recordEntity: "mantle.party.Party", recordId: "ORG_ACME", body: refusedBody }, "post"),
            replyToNote: hit("Projects/Chatter/reply", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", parentCommEventId: "BOSS_DEMO_ACME_NOTE1", body: refusedBody }, "post"),
            replyOffRecord: hit("Projects/Chatter/reply", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-4", parentCommEventId: "BOSS_DEMO_ACME_MSG1", body: refusedBody }, "post"),
            logNote: hit("Projects/Chatter/logNote", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", body: refusedBody }, "post"),
            // a request in another client's project or one without client sign-in; a file on a work item, a script file; another's or a move
            raiseOther: hit("Projects/Requests/List/raiseClientRequest", { newProjectId: "BLUTH", requestName: "ZQW-REFUSED" }, "post"),
            raiseNoSignIn: hit("Projects/Requests/List/raiseClientRequest", { newProjectId: "ACMEAPP", requestName: "ZQW-REFUSED" }, "post"),
            uploadItem: hit("Projects/RecordFiles/upload", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", contentFile: uploadedFile("x.txt", "x") }, "post"),
            uploadScript: hit("Projects/RecordFiles/upload", { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_PREQ_ACME1",
                contentFile: uploadedFile("x.svg", "<svg onload='alert(1)'/>") }, "post"),
            cancelNotMine: hit("Projects/Requests/RequestDetail/changeStatus", { requestId: "BOSS_DEMO_PREQ_ACME2", toStatusId: "ReqCancelled" }, "post"),
            moveOn: hit("Projects/Requests/RequestDetail/changeStatus", { requestId: "BOSS_DEMO_PREQ_ACME1", toStatusId: "ReqCompleted" }, "post"),
            // a gate it is not the approver of, setting a gate, a refusal without a reason, a milestone not awaiting it
            gateOther: hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "IRON-MS-2", action: "approve" }, "post"),
            gateSet: hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "ACME-MS-1", action: "gate", approvalRequired: "N" }, "post"),
            gateNoReason: hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "ACME-MS-1", action: "refuse", comments: "" }, "post"),
            gateNotAwaiting: hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "ACME-MS-2", action: "approve" }, "post"),
        }))
        // the approver another Acme contact: Sheldon is not it
        sys(() => ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ workEffortId: "ACME-MS-1", settingTypeEnumId: "WstApproverParty" }).updateAll({ settingValue: "ORG_ACME_BA" }))
        try {
            tried.gateNotApprover = as(SHELDON, () => hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "ACME-MS-1", action: "approve" }, "post"))
        } finally {
            sys(() => ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ workEffortId: "ACME-MS-1", settingTypeEnumId: "WstApproverParty" }).updateAll({ settingValue: SHELDON_ID }))
        }
        // outside its own services a client writes no Mantle record, even through a Mantle service
        const mantle = as(SHELDON, () => ({
            event: service("create#mantle.party.communication.CommunicationEvent", { communicationEventTypeId: "Message", fromPartyId: SHELDON_ID, subject: "ZQW-REFUSED" }),
            message: service("mantle.party.CommunicationServices.create#Message", { toPartyIdList: [JOHN_ID], subject: "ZQW-REFUSED", body: "x" }),
            workItem: service("update#mantle.work.effort.WorkEffort", { workEffortId: "ACME-1", workEffortName: "ZQW-REFUSED" }),
        }))
        // an internal user is no client: the client services refuse it (authorization off, so the refusal is the service's own)
        const internal = as("john.doe", () => sys(() => ({
            send: service(CLIENT + "send#ChatterMessage", { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1", body: refusedBody }),
            raise: service(CLIENT + "raise#ClientRequest", { rootWorkEffortId: "ACME", requestName: "ZQW-REFUSED" }),
            gate: service(CLIENT + "decide#ClientGate", { workEffortId: "ACME-MS-1", decision: "approve" }),
        })))
        const refused = {
            accepted: Object.entries(tried).filter(([name, found]) => !refusedHit(found)).map(([name]) => name)
                .concat(Object.entries(mantle).filter(([name, out]) => out._errors == "").map(([name]) => "mantle " + name))
                .concat(Object.entries(internal).filter(([name, out]) => out._errors == "").map(([name]) => "internal " + name)),
            statusRefused: tried.status.refused,
            itemStatus: one("mantle.work.effort.WorkEffort", { workEffortId: "ACME-1" }).statusId == item.statusId,
            milestones: count("mantle.work.effort.WorkEffort", { workEffortName: "Client milestone" }),
            gateRequired: one("mantle.work.effort.WorkEffortSetting", { workEffortId: "ACME-MS-1", settingTypeEnumId: "WstApprovalRequired" })?.settingValue,
            gates: ["WeaApproved", "WeaRefused", "WeaRequested"].map((statusId) => count("mantle.work.effort.WorkEffortApproval", { workEffortId: "ACME-MS-1", statusId })),
            messages: messages() - messagesBefore,
            requests: count("mantle.request.Request", { requestName: "ZQW-REFUSED" }),
            requestStatuses: ["BOSS_DEMO_PREQ_ACME1", "BOSS_DEMO_PREQ_ACME2"].map((requestId) => one("mantle.request.Request", { requestId }).statusId),
            scriptFiles: count("mantle.request.RequestContent", { requestId: "BOSS_DEMO_PREQ_ACME1", description: "x.svg" }),
            mantleEvents: count("mantle.party.communication.CommunicationEvent", { subject: "ZQW-REFUSED" }),
            mantleItems: count("mantle.work.effort.WorkEffort", { workEffortName: "ZQW-REFUSED" }),
        }

        // the writes taken: a request in its own project with a file, another file on it, a message on the project to the team (with
        // another client and the client's own billing contact put on it in roles that are not client roles), a reply to the team's
        // message, and the gate it is the approver of
        sys(() => {
            for (const [partyId, roleTypeId] of [[GOB_ID, "Programmer"], ["ORG_ACME_BA", "Watcher"]])
                ec.service.sync().name("create#mantle.work.effort.WorkEffortParty").parameters({ workEffortId: "ACME", partyId, roleTypeId, fromDate: "2026-10-01 00:00:00" }).call()
        })
        let taken = null
        try {
            taken = as(SHELDON, () => {
                const raised = hit("Projects/Requests/List/raiseClientRequest", { newProjectId: "ACME", requestName: "ZQW walk: export the audit log",
                    description: "We need the audit log as a spreadsheet each month.", contentFile: uploadedFile("audit-sample.csv", "date,who,what\n") }, "post")
                const request = one("mantle.request.Request", { requestName: "ZQW walk: export the audit log" })
                if (request) made.requestIds.push(request.requestId)
                const more = request ? hit("Projects/RecordFiles/upload", { recordEntity: "mantle.request.Request", recordId: request.requestId,
                    contentFile: uploadedFile("screenshot.png", "not really a png") }, "post") : null
                const files = request ? hit("Projects/RecordFiles/filesData", { recordEntity: "mantle.request.Request", recordId: request.requestId }) : null
                const sent = hit("Projects/Chatter/sendMessage", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME", body: "<p>ZQW-TEAM-ONLY</p>" }, "post")
                const replied = hit("Projects/Chatter/reply", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", parentCommEventId: "BOSS_DEMO_ACME_MSG1",
                    body: "<p>ZQW two test accounts are ready: test1 and test2.</p>" }, "post")
                for (const out of [sent, replied]) if (out.json?.communicationEventId) made.eventIds.push(out.json.communicationEventId)
                const timeline = hit("Projects/Chatter/timeline", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" })
                const milestone = render("Projects/MilestoneDetail", { workEffortId: "ACME-MS-1" })
                const approved = hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "ACME-MS-1", action: "approve", comments: "Looks good" }, "post")
                return { raised, request, more, files, sent, replied, timeline, milestone, approved }
            })
        } finally {
            sys(() => ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: "ACME", fromDate: "2026-10-01 00:00:00" })
                .condition("partyId", "in", [GOB_ID, "ORG_ACME_BA"]).deleteAll())
        }
        const request = taken.request
        taken.parties = request ? rows("mantle.request.RequestParty", { requestId: request.requestId }).map((row) => row.partyId + ":" + row.roleTypeId) : []
        taken.contents = request ? rows("mantle.request.RequestContent", { requestId: request.requestId }).map((row) => String(row.contentLocation).split("/").pop()) : []
        const sentId = taken.sent.json?.communicationEventId
        taken.sentEvent = sentId ? one("mantle.party.communication.CommunicationEvent", { communicationEventId: sentId }) : null
        taken.sentTo = sentId ? rows("mantle.party.communication.CommunicationEventParty", { communicationEventId: sentId }).map((row) => row.partyId) : []
        const replyId = taken.replied.json?.communicationEventId
        taken.replyEvent = replyId ? one("mantle.party.communication.CommunicationEvent", { communicationEventId: replyId }) : null
        taken.replyTo = replyId ? rows("mantle.party.communication.CommunicationEventParty", { communicationEventId: replyId }).map((row) => row.partyId) : []
        taken.gate = one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: "BOSS_DEMO_ACME_AP1" })
        taken.milestoneStatus = one("mantle.work.effort.WorkEffort", { workEffortId: "ACME-MS-1" }).statusId
        return { refused, taken }
    },
    then({ refused, taken }) {
        refused.accepted == []
        refused.statusRefused
        refused.itemStatus
        refused.milestones == 0
        refused.gateRequired == "Y"
        refused.gates == [0, 0, 1]
        refused.messages == 0
        refused.requests == 0
        refused.requestStatuses == ["ReqReviewed", "ReqSubmitted"]
        refused.scriptFiles == 0
        refused.mantleEvents == 0
        refused.mantleItems == 0
        // the request: in its project, filed by the client for its organization, with both files, which it may not remove
        !taken.raised.refused
        taken.request.statusId == "ReqSubmitted"
        taken.request.rootWorkEffortId == "ACME"
        taken.request.filedByPartyId == SHELDON_ID
        taken.parties.includes("ORG_ACME_SA:Reporter")
        taken.parties.includes("ORG_ACME:Customer")
        taken.contents.includes("audit-sample.csv")
        taken.contents.includes("screenshot.png")
        taken.files.json?.canUpload == true
        taken.files.json?.fileList?.length >= 2
        taken.files.json?.fileList?.every((file) => file.canRemove === false)
        taken.files.json?.recordsDriveId == null
        // the message goes to the team only: never to another client put on the project, nor to the client's own side
        taken.sentEvent.fromPartyId == SHELDON_ID
        taken.sentEvent.toPartyId == JOHN_ID
        taken.sentEvent.communicationEventTypeId == "Message"
        taken.sentTo.includes(JOHN_ID)
        taken.sentTo.filter((partyId) => [GOB_ID, "ORG_ACME_BA", SHELDON_ID, "ORG_ACME", "ORG_ZIZI_SERVICES"].includes(partyId)) == []
        taken.replyEvent.parentCommEventId == "BOSS_DEMO_ACME_MSG1"
        taken.replyTo.includes(JOHN_ID)
        taken.timeline.output.includes("two test accounts are ready")
        taken.timeline.json?.entryList?.every((entry) => entry.canUnlink !== true && entry.canEdit !== true && entry.threadUrl == null)
        taken.timeline.json?.entryList?.some((entry) => entry.canReply === true)
        // the gate: MilestoneDetail shows the approver its decision and none of the team's controls; the approval is the client's own
        taken.milestone.output.includes("Approve")
        taken.milestone.output.includes("Refuse")
        !taken.milestone.output.includes("Set the gate")
        !taken.milestone.output.includes("Add deliverable")
        !taken.milestone.output.includes("Ask for approval")
        leaksOf(taken.milestone.output, ACME_SECRETS) == []
        taken.approved.errors == ""
        !taken.approved.refused
        taken.gate.statusId == "WeaApproved"
        taken.gate.recordedFor == "N"
        taken.gate.decidedByUserId == SHELDON_ID
        taken.milestoneStatus == "WeComplete"
    },
    cleanup() {
        sys(() => {
            if (made.gate) ec.entity.find("mantle.work.effort.WorkEffortApproval").condition("workEffortApprovalId", "BOSS_DEMO_ACME_AP1").updateAll({ statusId: made.gate.statusId,
                decidedByUserId: made.gate.decidedByUserId || null, decidedDate: made.gate.decidedDate || null, decisionComments: made.gate.decisionComments || null,
                recordedFor: made.gate.recordedFor || null })
            if (made.milestoneStatus) ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "ACME-MS-1").updateAll({ statusId: made.milestoneStatus, actualCompletionDate: null })
            for (const requestId of made.requestIds || []) {
                for (const entityName of ["mantle.request.RequestParty", "mantle.request.RequestContent", "mantle.request.RequestCommEvent", "mantle.request.RequestWorkEffort"])
                    ec.entity.find(entityName).condition("requestId", requestId).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition({ recordEntityName: "mantle.request.Request", recordId: requestId }).deleteAll()
                ec.entity.find("mantle.request.Request").condition("requestId", requestId).updateAll({ statusId: "ReqCancelled" })
            }
            for (const id of made.eventIds || []) {
                for (const entityName of ["mantle.party.communication.CommunicationEventRecord", "mantle.party.communication.CommunicationEventParty",
                        "mantle.work.effort.WorkEffortCommEvent", "mantle.request.RequestCommEvent"])
                    ec.entity.find(entityName).condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", id).updateAll({ statusId: "CeCancelled" })
            }
        })
    },
})

feature("every IronStone write service is in the client's deny pattern, and only ironstone.client services are outside it", {
    when() {
        const READS = ["get", "find", "search", "check", "clean", "decorate", "describe", "list", "lookup", "match", "parse", "suggest"]
        const patterns = sys(() => ec.entity.find("moqui.security.ArtifactGroupMember").condition({ artifactGroupId: "BOSS_PROJECTS_INTERNAL",
            artifactTypeEnumId: "AT_SERVICE" }).list()).map((row) => new RegExp("^(?:" + row.artifactName + ")$"))
        const root = "component://mr-boss/service/ironstone"
        const notDenied = []
        const clientExtra = []
        const clientWrites = []
        const clientDenied = []
        const walk = (location, prefix) => {
            for (const ref of ec.resource.getLocationReference(location).getDirectoryEntries()) {
                const name = ref.location.substring(ref.location.lastIndexOf("/") + 1)
                if (ref.isDirectory()) { walk(ref.location, prefix + name + "."); continue }
                if (!name.endsWith(".xml")) continue
                const className = prefix + name.replace(/\.xml$/, "")
                const clientFile = className === "client.ClientServices"
                if (className.startsWith("client.") && !clientFile) clientExtra.push(className)
                for (const match of String(ref.getText()).matchAll(/<service verb="([A-Za-z]+)" noun="([A-Za-z]+)"([^>]*)>/g)) {
                    // an interface only declares parameters for the services that implement it; it cannot be called
                    if (/type="interface"/.test(match[3]) || READS.includes(match[1])) continue
                    const full = "ironstone." + className + "." + match[1] + "#" + match[2]
                    const denied = patterns.some((pattern) => pattern.test(full))
                    if (clientFile) {
                        clientWrites.push(full)
                        if (denied) clientDenied.push(full)
                    } else if (!denied) notDenied.push(full)
                }
            }
        }
        walk(root, "")
        const clientText = String(ec.resource.getLocationReference(root + "/client/ClientServices.xml").getText())
        const remoteOpen = (clientText.match(/<service verb="/g) || []).length - (clientText.match(/<service verb="[^"]+" noun="[^"]+" allow-remote="false"/g) || []).length
        return { notDenied, clientExtra, clientWrites, clientDenied, remoteOpen }
    },
    then({ notDenied, clientExtra, clientWrites, clientDenied, remoteOpen }) {
        notDenied == []
        clientExtra == []
        clientDenied == []
        clientWrites.length >= 6
        remoteOpen == 0
    },
})

feature("a client reads no record of another client nor an internal one: by its id, in search, the palette or the pickers", {
    when() {
        return as(SHELDON, () => {
            const seen = (entityName, id) => hit("Projects/Chatter/chatterData", { recordEntity: entityName, recordId: id }).json?.visible === true
            const groups = {}
            for (const text of ["Bluth", "BLUTH-1", "Hiring", "HIRE", "IRON-3", "Acme", "ACME-3", "!1", "iron"])
                groups[text] = (hit("../shellSearch", { text, limit: "10" }).json?.groups || []).reduce((total, group) => total + (group.rows || []).length, 0)
            return {
                // another client's project and item, an internal project, milestone, release and request, a project the client is not on
                seen: ["BLUTH", "BLUTH-1", "IRON", "IRON-MS-2", "IRON-REL-2", "ACMEAPP"].filter((id) => seen("mantle.work.effort.WorkEffort", id))
                    .concat(seen("mantle.request.Request", "BOSS_DEMO_PREQ_IRON1") ? ["BOSS_DEMO_PREQ_IRON1"] : []),
                direct: sys(() => ({
                    projects: ["BLUTH", "IRON", "ACMEAPP"].filter((id) => service("ironstone.projects.ProjectServices.get#ProjectAccess", { workEffortId: id, need: "none" }).canView),
                    items: ["BLUTH-1", "ACME-3", "IRON-3"].filter((id) => service("ironstone.commons.TaskServices.get#TaskAccess", { workEffortId: id, app: "projects", need: "check" }).visible),
                })),
                ironRequest: render("Requests/RequestDetail", { requestId: "BOSS_DEMO_PREQ_IRON1" }),
                json: [hit("Projects/WorkItems/Timeline/timeline", { rootWorkEffortId: "BLUTH" }),
                    hit("Projects/WorkItems/List/workItemAncestors", { workEffortId: "IRON-3" }),
                    hit("Projects/WorkItems/WorkItemDetail/subItemLevel", { workEffortId: "IRON-1", parentWorkEffortId: "IRON-1" }),
                    hit("Projects/Chatter/recordCard", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "BLUTH-1" }),
                    hit("Projects/Chatter/timeline", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "BLUTH-1" })].map((found) => found.output).join("\n"),
                groups,
                pickers: [hit("Projects/Projects/List/clientSearch", { term: "B" }), hit("Projects/Projects/List/peopleSearch", { term: "o" }),
                    hit("Projects/Requests/List/customerSearch", { term: "Bluth" }), hit("Projects/Chatter/searchRecords", { term: "Bluth" }),
                    hit("Projects/Chatter/searchUsers", { term: "Gob" }), hit("Projects/WorkItems/WorkItemDetail/parentSearch", { workEffortId: "ACME-1", term: "a" })]
                    .map((found) => found.output).join("\n"),
            }
        })
    },
    then({ seen, direct, ironRequest, json, groups, pickers }) {
        seen == []
        direct.projects == []
        direct.items == []
        ironRequest.status == 200
        !ironRequest.broken
        !ironRequest.output.includes("Leave holidays")
        leaksOf(ironRequest.output + json, ACME_SECRETS.concat(["IronStone Projects", "Acme mobile app"])) == []
        !json.includes("Frozen banana")
        Object.entries(groups).filter(([text, found]) => found > 0).map(([text]) => text) == []
        leaksOf(pickers, ACME_SECRETS.concat(["Bluth Corp", "Gob Bluth"])) == []
    },
})

feature("a client's chat and drive: Chatter without notes, no record room, records drive, internal presence or agent", {
    when() {
        const sheldon = as(SHELDON, () => ({
            // Chatter: the message to the client, never the note, its attachment, or a following of the team
            timeline: hit("Projects/Chatter/timeline", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }),
            notesOnly: hit("Projects/Chatter/timeline", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", kinds: "notes" }),
            project: hit("Projects/Chatter/timeline", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME" }),
            request: hit("Projects/Chatter/timeline", { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_PREQ_ACME1" }),
            data: hit("Projects/Chatter/chatterData", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }),
            attachment: hit("Projects/Chatter/attachment", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", communicationEventContentId: made.attachmentId }),
            tui: render("Chatter", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }, "tui"),
            // record files: those of its request, not of a work item, a project, another client's request or a party
            files: [["mantle.request.Request", "BOSS_DEMO_PREQ_ACME1"], ["mantle.work.effort.WorkEffort", "ACME-1"], ["mantle.work.effort.WorkEffort", "ACME"],
                ["mantle.request.Request", "BOSS_DEMO_PREQ_IRON1"], ["mantle.party.Party", "ORG_ACME"]].map(([recordEntity, recordId]) =>
                hit("Projects/RecordFiles/filesData", { recordEntity, recordId }).json?.visible === true),
            // the records drive: none among its drives (the WebDAV and SFTP home), no level, list, file, upload, download or version
            drives: Array.from(service(`${FILES}.get#UserDrives`, {}).driveList || []).map((drive) => drive.driveId),
            levels: [null, "", "work", "work/ACME-1", DRIVE_FILE].map((path) => Number(service(`${FILES}.get#DriveAccess`,
                path == null ? { driveId: "BOSS_RECORDS" } : { driveId: "BOSS_RECORDS", path }).level || 0)),
            listed: service(`${FILES}.list#Folder`, { driveId: "BOSS_RECORDS", path: "work/ACME-1/zqx" }),
            info: service(`${FILES}.get#ResourceInfo`, { driveId: "BOSS_RECORDS", path: DRIVE_FILE }),
            upload: service(`${FILES}.upload#Resource`, { driveId: "BOSS_RECORDS", path: "work/ACME-1/zqx", fileList: [uploadedFile("client.txt", "from the client")] }),
            driveFile: service("ironstone.shared.RecordFilesServices.get#RecordDriveFile", { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1", drivePath: DRIVE_FILE }),
            versions: (service("ironstone.shared.RecordFilesServices.get#RecordFileVersions", { recordEntityName: "mantle.work.effort.WorkEffort",
                recordId: "ACME-1", drivePath: DRIVE_FILE }).versionList || []).length,
            download: hit("Projects/RecordFiles/driveDownload", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", drivePath: DRIVE_FILE }),
            agentUse: ec.user.hasPermission("AgentUse"),
            a2a: ec.user.hasPermission("A2aServerUse"),
        }))
        // record rooms: none reached, its own shared item's nor another client's, as a member neither, with authorization on (every
        // chat service refused: they are authorized through the Comms screens) or off (as the webroot chat transitions call them: not found)
        const rooms = []
        for (const [mode, run] of [["on", as], ["off", asOff]]) run(SHELDON, () => {
            const refusal = mode === "on" ? "not authorized" : "not found"
            for (const roomId of [made.acmeRoom, made.bluthRoom, made.publicRoom]) {
                const timeline = service(`${CHAT}.get#Timeline`, { chatRoomId: roomId })
                if (level(roomId) !== 0) rooms.push(`${mode} ${roomId}: level`)
                if (JSON.stringify(timeline.eventList || []).includes(ROOM_SECRET)) rooms.push(`${mode} ${roomId}: read`)
                if (!timeline._errors.includes(refusal)) rooms.push(`${mode} ${roomId}: timeline ${timeline._errors}`)
                if (mode === "off") {
                    if (!service(`${CHAT}.send#Message`, { chatRoomId: roomId, body: "<p>hello</p>" })._errors.includes(refusal)) rooms.push(`${roomId}: sent`)
                    if (!service(`${CHAT}.add#Member`, { chatRoomId: roomId })._errors.includes(refusal)) rooms.push(`${roomId}: joined`)
                    if (service(`${CHAT}.signal#Typing`, { chatRoomId: roomId, typing: true })._errors === "") rooms.push(`${roomId}: typing taken`)
                }
            }
            if (service(`${CHAT}.get#Room`, { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }).room != null) rooms.push(`${mode}: got its item's room`)
            if (service(`${CHAT}.create#Room`, { roomTypeEnumId: "CrtRecord", recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }).chatRoomId != null)
                rooms.push(`${mode}: made or joined its item's room`)
            // and none in its room list, counts, search or Chatter timeline
            const listed = Array.from(service(`${CHAT}.find#Rooms`, { includeJoinable: true }).roomList || []).map((room) => room.chatRoomId)
                .concat(Object.keys(service(`${CHAT}.get#UnreadCounts`, {}).roomCounts || {}))
            for (const roomId of [made.acmeRoom, made.bluthRoom, made.publicRoom]) if (listed.includes(roomId)) rooms.push(`${mode} ${roomId}: listed or counted`)
            if (JSON.stringify(service(`${CHAT}.search#ChatEvents`, { searchText: ROOM_SECRET }).eventList || []).includes(ROOM_SECRET)) rooms.push(`${mode}: search found the room's message`)
            if (Array.from(service("mantle.party.CommunicationServices.get#RecordTimeline", { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1",
                kinds: "chat" }).entryList || []).some((entry) => entry.kind === "chat")) rooms.push(`${mode}: Chatter showed a chat entry`)
        })
        // Mantle's get#RecordLinkInfo applies the client rule with authorization disabled too; the framework's check answers false
        // for a client though Mantle shows it its shared item
        const linkInfo = asOff(SHELDON, () => ({
            visible: [["mantle.work.effort.WorkEffort", "ACME-1"], ["mantle.work.effort.WorkEffort", "ACME-3"], ["mantle.work.effort.WorkEffort", "BLUTH-1"],
                ["mantle.work.effort.WorkEffort", "BLUTH"], ["mantle.party.Party", "ORG_ZIZI_SERVICES"]].map(([recordEntityName, recordId]) =>
                service("mantle.party.CommunicationServices.get#RecordLinkInfo", { recordEntityName, recordId, checkOnly: true }).recordVisible === true),
            framework: service(`${CHAT}.check#RecordVisible`, { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }).recordVisible,
        }))
        // nobody adds a client to a record room, and a mention of a client in one counts for nothing
        const added = asOff("john.doe", () => [service(`${CHAT}.add#Member`, { chatRoomId: made.acmeRoom, userId: GOB_ID })._errors,
            service(`${CHAT}.create#Room`, { roomTypeEnumId: "CrtRecord", recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-2", memberUserIdList: [SHELDON_ID] })._errors])
        const mentions = sys(() => {
            let notified = ec.entity.find("moqui.chat.ChatEventMention").condition("chatRoomId", "in", [made.acmeRoom, made.bluthRoom])
                .condition("userId", "in", [SHELDON_ID, GOB_ID]).count()
            for (const message of ec.entity.find("moqui.security.user.NotificationMessage").condition("topic", "ChatMention").list())
                notified += ec.entity.find("moqui.security.user.NotificationMessageUser").condition("notificationMessageId", message.notificationMessageId)
                    .condition("userId", "in", [SHELDON_ID, GOB_ID]).count()
            return notified
        })
        // notices: a client following a work item is told of a message for it, never of a note or a mention in one
        const notices = sys(() => {
            ec.service.sync().name("create#mantle.party.communication.RecordFollower").parameters({ recordEntityName: "mantle.work.effort.WorkEffort",
                recordId: "ACME-1", userId: SHELDON_ID, notifyMessages: "Y", notifyNotes: "Y", notifyActivities: "Y", notifyChanges: "Y" }).call()
            try {
                const notify = (parameters) => Array.from(service("mantle.party.CommunicationServices.notify#RecordFollowers", Object.assign({
                    recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }, parameters)).notifiedUserIds || [])
                return { note: notify({ kind: "notes", communicationEventId: made.notes[0], subject: "ZQX", body: "ZQX-INTERNAL-NOTE" }),
                    message: notify({ kind: "messages", communicationEventId: "BOSS_DEMO_ACME_MSG1", subject: "Customer sign-in", body: "test accounts" }),
                    mention: Array.from(service("mantle.party.CommunicationServices.notify#RecordMention", { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1",
                        communicationEventId: made.notes[0], mentionUserIds: [SHELDON_ID, "ORG_ZIZI_JD"], subject: "ZQX", body: "ZQX-INTERNAL-NOTE" }).notifiedUserIds || []) }
            } finally {
                ec.entity.find("mantle.party.communication.RecordFollower").condition({ recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1", userId: SHELDON_ID }).deleteAll()
            }
        })
        // presence: a client sees only its own, through the webroot chat store and the service; an internal user sees both
        hit("../userStatusHeartbeat", { idleSeconds: "0" }, "post")
        login(SHELDON)
        hit("../userStatusHeartbeat", { idleSeconds: "0" }, "post")
        const store = Object.keys(hit("../userStatuses", { userIds: `${JOHN_ID},${GOB_ID},${SHELDON_ID}` }).json?.statusMap || {})
        const unread = Object.keys(hit("../chatUnread", {}).json?.roomCounts || {})
        // the agent: no Assist drawer
        const assist = hit("../assist/bootstrap", {})
        login("john.doe")
        const presence = { store, service: asOff(SHELDON, () => Object.keys(service(`${CHAT}.get#UserStatuses`, { userIdList: [JOHN_ID, SHELDON_ID] }).statusMap || {})),
            internal: Object.keys(hit("../userStatuses", { userIds: `${JOHN_ID},${SHELDON_ID}` }).json?.statusMap || {}).sort() }
        // and no model call (an internal user's call is not refused as external; it may fail for want of a model in the test conf)
        const summarize = () => {
            let message = ""
            try { ec.llm.summarize("the record's text") } catch (err) { message = String(err && err.message ? err.message : err) }
            ec.message.clearErrors()
            return message
        }
        const model = { client: as(SHELDON, summarize), internal: as("john.doe", summarize) }
        const written = sys(() => ec.resource.getLocationReference("dbresource://mantle/content/work/ACME-1/zqx/client.txt").exists)
        return { sheldon, rooms, linkInfo, added, mentions, notices, unread, presence, assist, model, written }
    },
    then({ sheldon, rooms, linkInfo, added, mentions, notices, unread, presence, assist, model, written }) {
        sheldon.timeline.output.includes("Could you send us two test accounts")
        sheldon.project.output.includes("Sign-in is late by a week")
        leaksOf([sheldon.timeline, sheldon.project, sheldon.request, sheldon.data, sheldon.tui].map((found) => found.output).join("\n"), ACME_SECRETS) == []
        sheldon.notesOnly.json?.entryList == []
        sheldon.data.json?.forClient == true
        sheldon.data.json?.canMessage == true
        !(sheldon.data.json?.followerList?.length > 0)
        !sheldon.attachment.output.includes("ZQX")
        sheldon.attachment.errors.includes("not found") || sheldon.attachment.json?.errors != null
        sheldon.files == [true, false, false, false, false]
        !sheldon.drives.includes("BOSS_RECORDS")
        sheldon.levels == [0, 0, 0, 0, 0]
        !JSON.stringify(sheldon.listed.fileList || []).includes("drive-secret")
        sheldon.listed._errors != ""
        sheldon.info.resource == null
        sheldon.info._errors != ""
        sheldon.upload._errors != ""
        !written
        sheldon.driveFile.location == null
        sheldon.driveFile._errors != ""
        sheldon.versions == 0
        !sheldon.download.output.includes("ZQX-DRIVE-SECRET")
        rooms.join("\n") == ""
        !unread.includes(made.acmeRoom)
        linkInfo.visible == [true, false, false, false, false]
        linkInfo.framework === false
        added.filter((errors) => !errors.includes("may not be in a record room")) == []
        mentions == 0
        !notices.note.includes(SHELDON_ID)
        notices.message.includes(SHELDON_ID)
        !notices.mention.includes(SHELDON_ID)
        notices.mention.includes("ORG_ZIZI_JD")
        presence.store == [SHELDON_ID]
        presence.service == [SHELDON_ID]
        presence.internal == [JOHN_ID, SHELDON_ID].sort()
        // the agent permissions are withheld though the client's group was granted AgentUse
        sheldon.agentUse === false
        sheldon.a2a === false
        assist.status == 403 || assist.status == 401 || /AgentUse/.test(assist.output + assist.errors)
        model.client.includes("not available to this user")
        !model.internal.includes("not available to this user")
    },
})

// the Code fixture: a branch cc-theme in acme-portal with a commit, a merge request of it linked to ACME-1 (shared) and ACME-3 (Work
// group), a reviewer's note, a line comment, and a check with a description and a link, all with ZQX sentinels; ACME shares its
// repositories (WstShareRepositories Y). Taken out after.
function settle() {
    const started = Date.now()
    while (Date.now() - started < 20000) {
        const busy = sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", REPO]).condition("ecaStatus", "in", ["pending", "running"]).count())
        if (busy == 0) return
        sys(() => call("org.moqui.impl.GitServices.process#PendingGitUpdates", {}))
    }
}
function share(projectId, on) {
    sys(() => {
        ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ workEffortId: projectId, settingTypeEnumId: "WstShareRepositories" }).deleteAll()
        if (on) ec.service.sync().name("create#mantle.work.effort.WorkEffortSetting").parameters({ workEffortId: projectId,
            settingTypeEnumId: "WstShareRepositories", settingValue: "Y" }).call()
    })
}
// what a client's write could change of the repository, to compare before and after
const codeState = () => sys(() => ({
    refs: Array.from(call("org.moqui.impl.GitServices.get#GitRefs", { repositoryId: REPO }).refList).map((ref) => ref.refName + "@" + ref.commitId).sort().join(","),
    mr: (() => { const mr = ec.entity.find("moqui.resource.GitMergeRequest").condition("mergeRequestId", made.mrId).one()
        return [mr.statusId, mr.title, mr.description, mr.targetRef].join("|") })(),
    reviewers: Array.from(ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition("mergeRequestId", made.mrId).list()).map((row) => row.userId + ":" + row.statusId).sort().join(","),
    comments: ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition({ recordEntityName: "moqui.resource.GitMergeRequest", recordId: made.mrId }).count()
        + ec.entity.find("mantle.party.communication.CommunicationEvent").condition("fromPartyId", SHELDON_ID).count(),
    mrItems: Array.from(ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition("mergeRequestId", made.mrId).list()).map((row) => row.workEffortId).sort().join(","),
    commitItems: ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition("repositoryId", REPO).count(),
    refLinks: ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition("repositoryId", REPO).condition("thruDate", "is-null", null).count(),
    projectRepos: ec.entity.find("mantle.work.effort.WorkEffortGitRepository").condition("repositoryId", REPO).conditionDate("fromDate", "thruDate", null).count(),
    repositories: ec.entity.find("moqui.resource.GitRepository").count(),
}))
// the Code services a client's screens call, as the current user with authorization off (a service is authorized by the screen
// calling it): what the service decides itself for a client (PROJECT_CLIENT)
const codeServices = (repositoryId, projectId) => sys(() => ({
    access: service(CODE + "get#RepositoryAccess", { repositoryId }),
    projectCode: service(CODE + "get#ProjectCode", { workEffortId: projectId }).code || {},
    mergeRequests: service(CODE + "find#MergeRequests", { list: "all", repositoryId }).rowList || [],
}))
// the view right of a repository, which the Code screens' renders and transitions check (the services above leave it to them)
const gitAuthz = (userId, repositoryId) => sys(() => service("mantle.work.GitServices.check#GitRepositoryAuthz", { userId, authzActionEnumId: "AUTHZA_VIEW",
    artifactTypeEnumId: "AT_GIT_REPOSITORY", artifactName: repositoryId }).authzTypeEnumId)

feature("shared repositories: a client reads its project's, read only and without the team's review; never an internal one, another client's or one unshared", {
    requires: ["git"],
    given() {
        login("john.doe")
        sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", REPO]).condition("ecaStatus", "running").updateAll({ ecaStatus: "pending" }))
        settle()
        sys(() => {
            made.shareBefore = Array.from(ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ settingTypeEnumId: "WstShareRepositories" })
                .condition("workEffortId", "in", ["ACME", "BLUTH"]).list()).map((row) => row.getMap())
            call("org.moqui.impl.GitServices.create#GitRef", { repositoryId: REPO, refName: BRANCH, refType: "branch" })
            call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: REPO, branch: BRANCH })
            try {
                made.commitId = call("org.moqui.impl.GitServices.commit#GitFiles", { repositoryId: REPO, message: "The portal's colors for ACME-1",
                    fileMap: { "src/theme.css": ":root { --brand: #b40000; }\n" } }).commitId
            } finally { call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: REPO, branch: "main" }) }
        })
        settle()
        sys(() => {
            made.mrId = call("org.moqui.impl.GitReviewServices.create#MergeRequest", { repositoryId: REPO, sourceRef: BRANCH, targetRef: "main",
                title: "CC portal colors", description: "The brand colors of the portal." }).mergeRequestId
            for (const workEffortId of ["ACME-1", "ACME-3"]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition({ mergeRequestId: made.mrId, workEffortId }).count())
                    ec.service.sync().name("create#mantle.work.effort.WorkEffortGitMergeRequest").parameters({ mergeRequestId: made.mrId, workEffortId,
                        linkSourceEnumId: "WglsExplicit", completeOnMerge: "N" }).call()
            }
            ec.service.sync().name("create#moqui.resource.GitMergeRequestReviewer").parameters({ mergeRequestId: made.mrId, userId: JOHN_ID,
                statusId: "GmrrChangesRequested", requestedDate: ec.user.nowTimestamp, reviewedDate: ec.user.nowTimestamp, reviewNote: "ZQX-REVIEW-NOTE: not this red" }).call()
            made.commentId = call("mantle.work.GitServices.create#ReviewComment", { mergeRequestId: made.mrId, body: "ZQX-LINE-COMMENT: the margin is thin here",
                path: "src/theme.css", newLine: 1, lineText: ":root { --brand: #b40000; }" }).communicationEventId
            call("org.moqui.impl.GitServices.create#GitCommitStatus", { repositoryId: REPO, commitId: made.commitId, state: "failure", context: "ci/build",
                description: "ZQX-CI-NOTE: the staging password expired", target_url: "https://ci.internal.example/run/9" })
        })
        ec.message.clearErrors()
        share("ACME", true)
    },
    when() {
        const ironMr = sys(() => ec.entity.find("moqui.resource.GitMergeRequest").condition({ repositoryId: "iron", mergeRequestNum: 1 }).one()?.mergeRequestId)
        const tabsOf = (found) => (Array.isArray(found.json) ? found.json : []).flatMap((one) => one.name === "RepositoryDetail" ? (one.subscreens || []).map((item) => item.name) : [])
        const mr = { mergeRequestId: made.mrId }
        const sheldon = as(SHELDON, () => ({
            tabs: tabsOf(hit("../menuData/apps/Projects/Code/RepositoryDetail", { repositoryId: REPO })),
            codeMenu: menuLevels(hit("../menuData/apps/Projects/Code")).Code || [],
            raw: hit("Projects/Code/RepositoryDetail/Files/raw", { repositoryId: REPO, ref: "main", path: "README.md", download: "Y" }),
            commits: render("Code/RepositoryDetail/Commits", { repositoryId: REPO }),
            changes: hit("Projects/Code/MergeRequestDetail/Changes/changes", mr),
            chatter: hit("Projects/Chatter/timeline", { recordEntity: "moqui.resource.GitMergeRequest", recordId: made.mrId }).output
                + hit("Projects/Chatter/chatterData", { recordEntity: "moqui.resource.GitMergeRequest", recordId: made.mrId }).output,
            code: codeServices(REPO, "ACME"),
            detail: sys(() => service(CODE + "get#MergeRequestDetail", mr).detail || {}),
            threads: sys(() => service("mantle.work.GitServices.get#ReviewThreads", mr).threadList || []),
            commit: sys(() => service(CODE + "get#CommitDetail", { repositoryId: REPO, commitId: made.commitId })),
            // refused: an internal repository, Compare (its render's status), the activity, compare and palette services
            authz: gitAuthz(SHELDON_ID, REPO),
            iron: { raw: hit("Projects/Code/RepositoryDetail/Files/raw", { repositoryId: "iron", ref: "main", path: "README.md" }).status,
                changes: hit("Projects/Code/MergeRequestDetail/Changes/changes", { mergeRequestId: ironMr }).json?.changes ?? null,
                authz: gitAuthz(SHELDON_ID, "iron") },
            compare: render("Code/Compare", { repositoryId: REPO, head: BRANCH }).refused,
            activity: sys(() => service(CODE + "get#RepositoryActivity", { repositoryId: REPO })),
            compareService: sys(() => service(CODE + "get#CompareInfo", { repositoryId: REPO, head: BRANCH })),
            palette: sys(() => service(CODE + "search#CodePalette", { text: "acme" }).resultList || []),
        }))
        // Bluth's own project shares its repositories: still nothing of Acme's
        share("BLUTH", true)
        const gob = as(GOB, () => ({ authz: gitAuthz(GOB_ID, REPO), raw: hit("Projects/Code/RepositoryDetail/Files/raw", { repositoryId: REPO, ref: "main", path: "README.md" }).status }))
        share("BLUTH", false)
        // ACME stops sharing: the client reads nothing of its code
        share("ACME", false)
        const off = as(SHELDON, () => ({ authz: gitAuthz(SHELDON_ID, REPO), raw: hit("Projects/Code/RepositoryDetail/Files/raw", { repositoryId: REPO, ref: "main", path: "README.md" }).status,
            changes: hit("Projects/Code/MergeRequestDetail/Changes/changes", mr).json?.changes ?? null }))
        share("ACME", true)
        // the writes of the Code screens, one of each, and IronStone's own service: refused, the repository unchanged
        const before = codeState()
        const p = { repositoryId: REPO }
        const writes = as(SHELDON, () => [
            ["Branches/createBranch", hit("Projects/Code/RepositoryDetail/Branches/createBranch", Object.assign({ refName: "cc-client" }, p), "post")],
            ["Tags/createTag", hit("Projects/Code/RepositoryDetail/Tags/createTag", Object.assign({ refName: "cc-client-tag" }, p), "post")],
            ["CommitDetail/linkItem", hit("Projects/Code/CommitDetail/linkItem", Object.assign({ commitId: made.commitId, workEffortId: "ACME-1" }, p), "post")],
            ["Repositories/createRepository", hit("Projects/Code/Repositories/createRepository", { workEffortId: "ACME", repositoryId: "cc-client-repo" }, "post")],
            ["ProjectCode/linkRepository", hit("Projects/Projects/ProjectDetail/Code/linkRepository", { workEffortId: "ACME", repositoryId: REPO }, "post")],
            ["MergeRequestDetail/mergeMergeRequest", hit("Projects/Code/MergeRequestDetail/mergeMergeRequest", Object.assign({ mergeMethodEnumId: "GmmMerge" }, mr), "post")],
            ["Overview/mergeMergeRequest", hit("Projects/Code/MergeRequestDetail/Overview/mergeMergeRequest", Object.assign({ mergeMethodEnumId: "GmmMerge" }, mr), "post")],
            ["Changes/comment", hit("Projects/Code/MergeRequestDetail/Changes/comment", Object.assign({ body: "cc client comment", path: "src/theme.css", newLine: "1" }, mr), "post")],
            ["comment#MergeRequest", { errors: sys(() => service(CODE + "comment#MergeRequest", Object.assign({ body: "cc boss" }, mr))._errors) }],
        ].filter(([name, out]) => !(out.refused || (out.errors && out.errors.length) || (out.json && Object.keys(out.json).length == 0)
            || /not authorized|not available|may not|not found/i.test(out.output || ""))).map(([name]) => name))
        const after = codeState()
        const comment = sys(() => ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", made.commentId).one()?.statusId)
        // the team: the Activity and Settings tabs, the reviewers, threads, checks and Chatter
        const john = as("john.doe", () => ({
            tabs: tabsOf(hit("../menuData/apps/Projects/Code/RepositoryDetail", { repositoryId: REPO })),
            changes: hit("Projects/Code/MergeRequestDetail/Changes/changes", mr).json?.changes || {},
            chatter: hit("Projects/Chatter/timeline", { recordEntity: "moqui.resource.GitMergeRequest", recordId: made.mrId }).output,
            code: codeServices(REPO, "ACME"),
            commit: sys(() => JSON.stringify(service(CODE + "get#CommitDetail", { repositoryId: REPO, commitId: made.commitId }).statusList || [])),
        }))
        return { ironMr, sheldon, gob, off, writes, same: JSON.stringify(after) == JSON.stringify(before), comment, john }
    },
    then({ ironMr, sheldon, gob, off, writes, same, comment, john }) {
        // the client: the repository read only, its tabs and menu without the internal ones, its files, its commits with the shared item
        sheldon.tabs.includes("Files")
        sheldon.tabs.includes("Commits")
        sheldon.tabs.includes("MergeRequests")
        !sheldon.tabs.includes("Activity")
        !sheldon.tabs.includes("Settings")
        sheldon.codeMenu.includes("Repositories")
        sheldon.codeMenu.includes("MergeRequests")
        !sheldon.codeMenu.includes("GitAccess")
        sheldon.authz == "AUTHZT_ALLOW"
        sheldon.code.access.canView
        !sheldon.code.access.canCreate
        !sheldon.code.access.canUpdate
        !sheldon.code.access.canDelete
        !sheldon.code.access.isAdmin
        sheldon.code.access.sshUrl == null
        sheldon.code.access.repository.remoteUrl == null
        sheldon.code.projectCode.repositoryList?.map((repo) => repo.repositoryId)?.includes(REPO)
        JSON.stringify(sheldon.code.projectCode).includes("CC portal colors")
        sheldon.raw.status == 200
        sheldon.raw.output.includes("Acme customer portal")
        sheldon.commits.status == 200
        !sheldon.commits.broken
        sheldon.commits.output.includes("The portal skeleton for ACME-1")
        sheldon.commits.output.includes("workEffortId=ACME-1")
        !sheldon.commits.output.includes("workEffortId=ACME-3")
        // a merge request: no reviewers, comments, checks, threads, action or Chatter; only the shared item
        sheldon.code.mergeRequests.length == 1
        sheldon.code.mergeRequests[0].reviewerList == []
        sheldon.code.mergeRequests[0].commentCount == 0
        sheldon.code.mergeRequests[0].itemList.map((item) => item.workEffortId) == ["ACME-1"]
        sheldon.detail.reviewerList == []
        sheldon.detail.checkList == []
        sheldon.detail.primaryAction == null
        !sheldon.detail.canEdit
        !sheldon.detail.canReview
        sheldon.detail.threadCounts.total == 0
        sheldon.detail.itemList.map((item) => item.workEffortId) == ["ACME-1"]
        sheldon.threads == []
        sheldon.changes.json.changes.fileList.map((file) => file.path) == ["src/theme.css"]
        sheldon.changes.json.changes.threadList == []
        !sheldon.changes.json.changes.canComment
        !sheldon.changes.json.changes.canReview
        sheldon.commit.statusList == []
        sheldon.commit.itemList?.map((item) => item.workEffortId) == ["ACME-1"]
        leaksOf(JSON.stringify([sheldon.code, sheldon.detail, sheldon.commit]) + sheldon.changes.output + sheldon.chatter + sheldon.commits.output, CODE_SECRETS) == []
        !sheldon.chatter.includes("ZQX")
        // refused: the internal repository, Compare, Activity, the compare and palette services
        ironMr != null
        sheldon.iron.raw == 404
        sheldon.iron.changes == null
        sheldon.iron.authz == "AUTHZT_NONE"
        sheldon.compare
        sheldon.activity._errors != ""
        !sheldon.activity.updateList?.length
        sheldon.compareService._errors != ""
        sheldon.palette == []
        // another client, its own project sharing: nothing of Acme's
        gob.authz == "AUTHZT_NONE"
        gob.raw == 404
        // sharing off: nothing
        off.authz == "AUTHZT_NONE"
        off.raw == 404
        off.changes == null
        // the writes: each refused, nothing changed
        writes == []
        same
        comment == "CeSent"
        // the team keeps all of it
        john.tabs.includes("Activity")
        john.tabs.includes("Settings")
        john.changes.threadList.length == 1
        john.changes.canComment
        john.chatter.includes("ZQX-LINE-COMMENT")
        john.code.access.canView
        john.code.mergeRequests[0].reviewerList.length == 1
        john.code.mergeRequests[0].commentCount >= 1
        john.code.mergeRequests[0].itemList.map((item) => item.workEffortId).sort() == ["ACME-1", "ACME-3"]
        john.commit.includes("ZQX-CI-NOTE")
    },
    cleanup() {
        sys(() => {
            if (made.commentId) {
                for (const entityName of ["mantle.party.communication.CommunicationEventGitAnchor", "mantle.party.communication.CommunicationEventRecord",
                        "mantle.party.communication.CommunicationEvent"])
                    ec.entity.find(entityName).condition("communicationEventId", made.commentId).deleteAll()
            }
            if (made.mrId) {
                for (const entityName of ["mantle.work.effort.WorkEffortGitMergeRequest", "moqui.resource.GitMergeRequestReviewer", "moqui.resource.GitMergeRequest"])
                    ec.entity.find(entityName).condition("mergeRequestId", made.mrId).deleteAll()
            }
            if (made.commitId) {
                ec.entity.find("moqui.resource.GitCommitStatus").condition({ repositoryId: REPO, commitId: made.commitId }).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition({ repositoryId: REPO, commitId: made.commitId }).deleteAll()
            }
            ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition({ repositoryId: REPO, refName: "refs/heads/" + BRANCH }).deleteAll()
            ec.service.sync().name("org.moqui.impl.GitServices.delete#GitRef").parameters({ repositoryId: REPO, refName: BRANCH, refType: "branch" }).call()
            ec.message.clearErrors()
            ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ settingTypeEnumId: "WstShareRepositories" }).condition("workEffortId", "in", ["ACME", "BLUTH"]).deleteAll()
            for (const row of made.shareBefore || []) ec.service.sync().name("create#mantle.work.effort.WorkEffortSetting").parameters(row).call()
        })
        settle()
    },
})
