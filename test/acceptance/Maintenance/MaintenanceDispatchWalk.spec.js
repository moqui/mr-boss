// Maintenance P8's "usable when" (impl-maintenance P8, gate 2; design-maintenance §11.2 "Labor cost and qualification", its
// qualification half; §3 AssignSchedule, §9 Teams, review Y4 and Y8), as an acceptance walk with artifact authorization on: the
// planner makes the compressor service of the AC-200 procedure (its oil change asks field service at level 3 proved by the
// electrical safety certificate) for Services' compressor team in the demo's week, sees Assign and schedule rank the team's
// technicians (Kenji first; Owen, on leave that week, last; Sofia's certificate named expired), assigns Sofia and is warned; the
// administrator turns the work policy's qualification check to Block, and the planner cannot assign Sofia again; Teams shows the
// team read only. The rules are Mantle's MaintenanceDispatch and BOSS's MaintenanceWorkOrders, MaintenanceSettings and
// MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenanceDispatchWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const state = {}
const S = "mantle.work.MaintenanceServices."
// the demo's week of Owen's leave (BossZMaintenanceDemoData.xml, P8): Tuesday morning
const windowFrom = "2026-11-17 08:00:00.000"
const windowThru = "2026-11-17 12:00:00.000"
const stamp = text => ec.l10n.parseTimestamp(text, "yyyy-MM-dd HH:mm:ss.SSS")

// a Mantle service as the user, with the artifact check aside (the steps before the walk's reads; their own checks decide)
const as = (user, service, parameters) =>
    asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
// a transition of a Maintenance screen posted as the user: its status, errors and messages
function post(user, path, parameters) {
    return asUser(user, () => {
        ec.message.clearAll()
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        const messages = Array.from(ec.message.messageInfos || []).map(info => String(info.message ?? info))
        ec.message.clearAll()
        return {status: result.status, errors, messages}
    })
}
const revision = workEffortId =>
    system(() => ec.entity.find("mantle.work.maintenance.MaintenanceWorkOrder").condition("workEffortId", workEffortId).one())
        .revision
const assignees = workEffortId =>
    system(() =>
        Array.from(
            ec.entity
                .find("mantle.work.effort.WorkEffortParty")
                .condition({workEffortId, roleTypeId: "Assignee"})
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .list()
        ).map(row => row.partyId)
    )
const technicians = (user, parameters) =>
    asUser(user, () =>
        Array.from(
            invoke(
                "ironstone.maintenance.ContextServices.get#Choices",
                Object.assign({appRoot: "Maintenance", choice: "technicians"}, parameters)
            ).options || []
        )
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the compressor service of the approved AC-200 procedure, for the compressor team, in the demo's week
        state.work = as(users.planner, S + "create#MaintenanceWorkOrder", {
            assetId: ids.compressorId,
            templateWorkEffortId: ids.compressorProcedureId,
            workEffortName: "Compressor C-1 service",
            teamPartyId: ids.fieldTeamId,
            estimatedStartDate: stamp(windowFrom),
            estimatedCompletionDate: stamp(windowThru),
            operationKey: "dispatch-walk-" + Date.now()
        }).workEffortId
    },
    cleanupSpec() {
        // the work policy back to its warning
        as(users.admin, "mantle.work.MaintenanceSettingsServices.store#MaintenancePolicy", {
            organizationPartyId: ids.organizationId,
            qualificationBlocks: "N",
            withdrawPlanned: true
        })
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Assign and schedule ranks the team: Kenji first, Sofia's certificate named expired and Owen, on leave that week, last", {
    when() {
        const overview = asUser(users.planner, () =>
            page("WorkOrders/WorkOrderDetail/Overview", {workEffortId: state.work, lastStandalone: "true"})
        )
        const ranked = technicians(users.planner, {workEffortId: state.work})
        const found = as(users.planner, S + "find#MaintenanceCandidates", {workEffortId: state.work})
        return {overview, ranked, found}
    },
    then({overview, ranked, found}) {
        overview.errors.length == 0
        overview.output.includes("Assign and schedule")
        const at = partyId => ranked.findIndex(option => option.value == partyId)
        at(ids.qualifiedTechId) == 0
        at(ids.expiredTechId) == 1 && ranked[1].label.includes("Expired")
        at(ids.awayTechId) == 2 && ranked[2].label.includes("0 h free")
        ranked[0].label.includes("Qualified")
        // the step's requirement, copied from the procedure with its level and certificate
        found.requirementList.some(row => row.minimumLevel == 3 && row.qualificationTypeName == "Electrical safety certificate")
        // the staffing answer only: no certificate number or issuer
        !JSON.stringify(found).includes("ESB-41877") && !JSON.stringify(found).includes("Electrical Safety Board")
    }
})

feature("assigning Sofia warns of her expired certificate; under the Block policy the planner cannot assign her", {
    when() {
        const warned = post(users.planner, "WorkOrders/WorkOrderDetail/Overview/scheduleWorkOrder", {
            workEffortId: state.work,
            expectedRevision: revision(state.work),
            teamPartyId: ids.fieldTeamId,
            assigneePartyIds: ids.expiredTechId
        })
        const afterWarning = assignees(state.work)
        const blockPolicy = post(users.admin, "Settings/WorkPolicy/storePolicy", {
            organizationPartyId: ids.organizationId,
            qualificationBlocks: "Y",
            withdrawPlanned: "Y"
        })
        // Kenji instead, then Sofia beside him: refused
        post(users.planner, "WorkOrders/WorkOrderDetail/Overview/scheduleWorkOrder", {
            workEffortId: state.work,
            expectedRevision: revision(state.work),
            teamPartyId: ids.fieldTeamId,
            assigneePartyIds: ids.qualifiedTechId
        })
        const blocked = post(users.planner, "WorkOrders/WorkOrderDetail/Overview/scheduleWorkOrder", {
            workEffortId: state.work,
            expectedRevision: revision(state.work),
            teamPartyId: ids.fieldTeamId,
            assigneePartyIds: [ids.qualifiedTechId, ids.expiredTechId].join(",")
        })
        return {warned, afterWarning, blockPolicy, blocked, afterBlock: assignees(state.work)}
    },
    then({warned, afterWarning, blockPolicy, blocked, afterBlock}) {
        warned.errors.length == 0
        warned.messages.some(message => message.includes("Qualification warning") && message.includes("Sofia"))
        afterWarning.includes(ids.expiredTechId)
        blockPolicy.errors.length == 0
        blocked.errors.join(" ").includes("QUALIFICATION_BLOCKED") ||
            blocked.errors.join(" ").includes("qualifications they lack")
        afterBlock.length == 1 && afterBlock[0] == ids.qualifiedTechId
    }
})

feature("Teams shows the compressor team read only, its lead and members, and its dispatch defaults", {
    when() {
        return asUser(users.admin, () =>
            page("Settings/Teams", {
                organizationPartyId: ids.organizationId,
                teamPartyId: ids.fieldTeamId,
                lastStandalone: "true"
            })
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("Compressor and field service")
        rendered.output.includes("Sofia Brandt") && rendered.output.includes("Owen Castillo")
        rendered.output.includes("Kenji Arakawa")
        rendered.output.includes("compressors")
    }
})
