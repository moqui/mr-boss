// Exports and backups in Admin (impl-admin P16; design-admin §11 Exports, DataExport and Backups, §15.3 "Export and recipient
// delivery" and "Backup scope"): a contact book's vCard through Admin's DataExport is its owner's export for who may view the
// book, with the fields asked for, a field the caller may not read left out and named, the file to the caller's own response
// and one record of it (never its content); the data operator, who may view no such book, exports and reads nothing of it,
// and a user outside the Data area posts nothing to it; Exports lists an export and a scheduled report's delivery as status
// (its id, state and counters), never its title, and the report itself stays its recipient's; Backups shows the coverage
// with the fixed warning to the backup operator, who opens nothing else of the area, and the data operator is told it is
// not available. One qvt render each of Exports, DataExport and Backups. The framework's rules are the framework's
// AdminDataExport and AdminBackups specs, the contact book's own Mantle's ContactBooks.
// Run: ./moq test mr-boss --spec AdminExports
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const D = "ironstone.admin.DataServices."
const BATCH = "moqui.server.TransferBatch"
const TARGET = "contactBookVCard"
const has = (value, pattern) => pattern.test(String(value ?? ""))
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const rows = (entityName, conditions) => system(() => Array.from(find(entityName, conditions).list()).map(row => row.getMap()))
function invoke(name, parameters = {}) {
    try {
        const result = ec.service.sync().name(name).parameters(parameters).call() || {}
        const error = ec.message.hasError() ? ec.message.getErrorsString() : ""
        ec.message.clearErrors()
        return Object.assign({}, result, {error})
    } catch (e) {
        ec.message.clearErrors()
        return {error: String(e.message || e)}
    }
}
// a screen's service as the screen reaches it: the area's grant covers the services below it, each of which checks the
// user's own permission and scope (called here with authorization off for the same reach)
const serviceAs = (username, name, parameters = {}) => asUser(username, () => invoke(name, parameters), false)
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
// a data operator with a contact book of their own, and the schedule owner whose report's delivery Admin sees as status
const exporter = {userId: "SPEC_ADM_EXPORTER", username: "spec.adm.exporter"}
const occurrenceId = "SPEC_ADM_OCC1"
const deliveryId = "SPEC_ADM_DLV1"
const secretTitle = "spec-payroll-by-employee"
let bookId = null
let shippedColumns = null

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const value = ec.entity.makeValue(entityName)
                value.setFields(fields, true, null, null)
                value.create()
            }
            make("mantle.party.Party", {partyId: exporter.userId, partyTypeEnumId: "PtyPerson"})
            make("mantle.party.Person", {partyId: exporter.userId, firstName: "Spec", lastName: "Exporter"})
            make("mantle.party.PartyRelationship", {
                partyRelationshipId: exporter.userId + "_ORG",
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: exporter.userId,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            const demo = find("moqui.security.UserAccount", {userId: "BOSS_ADM_DATA"}).one()
            make("moqui.security.UserAccount", {
                userId: exporter.userId,
                username: exporter.username,
                userFullName: "Spec Exporter",
                partyId: exporter.userId,
                currentPassword: demo.currentPassword,
                passwordHashType: demo.passwordHashType,
                passwordSalt: demo.passwordSalt,
                passwordBase64: demo.passwordBase64,
                passwordSetDate: demo.passwordSetDate
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_ADMIN", "BOSS_ADMIN_DATA"])
                make("moqui.security.UserGroupMember", {userGroupId, userId: exporter.userId, fromDate: 0})
            // a scheduled report's occurrence of another owner, with a delivery to its own recipient
            const now = Number(ec.user.nowTimestamp)
            make("moqui.report.ReportOccurrence", {
                occurrenceId,
                occurrenceKey: "spec-adm-occurrence-1",
                occurrenceKind: "scheduled",
                occurrenceDate: now - 3600000,
                completedDate: now - 3590000,
                ownerUserId: "BOSS_ADM_ADMIN",
                definitionId: secretTitle,
                renderMode: "pdf",
                deliveryMode: "group",
                statusId: "RptOccComplete",
                recipientCount: 3,
                sentCount: 2,
                skippedCount: 0,
                failedCount: 1,
                uncertainCount: 0
            })
            make("moqui.report.ReportRecipientDelivery", {
                deliveryId,
                occurrenceId,
                userId: "BOSS_ADM_ADMIN",
                statusId: "RptDlvSent",
                attemptDate: now - 3590000
            })
            shippedColumns = find("moqui.server.TransferTarget", {targetId: TARGET}).one().columnsJson
        })
        // the exporter's own personal book with one contact
        asUser(
            exporter.username,
            () => {
                invoke("mantle.party.ContactBookServices.create#PersonalContact", {
                    firstName: "Vera",
                    lastName: "Cardholder",
                    emailAddress: "vera.cardholder@example.com",
                    comments: "Spec export private note"
                })
                bookId = (invoke("mantle.party.ContactBookServices.get#UserContactBooks").contactBookList || [])[0]?.contactBookId
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
        })
    }
})

