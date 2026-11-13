// Maintenance access (impl-maintenance §2, P1; design-maintenance §1.1, §1.2): who may open Maintenance and the context they get
// (a requester, another app's user, a client and a PASS account refused, and another root), the menu, keys, palette and launcher
// per group, each group's capabilities from its permissions (an edit permission alone reading nothing), a planner of Retail
// refused Services' organization and facility and Services' planner refused Retail's with the same parameters, the
// ironstone.maintenance services refused without the root grant, a shared device's request given no context and refused the
// Chatter and RecordFiles panels (F74) and a user served only Maintenance's record hosts' panels, Home's one qvt render (its counters not configured) and
// Settings' one html render (the administrator's; the reader's a refusal), P2's equipment write (the resource administrator's,
// the planner refused, another organization's equipment refused) and record panels (equipment and facilities of the scope only),
// P3's work order record (its organization's work reader and its technician, not a resource administrator, another technician or
// Retail) and its record panels, P4's maintenance request record (its organization's planner, not a technician or Retail) and its
// panels, Commons' Report a problem (every Maintenance group's, not another app's user's), P6's procedure record (a reader of its
// organization's procedures; an author's change), P9's part issue (the assigned technician with the stock grant; another
// technician without it and another owner's stock refused), P13's preventive plan (a maintenance reader of its organization; a
// planner's create), P15's booking policy and blackout (the resource administrator's, the planner refused, Retail's facility
// refused; a booking approver reads the policy of the room they approve only), P7's checklist (its
// technician reads it, not another or Retail; a waiver is a supervisor's), P10's purchases of a work order (its planner reads
// them, a resource administrator and Retail's planner do not; a technician asks for nothing, a planner links no order line the
// work did not request and Retail's planner asks for nothing on Services' work; the supervisor, Warehouse's receiver for
// accept#ServiceItem, gets no Warehouse app or receipt quick create: the lead's decision, P10 review R1), P19's stack providers
// (a work order's record card and a caller's work for its organization's planner, not a resource administrator, Retail's planner or
// a requester without the root; Comms' Report a problem on a chat message for a user who may report, not another app's user; the
// message read under Comms' room check with the user's own filters, a record room of Retail's forklift refused: review R1), P18's equipment
// import (run by the resource administrator, read by the planner, the importer's organizations only) and setup readiness (the
// administrator's), P14's generation and compliance (a planner generates, a reader does not, Retail's planner gets Services'
// plan refused; the compliance a reader's, not a technician's or Retail's), P17's work status and report catalogue (a reader's,
// not a technician's; Retail's planner refused Services' organization), P8's team defaults (the administrator's; the planner
// refused, Retail's planner reads no Services team; Teams read by the planner and supervisor alone of Settings, review),
// P12's customer repair (its intervention report stored by its technician, not its agent or another organization's technician; the
// customer's unit read through the repair, not by Maintenance's equipment scope; the report sent by the claim's agent, not the
// technician or another organization's agent), and Maintenance's rows in Admin's capability and
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
const registry = "org.moqui.admin.ReadinessServices."
// a refusal of a user without Maintenance: the service is not authorized for them, or it refuses them
const refused = message => /MAINTENANCE_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// a Commons screen's refusal as the user (P4's Report a problem): "" when it opens
function screenRefusalIn(user, path) {
    const rendered = asUser(user, () => page(path, {}, "html", "Commons"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// the shell's data of the user (the launcher's apps, the + menu's quick creates), rendered once a user in the spec: no feature
// changes a demo user's groups
const shellDataCache = new Map()
const shellData = user => {
    if (!shellDataCache.has(user))
        shellDataCache.set(
            user,
            asUser(user, () =>
                JSON.parse(
                    ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("shellData", {}, null).output
                )
            )
        )
    return shellDataCache.get(user)
}
// the quick create kinds of the user's + menu
const quickCreates = user => JSON.stringify(shellData(user))
// a spec-local Maintenance user whose only capability group holds MAINTENANCE_PLAN, an agent of Services
const editOnly = "MNT_SPEC_EDIT_ONLY"
// spec-local custom groups an access administrator gives a Maintenance bundle and the launcher through Admin's capability matrix, each
// with a user, an agent of Services (F346: no member of BOSS_MAINTENANCE, so its deny rows do not reach them)
const customTeams = {
    plan: {
        groupId: "MNT_SPEC_PLAN_TEAM",
        bundle: "BOSS_MAINTENANCE_PLAN",
        userId: "MNT_SPEC_PLAN_TEAM_USER",
        username: "maint.spec.planteam"
    },
    read: {
        groupId: "MNT_SPEC_READ_TEAM",
        bundle: "BOSS_MAINTENANCE_READ",
        userId: "MNT_SPEC_READ_TEAM_USER",
        username: "maint.spec.readteam"
    }
}
function customTeam({groupId, bundle, userId, username}) {
    if (system(() => ec.entity.find("moqui.security.UserGroup").condition({userGroupId: groupId}).count())) return username
    const matrix = "org.moqui.admin.AccessServices."
    const carried = entityName => system(() => Array.from(ec.entity.find(entityName).condition("userGroupId", bundle).list()))
    const changes = carried("moqui.security.CapabilityBundlePermission")
        .map(row => groupId + "~a~p:" + row.userPermissionId)
        .concat(carried("moqui.security.CapabilityBundleArtifact").map(row => groupId + "~a~a:" + row.artifactGroupId))
        .concat([groupId + "~a~a:BOSS_MAINTENANCE"])
        .join(",")
    asUser("admin.access", () => {
        invoke(matrix + "create#Group", {
            userGroupId: groupId,
            description: "Maintenance spec team",
            groupTypeEnumId: "UgtCustomTeam"
        })
        const proposal = invoke(matrix + "get#MatrixContext", {appName: "Maintenance", groups: groupId, changes}).proposal
        invoke(matrix + "apply#MatrixChanges", {changes, revisions: proposal.revisions, reason: "Maintenance spec team"})
    })
    system(() => {
        call("create#mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson"})
        call("create#mantle.party.Person", {partyId: userId, firstName: "Maintenance spec", lastName: "Team"})
        call("create#mantle.party.PartyRelationship", {
            relationshipTypeEnumId: "PrtAgent",
            fromPartyId: userId,
            toPartyId: ids.organizationId,
            toRoleTypeId: "OrgInternal",
            fromDate: 0
        })
        call("create#moqui.security.UserAccount", {
            userId,
            username,
            partyId: userId,
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        for (const userGroupId of ["BOSS_USERS", groupId])
            call("create#moqui.security.UserGroupMember", {userId, userGroupId, fromDate: 0})
    })
    return username
}

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
                .condition("userId", "in", [editOnly].concat(Object.values(customTeams).map(team => team.userId)))
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        // the kiosk's device goes and its display account's memberships end
        system(() => {
            ec.entity.find("moqui.security.DeviceCredential").condition("deviceName", "Spec maintenance kiosk").deleteAll()
            const display = ec.entity
                .find("moqui.security.UserAccount")
                .condition("username", "display.spec.maintenance.kiosk")
                .one()
            if (display)
                ec.entity
                    .find("moqui.security.UserGroupMember")
                    .condition("userId", display.userId)
                    .updateAll({thruDate: ec.user.nowTimestamp})
        })
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
            // a new record's organization is the user's own: the planner's Services, and Retail for Retail's planner, whose scope also
            // holds Retail's rollup child, the returns center (impl-sales F111)
            if (planner.defaultOrganizationPartyId !== ids.organizationId)
                problems.push(`the planner's default organization: ${planner.defaultOrganizationPartyId}`)
            const retail = asUser(users.retailPlanner, () => invoke(context, {}))
            if (
                !retail.organizationPartyIds.includes("BOSS_WH_RETURNS") ||
                retail.defaultOrganizationPartyId !== ids.otherOrganizationId
            )
                problems.push(
                    `Retail's planner's default organization: ${retail.defaultOrganizationPartyId} of ${retail.organizationPartyIds}`
                )
            // the administrator works every organization (MAINTENANCE_ALL_ORGANIZATIONS, the user's call)
            const admin = asUser(users.admin, () => invoke(context, {}))
            if (!admin.allOrganizations || !admin.organizationPartyIds.includes(ids.otherOrganizationId))
                problems.push(`the administrator's organizations: ${admin.allOrganizations} ${admin.organizationPartyIds}`)
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
        // P2: a user who reads no equipment (the procedure author) has no Equipment or Work orders; P6: the author has Procedures
        const author = shell(users.author, true).names
        if (JSON.stringify(author) !== JSON.stringify(ids.authorMenu)) problems.push(`the author's menu: ${author}`)
        // the booking approver reads neither work, procedures nor equipment: Home and Scheduling (P15, the rooms they approve)
        const booking = shell(users.booking, true).names
        if (JSON.stringify(booking) !== JSON.stringify(ids.bookingMenu)) problems.push(`the booking approver's menu: ${booking}`)
        // the palette finds the scope's equipment and facilities (P2), Retail's planner none of Services', and a user who reads no
        // equipment none
        const rows = (user, text) => asUser(user, () => invoke(contextServices + "search#Records", {text}).rows || [])
        const compressor = rows(users.planner, "Compressor C-1")
        if (!compressor.some(row => row.recordId === ids.compressorId && row.url.includes("Equipment/EquipmentDetail")))
            problems.push(`the planner's palette rows: ${JSON.stringify(compressor)}`)
        if (!rows(users.planner, "Service Center").some(row => row.recordId === ids.buildingId))
            problems.push(`the planner's palette has no Service Center`)
        if (rows(users.retailPlanner, "Compressor C-1").length) problems.push(`Retail's planner finds Services' compressor`)
        if (rows(users.author, "Compressor C-1").length) problems.push(`the author finds equipment`)
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
    "allOrganizations",
    // the reads, from view permissions only
    "workRead",
    "resourceRead",
    "anyRead",
    // the Settings area, the Maintenance administrator's
    "settings"
]
const reads = ["workRead", "resourceRead", "anyRead"]
// design §1.1's table; every group also reports a problem and follows it (MAINTENANCE_REQUEST and _VIEW_OWN, the user's call of Nov 12, P4 review)
const capabilityUsers = [
    {user: users.reader, granted: ["request", "requestViewOwn", "view", "processView", ...reads]},
    {user: users.planner, granted: ["request", "requestViewOwn", "view", "plan", "processView", ...reads]},
    {user: users.tech, granted: ["request", "requestViewOwn", "assignedView", "execute", ...reads]},
    {user: users.supervisor, granted: ["request", "requestViewOwn", "view", "supervise", "processView", ...reads]},
    {user: users.author, granted: ["request", "requestViewOwn", "processView", "processEdit", "anyRead"]},
    {user: users.approver, granted: ["request", "requestViewOwn", "processView", "processApprove", "anyRead"]},
    {user: users.booking, granted: ["request", "requestViewOwn", "bookingViewAssigned", "bookingApprove", "anyRead"]},
    {
        user: users.resources,
        granted: ["request", "requestViewOwn", "resourceView", "resourceEdit", "import", "policyView", "policyEdit", "facilityEdit", "resourceRead", "anyRead"]
    },
    {user: users.cost, granted: ["request", "requestViewOwn", "view", "costView", ...reads]},
    // the user's call (P1 review): every Maintenance permission, every organization among them, and not FACILITY_EDIT
    {user: users.admin, granted: capabilityNames.filter(name => name !== "facilityEdit")},
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
                // P2: a custodian is one of the scope's employees; a warrantor or agency an organization, never a person or
                // another internal organization
                const options = (choice, term) => invoke(choices, {choice, term}).options.map(option => option.value)
                if (!options("custodians", "Kenji").includes(ids.custodianId))
                    problems.push("the planner's custodians lack Kenji")
                if (options("parties", "Kenji").length)
                    problems.push(`the planner's parties offer people: ${options("parties", "Kenji")}`)
                if (options("parties", "Retail").includes(ids.otherOrganizationId))
                    problems.push("the planner's parties offer Retail")
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
                const custodians = invoke(choices, {choice: "custodians", term: "Kenji"}).options.map(option => option.value)
                if (custodians.includes(ids.custodianId)) problems.push("Retail's planner's custodians offer Services' Kenji")
            })
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P2: equipment writes need MAINTENANCE_RESOURCE_EDIT and the equipment's organization (the Mantle writer checks them; the screens'
// transitions check check#Record with resourceEdit first)
feature("an equipment write is the resource administrator's: the planner is refused, and Retail's forklift is refused to both", {
    when() {
        const store = "mantle.product.MaintenanceResourceServices.store#MaintenanceEquipment"
        const original = system(
            () => ec.entity.find("mantle.product.asset.Asset").condition("assetId", ids.compressorId).one().comments
        )
        const parameters = assetId => ({assetId, comments: "Checked by the Maintenance access spec"})
        // the Mantle writer as the screens call it under the root's inheritable grant: the artifact check aside, its own
        // permission and scope checks decide
        const write = (user, assetId) =>
            asUser(user, () => {
                ec.artifactExecution.disableAuthz()
                return refusal(store, parameters(assetId))
            })
        const resources = write(users.resources, ids.compressorId)
        const planner = write(users.planner, ids.compressorId)
        const otherAsset = write(users.resources, ids.otherAssetId)
        const checkEdit = asUser(users.planner, () =>
            refusal(checkRecord, {recordType: "asset", recordId: ids.compressorId, capability: "resourceEdit"})
        )
        const saved = system(
            () => ec.entity.find("mantle.product.asset.Asset").condition("assetId", ids.compressorId).one().comments
        )
        system(() => call("update#mantle.product.asset.Asset", {assetId: ids.compressorId, comments: original}))
        return {resources, planner, otherAsset, checkEdit, saved}
    },
    then({resources, planner, otherAsset, checkEdit, saved}) {
        resources == ""
        saved == "Checked by the Maintenance access spec"
        planner.includes("PERMISSION_DENIED")
        otherAsset.includes("RECORD_UNAVAILABLE")
        checkEdit.includes("PERMISSION_DENIED")
    }
})

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

// F74: a shared device's request (a later TechnicianKiosk's route group) runs as its display account and calls no context service;
// a route group wider than its page (here one inheriting the whole root) and a display account holding the root grant are still
// refused the Chatter and RecordFiles panels by the root, any record or none, and Home opens with no capability. A Maintenance user
// is served the panels of Maintenance's own record hosts only (none yet; P2 and P3 add theirs) and a panel request naming no record
const kioskGroup = "MNT_SPEC_KIOSK"
function deviceRequest(path, cookie, parameters = {}) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters, "get")
    ec.message.clearErrors()
    return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || []).join("\n")}
}
feature("a shared device gets no Maintenance context and no record panel; a user the panels of Maintenance's hosts only", {
    when() {
        const cookie = system(() => {
            if (!ec.entity.find("moqui.security.DeviceRouteGroup").condition("routeGroupId", kioskGroup).one()) {
                call("create#moqui.security.ArtifactGroup", {artifactGroupId: kioskGroup, description: "Maintenance spec kiosk"})
                call("create#moqui.security.ArtifactGroupMember", {
                    artifactGroupId: kioskGroup,
                    artifactName: "component://mr-boss/screen/Maintenance.xml",
                    artifactTypeEnumId: "AT_XML_SCREEN",
                    nameIsPattern: "N",
                    inheritAuthz: "Y"
                })
                call("create#moqui.security.DeviceRouteGroup", {
                    routeGroupId: kioskGroup,
                    description: "Maintenance spec kiosk",
                    ownerName: "Maintenance",
                    artifactGroupId: kioskGroup,
                    homePath: "/apps/Maintenance/Home",
                    parameterRequired: "N",
                    defaultIdleMinutes: 60,
                    defaultLifetimeDays: 1
                })
            }
            const username = "display.spec.maintenance.kiosk"
            let display = ec.entity.find("moqui.security.UserAccount").condition("username", username).one()
            if (!display) {
                invoke("mantle.party.IdentityServices.create#DisplayAccount", {
                    displayName: "Spec maintenance kiosk",
                    organizationPartyId: ids.organizationId,
                    bundleGroupIdList: ["BOSS_MAINTENANCE", "BOSS_MAINTENANCE_READ"]
                })
                display = ec.entity.find("moqui.security.UserAccount").condition("username", username).one()
            }
            const registered = invoke("mantle.party.IdentityServices.register#SharedDevice", {
                deviceName: "Spec maintenance kiosk",
                routeGroupId: kioskGroup,
                displayUserId: display.userId,
                issueCode: false
            })
            const code = invoke("mantle.party.IdentityServices.reveal#SharedDeviceCode", {
                deviceId: registered.deviceId
            }).registrationCode
            const redeemed = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .render("Device/redeem", {code}, "post")
            return String(redeemed.header("Set-Cookie") || "")
                .split(";")[0]
                .replace("moqui.device=", "")
        })
        login("john.doe")
        // the panels' data, as the chatter and record-files elements ask for it: of a facility and equipment the planner reads (P2's
        // hosts, F82), of Retail's warehouse and forklift with the same parameters, of a record that is no Maintenance host (a
        // product), and naming no record (as a person search does)
        const record = {recordEntity: "mantle.facility.Facility", recordId: ids.facilityId}
        const panel = (recordEntity, recordId) =>
            deviceRequest("apps/Maintenance/RecordFiles/filesData", null, {recordEntity, recordId}).errors
        return {
            cookie,
            home: deviceRequest("apps/Maintenance/Home", cookie),
            chatter: deviceRequest("apps/Maintenance/Chatter/chatterData", cookie),
            files: deviceRequest("apps/Maintenance/RecordFiles/filesData", cookie, record),
            ...asUser(users.planner, () => ({
                plannerFiles: panel("mantle.facility.Facility", ids.facilityId),
                plannerAsset: panel("mantle.product.asset.Asset", ids.compressorId),
                otherFacility: panel("mantle.facility.Facility", ids.otherFacilityId),
                otherAsset: panel("mantle.product.asset.Asset", ids.otherAssetId),
                product: panel("mantle.product.Product", ids.modelId),
                plannerChatter: deviceRequest("apps/Maintenance/Chatter/chatterData", null),
                // P3: a work order is a host (F82); a work effort that is no work order is not
                plannerWork: panel("mantle.work.effort.WorkEffort", ids.inProgressOrderId),
                plainWork: panel("mantle.work.effort.WorkEffort", "BOSS_DEMO_TASK")
            })),
            retailWork: asUser(users.retailPlanner, () => panel("mantle.work.effort.WorkEffort", ids.inProgressOrderId))
        }
    },
    then({
        cookie,
        home,
        chatter,
        files,
        plannerFiles,
        plannerAsset,
        otherFacility,
        otherAsset,
        product,
        plannerChatter,
        plannerWork,
        plainWork,
        retailWork
    }) {
        cookie.includes(".")
        home.status == 200 && home.errors == ""
        home.output.includes("Nothing of it is open to you.")
        chatter.errors.includes("RECORD_PANEL_UNAVAILABLE")
        files.errors.includes("RECORD_PANEL_UNAVAILABLE")
        !plannerFiles.includes("RECORD_PANEL_UNAVAILABLE")
        !plannerAsset.includes("RECORD_PANEL_UNAVAILABLE")
        otherFacility.includes("RECORD_PANEL_UNAVAILABLE")
        otherAsset.includes("RECORD_PANEL_UNAVAILABLE")
        product.includes("RECORD_PANEL_UNAVAILABLE")
        !plannerChatter.errors.includes("RECORD_PANEL_UNAVAILABLE")
        !plannerWork.includes("RECORD_PANEL_UNAVAILABLE")
        plainWork.includes("RECORD_PANEL_UNAVAILABLE")
        retailWork.includes("RECORD_PANEL_UNAVAILABLE")
    }
})

