// The groups a file's sharer may share with (SEC-BOS-106): at the manage level of the item (its drive's owner or a manager)
// any group; below it only a group of the sharer's own, never every user (ALL_USERS, BOSS_USERS) and never a group of
// external users (one holding EXTERNAL_USER: an app's client contacts). The framework's share#Resource holds the same
// rule for ALL_USERS, the sharer's groups and EXTERNAL_USER; BOSS_USERS is BOSS's own every-user group.
// CC0 plus patent grant.
function forLevel(level) {
    if (Number(level) >= 3) return () => true
    const mine = new Set(Array.from(ec.user.getUserGroupIdSet() || []))
    const external = new Set(
        Array.from(
            ec.entity
                .find("moqui.security.UserGroupPermission")
                .condition("userPermissionId", "EXTERNAL_USER")
                .conditionDate("fromDate", "thruDate", null)
                .selectField("userGroupId")
                .disableAuthz()
                .list()
        ).map(row => row.userGroupId)
    )
    return groupId => mine.has(groupId) && !["ALL_USERS", "BOSS_USERS"].includes(groupId) && !external.has(groupId)
}

;({forLevel})
