// Admin P6's "usable when" (impl-admin P6; design-admin §15.3 "Offboarding", its access half; its schedules half comes with
// Insights P7), as an acceptance walk with artifact authorization on, over a shared identity of Ziziwork Retail and Ziziwork
// Services made here (so the demo's shared.staff is left as it is): the Retail identity operator (admin.identity) removes it from
// Retail on UserDetail, and it keeps its Services relationship, its BOSS users membership and its Commons contact book; then the
// administrator (admin.admin, every organization) disables it globally, which signs it out everywhere and revokes its app
// password, and the shared drive it owned waits in LifecycleDetail for a new owner. The rules themselves are Mantle's
// UserLifecycle, the framework's ResourceOwners and BOSS's AdminLifecycle.
// Run: ./moq accept mr-boss --spec AdminLifecycleUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const run = String(Date.now()).slice(-7)
const P = "ADM_LIFE_USABLE_"
let sharedId
let sharedPartyId
let bookId
let disableOperationId

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).one())
const make = (entityName, fields) =>
    system(() => {
        const row = ec.entity.makeValue(entityName)
        row.setFields(fields, true, null, null)
        row.create()
    })

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            sharedPartyId = ec.service
                .sync()
                .name("mantle.party.PartyServices.create#Person")
                .parameters({firstName: "Sasha", lastName: "Shared " + run})
                .call().partyId
            sharedId = ec.service
                .sync()
                .name("mantle.party.PartyServices.create#PartyUserAccount")
                .parameters({
                    partyId: sharedPartyId,
                    username: "adm.shared." + run,
                    emailAddress: "adm.shared." + run + "@example.com"
                })
                .call().userId
        })
        for (const [key, organizationId] of [
            ["RETAIL", ids.organizationId],
            ["SERVICES", ids.otherOrganizationId]
        ])
            make("mantle.party.PartyRelationship", {
                partyRelationshipId: P + key + run,
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: sharedPartyId,
                toPartyId: organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: ec.user.nowTimestamp
            })
        make("moqui.security.UserGroupMember", {userGroupId: "BOSS_USERS", userId: sharedId, fromDate: ec.user.nowTimestamp})
        make("moqui.server.Visit", {
            visitId: P + "VISIT" + run,
            userId: sharedId,
            fromDate: ec.user.nowTimestamp,
            clientIpAddress: "203.0.113.9"
        })
        make("moqui.server.HttpSession", {sessionId: P + "SESSION" + run, userId: sharedId, visitId: P + "VISIT" + run})
        make("moqui.security.UserAppPassword", {
            appPasswordId: P + "APP" + run,
            userId: sharedId,
            name: "Phone mail",
            passwordHash: "usable-" + run,
            createdDate: ec.user.nowTimestamp
        })
        make("moqui.resource.ResourceDrive", {
            driveId: P + "DRIVE" + run,
            driveName: "Shared runbook " + run,
            driveKindEnumId: "RdkShared",
            rootLocation: "dbresource://drive/spec/" + P + run,
            ownerUserId: sharedId,
            createdDate: ec.user.nowTimestamp
        })
        bookId = P + "BOOK" + run
        make("mantle.party.contact.ContactBook", {
            contactBookId: bookId,
            contactBookName: "Sasha's contacts",
            ownerUserId: sharedId,
            visibilityEnumId: "CbvPersonal",
            isDefault: "Y",
            createdDate: ec.user.nowTimestamp
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.resource.ResourceDrive")
                .condition("driveId", P + "DRIVE" + run)
                .deleteAll()
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("the Retail operator removes the shared identity from Retail: its Services access and Commons books stay", {
    when() {
        return asUser(users.identity, () => ({
            confirmed: page(
                "Users/UserDetail/startLifecycle",
                {
                    userId: sharedId,
                    kind: "removeOrganization",
                    organizationPartyId: ids.organizationId,
                    reason: "Moved to Services"
                },
                "html"
            ),
            // the operator administers Retail only: the identity has left its scope
            after: page("Users/UserDetail", {userId: sharedId}, "html")
        }))
    },
    then({confirmed, after}) {
        confirmed.errors.length == 0
        one("mantle.party.PartyRelationship", {partyRelationshipId: P + "RETAIL" + run}).thruDate != null
        one("mantle.party.PartyRelationship", {partyRelationshipId: P + "SERVICES" + run}).thruDate == null
        one("moqui.security.UserGroupMember", {userGroupId: "BOSS_USERS", userId: sharedId}).thruDate == null
        one("moqui.security.UserAccount", {userId: sharedId}).disabled != "Y"
        one("moqui.server.HttpSession", {visitId: P + "VISIT" + run}) != null
        one("mantle.party.contact.ContactBook", {contactBookId: bookId}).ownerUserId == sharedId
        after.output.includes("User not available")
    }
})

feature(
    "the administrator disables it globally: signed out everywhere, its app password revoked, its drive waiting for a new owner",
    {
        when() {
            const confirmed = asUser(users.admin, () =>
                page(
                    "Users/UserDetail/startLifecycle",
                    {userId: sharedId, kind: "disable", reason: "Left", operationKey: P + "DISABLE" + run},
                    "html"
                )
            )
            disableOperationId = one("mantle.party.UserLifecycleOperation", {operationKey: P + "DISABLE" + run})?.operationId
            return {
                confirmed,
                detail: asUser(users.admin, () => page("Users/LifecycleDetail", {operationId: disableOperationId}, "html"))
            }
        },
        then({confirmed, detail}) {
            confirmed.errors.length == 0 && disableOperationId != null
            const account = one("moqui.security.UserAccount", {userId: sharedId})
            account.disabled == "Y" && account.disabledDateTime == null
            one("moqui.server.HttpSession", {visitId: P + "VISIT" + run}) == null
            one("moqui.security.UserAppPassword", {appPasswordId: P + "APP" + run}).revokedDate != null
            detail.errors.length == 0
            detail.output.includes("Shared runbook") && detail.output.includes("Waiting for a new owner")
            one("moqui.resource.ResourceDrive", {driveId: P + "DRIVE" + run}).ownerUserId == sharedId
            // the personal contact book stays with its user
            one("mantle.party.contact.ContactBook", {contactBookId: bookId}).ownerUserId == sharedId
        }
    }
)