feature(
    "a contact book's vCard through Admin: its viewer's export, a field they may not read left out, to them alone, recorded once",
    {
        when() {
            const out = {bookId}
            const request = {targetId: TARGET, scopeKey: bookId}
            out.context = serviceAs(exporter.username, D + "get#ExportContext", Object.assign({review: true}, request))
            // through the mount's own transition: the file is the response
            out.defaults = post(
                exporter.username,
                "Data/DataExport/download",
                Object.assign({operationKey: "SPEC_ADM_X1"}, request)
            )
            out.withNotes = serviceAs(
                exporter.username,
                D + "run#AdminExport",
                Object.assign({fields: "name,emails,notes"}, request)
            )
            // the owner's registration now says who reads a contact's notes: this exporter does not
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
            out.restricted = serviceAs(
                exporter.username,
                D + "run#AdminExport",
                Object.assign({fields: "name,emails,notes"}, request)
            )
            out.restrictedContext = serviceAs(exporter.username, D + "get#ExportContext", request)
            system(() => {
                const target = find("moqui.server.TransferTarget", {targetId: TARGET}).one()
                target.set("columnsJson", shippedColumns)
                target.update()
            })
            // what a request may not name: another field, an entity, an address
            out.unregistered = serviceAs(
                exporter.username,
                D + "run#AdminExport",
                Object.assign({fields: "name,userId"}, request)
            )
            // the data operator holds the transfer permissions and may view no such book
            out.operator = {
                context: serviceAs(users.data, D + "get#ExportContext", request),
                run: serviceAs(users.data, D + "run#AdminExport", request),
                posted: post(users.data, "Data/DataExport/download", request)
            }
            // outside the Data area nothing is posted to the wizard
            out.outside = post(users.identity, "Data/DataExport/download", request)
            out.records = rows(BATCH, {targetId: TARGET})
            return out
        },
        then(out) {
            assert(out.bookId, "the exporter has no contact book")
            // the wizard offers the book, the registered fields and the count; birthdays and notes only when asked for
            const context = out.context
            assert(context.hasTarget && context.scopeOptions.some(option => option.value === out.bookId), context.error)
            assert(
                context.fieldOptions.map(option => option.value).join() ===
                    "name,organization,emails,phones,addresses,websites,groups,birthday,notes"
            )
            assert(
                context.selectedFields.join() === "name,organization,emails,phones,addresses,websites,groups" &&
                    context.deniedFieldText === ""
            )
            assert(context.preview.rowCount === 1 && context.operationKey, context.previewRefusal)
            // the file is the response of the request that asked
            assert(
                out.defaults.status === 200 && out.defaults.output.startsWith("BEGIN:VCARD"),
                out.defaults.errors.join("; ") + out.defaults.output.slice(0, 200)
            )
            assert(
                out.defaults.output.includes("FN:Vera Cardholder") && out.defaults.output.includes("vera.cardholder@example.com")
            )
            assert(!out.defaults.output.includes("NOTE:"), "notes were exported without being asked for")
            assert(
                out.withNotes.exported === true &&
                    out.withNotes.fileText.includes("NOTE:Spec export private note") &&
                    out.withNotes.contentType === "text/vcard"
            )
            assert(has(out.withNotes.filename, /-\d{8}-\d{4}\.vcf$/), out.withNotes.filename)
            // a field the caller may not read is left out whatever is asked, and named
            assert(
                out.restricted.exported === true && !out.restricted.fileText.includes("NOTE:"),
                "a field the caller may not read was exported"
            )
            assert(
                out.restricted.fileText.includes("FN:Vera Cardholder") &&
                    out.restricted.omittedFieldList.map(field => field.name).join() === "notes"
            )
            assert(
                out.restrictedContext.deniedFieldText === "Notes" &&
                    !out.restrictedContext.fieldOptions.some(option => option.value === "notes")
            )
            assert(has(out.unregistered.error, /has no field/) && !out.unregistered.fileText, out.unregistered.error)
            // another's book is not the data operator's to export or to see
            assert(
                !out.operator.context.scopeOptions.some(option => option.value === out.bookId),
                "the book was offered to the data operator"
            )
            assert(has(out.operator.run.error, /not available/) && !out.operator.run.fileText, out.operator.run.error)
            assert(!out.operator.posted.output.includes("BEGIN:VCARD") && !out.outside.output.includes("BEGIN:VCARD"))
            assert(
                out.outside.status !== 200 || out.outside.errors.length > 0,
                "a user outside the Data area posted to the wizard"
            )
            // one record of each export made, the exporter's own, with no content
            assert(
                out.records.length === 3 &&
                    out.records.every(record => record.userId === exporter.userId && record.state === "exported"),
                out.records.length
            )
            assert(out.records.some(record => record.transferId === "SPEC_ADM_X1" && Number(record.rowCount) === 1))
            assert(
                !JSON.stringify(out.records).includes("Cardholder") && !JSON.stringify(out.records).includes("private note"),
                "a record holds content"
            )
        }
    }
)

