// Admin's registries (impl-admin P2; design-admin §3, §7 SettingsHome, §10 Health, §14): readiness, refresh and the settings
// index, read from the owners' registrations (ironstone.admin ReadinessProvider, RefreshOperation and SettingsEntry, each
// seeded by its owner). Registrations are trusted component definitions: a row naming a service or permission that does not
// exist is logged by name when read and left out, and the others still answer. Nothing here takes a service or index name
// from a request, and nothing grants what an owner refuses.
//
// Readiness: each provider the viewer may read (its required permission) is called as the viewer, in its own transaction, and
// its answer read by its adapter below (the owners' services keep their own shapes; a provider written for the contract
// answers a checks list). One provider that fails is named, without its diagnostics, and the others are shown; a provider the
// viewer cannot read is omitted, and one that refuses an organization leaves that organization out. Unavailable is never shown
// as ready. Admin's own eight checks (design §3) are functions here, behind check#AdminSetup.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied} = lib
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")

const minute = 60 * 1000
const states = {failed: "Failed", unavailable: "Unavailable", warning: "Warning", ready: "Ready"}
const stateOrder = {failed: 0, unavailable: 1, warning: 2, ready: 3}
const stateColors = {failed: "negative", unavailable: "grey-8", warning: "warning", ready: "positive"}
// the refusals an owner answers for an organization or a record the viewer may not read, as its reason codes or wording
const refusalCodes = ["PERMISSION_DENIED", "ORGANIZATION_DENIED", "ACCESS_DENIED", "RECORD_UNAVAILABLE", "STORE_UNAVAILABLE"]
const refusalText = /authority is required|is not available|may not read|is not authorized/

const ms = value =>
    value == null || value === "" ? null : /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value))
const nowMs = () => ms(ec.user.nowTimestamp)
const timeText = value => (value == null ? "" : ec.l10n.format(value, "yyyy-MM-dd HH:mm"))
// a registration's permission as the owners read theirs (ProductAccess.has): an instance administrator (ADMIN) holds every one
const has = permission => !permission || lib.access.has(permission)
const isRefusal = error => refusalCodes.includes(lib.reasonCode(error)) || refusalText.test(String(error?.message || ""))

// ===== registrations =====
// The rows of a registry that are enabled and name what exists, each invalid one logged by name and left out; definitions
// are read once per call.
function registered(entityName, keyField, conditions = {}) {
    const services = new Map()
    const permissions = new Map()
    const serviceExists = name => {
        if (!services.has(name)) services.set(name, !!ec.service.getServiceDefinition(name))
        return services.get(name)
    }
    const permissionExists = id => {
        if (!permissions.has(id)) permissions.set(id, !!one("moqui.security.UserPermission", {userPermissionId: id}))
        return permissions.get(id)
    }
    const valid = []
    for (const row of rows(entityName, conditions)) {
        if (row.disabled === "Y") continue
        const key = row[keyField]
        try {
            if (row.serviceName !== undefined && !(row.serviceName && serviceExists(row.serviceName))) {
                ec.logger.error("Admin registry " + entityName + " " + key + " names a missing service " + row.serviceName)
                continue
            }
            const permission = row.requiredPermission ?? row.viewPermission
            if (permission && !permissionExists(permission)) {
                ec.logger.error("Admin registry " + entityName + " " + key + " names a missing permission " + permission)
                continue
            }
            valid.push(row)
        } catch (error) {
            ec.logger.error("Admin registry " + entityName + " " + key + " was not read: " + error.message)
        }
    }
    return valid.sort((a, b) => (a.sequenceNum ?? 999) - (b.sequenceNum ?? 999) || String(a[keyField]).localeCompare(b[keyField]))
}
const enumNames = enumTypeId =>
    Object.fromEntries(rows("moqui.basic.Enumeration", {enumTypeId}).map(row => [row.enumId, row.description]))

