// Admin P16's "usable when" (impl-admin P16; design-admin §15.3 "Backup scope" and "Export and recipient delivery", its Admin
// half), as an acceptance walk with artifact authorization on, through the screens' own transitions. The backup operator
// opens Admin › Data and lands on Backups: the coverage with the fixed warning of what an archive does not hold, no mirror,
// the job paused and nothing backed up yet; asks for a backup with a reason and is told it started; the run it made is the
// backup job's own, with the job's stored parameters, and its outcome is what the run records: in a spec's process, which
// runs no embedded database, the service skips, and the coverage then says skipped and never a success (on a running
// server with the embedded database the same walk reads Succeeded with its archive listed: plan §8's walk by hand); a second
// request right after is refused with its reason; the backup operator opens no import and no export. The data operator
// exports a contact book of their own as vCard from DataExport (the preview's count, then the file as the response) and
// sees it in Exports; sees a scheduled report's delivery there as status (its counters, never its title) and can open
// neither the report in Insights nor the recipient's copy; a field marked as not theirs to read is left out of the file
// and named. The rules are the framework's AdminBackups and AdminDataExport, Mantle's ContactBooks and BOSS's AdminExports.
// Run: ./moq accept mr-boss --spec AdminExportsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system} = lib
const JOB = "backup_EmbeddedDatabase_daily"
const TARGET = "contactBookVCard"
const run = String(Date.now()).slice(-7)
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const rows = (entityName, conditions) => system(() => Array.from(find(entityName, conditions).list()).map(row => row.getMap()))
const occurrenceId = "USABLE_OCC_" + run
const deliveryId = "USABLE_DLV_" + run
const reportTitle = "usable-payroll-by-employee-" + run
// a screen under a root as its user, in html (a transition's redirect or a download) or qvt (a page)
function screen(root, username, path, parameters = {}, mode = "html") {
    return asUser(username, () => {
        const renderer = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/" + root + ".xml")
            .renderMode(mode)
        if (mode === "qvt") renderer.withStaticData()
        const result = renderer.render(path, Object.assign(mode === "qvt" ? {lastStandalone: "-2"} : {}, parameters), null)
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const backupRuns = () => rows("moqui.service.job.ServiceJobRun", {jobName: JOB})
let bookId = null
let shippedColumns = null

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            find("moqui.service.job.ServiceJobRun", {jobName: JOB}).deleteAll()
            find("moqui.server.OperationResult", {operationKey: "backup-requests:" + JOB}).deleteAll()
            const make = (entityName, fields) => {
                const value = ec.entity.makeValue(entityName)
                value.setFields(fields, true, null, null)
                value.create()
            }
            const now = Number(ec.user.nowTimestamp)
            make("moqui.report.ReportOccurrence", {
                occurrenceId,
                occurrenceKey: "usable-occurrence-" + run,
                occurrenceKind: "scheduled",
                occurrenceDate: now - 600000,
                completedDate: now - 590000,
                ownerUserId: "BOSS_ADM_ADMIN",
                definitionId: reportTitle,
                renderMode: "pdf",
                deliveryMode: "group",
                statusId: "RptOccComplete",
                recipientCount: 2,
                sentCount: 2,
                skippedCount: 0,
                failedCount: 0,
                uncertainCount: 0
            })
            make("moqui.report.ReportRecipientDelivery", {
                deliveryId,
                occurrenceId,
                userId: "BOSS_ADM_ADMIN",
                statusId: "RptDlvSent",
                attemptDate: now - 590000
            })
            shippedColumns = find("moqui.server.TransferTarget", {targetId: TARGET}).one().columnsJson
        })
        // the data operator's own contact book, as Commons makes it on first use
        asUser(
            users.data,
            () => {
                ec.service
                    .sync()
                    .name("mantle.party.ContactBookServices.create#PersonalContact")
                    .parameters({
                        firstName: "Una",
                        lastName: "Usable " + run,
                        emailAddress: "una.usable." + run + "@example.com",
                        comments: "Usable private note " + run
                    })
                    .call()
                const books = ec.service.sync().name("mantle.party.ContactBookServices.get#UserContactBooks").call()
                bookId = (books.contactBookList || [])[0]?.contactBookId
            },
            false
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        system(() => {
            const target = find("moqui.server.TransferTarget", {targetId: TARGET}).one()
            if (shippedColumns && target.columnsJson !== shippedColumns) {
                target.set("columnsJson", shippedColumns)
                target.update()
            }
            find("moqui.report.ReportRecipientDelivery", {deliveryId}).deleteAll()
            find("moqui.report.ReportOccurrence", {occurrenceId}).deleteAll()
            find("moqui.service.job.ServiceJobRun", {jobName: JOB}).deleteAll()
            find("moqui.server.OperationResult", {operationKey: "backup-requests:" + JOB}).deleteAll()
        })
    }
})

