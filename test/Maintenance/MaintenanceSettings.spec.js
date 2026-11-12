// Maintenance's settings in BOSS (impl-maintenance P18; design-maintenance §9 Settings, Readiness and Lookups, §6 EquipmentImport):
// the work policy dated (a change from next month ends the one in effect then and keeps the fields it does not name; a change
// before the plan refused, PLAN_PENDING, and withdrawing it when asked; a past start and a reader refused), the lookups (a
// vocabulary's value added and ended, then offered for no new choice; a fixed kind renamed only; a failure mode offered for the equipment of its model alone) with Lookups' one
// qvt render, the setup readiness (each finding named with its owner's place as a route key Admin's mount resolves, Admin's
// Health showing the provider to the administrator and not to a reader) with Readiness' one qvt render, and the equipment import
// listed in Admin's Imports for a data operator who also holds MAINTENANCE_RESOURCE_VIEW and not for one without it. The import's
// row rules are Mantle's MaintenanceImport; the access cases are MaintenanceAccess'; the "usable when" is the acceptance
// MaintenanceSetupWalk. P8: Teams' one qvt render (People's compressor team read only, its lead and members with their dates, the
// link to People's organization structure, its dispatch defaults), the team a People unit of its employer that People's
// membership service reaches (impl-people's Maintenance merge review).
// Standalone over the demo: a spec-local organization for the policy and the readiness (the demo's organization keeps its
// defaults for the other specs), and spec-local data operators.
// Run: ./moq test mr-boss --spec MaintenanceSettings
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const S = "mantle.work.MaintenanceSettingsServices."
const T = "org.moqui.admin.DataTransferServices."
const prefix = "MNT_SET_SPEC"
const specOrg = prefix + "_ORG"
const run = String(Date.now()).slice(-7)
const since = "2000-01-01T00:00:00Z"

// a call as the user with the artifact check aside (the Mantle service's own permission and scope checks decide)
const as = (user, service, parameters = {}) => asUser(user, () => system(() => invoke(service, parameters)))
const refusedAs = (user, service, parameters = {}) => asUser(user, () => system(() => refusal(service, parameters)))
const options = (user, parameters) =>
    asUser(user, () =>
        (
            invoke("ironstone.maintenance.ContextServices.get#Choices", Object.assign({appRoot: "Maintenance"}, parameters))
                .options || []
        ).map(option => option.value)
    )
