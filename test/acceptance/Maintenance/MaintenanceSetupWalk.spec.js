// Maintenance P18's "usable when" (impl-maintenance P18; design-maintenance §9 Settings, Readiness and Lookups, §6 EquipmentImport,
// §12 the import and outcome file), as an acceptance walk through the screens' transitions with artifact authorization on:
// maint.admin raises the planned-work approval threshold from next month in Work policy (the policy in effect keeps its threshold
// until then, the new one is listed as planned) and sees the missing labor costing rate in Readiness, with its place in Accounting;
// maint.resources imports twelve pieces of equipment with their starting run hours through Equipment import, one row refused
// (another organization's location) and downloadable in the error file, the eleven with one starting reading each; and Admin's Imports lists the run for a data operator of Services who also holds MAINTENANCE_RESOURCE_VIEW. The rules are Mantle's
// MaintenanceImport and BOSS's MaintenanceSettings and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenanceSetupWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const S = "mantle.work.MaintenanceSettingsServices."
const T = "org.moqui.admin.DataTransferServices."
const run = String(Date.now()).slice(-7)
const operator = "maint.setup.walk.data"

// A transition of a Maintenance screen posted as the user: its status, its errors and where it sent the user.
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, output: String(result.output || "")}
    })
}
// A Mantle read as the user under the root's inheritable grant (the artifact check aside; the service's own scope decides).
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // a data operator of Services (Admin's data group) who also holds the equipment view
        system(() => {
            if (ec.entity.find("moqui.security.UserAccount").condition("username", operator).one()) return
            call("create#moqui.security.UserGroup", {
                userGroupId: "MNT_SETUP_WALK_VIEW",
                description: "Maintenance setup walk: view"
            })
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: "MNT_SETUP_WALK_VIEW",
                userPermissionId: "MAINTENANCE_RESOURCE_VIEW",
                fromDate: 0
            })
            call("create#mantle.party.Party", {partyId: "MNT_SETUP_WALK_DATA", partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {
                partyId: "MNT_SETUP_WALK_DATA",
                firstName: "Setup walk",
                lastName: "Data operator"
            })
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: "MNT_SETUP_WALK_DATA",
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: "MNT_SETUP_WALK_DATA",
                username: operator,
                partyId: "MNT_SETUP_WALK_DATA",
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_ADMIN_DATA", "MNT_SETUP_WALK_VIEW"])
                call("create#moqui.security.UserGroupMember", {userId: "MNT_SETUP_WALK_DATA", userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("maint.admin raises the planned-work threshold from next month and sees the missing costing rate in Readiness", {
    when() {
        const before = read(users.admin, S + "get#MaintenancePolicy", {organizationPartyId: ids.organizationId}).policy
        const startDay = new Date()
        startDay.setMonth(startDay.getMonth() + 1, 1)
        const fromDate = ec.l10n.format(startDay, "yyyy-MM-dd") + " 00:00"
        const stored = post(users.admin, "Settings/WorkPolicy/storePolicy", {
            organizationPartyId: ids.organizationId,
            approvalThresholdHours: "8",
            closurePolicyEnumId: before.closurePolicyEnumId,
            productionRequestsManaged: before.productionRequestsManaged ? "Y" : "N",
            warrantyRepairsManaged: before.warrantyRepairsManaged ? "Y" : "N",
            procedureSelfApproval: before.procedureSelfApproval ? "Y" : "N",
            fromDate,
            comments: "Larger jobs approved from next month"
        })
        const after = read(users.admin, S + "get#MaintenancePolicy", {organizationPartyId: ids.organizationId})
        const policyPage = asUser(users.admin, () => page("Settings/WorkPolicy", {organizationPartyId: ids.organizationId}))
        const readiness = asUser(users.admin, () =>
            page("Settings/Readiness", {organizationPartyId: ids.organizationId, lastStandalone: "true"})
        )
        return {before, stored, after, policyPage, readiness}
    },
    then(r) {
        r.stored.errors.length == 0
        String(r.after.policy.approvalThresholdHours) == String(r.before.approvalThresholdHours)
        r.after.planned.some(row => String(row.approvalThresholdHours) == "8")
        opened(r.policyPage)
        r.policyPage.output.includes("Planned and earlier policies")
        r.policyPage.output.includes("Larger jobs approved from next month")
        opened(r.readiness)
        r.readiness.output.includes("Labor costing rates")
        r.readiness.output.includes("no labor costing rate")
        r.readiness.output.includes("Accounting: Costing policies")
    }
})

feature("maint.resources imports twelve pieces of equipment with starting meters, one row refused and downloadable", {
    when() {
        const header = "Source system,Source key,Name,Location ID,Model ID,Meter type ID,Starting reading"
        const lines = []
        for (let n = 1; n <= 11; n++)
            lines.push(
                [
                    "WALK",
                    "C" + n + "-" + run,
                    "Walk compressor " + n + " " + run,
                    ids.floorId,
                    ids.modelId,
                    "PdMtrMotorTime",
                    100 * n
                ].join(",")
            )
        // the twelfth is at Retail's warehouse: refused, and the eleven go on
        lines.push(
            ["WALK", "C12-" + run, "Walk compressor 12 " + run, ids.otherFacilityId, ids.modelId, "PdMtrMotorTime", 1200].join(
                ","
            )
        )
        const csv = [header].concat(lines).join("\n")
        const wizard = (path, parameters) =>
            asUser(users.resources, () => page("Equipment/EquipmentImport/Index/" + path, parameters, "html"))
        // a transition: it redirects to the wizard's next step when it succeeds
        const stage = wizard("stage", {organizationPartyId: ids.organizationId, sourceText: csv})
        const staged = (stage.status == 200 || stage.status == 302) && stage.errors.length == 0
        const key = rows("moqui.server.TransferBatch", {targetId: "equipment", userId: "BOSS_MNT_RESOURCES"}).sort((a, b) =>
            String(b.transferId).localeCompare(String(a.transferId))
        )[0]?.transferId
        const get = () => read(users.resources, T + "get#Transfer", {targetId: "equipment", operationKey: key})
        const validated = read(users.resources, T + "validate#Import", {
            targetId: "equipment",
            operationKey: key,
            mappingRevision: get().mappingRevision
        })
        wizard("apply", {operationKey: key, inputFingerprint: validated.inputFingerprint})
        const applied = get()
        const errorFile = asUser(users.resources, () =>
            page("Equipment/EquipmentImport/Index/results", {operationKey: key, errorsOnly: true}, "html")
        )
        const keys = Array.from({length: 12}, (_, i) => "WALK / C" + (i + 1) + "-" + run)
        const made = keys.map(
            idValue =>
                rows("mantle.product.asset.AssetIdentification", {identificationTypeEnumId: "AitMntSourceKey", idValue})[0]
                    ?.assetId
        )
        const readings = made.filter(Boolean).map(assetId => rows("mantle.product.maintenance.AssetMeter", {assetId}).length)
        return {staged, key, applied, errorFile, made, readings}
    },
    then(r) {
        r.staged == true
        r.applied.appliedCount == 11
        r.applied.errorCount == 1
        r.made.filter(Boolean).length == 11
        !r.made[11]
        r.readings.every(count => count == 1)
        r.errorFile.output.includes("C12-")
        r.errorFile.output.includes("not one of")
    }
})

feature("Admin's Imports lists the equipment run for a data operator of Services who also holds the resource view", {
    when() {
        const listed = Array.from(
            asUser(operator, () => invoke(T + "find#ImportRuns", {targetId: "equipment"})).transferList || []
        ).map(row => row.targetId)
        const imports = asUser(operator, () => page("Data/Imports", {targetId: "equipment"}, "qvt", "Admin"))
        return {listed, imports}
    },
    then(r) {
        r.listed.includes("equipment")
        opened(r.imports)
        r.imports.output.includes("Equipment")
    }
})
