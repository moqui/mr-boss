// Maintenance procedures in BOSS (impl-maintenance P6; design-maintenance §4 Procedures and ProcedureDetail, §1.2, §12): ProcedureDetail's
// one qvt render (as a technician assigned to work made of the procedure: read only, no author or approver action) and each of its
// tabs and Procedures' list rendered once with their records; the approval card in Commons' approvals inbox approving a procedure
// through the WorkProcessApproval topic (approve#NotificationMessage as the approver); a step's assignee counted by Admin's
// Maintenance participant and replaced on the step (F113); and Product360's maintenance default taking only a procedure the
// applicability check admits (an owner contract with Products). The procedure rules are Mantle's MaintenanceProcesses; the "usable
// when" is the acceptance MaintenanceProceduresWalk.
// Run: ./moq test mr-boss --spec MaintenanceProcedures
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const W = "mantle.work.ProcessServices."
const S = "mantle.work.MaintenanceServices."
const state = {}

// a call as the user with the artifact check aside (the Mantle service's own permission and scope checks decide)
const as = (user, service, parameters = {}) => asUser(user, () => system(() => invoke(service, parameters)))
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const partyOf = username => one("moqui.security.UserAccount", {username}).partyId

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // work made of the compressor service, assigned to the second technician, who then reads the procedure (read only)
        const made = as(users.planner, S + "create#MaintenanceWorkOrder", {
            assetId: ids.compressorId,
            templateWorkEffortId: ids.compressorProcedureId,
            workEffortName: "AC-200 service, spec"
        })
        state.workOrder = made.workEffortId
        as(users.planner, S + "schedule#MaintenanceWorkOrder", {
            workEffortId: made.workEffortId,
            assigneePartyIds: [ids.tech2PartyId]
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("ProcedureDetail shows a technician the procedure of their work read only; its tabs and Procedures show their records", {
    when() {
        const detail = asUser(users.tech2, () => page("Procedures/ProcedureDetail", {workEffortId: ids.compressorProcedureId}))
        const tab = (user, name, workEffortId = ids.compressorProcedureId) =>
            asUser(user, () => page("Procedures/ProcedureDetail/" + name, {workEffortId, lastStandalone: "true"}))
        return {
            detail,
            find: asUser(users.author, () => page("Procedures/Find", {})),
            steps: tab(users.author, "Steps"),
            resources: tab(users.author, "Resources"),
            instructions: tab(users.author, "Instructions"),
            approval: tab(users.approver, "Approval", ids.draftProcedureId),
            usage: tab(users.planner, "Usage"),
            otherTech: asUser(users.tech, () =>
                refusal("ironstone.maintenance.AccessServices.check#Record", {
                    appRoot: "Maintenance",
                    recordType: "procedure",
                    recordId: ids.compressorProcedureId
                })
            )
        }
    },
    then({detail, find, steps, resources, instructions, approval, usage, otherTech}) {
        detail.errors.length == 0
        detail.output.includes("Air compressor AC-200 service")
        detail.output.includes("Read only: the procedure of work assigned to you")
        detail.output.includes("Approved")
        !detail.output.includes("Request approval") && !detail.output.includes("Copy as a new draft")
        !detail.output.includes("EditProcedure")
        // a technician with no work of it reads none
        otherTech.includes("RECORD_UNAVAILABLE")
        find.errors.length == 0
        find.output.includes("Room inspection") && find.output.includes("Van pre-trip check")
        find.output.includes("Compressor checklist (old)") && find.output.includes("Retired")
        find.output.includes("New procedure")
        steps.errors.length == 0
        steps.output.includes("Prepare") && steps.output.includes("Read the discharge pressure")
        steps.output.includes("Reading") && steps.output.includes("waits for Prepare")
        steps.output.includes("Add step")
        resources.errors.length == 0
        resources.output.includes("AC-200 intake filter")
        instructions.errors.length == 0
        instructions.output.includes("The whole procedure") && instructions.output.includes("No instruction")
        approval.errors.length == 0
        approval.output.includes("Request approval")
        approval.output.includes("No approval has been requested.")
        usage.errors.length == 0
        usage.output.includes(state.workOrder)
    }
})

feature("the approval card in Commons' approvals inbox approves a procedure through its topic, as the approver", {
    when() {
        const made = as(users.author, W + "store#WorkProcess", {
            workEffortName: "Spec boiler check",
            organizationPartyId: ids.organizationId
        })
        state.procedure = made.workEffortId
        as(users.author, W + "store#ProcessStep", {
            rootWorkEffortId: made.workEffortId,
            workEffortName: "Check the flue",
            responseKindEnumId: "WsrPassFail",
            roleTypeId: "Assignee"
        })
        const requested = as(users.author, W + "request#WorkProcessApproval", {workEffortId: made.workEffortId})
        const notices = rows("moqui.security.user.NotificationMessage", {
            topic: "WorkProcessApproval",
            recordId: made.workEffortId
        })
        const recipients = notices.length
            ? rows("moqui.security.user.NotificationMessageUser", {notificationMessageId: notices[0].notificationMessageId}).map(
                  row => row.userId
              )
            : []
        // the approver decides the card as Commons' Notifications screen runs it (under the screen's grant), so the decision is
        // approve#WorkProcess' own permission and scope check; the author, who is not asked, is refused
        const decide = user =>
            asUser(user, () =>
                system(() =>
                    refusal("org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                        notificationMessageId: notices[0]?.notificationMessageId
                    })
                )
            )
        const byAuthor = decide(users.author)
        const approved = decide(users.approver)
        return {
            requested,
            notices,
            recipients,
            byAuthor,
            approved,
            status: one("mantle.work.effort.WorkEffort", {workEffortId: made.workEffortId}).statusId
        }
    },
    then({requested, notices, recipients, byAuthor, approved, status}) {
        requested.notifiedCount >= 1
        notices.length == 1
        // the author is not asked (they changed it last, and approve nothing)
        recipients.includes("BOSS_MNT_APPROVER") && !recipients.includes("BOSS_MNT_AUTHOR")
        byAuthor.includes("not addressed to you")
        approved == ""
        status == "WeApproved"
    }
})

feature("a step's assignee is a work order assignment in Admin's offboarding, and is replaced on the step (F113)", {
    when() {
        const made = as(users.planner, S + "create#MaintenanceWorkOrder", {
            assetId: ids.compressorId,
            templateWorkEffortId: state.procedure,
            roleParties: {Assignee: ids.tech2PartyId}
        })
        const step = rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: made.workEffortId})[0].workEffortId
        const listed = () =>
            Array.from(
                as(users.system, "ironstone.maintenance.LifecycleServices.find#Assignments", {userId: "BOSS_MNT_TECH2"})
                    .resourceList || []
            ).find(row => row.resourceId == "workOrders")?.resourceName || ""
        const before = listed()
        const plannerParty = partyOf(users.planner)
        const replaced = as(users.planner, S + "schedule#MaintenanceWorkOrder", {
            workEffortId: made.workEffortId,
            replacePartyId: ids.tech2PartyId,
            withPartyId: plannerParty
        })
        const current = rows("mantle.work.effort.WorkEffortParty", {workEffortId: step, roleTypeId: "Assignee"})
            .filter(row => !row.thruDate)
            .map(row => row.partyId)
        return {made, before, after: listed(), replaced, current, plannerParty}
    },
    then({made, before, after, replaced, current, plannerParty}) {
        made.workEffortId != null
        // the second technician's demo work orders (2), the spec's first (assigned to the root) and this one (its step)
        before.includes("(4)")
        after.includes("(3)")
        replaced.removedPartyIds.includes(ids.tech2PartyId)
        current.includes(plannerParty) && !current.includes(ids.tech2PartyId)
    }
})

feature("Product360's maintenance default takes only a procedure the applicability check admits", {
    when() {
        const store = templateWorkEffortId =>
            asUser("catalog.edit", () =>
                system(() =>
                    refusal("ironstone.products.CatalogServices.store#CatalogRow", {
                        kind: "maintenance",
                        productId: ids.modelId,
                        description: "Spec default",
                        intervalQuantity: 250,
                        intervalUomId: "TF_hr",
                        templateWorkEffortId
                    })
                )
            )
        return {
            compressor: store(ids.compressorProcedureId),
            room: store(ids.roomProcedureId),
            retired: store(ids.retiredProcedureId),
            workOrder: store(ids.inProgressOrderId)
        }
    },
    then({compressor, room, retired, workOrder}) {
        compressor == ""
        room.includes("cannot be used") && room.includes("facility work")
        retired.includes("retired")
        workOrder.includes("Not a maintenance procedure")
    }
})
