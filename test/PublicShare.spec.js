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

// SEC-BOS-83: a folder's zip is made once for the link while its files are unchanged (the same file, not made again), a
// changed folder's zip replaces it, a zip made counts against the link and a download against the requester, and a folder
// past the size setting is refused. A link of its own (no password) and requesters of its own, so the counts start at
// nothing on every run; a file put in the shared folder for the change is removed after.
feature("a folder link's zip is kept and sent again, replaced when the folder changes, and the counts and size refuse", {
    allowMessageErrors: true,
    when() {
        const run = ec.user.randomString(12)
        const token = "BossSpecZipLink" + run
        const shareId = "BOSS_SPEC_ZIP_" + run
        let folder = null
        sys(() => {
            const photos = ec.entity.find("moqui.resource.ResourceShare").condition("shareId", "BOSS_DEMO_LINK_PHOTOS").one()
            const drive = ec.entity.find("moqui.resource.ResourceDrive").condition("driveId", photos.driveId).one()
            folder = String(drive.rootLocation).replace(/\/+$/, "") + "/" + photos.path
            const row = ec.entity.makeValue("moqui.resource.ResourceShare")
            row.setFields({ shareId, driveId: photos.driveId, path: photos.path, isDirectory: "Y", isLink: "Y", permissionEnumId: "RspView",
                linkTokenHash: ec.user.singleUseCodeHash(token), linkLabel: "Spec zip", createdByUserId: photos.createdByUserId,
                createdDate: ec.user.nowTimestamp }, true, null, null)
            row.create()
        })
        const download = () => {
            try {
                return { location: call(`${FILES}.download#PublicShare`, { token, path: "" })?.location || null, errors: "" }
            } catch (err) {
                return { location: null, errors: String(err.message || err) }
            } finally {
                ec.message.clearErrors()
            }
        }
        const modified = (location) => sys(() => location ? ec.resource.getLocationReference(location).getLastModified() : null)
        const exists = (location) => sys(() => !!location && ec.resource.getLocationReference(location).getExists())
        const added = []
        const addFile = (name) => sys(() => { ec.resource.getLocationReference(`${folder}/${name}`).putText("spec " + name); added.push(name) })
        try {
            ec.user.context.passRequester = "spec-zip-a-" + run
            const first = download()
            const firstModified = modified(first.location)
            const head = first.location ? sys(() => String(ec.resource.getLocationText(first.location, "ISO-8859-1")).substring(0, 2)) : ""
            const second = download()
            const secondModified = modified(second.location)
            // a kept zip sent again counts only against the requester: 30 in ten minutes
            let refused = null
            let allowed = 2
            for (let i = 0; i < 35 && !refused; i++) {
                const next = download()
                if (next.errors) refused = next
                else allowed++
            }
            // another requester: a changed folder's zip replaces the link's earlier one; the second build past the setting is refused
            ec.user.context.passRequester = "spec-zip-b-" + run
            addFile(`spec-zip-${run}-1.txt`)
            const changed = download()
            const firstGone = !exists(first.location)
            addFile(`spec-zip-${run}-2.txt`)
            const pastBuilds = withConf("resource-facade/drive-share@folder-zip-builds-per-link", "2", () => download())
            const tooLarge = withConf("resource-facade/drive-share@folder-zip-max-bytes", "10", () => download())
            // a third requester: the build claim. A build leaves no claim; a live claim answers "being prepared"; a stale one
            // (a build that died) does not hold the zip back
            ec.user.context.passRequester = "spec-zip-c-" + run
            const claims = (prefix) => sys(() => ec.entity.find("moqui.security.public.AccountAttempt")
                .condition("bucketId", "like", prefix + "%").count())
            const built = download()
            const claimId = built.location ? "share-zip-claim:" + built.location.replace(/^.*\//, "").replace(/\.zip$/, "") : "none"
            const claimsAfterBuild = claims(claimId)
            const setClaim = (expiresAt) => sys(() => {
                ec.entity.find("moqui.security.public.AccountAttempt").condition("bucketId", claimId).deleteAll()
                const row = ec.entity.makeValue("moqui.security.public.AccountAttempt")
                row.setFields({ bucketId: claimId, attemptCount: 1, expiresAt: new Date(expiresAt) }, true, null, null)
                row.create()
                if (built.location) ec.resource.getLocationReference(built.location).delete()
            })
            setClaim(Date.now() + 60000)
            const whileClaimed = download()
            setClaim(Date.now() - 1000)
            const afterStale = download()
            const claimsAfterStale = claims(claimId)
            return { first, firstModified, head, second, secondModified, allowed, refused, changed, firstGone, pastBuilds, tooLarge, built,
                claimsAfterBuild, whileClaimed, afterStale, claimsAfterStale }
        } finally {
            ec.user.context.passRequester = null
            sys(() => {
                for (const name of added) ec.resource.getLocationReference(`${folder}/${name}`).delete()
                ec.entity.find("moqui.resource.ResourceShare").condition("shareId", shareId).deleteAll()
            })
        }
    },
    then(r) {
        r.first.errors == ""
        r.first.location.startsWith("runtime://tmp/drive-zip/share-")
        r.head == "PK"
        // the same file, not made again
        r.second.location == r.first.location
        r.secondModified == r.firstModified
        r.allowed == 30
        r.refused.errors.includes("Too many downloads of this folder")
        r.changed.errors == "" && r.changed.location != r.first.location
        r.firstGone
        r.pastBuilds.errors.includes("Too many downloads of this folder")
        r.tooLarge.errors.includes("too large to download as one zip")
        r.built.errors == "" && r.claimsAfterBuild == 0
        r.whileClaimed.errors.includes("being prepared")
        r.afterStale.errors == "" && r.afterStale.location == r.built.location
        r.claimsAfterStale == 0
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
