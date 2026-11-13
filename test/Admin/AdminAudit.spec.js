// Audit and access evidence in Admin (impl-admin P17; design-admin §12 AuditChanges and AccessLog, §16 "Audit evidence"):
// the audit reader, who holds no other Admin area and no System, Dashboards or telemetry grant, follows a grant change and a
// relay credential's replacement with the actor and the reason and no secret; reads the changes of the people of its own
// organization and none of another's; and reads the access log as the lines of the report engine's and monitoring's audit
// targets written under its own organization's people, their addresses counted and their values left out, and no other log
// line whatever is asked of the dataset; the dataset itself is granted to no group, so the engine answers its whole lines to
// no Admin group. AuditChanges is the framework's System › Audit screen mounted by location (mr-moqui
// plans/archive/Admin-Screens-Down.md), over org.moqui.admin.AuditServices.find#Changes: a record's place is a route of the mount,
// shown as a link the audit reader cannot follow where its screen does not open to them. One html render each of
// AuditChanges and AccessLog (their lists' rows are in the html). The framework's rules are its AdminAuditChanges spec,
// the organization scope of changes Mantle's IdentityAudit.
// Run: ./moq test mr-boss --spec AdminAudit
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const A = "ironstone.admin.AuditServices."
const CHANGES = "org.moqui.admin.AuditServices.find#Changes"
const LOG = "moqui.entity.EntityAuditLog"
const DATASET = "admin-access-log"
const RELAY = "SPEC_ADM_AUD_RELAY"
const GROUP = "SPEC_ADM_AUD_GROUP"
const SECRET = "enc:c3BlYy1hZG0tYXVkaXQtc2VjcmV0"
const VALUE = "spec-adm-audit-setting-value"
const ADDRESSES = "vera@spec-audit.example,otto@spec-audit.example"
// a person of each organization: Retail's (the audit reader's own) and Services'
const people = {
    retail: {userId: "SPEC_ADM_AUD_RETAIL", username: "spec.adm.aud.retail", organizationId: ids.organizationId},
    services: {userId: "SPEC_ADM_AUD_SERVICES", username: "spec.adm.aud.services", organizationId: ids.otherOrganizationId}
}
const has = (value, pattern) => pattern.test(String(value ?? ""))
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
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
// with artifact authorization on: Admin's services are the root user group's, and each checks the user's own permission
const as = (username, name, parameters = {}) => asUser(username, () => invoke(name, parameters))
// the report engine's own read, with authorization on, for an Admin user who may also call the engine (the spec's own
// grant of its read operations to the root user group, as an Insights group's is): the dataset's artifact is checked as the
// user's own grant, never an inherited one, and its row filters are the dataset's
const ENGINE = "SPEC_ADM_AUD_ENGINE"
const engine = (username, parameters) =>
    asUser(username, () =>
        invoke(
            "org.moqui.report.ReportServices.query#Documents",
            Object.assign({from: "now-1d", thru: "now+1h", pageSize: 100}, parameters)
        )
    )