// a data operator of Services: Admin's data group, with the resource view or without it
function dataOperator(kind, withView) {
    const userId = prefix + "_DATA_" + kind
    const username = userId.toLowerCase()
    if (ec.entity.find("moqui.security.UserAccount").condition("userId", userId).one()) return username
    const partyId = userId
    call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
    call("create#mantle.party.Person", {partyId, firstName: "Maintenance settings", lastName: "Data " + kind})
    call("create#mantle.party.PartyRelationship", {
        relationshipTypeEnumId: "PrtAgent",
        fromPartyId: partyId,
        toPartyId: ids.organizationId,
        toRoleTypeId: "OrgInternal",
        fromDate: since
    })
    call("create#moqui.security.UserAccount", {
        userId,
        username,
        partyId,
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA"
    })
    const groups = ["BOSS_USERS", "BOSS_ADMIN_DATA"]
    if (withView) {
        const groupId = prefix + "_RESOURCE_VIEW"
        if (!ec.entity.find("moqui.security.UserGroup").condition("userGroupId", groupId).one()) {
            call("create#moqui.security.UserGroup", {
                userGroupId: groupId,
                description: "Maintenance settings spec: resource view"
            })
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: groupId,
                userPermissionId: "MAINTENANCE_RESOURCE_VIEW",
                fromDate: since
            })
        }
        groups.push(groupId)
    }
    for (const userGroupId of groups) call("create#moqui.security.UserGroupMember", {userId, userGroupId, fromDate: since})
    return username
}
const operators = {}
const jobStates = ["JOB_NOT_CONFIGURED", "JOB_PAUSED", "JOB_NOT_RUN"]

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            if (!ec.entity.find("mantle.party.Party").condition("partyId", specOrg).one()) {
                call("create#mantle.party.Party", {partyId: specOrg, partyTypeEnumId: "PtyOrganization", ownerPartyId: specOrg})
                call("create#mantle.party.Organization", {partyId: specOrg, organizationName: "Maintenance Settings Spec Co"})
                call("create#mantle.party.PartyRole", {partyId: specOrg, roleTypeId: "OrgInternal"})
                // an active preventive plan, so the generation job is asked for
                call("create#mantle.work.maintenance.MaintenanceSchedule", {
                    maintenanceScheduleId: prefix + "_PLAN",
                    scheduleName: "Spec plan",
                    organizationPartyId: specOrg,
                    statusId: "MschActive",
                    fromDate: since
                })
            }
            operators.withView = dataOperator("VIEW", true)
            operators.without = dataOperator("PLAIN", false)
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("a policy change is dated: from next month it ends the one in effect then and keeps what it does not name", {
    when() {
        const store = parameters =>
            refusedAs(users.admin, S + "store#MaintenancePolicy", Object.assign({organizationPartyId: specOrg}, parameters))
        const nextMonth = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
        const now = store({approvalThresholdHours: 4, procedureSelfApproval: "Y", comments: "Spec now"})
        const later = store({approvalThresholdHours: 8, fromDate: nextMonth, comments: "Spec from next month"})
        const read = as(users.admin, S + "get#MaintenancePolicy", {organizationPartyId: specOrg})
        const rows = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.work.maintenance.MaintenancePolicy")
                    .condition("organizationPartyId", specOrg)
                    .orderBy("fromDate")
                    .list()
            )
        )
        const past = store({approvalThresholdHours: 2, fromDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)})
        const reader = refusedAs(users.reader, S + "store#MaintenancePolicy", {
            organizationPartyId: specOrg,
            approvalThresholdHours: 1
        })
        // a change from now, before the plan starts, is refused naming the plan, and withdraws it when asked (P18 review R4, the
        // user's call of Nov 12)
        const pending = store({approvalThresholdHours: 6})
        const pendingRead = as(users.admin, S + "get#MaintenancePolicy", {organizationPartyId: specOrg})
        const again = store({approvalThresholdHours: 6, withdrawPlanned: true})
        const after = as(users.admin, S + "get#MaintenancePolicy", {organizationPartyId: specOrg})
        return {now, later, read, rows, past, reader, pending, pendingRead, again, after, nextMonth}
    },
    then(r) {
        r.now == "" && r.later == ""
        String(r.read.policy.approvalThresholdHours) == "4"
        r.read.planned.length == 1
        String(r.read.planned[0].approvalThresholdHours) == "8"
        // the plan keeps self-approval, which it did not name
        r.read.planned[0].procedureSelfApproval === true
        // the row in effect ends when the plan starts
        r.rows.length == 2
        Math.abs(Number(r.rows[0].thruDate) - r.nextMonth.getTime()) < 1000
        r.rows[1].thruDate == null
        r.past.includes("DATE_INVALID")
        r.reader.includes("PERMISSION_DENIED")
        r.pending.includes("PLAN_PENDING") && r.pending.includes(r.read.planned[0].fromDateText)
        String(r.pendingRead.policy.approvalThresholdHours) == "4" && r.pendingRead.planned.length == 1
        r.again == ""
        String(r.after.policy.approvalThresholdHours) == "6"
        r.after.policy.procedureSelfApproval === true
        r.after.planned.length == 0
        r.after.ended.some(row => String(row.approvalThresholdHours) == "4")
    }
})