feature(
    "a work order is read by a work reader of its organization and the technician assigned to it, not a resource administrator, another technician or Retail (P3)",
    {
        when() {
            const check = (user, workEffortId = ids.inProgressOrderId) =>
                asUser(user, () =>
                    refusal(checkRecord, {appRoot: "Maintenance", recordType: "workOrder", recordId: workEffortId})
                )
            return {
                planner: check(users.planner),
                tech: check(users.tech),
                tech2: check(users.tech2),
                resources: check(users.resources),
                retail: check(users.retailPlanner),
                // the same check of Retail's planner is not a missing record: Services' planner reads it with the same parameters
                missing: check(users.planner, "BOSS_MNT_WO_NONE")
            }
        },
        then(out) {
            out.planner == ""
            out.tech == ""
            // another technician of the organization: in scope but not theirs (Mantle's NOT_ASSIGNED)
            out.tech2.includes("NOT_ASSIGNED")
            out.resources.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            out.missing.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature(
    "a maintenance request is a planner's of its organization, not a technician's or Retail's; a requester reports in Commons only (P4)",
    {
        when() {
            const check = (user, requestId = ids.openRequestId) =>
                asUser(user, () => refusal(checkRecord, {appRoot: "Maintenance", recordType: "request", recordId: requestId}))
            const panel = user =>
                asUser(
                    user,
                    () =>
                        deviceRequest("apps/Maintenance/RecordFiles/filesData", null, {
                            recordEntity: "mantle.request.Request",
                            recordId: ids.openRequestId
                        }).errors
                )
            return {
                planner: check(users.planner),
                tech: check(users.tech),
                retail: check(users.retailPlanner),
                missing: check(users.planner, "BOSS_MNT_REQ_NONE"),
                plannerPanel: panel(users.planner),
                retailPanel: panel(users.retailPlanner),
                // Report a problem: the requester's screen in Commons (BOSS_MNT_REPORT_PROBLEM), not another Commons user's
                requesterReport: screenRefusalIn(users.requester, "ReportProblem"),
                // the user's call (Nov 12, P4 review): every Maintenance group has Report a problem in its + menu, another
                // app's user neither the item nor the screen
                withoutReport: [
                    users.reader,
                    users.planner,
                    users.tech,
                    users.supervisor,
                    users.author,
                    users.approver,
                    users.booking,
                    users.resources,
                    users.cost,
                    users.admin,
                    users.requester
                ].filter(user => !quickCreates(user).includes("maintenanceReportProblem")),
                otherQuickCreate: quickCreates(users.otherApp).includes("maintenanceReportProblem"),
                // a technician reports a problem and follows their own report (the Commons Maintenance box's
                // find#MaintenanceRequests), not the requester's
                techFollows: asUser(users.tech, () =>
                    system(() => {
                        const reported = invoke("mantle.work.MaintenanceServices.report#MaintenanceProblem", {
                            assetId: ids.compressorId,
                            summary: "Compressor guard loose",
                            operationKey: "spec-mnt-tech-report"
                        })
                        const own = id =>
                            Array.from(
                                invoke("mantle.work.MaintenanceServices.find#MaintenanceRequests", {requestId: id, statusId: "all"})
                                    .requestList || []
                            ).length
                        return {own: own(reported.requestId), colleague: own(ids.openRequestId)}
                    })
                ),
                otherReport: screenRefusalIn(users.otherApp, "ReportProblem"),
                // P4 review: the Requests area is the planner's and supervisor's (BOSS_MNT_REQUESTS); the planner's render is
                // MaintenanceRequests'
                techRequests: screenRefusal(users.tech, "Requests"),
                readerRequests: screenRefusal(users.reader, "Requests"),
                // P4 review: a reported problem by its id in Commons is its reporter's and Maintenance's, not every member's of its
                // organization (Mantle's MaintenanceAccess.requestHidden in get#RecordLinkInfo): the technician, an agent of Services
                // not on its work, does not see the requester's untriaged report
                // (Commons' files panel of the request, which asks get#RecordLinkInfo)
                seen: Object.fromEntries(
                    [users.requester, users.planner, users.tech].map(user => {
                        const files = asUser(user, () =>
                            deviceRequest("apps/Commons/RecordFiles/filesData", null, {
                                recordEntity: "mantle.request.Request",
                                recordId: ids.openRequestId
                            })
                        )
                        return [user, files.status === 200 && JSON.parse(files.output || "{}").visible === true]
                    })
                )
            }
        },
        then(out) {
            out.planner == ""
            out.tech.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            out.missing.includes("RECORD_UNAVAILABLE")
            !out.plannerPanel.includes("RECORD_PANEL_UNAVAILABLE")
            out.retailPanel.includes("RECORD_PANEL_UNAVAILABLE")
            out.requesterReport == ""
            out.withoutReport.length == 0
            out.otherQuickCreate == false
            out.techFollows.own == 1
            out.techFollows.colleague == 0
            out.otherReport != ""
            out.techRequests != ""
            out.readerRequests != ""
            out.seen[users.requester] == true
            out.seen[users.planner] == true
            out.seen[users.tech] == false
        }
    }
)

feature("Home shows the planner their organization and every counter (P14's too); Settings is the administrator's", {
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
        // P14: the preventive counters are counted for a reader of work, none left not configured
        plannerHome.output.includes("Overdue preventive maintenance")
        plannerHome.output.includes("Unknown meter readings")
        !plannerHome.output.includes("Not configured")
        // P3: the work order counters, the planner's New work order and the team's work
        plannerHome.output.includes("Unassigned")
        plannerHome.output.includes("My work")
        plannerHome.output.includes("New work order")
        plannerHome.output.includes("Team work")
        plannerHome.output.includes("Ziziwork Services")
        !plannerHome.output.includes("is not available to you")
        // the planner has no Settings shortcut
        !plannerHome.output.includes("Shortcuts")
        otherHome.output.includes("This organization is not available to you.")
        settings.errors.length == 0
        settings.output.includes("Maintenance settings")
        settings.output.includes("Work policy")
        // the Settings frame's permission gate refuses the reader before the deny row on its tab is decided (F346)
        readerSettings.includes("PERMISSION_DENIED")
    }
})

feature(
    "a procedure is read by a reader of its organization's procedures, not a resource administrator, a technician with no work of it or Retail; it is changed by an author only (P6)",
    {
        when() {
            const check = (user, workEffortId = ids.compressorProcedureId) =>
                asUser(user, () =>
                    refusal(checkRecord, {appRoot: "Maintenance", recordType: "procedure", recordId: workEffortId})
                )
            // a change as each user (the Mantle service's own check, the root's grant aside)
            const change = user =>
                asUser(user, () =>
                    system(() =>
                        refusal("mantle.work.ProcessServices.store#WorkProcess", {
                            workEffortId: ids.draftProcedureId,
                            description: "Before each trip"
                        })
                    )
                )
            return {
                author: check(users.author),
                approver: check(users.approver),
                planner: check(users.planner),
                resources: check(users.resources),
                tech: check(users.tech),
                retail: check(users.retailPlanner),
                workOrder: check(users.author, ids.inProgressOrderId),
                authorChanges: change(users.author),
                plannerChanges: change(users.planner),
                retailChanges: change(users.retailPlanner)
            }
        },
        then(out) {
            out.author == "" && out.approver == "" && out.planner == ""
            out.resources.includes("RECORD_UNAVAILABLE")
            out.tech.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            // a work order is no procedure
            out.workOrder.includes("RECORD_UNAVAILABLE")
            out.authorChanges == ""
            out.plannerChanges.includes("PERMISSION_DENIED")
            out.retailChanges.includes("PERMISSION_DENIED") || out.retailChanges.includes("RECORD_UNAVAILABLE")
        }
    }
)

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
                // P11 review (R2): every area a Maintenance bundle's group opens by an ALWAYS grant, its bundle carries, so a group given
                // the bundle in Admin opens it too (the planner's and supervisor's Requests were carried by none)
                for (const authz of Array.from(
                    ec.entity
                        .find("moqui.security.ArtifactAuthz")
                        .condition("userGroupId", "in", bundles)
                        .condition("authzTypeEnumId", "AUTHZT_ALWAYS")
                        .list()
                )) {
                    if (authz.userGroupId === "BOSS_MAINTENANCE_ADMIN") continue
                    const carried = ec.entity
                        .find("moqui.security.CapabilityBundleArtifact")
                        .condition({userGroupId: authz.userGroupId, artifactGroupId: authz.artifactGroupId})
                        .count()
                    if (!carried) problems.push(`${authz.userGroupId}'s bundle does not carry ${authz.artifactGroupId}`)
                }
                const holders = userPermissionId =>
                    Array.from(ec.entity.find("moqui.security.CapabilityBundlePermission").condition({userPermissionId}).list())
                        .map(row => row.userGroupId)
                        .sort()
                if (
                    JSON.stringify(holders("MAINTENANCE_IMPORT")) !==
                    '["BOSS_MAINTENANCE_ADMIN","BOSS_MAINTENANCE_RESOURCE_ADMIN"]'
                )
                    problems.push(`MAINTENANCE_IMPORT's bundles: ${holders("MAINTENANCE_IMPORT")}`)
                if (JSON.stringify(holders("MAINTENANCE_ALL_ORGANIZATIONS")) !== '["BOSS_MAINTENANCE_ADMIN"]')
                    problems.push(`MAINTENANCE_ALL_ORGANIZATIONS's bundles: ${holders("MAINTENANCE_ALL_ORGANIZATIONS")}`)
            })
            const settingsKeys = user =>
                // the settings index is the framework's since Admin Screens Down (impl-maintenance F116)
                Array.from(asUser(user, () => invoke("org.moqui.admin.ReadinessServices.find#Settings", {})).entries || []).map(
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

// P5: recording an outage is a supervisor's, a resource administrator's or an assigned technician's (Mantle's
// record#ResourceUnavailability): the supervisor links Room 201's open outage, the planner is refused, and Retail's forklift is
// refused to the supervisor as a missing one; restoring is the supervisor's, not the technician's
feature(
    "recording and restoring an outage is the supervisor's: the planner is refused, and Retail's forklift is refused to both",
    {
        when() {
            const record = "mantle.work.ResourceBookingServices.record#ResourceUnavailability"
            const write = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const room = {facilityId: ids.roomOutageFacilityId, unavailabilityReasonEnumId: "RurSafety"}
            return {
                supervisor: write(users.supervisor, record, room),
                planner: write(users.planner, record, room),
                otherAsset: write(users.supervisor, record, {
                    assetId: ids.otherAssetId,
                    unavailabilityReasonEnumId: "RurEquipmentFault"
                }),
                techRestores: write(users.tech, "mantle.work.ResourceBookingServices.end#ResourceUnavailability", {
                    resourceUnavailabilityId: ids.roomOutageId,
                    expectedRevision: 1,
                    dispositionEnumId: "MdispAvailable"
                }),
                rows: system(() =>
                    ec.entity
                        .find("mantle.work.effort.ResourceUnavailability")
                        .condition("facilityId", ids.roomOutageFacilityId)
                        .count()
                )
            }
        },
        then({supervisor, planner, otherAsset, techRestores, rows}) {
            supervisor == ""
            rows == 1
            planner.includes("PERMISSION_DENIED")
            otherAsset.includes("RECORD_UNAVAILABLE")
            techRestores.includes("PERMISSION_DENIED")
        }
    }
)
feature(
    "issuing a part is the assigned technician's with the stock grant: one without it is refused, and another owner's stock is",
    {
        when() {
            const issue = "mantle.work.MaintenanceExecutionServices.issue#MaintenanceMaterial"
            const write = (user, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(issue, parameters)
                })
            const part = {workEffortId: ids.inProgressOrderId, productId: ids.gasketId, quantity: 1}
            return {
                tech: write(users.tech, Object.assign({operationKey: "access-p9-1", assetId: ids.gasketStockId}, part)),
                tech2: write(users.tech2, Object.assign({operationKey: "access-p9-2", assetId: ids.gasketStockId}, part)),
                planner: write(users.planner, Object.assign({operationKey: "access-p9-3", assetId: ids.gasketStockId}, part)),
                otherOwner: write(users.tech, {
                    operationKey: "access-p9-4",
                    workEffortId: ids.inProgressOrderId,
                    assetId: ids.otherOwnerStockId,
                    quantity: 1
                })
            }
        },
        then({tech, tech2, planner, otherOwner}) {
            tech == ""
            tech2.includes("PERMISSION_DENIED")
            planner.includes("PERMISSION_DENIED")
            otherOwner.includes("OWNER_MISMATCH")
        }
    }
)