feature("the backup operator reads the coverage with its warning, asks for a backup, and reads what its run recorded", {
    when() {
        const out = {}
        out.landing = screen("Admin", users.backup, "Data", {}, "qvt")
        out.imports = screen("Admin", users.backup, "Data/Imports", {}, "qvt")
        out.exports = screen("Admin", users.backup, "Data/Exports", {}, "qvt")
        out.noReason = screen("Admin", users.backup, "Data/Backups/runBackup", {})
        out.asked = screen("Admin", users.backup, "Data/Backups/runBackup", {
            reason: "Usable: before an upgrade",
            operationKey: "USABLE_BK_" + run,
            backupDir: "/tmp/usable-elsewhere"
        })
        out.runs = backupRuns()
        out.again = screen("Admin", users.backup, "Data/Backups/runBackup", {reason: "Usable: again"})
        out.runsAfter = backupRuns()
        out.audit = rows("moqui.entity.EntityAuditLog", {changedFieldName: "backupRequest", pkPrimaryValue: JOB}).filter(
            row => row.changeReason === "Usable: before an upgrade"
        )
        // the run ends on the job runner's own thread: read the coverage as it is then
        out.coverage = asUser(
            users.backup,
            () => ec.service.sync().name("org.moqui.admin.BackupServices.get#Coverage").call(),
            false
        )
        out.after = screen("Admin", users.backup, "Data/Backups", {}, "qvt")
        // the data operator opens the area and reads no backup
        out.operator = screen("Admin", users.data, "Data/Backups", {}, "qvt")
        return out
    },
    then(out) {
        assert(opened(out.landing), out.landing.errors.join("; "))
        // the area starts at Backups for the backup operator, with the fixed warning, no mirror and nothing backed up yet
        assert(
            out.landing.output.includes("The .env file and the field-encryption key are not in it"),
            "the warning is not shown"
        )
        assert(out.landing.output.includes("No backup has run yet") && out.landing.output.includes("No off-site mirror"))
        assert(
            out.landing.output.includes("Paused: no backup is made on a schedule") && out.landing.output.includes("Back up now")
        )
        assert(!opened(out.imports) && !opened(out.exports), "the backup operator opened the imports or the exports")
        // a reason is asked; then one run of the job, with the job's own parameters
        assert(out.runs.length === 1, "runs after the request: " + out.runs.length)
        const parameters = JSON.parse(out.runs[0].parameters)
        assert(!("backupDir" in parameters) && parameters.systemMessageRemoteId === "EmbeddedDbBackup", out.runs[0].parameters)
        assert(out.audit.length === 1 && out.audit[0].changedByUserId === "BOSS_ADM_BACKUP")
        // not again right after, with the reason
        assert(out.runsAfter.length === 1, "a second backup was started")
        // what the run recorded, never more: in this process the service skips, and that is not a success
        assert(["skipped", "running"].includes(out.coverage.coverage.state), out.coverage.coverage.state)
        assert(out.coverage.coverage.lastSuccessText === "" && out.coverage.canRun === false && out.coverage.holdReason)
        assert(
            opened(out.after) &&
                !out.after.output.includes("Succeeded") &&
                out.after.output.includes("A backup cannot be asked for now")
        )
        assert(out.after.output.includes("The .env file and the field-encryption key are not in it"))
        assert(opened(out.operator) && out.operator.output.includes("Backups are not available to you"))
    }
})

