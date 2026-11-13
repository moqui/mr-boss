// Admin P3's "usable when" (impl-admin P3; design-admin §15.3 "Escalation through grants" and "Last administration path"), as
// an acceptance walk with artifact authorization on: admin.access adds a Retail user to a registered Purchasing group from a date
// through GroupDetail and ends it later, and is refused BOSS_ADMIN_BACKUP with the reason shown on the page; removing the last
// factor-meeting member of ADMIN is refused; a permitted change shows before and after in the audit log and holds on the
// member's next request. The rules themselves are the framework's AdminAccessServices and AdminGroups'.
// Run: ./moq accept mr-boss --spec AdminGroupsWalk
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const access = "org.moqui.admin.AccessServices."
const bundleId = "BOSS_PURCHASING_BUYER"
const memberId = ids.retailUserId
const memberUsername = "commerce.manager"
const factorId = "ADMIN_WALK_FACTOR"
const members = () =>
    system(() =>
        Array.from(ec.entity.find("moqui.security.UserGroupMember").condition({userGroupId: bundleId, userId: memberId}).list())
    )
const audits = fieldName =>
    system(() =>
        Array.from(
            ec.entity
                .find("moqui.entity.EntityAuditLog")
                .condition({
                    changedEntityName: "moqui.security.UserGroupMember",
                    changedFieldName: fieldName,
                    pkPrimaryValue: bundleId
                })
                .list()
        ).filter(row => String(row.pkSecondaryValue) === memberId)
    )

// The last feature's factor and ADMIN's requireAuthcFactor, put back: every later spec signs in as john.doe with a password.
const restoreFactors = () =>
    system(() => {
        ec.entity.find("moqui.security.UserAuthcFactor").condition("factorId", factorId).deleteAll()
        const admin = ec.entity.find("moqui.security.UserGroup").condition("userGroupId", "ADMIN").one()
        if (admin.requireAuthcFactor !== "N") {
            admin.set("requireAuthcFactor", "N")
            admin.update()
        }
    })

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        // the factor state first: while john.doe holds a factor or ADMIN requires one, his password login is refused
        restoreFactors()
        system(() =>
            ec.entity.find("moqui.security.UserGroupMember").condition({userGroupId: bundleId, userId: memberId}).deleteAll()
        )
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an access administrator adds a Purchasing member from a date and ends it later, and is refused the backup group with its reason",
    {
        when() {
            const startedAt = Number(String(ec.user.nowTimestamp))
            const tomorrow = new Date(startedAt + 86400000).toISOString()
            const walk = asUser(users.access, () => {
                const added = lib.page(
                    "Access/GroupDetail/addMember",
                    {userGroupId: bundleId, memberUserId: memberId, reason: "Cover for the buyer"},
                    "html"
                )
                const page = lib.page("Access/GroupDetail", {userGroupId: bundleId}, "html")
                const row = invoke(access + "get#Group", {userGroupId: bundleId}).members.find(
                    member => member.userId === memberId && !member.ended
                )
                const ended = invoke(access + "end#Membership", {
                    userGroupId: bundleId,
                    userId: memberId,
                    fromDate: row.fromDate,
                    expectedRevision: row.revision,
                    thruDate: tomorrow,
                    reason: "Cover ends tomorrow"
                })
                const backup = lib.page(
                    "Access/GroupDetail/addMember",
                    {userGroupId: ids.backupGroupId, memberUserId: memberId},
                    "html"
                )
                const backupPage = lib.page("Access/GroupDetail", {userGroupId: ids.backupGroupId}, "html")
                return {added, page, ended, backup, backupPage}
            })
            // this walk's rows: an earlier spec's ended membership of the same user is kept (AdminAuditUsable ends its own)
            return Object.assign(walk, {rows: members().filter(row => Number(String(row.fromDate)) >= startedAt)})
        },
        then({added, page, ended, backupPage, rows}) {
            added.errors.length == 0
            page.output.includes(memberUsername)
            ended.applied == true
            rows.length == 1 && rows[0].thruDate != null
            // the backup group is privileged: admin.access is not in it, so the page says why it cannot be changed
            backupPage.output.includes("privileged group")
            system(() =>
                ec.entity
                    .find("moqui.security.UserGroupMember")
                    .condition({userGroupId: ids.backupGroupId, userId: memberId})
                    .count()
            ) == 0
        }
    }
)

