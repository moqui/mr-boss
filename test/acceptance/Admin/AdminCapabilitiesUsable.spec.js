// Admin P9's "usable when" (impl-admin P9; design-admin §5 Capabilities and RowRules, §16 the access and grant review), as an
// acceptance walk with artifact authorization on: Ziziwork Retail's access administrator (admin.access, not an instance
// administrator) creates a custom group, gives it the Warehouse reader bundle through Capabilities (the launcher with its
// organization and private-contact row rules, and the catalog view, proposed in the matrix, previewed and applied at the
// previewed revision), sees the row rules in RowRules, adds a Retail member who then holds the view and no stock change, and
// prints the review (html-print) and takes its CSV; a rule no registered bundle describes (the demo delegate group's Access
// area grant) shows read only and a proposal to end it is refused with nothing changed; and a proposal applied at a stale
// revision is refused and named. The rules are the framework's AdminAccessServices and AdminAccessCapabilities and BOSS's
// AdminCapabilities.
// Run: ./moq accept mr-boss --spec AdminCapabilitiesUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const capability = "org.moqui.admin.AccessServices."
const groupId = "ACCEPT_WH_READERS"
const launcher = "BOSS_WAREHOUSE"
const viewPermission = "PRODUCT_CATALOG_VIEW"
const bundleTokens = [groupId + "~a~a:" + launcher, groupId + "~a~p:" + viewPermission].join(",")
const selection = {appName: "Warehouse", groups: groupId}
const rowsOf = (entityName, conditions) => system(() => Array.from(ec.entity.find(entityName).condition(conditions).list()))
const filters = () =>
    rowsOf("moqui.security.ArtifactAuthz", {userGroupId: groupId, artifactGroupId: launcher})
        .flatMap(authz => rowsOf("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: authz.artifactAuthzId}))
        .map(row => row.entityFilterSetId)
        .sort()
const openGrants = () => rowsOf("moqui.security.UserGroupPermission", {userGroupId: groupId}).filter(row => !row.thruDate)
const clean = () =>
    system(() => {
        for (const authz of ec.entity.find("moqui.security.ArtifactAuthz").condition({userGroupId: groupId}).list())
            ec.entity.find("moqui.security.ArtifactAuthzFilter").condition({artifactAuthzId: authz.artifactAuthzId}).deleteAll()
        for (const entityName of [
            "moqui.security.ArtifactAuthz",
            "moqui.security.UserGroupPermission",
            "moqui.security.UserGroupMember",
            "moqui.security.UserGroup"
        ])
            ec.entity.find(entityName).condition({userGroupId: groupId}).deleteAll()
    })

spec({
    setupSpec() {
        login("john.doe")
        clean()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        clean()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the access administrator gives a custom group the Warehouse reader bundle with its organization filter", {
    when() {
        return asUser(users.access, () => {
            const created = page(
                "Access/Groups/createGroup",
                {userGroupId: groupId, description: "Acceptance warehouse readers", groupTypeEnumId: "UgtCustomTeam"},
                "html"
            )
            const empty = page("Access/Capabilities", selection)
            // the two cells' Grant controls, one after the other, make this proposal; the screen shows its effect
            const proposed = page("Access/Capabilities", Object.assign({changes: bundleTokens}, selection))
            const context = invoke(capability + "get#MatrixContext", Object.assign({changes: bundleTokens}, selection))
            const applied = page(
                "Access/Capabilities/applyChanges",
                Object.assign(
                    {changes: bundleTokens, revisions: context.proposal.revisions, reason: "Acceptance: warehouse readers"},
                    selection
                ),
                "html"
            )
            const after = invoke(capability + "get#MatrixContext", selection)
            const rules = page("Access/RowRules", {userGroupId: groupId})
            return {created, empty, proposed, context, applied, after, rules}
        })
    },
    then({created, empty, proposed, context, applied, after, rules}) {
        created.errors.length == 0
        empty.status == 200 && empty.errors.length == 0
        empty.output.includes("Acceptance warehouse readers")
        empty.output.includes("Warehouse launcher")
        !empty.output.includes("Proposed changes")
        proposed.errors.length == 0
        proposed.output.includes("Proposed changes (2)")
        proposed.output.includes("2 grant(s) added")
        proposed.output.includes("ApplyChanges")
        context.proposal.canApply == true
        applied.errors.length == 0
        // the launcher with the bundle's row rules, and the view; no change, export or sensitive permission came with them
        filters().join() == "MANTLE_PRIVATE_CONTACT,MANTLE_USER_ORG"
        openGrants()
            .map(row => row.userPermissionId)
            .join() == viewPermission
        after.matrixRows.find(row => row.kind === "launcher").cells[0].state == "granted"
        after.matrixRows.find(row => row.kind === "view").cells[0].state == "granted"
        after.matrixRows.filter(row => row.kind === "edit").every(row => row.cells[0].state === "none")
        after.changeCount == 0
        rules.errors.length == 0
        rules.output.includes("MANTLE_USER_ORG")
        rules.output.includes("As bundle BOSS_WAREHOUSE registers it")
        !rules.output.includes("BindScope_")
    }
})

feature("a member of the group holds the view and no stock change, and the review prints and exports", {
    when() {
        const access = asUser(users.access, () => {
            const added = page(
                "Access/GroupDetail/addMember",
                {userGroupId: groupId, memberUserId: ids.retailUserId, reason: "Acceptance: reads the warehouse"},
                "html"
            )
            const printed = page("Access/AccessReview", {groups: groupId}, "html-print")
            const csv = page("Access/AccessReview", {groups: groupId}, "csv")
            return {added, printed, csv}
        })
        const member = asUser("commerce.manager", () => ({
            view: ec.user.hasPermission(viewPermission),
            adjust: ec.user.hasPermission("STOCK_ADJUST")
        }))
        return Object.assign(access, {member})
    },
    then({added, printed, csv, member}) {
        added.errors.length == 0
        member.view == true
        member.adjust == false
        printed.status == 200 && printed.errors.length == 0
        printed.output.includes("Access review")
        printed.output.includes("Acceptance warehouse readers")
        printed.output.includes(viewPermission)
        printed.output.includes("MANTLE_PRIVATE_CONTACT, MANTLE_USER_ORG")
        printed.output.includes("commerce.manager")
        csv.errors.length == 0
        csv.output.includes("Group,Group ID,Entry")
        csv.output.includes(groupId + ",Permission," + viewPermission)
        csv.output.includes(groupId + ",App gate," + launcher)
        csv.output.includes("commerce.manager")
    }
})

feature("a rule no registered bundle describes shows read only, and a proposal to change it is refused", {
    when() {
        const token = ids.delegateGroupId + "~e~a:BOSS_ADM_ACCESS"
        const authzBefore = rowsOf("moqui.security.ArtifactAuthz", {userGroupId: ids.delegateGroupId}).length
        const taken = asUser(users.access, () => {
            const screen = page("Access/Capabilities", {appName: "Admin", groups: ids.delegateGroupId})
            const context = invoke(capability + "get#MatrixContext", {
                appName: "Admin",
                groups: ids.delegateGroupId,
                changes: token
            })
            const result = invoke(capability + "apply#MatrixChanges", {changes: token, revisions: context.proposal.revisions})
            return {screen, context, result}
        })
        return Object.assign(taken, {
            authzBefore,
            authzAfter: rowsOf("moqui.security.ArtifactAuthz", {userGroupId: ids.delegateGroupId}).length
        })
    },
    then({screen, context, result, authzBefore, authzAfter}) {
        screen.status == 200 && screen.errors.length == 0
        screen.output.includes("Advanced rules (read only)")
        screen.output.includes("Not a registered app gate")
        // the Access area is no row of the matrix, so no cell offers to change it
        !context.matrixRows.some(row => row.id === "BOSS_ADM_ACCESS")
        context.unsupportedRows.some(row => row.id === "BOSS_ADM_ACCESS" && row.typeText === "Always")
        context.proposal.canApply == false
        result.appliedCount == 0 && result.refusedCount == 1
        result.resultList[0].reasonCode == "UNREGISTERED_GRANT"
        authzAfter == authzBefore
    }
})

feature("a proposal applied at a stale revision is refused and named, and the group stays as it was", {
    when() {
        const endView = groupId + "~e~p:" + viewPermission
        const taken = asUser(users.access, () => {
            const context = invoke(capability + "get#MatrixContext", Object.assign({changes: endView}, selection))
            // the group's grants change after the preview: the launcher's end is applied first
            const ended = invoke(capability + "apply#MatrixChanges", {
                changes: groupId + "~e~a:" + launcher,
                revisions: context.proposal.revisions,
                reason: "Acceptance: launcher ended"
            })
            const stale = invoke(capability + "apply#MatrixChanges", {changes: endView, revisions: context.proposal.revisions})
            return {context, ended, stale}
        })
        return Object.assign(taken, {grants: openGrants(), filters: filters()})
    },
    then({context, ended, stale, grants, filters}) {
        context.proposal.canApply == true
        ended.appliedCount == 1
        stale.appliedCount == 0
        stale.resultList[0].reasonCode == "REVISION_CHANGED"
        stale.remainingChanges.includes(viewPermission)
        // the view is still granted; the launcher and its row rules are gone
        grants.map(row => row.userPermissionId).join() == viewPermission
        filters.length == 0
    }
})
