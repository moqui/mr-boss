// Maintenance P1's "usable when" (impl-maintenance P1), as an acceptance walk with artifact authorization on, brought to the app
// as built (P20, F169): the menu renders for each group with only its areas (each root entry's menu-include and the Requests, Costs
// and Settings permission gates, F346), each entry of it opening and the others refused (Requests and Settings, by their gates) or showing none of
// their records (the areas a menu condition keeps out, whose Mantle reads refuse the user); maint.requester has no Maintenance launcher and is refused
// the root and every ironstone.maintenance service, as a Projects client and a PASS public account are; Admin's Capabilities shows
// the Maintenance bundles and an access administrator grants the planner bundle (its permissions, its artifact grants and the
// launcher) to a custom group, whose member then opens Maintenance with the planner's capabilities and menu (Settings for its Teams tab
// alone, by the permission gates of the user's call of Nov 12 on F346);
// Admin's settings index lists Maintenance settings for maint.admin and not for maint.reader. The rules themselves are
// MaintenanceAccess's and Mantle's MaintenanceScope; the review walk of every group is MaintenanceAccessWalk.
// Run: ./moq accept mr-boss --spec MaintenanceFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell, page} = lib
const admin = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const capability = "org.moqui.admin.AccessServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// each group's menu (design §1.2 as built, Maintenance.xml's menu-include): Work orders, Preventive and Reports for a work reader
// (an assigned technician Work orders alone), Requests for a planner or supervisor (MAINTENANCE_PLAN or _SUPERVISE), Procedures for
// a reader of procedures or a planner or supervisor, Equipment and Facilities for a reader of them, Scheduling for a resource
// administrator, a booking approver and a supervisor; Settings the administrator's (MAINTENANCE_SETTINGS_EDIT), and for its Teams
// tab alone a planner's and a supervisor's (P8); each gated by permission (F346), the BOSS_MNT_* deny rows kept beside the gates
const readerMenu = ["Home", "WorkOrders", "Procedures", "Preventive", "Equipment", "Facilities", "Reports"]
const techMenu = ["Home", "WorkOrders", "Equipment", "Facilities"]
const supervisorMenu = [
    "Home",
    "WorkOrders",
    "Requests",
    "Procedures",
    "Preventive",
    "Equipment",
    "Facilities",
    "Scheduling",
    "Reports",
    "Settings"
]
const menus = {
    [users.reader]: readerMenu,
    [users.planner]: ids.staffMenu,
    [users.tech]: techMenu,
    [users.tech2]: techMenu,
    [users.supervisor]: supervisorMenu,
    [users.author]: ids.authorMenu,
    [users.approver]: ids.authorMenu,
    [users.booking]: ids.bookingMenu,
    [users.resources]: ["Home", "Equipment", "Facilities", "Scheduling"],
    [users.cost]: ["Home", "WorkOrders", "Preventive", "Equipment", "Facilities", "Reports"],
    [users.retailPlanner]: ids.staffMenu,
    [users.admin]: ids.adminMenu,
    [users.system]: ids.adminMenu
}
const refused = message => /MAINTENANCE_UNAVAILABLE|is not authorized/.test(message)
// An entry outside a user's menu: Requests and Settings are refused by their permission gates (F346) and artifact grants;
// the other areas are kept out of the menu by permission alone and open with nothing of theirs, Mantle's reads refusing the user
// (Equipment and Facilities read nothing without a resource read, the lists and reports say none is open), so none of the demo
// record each would list shows. Scheduling has none: its resources are any resource reader's (find#BookableResources).
const outsideMarkers = {
    WorkOrders: "Air handler coil leak",
    Procedures: "Air compressor AC-200 service",
    Preventive: "Air handler AHU-2 filter change",
    Equipment: "Compressor C-1",
    Facilities: "Service Center",
    Scheduling: null,
    Reports: "Work status · backlog now"
}
const keptOut = (entry, rendered) =>
    !opened(rendered) || (Object.hasOwn(outsideMarkers, entry) && !(outsideMarkers[entry] && rendered.output.includes(outsideMarkers[entry])))
// every ironstone.maintenance service a screen calls, with parameters it accepts from a user who has Maintenance
const maintenanceServices = [
    ["ironstone.maintenance.ContextServices.get#SharedContext", {}],
    ["ironstone.maintenance.AccessServices.get#Capabilities", {}],
    ["ironstone.maintenance.AccessServices.check#Record", {recordType: "facility", recordId: ids.facilityId}],
    ["ironstone.maintenance.ContextServices.get#Choices", {choice: "organizations"}],
    ["ironstone.maintenance.ContextServices.search#Records", {text: "pump"}]
]
const groupUsers = [
    users.reader,
    users.planner,
    users.tech,
    users.tech2,
    users.supervisor,
    users.author,
    users.approver,
    users.booking,
    users.resources,
    users.cost,
    users.retailPlanner,
    users.admin
]
// a custom team an access administrator grants the planner bundle to, and a spec-local user in it (an agent of Services)
const teamId = "ACC_MNT_PLANNER_TEAM"
const teamUser = "ACC_MNT_TEAM_USER"

