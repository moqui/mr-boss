// Maintenance P5's "usable when" (impl-maintenance P5; design-maintenance §11.2 "Outages" and "Outage shared with Manufacturing"), as an
// acceptance walk through the screens' transitions with artifact authorization on: an equipment-fault stop on Services' line in
// Manufacturing records the compressor's outage, which shows once in Downtime with its production context; the planner's work order
// is started by maint.tech taking the compressor out of service (the open outage is linked, not doubled) and completed with the
// compressor still down and a follow-up; Restore waits for the follow-up, which maint.tech2 completes; ending the production stop
// restores nothing; the supervisor restores the compressor from Downtime, and Manufacturing shows it available, with the
// restoration on its stop. Gate 1. The rules are Mantle's MaintenanceOutages; the renders are MaintenanceDowntime's.
// Run: ./moq accept mr-boss --spec MaintenanceOutageWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.work.ResourceBookingServices.",
    M = "mantle.work.MaintenanceServices.",
    P = "mantle.work.ProductionServices."
const line = "BOSS_MFG_SVC_LINE",
    reasonCode = "WALK_COMP_FAULT",
    operator = "john.doe"
const state = {}
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0

// A transition of a Maintenance screen posted as the user: its status, its errors and where it sent the user.
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, location: String(result.header("Location") || "")}
    })
}
// A service as the user under the root's inheritable grant (the artifact check aside; the service's own checks decide).
function as(user, service, parameters) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
}
const revision = workEffortId =>
    Number(
        system(() => ec.entity.find("mantle.work.maintenance.MaintenanceWorkOrder").condition("workEffortId", workEffortId).one())
            .revision
    )
const manufacturingAvailability = () =>
    as("manufacturing.services", "ironstone.manufacturing.WorkCenterServices.get#Equipment", {assetId: ids.compressorId})
        .availabilityText
const outageOf = id =>
    system(() => ec.entity.find("mantle.work.effort.ResourceUnavailability").condition("resourceUnavailabilityId", id).one())

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // an equipment-fault reason of Services' plant (its demo has none)
        system(() => {
            if (
                !ec.entity
                    .find("mantle.work.production.ProductionReason")
                    .condition({organizationPartyId: ids.organizationId, reasonCode})
                    .one()
            )
                call("create#mantle.work.production.ProductionReason", {
                    organizationPartyId: ids.organizationId,
                    reasonCode,
                    fromDate: "2000-01-01T00:00:00Z",
                    reasonName: "Compressor fault",
                    reasonCategoryEnumId: "PrcDowntime",
                    equipmentFault: "Y",
                    plannedStop: "N"
                })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("an equipment-fault stop in Manufacturing shows once in Downtime with its production context", {
    when() {
        const stop = as(operator, P + "store#ProductionDowntime", {
            operationKey: "walk-outage-" + ec.user.randomString(12),
            action: "open",
            facilityId: line,
            assetId: ids.compressorId,
            reasonCode,
            description: "Compressor tripped on high temperature"
        }).result
        state.stop = stop
        state.outageId = stop.resourceUnavailabilityId
        const listed = as(users.supervisor, R + "find#ResourceUnavailability", {assetId: ids.compressorId, open: "true"})
        const downtime = asUser(users.supervisor, () => page("Equipment/Downtime", {assetId: ids.compressorId, open: "true"}))
        return {stop, listed, downtime, availability: manufacturingAvailability()}
    },
    then({stop, listed, downtime, availability}) {
        stop.equipmentFault == true
        stop.resourceUnavailabilityId != null
        listed.outageList.length == 1
        listed.outageList[0].resourceUnavailabilityId == state.outageId
        listed.outageList[0].sourceText == "Production stop"
        listed.outageList[0].productionText.includes("Compressor fault")
        opened(downtime)
        downtime.output.includes("Compressor fault")
        downtime.output.includes("Out of service")
        availability == "Out of service"
    }
})

feature(
    "the work order takes the compressor out of service at Start, linking the open outage, and completes with it still down and a follow-up",
    {
        when() {
            const created = as(users.planner, M + "create#MaintenanceWorkOrder", {
                assetId: ids.compressorId,
                workEffortName: "Compressor high temperature trip",
                operationKey: "walk-outage-wo-" + ec.user.randomString(12)
            })
            state.workId = created.workEffortId
            as(users.planner, M + "schedule#MaintenanceWorkOrder", {
                workEffortId: state.workId,
                expectedRevision: revision(state.workId),
                assigneePartyIds: [ids.techPartyId]
            })
            const started = post(users.tech, "WorkOrders/WorkOrderDetail/lifecycleAction", {
                workEffortId: state.workId,
                lifecycleAction: "start",
                expectedRevision: revision(state.workId),
                offlineIntent: "Y"
            })
            const linked = system(() =>
                ec.entity.find("mantle.work.maintenance.MaintenanceWorkOrder").condition("workEffortId", state.workId).one()
            ).resourceUnavailabilityId
            const completed = post(users.tech, "WorkOrders/WorkOrderDetail/lifecycleAction", {
                workEffortId: state.workId,
                lifecycleAction: "complete",
                expectedRevision: revision(state.workId),
                outcomeEnumId: "MoutNotRepaired",
                dispositionEnumId: "MdispUnavailable",
                followUpName: "Replace compressor fan motor"
            })
            state.followUpId = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.work.effort.WorkEffortAssoc")
                            .condition({toWorkEffortId: state.workId, workEffortAssocTypeEnumId: "WeatCausedBy"})
                            .list()
                    )[0]?.workEffortId
            )
            const tab = asUser(users.tech, () =>
                page("WorkOrders/WorkOrderDetail/Downtime", {workEffortId: state.workId, lastStandalone: "true"})
            )
            return {started, linked, completed, tab, availability: manufacturingAvailability()}
        },
        then({started, linked, completed, tab, availability}) {
            started.errors.length == 0
            linked == state.outageId
            completed.errors.length == 0
            state.followUpId != null
            outageOf(state.outageId).thruDate == null
            opened(tab)
            tab.output.includes("Out of service since")
            availability == "Out of service"
        }
    }
)

