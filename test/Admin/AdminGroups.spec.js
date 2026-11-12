// Groups and grants in Admin (impl-admin P3; design-admin §5 GroupDetail, §1.1): GroupDetail's one qvt render (a custom group's
// members in scope, its sealed grant marked, and the effective change of a bundle grant before it is applied), and a delegated
// access administrator (admin.delegate: ADMIN_ACCESS_MANAGE through a custom group, not in BOSS_ADMIN_ACCESS) changing a member
// within a registered bundle: a Retail user added from a date through GroupDetail's transition and ended, kept on record; a
// Services user refused as outside the organizations administered and counted, never named; a privileged group refused with
// its reason. Groups and GroupDetail are over the framework's System › Access screens (mr-moqui plans/archive/Admin-Screens-Down.md): a
// transition of their instance administrator's part (a group created or changed directly, a permission of any id granted) is
// not on Admin's route, for the access administrator and for ADMIN. The framework's rules (sealed grants, privileged groups,
// unregistered bundles, the administration path, revisions) are the framework's AdminAccessServices; the "usable when" walk is
// the acceptance AdminGroupsWalk.
// Run: ./moq test mr-boss --spec Admin/AdminGroups
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const access = "org.moqui.admin.AccessServices."
const context = "ironstone.admin.ContextServices."
const bundleId = "BOSS_PURCHASING_BUYER"
const directGroupId = "SPEC_ADM_GROUP_DIRECT"
const memberRows = userId =>
    system(() => Array.from(ec.entity.find("moqui.security.UserGroupMember").condition({userGroupId: bundleId, userId}).list()))
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            find("moqui.security.UserGroupMember", {userGroupId: bundleId, userId: ids.retailUserId}).deleteAll()
            find("moqui.security.UserGroupPermission", {userGroupId: bundleId, userPermissionId: "SPEC_ADM_DIRECT"}).deleteAll()
            find("moqui.security.UserGroup", {userGroupId: directGroupId}).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "GroupDetail shows a custom group's members in scope, its sealed grant and a bundle grant's effect before it is applied",
    {
        when() {
            return asUser(users.access, () =>
                page("Access/GroupDetail", {
                    userGroupId: ids.delegateGroupId,
                    grantAction: "add",
                    grantBundleGroupId: bundleId
                })
            )
        },
        then({status, output, errors}) {
            status == 200
            errors.length == 0
            output.includes("Delegated access administrators")
            output.includes("Sealed grants: ADMIN_ACCESS_MANAGE")
            output.includes("Admin Delegated access administrator")
            // the preview of the Purchasing buyer bundle on the custom group: grants added, and the Apply form at its revision
            output.includes("grant(s) added")
            output.includes("PURCHASE_ORDER_EDIT")
            output.includes("ApplyGrants")
        }
    }
)