spec({
    setupSpec() {
        login("john.doe")
        asUser(admin.users.access, () =>
            invoke("org.moqui.admin.AccessServices.create#Group", {
                userGroupId: teamId,
                description: "Acceptance maintenance planners",
                groupTypeEnumId: "UgtCustomTeam"
            })
        )
        system(() => {
            call("create#mantle.party.Party", {partyId: teamUser, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: teamUser, firstName: "Acceptance", lastName: "Team planner"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: teamUser,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: teamUser,
                username: "maint.accept.team",
                partyId: teamUser,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", teamId])
                call("create#moqui.security.UserGroupMember", {userId: teamUser, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", teamUser)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("the menu renders for each group with only its areas; each entry opens and the others are refused or show none of theirs", {
    when() {
        const problems = []
        for (const user of groupUsers.concat([users.system])) {
            const found = shell(user, user === users.system)
            const expected = menus[user]
            if (found.status != 200 || JSON.stringify(found.names) !== JSON.stringify(expected))
                problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const entry of ids.adminMenu) {
                const rendered = asUser(user, () => page(entry, {}, "html"))
                if (expected.includes(entry) ? !opened(rendered) : !keptOut(entry, rendered))
                    problems.push(`${user} ${opened(rendered) ? "opens" : "is refused"} ${entry}: ${rendered.errors.join(" | ")}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("maint.requester has no Maintenance launcher; it, a client and a PASS account are refused the root and every service", {
    when() {
        const problems = []
        if (shell(users.requester).apps.includes("Maintenance")) problems.push("the requester's launcher has Maintenance")
        for (const user of [users.requester, users.client, users.pass]) {
            const home = asUser(user, () => page("Home", {}, "html"))
            if (opened(home)) problems.push(`${user} opens Home`)
            for (const [service, parameters] of maintenanceServices) {
                const message = asUser(user, () => refusal(service, parameters))
                if (!refused(message)) problems.push(`${user} calls ${service}: ${message || "accepted"}`)
            }
        }
        // the planner calls each with the same parameters
        for (const [service, parameters] of maintenanceServices) {
            const message = asUser(users.planner, () => refusal(service, parameters))
            if (message) problems.push(`the planner's ${service}: ${message}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Capabilities shows the Maintenance bundles, and an access administrator grants the planner bundle to a custom group", {
    when() {
        const plannerPermissions = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.security.CapabilityBundlePermission")
                    .condition("userGroupId", "BOSS_MAINTENANCE_PLAN")
                    .list()
            ).map(row => row.userPermissionId)
        )
        const plannerArtifacts = system(() =>
            Array.from(
                ec.entity.find("moqui.security.CapabilityBundleArtifact").condition("userGroupId", "BOSS_MAINTENANCE_PLAN").list()
            ).map(row => row.artifactGroupId)
        )
        const changes = plannerPermissions
            .map(permission => teamId + "~a~p:" + permission)
            .concat(plannerArtifacts.map(artifactGroupId => teamId + "~a~a:" + artifactGroupId))
            .concat([teamId + "~a~a:BOSS_MAINTENANCE"])
            .join(",")
        const taken = asUser(admin.users.access, () => {
            const matrix = invoke(capability + "get#MatrixContext", {appName: "Maintenance", groups: teamId})
            const proposal = invoke(capability + "get#MatrixContext", {appName: "Maintenance", groups: teamId, changes})
            const applied = invoke(capability + "apply#MatrixChanges", {
                changes,
                revisions: proposal.proposal.revisions,
                reason: "Maintenance planners"
            })
            return {matrix, proposal, applied}
        })
        const teamCapabilities = asUser(
            "maint.accept.team",
            () => invoke("ironstone.maintenance.AccessServices.get#Capabilities", {}).capabilities
        )
        return Object.assign(taken, {
            plannerPermissions,
            teamCapabilities,
            menu: shell("maint.accept.team"),
            teamSettings: shell("maint.accept.team", true, "Settings", "Settings").names
        })
    },
    then({matrix, proposal, plannerPermissions, teamCapabilities, menu, teamSettings}) {
        JSON.stringify(matrix).includes("Maintenance planner")
        JSON.stringify(matrix).includes("Maintenance app users")
        proposal.proposal.canApply == true
        plannerPermissions.includes("MAINTENANCE_PLAN")
        teamCapabilities.read == true
        teamCapabilities.plan == true
        teamCapabilities.view == true
        teamCapabilities.supervise == false
        menu.apps.includes("Maintenance")
        // the planner's menu, Settings for its Teams tab (MAINTENANCE_PLAN, and the bundle carries BOSS_MNT_TEAMS); its other tabs
        // stay the administrator's though the team is no member of BOSS_MAINTENANCE, whose deny rows do not reach it: each tab's
        // permission gate (MAINTENANCE_SETTINGS_EDIT, the user's call of Nov 12 on F346) keeps them from it
        menu.names == ids.staffMenu
        teamSettings == ["Teams"]
    }
})

feature("the settings index lists Maintenance settings for maint.admin and not for maint.reader", {
    when() {
        const keys = user =>
            Array.from(asUser(user, () => invoke("org.moqui.admin.ReadinessServices.find#Settings", {})).entries || []).map(
                entry => entry.settingsKey
            )
        const adminIndex = asUser(users.admin, () => admin.page("Settings/SettingsHome", {}, "html"))
        return {admin: keys(users.admin), reader: keys(users.reader), adminIndex}
    },
    then({admin, reader, adminIndex}) {
        admin.includes("maintenance.settings")
        !reader.includes("maintenance.settings")
        adminIndex.output.includes("Maintenance settings")
    }
})