const bodies = out => Array.from(out.hits || []).map(hit => String(hit.body?.body))
let seq = 0
// the hour the spec's audit rows are dated in (set in setupSpec), which AuditChanges' render is narrowed to
let auditWindow = {}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const value = ec.entity.makeValue(entityName)
                value.setFields(fields, true, null, null)
                if (entityName === LOG) value.setSequencedIdPrimary()
                value.create()
            }
            for (const person of Object.values(people)) {
                make("mantle.party.Party", {partyId: person.userId, partyTypeEnumId: "PtyPerson"})
                make("mantle.party.Person", {partyId: person.userId, firstName: "Spec", lastName: "Audited"})
                make("mantle.party.PartyRelationship", {
                    partyRelationshipId: person.userId + "_ORG",
                    relationshipTypeEnumId: "PrtEmployee",
                    fromPartyId: person.userId,
                    toPartyId: person.organizationId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: 0
                })
                make("moqui.security.UserAccount", {
                    userId: person.userId,
                    username: person.username,
                    userFullName: "Spec Audited",
                    partyId: person.userId
                })
            }
            make("moqui.security.UserGroup", {userGroupId: GROUP, description: "Spec audited group"})
            make("moqui.security.ArtifactGroup", {artifactGroupId: ENGINE, description: "Spec report engine read"})
            make("moqui.security.ArtifactGroupMember", {
                artifactGroupId: ENGINE,
                artifactTypeEnumId: "AT_SERVICE",
                artifactName: "org.moqui.report.ReportServices.query#Documents",
                nameIsPattern: "N",
                inheritAuthz: "N"
            })
            make("moqui.security.ArtifactGroupMember", {
                artifactGroupId: ENGINE,
                artifactTypeEnumId: "AT_SERVICE",
                artifactName: "org.moqui.report.ReportServices.run#Query",
                nameIsPattern: "N",
                inheritAuthz: "N"
            })
            make("moqui.security.ArtifactAuthz", {
                artifactAuthzId: ENGINE,
                userGroupId: "BOSS_ADMIN",
                artifactGroupId: ENGINE,
                authzTypeEnumId: "AUTHZT_ALLOW",
                authzActionEnumId: "AUTHZA_ALL"
            })
            const now = Number(ec.user.nowTimestamp)
            // what the audit log holds, as the services and the entity audit log write it; dated ahead of the demo load's own
            // rows, so they are the newest of a find. Specs that set the effective time ahead write rows dated later (Mantle's
            // AccountingBookDates on 2026-11-15, CalendarChanges in June 2027), more than AuditChanges' page of 50 when they run
            // before this one on its worker, so its render is narrowed to the hour of this spec's rows
            auditWindow = {fromDate: String(now + 3600000), thruDate: String(now + 2 * 3600000)}
            const audit = (changedEntityName, changedFieldName, fields) =>
                make(LOG, Object.assign({changedEntityName, changedFieldName, changedDate: now + 3600000 + ++seq * 1000}, fields))
            audit("moqui.security.UserGroupPermission", "thruDate", {
                pkPrimaryValue: GROUP,
                pkSecondaryValue: "ADMIN_TRANSFER_RUN",
                newValueText: String(now),
                changedByUserId: "BOSS_ADM_ACCESS",
                changeReason: "Spec left the data team"
            })
            audit("moqui.basic.email.EmailServer", "smtpPassword", {
                pkPrimaryValue: RELAY,
                oldValueText: "(set)",
                newValueText: "(replaced)",
                changedByUserId: "BOSS_ADM_INTEGRATIONS",
                changeReason: "Spec rotated after offboarding"
            })
            // the entity audit log's own row of the encrypted field
            audit("moqui.basic.email.EmailServer", "smtpPassword", {
                pkPrimaryValue: RELAY,
                oldValueText: SECRET,
                newValueText: SECRET + "2",
                changedByUserId: "BOSS_ADM_INTEGRATIONS"
            })
            for (const person of Object.values(people))
                audit("moqui.security.UserAccount", "emailAddress", {
                    pkPrimaryValue: person.userId,
                    oldValueText: person.username + "@old.example",
                    newValueText: person.username + "@new.example",
                    changedByUserId: "BOSS_ADM_IDENTITY",
                    changeReason: "Spec name change"
                })
            // the log lines: an export by each organization's person, a runtime setting, and a line of another target
            const line = (id, scopeName, body, userId, attributes) => ({
                _type: "otel_logs",
                _id: "spec-adm-aud-" + id,
                timestamp: now - 30000 + ++seq * 1000,
                severity_text: "INFO",
                severity_number: 9,
                scope_name: scopeName,
                body,
                trace_id: "5bec0adu0000000000000000000000" + (10 + seq),
                "user.id": userId,
                attributes,
                // the pairs the telemetry ingest keeps beside a line's attributes, which a filter on an attribute reads
                __attributes: Object.entries(attributes).map(([key, value]) => ({key, value: String(value)}))
            })
            ec.search.indexDocuments([
                line("retail-export", "moqui.report.audit", "report data exported", people.retail.userId, {
                    user: people.retail.userId,
                    kind: "scheduled",
                    format: "pdf",
                    definition: "spec-adm-aud-retail-sales",
                    rows: 12,
                    recipients: ADDRESSES
                }),
                line("services-export", "moqui.report.audit", "report data exported", people.services.userId, {
                    user: people.services.userId,
                    kind: "report",
                    format: "csv",
                    definition: "spec-adm-aud-services-payroll",
                    rows: 40,
                    recipients: ""
                }),
                line("retail-setting", "moqui.monitor.audit", "runtime setting set", people.retail.userId, {
                    user: people.retail.userId,
                    key: "spec.adm.aud.setting",
                    value: VALUE,
                    reason: "Spec raised for a trace"
                }),
                line("retail-other", "moqui.spec.other", "spec-adm-aud ordinary line", people.retail.userId, {
                    user: people.retail.userId,
                    definition: "spec-adm-aud-not-audit"
                })
            ])
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        system(() => {
            for (const id of ["retail-export", "services-export", "retail-setting", "retail-other"])
                ec.search.deleteDocument("otel_logs", "spec-adm-aud-" + id)
            find("moqui.security.ArtifactAuthz", {artifactAuthzId: ENGINE}).deleteAll()
            find("moqui.security.ArtifactGroupMember", {artifactGroupId: ENGINE}).deleteAll()
            find("moqui.security.ArtifactGroup", {artifactGroupId: ENGINE}).deleteAll()
            find("moqui.security.UserGroup", {userGroupId: GROUP}).deleteAll()
            for (const person of Object.values(people)) {
                find("moqui.security.UserAccount", {userId: person.userId}).deleteAll()
                find("mantle.party.PartyRelationship", {partyRelationshipId: person.userId + "_ORG"}).deleteAll()
                find("mantle.party.Person", {partyId: person.userId}).deleteAll()
                find("mantle.party.Party", {partyId: person.userId}).deleteAll()
            }
        })
    }
})

