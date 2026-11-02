// RecordFiles (screen/Shared/RecordFiles.xml and RecordFiles.qvue, service/ironstone/shared/RecordFilesServices.xml, impl-drawers-commons.md
// M3): the files of a record through the panel's JSON transitions under the Commons app root, as john.doe. The demo request's
// files list with their types, sizes and who added them; an upload to the request and one to the task go through the
// dispatcher to Mantle's create#RequestContent and create#WorkEffortContent (each saving its file), several files at once,
// each standing alone; download answers the file, inline only for a picture or a PDF; remove takes the row and the file away.
// A record type without a content entity is refused with a clear error, and a record the user may not see shows nothing and
// takes no file (IronStone R5). With Files and drives (M8) the record's folder is in the records drive: each file's path there,
// the folder's other files, a file's versions, a new version with its note, a restore, a past version's download, files added
// from Files as copies; none of it for a record the user may not see, nor for a path outside the record's folder.
// Run: ./moq test mr-boss --spec RecordFiles
const commons = "component://mr-boss/screen/Commons.xml"
const request = { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" }
const task = { recordEntity: "mantle.work.effort.WorkEffort", recordId: "BOSS_DEMO_TASK" }
let uploadedKey

function call_(name, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(`RecordFiles/${name}`, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, text: String(str.output || "").substring(0, 300),
        output: String(str.output || "") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const list = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const message = (answer) => ((answer.json.messageInfos || [])[0] || {}).message || ""
const fileNamed = (answer, name) => (answer.json.fileList || []).find((file) => file.fileName === name)

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.DemoServices.load#ChatterDemo", {}))
        sys(() => call("ironstone.commons.FilesDemoServices.load#FilesDemo", {}))
    },
})

feature("the demo request's files list with their type, size and who added them, and the upload's type options", {
    when() { return call_("filesData", request) },
    then({ status, errors, json }) {
        status == 200
        errors == ""
        json.visible
        json.hasContent
        json.canUpload
        json.record.title == "Set up the shared team calendar"
        json.typeOptions.some((option) => option.value === "RqCntInternal" && option.label === "Internal")
        json.defaultTypeId == "RqCntInternal"
        fileNamed({ json }, "calendar-options.txt").typeLabel == "Internal"
        fileNamed({ json }, "calendar-options.txt").byName == "John Doe"
        fileNamed({ json }, "calendar-options.txt").description == "The three calendar options compared"
        fileNamed({ json }, "calendar-options.txt").size > 0
        fileNamed({ json }, "calendar-options.txt").canRemove
        fileNamed({ json }, "team-calendar.png").isImage
        // newest first
        json.fileList[0].fileName == "team-calendar.png"
    },
})

feature("an upload to the request goes through create#RequestContent, two files at once", {
    when() {
        const before = list("mantle.request.RequestContent", { requestId: "BOSS_DEMO_REQUEST" }).length
        const uploaded = call_("upload", Object.assign({ contentTypeEnumId: "RqCntInternal", description: "Room rules",
            contentFile: [uploadedFile("room-rules.txt", "Book a room for an hour at most."), uploadedFile("room-list.txt", "Room A\nRoom B")] }, request), "post")
        const rows = list("mantle.request.RequestContent", { requestId: "BOSS_DEMO_REQUEST" })
        const row = rows.find((item) => String(item.contentLocation || "").endsWith("/room-rules.txt"))
        const data = call_("filesData", request)
        uploadedKey = (fileNamed(data, "room-rules.txt") || {}).contentKey
        return { uploaded, before, after: rows.length, row, data, text: row ? sys(() => ec.resource.getLocationReference(row.contentLocation).getText()) : null }
    },
    then({ uploaded, before, after, row, data, text }) {
        uploaded.status == 200
        uploaded.errors == ""
        message(uploaded) == "Added 2 files to Request Set up the shared team calendar"
        after == before + 2
        row.contentTypeEnumId == "RqCntInternal"
        row.description == "Room rules"
        row.userId == "EX_JOHN_DOE"
        row.contentLocation.startsWith("dbresource://mantle/content/request/BOSS_DEMO_REQUEST/content_")
        text == "Book a room for an hour at most."
        fileNamed(data, "room-rules.txt").typeLabel == "Internal"
        uploadedKey != null
    },
})

