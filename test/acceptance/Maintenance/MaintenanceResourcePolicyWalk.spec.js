// Maintenance P15's "usable when" (impl-maintenance P15; design-maintenance §11.2 "Privacy and policy"), as an acceptance walk through
// the screens' transitions with artifact authorization on: maint.resources makes Room 103 managed (approval by its approvers, two
// hours at most) and names maint.booking its approver from ResourcePolicyDetail; the planner's booking of it from Commons waits for
// approval and the approver's own is booked; maint.resources plans a blackout over both from Blackouts, which keeps them and counts
// them for review, and Blackouts and Room 103's policy show them; a booking under the blackout is refused; and a Commons user
// booking the compressor while it is out of service is refused with "out of service" and nothing of the outage's description. The
// rules are Mantle's ResourceBookingPolicy; the renders are MaintenanceScheduling's.
// Run: ./moq accept mr-boss --spec MaintenanceResourcePolicyWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.work.ResourceBookingServices.",
    S = "ironstone.commons.ScheduleServices."
const room = ids.unmanagedRoomId
const state = {}
const day = 24 * 3600000
// next week, the same weekday, in the user's time zone (book#ResourceSlot's yyyy-MM-dd HH:mm)
const nextWeek = ec.l10n.format(String(Date.now() + 7 * day), "yyyy-MM-dd")
const wall = (hhmm, dayText = nextWeek) => dayText + " " + hhmm

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
// A service as the user with the artifact check aside (the service's own checks decide); its answer, or its error text.
function as(user, service, parameters) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        ec.message.pushErrors()
        try {
            const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
        } catch (error) {
            return {error: String(error.message)}
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
const bookingOf = workEffortId =>
    system(() => ec.entity.find("mantle.work.effort.WorkEffortFacility").condition({workEffortId, facilityId: room}).one())

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the compressor is booked as equipment in Commons for this walk (its demo row is not bookable)
        system(() => call("update#mantle.product.asset.Asset", {assetId: ids.compressorId, bookable: "Y"}))
    },
    cleanupSpec() {
        // the compressor back in service and not bookable, as the demo has it
        if (state.compressorOutage)
            as(users.supervisor, R + "end#ResourceUnavailability", {
                resourceUnavailabilityId: state.compressorOutage.resourceUnavailabilityId,
                expectedRevision: state.compressorOutage.revision,
                dispositionEnumId: "MdispAvailable",
                endComments: "Walk over"
            })
        system(() => call("update#mantle.product.asset.Asset", {assetId: ids.compressorId, bookable: "N"}))
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("maint.resources makes Room 103 managed, approved by maint.booking and booked for at most two hours", {
    when() {
        const policy = post(users.resources, "Scheduling/ResourcePolicyDetail/storePolicy", {
            facilityId: room,
            bookable: "Y",
            approvalModeEnumId: "RbamApprovers",
            maximumDurationMinutes: "120",
            bookingHorizonDays: "60",
            softConflictOverride: "N"
        })
        const approver = post(users.resources, "Scheduling/ResourcePolicyDetail/storeApprover", {
            facilityId: room,
            approverPartyId: "BOSS_MNT_BOOKING"
        })
        const read = as(users.resources, R + "get#ResourceBookingPolicy", {facilityId: room})
        const detail = asUser(users.resources, () => page("Scheduling/ResourcePolicyDetail", {facilityId: room}))
        return {policy, approver, read, detail}
    },
    then({policy, approver, read, detail}) {
        policy.errors.length == 0
        approver.errors.length == 0
        read.managed == true
        read.approverList.map(row => row.partyId).includes("BOSS_MNT_BOOKING")
        read.policyText.includes("at most 2 hours")
        detail.errors.length == 0
        detail.output.includes("Maintenance Resource approver")
    }
})

feature("the planner's booking from Commons waits for approval; the approver's own is booked; three hours is refused", {
    when() {
        const planner = as(users.planner, S + "book#ResourceSlot", {
            resourceType: "room",
            resourceId: room,
            start: wall("09:00"),
            end: wall("10:00"),
            purpose: "Planner's parts review"
        })
        const approver = as(users.booking, S + "book#ResourceSlot", {
            resourceType: "room",
            resourceId: room,
            start: wall("10:00"),
            end: wall("11:00"),
            purpose: "Approver's one-to-one"
        })
        const tooLong = as(users.planner, S + "book#ResourceSlot", {
            resourceType: "room",
            resourceId: room,
            start: wall("13:00"),
            end: wall("16:00"),
            purpose: "Long workshop"
        })
        state.plannerBooking = planner.workEffortId
        state.approverBooking = approver.workEffortId
        return {planner, approver, tooLong}
    },
    then({planner, approver, tooLong}) {
        planner.error == ""
        planner.statusId == "WefRequested"
        approver.error == ""
        approver.statusId == "WefAssigned"
        tooLong.error.includes("at most 2 hours")
    }
})

feature("maint.resources plans a blackout over both bookings: they are kept and counted, and a booking under it is refused", {
    when() {
        const planned = post(users.resources, "Scheduling/Blackouts/recordBlock", {
            blockFacilityId: room,
            unavailabilityReasonEnumId: "RurClosure",
            fromDate: wall("08:00"),
            thruDate: wall("12:00"),
            description: "Window replacement (walk)"
        })
        const listed = as(users.resources, R + "find#ResourceUnavailability", {
            unavailabilityKindEnumId: "RukPlanned",
            facilityId: room
        })
        const blackouts = asUser(users.resources, () => page("Scheduling/Blackouts", {facilityId: room}))
        const under = as(users.planner, S + "book#ResourceSlot", {
            resourceType: "room",
            resourceId: room,
            start: wall("11:00"),
            end: wall("11:30"),
            purpose: "Quick sync"
        })
        return {
            planned,
            listed,
            blackouts,
            under,
            plannerBooking: bookingOf(state.plannerBooking),
            approverBooking: bookingOf(state.approverBooking)
        }
    },
    then({planned, listed, blackouts, under, plannerBooking, approverBooking}) {
        planned.errors.length == 0
        listed.outageList.length == 1
        listed.outageList[0].affectedBookingCount == 2
        listed.outageList[0].stateText == "Planned"
        blackouts.errors.length == 0
        blackouts.output.includes("2 booking(s) over it, kept for review")
        blackouts.output.includes("Window replacement (walk)")
        // nothing is cancelled
        plannerBooking.statusId == "WefRequested"
        approverBooking.statusId == "WefAssigned"
        under.error.includes("is not available then")
        !under.error.includes("Window replacement")
    }
})

feature("a Commons user booking the compressor while it is out of service is refused with no more than that", {
    when() {
        state.compressorOutage = as(users.supervisor, R + "record#ResourceUnavailability", {
            assetId: ids.compressorId,
            unavailabilityReasonEnumId: "RurEquipmentFault",
            description: "Discharge valve cracked, vendor part on order (walk)"
        })
        const refused = as(users.planner, S + "book#ResourceSlot", {
            resourceType: "equipment",
            resourceId: ids.compressorId,
            start: wall("14:00", ec.l10n.format(String(Date.now() + 2 * day), "yyyy-MM-dd")),
            end: wall("15:00", ec.l10n.format(String(Date.now() + 2 * day), "yyyy-MM-dd")),
            purpose: "Leak test rig"
        })
        const availability = as(users.planner, R + "get#ResourceAvailability", {assetId: ids.compressorId})
        return {recorded: state.compressorOutage, refused, availability}
    },
    then({recorded, refused, availability}) {
        recorded.error == ""
        refused.error.includes("Compressor C-1 is out of service then")
        !refused.error.includes("Discharge valve")
        availability.intervalList.some(row => row.kind == "actual" && row.label == "Out of service")
        !JSON.stringify(availability.intervalList).includes("Discharge valve")
    }
})