feature("the audit reader follows a grant change and a credential's replacement with the actor and the reason, and no secret", {
    when() {
        const out = {searchAvailable: ec.search.isAvailable()}
        out.context = as(users.audit, "ironstone.admin.ContextServices.get#SharedContext", {})
        out.grant = as(users.audit, CHANGES, {recordKey: GROUP})
        out.relay = as(users.audit, CHANGES, {recordKey: RELAY})
        out.exported = as(users.audit, CHANGES, {recordKey: RELAY, forExport: true})
        // a user of another Admin group, who opens Admin and may call the service, reads none of it
        out.dataOperator = as(users.data, CHANGES, {recordKey: RELAY})
        // AuditChanges' one render, in html, where the list's rows are: what the audit reader may read of the spec's hour
        out.page = asUser(users.audit, () => page("Audit/AuditChanges", auditWindow, "html"))
        out.dataPage = asUser(users.data, () => page("Audit/AuditChanges", auditWindow, "html"))
        out.grantRow = Array.from(out.grant.changeList || [])[0] || {}
        out.replaced = Array.from(out.relay.changeList || []).find(row => row.after === "(replaced)") || {}
        out.encrypted = Array.from(out.relay.changeList || []).find(row => row.after !== "(replaced)") || {}
        return out
    },
    then(out) {
        out.searchAvailable
        // the audit reader: the audit capability and its area, and nothing of System or another area
        out.context.capabilities.auditView === true && out.context.capabilities.audit === true
        out.context.capabilities.system === false && out.context.capabilities.operations === false
        // the grant change: the group, the permission, when it ended, who and why
        out.grant.error === "" && out.grant.changeListCount === 1
        out.grantRow.description === "Permission of a group ended"
        out.grantRow.recordText === "Group: Spec audited group · Permission: ADMIN_TRANSFER_RUN"
        has(out.grantRow.after, /^\d{4}-\d\d-\d\d \d\d:\d\d$/)
        out.grantRow.actorName === "admin.access (Admin Access administrator)"
        out.grantRow.reason === "Spec left the data team"
        // the group's place is the access administrator's screen, by the key the mount's routes resolve
        out.grantRow.linkKey === "adminGroup" && out.grantRow.linkId === GROUP
        // the credential: that it was replaced, by whom and why; the encrypted values of the entity's own row nowhere
        out.relay.changeListCount === 2
        out.replaced.masked === true && out.replaced.before === "(set)"
        out.replaced.actorName === "admin.integrations (Admin Integration administrator)"
        out.replaced.reason === "Spec rotated after offboarding"
        out.encrypted.masked === true && out.encrypted.marker === "changed" && out.encrypted.after == null
        !JSON.stringify(out.relay).includes("enc:") && !JSON.stringify(out.exported).includes("enc:")
        // the print and the file are the same projection
        out.exported.changeList.length === 2 && out.exported.truncated === false
        // another Admin group's user is refused by the permission, in the service and on the screen
        has(out.dataOperator.error, /ADMIN_AUDIT_VIEW is required/)
        out.dataPage.status !== 200 || !out.dataPage.output.includes("Spec rotated")
        out.page.status === 200 && out.page.errors.join("\n") === ""
        out.page.output.includes("Spec rotated after offboarding") && out.page.output.includes("(replaced)")
        out.page.output.includes("admin.integrations") && out.page.output.includes("(changed; not shown)")
        !out.page.output.includes("enc:")
        // a record's place is not the audit reader's to open (Access, Users, Protocols): the record is named, in a link the
        // widget disables, and nothing leads there
        out.page.output.includes("Spec audited group") && out.page.output.includes('aria-disabled="true"')
        !out.page.output.includes("GroupDetail?")
        !out.page.output.includes("UserDetail?") && !out.page.output.includes("MailRelays")
        // under the area's own grant too: the reader's organization's person, not the other organization's
        out.page.output.includes(people.retail.username + "@new.example")
        !out.page.output.includes(people.services.username)
    }
})

