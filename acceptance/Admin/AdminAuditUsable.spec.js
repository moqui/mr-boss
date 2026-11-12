// Admin P17's "usable when" (impl-admin P17; design-admin §12 AuditChanges and AccessLog, §16 "Audit evidence"), as an
// acceptance walk with artifact authorization on, through the screens and their transitions. The access administrator adds a
// Retail user to a registered group with a reason, and the integration administrator replaces a mail relay's password with
// one; the audit reader, who opens no other Admin area, opens Admin › Audit, lands on Changes and follows both: who, when,
// the record and the reason, and the password nowhere, on the page, in the print and in the CSV (where a reason that begins
// like a formula is text). A membership given to a person of another organization is not there for the audit reader and is
// for the administrator, whose area grant names every organization. In Access log the audit reader sees who exported a
// report, in which format and to how many, the addresses counted and never listed, and no other log line; System, its
// Monitor and Tools' audit log stay closed to them. The export's line is written here as the telemetry ingest keeps one (a
// spec's process runs no log export): that a real export's line reaches the index is the framework's report tests and plan
// §8's walk by hand. The rules are the framework's AdminAuditChanges, Mantle's IdentityAudit and BOSS's AdminAudit.
// Run: ./moq accept mr-boss --spec AdminAuditUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const run = String(Date.now()).slice(-7)
const relayId = "USABLE_AUD_" + run
const password = "usable-audit-password-" + run
const bundleId = "BOSS_PURCHASING_BUYER"
const grantReason = "Usable: cover for the buyer " + run
const relayReason = "=Usable: rotated after offboarding " + run
const otherReason = "Usable: Services cover " + run
const definitionId = "usable-audit-sales-" + run
const addresses = "una@usable-audit.example,otto@usable-audit.example"
const lineId = "usable-aud-export-" + run
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const relayRevision = () =>
    system(() => invoke(C + "get#Connection", {adapterKey: "relay", connectionKey: relayId}).connection.revision)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const relay = ec.entity.makeValue("moqui.basic.email.EmailServer")
            // STARTTLS: a relay that signs in needs TLS (store#Connection refuses a password otherwise)
            relay.setFields(
                {emailServerId: relayId, smtpHost: "relay.usable-audit.example", smtpPort: "587", smtpStartTls: "Y"},
                true,
                null,
                null
            )
            relay.create()
            // a membership of a person of Services only, given by an instance administrator
            invoke("org.moqui.admin.AccessServices.store#Membership", {
                userGroupId: bundleId,
                userId: ids.otherUserId,
                reason: otherReason
            })
            // an export's line, as the telemetry ingest keeps one
            const attributes = {
                user: ids.retailUserId,
                kind: "scheduled",
                format: "pdf",
                definition: definitionId,
                rows: 12,
                recipients: addresses
            }
            ec.search.indexDocuments([
                {
                    _type: "otel_logs",
                    _id: lineId,
                    timestamp: Number(ec.user.nowTimestamp) - 5000,
                    severity_text: "INFO",
                    severity_number: 9,
                    scope_name: "moqui.report.audit",
                    body: "report data exported",
                    "user.id": ids.retailUserId,
                    attributes,
                    __attributes: Object.entries(attributes).map(([key, value]) => ({key, value: String(value)}))
                }
            ])
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        system(() => {
            ec.search.deleteDocument("otel_logs", lineId)
            find("moqui.basic.email.EmailServer", {emailServerId: relayId}).deleteAll()
            for (const userId of [ids.retailUserId, ids.otherUserId])
                for (const row of Array.from(find("moqui.security.UserGroupMember", {userGroupId: bundleId, userId}).list()))
                    if (row.thruDate == null) {
                        row.set("thruDate", ec.user.nowTimestamp)
                        row.update()
                    }
        })
    }
})

feature("a grant change and a relay password's replacement are made, each with its reason", {
    when() {
        const out = {}
        out.added = asUser(users.access, () =>
            page(
                "Access/GroupDetail/addMember",
                {userGroupId: bundleId, memberUserId: ids.retailUserId, reason: grantReason},
                "html"
            )
        )
        out.saved = asUser(users.integrations, () =>
            page(
                "Protocols/MailRelayDetail/storeConnection",
                {
                    connectionKey: relayId,
                    expectedRevision: relayRevision(),
                    fieldName_0: "mailPassword",
                    secretPassword_0: password,
                    fieldName_1: "_reason",
                    fieldValue_1: relayReason
                },
                "html"
            )
        )
        out.member = system(() =>
            Array.from(find("moqui.security.UserGroupMember", {userGroupId: bundleId, userId: ids.retailUserId}).list()).some(
                row => row.thruDate == null
            )
        )
        out.relay = system(() => invoke(C + "get#Connection", {adapterKey: "relay", connectionKey: relayId}).connection)
        return out
    },
    then(out) {
        assert(out.member, "the membership was not added: " + out.added.errors.join("; "))
        assert(JSON.stringify(out.relay).includes('"secretSet":true'), "the password was not set: " + out.saved.errors.join("; "))
        assert(!JSON.stringify(out.relay).includes(password), "the connection answers its password")
    }
})

