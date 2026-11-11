// Lifecycle and offboarding in Admin (impl-admin P6; design-admin §4.1 Offboarding, §4 UserDetail LifecycleActions, LifecycleDetail,
// §14 Lifecycle participant): the Retail identity operator confirms a disable on UserDetail (startLifecycle, through
// LifecycleServices' participants), which revokes the account's access at once and leaves the shared drive it owned waiting for a
// new owner; LifecycleDetail's one qvt render (the request, the steps, Transfer on the waiting drive); and TransferOwnership's rule
// (transfer#OwnedResource): a step naming another service than its participant registered is refused, a new owner outside the
// operator's organizations is refused alike, and a Retail colleague takes the drive through the framework's owner change.
// Mantle's rules are Mantle's UserLifecycle, the owners' the framework's ResourceOwners and Mantle's ContactBooks; the "usable
// when" is the acceptance AdminLifecycleUsable. A step's owner service runs under its own authorization (F-P6-1): an operator through
// Mantle's identity services alone is refused Admin's assignments transfer.
// Run: ./moq test mr-boss --spec Admin/AdminLifecycle
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const run = String(Date.now()).slice(-7)
const driveId = "ADM_LIFE_DRIVE_" + run
let leaverId
let operationId

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).one())
const steps = () =>
    system(() =>
        Array.from(ec.entity.find("mantle.party.UserLifecycleOperationStep").condition("operationId", operationId).list())
    ).sort((a, b) => a.stepSeqId.localeCompare(b.stepSeqId))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const partyId = ec.service
                .sync()
                .name("mantle.party.PartyServices.create#Person")
                .parameters({firstName: "Lena", lastName: "Leaver " + run})
                .call().partyId
            leaverId = ec.service
                .sync()
                .name("mantle.party.PartyServices.create#PartyUserAccount")
                .parameters({partyId, username: "adm.leaver." + run, emailAddress: "adm.leaver." + run + "@example.com"})
                .call().userId
            const make = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.create()
            }
            make("mantle.party.PartyRelationship", {
                partyRelationshipId: "ADM_LIFE_REL_" + run,
                relationshipTypeEnumId: "PrtEmployee",
                fromPartyId: partyId,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: ec.user.nowTimestamp
            })
            make("moqui.security.UserGroupMember", {userGroupId: "BOSS_USERS", userId: leaverId, fromDate: ec.user.nowTimestamp})
            make("moqui.resource.ResourceDrive", {
                driveId,
                driveName: "Leaver handbook " + run,
                driveKindEnumId: "RdkShared",
                rootLocation: "dbresource://drive/spec/" + driveId,
                ownerUserId: leaverId,
                createdDate: ec.user.nowTimestamp
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => ec.entity.find("moqui.resource.ResourceDrive").condition("driveId", driveId).deleteAll())
        ec.artifactExecution.enableAuthz()
    }
})

feature("the operator confirms a disable: access revoked at once, the shared drive it owned waiting for a new owner", {
    when() {
        const preview = asUser(users.identity, () =>
            invoke("ironstone.admin.LifecycleServices.find#OwnedResources", {userId: leaverId})
        )
        const confirmed = asUser(users.identity, () =>
            page(
                "Users/UserDetail/startLifecycle",
                {userId: leaverId, kind: "disable", reason: "Left Retail", operationKey: "ADM-LIFE-" + run},
                "html"
            )
        )
        operationId = one("mantle.party.UserLifecycleOperation", {operationKey: "ADM-LIFE-" + run})?.operationId
        return {preview, confirmed}
    },
    then({preview, confirmed}) {
        const drives = preview.participantList.find(row => row.participantKey == "commons.drives")
        drives.state == "ready" && drives.resourceList.map(row => row.resourceId).join() == driveId
        confirmed.errors.length == 0 && operationId != null
        const account = one("moqui.security.UserAccount", {userId: leaverId})
        account.disabled == "Y" && account.disabledDateTime == null
        // the drive waits for a new owner; Insights' participant paused the report schedules the leaver owns (none here)
        steps()
            .map(step => step.stepKind + ":" + step.statusId)
            .join() == "revokeAccess:UlstDone,disableAccount:UlstDone,transfer:UlstWaiting,pause:UlstDone"
        steps()[2].resourceId == driveId
    }
})

feature("LifecycleDetail shows the request and its steps, with Transfer on the waiting drive", {
    when() {
        return asUser(users.identity, () => page("Users/LifecycleDetail", {operationId}))
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.includes("Disable: Lena Leaver")
        output.includes("Left Retail")
        output.includes("Account disabled") && output.includes("Shared drives: Leaver handbook")
        output.includes("Waiting for a new owner")
        output.includes("Transfer")
    }
})