feature(
    "a vocabulary's value is added and ended, then offered for no new choice; a fixed kind is renamed only; a failure mode applies to its model",
    {
        when() {
            const store = parameters => as(users.admin, S + "store#MaintenanceLookup", parameters)
            const added = store({enumTypeId: "MaintenanceSeverity", description: "Spec cosmetic " + run, sequenceNum: 90})
            const offered = options(users.planner, {choice: "severities", term: "Spec cosmetic " + run})
            const ended = store({
                enumTypeId: "MaintenanceSeverity",
                enumId: added.enumId,
                expectedRevision: added.revision,
                end: true
            })
            const offeredAfter = options(users.planner, {choice: "severities", term: "Spec cosmetic " + run})
            const newKind = refusedAs(users.admin, S + "store#MaintenanceLookup", {
                enumTypeId: "MaintenanceKind",
                description: "Spec kind"
            })
            const kind = as(users.admin, S + "find#MaintenanceLookups", {enumTypeId: "MaintenanceKind"}).values.find(
                row => row.enumId == "MkCorrective"
            )
            const endKind = refusedAs(users.admin, S + "store#MaintenanceLookup", {
                enumTypeId: "MaintenanceKind",
                enumId: "MkCorrective",
                expectedRevision: kind.revision,
                end: true
            })
            const renamed = refusedAs(users.admin, S + "store#MaintenanceLookup", {
                enumTypeId: "MaintenanceKind",
                enumId: "MkCorrective",
                expectedRevision: kind.revision,
                description: kind.description
            })
            const readerStore = refusedAs(users.reader, S + "store#MaintenanceLookup", {
                enumTypeId: "MaintenanceSeverity",
                description: "Spec reader"
            })
            // a failure mode of the compressor's model: offered for the compressor's work, not the van's
            const mode = store({enumTypeId: "MaintenanceFailureMode", description: "Spec seized " + run})
            store({enumTypeId: "MaintenanceFailureMode", enumId: mode.enumId, addProductId: ids.modelId})
            const forCompressor = options(users.planner, {
                choice: "failureModes",
                term: "Spec seized " + run,
                assetId: ids.compressorId
            })
            const forVan = options(users.planner, {choice: "failureModes", term: "Spec seized " + run, assetId: ids.vanId})
            const lookups = asUser(users.admin, () =>
                page("Settings/Lookups", {enumTypeId: "MaintenanceFailureMode", lastStandalone: "true"})
            )
            return {
                added,
                offered,
                ended,
                offeredAfter,
                newKind,
                endKind,
                renamed,
                readerStore,
                mode,
                forCompressor,
                forVan,
                lookups
            }
        },
        then(r) {
            r.offered.includes(r.added.enumId)
            !r.offeredAfter.includes(r.added.enumId)
            r.newKind.includes("FAMILY_FIXED")
            r.endKind.includes("FAMILY_FIXED")
            r.renamed == ""
            r.readerStore.includes("PERMISSION_DENIED")
            r.forCompressor.includes(r.mode.enumId)
            !r.forVan.includes(r.mode.enumId)
            r.lookups.errors.length == 0
            r.lookups.output.includes("Spec seized " + run)
            r.lookups.output.includes("Model: ")
            r.lookups.output.includes("All equipment")
            r.lookups.output.includes("Applies to")
            r.lookups.output.includes("Kept by their owners")
        }
    }
)

feature(
    "each readiness finding names its owner's place, which Admin resolves; Admin's Health shows it to the administrator, not a reader",
    {
        when() {
            const specChecks = as(users.admin, S + "check#MaintenanceReadiness", {organizationPartyId: specOrg}).checks
            const services = as(users.admin, S + "check#MaintenanceReadiness", {organizationPartyId: ids.organizationId}).checks
            const reader = refusedAs(users.reader, S + "check#MaintenanceReadiness", {organizationPartyId: ids.organizationId})
            const health = user =>
                asUser(user, () =>
                    invoke("org.moqui.admin.ReadinessServices.get#Readiness", {
                        providerKey: "maintenance.readiness",
                        scopeParameters: {organizationPartyId: specOrg}
                    })
                ).checks || []
            const adminHealth = health(users.admin)
            const readerHealth = health(users.reader)
            const routes =
                system(() => invoke("ironstone.admin.ContextServices.get#SharedContext", {appRoot: "Admin"})).mount?.routes || {}
            const tab = asUser(users.admin, () =>
                page("Settings/Readiness", {organizationPartyId: ids.organizationId, lastStandalone: "true"})
            )
            return {specChecks, services, reader, adminHealth, readerHealth, routes, tab}
        },
        then(r) {
            const byKey = (checks, key) => checks.find(check => check.checkKey == key) || {}
            r.specChecks.length == 6
            byKey(r.specChecks, "maintenance.templates").reasonCode == "NO_PROCEDURE"
            byKey(r.specChecks, "maintenance.templates").fixRoute == "maintenanceProcedures"
            byKey(r.specChecks, "maintenance.costPolicy").reasonCode == "MAINTENANCE_COST_UNMAPPED"
            byKey(r.specChecks, "maintenance.costPolicy").fixRoute == "accountingPostingDefaults"
            // the generation job: not configured before P14 seeds it, then paused until it is turned on
            jobStates.includes(byKey(r.specChecks, "maintenance.generationJob").reasonCode)
            r.specChecks.every(
                check => check.subject == "Maintenance Settings Spec Co" && check.scope.organizationPartyId == specOrg
            )
            // the demo's technicians have no labor costing rate (the demo's production rate is of production work)
            byKey(r.services, "maintenance.costingRates").reasonCode == "RATE_MISSING"
            byKey(r.services, "maintenance.costingRates").fixRoute == "accountingCostingPolicies"
            byKey(r.services, "maintenance.templates").state == "ready"
            // every place a finding names is a route Admin's mount gives (a job's is the framework's own, adminJob)
            r.specChecks
                .concat(r.services)
                .filter(check => check.fixRoute)
                .every(check => !!r.routes[check.fixRoute] || check.fixRoute == "adminJob")
            r.reader.includes("PERMISSION_DENIED")
            r.adminHealth.some(check => check.providerKey == "maintenance.readiness" && check.fixRoute == "maintenanceProcedures")
            !r.readerHealth.some(check => check.providerKey == "maintenance.readiness")
            r.tab.errors.length == 0
            r.tab.output.includes("Labor costing rates")
            r.tab.output.includes("Accounting: Costing policies")
            r.tab.output.includes("/qapps/Accounting/Settings/CostingPolicies")
        }
    }
)

