// Maintenance scheduling in BOSS (impl-maintenance P15; design-maintenance §7.1, Resources, ResourcePolicyDetail, Blackouts):
// Resources' one qvt render (Room 101 managed and approved by the resource approver, Room 103 not managed, Bookability),
// ResourcePolicyDetail's one (Room 101's policy, approver and availability), Blackouts' one (the carpet replacement over Room 101,
// Plan blackout), EquipmentDetail's Schedule tab's and FacilityDetail's Schedules tab's under Maintenance; and Admin's lifecycle
// participant listing the resources a leaver approves, handed over through store#ResourceApprover. The rules are Mantle's
// ResourceBookingPolicy; the "usable when" is the acceptance MaintenanceResourcePolicyWalk. P16: BookingRequests' one qvt render for
// Room 101's approver (the shift handover waiting, its purpose not shared, Approve and the bulk decision) and ResourceCalendarTui's
// (the terminal twin of ResourceCalendar, whose .qvue is Commons' Schedules component); the decisions are Mantle's
// ResourceBookingDecisions and the booking walk the acceptance MaintenanceBookingWalk.
// Run: ./moq test mr-boss --spec MaintenanceScheduling
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, invoke, page} = lib

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Resources, a resource's policy and Blackouts render for the resource administrator with the demo's rooms and blackout", {
    when() {
        return asUser(users.resources, () => ({
            resources: page("Scheduling/Resources", {facilityId: ids.floorId}),
            policy: page("Scheduling/ResourcePolicyDetail", {facilityId: ids.managedRoomId}),
            blackouts: page("Scheduling/Blackouts", {show: "all"})
        }))
    },
    then({resources, policy, blackouts}) {
        resources.errors.length == 0
        resources.output.includes("Room 101 Huddle")
        resources.output.includes("Managed: approved by Maintenance Resource approver, at most 2 hours, up to 90 days ahead")
        resources.output.includes("Room 103 Focus")
        resources.output.includes("Not managed: booked at once")
        resources.output.includes("Bookability")
        policy.errors.length == 0
        policy.output.includes("Save policy")
        policy.output.includes("Add approver")
        policy.output.includes("Maintenance Resource approver")
        policy.output.includes("Availability in the next two weeks")
        blackouts.errors.length == 0
        blackouts.output.includes("Plan blackout")
        blackouts.output.includes("Carpet replacement on floor 1")
        blackouts.output.includes("Closed (blackout)")
    }
})

feature("EquipmentDetail's Schedule and FacilityDetail's Schedules show a resource's policy and availability under Maintenance", {
    when() {
        return asUser(users.supervisor, () => ({
            equipment: page("Equipment/EquipmentDetail/Schedule", {assetId: ids.compressorId, lastStandalone: "true"}),
            facility: page("Facilities/FacilityDetail/Schedules", {facilityId: ids.managedRoomId, lastStandalone: "true"})
        }))
    },
    then({equipment, facility}) {
        equipment.errors.length == 0
        equipment.output.includes("Availability in the next two weeks")
        equipment.output.includes("Not managed")
        facility.errors.length == 0
        facility.output.includes("Managed: approved by")
    }
})

feature(
    "BookingRequests renders for Room 101's approver with the shift handover waiting; the calendar's terminal twin lists its day",
    {
        when() {
            return asUser(users.booking, () => ({
                // from the demo's week, so the handover (Nov 18, 2026) is listed after its day has passed too
                requests: page("Scheduling/BookingRequests", {fromDate: "2026-11-12"}),
                calendar: page("Scheduling/ResourceCalendarTui", {date: "2026-11-17"})
            }))
        },
        then({requests, calendar}) {
            requests.errors.length == 0
            requests.output.includes("Room 101 Huddle")
            requests.output.includes("Maintenance Technician")
            requests.output.includes("Six of us, and the screen for the dashboards")
            requests.output.includes("Approve")
            requests.output.includes("Decide selected")
            // the approver may not open the meeting itself: its purpose is not shown
            requests.output.includes("Not shared with you")
            !requests.output.includes("Shift handover")
            calendar.errors.length == 0
            calendar.output.includes("Room 101 Huddle")
            calendar.output.includes("Blocked")
            calendar.output.includes("Not available: closed (blackout)")
            // the vendor walkthrough the approver may not open is Busy
            calendar.output.includes("Busy")
            !calendar.output.includes("HVAC vendor walkthrough")
        }
    }
)

feature("Admin's lifecycle participant lists the rooms a leaver approves; the resource administrator hands them over", {
    when() {
        const listed = asUser("john.doe", () => {
            ec.artifactExecution.disableAuthz()
            return (
                invoke("ironstone.maintenance.LifecycleServices.find#Assignments", {userId: "BOSS_MNT_BOOKING"}).resourceList ||
                []
            )
        })
        const moved = asUser(users.resources, () => {
            ec.artifactExecution.disableAuthz()
            ec.message.pushErrors()
            try {
                ec.service
                    .sync()
                    .name("mantle.work.ResourceBookingServices.store#ResourceApprover")
                    .parameters({
                        facilityId: ids.managedRoomId,
                        partyId: "BOSS_MNT_BOOKING",
                        end: "Y",
                        replacementPartyId: "BOSS_MNT_RESOURCES"
                    })
                    .requireNewTransaction(true)
                    .call()
                return ec.message.hasError() ? ec.message.getErrorsString() : ""
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        })
        const after = asUser(users.resources, () => {
            ec.artifactExecution.disableAuthz()
            return invoke("mantle.work.ResourceBookingServices.get#ResourceBookingPolicy", {facilityId: ids.managedRoomId})
        })
        return {listed, moved, after}
    },
    then({listed, moved, after}) {
        listed.some(row => row.resourceId == "bookingApprovals" && row.resourceName.startsWith("Resources approved (1)"))
        moved == ""
        after.approverList.filter(row => row.current).map(row => row.partyId) == ["BOSS_MNT_RESOURCES"]
    }
})
