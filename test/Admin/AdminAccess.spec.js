// Admin access (impl-admin §2, P1, P2, P3; design-admin §1.1, §5, §7, §13): who may open Admin, the menu (P3: the Access area
// for the access administrators and the administrator), providers and launcher (the
// reader, the administrator and an instance administrator), each group's capabilities from its permissions and
// the area authorizations, Admin › System refused to the Admin administrator and opened to ADMIN with the developer tool links
// each by its own grant, the seals mr-boss and the framework add (a privileged group's membership and a sealed grant through a
// direct entity call) beside the refused raw security mutators, and the organization scope of a record (another organization's
// identity refused, a shared identity shown only by the organization in scope; P6: what an identity owns by the same scope), and the settings index a BOSS user without Admin
// opens alone (P2, F46). Home's one render (qvt) is AdminRegistries'. One feature per rule, each case of it a line of
// its problems, with artifact authorization enabled. The framework's seal checks are the framework's (eca_tests.rs). The access
// and isolation walk is the acceptance AdminFoundationWalk. A later phase adds a case only for an access rule it adds, and its
// providers to the menu feature.
// Run: ./moq test mr-boss --spec Admin/AdminAccess
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const context = "ironstone.admin.ContextServices."
// a refusal of a user without Admin: the service is not authorized for them, or it refuses them
const refused = message => /ADMIN_UNAVAILABLE|is not authorized/.test(message)
const values = result => Array.from(result.options || []).map(row => row.value)
// the spec's own group that may write the security entities directly (so the seals, not entity authorization, decide), and
// the group the grants go to
const sealGroup = "ADMIN_SPEC_SEAL"
const targetGroup = "ADMIN_SPEC_TARGET"
const sealMembers = [users.access, users.delegate, users.reader]