// An owner's service as the viewer, in its own transaction and error frame: its own checks apply, and a failure is an error
// the caller names, not a rollback of the page.
function ownerCall(serviceName, parameters) {
    ec.message.pushErrors()
    try {
        const result = ec.service.sync().name(serviceName).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return result
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// ===== scope =====
// The organizations a readiness read covers: the one asked for, refused unless the viewer administers it, else every one the
// viewer administers (an Admin user's scope; none for a caller without the Admin root, whose organization providers answer
// nothing).
function organizationsOf(userScope, organizationPartyId) {
    if (organizationPartyId) {
        if (
            !admin.administers(userScope, organizationPartyId) ||
            !one("mantle.party.PartyRole", {partyId: organizationPartyId, roleTypeId: "OrgInternal"})
        )
            denied("RECORD_UNAVAILABLE", "Organization " + organizationPartyId + " is not available")
        return [organizationPartyId]
    }
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}

// ===== checks =====
function check(checkKey, title, state, reasonCode, message, extra = {}) {
    return Object.assign({checkKey, title, state, reasonCode: reasonCode || null, message}, extra)
}
const ready = (checkKey, title, message, extra) => check(checkKey, title, "ready", null, message, extra)
// Each organization's checks of an organization-scoped provider: an organization the owner refuses the viewer is left out; one
// that fails is shown unavailable, by name, and the others go on.
function perOrganization(run, provider, checksOf) {
    const found = []
    for (const organizationPartyId of run.organizationIds) {
        try {
            for (const row of checksOf(organizationPartyId)) found.push(Object.assign(row, {organizationPartyId}))
        } catch (error) {
            if (isRefusal(error)) continue
            ec.logger.error(
                "Readiness provider " + provider.providerKey + " for " + organizationPartyId + " failed: " + error.message
            )
            found.push(
                check(
                    provider.providerKey,
                    provider.title,
                    "unavailable",
                    "PROVIDER_FAILED",
                    provider.title + " could not be checked",
                    {
                        organizationPartyId
                    }
                )
            )
        }
    }
    return found
}

// ===== adapters =====
// How each owner's service is called and its answer read, by the service a registration names. A service not here answers the
// contract: called with providerKey (and organizationPartyId, per organization, for an organization-scoped provider), it
// returns checks [{checkKey, title, state: ready, warning, failed or unavailable, reasonCode, message, fixPath, watermark,
// coverage}].
const accountingCodes = {PREFERENCES: "Accounting preferences", PERIODS: "Fiscal periods", CHART: "Chart of accounts"}
const adapters = {
    // Accounting's setup readiness for finance readers (impl-admin F16): its findings, and where setup stands
    "mantle.ledger.SetupServices.get#Readiness": (provider, run) =>
        perOrganization(run, provider, organizationPartyId => {
            const out = ownerCall(provider.serviceName, {organizationPartyId})
            const findings = Array.from(out.findings || [])
            if (out.setupStatus === "unconfigured")
                return [
                    check("accounting.setup", "Accounting setup", "warning", "SETUP_UNCONFIGURED", "Accounting is not set up")
                ]
            if (findings.length)
                return findings.map(finding =>
                    check(
                        "accounting." + String(finding.code).toLowerCase(),
                        accountingCodes[finding.code] || "Accounting setup",
                        "failed",
                        finding.code,
                        finding.message
                    )
                )
            return out.setupStatus === "inSetup"
                ? [
                      check(
                          "accounting.setup",
                          "Accounting setup",
                          "warning",
                          "SETUP_NOT_ACTIVATED",
                          "Accounting setup is not activated yet"
                      )
                  ]
                : [ready("accounting.setup", "Accounting setup", "Accounting setup is complete")]
        }),
    // Products' catalog checks (CatalogChecks; impl-admin F16): the counts, not the products
    "mantle.product.CatalogCheckServices.validate#Catalog": (provider, run) =>
        perOrganization(run, provider, organizationPartyId => {
            const out = ownerCall(provider.serviceName, {organizationPartyId})
            const issues = Array.from(out.issueRows || [])
            const checked = Number(out.checkedCount || 0)
            if (out.valid || !issues.length)
                return [ready("products.catalog", "Catalog quality", checked + " products checked, no issue")]
            const failing = issues.some(row => row.severity === "error")
            return [
                check(
                    "products.catalog",
                    "Catalog quality",
                    failing ? "failed" : "warning",
                    "CATALOG_ISSUES",
                    issues.length + " catalog issues in " + checked + " products checked"
                )
            ]
        }),
    // Commerce's store readiness (impl-commerce §7): each store of the organizations the viewer administers. A Commerce reader
    // (COMMERCE_VIEW in the store's organization) gets the findings with their messages; an administrative reader the store's
    // summary Commerce answers without messages (its PASS readiness shape), so it sees a store it does not open
    "mantle.product.StoreAdminServices.check#StoreReadiness": (provider, run) => {
        const found = []
        if (!run.organizationIds.length) return found
        const stores = find("mantle.product.store.ProductStore").condition("organizationPartyId", "in", run.organizationIds)
        for (const store of Array.from(stores.orderBy("storeName").limit(50).list())) {
            const storeId = store.productStoreId
            const extra = {
                organizationPartyId: store.organizationPartyId,
                subject: store.storeName || storeId,
                fixPath: "Commerce/Stores/StoreDetail?productStoreId=" + encodeURIComponent(storeId)
            }
            try {
                let findings = null
                if (has("COMMERCE_VIEW")) {
                    try {
                        findings = Array.from(ownerCall(provider.serviceName, {productStoreId: storeId}).findings || [])
                    } catch (error) {
                        if (!isRefusal(error)) throw error
                    }
                }
                if (findings) {
                    const open = findings.filter(row => !row.ready)
                    if (!open.length) found.push(ready("commerce.store", "Store readiness", "The store is ready", extra))
                    for (const row of open)
                        found.push(
                            check(
                                "commerce.store." + row.key,
                                row.label || "Store readiness",
                                row.severity === "warning" ? "warning" : "failed",
                                "STORE_" + String(row.key).toUpperCase(),
                                row.message || "Not ready",
                                extra
                            )
                        )
                } else {
                    const result = ownerCall(provider.serviceName, {input: {targetId: storeId}}).result || {}
                    const open = Array.from(result.checks || [])
                        .filter(row => !row.ready)
                        .map(row => row.name)
                    found.push(
                        open.length
                            ? check(
                                  "commerce.store",
                                  "Store readiness",
                                  "failed",
                                  "STORE_NOT_READY",
                                  "Not ready: " + open.join(", "),
                                  extra
                              )
                            : ready("commerce.store", "Store readiness", "The store is ready", extra)
                    )
                }
            } catch (error) {
                ec.logger.error(
                    "Readiness provider " + provider.providerKey + " for store " + storeId + " failed: " + error.message
                )
                found.push(
                    check(
                        "commerce.store",
                        provider.title,
                        "unavailable",
                        "PROVIDER_FAILED",
                        provider.title + " could not be checked",
                        extra
                    )
                )
            }
        }
        return found
    },
    // the framework's Constitution for the instance: the sources it passed over, counted, not shown
    "org.moqui.admin.ConstitutionServices.get#Constitution": provider => {
        const out = ownerCall(provider.serviceName, {scope: "global"})
        const passedOver = Array.from(out.diagnosticList || []).length
        if (!out.available)
            return [
                check(
                    "constitution.global",
                    "Instance Constitution",
                    "unavailable",
                    "CONSTITUTION_UNAVAILABLE",
                    "The Constitution could not be read"
                )
            ]
        return [
            passedOver
                ? check(
                      "constitution.global",
                      "Instance Constitution",
                      "warning",
                      "CONSTITUTION_SOURCES",
                      passedOver + (passedOver === 1 ? " Constitution source was" : " Constitution sources were") + " passed over"
                  )
                : ready(
                      "constitution.global",
                      "Instance Constitution",
                      out.customized ? "The instance's own Constitution applies" : "The shipped Constitution applies"
                  )
        ]
    },
    // the framework's protocol readiness (impl-admin P12): a check for each protocol that is turned on and failing or running
    // without its trust; one that is off or not in the build is no problem, and is ProtocolsHome's to explain
    "org.moqui.admin.ConfigurationServices.get#ProtocolReadiness": provider => {
        const protocols = Array.from(ownerCall(provider.serviceName, {}).protocolList || [])
        const found = protocols
            .filter(protocol => ["failing", "untrusted"].includes(protocol.state))
            .map(protocol =>
                check(
                    "admin.protocols." + protocol.protocolKey,
                    protocol.title,
                    protocol.state === "failing" ? "failed" : "warning",
                    protocol.state === "failing" ? "PROTOCOL_FAILING" : "PROTOCOL_UNTRUSTED",
                    protocol.reason || protocol.stateText
                )
            )
        const running = protocols.filter(protocol => protocol.state === "ready").length
        return found.length
            ? found
            : [
                  ready(
                      "admin.protocols",
                      provider.title,
                      running + (running === 1 ? " protocol is" : " protocols are") + " running"
                  )
              ]
    },
    // Mantle's organization Constitution: whether its own document is valid; its fix is Admin › Settings › Constitution in that
    // organization's scope (P7), shown when the viewer opens it. Mantle reads it for an organization the call's organization filters
    // find (impl-admin §4, F52 and F-P7-3 settled), so under an Admin screen's grant every organization the viewer administers
    "mantle.party.ConstitutionServices.get#OrganizationConstitution": (provider, run) =>
        perOrganization(run, provider, organizationPartyId => {
            const out = ownerCall(provider.serviceName, {organizationPartyId})
            if (out.customized && out.contentHash === "invalid")
                return [
                    check(
                        "constitution.organization",
                        "Organization Constitution",
                        "failed",
                        "CONSTITUTION_INVALID",
                        "Its own Constitution is not valid",
                        {fixPath: "Admin/Settings/Constitution?scope=" + encodeURIComponent(organizationPartyId)}
                    )
                ]
            return [
                ready(
                    "constitution.organization",
                    "Organization Constitution",
                    out.customized ? "Its own Constitution applies" : "The instance Constitution applies"
                )
            ]
        })
}
function contract(provider, run) {
    const call = parameters =>
        Array.from(ownerCall(provider.serviceName, Object.assign({providerKey: provider.providerKey}, parameters)).checks || [])
    return provider.scopeEnumId === "AdmScOrganization"
        ? perOrganization(run, provider, organizationPartyId => call({organizationPartyId}))
        : call({})
}

// ===== Admin's own checks (design §3) =====
// Each reads the framework's own records with authorization off, after check#AdminSetup's ADMIN_OVERVIEW_VIEW; none names a
// host, an address or a person.
const backupJob = "backup_EmbeddedDatabase_daily"
const backupRemote = "EmbeddedDbBackup"
function lastSuccessfulRun(jobName) {
    const run = find("moqui.service.job.ServiceJobRun", {jobName})
        .condition("hasError", "not-equals", "Y")
        .condition("endTime", "is-not-null", null)
        .orderBy("-endTime")
        .limit(1)
        .one()
    return run?.endTime ?? null
}
const adminChecks = {
    "admin.mailServer": () => {
        const server = one("moqui.basic.email.EmailServer", {emailServerId: "SYSTEM"})
        return [
            server?.smtpHost
                ? ready("admin.mailServer", "Outgoing mail", "The SYSTEM mail server has an SMTP host")
                : check(
                      "admin.mailServer",
                      "Outgoing mail",
                      "warning",
                      "MAIL_SERVER",
                      "The SYSTEM mail server has no SMTP host, so the instance sends no mail"
                  )
        ]
    },
    // impl-admin F9: on a fresh instance the job is paused and its mirror has no sendUrl, so both warn
    "admin.backup": () => {
        const job = one("moqui.service.job.ServiceJob", {jobName: backupJob})
        const remote = one("moqui.service.message.SystemMessageRemote", {systemMessageRemoteId: backupRemote})
        const watermark = job ? lastSuccessfulRun(backupJob) : null
        const mirrored = !!remote?.sendUrl
        const coverage = !job || job.paused === "Y" ? "None" : mirrored ? "Mirrored off the server" : "On the server only"
        const jobCheck = !job
            ? check(
                  "admin.backup.job",
                  "Nightly backup",
                  "unavailable",
                  "BACKUP_JOB_MISSING",
                  "The nightly backup job is not set up"
              )
            : job.paused === "Y"
              ? check("admin.backup.job", "Nightly backup", "warning", "BACKUP_PAUSED", "The nightly database backup is paused")
              : watermark == null
                ? check("admin.backup.job", "Nightly backup", "warning", "BACKUP_NONE_YET", "No backup has finished yet")
                : ready("admin.backup.job", "Nightly backup", "The nightly database backup runs")
        return [
            Object.assign(jobCheck, {watermark, coverage}),
            mirrored
                ? ready("admin.backup.mirror", "Off-site mirror", "Backups are mirrored off the server", {coverage})
                : check(
                      "admin.backup.mirror",
                      "Off-site mirror",
                      "warning",
                      "BACKUP_NOT_MIRRORED",
                      "Backups are not mirrored off the server",
                      {
                          coverage,
                          fixPath: "Admin/System/SystemMessage/Remote/MessageRemoteDetail?systemMessageRemoteId=" + backupRemote
                      }
                  )
        ]
    },
    "admin.reportMail": () => {
        const template = one("moqui.basic.email.EmailTemplate", {emailTemplateId: "DASHBOARD_REPORT"})
        if (!template)
            return [
                check(
                    "admin.reportMail",
                    "Report mail",
                    "unavailable",
                    "REPORT_TEMPLATE_MISSING",
                    "The report email template is not installed"
                )
            ]
        const server = template.emailServerId
            ? one("moqui.basic.email.EmailServer", {emailServerId: template.emailServerId})
            : null
        return [
            server?.smtpHost
                ? ready("admin.reportMail", "Report mail", "Report emails have a mail server")
                : check(
                      "admin.reportMail",
                      "Report mail",
                      "warning",
                      "REPORT_MAIL_SERVER",
                      "Report emails have no mail server to send through"
                  )
        ]
    },
    "admin.reportAlertTopic": () => {
        const topic = one("moqui.security.user.NotificationTopic", {topic: "ReportAlert"})
        if (!topic)
            return [
                check(
                    "admin.reportAlertTopic",
                    "Report alerts",
                    "unavailable",
                    "TOPIC_MISSING",
                    "The report alert topic is not installed"
                )
            ]
        return [
            topic.receiveNotifications === "N"
                ? check("admin.reportAlertTopic", "Report alerts", "warning", "TOPIC_OFF", "Report alerts are not sent to anyone")
                : ready("admin.reportAlertTopic", "Report alerts", "Report alerts are sent to their recipients")
        ]
    },
    // a member of ADMIN or of a *_ADMIN group, enabled and not ended, with no authentication factor in date: counted
    "admin.adminFactors": () => {
        const now = nowMs()
        const inDate = row => (ms(row.fromDate) ?? -Infinity) <= now && (ms(row.thruDate) ?? Infinity) > now
        const groupIds = ["ADMIN"].concat(
            rows("moqui.security.UserGroup", {})
                .map(row => row.userGroupId)
                .filter(id => /_ADMIN$/.test(id))
        )
        const userIds = Array.from(
            new Set(
                Array.from(find("moqui.security.UserGroupMember").condition("userGroupId", "in", groupIds).list())
                    .filter(inDate)
                    .map(row => row.userId)
            )
        )
        const accounts = userIds.length
            ? Array.from(find("moqui.security.UserAccount").condition("userId", "in", userIds).list()).filter(
                  row => row.disabled !== "Y" && (ms(row.terminateDate) ?? Infinity) > now
              )
            : []
        const withFactor = new Set(
            accounts.length
                ? Array.from(
                      find("moqui.security.UserAuthcFactor")
                          .condition(
                              "userId",
                              "in",
                              accounts.map(row => row.userId)
                          )
                          .list()
                  )
                      .filter(inDate)
                      .map(row => row.userId)
                : []
        )
        const missing = accounts.filter(row => !withFactor.has(row.userId)).length
        return [
            missing
                ? check(
                      "admin.adminFactors",
                      "Administrator factors",
                      "warning",
                      "ADMIN_NO_FACTOR",
                      missing + (missing === 1 ? " administrator has" : " administrators have") + " no second sign-in factor"
                  )
                : ready("admin.adminFactors", "Administrator factors", "Every administrator has a second sign-in factor")
        ]
    },
    // failing runs of the last day; late runs wait for a framework signal (impl-admin F45)
    "admin.jobRuns": () => {
        const since = new Date(nowMs() - 24 * 60 * minute)
        const failed = Array.from(
            find("moqui.service.job.ServiceJobRun")
                .condition("hasError", "Y")
                .condition("startTime", "greater-equals", since)
                .selectField("jobName")
                .limit(500)
                .list()
        )
        const jobs = Array.from(new Set(failed.map(row => row.jobName)))
        return [
            failed.length
                ? check(
                      "admin.jobRuns",
                      "Job runs",
                      "failed",
                      "JOB_RUNS_FAILED",
                      failed.length +
                          (failed.length === 1 ? " job run" : " job runs") +
                          " failed in the last day: " +
                          jobs.slice(0, 3).join(", ") +
                          (jobs.length > 3 ? " and " + (jobs.length - 3) + " more" : "")
                  )
                : ready("admin.jobRuns", "Job runs", "No job run failed in the last day")
        ]
    },
    "admin.cluster": () => {
        const members = rows("moqui.server.ClusterMember", {})
        const stale = members.filter(row => (ms(row.heartbeat) ?? 0) < nowMs() - 10 * minute).length
        return [
            stale
                ? check(
                      "admin.cluster",
                      "Cluster",
                      "warning",
                      "CLUSTER_STALE",
                      stale + " of " + members.length + " cluster members have not been heard from for ten minutes"
                  )
                : ready("admin.cluster", "Cluster", members.length > 1 ? "Every cluster member is heard from" : "One server")
        ]
    },
    // the telemetry pipeline's counters, read with authorization off so a reader without Monitor sees the state, not the counts
    "admin.telemetry": () => {
        const sources = Array.from(lib.probe("org.moqui.monitor.MonitorServices.get#SourceStatus", {}).sources || [])
        const statuses = sources.map(row => String(row.status || ""))
        if (statuses.some(status => status.includes("loss")))
            return [
                check(
                    "admin.telemetry",
                    "Telemetry",
                    "warning",
                    "TELEMETRY_LOSS",
                    "Telemetry is being lost, so health is unknown"
                )
            ]
        if (!statuses.length || statuses.some(status => status.includes("unknown")))
            return [
                check(
                    "admin.telemetry",
                    "Telemetry",
                    "unavailable",
                    "TELEMETRY_UNKNOWN",
                    "Telemetry is off or not searchable, so health is unknown"
                )
            ]
        return [ready("admin.telemetry", "Telemetry", "Telemetry is received")]
    }
}
// check#AdminSetup: one of Admin's checks, by its registration's key
function adminSetup(p) {
    if (!ec.user.hasPermission("ADMIN_OVERVIEW_VIEW")) denied("PERMISSION_DENIED", "ADMIN_OVERVIEW_VIEW is required")
    if (!Object.hasOwn(adminChecks, p.providerKey)) throw new Error("Unknown Admin check " + p.providerKey)
    return {checks: adminChecks[p.providerKey]()}
}

// ===== readiness =====
// The check rows a screen shows: the provider's and the check's names, the state, the organization or store, the times as
// text in the user's zone, the freshness facet and the owner's fix link when the viewer opens it.
function present(provider, row, context) {
    const state = Object.hasOwn(states, row.state) ? row.state : "unavailable"
    const out = {
        providerKey: provider.providerKey,
        providerTitle: provider.title,
        ownerApp: provider.ownerApp,
        healthGroupEnumId: provider.healthGroupEnumId,
        groupName: context.groupNames[provider.healthGroupEnumId] || "",
        checkKey: row.checkKey || provider.providerKey,
        title: row.title || provider.title,
        state: row.state === state ? state : "unavailable",
        stateName: states[state],
        reasonCode: row.state === state ? row.reasonCode || null : "STATE_UNKNOWN",
        message: row.message || "",
        organizationPartyId: row.organizationPartyId || null,
        subject: row.subject || (row.organizationPartyId ? organizationName(row.organizationPartyId) : "Instance"),
        checkedText: context.checkedText,
        coverage: row.coverage || "",
        watermarkText: "",
        lagText: "",
        // the lag in minutes, for a reader that applies a freshness policy of its own (Insights' DataReadiness)
        lagMinutes: null,
        expectedFrequencyText: "",
        fixUrl: null,
        refreshKey: context.refreshByProvider[provider.providerKey]?.refreshKey || null,
        refreshTitle: context.refreshByProvider[provider.providerKey]?.title || null
    }
    // the freshness facet: a data source's last watermark, its expected frequency and its lag, stale past the lag allowed; on
    // the checks that carry a watermark (none yet, for one never refreshed)
    if (provider.expectedFrequencyMinutes != null && Object.hasOwn(row, "watermark")) {
        out.expectedFrequencyText = frequencyText(provider.expectedFrequencyMinutes)
        const watermark = ms(row.watermark)
        if (watermark != null) {
            const lag = Math.max(0, Math.round((nowMs() - watermark) / minute))
            out.watermarkText = timeText(row.watermark)
            out.lagText = frequencyText(lag)
            out.lagMinutes = lag
            if (provider.maxLagMinutes != null && lag > provider.maxLagMinutes && out.state === "ready")
                Object.assign(out, {
                    state: "warning",
                    stateName: states.warning,
                    reasonCode: "STALE",
                    message: "Last refreshed " + out.lagText + " ago"
                })
        }
    }
    const fixPath = row.fixPath || provider.fixPath
    if (fixPath && out.state !== "ready" && admin.destinationOpens(context.grants, fixPath)) out.fixUrl = "/qapps/" + fixPath
    out.stateColor = stateColors[out.state]
    return out
}
function frequencyText(minutes) {
    const value = Number(minutes)
    if (value < 120) return value + (value === 1 ? " minute" : " minutes")
    if (value < 48 * 60) return Math.round(value / 60) + " hours"
    return Math.round(value / (24 * 60)) + " days"
}
function readiness(p) {
    const userScope = admin.scope()
    const conditions = {}
    if (p.providerKey) conditions.providerKey = p.providerKey
    if (p.ownerApp) conditions.ownerApp = p.ownerApp
    if (p.healthGroupEnumId) conditions.healthGroupEnumId = p.healthGroupEnumId
    const providers = registered("ironstone.admin.ReadinessProvider", "providerKey", conditions)
    const refreshByProvider = {}
    for (const row of registered("ironstone.admin.RefreshOperation", "refreshKey"))
        if (row.providerKey && has(row.requiredPermission) && !refreshByProvider[row.providerKey])
            refreshByProvider[row.providerKey] = row
    const run = {organizationIds: organizationsOf(userScope, p.organizationPartyId), userScope}
    const context = {
        grants: userScope.grants,
        groupNames: enumNames("AdminHealthGroup"),
        checkedText: timeText(ec.user.nowTimestamp),
        refreshByProvider
    }
    const checks = []
    const answered = []
    const failedProviders = []
    for (const provider of providers) {
        // omitted: the viewer may not read it
        if (!has(provider.requiredPermission)) continue
        // an instance check has no organization: with one asked for, it is left out
        if (p.organizationPartyId && provider.scopeEnumId === "AdmScInstance") continue
        let found
        try {
            const adapter = adapters[provider.serviceName] || contract
            found = adapter(provider, run)
        } catch (error) {
            if (isRefusal(error)) continue
            ec.logger.error(
                "Readiness provider " + provider.providerKey + " (" + provider.serviceName + ") failed: " + error.message
            )
            failedProviders.push(provider.title)
            found = [
                check(
                    provider.providerKey,
                    provider.title,
                    "unavailable",
                    "PROVIDER_FAILED",
                    provider.title + " could not be checked"
                )
            ]
        }
        if (!found.length) continue
        const presented = found.map(row => present(provider, row, context))
        // a provider that failed for one organization or store is named too, beside its unavailable row
        if (!failedProviders.includes(provider.title) && presented.some(row => row.reasonCode === "PROVIDER_FAILED"))
            failedProviders.push(provider.title)
        checks.push(...presented)
        answered.push({
            providerKey: provider.providerKey,
            title: provider.title,
            ownerApp: provider.ownerApp,
            state: presented.reduce((worst, row) => (stateOrder[row.state] < stateOrder[worst] ? row.state : worst), "ready")
        })
    }
    const shown = p.state ? checks.filter(row => row.state === p.state) : checks
    return {checks: shown, providers: answered, failedProviders, checkedText: context.checkedText}
}

// ===== refresh =====
// request#Refresh: a registered refresh operation by its key, refused without its own permission; the owner's service is called
// as the viewer with the organization (refused outside the viewer's scope), the registration's key, the operation key, the reason
// and only the scope parameters the registration names. A failure of the owner's service is its safe result, not an error of the page.
function requestRefresh(p) {
    const userScope = admin.scope()
    const operation = registered("ironstone.admin.RefreshOperation", "refreshKey", {refreshKey: p.refreshKey || "_NA_"})[0]
    if (!operation) denied("REFRESH_UNAVAILABLE", "Refresh " + (p.refreshKey || "") + " is not available")
    if (!has(operation.requiredPermission))
        denied("REFRESH_DENIED", operation.requiredPermission + " is required to refresh " + operation.title)
    const scopeParameters = p.scopeParameters && typeof p.scopeParameters === "object" ? p.scopeParameters : {}
    // the organization is checked against the viewer's scope wherever the request names it, a scope parameter too; the
    // organization, operation key and reason never pass as scope parameters, whatever a registration lists
    const organizationPartyId = p.organizationPartyId || scopeParameters.organizationPartyId || null
    if (organizationPartyId) organizationsOf(userScope, organizationPartyId)
    const reserved = ["organizationPartyId", "operationKey", "reason", "refreshKey"]
    const allowed = String(operation.scopeParameters || "")
        .split(",")
        .map(name => name.trim())
        .filter(name => name && !reserved.includes(name))
    const parameters = Object.fromEntries(
        allowed.filter(name => scopeParameters[name] != null).map(name => [name, scopeParameters[name]])
    )
    if (organizationPartyId) parameters.organizationPartyId = organizationPartyId
    // the registration's key, so an owner with one service for several sources reads which (Insights' dataset indexes, F50)
    parameters.refreshKey = operation.refreshKey
    if (p.operationKey) parameters.operationKey = p.operationKey
    if (p.reason) parameters.reason = String(p.reason).slice(0, 255)
    const result = {refreshKey: operation.refreshKey, title: operation.title, completedText: ""}
    try {
        ownerCall(operation.serviceName, parameters)
        return Object.assign(result, {
            state: "requested",
            message: operation.title + " was requested",
            completedText: timeText(ec.user.nowTimestamp)
        })
    } catch (error) {
        ec.logger.error("Refresh " + operation.refreshKey + " (" + operation.serviceName + ") failed: " + error.message)
        return Object.assign(result, {state: "failed", message: operation.title + " could not be requested"})
    }
}

// ===== overview =====
// get#Overview: Home's needs-attention list (the failing and warning checks, worst first) and its health cards (failed job runs
// and sign-in failures of the last day, unresolved system messages, backup coverage), each card linking its list when the
// viewer opens it. An administrative reader's (ADMIN_OVERVIEW_VIEW).
function overview(p) {
    const userScope = admin.scope()
    if (!ec.user.hasPermission("ADMIN_OVERVIEW_VIEW")) denied("PERMISSION_DENIED", "ADMIN_OVERVIEW_VIEW is required")
    const found = readiness({organizationPartyId: p.organizationPartyId})
    const attention = found.checks
        .filter(row => row.state !== "ready")
        .sort((a, b) => stateOrder[a.state] - stateOrder[b.state])
        .slice(0, 10)
    const since = new Date(nowMs() - 24 * 60 * minute)
    const count = (label, read) => {
        try {
            return String(read())
        } catch (error) {
            ec.logger.error("Admin overview " + label + " not counted: " + error.message)
            return "Unavailable"
        }
    }
    const link = path => (admin.destinationOpens(userScope.grants, path) ? "/qapps/" + path : null)
    const backup = found.checks.find(row => row.checkKey === "admin.backup.job")
    const cards = [
        {
            key: "failedJobs",
            title: "Failed job runs",
            value: count("failed jobs", () =>
                find("moqui.service.job.ServiceJobRun")
                    .condition("hasError", "Y")
                    .condition("startTime", "greater-equals", since)
                    .count()
            ),
            icon: "sym_o_event_busy",
            url: link("Admin/System/ServiceJob/JobRuns")
        },
        {
            key: "transports",
            title: "Unresolved transports",
            value: count("transports", () =>
                find("moqui.service.message.SystemMessage").condition("statusId", "SmsgError").count()
            ),
            icon: "sym_o_sync_problem",
            url: link("Admin/System/SystemMessage/Message")
        },
        {
            key: "backup",
            title: "Backup coverage",
            value: backup?.coverage || "Unavailable",
            icon: "sym_o_backup",
            url: link("Admin/System/ServiceJob/Jobs/ServiceJobDetail?jobName=" + backupJob)
        },
        {
            key: "signIn",
            title: "Sign-in failures",
            value: count("sign-in failures", () =>
                find("moqui.security.UserLoginHistory")
                    .condition("successfulLogin", "N")
                    .condition("fromDate", "greater-equals", since)
                    .count()
            ),
            icon: "sym_o_lock_person",
            url: link("Admin/System/Visit")
        }
    ]
    return {attention, cards, failedProviders: found.failedProviders, checkedText: found.checkedText}
}

// ===== settings index =====
// find#Settings: the owners' settings landings the viewer may open, each shown only when its destination opens to the viewer's
// own groups (as the framework decides the path) and its view permission holds, grouped Company, Applications, Instance;
// searched by text in the query, by app and by group. For an Admin user, and for a BOSS user the settings index alone is
// granted to (impl-admin F46).
function settings(p) {
    const userScope = admin.scope()
    if (!userScope.read && !admin.settingsIndexOnly(userScope)) denied("ADMIN_UNAVAILABLE", "Admin is not available")
    const conditions = {}
    if (p.ownerApp) conditions.ownerApp = p.ownerApp
    if (p.settingsGroupEnumId) conditions.settingsGroupEnumId = p.settingsGroupEnumId
    let entries = registered("ironstone.admin.SettingsEntry", "settingsKey", conditions)
    const text = String(p.text || "").trim()
    if (text && entries.length) {
        const factory = ec.entity.conditionFactory
        const like = "%" + text.replace(/[\\%_]/g, character => "\\" + character) + "%"
        const matching = new Set(
            Array.from(
                find("ironstone.admin.SettingsEntry")
                    .condition(
                        "settingsKey",
                        "in",
                        entries.map(row => row.settingsKey)
                    )
                    .condition(
                        factory.makeCondition(
                            ["title", "description", "ownerApp", "configuredBy"].map(field =>
                                factory.makeCondition(field, "like", like).ignoreCase()
                            ),
                            "or"
                        )
                    )
                    .selectField("settingsKey")
                    .list()
            ).map(row => row.settingsKey)
        )
        entries = entries.filter(row => matching.has(row.settingsKey))
    }
    const groups = rows("moqui.basic.Enumeration", {enumTypeId: "AdminSettingsGroup"}).sort(
        (a, b) => Number(a.sequenceNum ?? 99) - Number(b.sequenceNum ?? 99)
    )
    const groupOrder = Object.fromEntries(groups.map(row => [row.enumId, Number(row.sequenceNum ?? 99)]))
    const groupNames = Object.fromEntries(groups.map(row => [row.enumId, row.description]))
    const scopeNames = enumNames("AdminRegistryScope")
    const healthOpens = userScope.read && userScope.capabilities?.operations
    const shown = []
    for (const entry of entries) {
        try {
            if (!has(entry.viewPermission)) continue
            if (!admin.destinationOpens(userScope.grants, entry.screenPath)) continue
            shown.push({
                settingsKey: entry.settingsKey,
                title: entry.title,
                description: entry.description || "",
                ownerApp: entry.ownerApp,
                settingsGroupEnumId: entry.settingsGroupEnumId,
                groupName: groupNames[entry.settingsGroupEnumId] || "",
                scopeName: scopeNames[entry.scopeEnumId] || "",
                configuredBy: entry.configuredBy || "",
                url: "/qapps/" + entry.screenPath,
                readinessUrl:
                    entry.providerKey && healthOpens
                        ? "/qapps/Admin/Operations/Health?providerKey=" + encodeURIComponent(entry.providerKey)
                        : null,
                sequence: groupOrder[entry.settingsGroupEnumId] ?? 99
            })
        } catch (error) {
            ec.logger.error("Admin settings entry " + entry.settingsKey + " was not checked: " + error.message)
        }
    }
    shown.sort((a, b) => a.sequence - b.sequence)
    return {
        entries: shown,
        appOptions: Array.from(
            new Set(registered("ironstone.admin.SettingsEntry", "settingsKey").map(row => row.ownerApp))
        ).sort(),
        groupOptions: groups.map(row => ({key: row.enumId, text: row.description}))
    }
}

// ===== readiness and support summary =====
// get#SupportSummary (design §16 "Readiness/support summary"; impl-admin P19): one projection for SupportSummary, its
// html-print and its redacted JSON, an administrative reader's (ADMIN_OVERVIEW_VIEW). It holds the instance (its display name,
// the framework's version and package, when it was prepared), the readiness checks the viewer may read (readiness() above:
// each provider's checks with their state, reason code, message, checked time and freshness, a provider that failed named),
// the protocols' states (get#ProtocolReadiness) and the effective settings (get#EffectiveSettings), each read with the
// viewer's own permissions: a section the viewer cannot read is marked unavailable with its reason, never shown empty. A
// secret setting is only "set" or "not set" (the settings service never answers its value). Never in it: the environment, the
// host's facts, listeners, paths, users, fix links, refresh keys or a check's diagnostics. Redacted (the JSON) also leaves out
// who prepared it and writes an email address in any text as [address], so the file can be given to someone outside.
const addressPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
// The settings that name the server's inside (review): the addresses a listener binds, the gateway addresses it admits and
// a certificate file's path. The screen and print show them to a viewer who reads them in InstanceSettings anyway; the
// redacted JSON, for someone outside, says only whether each is set. The public names (publicHost, publicAddress, domain,
// the public URLs) stay, as they are given to every browser and client.
const internalSetting = key =>
    /^protocol\.[a-z]+\.(host|listenHost|mediaHost|allowedAddresses)$/.test(String(key || "")) || /File$/.test(String(key || ""))
function supportSummary(p) {
    if (!ec.user.hasPermission("ADMIN_OVERVIEW_VIEW")) denied("PERMISSION_DENIED", "ADMIN_OVERVIEW_VIEW is required")
    const redacted = p.redacted === true || p.redacted === "true" || p.redacted === "Y"
    const clean = value => (value == null ? value : redacted ? String(value).replace(addressPattern, "[address]") : String(value))
    const calls = ec.resource.script("component://mr-boss/service/ironstone/admin/AdminCalls.js")
    const section = (name, parameters, fallback) => calls.read(name, parameters, fallback)
    // the instance
    const named = section("org.moqui.admin.ConfigurationServices.get#InstancePreference", {settingKey: "instance.displayName"})
    let report = {}
    try {
        report = ec.factory.getStartupReport() || {}
    } catch (error) {
        report = {}
    }
    const instance = {
        displayName: clean(named.out?.value || ""),
        version: String(report.version || ec.factory.moquiVersion || ""),
        packageName: String(report.package || ""),
        preparedDate: ec.user.nowTimestamp ? new Date(nowMs()).toISOString() : null,
        preparedText: timeText(ec.user.nowTimestamp),
        preparedBy: redacted ? null : ec.user.userAccount?.userFullName || ec.user.username || null
    }
    // the readiness checks the viewer may read
    let readinessSection
    try {
        const found = readiness({})
        readinessSection = {
            available: true,
            checkedText: found.checkedText,
            failedProviders: found.failedProviders,
            counts: Object.fromEntries(
                Object.keys(states).map(state => [state, found.checks.filter(row => row.state === state).length])
            ),
            checks: found.checks.map(row => ({
                providerKey: row.providerKey,
                providerTitle: row.providerTitle,
                ownerApp: row.ownerApp,
                groupName: row.groupName,
                checkKey: row.checkKey,
                title: row.title,
                subject: clean(row.subject),
                organizationPartyId: row.organizationPartyId,
                state: row.state,
                stateName: row.stateName,
                reasonCode: row.reasonCode,
                message: clean(row.message),
                coverage: clean(row.coverage),
                freshnessText: row.watermarkText
                    ? "Last " +
                      row.watermarkText +
                      (row.lagText ? ", " + row.lagText + " ago" : "") +
                      (row.expectedFrequencyText ? "; every " + row.expectedFrequencyText : "")
                    : row.expectedFrequencyText
                      ? "Every " + row.expectedFrequencyText
                      : "",
                lagMinutes: row.lagMinutes
            }))
        }
    } catch (error) {
        readinessSection = {
            available: false,
            reason: calls.reasonOf(error?.message) || "The checks are not available to you.",
            checks: []
        }
    }
    // the protocols
    const protocols = section(
        "org.moqui.admin.ConfigurationServices.get#ProtocolReadiness",
        {},
        "The protocols are not available to you."
    )
    const protocolSection = protocols.out
        ? {
              available: true,
              protocols: Array.from(protocols.out.protocolList || []).map(row => ({
                  protocolKey: row.protocolKey,
                  title: row.title,
                  built: !!row.built,
                  enabled: !!row.enabled,
                  state: row.state,
                  stateText: row.stateText,
                  reason: clean(row.reason || ""),
                  trustState: row.trustState || null,
                  checks: Array.from(row.checkList || []).map(check => ({
                      checkKey: check.checkKey,
                      title: check.title,
                      lastCheckPassed: check.lastCheckPassed ?? null,
                      lastCheckDate: check.lastCheckDate || null
                  }))
              }))
          }
        : {available: false, reason: protocols.failure, protocols: []}
    // the effective settings, a secret as set or not
    const settingsFound = section(
        "org.moqui.admin.ConfigurationServices.get#EffectiveSettings",
        {},
        "The settings are not available to you."
    )
    const settingSection = settingsFound.out
        ? {
              available: true,
              settings: Array.from(settingsFound.out.settingList || []).map(row => {
                  const hidden = redacted && internalSetting(row.settingKey) && !row.masked
                  const set = !(row.value === "" || row.value == null)
                  return {
                  settingKey: row.settingKey,
                  title: row.title,
                  settingGroup: row.settingGroup,
                  value: row.masked || hidden ? null : clean(row.value),
                  shownValue: hidden
                      ? set
                          ? "[internal] (set)"
                          : "Not set"
                      : row.masked
                      ? row.valueSet
                          ? "Hidden (set)"
                          : "Hidden (not set)"
                      : row.value === "" || row.value == null
                        ? "Not set"
                        : clean(row.value),
                  masked: !!row.masked,
                  internal: hidden,
                  valueSet: hidden ? set : !!row.valueSet,
                  source: row.source,
                  sourceText: row.sourceText,
                  restartRequired: !!row.restartRequired
                  }
              })
          }
        : {available: false, reason: settingsFound.failure, settings: []}
    return {
        summary: {
            kind: "ironstone.admin.supportSummary",
            formatVersion: 1,
            redacted,
            instance,
            readiness: readinessSection,
            protocols: protocolSection,
            settings: settingSection
        }
    }
}

const operations = {readiness, requestRefresh, overview, settings, adminSetup, supportSummary}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Admin registry operation " + op)
        return operations[op](parameters)
    }
})
