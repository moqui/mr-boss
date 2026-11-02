// Client access, the chat, drive and agent spec (impl-projects.md P10b, closing F121): a client contact who signs in
// (sheldon.acme of Acme, gob.bluth of Bluth Corp, in BOSS_PROJECT_CLIENT, which holds Mantle's PROJECT_CLIENT and the
// framework's EXTERNAL_USER) reaches no chat room bound to a record, not the room of a work item shared with it nor another
// client's, not as a member either; is never added to or mentioned into one; gets no record room in its lists, counts,
// search or Chatter timeline; reaches no records drive (the services WebDAV and SFTP call: FileServices get#UserDrives,
// get#DriveAccess, list#Folder, get#ResourceInfo; and RecordFiles' drive download); sees no internal user's presence; and
// never gets an agent (the Agent* permissions are withheld, the Assist drawer refused, a model call refused). The webroot
// chat transitions run their services with authorization disabled, so the client is checked there too, and Mantle's
// get#RecordLinkInfo applies the client rule with authorization disabled. Internal users keep all of it (the regression part).
// Run: ./moq test mr-boss --spec ClientChatDrive
const webroot = "component://webroot/screen/webroot.xml"
const SHELDON = "sheldon.acme"
const SHELDON_ID = "ORG_ACME_SA"
const GOB_ID = "ORG_BLUTH_GOB"
const JOHN_ID = "EX_JOHN_DOE"
const SECRET = "ZQX-ROOM-SECRET"
const DRIVE_FILE = "work/ACME-1/zqx/drive-secret.txt"
const made = {}