feature("the audit reader follows both with the actor and the reason, and no secret, on the page, in the print and the CSV", {
    when() {
        const out = {}
        // the area starts at Changes; narrowed to each record by the link of its row
        out.landing = asUser(users.audit, () => page("Audit"))
        out.changes = asUser(users.audit, () => page("Audit/AuditChanges"))
        out.relay = asUser(users.audit, () => page("Audit/AuditChanges", {recordKey: relayId}, "html"))
        out.grant = asUser(users.audit, () =>
            page("Audit/AuditChanges", {recordKey: ids.retailUserId, category: "access"}, "html")
        )
        out.print = asUser(users.audit, () => page("Audit/AuditChanges", {recordKey: relayId}, "html-print"))
        out.csv = asUser(users.audit, () =>
            page("Audit/AuditChanges", {recordKey: relayId, renderMode: "csv", pageNoLimit: "true"}, "csv")
        )
        // another organization's person: not the audit reader's to read, and the administrator's
        out.otherReader = asUser(users.audit, () => page("Audit/AuditChanges", {recordKey: ids.otherUserId}, "html"))
        out.otherAdmin = asUser(users.admin, () => page("Audit/AuditChanges", {recordKey: ids.otherUserId}, "html"))
        // what stays closed to the audit reader
        out.closed = [
            "Access/Groups",
            "Protocols/MailRelays",
            "Users/Users",
            "Data/Exports",
            "System",
            "System/Audit/AuditChanges"
        ].map(path => [path, asUser(users.audit, () => page(path))])
        return out
    },
    then(out) {
        assert(opened(out.landing), out.landing.errors.join("; "))
        assert(opened(out.changes) && out.changes.output.includes("Who changed what"), out.changes.errors.join("; "))
        assert(opened(out.relay), out.relay.errors.join("; "))
        // the credential: replaced, by the integration administrator, with the reason; never its value
        for (const [name, rendered] of [
            ["page", out.relay],
            ["print", out.print],
            ["CSV", out.csv]
        ]) {
            assert(rendered.output.includes("Usable: rotated after offboarding " + run), name + " lacks the reason")
            assert(rendered.output.includes("(replaced)") && rendered.output.includes("admin.integrations"), name)
            assert(!rendered.output.includes(password), name + " holds the password")
        }
        // a reason that begins like a formula is text in the file
        assert(out.csv.output.includes("'=Usable: rotated"), "the CSV's reason is not guarded")
        // the grant change: the group, the member, the access administrator and the reason
        assert(opened(out.grant) && out.grant.output.includes(grantReason), "the grant change is not shown")
        assert(out.grant.output.includes("admin.access") && out.grant.output.includes("commerce.manager"))
        // Services' person
        assert(
            opened(out.otherReader) && !out.otherReader.output.includes(otherReason),
            "the audit reader reads Services' change"
        )
        assert(opened(out.otherAdmin) && out.otherAdmin.output.includes(otherReason), "the administrator does not")
        // a record's place (the route of its registration's linkKey: a membership's is its group, the framework's
        // adminGroup route) is a link for the administrator, whom Access › GroupDetail opens to, and only the record's
        // name for the audit reader
        assert(out.otherAdmin.output.includes("GroupDetail?userGroupId="), "the administrator has no link to the group")
        assert(!out.grant.output.includes("GroupDetail?") && !out.relay.output.includes("MailRelays"), "the audit reader is given a link")
        for (const [path, rendered] of out.closed) assert(!opened(rendered), "the audit reader opened " + path)
    }
})

feature("the audit reader sees who exported a report, and reads no other log line", {
    when() {
        const out = {}
        out.log = asUser(users.audit, () => page("Audit/AccessLog", {}, "html"))
        out.byActor = asUser(users.audit, () => page("Audit/AccessLog", {actorUserId: ids.retailUserId}, "html"))
        out.csv = asUser(users.audit, () => page("Audit/AccessLog", {renderMode: "csv", pageNoLimit: "true"}, "csv"))
        out.dataOperator = asUser(users.data, () => page("Audit/AccessLog", {}, "html"))
        out.monitor = asUser(users.audit, () => page("System/Monitor/Logs"))
        // the telemetry dataset itself, as the engine answers the audit reader
        out.rawLogs = asUser(users.audit, () => {
            try {
                ec.service
                    .sync()
                    .name("org.moqui.report.ReportServices.query#Documents")
                    .parameters({datasetId: "otel_logs", from: "now-1d", thru: "now+1h"})
                    .call()
                return ec.message.hasError() ? ec.message.getErrorsString() : ""
            } catch (error) {
                return String(error.message || error)
            } finally {
                ec.message.clearErrors()
            }
        })
        return out
    },
    then(out) {
        assert(opened(out.log), out.log.errors.join("; "))
        for (const [name, rendered] of [
            ["page", out.log],
            ["narrowed page", out.byActor],
            ["CSV", out.csv]
        ]) {
            assert(rendered.output.includes(definitionId) && rendered.output.includes("report data exported"), name)
            assert(rendered.output.includes("commerce.manager") && rendered.output.includes("2 recipients"), name)
            assert(!rendered.output.includes("usable-audit.example"), name + " lists the addresses")
        }
        assert(!opened(out.dataOperator) || !out.dataOperator.output.includes(definitionId), "the data operator reads the log")
        assert(!opened(out.monitor), "the audit reader opened Monitor's logs")
        assert(out.rawLogs !== "", "the audit reader read the telemetry dataset")
    }
})
