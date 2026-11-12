// Maintenance's execution checklists in BOSS (impl-maintenance P7; design-maintenance §3 ProcedureSteps, StepResponse,
// ExecutionAmendment, §4.3, §12): WorkOrderDetail's Procedure tab rendered once in qvt for the technician of work made of the AC-200
// service (the next step leading, the tree with its group, a failed reading with its finding, a blocked step, the response form, no
// supervisor action); RecordFiles keeping a check's evidence (Mantle's evidence policy, F69) while a file no check names is removed;
// Admin's Maintenance participant counting an open step's assignee and not a done step's (F160); and WorkItemDetail's Maintenance
// context: the follow-up task with its work order (and the work order's Overview listing it, its one render), and a process step not
// available there with its link to the work order. The
// checklist rules are Mantle's ProcessChecks; the "usable when" is the acceptance client MaintenanceChecklistWalk.
// The work is a spec-local technician's (with maint.tech2's groups), so the demo technicians' counts the other specs read stay as
// they are.
// Run: ./moq test mr-boss --spec MaintenanceChecklists
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const W = "mantle.work.ProcessServices."
const S = "mantle.work.MaintenanceServices."
const tech = "maint.spec.checklist"
const techPartyId = "MNT_CHK_SPEC_TECH"
const state = {}

// a call as the user with the artifact check aside (the Mantle service's own permission and scope checks decide)
const as = (user, service, parameters = {}) => asUser(user, () => system(() => invoke(service, parameters)))
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const stepOf = name => rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: state.workOrder, workEffortName: name})[0].workEffortId
function file(name, userId) {
    return system(() =>
        invoke("create#mantle.work.effort.WorkEffortContent", {
            workEffortId: state.workOrder,
            contentTypeEnumId: "WectSupportingMedia",
            contentLocation: "dbresource://mantle/content/workEffort/" + state.workOrder + "/" + name,
            description: name,
            userId
        })
    ).workEffortContentId
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            invoke("create#mantle.party.Party", {partyId: techPartyId, partyTypeEnumId: "PtyPerson"})
            invoke("create#mantle.party.Person", {partyId: techPartyId, firstName: "Checklist", lastName: "Technician"})
            invoke("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: techPartyId,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: "2000-01-01T00:00:00Z"
            })
            invoke("create#moqui.security.UserAccount", {
                userId: techPartyId,
                username: tech,
                userFullName: "Checklist Technician",
                partyId: techPartyId,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const member of rows("moqui.security.UserGroupMember", {userId: "BOSS_MNT_TECH2"}))
                invoke("create#moqui.security.UserGroupMember", {
                    userId: techPartyId,
                    userGroupId: member.userGroupId,
                    fromDate: "2000-01-01T00:00:00Z"
                })
        })
        // work made of the AC-200 service, approved, assigned to the spec's technician and started; the group's first step done
        // and a pressure reading out of range, with a photo
        const made = as(users.planner, S + "create#MaintenanceWorkOrder", {
            assetId: ids.compressorId,
            templateWorkEffortId: ids.compressorProcedureId,
            workEffortName: "AC-200 service, checklist spec"
        })
        state.workOrder = made.workEffortId
        as(users.supervisor, S + "transition#MaintenanceWorkOrder", {workEffortId: made.workEffortId, action: "approve"})
        as(users.planner, S + "schedule#MaintenanceWorkOrder", {workEffortId: made.workEffortId, assigneePartyIds: [techPartyId]})
        as(tech, S + "transition#MaintenanceWorkOrder", {workEffortId: made.workEffortId, action: "start"})
        state.isolate = stepOf("Isolate and lock out the compressor")
        state.drain = stepOf("Drain the receiver")
        state.pressure = stepOf("Read the discharge pressure")
        state.photo = file("gauge.jpg", techPartyId)
        state.loose = file("spare.jpg", techPartyId)
        as(tech, W + "record#ProcessStep", {workEffortId: state.isolate})
        as(tech, W + "record#ProcessStep", {
            workEffortId: state.pressure,
            measurementValue: 11,
            measurementUomId: "PRES_bar",
            comments: "Relief valve sticks",
            evidenceContentIds: [state.photo]
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec's work order is cancelled, so no open work stays with its technician
        asUser(users.supervisor, () =>
            system(() =>
                refusal(S + "transition#MaintenanceWorkOrder", {workEffortId: state.workOrder, action: "cancel", cancelReasonEnumId: "McrNotNeeded"})
            )
        )
    }
})

