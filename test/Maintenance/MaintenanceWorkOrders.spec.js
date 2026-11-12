// Maintenance work orders in BOSS (impl-maintenance P3; design-maintenance §3, §1.2, §13.3): WorkOrderDetail's one qvt render (its
// Time tab, as the technician assigned to the work: the work order, their own time and no team total) and WorkOrders' one qvt
// render (the list as a planner, with its saved finds and New work order); Commons' task check and Today's Mark done answering
// that a work order is not a task (MANAGED_WORK) while Maintenance's today-source lists it; the palette finding it; Admin's
// offboarding listing a technician's open work orders under Maintenance's participant and not Projects'; and the owner contract
// of "in maintenance" (F13, F49): Manufacturing's equipment read counts an AssetMaintenance in process, not a
// planned work order. The lifecycle's rules are Mantle's MaintenanceWorkOrders and MaintenanceManagedWork; the golden walk is the
// client's MaintenanceWorkOrdersWalk, the "usable when" the acceptance MaintenanceCorrectiveWalk.
// Run: ./moq test mr-boss --spec MaintenanceWorkOrders
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("WorkOrderDetail shows the technician their assigned work order and their own time, not the team's total", {
    when() {
        // the header (with its lifecycle) and the Time tab, each rendered once
        const header = asUser(users.tech, () => page("WorkOrders/WorkOrderDetail", {workEffortId: ids.inProgressOrderId}))
        const time = asUser(users.tech, () =>
            page("WorkOrders/WorkOrderDetail/Time", {workEffortId: ids.inProgressOrderId, lastStandalone: "true"})
        )
        return {header, time}
    },
    then({header, time}) {
        header.errors.length == 0
        header.output.includes("Air handler coil leak")
        header.output.includes("In Progress")
        header.output.includes("Facilities maintenance")
        // the technician's lifecycle: Complete is open to them, Cancel names who may
        header.output.includes("Complete")
        header.output.includes("A supervisor cancels started work")
        // P19: the print, the calendar file and, for its assigned technician, the video call
        header.output.includes("Print work order")
        header.output.includes("Add to calendar (.ics)")
        header.output.includes("Add video call")
        time.errors.length == 0
        time.output.includes("Your time: 1.5 h")
        time.output.includes("Traced the leak to the coil header")
        !time.output.includes("everyone:")
        time.output.includes("Start timer")
        time.output.includes("Record time")
    }
})

feature(
    "WorkOrders lists the planner's open work with its saved finds; Retail's planner and an unassigned technician find none of it",
    {
        when() {
            const rendered = asUser(users.planner, () => page("WorkOrders/Find", {}))
            const rows = (user, parameters) =>
                asUser(user, () =>
                    Array.from(
                        invoke("ironstone.maintenance.WorkOrderServices.find#WorkOrderRows", parameters).workOrderList || []
                    ).map(row => row.workEffortId)
                )
            return {
                rendered,
                unassigned: rows(users.planner, {savedFind: "unassigned"}),
                overdue: rows(users.planner, {savedFind: "overdue"}),
                retail: rows(users.retailPlanner, {statusId: "all"}),
                tech: rows(users.tech, {}),
                team: rows(users.tech2, {savedFind: "mine"})
            }
        },
        then({rendered, unassigned, overdue, retail, tech, team}) {
            rendered.errors.length == 0
            rendered.output.includes("Air handler coil leak")
            rendered.output.includes("Room 201 projector bracket loose")
            rendered.output.includes("New work order")
            rendered.output.includes("Unassigned")
            // closed work is not listed by default
            !rendered.output.includes("Room 102 light flickers")
            unassigned.includes(ids.waitingOrderId) && unassigned.includes(ids.roomOrderId)
            !unassigned.includes(ids.inProgressOrderId)
            overdue.includes(ids.overdueOrderId)
            retail.length == 0
            tech.includes(ids.inProgressOrderId) && tech.includes(ids.overdueOrderId)
            !tech.includes(ids.plannedOrderId)
            team.includes(ids.plannedOrderId) && team.includes(ids.heldOrderId)
        }
    }
)

feature(
    "Commons treats a work order as no task: its task check and Today's Mark done refuse it, and Maintenance's Today lists it",
    {
        when() {
            // as the technician, with the Commons services' own authorization aside (the technician has no Commons group here): the
            // refusals are their data checks
            return asUser(users.tech, () =>
                system(() => {
                    const access = refusal("ironstone.commons.TaskServices.get#TaskAccess", {
                        app: "commons",
                        workEffortId: ids.inProgressOrderId,
                        need: "update"
                    })
                    const update = refusal("ironstone.commons.CommonsServices.check#TaskUpdate", {
                        workEffortId: ids.inProgressOrderId
                    })
                    const done = refusal("ironstone.commons.CommonsServices.complete#TodayItem", {
                        workEffortId: ids.inProgressOrderId
                    })
                    const today = invoke("ironstone.maintenance.HomeServices.get#TodayItems", {})
                    const builtIn = invoke("mantle.work.WorkEffortServices.get#UserTodayItems", {})
                    const builtInIds = []
                        .concat(
                            Array.from(builtIn.overdue || []),
                            Array.from(builtIn.dueToday || []),
                            Array.from(builtIn.laterToday || [])
                        )
                        .map(item => item.workEffortId)
                    const palette = Array.from(
                        invoke("ironstone.maintenance.ContextServices.search#Records", {text: "coil leak"}).rows || []
                    )
                    return {access, update, done, today: Array.from(today.items || []), builtInIds, palette}
                })
            )
        },
        then({access, update, done, today, builtInIds, palette}) {
            access.includes("MANAGED_WORK")
            access.includes("WorkOrderDetail")
            update.includes("MANAGED_WORK")
            done.includes("MANAGED_WORK")
            today.some(
                item =>
                    item.workEffortId == ids.overdueOrderId && item.canUpdate === false && item.url.includes("WorkOrderDetail")
            )
            !builtInIds.includes(ids.overdueOrderId)
            palette.some(row => row.recordId == ids.inProgressOrderId && row.url.includes("WorkOrders/WorkOrderDetail"))
        }
    }
)