function hit(path, parameters, method) {
    // a path under the apps root, or with ../ one under the webroot
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
const service = (name, parameters) => {
    let out = {}
    let thrown = ""
    try { out = ec.service.sync().name(name).parameters(parameters || {}).call() || {} } catch (err) { thrown = String(err && err.message ? err.message : err) }
    const errors = (ec.message.getErrorsString ? ec.message.getErrorsString() : "") + thrown
    ec.message.clearErrors()
    return Object.assign({}, out, { _errors: errors || "" })
}
const CHAT = "org.moqui.impl.ChatServices"
const FILES = "org.moqui.impl.FileServices"
const level = (roomId) => Number(service(`${CHAT}.get#RoomAccess`, { chatRoomId: roomId }).level || 0)

spec({
    stepwise: false,
    setupSpec() {
        login("john.doe")
        sys(() => {
            // the record rooms of a work item shared with Acme (ACME-1) and of one shared with Bluth (BLUTH-1), made by john.doe,
            // each with a message the clients must never read
            for (const [key, recordId] of [["acmeRoom", "ACME-1"], ["bluthRoom", "BLUTH-1"]]) {
                made[key] = ec.service.sync().name(`${CHAT}.create#Room`).parameters({ roomTypeEnumId: "CrtRecord",
                    recordEntityName: "mantle.work.effort.WorkEffort", recordId }).call().chatRoomId
            }
            // a member row of each client in its own item's room, as one made before P10b (or by a path that did not ask)
            for (const [roomId, userId] of [[made.acmeRoom, SHELDON_ID], [made.bluthRoom, GOB_ID]]) {
                if (!ec.entity.find("moqui.chat.ChatRoomMember").condition("chatRoomId", roomId).condition("userId", userId).one()) {
                    // the member is the user's chat actor (its id is the userId), made first
                    const chatActorId = ec.service.sync().name(`${CHAT}.get#LocalActors`).parameter("userIdList", [userId]).call().actorMap[userId]
                    ec.service.sync().name("create#moqui.chat.ChatRoomMember").parameters({ chatRoomId: roomId, chatActorId, userId, roleEnumId: "CmrMember",
                        joinedDate: ec.user.nowTimestamp, lastReadEventSeq: 0, notificationLevelEnumId: "CnlAll", isPinned: "N", isMuted: "N" }).call()
                }
            }
            // a public room the clients are not in
            made.publicRoom = ec.service.sync().name(`${CHAT}.create#Room`).parameters({ roomTypeEnumId: "CrtPublic", roomName: "ZQX Lobby" }).call().chatRoomId
            // a file in the records drive's folder of ACME-1, which Acme's client sees as a work item
            ec.resource.getLocationReference(`dbresource://mantle/content/${DRIVE_FILE}`).putText("ZQX-DRIVE-SECRET")
            // the agent permission granted to the client group for the spec: the framework must withhold it
            if (!ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", "BOSS_PROJECT_CLIENT")
                    .condition("userPermissionId", "AgentUse").one()) {
                ec.service.sync().name("create#moqui.security.UserGroupPermission").parameters({ userGroupId: "BOSS_PROJECT_CLIENT",
                    userPermissionId: "AgentUse", fromDate: 0 }).call()
                made.agentGrant = true
            }
        })
        // john.doe's message in each room, mentioning the client
        for (const [roomId, clientId] of [[made.acmeRoom, SHELDON_ID], [made.bluthRoom, GOB_ID]]) {
            const out = sys(() => ec.service.sync().name(`${CHAT}.send#Message`).parameters({ chatRoomId: roomId,
                body: `<p>${SECRET}: the margin is thin, <span data-mention-id="${clientId}">@client</span></p>` }).call())
            ec.message.clearErrors()
            made[roomId] = out ? out.eventSeq : null
        }
    },
    cleanupSpec() {
        sys(() => {
            if (made.agentGrant) ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", "BOSS_PROJECT_CLIENT")
                .condition("userPermissionId", "AgentUse").deleteAll()
            for (const userId of [SHELDON_ID, GOB_ID]) ec.entity.find("moqui.chat.ChatRoomMember").condition("userId", userId)
                .condition("chatRoomId", "in", [made.acmeRoom, made.bluthRoom].filter((id) => id)).deleteAll()
            try { ec.resource.getLocationReference(`dbresource://mantle/content/${DRIVE_FILE}`).delete() } catch (err) { /* gone */ }
        })
    },
})


feature("the seed: a client holds EXTERNAL_USER and no agent permission even when its group is granted one", {
    when() {
        const client = as(SHELDON, () => ({ external: ec.user.hasPermission("EXTERNAL_USER"), projectClient: ec.user.hasPermission("PROJECT_CLIENT"),
            agentUse: ec.user.hasPermission("AgentUse"), a2a: ec.user.hasPermission("A2aServerUse") }))
        const internal = as("john.doe", () => ({ external: ec.user.hasPermission("EXTERNAL_USER"), agentUse: ec.user.hasPermission("AgentUse") }))
        return { client, internal }
    },
    then({ client, internal }) {
        made.acmeRoom
        made.bluthRoom
        made[made.acmeRoom]
        client.external === true
        client.projectClient === true
        client.agentUse === false
        client.a2a === false
        internal.external === false
        internal.agentUse === true
    },
})

feature("a client reaches no record room, its own shared item's nor another client's, as a member neither, with authorization on or off", {
    when() {
        // sheldon.acme alone: the Acme room is its own shared item's, the Bluth room another client's (Bluth's is the same rule)
        const seen = []
        const user = SHELDON
        for (const [mode, run] of [["on", as], ["off", asOff]]) {
            run(user, () => {
                const rooms = {}
                for (const roomId of [made.acmeRoom, made.bluthRoom, made.publicRoom]) {
                    const timeline = service(`${CHAT}.get#Timeline`, { chatRoomId: roomId })
                    rooms[roomId] = { level: level(roomId), timelineLeak: JSON.stringify(timeline.eventList || []).includes(SECRET),
                        timelineErrors: timeline._errors }
                    // with authorization on every chat service is refused by the one deny, so the writes are tried with it off
                    if (mode === "off") Object.assign(rooms[roomId], {
                        send: service(`${CHAT}.send#Message`, { chatRoomId: roomId, body: "<p>hello</p>" })._errors,
                        join: service(`${CHAT}.add#Member`, { chatRoomId: roomId })._errors,
                        typing: service(`${CHAT}.signal#Typing`, { chatRoomId: roomId, typing: true })._errors })
                }
                const byRecord = service(`${CHAT}.get#Room`, { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" })
                const made2 = service(`${CHAT}.create#Room`, { roomTypeEnumId: "CrtRecord", recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" })
                seen.push({ user, mode, rooms, byRecordRoom: byRecord.room ?? null, createdRoomId: made2.chatRoomId ?? null })
            })
        }
        return { seen }
    },
    then({ seen }) {
        seen.length == 2
        for (const one of seen) {
            assert(one.byRecordRoom === null, `${one.user} (${one.mode}) got the room of its item`)
            assert(one.createdRoomId === null, `${one.user} (${one.mode}) made or joined the room of its item`)
            for (const [roomId, room] of Object.entries(one.rooms)) {
                const where = `${one.user} (authorization ${one.mode}) in room ${roomId}`
                assert(room.level === 0, `${where}: level ${room.level}`)
                assert(!room.timelineLeak, `${where}: read the timeline`)
                // with authorization on the chat services are refused outright (they are authorized through the Comms
                // screens, which a client is denied); off, as the webroot chat transitions call them, the room is not found
                const refusal = one.mode === "on" ? "not authorized" : "not found"
                assert(room.timelineErrors.includes(refusal), `${where}: timeline ${room.timelineErrors}`)
                if (one.mode === "on") continue
                assert(room.send.includes(refusal), `${where}: send ${room.send}`)
                assert(room.join.includes(refusal), `${where}: join ${room.join}`)
                assert(room.typing !== "", `${where}: typing was taken`)
            }
        }
    },
})

feature("the framework's check answers false for a client though Mantle shows it its shared item; an internal user is answered true", {
    when() {
        // with authorization disabled, as the webroot chat transitions and the drive services' inner calls run
        return asOff(SHELDON, () => ({
            mantle: service("mantle.party.CommunicationServices.get#RecordLinkInfo", { recordEntityName: "mantle.work.effort.WorkEffort",
                recordId: "ACME-1", checkOnly: true }).recordVisible,
            framework: service(`${CHAT}.check#RecordVisible`, { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }).recordVisible,
            internal: asOff("john.doe", () => service(`${CHAT}.check#RecordVisible`, { recordEntityName: "mantle.work.effort.WorkEffort", recordId: "ACME-1" }).recordVisible),
        }))
    },
    then({ mantle, framework, internal }) {
        mantle === true
        framework === false
        internal === true
    },
})

feature("get#RecordLinkInfo applies the client rule with authorization disabled too; an internal caller still sees everything", {
    when() {
        const visible = (entityName, id) => service("mantle.party.CommunicationServices.get#RecordLinkInfo", { recordEntityName: entityName,
            recordId: id, checkOnly: true }).recordVisible === true
        const client = asOff(SHELDON, () => ({ shared: visible("mantle.work.effort.WorkEffort", "ACME-1"), workGroup: visible("mantle.work.effort.WorkEffort", "ACME-3"),
            otherItem: visible("mantle.work.effort.WorkEffort", "BLUTH-1"), otherProject: visible("mantle.work.effort.WorkEffort", "BLUTH"),
            party: visible("mantle.party.Party", "ORG_ZIZI_SERVICES") }))
        const internal = sys(() => visible("mantle.work.effort.WorkEffort", "ACME-3"))
        return { client, internal }
    },
    then({ client, internal }) {
        client.shared === true
        client.workGroup === false
        client.otherItem === false
        client.otherProject === false
        client.party === false
        internal === true
    },
})

feature("nobody adds a client to a record room, and a mention of a client in one counts for nothing", {
    when() {
        const add = asOff("john.doe", () => service(`${CHAT}.add#Member`, { chatRoomId: made.acmeRoom, userId: GOB_ID })._errors)
        const create = asOff("john.doe", () => service(`${CHAT}.create#Room`, { roomTypeEnumId: "CrtRecord", recordEntityName: "mantle.work.effort.WorkEffort",
            recordId: "ACME-2", memberUserIdList: [SHELDON_ID] })._errors)
        return sys(() => {
            const mentionRows = ec.entity.find("moqui.chat.ChatEventMention").condition("chatRoomId", "in", [made.acmeRoom, made.bluthRoom])
                .condition("userId", "in", [SHELDON_ID, GOB_ID]).count()
            let notified = 0
            for (const message of ec.entity.find("moqui.security.user.NotificationMessage").condition("topic", "ChatMention").list())
                notified += ec.entity.find("moqui.security.user.NotificationMessageUser").condition("notificationMessageId", message.notificationMessageId)
                    .condition("userId", "in", [SHELDON_ID, GOB_ID]).count()
            return { add, create, mentionRows, notified }
        })
    },
    then({ add, create, mentionRows, notified }) {
        add.includes("may not be in a record room")
        create.includes("may not be in a record room")
        mentionRows == 0
        notified == 0
    },
})

feature("a client's room list, counts, search and Chatter timeline leave the record rooms out", {
    when() {
        const seen = []
        for (const [mode, run] of [["on", as], ["off", asOff]]) {
            run(SHELDON, () => {
                const ids = Array.from(service(`${CHAT}.find#Rooms`, { includeJoinable: true }).roomList || []).map((room) => room.chatRoomId)
                const counts = Object.keys(service(`${CHAT}.get#UnreadCounts`, {}).roomCounts || {})
                const found = JSON.stringify(service(`${CHAT}.search#ChatEvents`, { searchText: SECRET }).eventList || [])
                const timeline = Array.from(service("mantle.party.CommunicationServices.get#RecordTimeline", { recordEntityName: "mantle.work.effort.WorkEffort",
                    recordId: "ACME-1", kinds: "chat" }).entryList || []).filter((entry) => entry.kind === "chat").length
                seen.push({ mode, ids, counts, found, timeline })
            })
        }
        login(SHELDON)
        const unread = hit("../chatUnread", {})
        login("john.doe")
        return { seen, unreadRooms: Object.keys((unread.json && unread.json.roomCounts) || {}) }
    },
    then({ seen, unreadRooms }) {
        seen.length == 2
        for (const one of seen) {
            for (const roomId of [made.acmeRoom, made.bluthRoom, made.publicRoom])
                assert(!one.ids.includes(roomId) && !one.counts.includes(roomId), `authorization ${one.mode}: room ${roomId} listed or counted`)
            assert(!one.found.includes(SECRET), `authorization ${one.mode}: search found the room's message`)
            assert(one.timeline === 0, `authorization ${one.mode}: Chatter showed ${one.timeline} chat entries`)
        }
        !unreadRooms.includes(made.acmeRoom)
    },
})

feature("an internal user keeps the record rooms (regression; the chat services run as the Comms screens and the webroot store call them)", {
    when() {
        const john = asOff("john.doe", () => {
            const timeline = service(`${CHAT}.get#Timeline`, { chatRoomId: made.acmeRoom })
            return { level: level(made.acmeRoom), errors: timeline._errors, read: JSON.stringify(timeline.eventList || []).includes(SECRET),
                listed: Array.from(service(`${CHAT}.find#Rooms`, {}).roomList || []).map((room) => room.chatRoomId).includes(made.acmeRoom),
                chatter: Array.from(service("mantle.party.CommunicationServices.get#RecordTimeline", { recordEntityName: "mantle.work.effort.WorkEffort",
                    recordId: "ACME-1", kinds: "chat" }).entryList || []).filter((entry) => entry.kind === "chat").length }
        })
        // Joe Developer, on the team, reads the room of an item he sees without joining it, and the public room
        const joe = asOff("joe.developer", () => ({ record: level(made.acmeRoom), lobby: level(made.publicRoom) }))
        return { john, joe }
    },
    then({ john, joe }) {
        john.level >= 2
        john.errors == ""
        john.read
        john.listed
        john.chatter > 0
        joe.record >= 1
        joe.lobby == 1
    },
})

feature("a client gets no records drive among its drives (the WebDAV and SFTP home), and no level, list, file or upload in it", {
    when() {
        const seen = []
        for (const user of [SHELDON]) {
            as(user, () => {
                const drives = Array.from(service(`${FILES}.get#UserDrives`, {}).driveList || []).map((drive) => drive.driveId)
                const levels = [null, "", "work", "work/ACME-1", DRIVE_FILE].map((path) => Number(service(`${FILES}.get#DriveAccess`,
                    path == null ? { driveId: "BOSS_RECORDS" } : { driveId: "BOSS_RECORDS", path }).level || 0))
                const listed = service(`${FILES}.list#Folder`, { driveId: "BOSS_RECORDS", path: "work/ACME-1/zqx" })
                const info = service(`${FILES}.get#ResourceInfo`, { driveId: "BOSS_RECORDS", path: DRIVE_FILE })
                const upload = service(`${FILES}.upload#Resource`, { driveId: "BOSS_RECORDS", path: "work/ACME-1/zqx",
                    fileList: [uploadedFile("client.txt", "from the client")] })
                seen.push({ user, drives, levels, listLeak: JSON.stringify(listed.fileList || []).includes("drive-secret"), listErrors: listed._errors,
                    resource: info.resource ?? null, infoErrors: info._errors, uploadErrors: upload._errors })
            })
        }
        const written = sys(() => ec.resource.getLocationReference("dbresource://mantle/content/work/ACME-1/zqx/client.txt").exists)
        return { seen, written }
    },
    then({ seen, written }) {
        seen.length == 1
        for (const one of seen) {
            assert(!one.drives.includes("BOSS_RECORDS"), `${one.user} has the records drive`)
            assert(one.levels.every((value) => value === 0), `${one.user} levels ${one.levels}`)
            assert(!one.listLeak && one.listErrors !== "", `${one.user} listed the record folder`)
            assert(one.resource === null && one.infoErrors !== "", `${one.user} read the file`)
            assert(one.uploadErrors !== "", `${one.user} uploaded`)
        }
        !written
    },
})

feature("RecordFiles' drive download and versions refuse a client", {
    when() {
        return as(SHELDON, () => {
            const file = service("ironstone.shared.RecordFilesServices.get#RecordDriveFile", { recordEntityName: "mantle.work.effort.WorkEffort",
                recordId: "ACME-1", drivePath: DRIVE_FILE })
            const versions = service("ironstone.shared.RecordFilesServices.get#RecordFileVersions", { recordEntityName: "mantle.work.effort.WorkEffort",
                recordId: "ACME-1", drivePath: DRIVE_FILE })
            const download = hit("Projects/RecordFiles/driveDownload", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", drivePath: DRIVE_FILE })
            return { location: file.location ?? null, fileErrors: file._errors, versions: (versions.versionList || []).length,
                downloaded: download.output.includes("ZQX-DRIVE-SECRET") }
        })
    },
    then({ location, fileErrors, versions, downloaded }) {
        location === null
        fileErrors != ""
        versions == 0
        !downloaded
    },
})

feature("an internal user keeps the records drive (regression)", {
    when() {
        return as("john.doe", () => {
            const drives = Array.from(service(`${FILES}.get#UserDrives`, {}).driveList || []).map((drive) => drive.driveId)
            const info = service(`${FILES}.get#ResourceInfo`, { driveId: "BOSS_RECORDS", path: DRIVE_FILE })
            return { drives, errors: info._errors, name: info.resource ? info.resource.name : null }
        })
    },
    then({ drives, errors, name }) {
        drives.includes("BOSS_RECORDS")
        errors == ""
        name == "drive-secret.txt"
    },
})

feature("a client sees only its own presence, through the services and the webroot chat store; an internal user sees both", {
    when() {
        login("john.doe")
        hit("../userStatusHeartbeat", { idleSeconds: "0" }, "post")
        login(SHELDON)
        hit("../userStatusHeartbeat", { idleSeconds: "0" }, "post")
        const store = hit("../userStatuses", { userIds: `${JOHN_ID},${GOB_ID},${SHELDON_ID}` })
        login("john.doe")
        const service_ = asOff(SHELDON, () => Object.keys(service(`${CHAT}.get#UserStatuses`, { userIdList: [JOHN_ID, SHELDON_ID] }).statusMap || {}))
        const internal = hit("../userStatuses", { userIds: `${JOHN_ID},${SHELDON_ID}` })
        return { store: Object.keys((store.json && store.json.statusMap) || {}), service_,
            internal: Object.keys((internal.json && internal.json.statusMap) || {}).sort() }
    },
    then({ store, service_, internal }) {
        store == [SHELDON_ID]
        service_ == [SHELDON_ID]
        internal == [JOHN_ID, SHELDON_ID].sort()
    },
})

feature("a client gets no Assist drawer and no model call, though its group was granted AgentUse", {
    when() {
        login(SHELDON)
        const boot = hit("../assist/bootstrap", {})
        login("john.doe")
        const summarize = () => {
            let message = ""
            try { ec.llm.summarize("the record's text") } catch (err) { message = String(err && err.message ? err.message : err) }
            ec.message.clearErrors()
            return message
        }
        return { boot, client: as(SHELDON, summarize), internal: as("john.doe", summarize) }
    },
    then({ boot, client, internal }) {
        boot.status == 403 || boot.status == 401 || /AgentUse/.test(boot.output + boot.errors)
        client.includes("not available to this user")
        // an internal user's call is not refused as external (it may fail for want of a model in the test conf)
        !internal.includes("not available to this user")
    },
})
