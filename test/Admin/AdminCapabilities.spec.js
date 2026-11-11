// Capabilities, row rules and the access review in Admin (impl-admin P9; design-admin §5 Capabilities and RowRules, §16):
// Capabilities' one qvt render (the matrix, its list twin, a proposal's effect with Apply, a rule no bundle describes read
// only); a launcher granted through the screen's transition implying no view or change, with its registered row rules, while
// a privileged group of mr-boss's is refused and named; RowRules' one render with a rule's source; and the access review's
// print (html-print) leaving sealed grants out and members outside the user's organizations unnamed. Capabilities and
// RowRules are the framework's System › Access screens, shown here by location (mr-moqui plans/Admin-Screens-Down.md): the
// matrix's own rules (its list twin, a proposal's controls and effect, a refused group named while the others apply, the
// bounds, the permissions) are the framework's AdminAccessCapabilities, as its grant rules (registered grants and row
// rules, sealed and privileged refusals, revisions) are AdminAccessServices'; the "usable when" is the acceptance
// AdminCapabilitiesUsable.
// Run: ./moq test mr-boss --spec Admin/AdminCapabilities
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const access = "org.moqui.admin.AccessServices."
const capability = "ironstone.admin.CapabilityServices."
const matrix = access + "get#MatrixContext"
const teamId = "SPEC_ADM_CAP_TEAM"
const launcher = "BOSS_WAREHOUSE"
const launcherToken = teamId + "~a~a:" + launcher
const rowsOf = (entityName, conditions) => system(() => Array.from(ec.entity.find(entityName).condition(conditions).list()))
const teamFilters = () =>
    rowsOf("moqui.security.ArtifactAuthz", {userGroupId: teamId, artifactGroupId: launcher})
        .flatMap(authz => rowsOf("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: authz.artifactAuthzId}))
        .map(row => row.entityFilterSetId)
        .sort()

spec({
    setupSpec() {
        login("john.doe")
        asUser(users.access, () =>
            invoke(access + "create#Group", {
                userGroupId: teamId,
                description: "Spec capability team",
                groupTypeEnumId: "UgtCustomTeam"
            })
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            for (const authz of ec.entity.find("moqui.security.ArtifactAuthz").condition({userGroupId: teamId}).list())
                ec.entity
                    .find("moqui.security.ArtifactAuthzFilter")
                    .condition({artifactAuthzId: authz.artifactAuthzId})
                    .deleteAll()
            for (const entityName of [
                "moqui.security.ArtifactAuthz",
                "moqui.security.UserGroupPermission",
                "moqui.security.UserGroup"
            ])
                ec.entity.find(entityName).condition({userGroupId: teamId}).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature("Capabilities shows the matrix and its list, a proposal's effect and a rule no bundle describes read only", {
    when() {
        const parameters = {
            appName: "Warehouse",
            groups: [launcher, teamId, ids.delegateGroupId].join(","),
            changes: launcherToken
        }
        return asUser(users.access, () => ({
            rendered: page("Access/Capabilities", parameters),
            context: invoke(matrix, parameters)
        }))
    },
    then({rendered, context}) {
        rendered.status == 200
        rendered.errors.length == 0
        // the matrix (CapabilityMatrix, the groups its columns) and the list (CapabilityList) on the one render
        rendered.output.includes("CapabilityMatrix") && rendered.output.includes("CapabilityList")
        rendered.output.includes("Warehouse launcher")
        rendered.output.includes("Spec capability team")
        // the proposal: its effect from preview#Grants, and Apply at the previewed revisions
        rendered.output.includes("Grant proposed")
        rendered.output.includes("grant(s) added")
        rendered.output.includes("ApplyChanges")
        // the delegate group's Access area grant is no registered binding: listed read only
        rendered.output.includes("Advanced rules (read only)")
        context.matrixRows[0].kind == "launcher"
        // the registered bundle holds its launcher with Mantle's row rules; the team is offered it
        context.matrixRows[0].cells[0].state == "granted" && context.matrixRows[0].cells[0].scopeText.includes("MANTLE_USER_ORG")
        context.proposal.canApply == true
        context.unsupportedRows.some(row => row.userGroupId === ids.delegateGroupId && row.id === "BOSS_ADM_ACCESS")
    }
})

feature(
    "a launcher granted through Capabilities implies no view or change, and a privileged group is refused while the other applies",
    {
        when() {
            const refusedToken = ids.backupGroupId + "~a~p:PRODUCT_CATALOG_VIEW"
            const changes = [launcherToken, refusedToken].join(",")
            const taken = asUser(users.access, () => {
                const before = invoke(matrix, {changes})
                const applied = page(
                    "Access/Capabilities/applyChanges",
                    {
                        appName: "Warehouse",
                        groups: teamId,
                        changes,
                        revisions: before.proposal.revisions,
                        reason: "Warehouse launcher"
                    },
                    "html"
                )
                const after = invoke(matrix, {appName: "Warehouse", groups: teamId})
                const result = invoke(access + "apply#MatrixChanges", {
                    changes: refusedToken,
                    revisions: before.proposal.revisions
                })
                return {before, applied, after, result}
            })
            const cell = kind => taken.after.matrixRows.find(row => row.kind === kind)?.cells[0]
            return Object.assign(taken, {
                launcherCell: cell("launcher"),
                viewCell: cell("view"),
                permissions: rowsOf("moqui.security.UserGroupPermission", {userGroupId: teamId}),
                filters: teamFilters(),
                backup: rowsOf("moqui.security.UserGroupPermission", {
                    userGroupId: ids.backupGroupId,
                    userPermissionId: "PRODUCT_CATALOG_VIEW"
                })
            })
        },
        then({before, applied, result, launcherCell, viewCell, permissions, filters, backup}) {
            // one group of the proposal is refused: nothing is offered to apply, and applying names it and applies the other
            before.proposal.canApply == false
            before.proposal.groups.find(row => row.userGroupId === ids.backupGroupId).allowed == false
            applied.errors.length == 0
            launcherCell.state == "granted" && launcherCell.actionText == "End"
            // the launcher came with the bundle's row rules, and with no permission: no view, no change
            filters.join() == "MANTLE_PRIVATE_CONTACT,MANTLE_USER_ORG"
            viewCell.state == "none" && viewCell.actionText == "Grant"
            permissions.length == 0
            backup.length == 0
            result.refusedCount == 1 && result.appliedCount == 0
            result.resultList[0].reasonCode == "PRIVILEGED_GROUP" && result.remainingChanges.includes(ids.backupGroupId)
        }
    }
)

feature("RowRules shows the team's row rules with the bundle they come from", {
    when() {
        return asUser(users.access, () => page("Access/RowRules", {userGroupId: teamId}))
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.includes("ScopeRules")
        output.includes("Spec capability team")
        output.includes("MANTLE_USER_ORG")
        output.includes("As bundle BOSS_WAREHOUSE registers it")
        // nothing to bind: the launcher came with every registered rule
        !output.includes("BindScope_")
    }
})

feature(
    "the access review prints grants, app gates and members in scope, leaving sealed grants out and other organizations' members unnamed",
    {
        when() {
            return asUser(users.access, () => ({
                printed: page("Access/AccessReview", {groups: [ids.delegateGroupId, teamId].join(",")}, "html-print"),
                // BOSS_COMMERCE has a Services-only member (commerce.services), outside a Retail administrator's organizations
                commerce: invoke(capability + "get#AccessReview", {groups: "BOSS_COMMERCE"})
            }))
        },
        then({printed, commerce}) {
            printed.status == 200
            printed.errors.length == 0
            printed.output.includes("Access review")
            printed.output.includes("Delegated access administrators")
            printed.output.includes("ADMIN_ACCESS_VIEW")
            // the delegate group's sealed ADMIN_ACCESS_MANAGE is counted, not listed
            !printed.output.includes("ADMIN_ACCESS_MANAGE")
            printed.output.includes("sealed grant(s) not listed")
            // the team's launcher with its row rules, and the delegate group's member in scope
            printed.output.includes("MANTLE_PRIVATE_CONTACT, MANTLE_USER_ORG")
            printed.output.includes("admin.delegate")
            commerce.outsideCount >= 1
            commerce.reviewRows.some(row => row.entryText === "Member" && row.detail === "commerce.manager")
            !JSON.stringify(commerce.reviewRows).includes("commerce.services")
            commerce.reviewRows.some(
                row => row.entryText === "App gate" && row.name === "BOSS_COMMERCE" && row.scope.includes("COMMERCE_STORE")
            )
        }
    }
)
