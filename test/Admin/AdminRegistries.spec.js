// Admin over the framework's registries (impl-admin P2; design-admin §3, §7 SettingsHome, §10 Health, §14; mr-moqui
// plans/Admin-Screens-Down.md A6). The registries' own rules (a failing provider named, one not readable or naming no service
// left out, a refresh's permission, a settings entry's screen, the support summary's redaction) are the framework's
// AdminReadiness spec. Here is what is Admin's: its contract service over the owners that keep their own shapes (Accounting's
// setup for a holder of ACCOUNTING_VIEW, an instance administrator among them; a Commerce store's summary for an
// administrative reader, in the organizations the reader administers only), an organization outside the viewer's scope
// refused, a fix place shown only where it opens, the BOSS registrations in the settings index, Health's refresh through
// Admin's route, and the one render of Home and of the support summary. The spec's own registrations (a provider that
// fails, a refresh operation) are its data, removed after. The settings index's grant to BOSS users is AdminAccess's; the
// "usable when" walk is the acceptance AdminRegistriesWalk.
// Run: ./moq test mr-boss --spec AdminRegistries
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const registry = "org.moqui.admin.ReadinessServices."
const adapter = "ironstone.admin.RegistryServices."
const failingKey = "spec.registries.failing"
const refreshKey = "spec.registries.refresh"
const byKey = (rows, providerKey) => rows.filter(row => row.providerKey === providerKey)
const keys = rows => rows.map(row => row.settingsKey)
const organizationOf = row => row.scope?.organizationPartyId || null

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const create = (entityName, fields) =>
                ec.service
                    .sync()
                    .name("create#" + entityName)
                    .parameters(fields)
                    .call()
            // a provider whose service exists and fails (check#InstanceSetup knows no such check), named on Home
            create("moqui.server.ReadinessProvider", {
                providerKey: failingKey,
                version: 1,
                ownerApp: "System",
                title: "Spec failing check",
                healthGroupEnumId: "AdmHgObservability",
                scopeEnumId: "AdmScInstance",
                requiredPermission: "ADMIN_OVERVIEW_VIEW",
                serviceName: "org.moqui.admin.ReadinessServices.check#InstanceSetup",
                sequenceNum: 900
            })
            // a refresh the operations operator may run, which takes an organization: a harmless read stands for the
            // owner's service
            create("moqui.server.RefreshOperation", {
                refreshKey,
                version: 1,
                ownerApp: "Admin",
                title: "Spec refresh",
                serviceName: "mantle.party.PartyServices.get#PartyOrganizationInfo",
                sourceKindEnumId: "AdmRsProjection",
                requiredPermission: "ADMIN_OPERATION_MANAGE",
                scopeParameters: "organizationPartyId",
                providerKey: "admin.jobRuns"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            ec.entity.find("moqui.server.RefreshOperation").condition("refreshKey", refreshKey).deleteAll()
            ec.entity.find("moqui.server.ReadinessProvider").condition("providerKey", failingKey).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "Admin's contract service answers each owner for the organizations the viewer administers; another organization is refused and a fix place opens only to its users",
    {
        when() {
            const reader = asUser(users.reader, () => invoke(registry + "get#Readiness", {}))
            const checks = Array.from(reader.checks || [])
            const problems = []
            // the framework's own checks answer under Admin: F9's two backup warnings on a fresh instance
            const backup = Object.fromEntries(byKey(checks, "admin.backup").map(row => [row.checkKey, row.reasonCode]))
            if (backup["admin.backup.job"] !== "BACKUP_PAUSED" || backup["admin.backup.mirror"] !== "BACKUP_NOT_MIRRORED")
                problems.push(`the backup checks: ${JSON.stringify(backup)}`)
            // the reader holds no ACCOUNTING_VIEW: Accounting's provider is left out, not shown failing; ADMIN reads it for an
            // organization
            if (byKey(checks, "accounting.setup").length) problems.push("the reader gets Accounting's readiness")
            if (Array.from(reader.failedProviders || []).some(title => /Accounting|Catalog/.test(title)))
                problems.push(`an owner the reader may not read is named: ${reader.failedProviders}`)
            const accounting = asUser(users.system, () =>
                invoke(registry + "get#Readiness", {
                    providerKey: "accounting.setup",
                    scopeParameters: {organizationPartyId: ids.accountingOrganizationId}
                })
            )
            const accountingChecks = Array.from(accounting.checks || [])
            if (!accountingChecks.length) problems.push("ADMIN gets no Accounting readiness")
            if (accountingChecks.some(row => organizationOf(row) !== ids.accountingOrganizationId || !row.subject))
                problems.push(`Accounting's checks name another organization: ${JSON.stringify(accountingChecks)}`)
            // Commerce's stores of the reader's organization, as Commerce's summary; Services' store is not the reader's
            const stores = byKey(checks, "commerce.storeReadiness")
            if (!stores.some(row => organizationOf(row) === ids.organizationId))
                problems.push(`no Retail store: ${JSON.stringify(stores)}`)
            if (stores.some(row => organizationOf(row) === ids.otherOrganizationId)) problems.push("Services' store is shown")
            // a store's fix place is a key; Admin's screens link it only where it opens: not to the reader, who opens no store
            const storePath = "Commerce/Stores/StoreDetail?productStoreId=SPEC"
            const paths = [storePath, "Admin/Operations/JobRuns?state=failed", "Admin/Settings/Constitution"]
            const opens = user => Array.from(asUser(user, () => invoke(adapter + "get#OpenPaths", {paths})).open || [])
            if (stores.some(row => row.fixUrl)) problems.push("a check carries a URL")
            if (JSON.stringify(opens(users.reader)) !== JSON.stringify([false, true, false]))
                problems.push(`the reader's places: ${opens(users.reader)}`)
            if (JSON.stringify(opens(users.system)) !== JSON.stringify([true, true, true]))
                problems.push(`ADMIN's places: ${opens(users.system)}`)
            // another organization asked for: every organization's provider refuses it and is left out, and the contract
            // service itself says why
            const other = asUser(users.reader, () =>
                invoke(registry + "get#Readiness", {scopeParameters: {organizationPartyId: ids.otherOrganizationId}})
            )
            if (Array.from(other.checks || []).length || Array.from(other.failedProviders || []).length)
                problems.push(`Services' readiness: ${JSON.stringify(other.checks)}`)
            const refused = asUser(users.reader, () =>
                refusal(adapter + "check#OwnerReadiness", {
                    providerKey: "commerce.storeReadiness",
                    organizationPartyId: ids.otherOrganizationId
                })
            )
            if (!refused.includes("RECORD_UNAVAILABLE")) problems.push(`Services' stores: ${refused || "given"}`)
            return {
                problems,
                unknownStates: checks.filter(row => !["ready", "warning", "failed", "unavailable"].includes(row.state))
            }
        },
        then({problems, unknownStates}) {
            problems.join("\n") == ""
            unknownStates.length == 0
        }
    }
)

feature("Health's refresh runs a registered operation for an organization the user administers, and refuses another", {
    when() {
        const problems = []
        const post = (user, organizationPartyId) =>
            asUser(user, () => {
                const got = lib.page(
                    "Operations/Health/requestRefresh",
                    {
                        refreshKey,
                        reason: "Spec",
                        operationKey: "spec-refresh-" + organizationPartyId,
                        scopeJson: JSON.stringify({organizationPartyId})
                    },
                    "html"
                )
                return got.errors.join(" ")
            })
        const own = post(users.operations, ids.organizationId)
        if (own !== "") problems.push(`the operations operator's refresh: ${own}`)
        const other = post(users.operations, ids.otherOrganizationId)
        if (!other.includes("is not available")) problems.push(`Services' refresh: ${other || "accepted"}`)
        const reader = post(users.reader, ids.organizationId)
        if (!reader.includes("ADMIN_OPERATION_MANAGE")) problems.push(`the reader refreshes: ${reader || "accepted"}`)
        // Health offers it with the check it refreshes to the administrator, who holds the permission, and not to the reader
        const offered = user =>
            byKey(
                Array.from(asUser(user, () => invoke(registry + "get#Readiness", {providerKey: "admin.jobRuns"})).checks || []),
                "admin.jobRuns"
            )
        if (offered(users.admin)[0]?.refreshKey !== refreshKey) problems.push("the administrator is not offered the refresh")
        if (offered(users.reader)[0]?.refreshKey) problems.push("the reader is offered the refresh")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the settings index lists each BOSS app's settings only to those its screen opens to", {
    when() {
        const settings = (user, parameters = {}) =>
            keys(Array.from(asUser(user, () => invoke(registry + "find#Settings", parameters)).entries || []))
        const problems = []
        // the warehouse manager, in no Admin group, sees Warehouse's and not the apps it does not open
        const manager = settings(lib.outsiders.warehouseManager)
        if (!manager.includes("warehouse.settings")) problems.push(`the warehouse manager lacks Warehouse: ${manager}`)
        for (const key of ["accounting.settings", "products.settings", "commerce.checkout", "voice.system"])
            if (manager.includes(key)) problems.push(`the warehouse manager gets ${key}`)
        // Comms' Consent opens to every BOSS user and needs CONTACT_ADMIN: hidden from the manager, shown to ADMIN
        if (manager.includes("comms.consent")) problems.push("the warehouse manager gets Consent")
        // the reader opens no business app and not the configuration administrator's screens: only Admin's reference data
        // landing (P8), every Admin user's, which lists it no owner's kind; ADMIN every entry
        const reader = settings(users.reader)
        if (JSON.stringify(reader) !== JSON.stringify(["admin.referenceData"])) problems.push(`the reader gets ${reader}`)
        const all = settings(users.system)
        for (const key of [
            "accounting.settings",
            "warehouse.settings",
            "manufacturing.settings",
            "comms.consent",
            "voice.system"
        ])
            if (!all.includes(key)) problems.push(`ADMIN lacks ${key}`)
        // searched by text, ignoring case, and by group
        const found = settings(users.system, {text: "STOCK"})
        if (JSON.stringify(found) !== JSON.stringify(["warehouse.settings"])) problems.push(`"STOCK" finds ${found}`)
        // the framework's entries of the screens Admin shows are seeded again here with Admin's own screens, so they open
        // to Admin's users under its mount
        const instance = Array.from(
            asUser(users.system, () => invoke(registry + "find#Settings", {settingsGroupEnumId: "AdmSgInstance"})).entries || []
        )
        if (
            JSON.stringify(keys(instance)) !==
            JSON.stringify([
                "voice.system",
                "admin.instanceSettings",
                "admin.localization",
                "admin.referenceData",
                "admin.connections",
                "admin.mailRelays",
                "admin.protocols",
                "admin.messageTypes",
                "admin.topics"
            ])
        )
            problems.push(`the instance group: ${keys(instance)}`)
        const owners = Array.from(new Set(instance.map(row => row.ownerApp))).sort()
        if (JSON.stringify(owners) !== JSON.stringify(["Admin", "Voice"])) problems.push(`the instance group's owners: ${owners}`)
        const configure = settings(users.configure, {settingsGroupEnumId: "AdmSgInstance"})
        if (!configure.includes("admin.instanceSettings") || configure.includes("admin.connections"))
            problems.push(`the configuration administrator's instance settings: ${configure}`)
        // a Projects client opens none of them
        const client = asUser("sheldon.acme", () => {
            const refused = refusal(registry + "find#Settings", {})
            return refused || keys(Array.from(invoke(registry + "find#Settings", {}).entries || [])).join(",")
        })
        if (client !== "" && !/is not authorized/.test(client)) problems.push(`a Projects client gets the index: ${client}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Home shows the reader's shortcuts, what needs attention, the setup checks and the health cards", {
    when() {
        return {home: asUser(users.reader, () => lib.page("Home"))}
    },
    then({home}) {
        home.status == 200
        home.errors == []
        home.output.includes("Needs attention")
        home.output.includes("Backups are not mirrored off the server")
        home.output.includes("The nightly database backup is paused")
        home.output.includes("Could not be checked: Spec failing check")
        // a fix place is a link only where it opens: the reader opens Operations, and not Integrations
        home.output.includes("/qapps/Admin/Operations/JobDetail?jobName=backup_EmbeddedDatabase_daily")
        !home.output.includes("/qapps/Admin/Integrations/ConnectionDetail")
        home.output.includes("Setup checks")
        home.output.includes("Outgoing mail")
        home.output.includes("Sign-in failures")
        home.output.includes("Health")
        home.output.includes("Monitoring")
        home.output.includes("Settings")
        // the framework's Tools are linked only to a user their own grant opens them to (an Admin grant opens none)
        !home.output.includes("/qapps/tools")
        !home.output.includes("Not configured")
        !home.output.includes("Setup and health summaries are shown to administrative readers.")
    }
})

// Health is Admin's own screen around the framework's sections: the organization filter, the checks of the reader's
// organization, and no link into a store the reader does not open
feature("Health shows the reader the checks of an organization they administer, with the organization as a filter", {
    when() {
        return {
            health: asUser(users.reader, () => lib.page("Operations/Health", {organizationPartyId: ids.organizationId}, "html")),
            other: asUser(users.reader, () => lib.page("Operations/Health", {organizationPartyId: ids.otherOrganizationId}, "html"))
        }
    },
    then({health, other}) {
        health.status == 200
        health.errors == []
        health.output.includes("Organization")
        health.output.includes("Store readiness")
        // a check is named by its title alone where it is its provider's, "Provider: Check" where they differ
        !health.output.includes("Store readiness: Store readiness")
        health.output.includes("Check again")
        health.output.includes("Support summary")
        // the framework's header, with the sign-in failures of the last day for a reader of the overview's
        health.output.includes("Sign-in failures, last 24 hours")
        // the instance's checks take no organization: with one asked for they are left out
        !health.output.includes("Outgoing mail")
        !health.output.includes("/qapps/Commerce/Stores/StoreDetail")
        // another organization is refused before any provider is asked
        other.output.includes("is not available")
        !other.output.includes("Store readiness")
    }
})

// Agents aliases its home file as Home; the file the directory adds is left out of the tabs
// (default-menu-include), and AgentsHome's destinations are screen paths under Admin (sharedLinks), not plain URLs.
feature("Agents shows one tab, and AgentsHome's destinations open under Admin", {
    when() {
        const root = "component://webroot/screen/webroot.xml"
        const tabs = area =>
            asUser(users.system, () => {
                const menu = ec.screen.makeTest().rootScreen(root).render(`menuData/apps/Admin/${area}/Home`, {}, null)
                const level = JSON.parse(menu.output).find(level => level.name === area)
                return level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : null
            })
        const agents = asUser(users.system, () => {
            const result = ec.screen.makeTest().rootScreen(root).renderMode("html").render("apps/Admin/Agents/Home", {}, null)
            const output = String(result.output || "")
            const errors = Array.from(result.errorMessages || []).concat(
                output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
            )
            ec.message.clearErrors()
            return {output, errors}
        })
        return {agentTabs: tabs("Agents"), agents}
    },
    then({agentTabs, agents}) {
        agentTabs == ["Home"]
        agents.errors == []
        agents.output.includes('href="/apps/Admin/Settings/Constitution"')
        !agents.output.includes('class="disabled"')
    }
})

// P19: the readiness and support summary (design §16) under Admin: the framework's System screen by location, its one render
// and its JSON through Admin's route, for the reader and the administrator; a user outside the overview is refused. The
// projection's own rules are the framework's AdminReadiness spec.
feature("the support summary holds the readable checks, protocols and settings; its JSON is redacted; a non-reader is refused", {
    when() {
        const address = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
        const redacted = asUser(users.reader, () => invoke(registry + "get#SupportSummary", {redacted: true})).summary
        const plain = asUser(users.admin, () => invoke(registry + "get#SupportSummary", {})).summary
        const adminRedacted = asUser(users.admin, () => invoke(registry + "get#SupportSummary", {redacted: true})).summary
        return {
            redacted,
            plain,
            adminRedacted,
            redactedText: JSON.stringify(redacted),
            address,
            outsider: asUser(users.privacy, () => refusal(registry + "get#SupportSummary", {})),
            screen: asUser(users.admin, () => lib.page("Operations/SupportSummary")),
            download: asUser(users.admin, () => {
                const got = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Admin.xml")
                    .render("Operations/SupportSummary/summaryJson", {}, "GET")
                return {status: got.status, output: String(got.output || "")}
            })
        }
    },
    then({redacted, plain, adminRedacted, redactedText, address, outsider, screen, download}) {
        redacted.redacted == true
        redacted.instance.preparedBy == null
        redacted.instance.version.length > 0
        redacted.readiness.available == true
        redacted.readiness.checks.length > 0
        !redactedText.includes("fixRoute")
        !redactedText.includes("refreshKey")
        !address.test(redactedText)
        // review: a listener's bind address, the gateway addresses and a certificate path are not in the redacted JSON
        adminRedacted.settings.settings.filter(row => /\.(host|listenHost|mediaHost|allowedAddresses)$|File$/.test(row.settingKey))
            .length > 0
        adminRedacted.settings.settings.filter(row => /\.(host|listenHost|mediaHost|allowedAddresses)$|File$/.test(row.settingKey))
            .every(row => row.internal && row.value == null)
        plain.settings.settings.every(row => !row.internal)
        plain.redacted == false
        plain.instance.preparedBy != null
        plain.settings.available == true
        plain.settings.settings.length > 0
        plain.settings.settings.filter(row => row.masked).every(row => row.value == null && row.shownValue.startsWith("Hidden"))
        plain.protocols.available == true
        outsider.includes("ADMIN_OVERVIEW_VIEW")
        screen.status == 200
        screen.errors.length == 0
        screen.output.includes("Effective settings")
        screen.output.includes("Download JSON")
        download.status == 200
        JSON.parse(download.output).redacted == true
        JSON.parse(download.output).instance.preparedBy == null
    }
})