// P13: a preventive plan is read by a maintenance reader of its organization (MAINTENANCE_VIEW), not a resource administrator, a
// technician or Retail; a plan is made by a planner or supervisor (Mantle's store#MaintenanceSchedule), not a reader, and not by
// Retail's planner for Services' equipment (the same parameters)
feature(
    "a preventive plan is read by a maintenance reader of its organization, not a resource administrator, a technician or Retail; it is made by a planner only (P13)",
    {
        when() {
            const check = user =>
                asUser(user, () =>
                    refusal(checkRecord, {appRoot: "Maintenance", recordType: "plan", recordId: ids.compressorPlanId})
                )
            const make = (user, operationKey) =>
                asUser(user, () =>
                    system(() =>
                        refusal("mantle.work.MaintenancePlanServices.store#MaintenanceSchedule", {
                            operationKey,
                            assetId: ids.vanId,
                            scheduleName: "Van spec plan",
                            intervalQuantity: 6,
                            intervalUomId: "TF_mon",
                            firstDueLocal: "2027-01-15 08:00"
                        })
                    )
                )
            return {
                reader: check(users.reader),
                planner: check(users.planner),
                resources: check(users.resources),
                tech: check(users.tech),
                retail: check(users.retailPlanner),
                plannerMakes: make(users.planner, "mnt-access-plan-1"),
                readerMakes: make(users.reader, "mnt-access-plan-2"),
                retailMakes: make(users.retailPlanner, "mnt-access-plan-3")
            }
        },
        then(out) {
            out.reader == "" && out.planner == ""
            out.resources.includes("RECORD_UNAVAILABLE")
            out.tech.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            out.plannerMakes == ""
            out.readerMakes.includes("PERMISSION_DENIED")
            out.retailMakes.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature(
    "a booking policy and a blackout are the resource administrator's: the planner is refused, and Retail's facility is refused to both",
    {
        when() {
            const R = "mantle.work.ResourceBookingServices."
            const write = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            // preview# writes nothing: the holder's case is its answer
            const unmanaged = {facilityId: ids.unmanagedRoomId, approvalModeEnumId: "RbamAutomatic"}
            const blackout = {facilityId: ids.otherFacilityId, unavailabilityKindEnumId: "RukPlanned", fromDate: new Date(Date.now() + 864e5),
                thruDate: new Date(Date.now() + 2 * 864e5)}
            return {
                holder: write(users.resources, R + "preview#ResourceBookingPolicy", unmanaged),
                planner: write(users.planner, R + "preview#ResourceBookingPolicy", unmanaged),
                otherOrganization: write(users.resources, R + "preview#ResourceBookingPolicy", {facilityId: ids.otherFacilityId}),
                plannerBlackout: write(users.planner, R + "record#ResourceUnavailability", Object.assign({}, blackout, {facilityId: ids.unmanagedRoomId})),
                otherBlackout: write(users.resources, R + "record#ResourceUnavailability", blackout),
                approverReads: write(users.booking, R + "get#ResourceBookingPolicy", {facilityId: ids.managedRoomId}),
                approverOther: write(users.booking, R + "get#ResourceBookingPolicy", {facilityId: ids.unmanagedRoomId})
            }
        },
        then({holder, planner, otherOrganization, plannerBlackout, otherBlackout, approverReads, approverOther}) {
            holder == ""
            planner.includes("PERMISSION_DENIED")
            otherOrganization.includes("RECORD_UNAVAILABLE")
            plannerBlackout.includes("PERMISSION_DENIED")
            otherBlackout.includes("RECORD_UNAVAILABLE") || otherBlackout.includes("PERMISSION_DENIED")
            // a booking approver reads the policy of the room they approve, not another's
            approverReads == ""
            approverOther.includes("RECORD_UNAVAILABLE")
        }
    }
)

// P14: a plan's work is generated by a planner or supervisor of its organization (Mantle's generate#MaintenanceWorkOrders), not a
// reader, and Retail's planner gets Services' plan refused with the same parameters; PM compliance is a maintenance reader's of
// their organizations, not a technician's (no MAINTENANCE_VIEW), and Retail's planner reads none of Services' plans
feature(
    "a plan's work is generated by a planner of its organization, not a reader or Retail; PM compliance is a reader's of their organizations (P14)",
    {
        when() {
            const P = "mantle.work.MaintenancePlanServices."
            const preview = user =>
                asUser(user, () =>
                    system(() => {
                        ec.message.pushErrors()
                        try {
                            const out = invoke(P + "generate#MaintenanceWorkOrders", {
                                maintenanceScheduleId: ids.filterPlanId,
                                preview: true
                            })
                            return ec.message.hasError()
                                ? ec.message.getErrorsString()
                                : out.results?.[0]?.code || out.results?.[0]?.outcome
                        } catch (error) {
                            return String(error.message)
                        } finally {
                            ec.message.clearErrors()
                            ec.message.popErrors()
                        }
                    })
                )
            const compliance = user =>
                asUser(user, () =>
                    system(() => {
                        ec.message.pushErrors()
                        try {
                            const out = invoke("mantle.work.MaintenanceReportServices.get#MaintenanceCompliance", {
                                maintenanceScheduleId: ids.filterPlanId,
                                fromDate: new Date(Date.parse("2026-08-01T00:00:00Z"))
                            })
                            return ec.message.hasError() ? ec.message.getErrorsString() : String(out.summary?.dueCount)
                        } catch (error) {
                            return String(error.message)
                        } finally {
                            ec.message.clearErrors()
                            ec.message.popErrors()
                        }
                    })
                )
            return {
                planner: preview(users.planner),
                reader: preview(users.reader),
                retail: preview(users.retailPlanner),
                readerCompliance: compliance(users.reader),
                techCompliance: compliance(users.tech),
                retailCompliance: compliance(users.retailPlanner)
            }
        },
        then(out) {
            out.planner == "ready"
            out.reader.includes("PERMISSION_DENIED")
            out.retail == "RECORD_UNAVAILABLE"
            Number(out.readerCompliance) >= 3
            out.techCompliance.includes("PERMISSION_DENIED")
            out.retailCompliance == "0"
        }
    }
)

feature(
    "booking requests are their approver's: a planner is refused the list and the decision, and a room the approver does not approve is refused",
    {
        when() {
            const R = "mantle.work.ResourceBookingServices."
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const listed = asUser(users.booking, () => {
                ec.artifactExecution.disableAuthz()
                // from the demo's week, so the handover (Nov 18, 2026) is listed after its day has passed too
                return invoke(R + "find#ResourceBookingRequests", {fromDate: "2026-11-12"}).requestList || []
            })
            // another organization's facility asked by name lists nothing
            const otherListed = asUser(users.booking, () => {
                ec.artifactExecution.disableAuthz()
                return invoke(R + "find#ResourceBookingRequests", {facilityId: ids.otherFacilityId, fromDate: "2026-11-12"}).requestList || []
            })
            const deny = {workEffortId: ids.requestedEventId, facilityId: ids.managedRoomId, decision: "deny", reason: "Spec"}
            return {
                listed,
                otherListed,
                planner: as(users.planner, R + "find#ResourceBookingRequests", {}),
                plannerDecides: as(users.planner, R + "decide#ResourceBooking", deny),
                otherRoom: as(users.booking, R + "decide#ResourceBooking", Object.assign({}, deny, {facilityId: ids.otherFacilityId}))
            }
        },
        then({listed, otherListed, planner, plannerDecides, otherRoom}) {
            listed.some(row => row.workEffortId == ids.requestedEventId && row.canDecide)
            otherListed.length == 0
            planner.includes("PERMISSION_DENIED")
            plannerDecides.includes("PERMISSION_DENIED")
            otherRoom.includes("NOT_APPROVER")
        }
    }
)

// P7: a work order's checklist is read by its readers (Mantle's get#ProcessExecution: the technician it is assigned to, not another
// technician, and not Retail's planner), and a waiver is a supervisor's (waive#ProcessStep: the technician refused before anything
// else; the supervisor passes the permission and is refused only for naming the work order, not a step)
feature("a work order's checklist is read by its technician, not another or Retail's planner; a waiver is a supervisor's", {
    when() {
        const call = (user, service, parameters) =>
            asUser(user, () => {
                ec.artifactExecution.disableAuthz()
                return refusal(service, parameters)
            })
        const read = user => call(user, "mantle.work.ProcessServices.get#ProcessExecution", {workEffortId: ids.inProgressOrderId})
        const waive = user =>
            call(user, "mantle.work.ProcessServices.waive#ProcessStep", {workEffortId: ids.inProgressOrderId, reason: "Spec"})
        const problems = []
        if (read(users.tech) !== "") problems.push("the technician cannot read: " + read(users.tech))
        if (!read(users.tech2).includes("NOT_ASSIGNED")) problems.push("another technician reads: " + read(users.tech2))
        if (!read(users.retailPlanner).includes("RECORD_UNAVAILABLE")) problems.push("Retail reads: " + read(users.retailPlanner))
        if (!waive(users.tech).includes("PERMISSION_DENIED")) problems.push("the technician waives: " + waive(users.tech))
        if (!waive(users.supervisor).includes("STEP_REQUIRED")) problems.push("the supervisor: " + waive(users.supervisor))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a work order's purchases are its planner's: a resource administrator and Retail are refused; a technician asks for nothing and a planner links no unrequested line; the receiving supervisor opens no Warehouse",
    {
        when() {
            const S = "mantle.work.MaintenanceServices."
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const work = {workEffortId: ids.heldOrderId}
            return {
                holder: as(users.planner, S + "get#MaintenancePurchases", work),
                resources: as(users.resources, S + "get#MaintenancePurchases", work),
                otherOrganization: as(users.retailPlanner, S + "get#MaintenancePurchases", work),
                techAsks: as(users.tech2, S + "link#MaintenancePurchase", Object.assign({requestName: "Bearings"}, work)),
                plannerLinks: as(
                    users.planner,
                    S + "link#MaintenancePurchase",
                    Object.assign({orderId: "BOSS_PUR_PO_SVC", orderItemSeqId: "01"}, work)
                ),
                otherAsks: as(users.retailPlanner, S + "link#MaintenancePurchase", Object.assign({requestName: "Bearings"}, work)),
                // the supervisor holds STOCK_RECEIVE through Warehouse's receiving group (R1), which opens no Warehouse screen
                supervisorApps: shellData(users.supervisor).apps.map(app => app.name),
                supervisorQuickCreates: quickCreates(users.supervisor)
            }
        },
        then({holder, resources, otherOrganization, techAsks, plannerLinks, otherAsks, supervisorApps, supervisorQuickCreates}) {
            holder == ""
            resources.includes("PERMISSION_DENIED")
            otherOrganization.includes("RECORD_UNAVAILABLE")
            techAsks.includes("PERMISSION_DENIED")
            plannerLinks.includes("PERMISSION_DENIED")
            otherAsks.includes("RECORD_UNAVAILABLE")
            supervisorApps.includes("Maintenance")
            !supervisorApps.includes("Warehouse")
            !supervisorQuickCreates.includes("warehouseNewReceipt")
        }
    }
)

feature(
    "the stack providers answer a work order's card and a caller's work to its planner, not a resource administrator, Retail or a requester; Comms offers Report a problem to a reporter only",
    {
        when() {
            const S = "ironstone.maintenance.StackServices."
            const card = user =>
                asUser(user, () => {
                    try {
                        const out = invoke(S + "lookup#Records", {
                            operation: "card",
                            recordEntityName: "mantle.work.effort.WorkEffort",
                            recordId: ids.inProgressOrderId
                        })
                        if (ec.message.hasError()) return "refused " + ec.message.getErrorsString()
                        return out.card ? "card" : "none"
                    } catch (error) {
                        return "refused " + error.message
                    }
                })
            // the requester's spec-local work number: a colleague, whose call names the work order of the request they filed (R4)
            system(() =>
                call("mantle.party.ContactServices.create#TelecomNumber", {
                    partyId: "BOSS_MNT_REQUESTER",
                    countryCode: "1",
                    areaCode: "801",
                    contactNumber: "777-0194",
                    contactMechPurposeId: "PhoneWork"
                })
            )
            const callWork = user =>
                asUser(user, () => {
                    try {
                        const out = invoke(S + "get#CallContext", {number: "+18017770194"})
                        if (ec.message.hasError()) return "refused " + ec.message.getErrorsString()
                        return Array.from(out.recordList || []).some(row => row.url.includes(ids.inProgressOrderId))
                            ? "work"
                            : "none"
                    } catch (error) {
                        return "refused " + error.message
                    }
                })
            // Comms' Chat message actions (the screen-extend's ext-action, shown by Report a problem's grant)
            const chatActions = user =>
                asUser(user, () => {
                    const result = ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot.xml")
                        .render("extItems/apps/Comms/Chat", {}, null)
                    ec.message.clearErrors()
                    if (result.status != 200) return []
                    return Array.from(JSON.parse(String(result.output)).actions || []).map(action => action.name)
                })
            return {
                holderCard: card(users.planner),
                resourcesCard: card(users.resources),
                otherCard: card(users.retailPlanner),
                requesterCard: card(users.requester),
                holderCall: callWork(users.planner),
                otherCall: callWork(users.retailPlanner),
                requesterCall: callWork(users.requester),
                requesterActions: chatActions(users.requester),
                otherAppActions: chatActions(users.otherApp)
            }
        },
        then(out) {
            out.holderCard == "card"
            out.resourcesCard == "none"
            out.otherCard == "none"
            refused(out.requesterCard)
            out.holderCall == "work"
            out.otherCall == "none"
            refused(out.requesterCall)
            out.requesterActions.includes("maintenance.reportProblem")
            !out.otherAppActions.includes("maintenance.reportProblem")
        }
    }
)

// P18: the equipment import is run by a holder of MAINTENANCE_IMPORT with the resource edit permission (the resource administrator),
// read by a reader of equipment, and its organizations are the importer's own; the setup readiness is the Maintenance
// administrator's
feature(
    "the equipment import is the resource administrator's: the planner reads it and runs none, Retail's planner gets no Services import; readiness is the administrator's",
    {
        when() {
            const mount = user =>
                asUser(user, () => {
                    ec.message.pushErrors()
                    try {
                        // the screen's grant aside (EquipmentImport carries the Equipment area's): the mount's own checks decide
                        const found = system(() => invoke("ironstone.shared.DataImportServices.get#ImportMount", {appRoot: "Maintenance"}))
                        return ec.message.hasError() ? {refused: ec.message.getErrorsString()} : found.importMount
                    } catch (error) {
                        return {refused: String(error.message)}
                    } finally {
                        ec.message.clearErrors()
                        ec.message.popErrors()
                    }
                })
            const scopes = user =>
                asUser(user, () =>
                    Array.from(
                        invoke("mantle.product.MaintenanceImportServices.find#EquipmentImportScopes", {targetId: "equipment"})
                            .scopeList || []
                    ).map(scope => scope.scopeKey)
                )
            const readiness = user =>
                asUser(user, () =>
                    refusal("mantle.work.MaintenanceSettingsServices.check#MaintenanceReadiness", {
                        organizationPartyId: ids.organizationId
                    })
                )
            return {
                holder: mount(users.resources),
                planner: mount(users.planner),
                requester: mount(users.requester),
                holderScopes: scopes(users.resources),
                retailScopes: scopes(users.retailPlanner),
                adminReadiness: readiness(users.admin),
                resourcesReadiness: readiness(users.resources)
            }
        },
        then(out) {
            out.holder.targetId == "equipment" && out.holder.canRun === true
            out.planner.targetId == "equipment" && out.planner.canRun === false
            !!out.requester.refused
            out.holderScopes.includes(ids.organizationId)
            !out.retailScopes.includes(ids.organizationId)
            out.adminReadiness == ""
            out.resourcesReadiness.includes("PERMISSION_DENIED")
        }
    }
)

// P12: a customer repair (a spec-local organization's, lib.customerRepair) has its report stored by its assigned technician
// (store#InterventionReport: past the permission and scope to WORK_NOT_DONE on the work not yet complete, so nothing is rendered
// or stored here; WarrantyManagedRepair stores it), not its organization's Customer Service agent (no maintenance permission) or
// Services' technician; the customer's unit is read through the repair (the work order and its report screen open to the
// technician, the asset's own record does not); Customer Service's send#InterventionReport is its organization's agent's (past
// the scope to REPORT_REQUIRED), not the technician's or Services' agent, with the same parameters
feature(
    "a customer repair's report is stored by its technician and sent by the claim's agent; the customer's unit is read through it (P12)",
    {
        when() {
            const repair = lib.customerRepair("ACCESS")
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const store = user =>
                as(user, "mantle.work.MaintenanceServices.store#InterventionReport", {workEffortId: repair.workEffortId})
            const send = user =>
                as(user, "mantle.request.WarrantyServices.send#InterventionReport", {
                    operationKey: "access-p12-" + user,
                    requestId: repair.requestId,
                    assetMaintenanceId: repair.assetMaintenanceId,
                    toAddress: "nobody@example.com"
                })
            const check = (recordType, recordId) =>
                asUser(repair.tech, () => refusal(access + "check#Record", {appRoot: "Maintenance", recordType, recordId}))
            const holder = store(repair.tech)
            const agentStores = store(repair.agent)
            const otherOrganization = store(users.tech)
            const agent = send(repair.agent)
            // completed, the report screen offers the store to its technician (its one qvt render)
            system(() =>
                call("update#mantle.work.effort.WorkEffort", {workEffortId: repair.workEffortId, statusId: "WeComplete"})
            )
            return {
                holder,
                agentStores,
                otherOrganization,
                agent,
                report: asUser(repair.tech, () => page("WorkOrders/InterventionReport", {workEffortId: repair.workEffortId})),
                workOrder: check("workOrder", repair.workEffortId),
                asset: check("asset", repair.assetId),
                techSends: send(repair.tech),
                otherAgent: send("customerservice.services")
            }
        },
        then(r) {
            r.holder.includes("WORK_NOT_DONE")
            r.agentStores.includes("PERMISSION_DENIED")
            r.otherOrganization.includes("RECORD_UNAVAILABLE")
            r.report.errors.length == 0
            r.report.output.includes("Intervention report")
            r.report.output.includes("Repair spec customer ACCESS")
            r.report.output.includes("Store for the customer")
            r.workOrder == ""
            r.asset.includes("RECORD_UNAVAILABLE")
            r.agent.includes("REPORT_REQUIRED")
            r.techSends.includes("PERMISSION_DENIED")
            r.otherAgent.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature(
    "Report a problem from a chat message reads it under Comms' room check with the user's own filters: a room of Retail's record is refused, a public room's message filed",
    {
        when() {
            // a record room of Retail's forklift (read by those who may see the forklift) and a public room, made by the system
            const made = system(() => {
                const room = (fields, body) => {
                    const chatRoomId = call("org.moqui.chat.ChatServices.create#Room", fields).chatRoomId
                    const eventSeq = call("org.moqui.chat.ChatServices.send#Message", {chatRoomId, body}).eventSeq
                    return {chatRoomId, eventSeq}
                }
                return {
                    retail: room(
                        {
                            roomTypeEnumId: "CrtRecord",
                            visibilityEnumId: "CrvRecord",
                            recordEntityName: "mantle.product.asset.Asset",
                            recordId: ids.otherAssetId,
                            roomName: "Spec forklift room"
                        },
                        "<p>Forklift mast chain is frayed</p>"
                    ),
                    open: room(
                        {roomTypeEnumId: "CrtPublic", visibilityEnumId: "CrvUsers", roomName: "Spec maintenance chat"},
                        "<p>Compressor belt squeals at start</p>"
                    )
                }
            })
            // the requester's Report a problem from each (ReportProblem's transition, as the Comms action's dialog posts it)
            const report = (source, summary) =>
                asUser(users.requester, () =>
                    page(
                        "ReportProblem/reportProblem",
                        {
                            targetKey: "asset:" + ids.compressorId,
                            summary,
                            priority: "5",
                            operationKey: "spec-mnt-chat-" + source.chatRoomId,
                            sourceChatRoomId: source.chatRoomId,
                            sourceEventSeq: String(source.eventSeq)
                        },
                        "json",
                        "Commons"
                    )
                )
            const retail = report(made.retail, "Spec forklift chain")
            const open = report(made.open, "Spec compressor belt")
            const filed = summary =>
                system(() => {
                    const request = ec.entity.find("mantle.request.Request").condition("requestName", summary).one()
                    return request
                        ? ec.entity.find("mantle.request.RequestCommEvent").condition("requestId", request.requestId).count()
                        : -1
                })
            return {retail, open, retailFiled: filed("Spec forklift chain"), openFiled: filed("Spec compressor belt")}
        },
        then({retail, open, retailFiled, openFiled}) {
            !retail.output.includes("Problem reported as request")
            retailFiled == -1
            open.output.includes("Problem reported as request")
            openFiled == 1
        }
    }
)

// P11: costs are the cost reader's (MAINTENANCE_COST_VIEW): Mantle's get#MaintenanceCosts answers maint.cost and refuses the planner
// and the supervisor, and another organization; the Costs tab and the cost report (BOSS_MNT_COSTS) are in the cost reader's menu and
// no one else's (the report in the Reports area beside PM compliance), and refused to the planner
feature(
    "a work order's costs are the cost reader's: the planner and the supervisor are refused, Retail is refused, and only the cost reader has the tab and the report",
    {
        when() {
            const as = (user, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal("mantle.work.MaintenanceReportServices.get#MaintenanceCosts", parameters)
                })
            const work = {workEffortId: ids.heldOrderId}
            const tabs = user =>
                shell(user, true, "WorkOrders/WorkOrderDetail/Overview?workEffortId=" + ids.heldOrderId, "WorkOrderDetail").names
            const areas = user => shell(user, true, "Reports/PreventiveComplianceReport", "Reports").names
            return {
                holder: as(users.cost, work),
                planner: as(users.planner, work),
                supervisor: as(users.supervisor, work),
                otherOrganization: as(users.cost, {organizationPartyId: ids.otherOrganizationId}),
                costTabs: tabs(users.cost),
                plannerTabs: tabs(users.planner),
                costAreas: areas(users.cost),
                plannerAreas: areas(users.planner),
                plannerTab: screenRefusal(users.planner, "WorkOrders/WorkOrderDetail/Costs", work),
                plannerReport: screenRefusal(users.planner, "Reports/MaintenanceCostReport")
            }
        },
        then(r) {
            r.holder == ""
            r.planner.includes("PERMISSION_DENIED")
            r.supervisor.includes("PERMISSION_DENIED")
            r.otherOrganization.includes("ORGANIZATION_DENIED")
            r.costTabs.includes("Costs")
            r.plannerTabs.includes("Overview")
            !r.plannerTabs.includes("Costs")
            r.costAreas.includes("MaintenanceCostReport")
            !r.plannerAreas.includes("MaintenanceCostReport")
            r.plannerTab != ""
            r.plannerReport != ""
        }
    }
)

// P17: the work status report and the reports catalogue are a maintenance reader's (MAINTENANCE_VIEW), not a technician's; Retail's
// planner asking for Services' organization is refused
feature(
    "work status and the reports catalogue are a reader's, not a technician's; Retail's planner gets no Services report (P17)",
    {
        when() {
            const status = (user, parameters = {}) =>
                asUser(user, () =>
                    system(() => refusal("mantle.work.MaintenanceReportServices.get#MaintenanceStatusReport", parameters))
                )
            const catalogue = user =>
                asUser(user, () => refusal("ironstone.maintenance.ReportServices.get#ReportCatalogue", {appRoot: "Maintenance"}))
            return {
                reader: status(users.reader),
                tech: status(users.tech),
                retail: status(users.retailPlanner, {organizationPartyId: ids.organizationId}),
                readerCatalogue: catalogue(users.reader),
                techCatalogue: catalogue(users.tech)
            }
        },
        then(out) {
            out.reader == ""
            out.tech.includes("PERMISSION_DENIED")
            out.retail.includes("ORGANIZATION_DENIED")
            out.readerCatalogue == ""
            out.techCatalogue.includes("PERMISSION_DENIED")
        }
    }
)

// P8: a team's dispatch defaults are the settings editor's (Mantle's store#MaintenanceTeamDefaults), Retail's planner reads no Services
// team; P8 review: Teams is read by a planner and a supervisor (BOSS_MNT_TEAMS), the only Settings tab they open, without the form
feature(
    "a team's defaults are the administrator's; Teams is read by a planner and supervisor, its form and the other tabs not theirs",
    {
        when() {
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal("mantle.work.MaintenanceSettingsServices." + service, parameters)
                })
            const team = {teamPartyId: ids.fieldTeamId}
            const teams = user =>
                asUser(user, () =>
                    page("Settings/Teams", {organizationPartyId: ids.organizationId, teamPartyId: ids.fieldTeamId}, "html")
                )
            const planner = teams(users.planner)
            return {
                holder: as(users.admin, "store#MaintenanceTeamDefaults", Object.assign({intakeTag: "compressors"}, team)),
                planner: as(users.planner, "store#MaintenanceTeamDefaults", Object.assign({intakeTag: "compressors"}, team)),
                retail: as(users.retailPlanner, "find#MaintenanceTeams", team),
                plannerTab: planner.status + " " + planner.errors.join(" | "),
                plannerReads: planner.output.includes("Owen Castillo"),
                plannerForm: planner.output.includes("Default technician"),
                supervisorTab: screenRefusal(users.supervisor, "Settings/Teams"),
                techTab: screenRefusal(users.tech, "Settings/Teams"),
                readerTab: screenRefusal(users.reader, "Settings/Teams"),
                plannerPolicy: screenRefusal(users.planner, "Settings/WorkPolicy"),
                // Settings lands a planner on Teams, its only tab for them
                plannerTabs: shell(users.planner, true, "Settings", "Settings").names
            }
        },
        then(r) {
            r.holder == ""
            r.planner.includes("PERMISSION_DENIED")
            r.retail.includes("RECORD_UNAVAILABLE")
            r.plannerTab == "200 "
            r.plannerReads == true && r.plannerForm == false
            r.supervisorTab == ""
            r.techTab != "" && r.readerTab != ""
            r.plannerPolicy != ""
            JSON.stringify(r.plannerTabs) == JSON.stringify(["Teams"])
        }
    }
)

// The user's call of Nov 12 on F346: Settings, Requests and the cost screens are gated by permission (each screen's menu-include
// and an always-action), so a custom group given a bundle in Admin (no member of BOSS_MAINTENANCE, whose deny rows do not reach it)
// gets what its permissions give: the planner bundle's opens Teams and Requests, its other Settings tabs refused (by the gate,
// or before it by Teams' non-inheritable grant on the Settings frame) and the cost screens refused; the reader bundle's, which
// the root's grant alone admits, is refused Settings and Requests by the gate
feature(
    "a custom group given the planner bundle opens Teams and Requests only of the gated screens; the reader bundle's neither",
    {
        when() {
            const planTeam = customTeam(customTeams.plan)
            const readTeam = customTeam(customTeams.read)
            const settingsTabs = ["Settings/SettingsHome", "Settings/WorkPolicy", "Settings/Lookups", "Settings/Readiness"]
            return {
                plannerSettings: settingsTabs.filter(path => screenRefusal(planTeam, path) == ""),
                plannerCosts: [
                    screenRefusal(planTeam, "Reports/MaintenanceCostReport"),
                    screenRefusal(planTeam, "WorkOrders/WorkOrderDetail/Costs", {workEffortId: ids.heldOrderId})
                ],
                teams: screenRefusal(planTeam, "Settings/Teams"),
                requests: screenRefusal(planTeam, "Requests"),
                settingsTabs: shell(planTeam, true, "Settings", "Settings").names,
                readerSettings: screenRefusal(readTeam, "Settings/SettingsHome"),
                readerRequests: screenRefusal(readTeam, "Requests")
            }
        },
        then(r) {
            r.plannerSettings.join() == ""
            r.plannerCosts.every(message => message.includes("PERMISSION_DENIED"))
            r.teams == ""
            r.requests == ""
            JSON.stringify(r.settingsTabs) == JSON.stringify(["Teams"])
            r.readerSettings.includes("PERMISSION_DENIED")
            r.readerRequests.includes("PERMISSION_DENIED")
        }
    }
)