feature(
    "TransferOwnership: a step naming another service is refused, so is a new owner outside Retail; a Retail colleague takes it",
    {
        when() {
            const waiting = steps().find(step => step.stepKind == "transfer")
            // a step whose service is not what its participant registered (a forged or stale row)
            system(() => {
                const forged = ec.entity.makeValue("mantle.party.UserLifecycleOperationStep")
                forged.setFields(
                    Object.assign({}, waiting.getMap ? waiting.getMap() : waiting, {
                        stepSeqId: "90",
                        actionService: "mantle.work.CalendarServices.transfer#CalendarOwner",
                        resourceParameter: "calendarId",
                        lastUpdatedStamp: null
                    }),
                    true,
                    null,
                    null
                )
                forged.create()
            })
            const transfer = (stepSeqId, toUserId) =>
                asUser(users.identity, () =>
                    refusal("ironstone.admin.LifecycleServices.transfer#OwnedResource", {operationId, stepSeqId, toUserId})
                )
            const moved = asUser(users.identity, () =>
                invoke("ironstone.admin.LifecycleServices.transfer#OwnedResource", {
                    operationId,
                    stepSeqId: waiting.stepSeqId,
                    toUserId: ids.retailUserId,
                    reason: "Team lead"
                })
            )
            return {
                forged: asUser(users.identity, () =>
                    invoke("ironstone.admin.LifecycleServices.transfer#OwnedResource", {
                        operationId,
                        stepSeqId: "90",
                        toUserId: ids.retailUserId
                    })
                ),
                outside: transfer(waiting.stepSeqId, ids.otherUserId),
                moved
            }
        },
        then({forged, outside, moved}) {
            forged.applied == false && forged.reasonCode == "NOT_REGISTERED"
            outside.includes("RECORD_UNAVAILABLE")
            moved.applied == true
            one("moqui.resource.ResourceDrive", {driveId}).ownerUserId == ids.retailUserId
            steps().find(step => step.stepSeqId != "90" && step.stepKind == "transfer").toUserId == ids.retailUserId
        }
    }
)

feature(
    "a step's owner service runs under its own authorization: an identity operator without Admin is refused Projects' transfer",
    {
        when() {
            // an operator of Retail through Mantle's identity services alone (ADMIN_IDENTITY_*, no Admin group), and a waiting step
            // naming Admin's assignments transfer, which only Admin's own grant authorizes
            const username = "adm.lcop." + run
            system(() => {
                const partyId = invoke("mantle.party.PartyServices.create#Person", {
                    firstName: "Lif",
                    lastName: "Operator " + run
                }).partyId
                const userId = invoke("mantle.party.PartyServices.create#PartyUserAccount", {
                    partyId,
                    username,
                    emailAddress: username + "@example.com"
                }).userId
                const make = (entityName, fields) => {
                    const row = ec.entity.makeValue(entityName)
                    row.setFields(fields, true, null, null)
                    row.create()
                }
                make("mantle.party.PartyRelationship", {
                    partyRelationshipId: "ADM_LIFE_OPREL_" + run,
                    relationshipTypeEnumId: "PrtEmployee",
                    fromPartyId: partyId,
                    toPartyId: ids.organizationId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: ec.user.nowTimestamp
                })
                make("moqui.security.UserGroup", {userGroupId: "SPEC_ADM_LCOP_" + run, description: "Spec lifecycle operator"})
                for (const userPermissionId of ["ADMIN_IDENTITY_VIEW", "ADMIN_IDENTITY_MANAGE"])
                    make("moqui.security.UserGroupPermission", {
                        userGroupId: "SPEC_ADM_LCOP_" + run,
                        userPermissionId,
                        fromDate: 0
                    })
                make("moqui.security.UserGroupMember", {
                    userGroupId: "SPEC_ADM_LCOP_" + run,
                    userId,
                    fromDate: ec.user.nowTimestamp
                })
                make("mantle.party.UserLifecycleOperationStep", {
                    operationId,
                    stepSeqId: "91",
                    stepKind: "transfer",
                    providerKey: "projects.assignments",
                    actionService: "ironstone.admin.LifecycleServices.transfer#Assignments",
                    resourceParameter: "assignmentKind",
                    resourceId: "tasks",
                    statusId: "UlstWaiting",
                    attemptCount: 0
                })
            })
            ec.user.internalLoginUser(username)
            const wasDisabled = ec.artifactExecution.authzDisabled()
            ec.artifactExecution.enableAuthz()
            try {
                return invoke("mantle.party.IdentityServices.retry#LifecycleStep", {
                    operationId,
                    stepSeqId: "91",
                    toUserId: ids.retailUserId
                })
            } finally {
                ec.message.clearErrors()
                if (wasDisabled) ec.artifactExecution.disableAuthz()
                login("john.doe")
            }
        },
        then(out) {
            out.applied == false && out.reason.includes("not authorized") && out.reason.includes("transfer#Assignments")
            steps().find(step => step.stepSeqId == "91").statusId == "UlstFailed"
        }
    }
)