feature("the Procedure tab leads the technician with the next step, shows the tree, the failed reading and the blocked step", {
    when() {
        const tab = asUser(tech, () =>
            page("WorkOrders/WorkOrderDetail/Procedure", {workEffortId: state.workOrder, lastStandalone: "true"})
        )
        return {tab}
    },
    then({tab}) {
        tab.errors.length == 0
        tab.output.includes("Next: Read the discharge pressure")
        tab.output.includes("Prepare") && tab.output.includes("Group")
        tab.output.includes("Drain the receiver")
        tab.output.includes("is outside 7–9")
        tab.output.includes("Waits for Prepare")
        tab.output.includes("1 of 5 required steps done")
        tab.output.includes("Respond") && tab.output.includes("Print checklist")
        tab.output.includes("Relief valve sticks")
        // no supervisor action for a technician
        !tab.output.includes("Amend") && !tab.output.includes("Waive")
    }
})

feature("RecordFiles keeps a check's evidence and removes a file no check names", {
    when() {
        const remove = workEffortContentId =>
            asUser(tech, () =>
                system(() =>
                    refusal("ironstone.shared.RecordFilesServices.remove#RecordFile", {
                        recordEntityName: "mantle.work.effort.WorkEffort",
                        recordId: state.workOrder,
                        contentKey: JSON.stringify({workEffortContentId})
                    })
                )
            )
        return {evidence: remove(state.photo), loose: remove(state.loose)}
    },
    then({evidence, loose}) {
        evidence.includes("You may not remove")
        loose == ""
        rows("mantle.work.effort.WorkEffortContent", {workEffortContentId: state.photo}).length == 1
    }
})

feature("Admin's Maintenance participant counts an open step's assignee and not a done step's (F160)", {
    when() {
        const listed = () =>
            Array.from(as(users.system, "ironstone.maintenance.LifecycleServices.find#Assignments", {userId: "BOSS_MNT_READER"}).resourceList || [])
                .find(row => row.resourceId == "workOrders")?.resourceName || ""
        const assign = workEffortId =>
            system(() =>
                invoke("create#mantle.work.effort.WorkEffortParty", {
                    workEffortId,
                    partyId: "BOSS_MNT_READER",
                    roleTypeId: "Assignee",
                    fromDate: ec.user.nowTimestamp,
                    statusId: "WeptAssigned"
                })
            )
        const before = listed()
        assign(state.isolate)
        const doneStep = listed()
        assign(state.drain)
        const openStep = listed()
        return {before, doneStep, openStep}
    },
    then({before, doneStep, openStep}) {
        doneStep == before
        openStep.includes("(1)")
    }
})

feature("the work order's Overview lists its follow-up task; WorkItemDetail in Maintenance shows it with its work order; a process step is no task there", {
    when() {
        const overview = asUser(users.tech, () =>
            page("WorkOrders/WorkOrderDetail/Overview", {workEffortId: ids.inProgressOrderId, lastStandalone: "true"})
        )
        const followUp = asUser(users.tech, () => page("WorkOrders/WorkItemDetail", {workEffortId: ids.followUpTaskId}))
        const stepContext = as(tech, "ironstone.maintenance.WorkItemServices.get#WorkItemContext", {workEffortId: state.drain})
        const otherTech = as(users.tech2, "ironstone.maintenance.WorkItemServices.get#WorkItemContext", {workEffortId: ids.followUpTaskId})
        return {overview, followUp, stepContext, otherTech}
    },
    then({overview, followUp, stepContext, otherTech}) {
        overview.errors.length == 0
        overview.output.includes("Follow-up tasks") && overview.output.includes("Order a spare coil header gasket")
        followUp.errors.length == 0
        followUp.output.includes("Order a spare coil header gasket")
        followUp.output.includes("Work orders") && followUp.output.includes(ids.inProgressOrderId)
        stepContext.available == false && stepContext.processWork == true
        stepContext.url.includes(state.workOrder)
        // the second technician reads no work it follows up (the air handler's is maint.tech's)
        otherTech.available == false
    }
})