// A direct entity create's refusal as the current user: "" when it is stored, else its message.
function entityRefusal(entityName, fields) {
    ec.message.pushErrors()
    try {
        const value = ec.entity.makeValue(entityName)
        value.setFields(fields, true, null, null)
        value.create()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
const userIdOf = username =>
    system(() => ec.entity.find("moqui.security.UserAccount").condition("username", username).one().userId)

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const create = (name, parameters) =>
                ec.service
                    .sync()
                    .name("create#" + name)
                    .parameters(parameters)
                    .call()
            create("moqui.security.UserGroup", {userGroupId: sealGroup, description: "Admin spec: security entity writers"})
            create("moqui.security.UserGroup", {userGroupId: targetGroup, description: "Admin spec: grant target"})
            create("moqui.security.ArtifactGroup", {artifactGroupId: sealGroup})
            for (const entityName of ["moqui.security.UserGroupMember", "moqui.security.UserGroupPermission"])
                create("moqui.security.ArtifactGroupMember", {
                    artifactGroupId: sealGroup,
                    artifactName: entityName,
                    artifactTypeEnumId: "AT_ENTITY",
                    inheritAuthz: "Y"
                })
            create("moqui.security.ArtifactAuthz", {
                artifactAuthzId: sealGroup,
                artifactGroupId: sealGroup,
                userGroupId: sealGroup,
                authzTypeEnumId: "AUTHZT_ALLOW",
                authzActionEnumId: "AUTHZA_ALL"
            })
            for (const username of sealMembers)
                create("moqui.security.UserGroupMember", {userGroupId: sealGroup, userId: userIdOf(username), fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", targetGroup).deleteAll()
            ec.entity.find("moqui.security.UserGroupMember").condition("userGroupId", sealGroup).deleteAll()
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition({userGroupId: ids.accessGroupId, userId: ids.sharedUserId})
                .deleteAll()
            ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", sealGroup).deleteAll()
            ec.entity.find("moqui.security.ArtifactGroupMember").condition("artifactGroupId", sealGroup).deleteAll()
            ec.entity.find("moqui.security.ArtifactGroup").condition("artifactGroupId", sealGroup).deleteAll()
            ec.entity.find("moqui.security.UserGroup").condition("userGroupId", "in", [sealGroup, targetGroup]).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a
// refusal name the authorization
function screenRefusal(user, path) {
    const rendered = asUser(user, () => lib.page(path, {}, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
const unauthorized = message => /^40[13] |is not authorized/.test(message)

feature(
    "an Admin user gets the context; another app's user, a Projects client and a PASS public account are refused it and the app",
    {
        when() {
            const problems = []
            // the privacy administrator holds no permission yet, and still opens Admin's navigation
            for (const user of [users.privacy, users.delegate]) {
                const message = asUser(user, () => refusal(context + "get#SharedContext", {}))
                if (message !== "") problems.push(`${user} is refused the context: ${message}`)
            }
            // a PASS public account (Customer Service's Support demo contact) holds no BOSS group; another app's user, a BOSS
            // user, gets the settings index's context alone (P2, below)
            for (const user of ["customerservice.read", "sheldon.acme", "dana@joesdist.example.com"]) {
                for (const [service, parameters] of [
                    ...(user === "customerservice.read" ? [] : [[context + "get#SharedContext", {}]]),
                    [context + "check#Record", {recordType: "organization", recordId: ids.organizationId}],
                    [context + "get#Choices", {choice: "organizations"}],
                    [context + "get#AppAccess", {}],
                    ["ironstone.admin.RegistryServices.find#ToolLinks", {}]
                ]) {
                    const message = asUser(user, () => refusal(service, parameters))
                    if (!refused(message)) problems.push(`${user} gets ${service}: ${message || "accepted"}`)
                }
            }
            const otherRoot = asUser(users.reader, () => refusal(context + "get#SharedContext", {appRoot: "Warehouse"}))
            if (!otherRoot.includes("ADMIN_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
            for (const user of ["sheldon.acme", "dana@joesdist.example.com"]) {
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

// the menu of design §1.2 built so far: Home and Settings every Admin user's, Operations the reader's, the operations operator's
// and the administrator's, Agents and Developer tools the administrator's, System ADMIN's alone
feature("the Admin menu and keys follow the areas' groups and System's own grant; the launcher shows it to its users only", {
    when() {
        const rows = [
            {user: users.reader, menu: ["Home", "Settings", "Operations"], keys: ["g a", "g o"], quick: []},
            // P4: the Users area, the identity operator's and the administrator's (the reader's menu above has none); P5: its
            // Invite users in quick create, which opens InviteStaff under that area
            {user: users.identity, menu: ["Home", "Users", "Settings"], keys: ["g a"], quick: ["adminInviteUsers"]},
            {
                user: users.admin,
                menu: ["Home", "Users", "Access", "Settings", "Operations", "Agents", "Developer"],
                keys: ["g a", "g o", "g n", "g d"],
                quick: ["adminInviteUsers"]
            }
        ]
        const problems = []
        const shells = {}
        for (const {user, menu, keys, quick} of rows) {
            const found = (shells[user] = shell(user))
            if (found.status != 200) problems.push(`${user}'s menu: ${found.status}`)
            if (JSON.stringify(found.names) !== JSON.stringify(menu))
                problems.push(`${user}'s menu is ${found.names}, not ${menu}`)
            const keymap = (found.providers?.keymaps || []).find(keymap => keymap.scope === "admin")
            const held = (keymap?.keys || []).map(key => key.keys)
            if (JSON.stringify(held) !== JSON.stringify(keys)) problems.push(`${user}'s admin keys are ${held}, not ${keys}`)
            const offered = (found.providers?.quickCreate || []).map(item => item.kind)
            if (JSON.stringify(offered) !== JSON.stringify(quick))
                problems.push(`${user} is offered quick create ${offered}, not ${quick}`)
        }
        // an instance administrator's menu has System (its keys are left out: ADMIN's launcher holds every app)
        const systemMenu = shell(users.system, true).names
        if (
            JSON.stringify(systemMenu) !==
            JSON.stringify(["Home", "Users", "Access", "Settings", "Operations", "Agents", "System", "Developer"])
        )
            problems.push(`ADMIN's menu is ${systemMenu}`)
        // the launcher: the reader has Admin and no business app; another app's user has no Admin
        const readerApps = shells[users.reader].apps
        if (!readerApps.includes("Admin")) problems.push(`the reader's launcher has no Admin: ${readerApps}`)
        const business = ["Products", "Accounting", "Commerce", "Warehouse", "Projects", "Purchasing", "CustomerService"]
        const otherApps = readerApps.filter(app => business.includes(app))
        if (otherApps.length) problems.push(`the reader's launcher has ${otherApps}`)
        if (shell("customerservice.read").apps.includes("Admin")) problems.push("customerservice.read has Admin")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const capabilityNames = [
    "overview",
    "identityView",
    "identityManage",
    "identityGlobal",
    "accessView",
    "accessManage",
    "settingsView",
    "settingsManage",
    "connectionView",
    "connectionManage",
    "operationView",
    "operationManage",
    "transferView",
    "transferRun",
    "auditView",
    "backupView",
    "backupRun",
    "backupDownload",
    "constitutionGlobal",
    "agentAdmin",
    "access",
    "operations",
    "agents",
    "developer",
    "system"
]
// design §1.1's table; the administrator holds every group's permission, not the sealed ones the operators "additionally
// need" (ADMIN_IDENTITY_GLOBAL, ADMIN_BACKUP_DOWNLOAD) nor ADMIN_CONSTITUTION_GLOBAL, AgentAdmin or System, which stay ADMIN's
const adminHeld = capabilityNames.filter(
    name => !["identityGlobal", "backupDownload", "constitutionGlobal", "agentAdmin", "system"].includes(name)
)
const capabilityUsers = [
    {user: users.reader, granted: ["overview", "operations"]},
    {user: users.identity, granted: ["identityView", "identityManage"]},
    {user: users.access, granted: ["accessView", "accessManage", "access"]},
    {user: users.configure, granted: ["settingsView", "settingsManage"]},
    {user: users.integrations, granted: ["connectionView", "connectionManage"]},
    {user: users.operations, granted: ["operationView", "operationManage", "operations"]},
    {user: users.data, granted: ["transferView", "transferRun"]},
    {user: users.audit, granted: ["auditView"]},
    {user: users.privacy, granted: []},
    {user: users.backup, granted: ["backupView", "backupRun"]},
    {user: users.admin, granted: adminHeld},
    {user: users.delegate, granted: ["accessView", "accessManage", "access"]},
    {user: users.system, granted: capabilityNames}
]
feature("each group holds exactly the capabilities of its permissions and areas; System and the Admin seals stay ADMIN's", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const shared = asUser(user, () => invoke(context + "get#SharedContext", {}))
            const held = capabilityNames.filter(name => shared.capabilities[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (shared.capabilities.read !== true) problems.push(`${user} does not read`)
        }
        const scope = user => asUser(user, () => invoke(context + "get#SharedContext", {}))
        if (scope(users.admin).allOrganizations !== true) problems.push("the administrator is not in every organization")
        const identity = scope(users.identity)
        // Retail and its own child organizations (Mantle's PrtOrgRollup: Retail's returns warehouse), not Services
        if (
            identity.allOrganizations ||
            !identity.organizationPartyIds.includes(ids.organizationId) ||
            identity.organizationPartyIds.includes(ids.otherOrganizationId)
        )
            problems.push(`the identity operator administers ${identity.organizationPartyIds}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Admin › System is refused to the Admin groups and opens to ADMIN; developer tools each by their own grant", {
    when() {
        const problems = []
        // the administrator (BOSS_ADMIN_ADMIN) and an ordinary Admin user (the root user group BOSS_ADMIN's ALLOW): the root,
        // a subscreen and a transition below it
        for (const user of [users.admin, users.reader])
            for (const path of ["System", "System/Security/UserAccount", "System/Cache/CacheList/cacheElements"]) {
                const got = screenRefusal(user, path)
                if (!unauthorized(got) || !got.includes("AT_XML_SCREEN"))
                    problems.push(`${user} opens ${path}: ${got || "opened"}`)
            }
        const opened = screenRefusal(users.system, "System/Security/UserAccount")
        if (opened !== "") problems.push(`ADMIN is refused Admin › System: ${opened}`)
        const tools = user => asUser(user, () => invoke("ironstone.admin.RegistryServices.find#ToolLinks", {}).links || [])
        const adminTools = tools(users.admin)
        if (adminTools.length) problems.push(`the administrator gets tool links: ${adminTools.map(link => link.tool)}`)
        const systemTools = tools(users.system)
        const caches = systemTools.find(link => link.tool === "Caches")
        if (caches?.url !== "/qapps/Admin/System/Cache") problems.push(`ADMIN's Caches link: ${caches?.url}`)
        if (!systemTools.some(link => link.tool === "Entity data" && link.url === "/qapps/tools/Data/Grid"))
            problems.push("ADMIN has no Entity data link")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a privileged group's membership and a sealed grant need a member and a holder; raw security mutators are refused", {
    when() {
        const problems = []
        const sharedId = ids.sharedUserId
        const member = group => ({userGroupId: group, userId: sharedId, fromDate: ec.user.nowTimestamp})
        const grant = permission => ({userGroupId: targetGroup, userPermissionId: permission, fromDate: ec.user.nowTimestamp})
        const expect = (label, message, refusalText) => {
            if (refusalText ? !message.includes(refusalText) : message !== "") problems.push(`${label}: ${message || "accepted"}`)
        }
        // the delegated access administrator holds ADMIN_ACCESS_MANAGE but is not in BOSS_ADMIN_ACCESS (design §15.3)
        asUser(users.delegate, () => {
            for (const group of [ids.accessGroupId, ids.backupGroupId, ids.adminGroupId])
                expect(
                    `the delegate adds to ${group}`,
                    entityRefusal("moqui.security.UserGroupMember", member(group)),
                    "membership of group " + group
                )
            expect(
                "the delegate grants ADMIN_ACCESS_MANAGE",
                entityRefusal("moqui.security.UserGroupPermission", grant("ADMIN_ACCESS_MANAGE"))
            )
            expect(
                "the delegate grants ADMIN_BACKUP_DOWNLOAD",
                entityRefusal("moqui.security.UserGroupPermission", grant("ADMIN_BACKUP_DOWNLOAD")),
                "grant permission ADMIN_BACKUP_DOWNLOAD"
            )
            expect(
                "the delegate grants ADMIN_IDENTITY_GLOBAL",
                entityRefusal("moqui.security.UserGroupPermission", grant("ADMIN_IDENTITY_GLOBAL")),
                "grant permission ADMIN_IDENTITY_GLOBAL"
            )
        })
        // a member of BOSS_ADMIN_ACCESS adds to it; a non-holder (the reader) is refused the grant the delegate made
        asUser(users.access, () =>
            expect(
                "the access administrator adds to BOSS_ADMIN_ACCESS",
                entityRefusal("moqui.security.UserGroupMember", member(ids.accessGroupId))
            )
        )
        asUser(users.reader, () =>
            expect(
                "the reader grants ADMIN_ACCESS_MANAGE",
                entityRefusal("moqui.security.UserGroupPermission", grant("ADMIN_ACCESS_MANAGE")),
                "grant permission ADMIN_ACCESS_MANAGE"
            )
        )
        // without the spec's entity grant, an Admin group writes no security record through the entity-auto services
        for (const user of [users.admin, users.identity])
            asUser(user, () => {
                for (const [service, parameters] of [
                    ["create#moqui.security.UserGroupMember", member(targetGroup)],
                    ["update#moqui.security.UserAccount", {userId: sharedId, disabled: "Y"}],
                    ["create#moqui.security.UserGroupPermission", grant("ADMIN_OVERVIEW_VIEW")]
                ]) {
                    const message = refusal(service, parameters)
                    if (!message.includes("is not authorized")) problems.push(`${user} ${service}: ${message || "accepted"}`)
                }
            })
        const stored = system(() => ({
            accessMembers: ec.entity
                .find("moqui.security.UserGroupMember")
                .condition({userGroupId: ids.accessGroupId, userId: sharedId})
                .count(),
            otherMembers: ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", sharedId)
                .condition("userGroupId", "in", [ids.backupGroupId, ids.adminGroupId, targetGroup])
                .count(),
            grants: Array.from(
                ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", targetGroup).list()
            ).map(row => row.userPermissionId),
            disabled: ec.entity.find("moqui.security.UserAccount").condition("userId", sharedId).one().disabled
        }))
        if (stored.accessMembers !== 1 || stored.otherMembers !== 0)
            problems.push(`memberships stored: ${JSON.stringify(stored)}`)
        if (JSON.stringify(stored.grants) !== JSON.stringify(["ADMIN_ACCESS_MANAGE"]))
            problems.push(`grants stored: ${stored.grants}`)
        if (stored.disabled === "Y") problems.push("the shared identity was disabled")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "an identity is checked by the organizations it works for; another organization's is refused, a shared one shown by its own",
    {
        when() {
            const problems = []
            const check = (user, recordType, recordId) =>
                asUser(user, () => refusal(context + "check#Record", {recordType, recordId}))
            const record = (user, recordType, recordId) =>
                asUser(user, () => invoke(context + "check#Record", {recordType, recordId}))
            // the Retail identity operator: a Retail identity and the shared one, by Retail alone; Services' and a forged one refused alike
            for (const recordId of [ids.retailUserId, ids.sharedUserId]) {
                const message = check(users.identity, "user", recordId)
                if (message !== "") problems.push(`the identity operator is refused ${recordId}: ${message}`)
            }
            const shared = record(users.identity, "user", ids.sharedUserId)
            if (
                !shared.organizationPartyIds.includes(ids.organizationId) ||
                shared.organizationPartyIds.includes(ids.otherOrganizationId) ||
                shared.sharedBeyondScope !== true
            )
                problems.push(`the shared identity's scope: ${shared.organizationPartyIds} ${shared.sharedBeyondScope}`)
            if (/Services/.test(shared.detail || ""))
                problems.push(`the shared identity's detail names Services: ${shared.detail}`)
            for (const recordId of [ids.otherUserId, "BOSS_ADM_FORGED"]) {
                const message = check(users.identity, "user", recordId)
                if (!message.includes("RECORD_UNAVAILABLE"))
                    problems.push(`the identity operator gets ${recordId}: ${message || "accepted"}`)
            }
            // P6: what an identity owns (the lifecycle's participants) by the same scope: a Retail identity's for the operator,
            // Services' refused, and the reader refused for the permission
            const owned = (user, userId) =>
                asUser(user, () => refusal("ironstone.admin.LifecycleServices.find#OwnedResources", {userId}))
            if (owned(users.identity, ids.retailUserId) !== "")
                problems.push("the identity operator is refused a Retail identity's resources")
            if (!owned(users.identity, ids.otherUserId).includes("RECORD_UNAVAILABLE"))
                problems.push("the identity operator reads a Services identity's resources")
            if (!owned(users.reader, ids.retailUserId).includes("ADMIN_IDENTITY_VIEW"))
                problems.push("the reader reads an identity's resources")
            // the same record without ADMIN_IDENTITY_VIEW: the reader is refused for the permission
            const reader = check(users.reader, "user", ids.retailUserId)
            if (!reader.includes("PERMISSION_DENIED")) problems.push(`the reader reads an identity: ${reader || "accepted"}`)
            // organizations: Retail's operator administers Retail, not Services; the administrator every one
            if (check(users.identity, "organization", ids.organizationId) !== "")
                problems.push("the identity operator is refused Retail")
            if (!check(users.identity, "organization", ids.otherOrganizationId).includes("RECORD_UNAVAILABLE"))
                problems.push("the identity operator gets Services")
            if (check(users.admin, "user", ids.otherUserId) !== "")
                problems.push("the administrator is refused Services' identity")
            const choices = (user, selected) =>
                asUser(user, () => values(invoke(context + "get#Choices", {choice: "organizations", selected})))
            const identityChoices = choices(users.identity, ids.otherOrganizationId)
            if (!identityChoices.includes(ids.organizationId) || identityChoices.includes(ids.otherOrganizationId))
                problems.push(`the identity operator's organizations: ${identityChoices}`)
            // the choice list is a page: other specs add organizations in a full run, so each is asked for by its selection
            for (const organizationId of [ids.otherOrganizationId, ids.accountingOrganizationId])
                if (!choices(users.admin, organizationId).includes(organizationId))
                    problems.push(`the administrator's organizations lack ${organizationId}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P2 (impl-admin F46; design §7, §13): BOSS_USERS' non-inheritable ALLOW on SettingsHome alone. A warehouse manager in no Admin
// group opens the settings index (its one render, html) with Warehouse's entry, gets the context of the index alone, and is
// refused the root, Home, Health, the Settings area's other paths and every other Admin service; the grant inherits to nothing
// below or beside it (F34).
feature("a BOSS user without Admin opens the settings index alone", {
    when() {
        const user = lib.outsiders.warehouseManager
        const problems = []
        const index = asUser(user, () => lib.page("Settings/SettingsHome", {}, "html"))
        if (index.status != 200 || index.errors.length) problems.push(`the index: ${index.status} ${index.errors}`)
        if (!index.output.includes("Warehouse settings")) problems.push("the index lacks Warehouse settings")
        if (index.output.includes("Accounting settings")) problems.push("the index shows Accounting settings")
        for (const path of ["Home", "Operations/Health", "Operations/Monitoring"]) {
            const got = screenRefusal(user, path)
            if (!unauthorized(got)) problems.push(`the manager opens ${path}: ${got || "opened"}`)
        }
        const shared = asUser(user, () => invoke(context + "get#SharedContext", {}))
        if (shared.capabilities?.read !== false || shared.capabilities?.settingsIndex !== true)
            problems.push(`the manager's context: ${JSON.stringify(shared.capabilities)}`)
        if (JSON.stringify(Object.keys(shared.sharedLinks || {})) !== JSON.stringify(["Settings/SettingsHome"]))
            problems.push(`the manager's links: ${Object.keys(shared.sharedLinks || {})}`)
        for (const [service, parameters] of [
            [context + "get#Choices", {choice: "organizations"}],
            [context + "check#Record", {recordType: "organization", recordId: ids.organizationId}],
            ["ironstone.admin.RegistryServices.get#Readiness", {}],
            ["ironstone.admin.RegistryServices.find#ToolLinks", {}]
        ]) {
            const message = asUser(user, () => refusal(service, parameters))
            if (!refused(message)) problems.push(`the manager gets ${service}: ${message || "accepted"}`)
        }
        // the launcher still has no Admin for them
        if (shell(user, false).apps.includes("Admin")) problems.push("the manager's launcher has Admin")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
