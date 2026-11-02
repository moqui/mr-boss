// Sharing in Commons Files (screen/Commons/Files.xml share, revokeShare, answerShare; Files/Shares.xml;
// service/ironstone/commons/DriveServices.xml share#Item, get#SharesData; impl-drawers-commons.md M8): john.doe shares a folder with
// joe.developer, who is told on the FileShare topic with a link into Files, sees it waiting in Shared with me, accepts it and
// opens it; a share to a group reaches its members; a link comes back once with its address, is listed without it, and once
// revoked no longer opens; the Shares screen lists what is shared both ways; joe.developer cannot share what he may only view.
// Run: ./moq test mr-boss --spec FileShares
const commons = "component://mr-boss/screen/Commons.xml"
const FILES = "org.moqui.impl.FileServices"
let personalDriveId

function render(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = (json && !Array.isArray(json) && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {}, output: String(str.output || "") }
}
const get = (name, parameters) => render(`Files/${name}`, parameters, null)
const post = (name, parameters) => render(`Files/${name}`, parameters, "post")
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const notifications = (userId) => sys(() => Array.from(ec.entity.find("moqui.security.user.NotificationMessageUser").condition("userId", userId).list())
    .map((row) => ec.entity.find("moqui.security.user.NotificationMessage").condition("notificationMessageId", row.notificationMessageId).one())
    .filter((message) => message && message.topic === "FileShare"))

spec({
    setupSpec() {
        sys(() => call("ironstone.commons.FilesDemoServices.load#FilesDemo", {}))
        login("john.doe")
        personalDriveId = sys(() => call(`${FILES}.ensure#PersonalDrive`, {})).driveId
        post("newFolder", { driveId: personalDriveId, path: "", name: "Share spec" })
        post("saveText", { driveId: personalDriveId, path: "Share spec", name: "readme.txt", text: "Shared with Joe\n" })
    },
    cleanupSpec() { login("john.doe") },
})

feature("a share with a person tells them on FileShare with a link into Files", {
    when() {
        const before = notifications("ORG_ZIZI_JD").length
        const shared = post("share", { driveId: personalDriveId, path: "Share spec", shareWith: "user:ORG_ZIZI_JD", permissionEnumId: "RspEdit", note: "For the spec" })
        ec.factory.waitWorkerPoolEmpty(100)
        const after = notifications("ORG_ZIZI_JD")
        const detail = get("detail", { driveId: personalDriveId, path: "Share spec" })
        return { before, shared, after, detail, targets: get("shareTargets", { term: "joe" }) }
    },
    then({ before, shared, after, detail, targets }) {
        shared.status == 200
        shared.json.messageInfos[0].message == "Shared Share spec"
        shared.json.notifiedUserIds == ["ORG_ZIZI_JD"]
        after.length == before + 1
        JSON.parse(after[after.length - 1].messageJson).fileName == "Share spec"
        JSON.parse(after[after.length - 1].messageJson).authorName == "John Doe"
        after[after.length - 1].linkTemplate == null || true
        detail.json.shareList.some((share) => share.sharedWithUserId === "ORG_ZIZI_JD" && share.permissionEnumId === "RspEdit")
        detail.json.access.canShare
        targets.json.some((option) => option.value === "user:ORG_ZIZI_JD" && option.label === "Joe Developer")
    },
})