feature(
    "Exports lists an export and a scheduled report's delivery as status; the report stays its recipient's; the screens render",
    {
        when() {
            const out = {}
            out.list = serviceAs(exporter.username, D + "find#ExportRuns")
            out.operatorList = serviceAs(users.data, D + "find#ExportRuns")
            out.backupList = serviceAs(users.backup, D + "find#ExportRuns")
            // the report behind a delivery: its recipient's alone
            out.report = serviceAs(users.data, "org.moqui.report.ReportServices.get#RecipientReport", {deliveryId})
            out.exports = asUser(exporter.username, () => page("Data/Exports"))
            out.wizard = asUser(exporter.username, () =>
                page("Data/DataExport", {targetId: TARGET, scopeKey: bookId, review: "true"})
            )
            return out
        },
        then(out) {
            const delivery = out.list.transferList.find(row => row.runId === occurrenceId)
            assert(delivery, out.list.error || "the occurrence is not listed")
            // by its counters: a failed delivery is never read as delivered
            assert(
                delivery.kind === "reportDelivery" &&
                    delivery.state === "partial" &&
                    delivery.countText === "3 recipients · 2 sent · 1 failed",
                delivery.countText
            )
            assert(delivery.userName === "Admin Administrator" && delivery.download === false && delivery.detail === false)
            assert(!JSON.stringify(out.list).includes(secretTitle), "a report's definition was named")
            assert(
                out.list.transferList.filter(row => row.kind === "export").length === 3,
                "the exporter's exports are not listed"
            )
            // the data operator reads the delivery's status and none of another's exports of a book they may not view
            assert(
                out.operatorList.transferList.some(row => row.runId === occurrenceId) &&
                    !out.operatorList.transferList.some(row => row.kind === "export")
            )
            assert(
                out.operatorList.targetList.some(
                    target =>
                        target.targetId === "insightsDatasetRows" && target.ownerUrl === "/qapps/Insights/ReportBuilder/Datasets"
                )
            )
            assert(has(out.backupList.error, /ADMIN_TRANSFER_VIEW is required/), out.backupList.error)
            assert(
                !out.report.contentBase64 && out.report.available !== true,
                "the data operator read another recipient's report"
            )
            // Exports and DataExport, one render each
            assert(out.exports.status === 200 && out.exports.errors.length === 0, out.exports.errors.join("; "))
            assert(
                out.exports.output.includes(occurrenceId) &&
                    out.exports.output.includes("Scheduled report") &&
                    out.exports.output.includes("Contact book (vCard)")
            )
            assert(!out.exports.output.includes(secretTitle) && out.exports.output.includes("Dataset rows"))
            assert(out.wizard.status === 200 && out.wizard.errors.length === 0, out.wizard.errors.join("; "))
            assert(
                out.wizard.output.includes("3. Review and export") &&
                    out.wizard.output.includes("1 row (at most 5000 in one export)")
            )
        }
    }
)

feature("Backups shows the coverage and its fixed warning to the backup operator alone; nothing of it is a download", {
    when() {
        const out = {}
        out.backups = asUser(users.backup, () => page("Data/Backups"))
        out.operator = serviceAs(users.data, "org.moqui.admin.BackupServices.get#Coverage")
        out.backupImports = asUser(users.backup, () => page("Data/Imports", {}, "html"))
        return out
    },
    then(out) {
        assert(out.backups.status === 200 && out.backups.errors.length === 0, out.backups.errors.join("; "))
        // a fresh instance: never backed up, the job paused, no mirror, and the warning whatever the state
        assert(
            out.backups.output.includes("The .env file and the field-encryption key are not in it"),
            "the warning is not shown"
        )
        assert(out.backups.output.includes("No backup has run yet") && out.backups.output.includes("No off-site mirror"))
        assert(
            out.backups.output.includes("Paused: no backup is made on a schedule") && out.backups.output.includes("Back up now")
        )
        assert(
            out.backups.output.includes("Resource files") && !has(out.backups.output, /\/download|>\s*Download/),
            "a download is offered"
        )
        // the data operator opens the area and is told backups are not theirs; the backup operator opens only Backups
        assert(has(out.operator.error, /ADMIN_BACKUP_VIEW is required/), out.operator.error)
        assert(
            out.backupImports.status !== 200 ||
                out.backupImports.errors.length > 0 ||
                out.backupImports.output.includes("not available"),
            "the backup operator opened Imports"
        )
    }
})