feature("an audit reader reads the changes of its own organization's people and none of another's", {
    when() {
        const out = {}
        const email = userId => ({recordKey: userId, auditProjectionId: "AccountEmail"})
        out.own = as(users.audit, CHANGES, email(people.retail.userId))
        out.other = as(users.audit, CHANGES, {recordKey: people.services.userId})
        out.identity = as(users.audit, CHANGES, {category: "identity"})
        // an instance administrator reads every organization's (the administrator does through the area's own grant, which
        // names every organization: the acceptance walk's)
        out.system = as(users.system, CHANGES, email(people.services.userId))
        out.ownRow = Array.from(out.own.changeList || [])[0] || {}
        return out
    },
    then(out) {
        out.own.error === "" && out.own.changeListCount === 1
        out.ownRow.after === people.retail.username + "@new.example" && out.ownRow.reason === "Spec name change"
        out.ownRow.recordText === "User: " + people.retail.username + " (Spec Audited)"
        // the user's place, by the key the mount's routes resolve to Users › UserDetail
        out.ownRow.linkKey === "adminUser" && out.ownRow.linkId === people.retail.userId
        // Services' person: not found, not counted, by the key or in the whole area
        out.other.error === "" && out.other.changeListCount === 0 && out.other.changeList.length === 0
        out.identity.changeListCount > 0 && !JSON.stringify(out.identity).includes(people.services.username)
        out.system.changeListCount === 1
    }
})