feature(
    "Admin's Imports lists an equipment import for a data operator who also holds the resource view, not for one without it",
    {
        when() {
            const content =
                "Source system,Source key,Name,Location ID\nSPEC,PUMP-" + run + ",Spec pump " + run + "," + ids.floorId + "\n"
            const imported = asUser(users.resources, () => {
                const step = (verb, params) => invoke(T + verb, Object.assign({targetId: "equipment"}, params))
                const staged = step("stage#Import", {organizationPartyId: ids.organizationId, sourceText: content})
                const validated = step("validate#Import", {
                    operationKey: staged.operationKey,
                    mappingRevision: staged.mappingRevision
                })
                const applied = step("apply#Import", {
                    operationKey: staged.operationKey,
                    inputFingerprint: validated.inputFingerprint
                })
                return {staged, applied}
            })
            const listed = user =>
                Array.from(asUser(user, () => invoke(T + "find#ImportRuns", {targetId: "equipment"})).transferList || []).map(
                    row => row.runId
                )
            return {imported, withView: listed(operators.withView), without: listed(operators.without)}
        },
        then(r) {
            r.imported.applied.appliedCount == 1
            r.withView.includes(r.imported.staged.operationKey)
            !r.without.includes(r.imported.staged.operationKey)
        }
    }
)

feature(
    "Teams shows People's team read only, with its lead, its dated members and its dispatch defaults, and says membership is People's",
    {
        when() {
            const rendered = asUser(users.admin, () =>
                page("Settings/Teams", {
                    organizationPartyId: ids.organizationId,
                    teamPartyId: ids.fieldTeamId,
                    lastStandalone: "true"
                })
            )
            // the team is a People unit of its employer (impl-people's Maintenance merge review, R2): People's membership
            // service reaches it and refuses only what is asked (Kenji leads it already), where a team outside People's tree is
            // not available
            const peopleTeam = asUser(users.system, () =>
                system(() =>
                    refusal("mantle.humanres.OrganizationServices.store#Membership", {
                        unitPartyId: ids.fieldTeamId,
                        partyId: ids.qualifiedTechId,
                        memberRole: "lead"
                    })
                )
            )
            return {rendered, peopleTeam}
        },
        then({rendered, peopleTeam}) {
            peopleTeam.includes("ALREADY_MEMBER")
            rendered.errors.length == 0
            rendered.output.includes("Compressor and field service")
            rendered.output.includes("Facilities maintenance")
            rendered.output.includes("Kenji Arakawa")
            rendered.output.includes("Lead")
            rendered.output.includes("Owen Castillo")
            rendered.output.includes("Dispatch defaults")
            rendered.output.includes("compressors")
            rendered.output.includes("Being a member grants nothing in Maintenance")
        }
    }
)
