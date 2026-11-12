// Maintenance access (impl-maintenance §2, P1; design-maintenance §1.1, §1.2): who may open Maintenance and the context they get
// (a requester, another app's user, a client and a PASS account refused, and another root), the menu, keys, palette and launcher
// per group, each group's capabilities from its permissions (an edit permission alone reading nothing), a planner of Retail
// refused Services' organization and facility and Services' planner refused Retail's with the same parameters, the
// ironstone.maintenance services refused without the root grant, Home's one qvt render (its counters not configured) and
// Settings' one html render (the administrator's; the reader's a refusal), and Maintenance's rows in Admin's capability and
// settings registries (each bundle carrying exactly its group's grants, the settings entry the administrator's only). One feature
// per rule, each case of it a line of its problems, with artifact authorization enabled. Mantle's scope rules (a facility's and an
// asset's organization, assignment) are Mantle's MaintenanceScope. The access and isolation walk is the acceptance
// MaintenanceFoundationWalk. A later phase adds a case only for an access rule it adds.
// Run: ./moq test mr-boss --spec MaintenanceAccess
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, shell} = lib
const access = "ironstone.maintenance.AccessServices."
const contextServices = "ironstone.maintenance.ContextServices."
const context = contextServices + "get#SharedContext"
const checkRecord = access + "check#Record"
const choices = contextServices + "get#Choices"
const registry = "ironstone.admin.RegistryServices."
// a refusal of a user without Maintenance: the service is not authorized for them, or it refuses them
const refused = message => /MAINTENANCE_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// a spec-local Maintenance user whose only capability group holds MAINTENANCE_PLAN, an agent of Services
const editOnly = "MNT_SPEC_EDIT_ONLY"

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#moqui.security.UserGroup", {userGroupId: editOnly, description: "Maintenance spec: plan alone"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: editOnly,
                userPermissionId: "MAINTENANCE_PLAN",
                fromDate: 0
            })
            call("create#mantle.party.Party", {partyId: editOnly, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: editOnly, firstName: "Maintenance spec", lastName: "Plan only"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: editOnly,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: editOnly,
                username: "maint.spec.planonly",
                partyId: editOnly,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_MAINTENANCE", editOnly])
                call("create#moqui.security.UserGroupMember", {userId: editOnly, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec user's memberships end, so no later spec meets a Maintenance user it does not know
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", editOnly)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a Maintenance user gets their context; another root, a requester, another app's user, a client and a PASS account are refused",
    {
        when() {
            const problems = []
            const planner = asUser(users.planner, () => invoke(context, {}))
            if (
                !planner.organizationPartyIds.includes(ids.organizationId) ||
                planner.organizationPartyIds.includes(ids.otherOrganizationId)
            )
                problems.push(`the planner's organizations: ${planner.organizationPartyIds}`)
            if (
                planner.appRoot !== "Maintenance" ||
                planner.sharedLinks?.Home !== "//Maintenance/Home" ||
                planner.allOrganizations
            )
                problems.push(`the planner's context: ${JSON.stringify(planner)}`)
            const otherRoot = asUser(users.planner, () => refusal(context, {appRoot: "Warehouse"}))
            if (!otherRoot.includes("MAINTENANCE_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
            for (const user of [users.requester, users.otherApp, users.client, users.pass]) {
                const message = asUser(user, () => refusal(context, {}))
                if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
            }
            for (const user of [users.requester, users.client, users.pass]) {
                const home = screenRefusal(user, "Home")
                if (!unauthorized(home)) problems.push(`${user} opens Home: ${home || "opened"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the Maintenance menu, keys and palette follow the groups; the launcher shows Maintenance to its users only", {
    when() {
        const problems = []
        const planner = shell(users.planner)
        if (planner.status != 200 || JSON.stringify(planner.names) !== JSON.stringify(ids.staffMenu))
            problems.push(`the planner's menu: ${planner.status} ${planner.names}`)
        const keymap = (planner.providers?.keymaps || []).find(keymap => keymap.scope === "maintenance")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(ids.keys)) problems.push(`the planner's maintenance keys: ${keys}`)
        if (!JSON.stringify(planner.providers || {}).includes("Maintenance records"))
            problems.push(`the planner's palette has no Maintenance source: ${JSON.stringify(planner.providers)}`)
        if (!planner.apps.includes("Maintenance")) problems.push(`the planner's launcher has no Maintenance: ${planner.apps}`)
        for (const user of [users.admin, users.system]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.adminMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        const settings = shell(users.admin, true, "Settings/SettingsHome", "Settings")
        if (JSON.stringify(settings.names) !== JSON.stringify(ids.settingsMenu))
            problems.push(`the administrator's Settings tabs: ${settings.status} ${settings.names}`)
        for (const user of [users.requester, users.otherApp])
            if (shell(user).apps.includes("Maintenance")) problems.push(`${user} has Maintenance`)
        // the palette answers nothing yet (its records join with their screens), and nothing to a user without Maintenance
        const rows = user => asUser(user, () => invoke(contextServices + "search#Records", {text: "a"}).rows || [])
        if (rows(users.planner).length) problems.push(`the planner's palette rows: ${JSON.stringify(rows(users.planner))}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const capabilityNames = [
    "view",
    "assignedView",
    "request",
    "requestViewOwn",
    "plan",
    "execute",
    "supervise",
    "costView",
    "resourceView",
    "resourceEdit",
    "settingsEdit",
    "import",
    "processView",
    "processEdit",
    "processApprove",
    "bookingViewAssigned",
    "bookingApprove",
    "policyView",
    "policyEdit",
    "facilityEdit",
    // the reads, from view permissions only
    "workRead",
    "resourceRead",
    "anyRead",
    // the Settings area, the Maintenance administrator's
    "settings"
]
const reads = ["workRead", "resourceRead", "anyRead"]
// design §1.1's table
const capabilityUsers = [
    {user: users.reader, granted: ["view", "processView", ...reads]},
    {user: users.planner, granted: ["view", "plan", "processView", ...reads]},
    {user: users.tech, granted: ["assignedView", "execute", ...reads]},
    {user: users.supervisor, granted: ["view", "supervise", "processView", ...reads]},
    {user: users.author, granted: ["processView", "processEdit", "anyRead"]},
    {user: users.approver, granted: ["processView", "processApprove", "anyRead"]},
    {user: users.booking, granted: ["bookingViewAssigned", "bookingApprove", "anyRead"]},
    {
        user: users.resources,
        granted: ["resourceView", "resourceEdit", "import", "policyView", "policyEdit", "facilityEdit", "resourceRead", "anyRead"]
    },
    {user: users.cost, granted: ["view", "costView", ...reads]},
    {
        user: users.admin,
        granted: ["view", "settingsEdit", "resourceView", "processView", "policyView", "settings", ...reads]
    },
    {user: "maint.spec.planonly", granted: ["plan"]},
    {user: users.system, granted: capabilityNames}
]
feature("each group holds exactly the capabilities of its permissions; an edit permission alone reads nothing", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const found = asUser(user, () => ({
                context: invoke(context, {}).capabilities || {},
                own: invoke(access + "get#Capabilities", {}).capabilities || {}
            }))
            const held = capabilityNames.filter(name => found.context[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (found.context.read !== true || found.own.read !== true) problems.push(`${user} does not open Maintenance`)
            if (JSON.stringify(capabilityNames.filter(name => found.own[name])) !== JSON.stringify(held))
                problems.push(`${user}'s get#Capabilities differs from the context`)
        }
        // the planner-only user reads no organization, no facility and no choice
        const editor = asUser("maint.spec.planonly", () => ({
            context: invoke(context, {}),
            facility: refusal(checkRecord, {recordType: "facility", recordId: ids.facilityId}),
            organizations: invoke(choices, {choice: "organizations"}).options
        }))
        if (editor.context.organizationPartyIds.length)
            problems.push(`the editor's organizations: ${editor.context.organizationPartyIds}`)
        if (!editor.facility.includes("RECORD_UNAVAILABLE"))
            problems.push(`the editor reads a facility: ${editor.facility || "given"}`)
        if (editor.organizations.length) problems.push(`the editor's organizations: ${JSON.stringify(editor.organizations)}`)
        // a requester's get#Capabilities is refused by the root's service grant, not answered
        const requester = asUser(users.requester, () => refusal(access + "get#Capabilities", {}))
        if (!refused(requester)) problems.push(`the requester's capabilities: ${requester || "given"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a planner of Retail is refused Services' organization and facility, and Services' planner Retail's, with the same parameters",
    {
        when() {
            const problems = []
            const expect = (label, message, refusalText) => {
                if (refusalText ? !message.includes(refusalText) : message !== "")
                    problems.push(`${label}: ${message || "accepted"}`)
            }
            asUser(users.planner, () => {
                expect("Services", refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}))
                expect(
                    "Retail",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.otherOrganizationId}),
                    "RECORD_UNAVAILABLE"
                )
                expect("Services' plant", refusal(checkRecord, {recordType: "facility", recordId: ids.facilityId}))
                expect(
                    "Retail's warehouse",
                    refusal(checkRecord, {recordType: "facility", recordId: ids.otherFacilityId}),
                    "RECORD_UNAVAILABLE"
                )
                expect(
                    "Retail's forklift",
                    refusal(checkRecord, {recordType: "asset", recordId: ids.otherAssetId}),
                    "RECORD_UNAVAILABLE"
                )
                expect(
                    "a plan capability",
                    refusal(checkRecord, {recordType: "facility", recordId: ids.facilityId, capability: "plan"})
                )
                expect(
                    "a supervise capability",
                    refusal(checkRecord, {recordType: "facility", recordId: ids.facilityId, capability: "supervise"}),
                    "PERMISSION_DENIED"
                )
                const facilities = invoke(choices, {choice: "facilities"}).options.map(option => option.value)
                if (!facilities.includes(ids.facilityId) || facilities.includes(ids.otherFacilityId))
                    problems.push(`the planner's facilities: ${facilities}`)
            })
            asUser(users.retailPlanner, () => {
                expect(
                    "Retail (Retail's planner)",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.otherOrganizationId})
                )
                expect(
                    "Services (Retail's planner)",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}),
                    "RECORD_UNAVAILABLE"
                )
                expect(
                    "Retail's warehouse (Retail's planner)",
                    refusal(checkRecord, {recordType: "facility", recordId: ids.otherFacilityId})
                )
                expect(
                    "Retail's forklift (Retail's planner)",
                    refusal(checkRecord, {recordType: "asset", recordId: ids.otherAssetId})
                )
                expect(
                    "Services' plant (Retail's planner)",
                    refusal(checkRecord, {recordType: "facility", recordId: ids.facilityId}),
                    "RECORD_UNAVAILABLE"
                )
                const organizations = invoke(choices, {choice: "organizations"}).options.map(option => option.value)
                if (!organizations.includes(ids.otherOrganizationId) || organizations.includes(ids.organizationId))
                    problems.push(`Retail's planner's organizations: ${organizations}`)
            })
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the ironstone.maintenance services are refused without the root grant", {
    when() {
        const problems = []
        for (const user of [users.requester, users.otherApp, users.client]) {
            const found = asUser(user, () => ({
                check: refusal(checkRecord, {recordType: "facility", recordId: ids.facilityId}),
                choices: refusal(choices, {choice: "organizations"}),
                search: refusal(contextServices + "search#Records", {text: "a"})
            }))
            for (const [name, message] of Object.entries(found))
                if (!refused(message)) problems.push(`${user}'s ${name}: ${message || "accepted"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Home shows the planner their organization and the counters not configured; Settings is the administrator's", {
    when() {
        const plannerHome = asUser(users.planner, () =>
            page("Home", {organizationPartyId: ids.organizationId, facilityId: ids.facilityId})
        )
        const otherHome = asUser(users.planner, () => page("Home", {organizationPartyId: ids.otherOrganizationId}, "html"))
        const settings = asUser(users.admin, () => page("Settings", {}, "html"))
        return {plannerHome, otherHome, settings, readerSettings: screenRefusal(users.reader, "Settings")}
    },
    then({plannerHome, otherHome, settings, readerSettings}) {
        plannerHome.errors.length == 0
        plannerHome.output.includes("Counters")
        plannerHome.output.includes("Open work orders")
        plannerHome.output.includes("Not configured")
        plannerHome.output.includes("Ziziwork Services")
        !plannerHome.output.includes("is not available to you")
        // the planner has no Settings shortcut
        !plannerHome.output.includes("Shortcuts")
        otherHome.output.includes("This organization is not available to you.")
        settings.errors.length == 0
        settings.output.includes("Maintenance settings")
        settings.output.includes("Work policy")
        unauthorized(readerSettings)
    }
})

feature(
    "Admin's registries hold each Maintenance bundle with exactly its group's grants, and show the settings entry to the administrator only",
    {
        when() {
            const problems = []
            system(() => {
                const bundles = Array.from(
                    ec.entity.find("moqui.security.CapabilityBundle").condition("appName", "Maintenance").list()
                ).map(row => row.userGroupId)
                const expected = [
                    "READ",
                    "REQUEST",
                    "PLAN",
                    "EXECUTE",
                    "SUPERVISE",
                    "PROCEDURE",
                    "PROCEDURE_APPROVE",
                    "BOOKING_APPROVE",
                    "RESOURCE_ADMIN",
                    "COST",
                    "ADMIN"
                ]
                    .map(name => "BOSS_MAINTENANCE_" + name)
                    .concat(["BOSS_MAINTENANCE"])
                if (JSON.stringify(bundles.slice().sort()) !== JSON.stringify(expected.slice().sort()))
                    problems.push(`the bundles: ${bundles}`)
                for (const userGroupId of bundles) {
                    const carried = Array.from(
                        ec.entity.find("moqui.security.CapabilityBundlePermission").condition("userGroupId", userGroupId).list()
                    )
                        .map(row => row.userPermissionId)
                        .sort()
                    const granted = Array.from(
                        ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", userGroupId).list()
                    )
                        .map(row => row.userPermissionId)
                        .sort()
                    if (JSON.stringify(carried) !== JSON.stringify(granted))
                        problems.push(`${userGroupId} carries ${carried}, granted ${granted}`)
                }
                const launcher = ec.entity
                    .find("moqui.security.CapabilityBundleArtifact")
                    .condition("userGroupId", "BOSS_MAINTENANCE")
                    .list()
                if (launcher.size() !== 1 || launcher.get(0).artifactGroupId !== "BOSS_MAINTENANCE")
                    problems.push("the launcher's artifact")
                const imports = ec.entity
                    .find("moqui.security.CapabilityBundlePermission")
                    .condition({userPermissionId: "MAINTENANCE_IMPORT"})
                    .list()
                if (imports.size() !== 1 || imports.get(0).userGroupId !== "BOSS_MAINTENANCE_RESOURCE_ADMIN")
                    problems.push("MAINTENANCE_IMPORT is not the resource administrator's bundle alone")
            })
            const settingsKeys = user =>
                Array.from(asUser(user, () => invoke(registry + "find#Settings", {})).entries || []).map(
                    entry => entry.settingsKey
                )
            if (!settingsKeys(users.admin).includes("maintenance.settings"))
                problems.push("the administrator has no maintenance.settings")
            if (settingsKeys(users.reader).includes("maintenance.settings")) problems.push("the reader has maintenance.settings")
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