feature("the data operator exports a contact book as vCard and sees it in Exports; a field not theirs to read is left out", {
    when() {
        const out = {}
        const request = {targetId: TARGET, scopeKey: bookId}
        out.choose = screen("Admin", users.data, "Data/DataExport", {targetId: TARGET}, "qvt")
        out.review = screen(
            "Admin",
            users.data,
            "Data/DataExport",
            Object.assign({review: "true", fields: "name,emails,notes"}, request),
            "qvt"
        )
        out.file = screen(
            "Admin",
            users.data,
            "Data/DataExport/download",
            Object.assign({fields: "name,emails,notes", operationKey: "USABLE_X_" + run}, request)
        )
        // the owner's registration says who reads a contact's notes: the data operator does not
        system(() => {
            const target = find("moqui.server.TransferTarget", {targetId: TARGET}).one()
            target.set(
                "columnsJson",
                JSON.stringify(
                    JSON.parse(shippedColumns).map(column =>
                        column.name === "notes" ? Object.assign({}, column, {permission: "ADMIN_AUDIT_VIEW"}) : column
                    )
                )
            )
            target.update()
        })
        out.restrictedReview = screen("Admin", users.data, "Data/DataExport", Object.assign({review: "true"}, request), "qvt")
        out.restrictedFile = screen(
            "Admin",
            users.data,
            "Data/DataExport/download",
            Object.assign({fields: "name,emails,notes"}, request)
        )
        system(() => {
            const target = find("moqui.server.TransferTarget", {targetId: TARGET}).one()
            target.set("columnsJson", shippedColumns)
            target.update()
        })
        // an address, an entity and an unregistered field are not something a request can name
        out.elsewhere = screen(
            "Admin",
            users.data,
            "Data/DataExport/download",
            Object.assign({fields: "name,userId", toAddress: "elsewhere@example.com"}, request)
        )
        out.exports = screen("Admin", users.data, "Data/Exports", {}, "qvt")
        out.records = rows("moqui.server.TransferBatch", {targetId: TARGET, userId: "BOSS_ADM_DATA"})
        // the identity operator, outside the Data area, posts nothing to it
        out.outside = screen("Admin", users.identity, "Data/DataExport/download", request)
        return out
    },
    then(out) {
        assert(bookId, "the data operator has no contact book")
        assert(opened(out.choose) && out.choose.output.includes("Contact book"), out.choose.errors.join("; "))
        assert(
            opened(out.review) &&
                out.review.output.includes("3. Review and export") &&
                out.review.output.includes("1 row (at most 5000 in one export)")
        )
        // the file is the response
        assert(out.file.status === 200 && out.file.output.startsWith("BEGIN:VCARD"), out.file.errors.join("; "))
        assert(out.file.output.includes("FN:Una Usable " + run) && out.file.output.includes("NOTE:Usable private note " + run))
        // the restricted field is named as left out and is not in the file, whatever was asked
        assert(
            opened(out.restrictedReview) &&
                out.restrictedReview.output.includes("Not included, because you may not read them: Notes")
        )
        assert(
            out.restrictedFile.output.startsWith("BEGIN:VCARD") && !out.restrictedFile.output.includes("NOTE:"),
            "a field not theirs was exported"
        )
        assert(!out.elsewhere.output.includes("BEGIN:VCARD"), "an unregistered field was accepted")
        // Exports lists the two exports made, with their rows, and nothing to open
        assert(
            out.records.length === 2 && out.records.every(record => record.state === "exported" && Number(record.rowCount) === 1)
        )
        assert(!JSON.stringify(out.records).includes("Usable private note"), "a record holds content")
        assert(
            opened(out.exports) && out.exports.output.includes("Contact book (vCard)") && out.exports.output.includes("Not kept")
        )
        assert(!out.outside.output.includes("BEGIN:VCARD") && !opened(out.outside), "a user outside the Data area exported")
    }
})

feature("the data operator sees a scheduled report's delivery as status and opens neither the report nor a recipient's copy", {
    when() {
        const out = {}
        out.exports = screen("Admin", users.data, "Data/Exports", {kind: "reportDelivery"}, "qvt")
        out.delivery = screen("Insights", users.data, "ScheduledReports/ReportDelivery", {occurrenceId}, "qvt")
        out.copy = asUser(
            users.data,
            () => {
                try {
                    return (
                        ec.service
                            .sync()
                            .name("org.moqui.report.ReportServices.get#RecipientReport")
                            .parameters({deliveryId})
                            .call() || {}
                    )
                } catch (error) {
                    return {error: String(error.message || error)}
                } finally {
                    ec.message.clearErrors()
                }
            },
            false
        )
        return out
    },
    then(out) {
        assert(opened(out.exports), out.exports.errors.join("; "))
        // its id, state and counters; never its title
        assert(out.exports.output.includes(occurrenceId) && out.exports.output.includes("Delivered"))
        assert(
            out.exports.output.includes("2 recipients · 2 sent") && !out.exports.output.includes(reportTitle),
            "the report was named"
        )
        assert(out.exports.output.includes("Not readable here"))
        assert(
            !opened(out.delivery) || !out.delivery.output.includes(reportTitle),
            "the data operator opened the delivery in Insights"
        )
        assert(!out.copy.contentBase64 && out.copy.available !== true, "the data operator read a recipient's copy")
    }
})