feature("Admin's offboarding lists a technician's open work orders under Maintenance's participant and not under Projects', naming who moves them for an identity operator", {
    when() {
        const preview = asUser(users.system, () =>
            invoke("ironstone.admin.LifecycleServices.find#OwnedResources", {userId: "BOSS_MNT_TECH"})
        )
        const participant = key => Array.from(preview.participantList || []).find(row => row.participantKey == key) || {}
        // the identity operator holds no maintenance permission: the work orders are listed with who moves them, and are not
        // offered as a transfer (the user's call, Nov 12); the lookup as Admin's offboarding runs it, under Admin's grant
        const operator = asUser("admin.identity", () => {
            ec.artifactExecution.disableAuthz()
            try {
                return invoke("ironstone.maintenance.LifecycleServices.find#Assignments", {userId: "BOSS_MNT_TECH"})
            } finally {
                ec.artifactExecution.enableAuthz()
            }
        })
        return {
            maintenance: participant("maintenance.assignments"),
            projects: participant("projects.assignments"),
            operator: Array.from(operator.resourceList || []).find(row => row.resourceId == "workOrders") || {}
        }
    },
    then({maintenance, projects, operator}) {
        maintenance.state == "ready"
        maintenance.resourceList.some(row => row.resourceId == "workOrders" && row.resourceName.includes("(2)"))
        operator.transferable === false
        operator.resourceName.includes("(2)") && operator.resourceName.includes("Maintenance planner or supervisor")
        !Array.from(projects.resourceList || []).some(row => ["tasks", "workItems"].includes(row.resourceId))
    }
})

feature("Manufacturing's equipment read counts work in process as in maintenance, not a planned work order", {
    when() {
        const manufacturing = assetId =>
            asUser(
                "manufacturing.services",
                () => invoke("ironstone.manufacturing.WorkCenterServices.get#Equipment", {assetId}).availabilityText
            )
        return {
            plannedCompressor: manufacturing(ids.compressorId),
            leakingAirHandler: manufacturing(ids.airHandlerId)
        }
    },
    then({plannedCompressor, leakingAirHandler}) {
        plannedCompressor != "In maintenance"
        leakingAirHandler == "In maintenance"
    }
})

feature(
    "the equipment's Maintenance tab, the facility's Work orders tab, the work order's History and the Work policy each show their records",
    {
        when() {
            const equipment = asUser(users.planner, () =>
                page("Equipment/EquipmentDetail/Maintenance", {assetId: ids.compressorId, lastStandalone: "true"})
            )
            const facility = asUser(users.planner, () =>
                page("Facilities/FacilityDetail/WorkOrders", {facilityId: ids.floorId, statusId: "all", lastStandalone: "true"})
            )
            const history = asUser(users.supervisor, () =>
                page("WorkOrders/WorkOrderDetail/History", {workEffortId: ids.inProgressOrderId, lastStandalone: "true"})
            )
            const policy = asUser(users.admin, () => page("Settings/WorkPolicy", {organizationPartyId: ids.organizationId}))
            return {equipment, facility, history, policy}
        },
        then({equipment, facility, history, policy}) {
            equipment.errors.length == 0
            equipment.output.includes("Compressor 500-hour oil service")
            equipment.output.includes("Compressor drive belt squeal")
            equipment.output.includes("Create work")
            // P13: its preventive plans
            equipment.output.includes("Preventive plans")
            equipment.output.includes("Compressor C-1 oil service every 250 hours")
            facility.errors.length == 0
            facility.output.includes("Room 102 light flickers")
            facility.output.includes("Air handler coil leak") == false
            history.errors.length == 0
            history.output.includes("No change is recorded yet.") || history.output.includes("Status")
            policy.errors.length == 0
            policy.output.includes("Approve planned work up to (hours)")
            policy.output.includes("The defaults are in effect")
            // P6: procedure self-approval, off by default
            policy.output.includes("A procedure's last author may approve it")
            // P7 review (the user's call of Nov 12): voice note transcription, off by default
            policy.output.includes("Transcribe technicians' voice notes")
            // P18: a change starts from a date chosen
            policy.output.includes("Starts")
            // P11: the threshold's cost half, a policy field
            policy.output.includes("Approve planned work estimated up to")
        }
    }
)