feature("the access log is the audit lines of the reader's own people and no other log line, whatever is asked of the dataset", {
    when() {
        const out = {}
        out.log = as(users.audit, A + "get#AccessLog", {})
        out.bySubject = as(users.audit, A + "get#AccessLog", {subject: "spec-adm-aud-services-payroll"})
        out.adminLog = as(users.admin, A + "get#AccessLog", {subject: "spec-adm-aud-services-payroll"})
        out.dataOperator = as(users.data, A + "get#AccessLog", {})
        // the engine itself, for an Admin user who may also call it (as with an Insights group): the dataset is granted to no
        // group, so the audit reader does not read its whole lines there, by documents or by an aggregate of an
        // attribute (the administrator is denied the engine itself, as every Admin group but System's); nor the telemetry dataset
        out.rawLogs = engine(users.audit, {datasetId: "otel_logs"})
        out.auditEngine = engine(users.audit, {datasetId: DATASET})
        out.auditValues = as(users.audit, "org.moqui.report.ReportServices.run#Query", {
            query: {
                datasetId: DATASET,
                from: "now-1d",
                thru: "now+1h",
                aggregations: [{id: "value", type: "terms", role: "x-axis", params: {field: "attributes.value", size: 10}}]
            }
        })
        out.dataEngine = engine(users.data, {datasetId: DATASET})
        // an instance administrator holds every dataset's artifact (Tools'): the access log dataset keeps its own filter
        // whatever the request asks (a query text, a query, a negated filter, a definition's own keys)
        out.widened = [
            {queryString: "spec-adm-aud OR scope_name:moqui.spec.other OR *"},
            {query: {match_all: {}}},
            {filters: [{negated: true, query: {field: {name: "scope_name", op: "eq", value: "moqui.report.audit"}}}]},
            {rowFilter: {match_all: {}}, rowFilterService: "", indexName: "otel_logs"}
        ].map(request => engine(users.system, Object.assign({datasetId: DATASET}, request)))
        // the row filter is the signed-in viewer's own
        out.otherFilter = as(users.audit, A + "get#AccessLogRowFilter", {userId: "BOSS_ADM_ADMIN"})
        // AccessLog's one render, in html
        out.page = asUser(users.audit, () => page("Audit/AccessLog", {}, "html"))
        out.exportLine = Array.from(out.log.accessList || []).find(row => row.subjectId === "spec-adm-aud-retail-sales") || {}
        out.settingLine = Array.from(out.log.accessList || []).find(row => row.subjectId === "spec.adm.aud.setting") || {}
        out.widenedBodies = out.widened.flatMap(bodies)
        out.text = JSON.stringify(out.log)
        return out
    },
    then(out) {
        out.log.error === "" && !out.log.unavailable
        // who exported what, in which format, to how many: the addresses counted, never listed
        out.exportLine.actionText === "report data exported" && out.exportLine.sourceText === "Reports"
        out.exportLine.actorName === people.retail.username + " (Spec Audited)"
        out.exportLine.subjectText === "Definition spec-adm-aud-retail-sales"
        out.exportLine.kindText === "scheduled · pdf" && out.exportLine.countText === "12 rows · 2 recipients"
        !out.text.includes("spec-audit.example")
        // a runtime setting: that it was set, by whom and why, never its value
        out.settingLine.sourceText === "Monitoring" && out.settingLine.reason === "Spec raised for a trace"
        !out.text.includes(VALUE)
        // not another organization's person's line, and not a line of another log target
        !out.text.includes("spec-adm-aud-services-payroll") && !out.text.includes("ordinary line")
        out.bySubject.accessListCount === 0
        out.adminLog.accessListCount === 1
        has(out.dataOperator.error, /ADMIN_AUDIT_VIEW is required/)
        // the engine: no telemetry dataset and no access log dataset for the audit reader or another group
        has(out.rawLogs.error, /otel_logs/)
        has(out.auditEngine.error, /admin-access-log/) && !out.auditEngine.hits
        has(out.auditValues.error, /admin-access-log/) && !JSON.stringify(out.auditValues).includes(VALUE)
        has(out.dataEngine.error, /admin-access-log/)
        // whatever is asked by who holds its artifact, only the two audit targets' lines
        out.widened.every(found => found.error === "")
        out.widenedBodies.length > 0
        out.widenedBodies.every(body => body === "report data exported" || body === "runtime setting set")
        !JSON.stringify(out.widened).includes("ordinary line")
        has(out.otherFilter.error, /signed-in user only/)
        out.page.status === 200 && out.page.errors.join("\n") === ""
        out.page.output.includes("report data exported") && out.page.output.includes("2 recipients")
        !out.page.output.includes("spec-audit.example") && !out.page.output.includes(VALUE)
        !out.page.output.includes("spec-adm-aud-services-payroll") && !out.page.output.includes("ordinary line")
    }
})
