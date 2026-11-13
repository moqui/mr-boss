// Sales P1's "usable when" (impl-sales P1), as an acceptance walk with artifact authorization on: the menu renders for each group
// with only its areas (Home for every Sales user, Reports for a holder of SALES_REPORT_VIEW, and since P2 Settings for the
// administrator and the managers), each entry opening and the others refused; sales.reader opens SalesSummary for Ziziwork Retail and is refused Ziziwork Sales'; an access administrator assigns the
// Sales representative bundle with the launcher's from Admin to a custom group, whose member then opens Sales with a
// representative's capabilities and menu; a Projects client and a PASS public account are refused the root and every
// ironstone.sales service, which a representative calls with the same parameters. The rules themselves are SalesAccess's and
// Mantle's SalesOrganizationScope and SalesReports.
// Run: ./moq accept mr-boss --spec SalesFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell, page} = lib
const admin = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const capability = "org.moqui.admin.AccessServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const refused = message => /SALES_UNAVAILABLE|is not authorized/.test(message)
// each group's menu (design §1.2 as built, Sales.xml's menu-include): Reports for a holder of SALES_REPORT_VIEW
const menus = {
    [users.rep]: ids.staffMenu,
    [users.rep2]: ids.staffMenu,
    [users.otherRep]: ids.staffMenu,
    [users.approver]: ids.staffMenu,
    [users.change]: ids.staffMenu,
    [users.agreement]: ids.staffMenu,
    // P2: Settings for the administrator and, for Teams, the managers
    [users.manager]: ids.managerMenu,
    [users.bothManager]: ids.managerMenu,
    [users.reader]: ids.reportMenu,
    [users.admin]: ids.managerMenu,
    [users.system]: ids.managerMenu
}
// every ironstone.sales service a screen calls, with parameters it accepts from a Sales user of Retail
const salesServices = [
    ["ironstone.sales.ContextServices.get#SharedContext", {}],
    ["ironstone.sales.ContextServices.check#Record", {recordType: "organization", recordId: ids.organizationId}],
    ["ironstone.sales.ContextServices.get#Choices", {choice: "organizations"}],
    ["ironstone.sales.ContextServices.search#Records", {text: "zizi"}]
]
// a custom team an access administrator grants the representative bundle to, and a spec-local user in it (an agent of Retail)
const teamId = "ACC_SAL_REP_TEAM"
const teamUser = "ACC_SAL_TEAM_USER"

spec({
    setupSpec() {
        login("john.doe")
        asUser(admin.users.access, () =>
            invoke("org.moqui.admin.AccessServices.create#Group", {
                userGroupId: teamId,
                description: "Acceptance sales representatives",
                groupTypeEnumId: "UgtCustomTeam"
            })
        )
        system(() => {
            call("create#mantle.party.Party", {partyId: teamUser, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: teamUser, firstName: "Acceptance", lastName: "Team representative"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: teamUser,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: teamUser,
                username: "sales.accept.team",
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

feature("the menu renders for each group with only its areas; each entry opens and Reports is refused the others", {
    when() {
        const problems = []
        for (const [user, expected] of Object.entries(menus)) {
            const found = shell(user, user === users.system)
            if (found.status != 200 || JSON.stringify(found.names) !== JSON.stringify(expected))
                problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const entry of ids.managerMenu) {
                const rendered = asUser(user, () => page(entry, {}, "html"))
                if (expected.includes(entry) !== opened(rendered))
                    problems.push(`${user} ${opened(rendered) ? "opens" : "is refused"} ${entry}: ${rendered.errors.join(" | ")}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("sales.reader opens SalesSummary for Ziziwork Retail and is refused Ziziwork Sales'", {
    when() {
        return asUser(users.reader, () => ({
            own: page("Reports/SalesSummary", {vendorPartyIds: ids.organizationId}, "html"),
            other: page("Reports/SalesSummary", {vendorPartyIds: ids.otherOrganizationId}, "html")
        }))
    },
    then({own, other}) {
        opened(own)
        own.output.includes("Sales Summary for")
        !opened(other)
        other.errors.join(" ").includes("ORGANIZATION_DENIED")
    }
})

feature(
    "an access administrator assigns the Sales representative bundle to a custom group, whose member opens Sales as a representative",
    {
        when() {
            const bundleRows = (entity, userGroupId, field) =>
                system(() =>
                    Array.from(ec.entity.find(entity).condition("userGroupId", userGroupId).list()).map(row => row[field])
                )
            const permissions = bundleRows(
                "moqui.security.CapabilityBundlePermission",
                "BOSS_SALES_REP",
                "userPermissionId"
            ).concat(bundleRows("moqui.security.CapabilityBundlePermission", "BOSS_SALES", "userPermissionId"))
            const artifacts = bundleRows("moqui.security.CapabilityBundleArtifact", "BOSS_SALES", "artifactGroupId")
            const changes = permissions
                .map(permission => teamId + "~a~p:" + permission)
                .concat(artifacts.map(artifactGroupId => teamId + "~a~a:" + artifactGroupId))
                .join(",")
            const taken = asUser(admin.users.access, () => {
                const matrix = invoke(capability + "get#MatrixContext", {appName: "Sales", groups: teamId})
                const proposal = invoke(capability + "get#MatrixContext", {appName: "Sales", groups: teamId, changes})
                const applied = invoke(capability + "apply#MatrixChanges", {
                    changes,
                    revisions: proposal.proposal.revisions,
                    reason: "Sales representatives"
                })
                return {matrix, proposal, applied}
            })
            const teamContext = asUser("sales.accept.team", () => invoke("ironstone.sales.ContextServices.get#SharedContext", {}))
            return Object.assign(taken, {permissions, teamContext, menu: shell("sales.accept.team")})
        },
        then({matrix, proposal, permissions, teamContext, menu}) {
            JSON.stringify(matrix).includes("Sales representative")
            JSON.stringify(matrix).includes("Sales app users")
            proposal.proposal.canApply == true
            permissions.includes("SALES_OPPORTUNITY_EDIT")
            permissions.includes("SALES_VIEW")
            teamContext.capabilities.read == true
            teamContext.capabilities.view == true
            teamContext.capabilities.opportunityEdit == true
            teamContext.capabilities.reportRead == false
            teamContext.organizationPartyIds.includes(ids.organizationId)
            menu.apps.includes("Sales")
            menu.names == ids.staffMenu
        }
    }
)

feature("a Projects client and a PASS public account are refused the root and every ironstone.sales service", {
    when() {
        const problems = []
        for (const user of [users.client, users.pass]) {
            const home = asUser(user, () => page("Home", {}, "html"))
            if (opened(home)) problems.push(`${user} opens Home`)
            if (shell(user).apps.includes("Sales")) problems.push(`${user}'s launcher has Sales`)
            for (const [service, parameters] of salesServices) {
                const message = asUser(user, () => refusal(service, parameters))
                if (!refused(message)) problems.push(`${user} calls ${service}: ${message || "accepted"}`)
            }
        }
        // a representative calls each with the same parameters
        for (const [service, parameters] of salesServices) {
            const message = asUser(users.rep, () => refusal(service, parameters))
            if (message) problems.push(`the representative's ${service}: ${message}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