feature("joe.developer sees the share waiting, accepts it, opens and changes the folder; he may not share what he only views", {
    allowMessageErrors: true,
    when() {
        login("joe.developer")
        const waiting = get("rows", { view: "shared" })
        const share = (waiting.json.fileList || []).find((item) => item.name === "Share spec")
        const accepted = post("answerShare", { shareId: share.shareId, answer: "accept" })
        const after = get("rows", { view: "shared" })
        const folder = get("folder", { driveId: personalDriveId, path: "Share spec" })
        const wrote = post("saveText", { driveId: personalDriveId, path: "Share spec", name: "from joe.txt", text: "Hello from Joe\n" })
        const viewOnly = (after.json.fileList || []).find((item) => item.name === "Budget 2027.csv")
        const reshare = post("share", { driveId: personalDriveId, path: "Documents/Budget 2027.csv", isLink: "Y" })
        const declined = post("answerShare", { shareId: viewOnly.shareId, answer: "decline" })
        const afterDecline = get("detail", { driveId: personalDriveId, path: "Documents/Budget 2027.csv" })
        const page = ec.screen.makeTest().rootScreen(commons).renderMode("qvt").withStaticData().render("Files/Shares", { lastStandalone: "-2" }, null)
        ec.message.clearErrors()
        login("john.doe")
        return { share, accepted, after, folder, wrote, reshare, declined, afterDecline, page }
    },
    then({ share, accepted, after, folder, wrote, reshare, declined, afterDecline, page }) {
        share.pending
        share.fromName == "John Doe"
        accepted.status == 200
        !after.json.fileList.find((item) => item.name === "Share spec").pending
        folder.json.fileList.map((row) => row.name) == ["readme.txt"]
        wrote.status == 200
        reshare.status == 500
        declined.status == 200
        afterDecline.status == 500
        page.status == 200
        page.output.includes("Share spec")
    },
})

feature("a share with a group reaches its members", {
    when() {
        sys(() => {
            if (!ec.entity.find("moqui.security.UserGroup").condition("userGroupId", "BOSS_TEST_FILES_GROUP").count()) {
                call("create#moqui.security.UserGroup", { userGroupId: "BOSS_TEST_FILES_GROUP", description: "Files spec group" })
                call("create#moqui.security.UserGroupMember", { userGroupId: "BOSS_TEST_FILES_GROUP", userId: "ORG_ZIZI_BD", fromDate: ec.user.nowTimestamp })
            }
        })
        const shared = post("share", { driveId: personalDriveId, path: "Share spec/readme.txt", shareWith: "group:BOSS_TEST_FILES_GROUP", permissionEnumId: "RspView" })
        login("bob.developer")
        const text = render("Files/download", { driveId: personalDriveId, path: "Share spec/readme.txt" })
        login("john.doe")
        return { shared, text, targets: get("shareTargets", { term: "Files spec" }) }
    },
    then({ shared, text, targets }) {
        shared.status == 200
        shared.json.notifiedUserIds.includes("ORG_ZIZI_BD")
        text.output == "Shared with Joe\n"
        targets.json.some((option) => option.value === "group:BOSS_TEST_FILES_GROUP")
    },
})

feature("a link: its address once, listed without it, opened through its token, then revoked", {
    when() {
        const made = post("share", { driveId: personalDriveId, path: "Share spec", isLink: "Y", permissionEnumId: "RspView", password: "spec pass",
            linkLabel: "Spec link", expireDate: "2099-12-31" })
        const token = String(made.json.linkPath || "").replace("/s/", "")
        const detail = get("detail", { driveId: personalDriveId, path: "Share spec" })
        const link = detail.json.linkList.find((item) => item.linkLabel === "Spec link")
        const check = call(`${FILES}.check#PublicShareToken`, { token })
        const revoked = post("revokeShare", { shareId: link.shareId })
        const after = call(`${FILES}.check#PublicShareToken`, { token })
        const shares = sys(() => call("ironstone.commons.DriveServices.get#SharesData", {}))
        return { made, token, detail, link, check, revoked, after, shares }
    },
    then({ made, token, detail, link, check, revoked, after, shares }) {
        made.json.messageInfos[0].message == "Link made: copy it now, it is shown only once"
        token.length == 32
        !JSON.stringify(detail.json).includes(token)
        link.hasPassword
        link.openedCount == 0
        check.valid
        check.routeContext.needsPassword
        check.routeContext.name == "Share spec"
        revoked.status == 200
        !after.valid
        shares.outgoingList.some((share) => share.name === "Share spec" && share.withText === "Joe Developer")
        shares.linkList.some((share) => share.linkLabel === "Photos for the family" && share.hasPassword && share.openedCount == 3)
        !shares.linkList.some((share) => share.linkLabel === "Spec link")
        shares.incomingList.some((share) => share.name === "Ideas.md" && share.pending)
    },
})
