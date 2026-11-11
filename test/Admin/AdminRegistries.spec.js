// Admin's registries (impl-admin P2; design-admin §3, §7 SettingsHome, §10 Health, §14): readiness read from the providers each
// owner registers, a failing one named while the others answer, an unreadable one omitted and a row naming a missing service left
// out; on a fresh instance the backup check warns of the paused job and the unmirrored archive (F9); a Commerce store's summary
// for an administrative reader who opens no store; a refresh refused without its registration's permission; a settings entry
// hidden from a user its destination does not open to; and Home's one qvt render. The spec's own registrations (a provider that
// fails, one naming a missing service, a refresh operation) are its data, removed after. The settings index's grant to BOSS users
// is AdminAccess's; the "usable when" walk is the acceptance AdminRegistriesWalk.
// Run: ./moq test mr-boss --spec AdminRegistries
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const registry = "ironstone.admin.RegistryServices."
const failingKey = "spec.registries.failing"
const missingKey = "spec.registries.missing"
const refreshKey = "spec.registries.refresh"
const byKey = (rows, providerKey) => rows.filter(row => row.providerKey === providerKey)
const keys = rows => rows.map(row => row.settingsKey)

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
            const provider = {
                version: 1,
                ownerApp: "Admin",
                healthGroupEnumId: "AdmHgObservability",
                scopeEnumId: "AdmScInstance",
                requiredPermission: "ADMIN_OVERVIEW_VIEW",
                sequenceNum: 900
            }
            // a provider whose service exists and fails (check#AdminSetup knows no such check), and one naming no service
            create(
                "ironstone.admin.ReadinessProvider",
                Object.assign({}, provider, {
                    providerKey: failingKey,
                    title: "Spec failing check",
                    serviceName: "ironstone.admin.RegistryServices.check#AdminSetup"
                })
            )
            create(
                "ironstone.admin.ReadinessProvider",
                Object.assign({}, provider, {
                    providerKey: missingKey,
                    title: "Spec missing service",
                    serviceName: "ironstone.admin.RegistrySpec.missing#Service"
                })
            )
            // a refresh of Admin's job runs, the operations operator's: a harmless read stands for the owner's service
            create("ironstone.admin.RefreshOperation", {
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
            ec.entity.find("ironstone.admin.RefreshOperation").condition("refreshKey", refreshKey).deleteAll()
            ec.entity
                .find("ironstone.admin.ReadinessProvider")
                .condition("providerKey", "in", [failingKey, missingKey])
                .deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "readiness names a failing provider while the others answer, omits one the viewer cannot read and one naming no service",
    {
        when() {
            const reader = asUser(users.reader, () => invoke(registry + "get#Readiness", {}))
            const checks = Array.from(reader.checks || [])
            const problems = []
            const failing = byKey(checks, failingKey)
            if (failing.length !== 1 || failing[0].state !== "unavailable" || failing[0].reasonCode !== "PROVIDER_FAILED")
                problems.push(`the failing provider: ${JSON.stringify(failing)}`)
            if (!Array.from(reader.failedProviders || []).includes("Spec failing check"))
                problems.push(`failedProviders: ${reader.failedProviders}`)
            if (byKey(checks, missingKey).length) problems.push("the provider naming a missing service is shown")
            // the others answer: F9's two backup warnings on a fresh instance, and the mail server's check
            const backup = Object.fromEntries(byKey(checks, "admin.backup").map(row => [row.checkKey, row.reasonCode]))
            if (backup["admin.backup.job"] !== "BACKUP_PAUSED" || backup["admin.backup.mirror"] !== "BACKUP_NOT_MIRRORED")
                problems.push(`the backup checks: ${JSON.stringify(backup)}`)
            if (byKey(checks, "admin.mailServer").length !== 1) problems.push("no mail server check")
            // the reader holds no ACCOUNTING_VIEW: Accounting's provider is omitted, not shown failing; ADMIN reads it for an organization
            if (byKey(checks, "accounting.setup").length) problems.push("the reader gets Accounting's readiness")
            const accounting = asUser(users.system, () =>
                invoke(registry + "get#Readiness", {
                    providerKey: "accounting.setup",
                    organizationPartyId: ids.accountingOrganizationId
                })
            )
            if (!Array.from(accounting.checks || []).length) problems.push("ADMIN gets no Accounting readiness")
            // Commerce's stores of the reader's organization, as Commerce's summary, with no fix link into a store it does not open;
            // Services' store is not the reader's
            const stores = byKey(checks, "commerce.storeReadiness")
            if (!stores.some(row => row.organizationPartyId === ids.organizationId))
                problems.push(`no Retail store: ${JSON.stringify(stores)}`)
            if (stores.some(row => row.organizationPartyId === ids.otherOrganizationId)) problems.push("Services' store is shown")
            if (stores.some(row => row.fixUrl)) problems.push("the reader gets a store fix link")
            // another organization asked for is refused
            const other = asUser(users.reader, () =>
                refusal(registry + "get#Readiness", {organizationPartyId: ids.otherOrganizationId})
            )
            if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`Services' readiness: ${other || "given"}`)
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

feature("a refresh needs its registration's permission and the viewer's organization; an unregistered one is not available", {
    when() {
        const problems = []
        const request = {refreshKey, reason: "Spec", operationKey: "spec-refresh-1"}
        const reader = asUser(users.reader, () => refusal(registry + "request#Refresh", request))
        if (!reader.includes("REFRESH_DENIED")) problems.push(`the reader refreshes: ${reader || "accepted"}`)
        const operations = asUser(users.operations, () => refusal(registry + "request#Refresh", request))
        if (operations !== "") problems.push(`the operations operator is refused: ${operations}`)
        const result = asUser(users.operations, () => invoke(registry + "request#Refresh", request))
        if (result.state !== "requested") problems.push(`the refresh: ${JSON.stringify(result)}`)
        const otherOrganization = asUser(users.operations, () =>
            refusal(registry + "request#Refresh", Object.assign({organizationPartyId: ids.otherOrganizationId}, request))
        )
        if (!otherOrganization.includes("RECORD_UNAVAILABLE"))
            problems.push(`Services' refresh: ${otherOrganization || "accepted"}`)
        // an organization passed as a scope parameter the registration lists is checked the same
        const smuggled = asUser(users.operations, () =>
            refusal(
                registry + "request#Refresh",
                Object.assign({scopeParameters: {organizationPartyId: ids.otherOrganizationId}}, request)
            )
        )
        if (!smuggled.includes("RECORD_UNAVAILABLE"))
            problems.push(`Services' refresh by scope parameter: ${smuggled || "accepted"}`)
        const unknown = asUser(users.admin, () => refusal(registry + "request#Refresh", {refreshKey: "spec.registries.none"}))
        if (!unknown.includes("REFRESH_UNAVAILABLE")) problems.push(`an unregistered refresh: ${unknown || "accepted"}`)
        // Health offers it with the check it refreshes to the administrator, who holds both permissions, and not to the reader
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

feature("a settings entry shows only to those its destination opens to, and its view permission holds", {
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
        const instance = settings(users.system, {settingsGroupEnumId: "AdmSgInstance"})
        if (
            JSON.stringify(instance) !==
            // P11: Admin's Connections and Mail relays (design §14.2)
            JSON.stringify([
                "voice.system",
                "admin.instanceSettings",
                "admin.localization",
                "admin.referenceData",
                "admin.connections",
                "admin.mailRelays",
                "admin.protocols",
                // P13: Admin's Message types
                "admin.messageTypes",
                // P14: Admin's Notification topics
                "admin.topics"
            ])
        )
            problems.push(`the instance group: ${instance}`)
        // a Projects client is refused the index
        const client = asUser("sheldon.acme", () => refusal(registry + "find#Settings", {}))
        if (!/ADMIN_UNAVAILABLE|is not authorized/.test(client))
            problems.push(`a Projects client gets the index: ${client || "given"}`)
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
        home.output.includes("Setup checks")
        home.output.includes("Outgoing mail")
        home.output.includes("Sign-in failures")
        home.output.includes("Health")
        home.output.includes("Monitoring")
        home.output.includes("Settings")
        !home.output.includes("Developer tools")
        !home.output.includes("Not configured")
        !home.output.includes("Setup and health summaries are shown to administrative readers.")
    }
})

// Agents and Developer tools each alias their home file as Home; the file the directory adds is left out of the tabs
// (default-menu-include), and AgentsHome's destinations are screen paths under Admin (sharedLinks), not plain URLs.
feature("Agents and Developer tools show one tab each, and AgentsHome's destinations open under Admin", {
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
        return {agentTabs: tabs("Agents"), developerTabs: tabs("Developer"), agents}
    },
    then({agentTabs, developerTabs, agents}) {
        agentTabs == ["Home"]
        developerTabs == ["Home"]
        agents.errors == []
        agents.output.includes('href="/apps/Admin/Settings/Constitution"')
        !agents.output.includes('class="disabled"')
    }
})