feature("a permitted change shows before and after in the audit log and holds on the member's next request", {
    when() {
        // the first feature's membership runs until tomorrow; this change starts from none
        system(() =>
            ec.entity.find("moqui.security.UserGroupMember").condition({userGroupId: bundleId, userId: memberId}).deleteAll()
        )
        const before = asUser(memberUsername, () => ec.user.hasPermission("PURCHASE_ORDER_EDIT"))
        const added = asUser(users.access, () =>
            invoke(access + "store#Membership", {userGroupId: bundleId, userId: memberId, reason: "Second cover"})
        )
        const during = asUser(memberUsername, () => ({
            member: ec.user.isInGroup(bundleId),
            edit: ec.user.hasPermission("PURCHASE_ORDER_EDIT")
        }))
        const ended = asUser(users.access, () =>
            invoke(access + "end#Membership", {
                userGroupId: bundleId,
                userId: memberId,
                fromDate: added.fromDate,
                expectedRevision: added.revision,
                reason: "Second cover over"
            })
        )
        const after = asUser(memberUsername, () => ({
            member: ec.user.isInGroup(bundleId),
            edit: ec.user.hasPermission("PURCHASE_ORDER_EDIT")
        }))
        return {before, added, during, ended, after, fromAudits: audits("fromDate"), thruAudits: audits("thruDate")}
    },
    then({before, added, during, ended, after, fromAudits, thruAudits}) {
        before == false
        added.applied == true && ended.applied == true
        during.member == true && during.edit == true
        after.member == false && after.edit == false
        fromAudits.some(row => row.changeReason === "Second cover" && row.newValueText)
        thruAudits.some(row => row.changeReason === "Second cover over" && !row.oldValueText && row.newValueText)
    }
})

feature("removing the last factor-meeting member of ADMIN is refused with the reason", {
    when() {
        const johnId = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "john.doe").one().userId)
        system(() => {
            const factor = ec.entity.makeValue("moqui.security.UserAuthcFactor")
            factor.setFields(
                {factorId, userId: johnId, factorTypeEnumId: "UafTotp", fromDate: ec.user.nowTimestamp},
                true,
                null,
                null
            )
            factor.create()
        })
        // john.doe now holds a factor, so a password login (asUser) is refused: sign in as one who passed the second factor
        const wasDisabled = ec.artifactExecution.authzDisabled()
        try {
            ec.user.internalLoginUser(users.system)
            ec.artifactExecution.enableAuthz()
            const revision = invoke(access + "get#Group", {userGroupId: "ADMIN"}).group.revision
            const factor = invoke(access + "store#Group", {
                userGroupId: "ADMIN",
                expectedRevision: revision,
                requireAuthcFactor: "Y",
                reason: "Factors for administrators"
            })
            const membership = invoke(access + "get#Group", {userGroupId: "ADMIN"}).members.find(
                row => row.userId === johnId && row.active
            )
            const removed = invoke(access + "end#Membership", {
                userGroupId: "ADMIN",
                userId: johnId,
                fromDate: membership.fromDate,
                expectedRevision: membership.revision
            })
            return {factor, removed}
        } finally {
            ec.message.clearErrors()
            restoreFactors()
            if (wasDisabled) ec.artifactExecution.disableAuthz()
            login(users.system)
        }
    },
    then({factor, removed}) {
        factor.applied == true
        removed.applied == false && removed.reasonCode == "ADMINISTRATION_PATH" && removed.reason.includes("administrator")
    }
})