feature(
    "a delegated access administrator changes a member within a registered bundle; nothing is changed directly through Admin",
    {
        when() {
            const delegate = asUser(users.delegate, () => {
                // through GroupDetail's transition: the Admin member check, then the framework's store#Membership
                const added = lib.page(
                    "Access/GroupDetail/addMember",
                    {userGroupId: bundleId, memberUserId: ids.retailUserId, reason: "Buyer cover"},
                    "html"
                )
                const rows = memberRows(ids.retailUserId)
                const member = rows.find(row => !row.thruDate)
                const outside = refusal(context + "check#Record", {
                    recordType: "member",
                    recordId: ids.otherUserId,
                    capability: "accessManage"
                })
                const privileged = invoke(access + "store#Membership", {userGroupId: ids.backupGroupId, userId: ids.retailUserId})
                const memberScope = invoke(context + "get#MemberScope", {userIds: [ids.retailUserId, ids.otherUserId]})
                // a page of the choice, searched for both users (commerce.manager and commerce.services): the first page of an
                // empty term holds the first of whatever staff the other specs add, by name
                const options = invoke(context + "get#Choices", {
                    choice: "members",
                    term: "commerce.",
                    selected: ids.otherUserId
                }).options.map(row => row.value)
                const ended = member
                    ? invoke(access + "end#Membership", {
                          userGroupId: bundleId,
                          userId: ids.retailUserId,
                          fromDate: member.fromDate,
                          expectedRevision: invoke(access + "get#Group", {userGroupId: bundleId}).members.find(
                              row => row.userId === ids.retailUserId && !row.ended
                          ).revision,
                          reason: "Cover over"
                      })
                    : {}
                return {added, member, outside, privileged, memberScope, options, ended}
            })
            // the System screens' own transitions for an instance administrator (a group's record changed directly, a permission of
            // any id granted, a group of any id created) are not taken in here, so they do not exist on Admin's route: for the
            // access administrator, whose area grant is an inheritable always-allow, and for ADMIN
            const description = () => system(() => find("moqui.security.UserGroup", {userGroupId: bundleId}).one().description)
            const before = description()
            for (const user of [users.access, users.system])
                asUser(user, () => {
                    page(
                        "Access/GroupDetail/updateUserGroup",
                        {userGroupId: bundleId, description: "Spec: changed directly"},
                        "html"
                    )
                    page(
                        "Access/GroupDetail/createUserGroupPermission",
                        {userGroupId: bundleId, userPermissionId: "SPEC_ADM_DIRECT", fromDate: String(Date.now())},
                        "html"
                    )
                    page(
                        "Access/Groups/createUserGroup",
                        {userGroupId: directGroupId, description: "Spec: created directly"},
                        "html"
                    )
                })
            const direct = system(() => ({
                unchanged: description() === before,
                grants: find("moqui.security.UserGroupPermission", {
                    userGroupId: bundleId,
                    userPermissionId: "SPEC_ADM_DIRECT"
                }).count(),
                groups: find("moqui.security.UserGroup", {userGroupId: directGroupId}).count()
            }))
            return Object.assign(delegate, {after: memberRows(ids.retailUserId), direct})
        },
        then({added, member, outside, privileged, memberScope, options, ended, after, direct}) {
            added.errors.length == 0
            member != null
            outside.includes("RECORD_UNAVAILABLE")
            privileged.applied == false && privileged.reasonCode == "PRIVILEGED_GROUP" && privileged.reason.includes("privileged")
            memberScope.inScopeUserIds.includes(ids.retailUserId) && memberScope.outsideCount == 1
            options.includes(ids.retailUserId) && !options.includes(ids.otherUserId)
            ended.applied == true
            // ended and kept: the row stays with its end date
            after.length == 1 && after[0].thruDate != null
            direct.unchanged == true && direct.grants == 0 && direct.groups == 0
        }
    }
)

// F129 (P19): a screen's read keeps a refusal's reason, which a service-call with ignore-error clears; an error that is not a
// refusal shows only the screen's own words
feature("a screen's refused read is shown as its reason, and any other failure as the screen's own words", {
    when() {
        const calls = ec.resource.script("component://framework/service/org/moqui/admin/AdminCalls.js")
        return {
            refused: asUser(users.identity, () => calls.read(access + "find#Groups", {}, "The groups are not available to you.")),
            allowed: asUser(users.access, () => calls.read(access + "find#Groups", {}, "The groups are not available to you.")),
            broken: asUser(users.access, () => calls.read(access + "get#Group", {}, "Group is not available.")),
            // an exception's text with a prefix like a code is never shown as a reason (review)
            exceptions: [
                "error returned from database: ERROR: relation \"user_account\" does not exist",
                "URL: http://10.0.0.5:8080/internal refused",
                "RECORD_UNAVAILABLE: " + "x".repeat(400)
            ].map(text => calls.reasonOf(text)),
            coded: calls.reasonOf("Error: RECORD_UNAVAILABLE: Group G is not available"),
            errorsAfter: ec.message.hasError()
        }
    },
    then({refused, allowed, broken, exceptions, coded, errorsAfter}) {
        exceptions.every(reason => reason == null)
        coded == "Group G is not available"
        refused.out == null
        refused.failure.includes("ADMIN_ACCESS_VIEW")
        !refused.failure.includes("PERMISSION_DENIED")
        allowed.failure == null
        allowed.out.groupList.length > 0
        broken.failure == "Group is not available."
        errorsAfter == false
    }
})
