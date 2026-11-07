// The data of the Admin golden walk (test/client/Admin/AdminUsersWalk), made on the --serve server before the walk: a Retail staff
// identity, admin.walk.staff ("Walk Staff"), in IronStone BOSS users and the Purchasing buyer bundle, with a live browser session
// (a Visit and its web session). The walk ends the membership and signs the session out, so each run opens them again.
// Run: ./moq test mr-boss --spec AdminClientFixtures
const userId = "ADM_WALK_STAFF"
const visitId = "ADM_WALK_VISIT"
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const make = (entityName, fields) => {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.create()
}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
    },
    cleanupSpec() {
        ec.artifactExecution.enableAuthz()
    }
})

feature("the walk's Retail staff identity, its open purchasing membership and a live session exist", {
    when() {
        if (!find("mantle.party.Party", {partyId: userId}).one()) {
            make("mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson"})
            make("mantle.party.Person", {partyId: userId, firstName: "Walk", lastName: "Staff"})
            make("mantle.party.PartyRelationship", {
                partyRelationshipId: userId + "_ORG",
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: userId,
                toPartyId: "ORG_ZIZI_RETAIL",
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            make("moqui.security.UserAccount", {
                userId,
                username: "admin.walk.staff",
                userFullName: "Walk Staff",
                partyId: userId,
                emailAddress: "admin.walk.staff@example.com"
            })
            make("moqui.security.UserGroupMember", {userGroupId: "BOSS_USERS", userId, fromDate: 0})
        }
        const open = Array.from(
            find("moqui.security.UserGroupMember", {userGroupId: "BOSS_PURCHASING_BUYER", userId}).list()
        ).some(row => row.thruDate == null)
        if (!open)
            make("moqui.security.UserGroupMember", {userGroupId: "BOSS_PURCHASING_BUYER", userId, fromDate: ec.user.nowTimestamp})
        find("moqui.server.HttpSession", {visitId}).deleteAll()
        find("moqui.server.Visit", {visitId}).deleteAll()
        make("moqui.server.Visit", {
            visitId,
            userId,
            fromDate: ec.user.nowTimestamp,
            initialUserAgent: "Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0",
            clientIpAddress: "198.51.100.20"
        })
        make("moqui.server.HttpSession", {sessionId: visitId + "_S", userId, visitId})
        return {
            open: Array.from(find("moqui.security.UserGroupMember", {userGroupId: "BOSS_PURCHASING_BUYER", userId}).list()).some(
                row => row.thruDate == null
            ),
            session: find("moqui.server.HttpSession", {visitId}).one()
        }
    },
    then({open, session}) {
        open == true
        session != null
    }
})
