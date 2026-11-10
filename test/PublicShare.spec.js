// The public page of a link (screen/PublicShare.xml and PublicShare.qvue at /s/<token>, the token-route "s" of MoquiConf.xml;
// impl-drawers-commons.md R16, M8), as a visitor who is not signed in, on the demo links (data/BossFilesDemoData.xml): the
// route's token check, the page's transitions with the token the route gives them (a bad, revoked or expired token, or no
// grant for a link with a password, reads nothing), the password and its grant, a folder with its files and a zip, one file,
// and the file drop of an upload-only link with the uploader's name in the version note, a name already there kept beside it.
// The token route itself (the 404 page, the public shell) is the framework's: crates/moqui-host/tests/gate3.rs.
// Run: ./moq test mr-boss --spec PublicShare
const page = "component://mr-boss/screen/PublicShare.xml"
const FILES = "org.moqui.resource.FileServices"
const PHOTOS = "BossDemoPhotosLink2026", DROP = "BossDemoQuoteDrop2026", PLAN = "BossDemoOfficePlan2026"

// a transition of the page as the route calls it: the token is the route's
function visit(name, token, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(page).render(name, Object.assign({ token }, parameters || {}), method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = (json && !Array.isArray(json) && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {}, output: String(str.output || ""),
        disposition: String(str.header("Content-Disposition") || "") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const names = (answer) => (answer.json.fileList || []).map((row) => row.name)

spec({
    setupSpec() {
        sys(() => call("ironstone.commons.FilesDemoServices.load#FilesDemo", {}))
        logout()
    },
    cleanupSpec() { login("john.doe") },
})

feature("the route's token check: a good token tells the page what to show; a bad one nothing", {
    when() {
        return { photos: call(`${FILES}.check#PublicShareToken`, { token: PHOTOS }), plan: call(`${FILES}.check#PublicShareToken`, { token: PLAN }),
            bad: call(`${FILES}.check#PublicShareToken`, { token: "NoSuchTokenAtAll0000" }), user: ec.user.userId }
    },
    then({ photos, plan, bad, user }) {
        user == null
        photos.valid
        photos.routeContext.name == "Pictures"
        photos.routeContext.isDirectory
        photos.routeContext.needsPassword
        photos.routeContext.sharerName == "John Doe"
        photos.routeContext.expireDate > 0
        plan.valid
        !plan.routeContext.needsPassword
        !bad.valid
        bad.routeContext == null
    },
})

feature("a link with a password: nothing without the grant, a wrong password refused, the right one opens the folder", {
    allowMessageErrors: true,
    when() {
        const before = sys(() => ec.entity.find("moqui.resource.ResourceShare").condition("shareId", "BOSS_DEMO_LINK_PHOTOS").one().openedCount)
        const noGrant = visit("files", PHOTOS, {})
        const noFile = visit("download", PHOTOS, { path: "beach.png" })
        const wrong = visit("open", PHOTOS, { password: "not it" }, "post")
        const opened = visit("open", PHOTOS, { password: "family" }, "post")
        const grant = opened.json.grant
        const files = visit("files", PHOTOS, { grant })
        const picture = visit("download", PHOTOS, { grant, path: "beach.png", inline: "true" })
        const zip = visit("download", PHOTOS, { grant, path: "" })
        const outside = visit("files", PHOTOS, { grant, path: "../Documents" })
        const forged = visit("files", PHOTOS, { grant: grant + "x" })
        const after = sys(() => ec.entity.find("moqui.resource.ResourceShare").condition("shareId", "BOSS_DEMO_LINK_PHOTOS").one().openedCount)
        return { before, noGrant, noFile, wrong, opened, files, picture, zip, outside, forged, after }
    },
    then({ before, noGrant, noFile, wrong, opened, files, picture, zip, outside, forged, after }) {
        noGrant.status == 500
        noGrant.errors.includes("Enter the password of the link")
        noFile.status == 500
        !noFile.output.startsWith("\u0089PNG")
        wrong.status == 500
        wrong.errors.includes("The password is not right")
        opened.status == 200
        opened.json.passwordOk
        opened.json.grant.length > 10
        opened.json.share.sharerName == "John Doe"
        names(files) == ["beach.png", "floor-plan.png", "garden.png", "team-calendar.png"]
        files.json.fileList[0].contentType == "image/png"
        picture.status == 200
        picture.disposition.startsWith("inline")
        zip.status == 200
        zip.output.startsWith("PK")
        // download#PublicShare sends the folder under its own name
        zip.disposition.includes("Pictures.zip")
        outside.status == 500
        forged.status == 500
        after == before + 1
    },
})

feature("a link without a password to one file: open, list, download", {
    when() {
        const opened = visit("open", PLAN, {}, "post")
        return { opened, files: visit("files", PLAN, { grant: opened.json.grant }), text: visit("download", PLAN, {}),
            below: visit("files", PLAN, { path: "Checklist.txt" }) }
    },
    allowMessageErrors: true,
    then({ opened, files, text, below }) {
        opened.json.passwordOk
        names(files) == ["Plan.md"]
        text.status == 200
        text.output.includes("Movers booked: Acme Moving")
        text.disposition.includes("Plan.md")
        below.status == 500
    },
})

feature("an upload-only link: no listing, files dropped with the uploader's name, a name already there kept beside it", {
    when() {
        const listed = visit("files", DROP, {})
        const sent = visit("upload", DROP, { uploaderName: "Acme Moving", contentFile: uploadedFile("quote.txt", "Moving quote: USD 900\n") }, "post")
        const again = visit("upload", DROP, { uploaderName: "Best Movers", contentFile: uploadedFile("quote.txt", "Moving quote: USD 850\n") }, "post")
        const download = visit("download", DROP, { path: "quote.txt" })
        login("john.doe")
        const driveId = sys(() => call(`${FILES}.ensure#PersonalDrive`, {})).driveId
        const folder = sys(() => call(`${FILES}.list#Folder`, { driveId, path: "Projects/Office move/Quotes" }))
        logout()
        return { listed, sent, again, download, folder }
    },
    allowMessageErrors: true,
    then({ listed, sent, again, download, folder }) {
        listed.json.uploadOnly
        listed.json.fileList.length == 0
        sent.status == 200
        sent.json.uploadedList[0].outcome == "created"
        again.json.uploadedList[0].outcome == "renamed"
        again.json.uploadedList[0].name == "quote (2).txt"
        download.status == 500
        folder.fileList.map((row) => row.name) == ["quote (2).txt", "quote.txt"]
        folder.fileList.find((row) => row.name === "quote.txt").versionNote == "Uploaded by Acme Moving through a link"
    },
})

feature("a revoked or expired link reads nothing, and the page renders its component", {
    allowMessageErrors: true,
    when() {
        login("john.doe")
        const driveId = sys(() => call(`${FILES}.ensure#PersonalDrive`, {})).driveId
        const revokedLink = sys(() => call(`${FILES}.share#Resource`, { driveId, path: "Documents/Welcome.txt", isLink: "Y" }))
        sys(() => call(`${FILES}.revoke#Share`, { shareId: revokedLink.shareId }))
        const expiredLink = sys(() => call(`${FILES}.share#Resource`, { driveId, path: "Documents/Welcome.txt", isLink: "Y" }))
        sys(() => { const row = ec.entity.find("moqui.resource.ResourceShare").condition("shareId", expiredLink.shareId).one(); row.expireDate = new Date(Date.now() - 60000); row.update() })
        logout()
        const revokedToken = revokedLink.linkToken, expiredToken = expiredLink.linkToken
        const component = ec.screen.makeTest().rootScreen(page).renderMode("qvue").render("", { token: PLAN }, null)
        ec.message.clearErrors()
        return { revokedCheck: call(`${FILES}.check#PublicShareToken`, { token: revokedToken }), revokedFiles: visit("files", revokedToken, {}),
            expiredFiles: visit("download", expiredToken, {}), component }
    },
    then({ revokedCheck, revokedFiles, expiredFiles, component }) {
        !revokedCheck.valid
        revokedFiles.status == 500
        revokedFiles.errors.includes("This link has expired or was not found.")
        expiredFiles.status == 500
        !expiredFiles.output.includes("Welcome to My files")
        component.status == 200
        component.output.includes("module.exports")
        component.output.includes("BossPublicShare")
    },
})
