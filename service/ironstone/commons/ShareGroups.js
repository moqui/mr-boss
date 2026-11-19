// The groups a file's sharer may share with (SEC-BOS-106): at the manage level of the item (its drive's owner or a manager)
// any group; below it only a group of the sharer's own, never every user (ALL_USERS, BOSS_USERS), never a group of external
// users (one holding EXTERNAL_USER: an app's client contacts), and, since a user group is no organization's, only one whose
// every current member works for (PrtEmployee, PrtAgent or PrtMember) an organization of one of the sharer's own top-level
// organizations (its PrtOrgRollup root): a group such as BOSS_PROJECT_TEAM that spans organizations is a manager's to share
// with. The framework's share#Resource holds the rule for ALL_USERS, the sharer's groups and EXTERNAL_USER; BOSS_USERS and
// the organizations are BOSS's. CC0 plus patent grant.
const STAFF = ["PrtEmployee", "PrtAgent", "PrtMember"]

// the top-level organizations the parties work for, by party
function rootsOf(partyIds) {
    const roots = new Map(partyIds.map(id => [id, new Set()]))
    if (!partyIds.length) return roots
    const rootOf = new Map()
    const root = orgId => {
        if (rootOf.has(orgId)) return rootOf.get(orgId)
        let at = orgId
        for (let depth = 0; depth < 10; depth++) {
            const parent = Array.from(
                ec.entity
                    .find("mantle.party.PartyRelationship")
                    .condition("fromPartyId", at)
                    .condition("relationshipTypeEnumId", "PrtOrgRollup")
                    .conditionDate("fromDate", "thruDate", null)
                    .selectField("toPartyId")
                    .disableAuthz()
                    .list()
            )[0]?.toPartyId
            if (!parent || parent === at) break
            at = parent
        }
        rootOf.set(orgId, at)
        return at
    }
    for (const row of ec.entity
        .find("mantle.party.PartyRelationship")
        .condition("fromPartyId", "in", partyIds)
        .condition("relationshipTypeEnumId", "in", STAFF)
        .conditionDate("fromDate", "thruDate", null)
        .selectField("fromPartyId")
        .selectField("toPartyId")
        .disableAuthz()
        .list())
        roots.get(row.fromPartyId).add(root(row.toPartyId))
    return roots
}

// whether every current member of the group works for one of the sharer's top-level organizations
function withinSharersOrganizations(groupId) {
    const me = ec.user.userAccount?.partyId || null
    const mine = me ? rootsOf([me]).get(me) : new Set()
    if (!mine.size) return false
    const userIds = Array.from(
        ec.entity
            .find("moqui.security.UserGroupMember")
            .condition("userGroupId", groupId)
            .conditionDate("fromDate", "thruDate", null)
            .selectField("userId")
            .disableAuthz()
            .list()
    ).map(row => row.userId)
    if (!userIds.length) return true
    const accounts = Array.from(
        ec.entity.find("moqui.security.UserAccount").condition("userId", "in", userIds).selectField("userId").selectField("partyId").disableAuthz().list()
    )
    // a member with no party works for no organization
    if (accounts.length < userIds.length || accounts.some(account => !account.partyId)) return false
    const roots = rootsOf(Array.from(new Set(accounts.map(account => account.partyId))))
    return accounts.every(account => Array.from(roots.get(account.partyId) || []).some(id => mine.has(id)))
}

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
    const seen = new Map()
    return groupId => {
        if (!mine.has(groupId) || ["ALL_USERS", "BOSS_USERS"].includes(groupId) || external.has(groupId)) return false
        if (!seen.has(groupId)) seen.set(groupId, withinSharersOrganizations(groupId))
        return seen.get(groupId)
    }
}

;({forLevel})