feature("an upload to the task goes through create#WorkEffortContent", {
    when() {
        const uploaded = call_("upload", Object.assign({ contentTypeEnumId: "WectSupportingMedia",
            contentFile: uploadedFile("answers.txt", "Answers to send") }, task), "post")
        const row = list("mantle.work.effort.WorkEffortContent", { workEffortId: "BOSS_DEMO_TASK" })
            .find((item) => String(item.contentLocation || "").endsWith("/answers.txt"))
        return { uploaded, row, data: call_("filesData", task) }
    },
    then({ uploaded, row, data }) {
        uploaded.status == 200
        uploaded.errors == ""
        message(uploaded) == "Added answers.txt to Task Review the open support requests"
        row.contentTypeEnumId == "WectSupportingMedia"
        row.contentLocation.startsWith("dbresource://mantle/content/work/BOSS_DEMO_TASK/")
        fileNamed(data, "answers.txt").typeLabel == "Supporting Media"
        fileNamed(data, "open-requests.csv") != null
    },
})

feature("download answers the file; inline only for a picture or a PDF", {
    when() {
        const data = call_("filesData", request)
        const textKey = fileNamed(data, "calendar-options.txt").contentKey
        const pictureKey = fileNamed(data, "team-calendar.png").contentKey
        const text = ec.screen.makeTest().rootScreen(commons).render("RecordFiles/download", Object.assign({ contentKey: textKey, inline: "true" }, request), null)
        const picture = ec.screen.makeTest().rootScreen(commons).render("RecordFiles/download", Object.assign({ contentKey: pictureKey, inline: "true" }, request), null)
        const foreign = call_("download", Object.assign({ contentKey: JSON.stringify({ requestContentId: "BOSS_DEMO_WC_LIST" }) }, request))
        ec.message.clearErrors()
        return { text, picture, foreign }
    },
    allowMessageErrors: true,
    then({ text, picture, foreign }) {
        text.status == 200
        String(text.output).includes("Shared calendar in Commons")
        picture.status == 200
        foreign.status == 500
        foreign.json.errors.includes("Not a file of this record")
    },
})

feature("remove takes the file's row and the file away", {
    when() {
        const row = list("mantle.request.RequestContent", { requestId: "BOSS_DEMO_REQUEST" }).find((item) => String(item.contentLocation || "").endsWith("/room-rules.txt"))
        const removed = call_("remove", Object.assign({ contentKey: uploadedKey }, request), "post")
        return { removed, rows: list("mantle.request.RequestContent", { requestContentId: row.requestContentId }).length,
            exists: sys(() => ec.resource.getLocationReference(row.contentLocation).getExists()) }
    },
    then({ removed, rows, exists }) {
        removed.status == 200
        removed.errors == ""
        message(removed) == "Removed room-rules.txt"
        rows == 0
        !exists
    },
})

feature("a record type without a content entity takes no file, with a clear error", {
    allowMessageErrors: true,
    when() {
        const record = { recordEntity: "moqui.basic.Enumeration", recordId: "RqtSupport" }
        return { data: call_("filesData", record),
            refused: call_("upload", Object.assign({ contentFile: uploadedFile("x.txt", "x") }, record), "post") }
    },
    then({ data, refused }) {
        data.status == 200
        data.json.visible
        !data.json.hasContent
        refused.status == 500
        refused.json.errors.includes("has no files: its record type has no content entity")
    },
})

feature("a record the user may not see shows no files and takes none", {
    allowMessageErrors: true,
    when() {
        sys(() => {
            if (!list("mantle.party.Party", { partyId: "BOSS_TEST_FILES_PRIVATE" }).length)
                call("create#mantle.party.Party", { partyId: "BOSS_TEST_FILES_PRIVATE", partyTypeEnumId: "PtyPerson", privateOwnerUserId: "ORG_ZIZI_JD" })
        })
        const hidden = { recordEntity: "mantle.party.Party", recordId: "BOSS_TEST_FILES_PRIVATE" }
        return { data: call_("filesData", hidden),
            refused: call_("upload", Object.assign({ contentFile: uploadedFile("secret.txt", "secret") }, hidden), "post"),
            rows: list("mantle.party.PartyContent", { partyId: "BOSS_TEST_FILES_PRIVATE" }).length }
    },
    then({ data, refused, rows }) {
        data.status == 200
        data.json.visible === false
        data.json.fileList === undefined
        refused.status == 500
        rows == 0
    },
})