feature("Restore waits for the follow-up; ending the production stop restores nothing", {
    when() {
        const blocked = asUser(users.supervisor, () => {
            ec.artifactExecution.disableAuthz()
            return lib.refusal(R + "end#ResourceUnavailability", {
                resourceUnavailabilityId: state.outageId,
                expectedRevision: 1,
                dispositionEnumId: "MdispAvailable"
            })
        })
        as(users.planner, M + "schedule#MaintenanceWorkOrder", {
            workEffortId: state.followUpId,
            expectedRevision: revision(state.followUpId),
            assigneePartyIds: [ids.tech2PartyId]
        })
        for (const action of ["start", "complete"])
            post(users.tech2, "WorkOrders/WorkOrderDetail/lifecycleAction", {
                workEffortId: state.followUpId,
                lifecycleAction: action,
                expectedRevision: revision(state.followUpId),
                outcomeEnumId: "MoutRepaired",
                dispositionEnumId: "MdispAvailable"
            })
        const stopEnded = as(operator, P + "store#ProductionDowntime", {
            operationKey: "walk-outage-close-" + ec.user.randomString(12),
            action: "close",
            productionDowntimeId: state.stop.productionDowntimeId,
            expectedRevision: state.stop.revision
        }).result
        return {
            blocked,
            stopEnded,
            followUp: system(() =>
                ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", state.followUpId).one()
            ),
            availability: manufacturingAvailability()
        }
    },
    then({blocked, stopEnded, followUp, availability}) {
        blocked.includes("OPEN_WORK")
        followUp.statusId == "WeComplete" || followUp.statusId == "WeClosed"
        stopEnded.statusId == "PdtClosed"
        outageOf(state.outageId).thruDate == null
        availability == "Out of service"
    }
})

feature("the supervisor restores the compressor from Downtime, and Manufacturing shows it available with the restoration", {
    when() {
        const restored = post(users.supervisor, "Equipment/Downtime/restoreResource", {
            resourceUnavailabilityId: state.outageId,
            expectedRevision: Number(outageOf(state.outageId).revision),
            dispositionEnumId: "MdispAvailable",
            endComments: "Fan motor replaced; ran an hour at load"
        })
        const stops = as(operator, P + "find#ProductionDowntime", {productionDowntimeId: state.stop.productionDowntimeId})
        return {restored, row: outageOf(state.outageId), stops, availability: manufacturingAvailability()}
    },
    then({restored, row, stops, availability}) {
        restored.errors.length == 0
        row.thruDate != null
        row.dispositionEnumId == "MdispAvailable"
        availability != "Out of service"
        stops.downtimeList[0].outageText.startsWith("Restored")
    }
})