feature("the request's folder in the records drive: each file's place there, the folder's other files, a file's versions", {
    when() {
        const data = call_("filesData", request)
        const options = fileNamed(data, "calendar-options.txt")
        return { data, options, versions: call_("versions", Object.assign({ drivePath: options.drivePath }, request)) }
    },
    then({ data, options, versions }) {
        data.json.recordsDriveId == "BOSS_RECORDS"
        data.json.recordFolderPath == "request/BOSS_DEMO_REQUEST"
        data.json.filesUrl == "/qapps/Commons/Files?drive=BOSS_RECORDS&path=request%2FBOSS_DEMO_REQUEST"
        options.drivePath == "request/BOSS_DEMO_REQUEST/content_BOSS_DEMO_RC_OPTIONS/calendar-options.txt"
        options.location === undefined
        data.json.extraList.some((item) => item.name === "signed-quote.txt" && item.drivePath === "request/BOSS_DEMO_REQUEST/signed-quote.txt")
        !data.json.extraList.some((item) => item.name === "calendar-options.txt")
        versions.status == 200
        versions.json.versionList.length >= 2
        versions.json.versionList.some((version) => version.note === "Marked the option we chose")
        versions.json.canChange
    },
})

feature("a new version of a record's file with its note, a past one restored, a past one downloaded", {
    when() {
        const drivePath = "request/BOSS_DEMO_REQUEST/content_BOSS_DEMO_RC_OPTIONS/calendar-options.txt"
        const uploaded = call_("uploadVersion", Object.assign({ drivePath, versionNote: "Prices of 2027", contentFile: uploadedFile("whatever-name.txt", "Calendar options, 2027 prices\n") }, request), "post")
        const afterUpload = call_("versions", Object.assign({ drivePath }, request))
        const old = afterUpload.json.versionList[1]
        const oldText = ec.screen.makeTest().rootScreen(commons).render("RecordFiles/driveDownload", Object.assign({ drivePath, versionName: old.versionName }, request), null)
        const restored = call_("restoreVersion", Object.assign({ drivePath, versionName: old.versionName }, request), "post")
        const afterRestore = call_("versions", Object.assign({ drivePath }, request))
        const current = sys(() => ec.resource.getLocationReference("dbresource://mantle/content/" + drivePath).getText())
        return { uploaded, afterUpload, old, oldText, restored, afterRestore, current }
    },
    then({ uploaded, afterUpload, old, oldText, restored, afterRestore, current }) {
        uploaded.status == 200
        message(uploaded) == "A new version of calendar-options.txt"
        afterUpload.json.versionList[0].note == "Prices of 2027"
        afterUpload.json.versionList[0].userName == "John Doe"
        oldText.status == 200
        !String(oldText.output).includes("2027 prices")
        restored.status == 200
        afterRestore.json.versionList.length == afterUpload.json.versionList.length + 1
        afterRestore.json.versionList[0].note.startsWith("Restored version")
        current == String(oldText.output)
    },
})

feature("Add from Files: a copy of a drive file on the record, with its content row", {
    when() {
        const driveId = sys(() => call("org.moqui.impl.FileServices.ensure#PersonalDrive", {})).driveId
        const before = list("mantle.request.RequestContent", { requestId: "BOSS_DEMO_REQUEST" }).length
        const added = call_("addFromFiles", Object.assign({ itemsJson: JSON.stringify([{ driveId, path: "Documents/Budget 2027.csv" }]), contentTypeEnumId: "RqCntInternal" }, request), "post")
        const rows = list("mantle.request.RequestContent", { requestId: "BOSS_DEMO_REQUEST" })
        const row = rows.find((item) => String(item.contentLocation || "").endsWith("/Budget 2027.csv"))
        const picker = call_("pickerFolder", Object.assign({ driveId, path: "Documents" }, request))
        return { before, added, after: rows.length, row, picker, text: row ? sys(() => ec.resource.getLocationReference(row.contentLocation).getText()) : null }
    },
    then({ before, added, after, row, picker, text }) {
        added.status == 200
        message(added) == "Added Budget 2027.csv to Request Set up the shared team calendar"
        after == before + 1
        row.contentLocation.startsWith("dbresource://mantle/content/request/BOSS_DEMO_REQUEST/content_")
        row.userId == "EX_JOHN_DOE"
        row.contentTypeEnumId == "RqCntInternal"
        text.startsWith("month,income")
        picker.json.fileList.some((item) => item.name === "Budget 2027.csv")
    },
})

feature("the record folder's versions and files: refused outside the record's folder", {
    allowMessageErrors: true,
    when() {
        const outside = call_("versions", Object.assign({ drivePath: "request/OTHER_REQUEST/content_X/x.txt" }, request))
        const climb = call_("driveDownload", Object.assign({ drivePath: "request/BOSS_DEMO_REQUEST/../BOSS_OTHER/x.txt" }, request))
        return { outside, climb }
    },
    then({ outside, climb }) {
        outside.status == 500
        outside.errors.includes("Not a file of this record")
        climb.status == 500
    },
})
