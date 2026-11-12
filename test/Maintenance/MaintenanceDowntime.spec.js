// Maintenance downtime in BOSS (impl-maintenance P5; design-maintenance §6 Downtime, §3 WorkDowntime): Downtime's one qvt render (the
// supervisor's list: Room 201 out of service with its open work order, which its Restore lists and asks a reason for, the compressor's October outage restored with its
// disposition, Record outage) and WorkOrderDetail's Downtime tab's one qvt render (Room 201's work order with its outage); Home's
// count of the resources down; and the owner contracts of availability: an outage the supervisor records on the compressor makes
// it out of service in Manufacturing's and Warehouse's equipment reads, and only its restoration makes it available again. The rules
// are Mantle's MaintenanceOutages; the "usable when" is the acceptance MaintenanceOutageWalk.
// Run: ./moq test mr-boss --spec MaintenanceDowntime
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.work.ResourceBookingServices."

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Downtime lists the scope's outages with their state and restoration; the work order's tab shows the outage it linked", {
    when() {
        const list = asUser(users.supervisor, () => page("Equipment/Downtime"))
        const tab = asUser(users.supervisor, () =>
            page("WorkOrders/WorkOrderDetail/Downtime", {workEffortId: ids.roomOrderId, lastStandalone: "true"})
        )
        const home = asUser(users.planner, () => {
            ec.artifactExecution.disableAuthz()
            return invoke("mantle.work.MaintenanceReportServices.get#MaintenanceHome", {})
        })
        return {list, tab, home}
    },
    then({list, tab, home}) {
        list.errors.length == 0
        list.output.includes("Record outage")
        list.output.includes("Room 201")
        list.output.includes("Out of service")
        // Room 201's work order is open: Restore lists it, it stays open, and the dialog asks why (the user's call, Nov 12)
        list.output.includes("Open work on it: Work order " + ids.roomOrderId)
        list.output.includes("Why restore it while that work is open")
        list.output.includes("Restored 2026-10-20")
        list.output.includes("available for use")
        list.output.includes("Safety stop")
        tab.errors.length == 0
        tab.output.includes("Out of service since")
        tab.output.includes("Starting the work takes")
        tab.output.includes("Projector bracket hanging loose")
        home.counters.downResourceCount >= 1
    }
})

feature("an outage recorded on the compressor makes it out of service in Manufacturing and Warehouse until it is restored", {
    when() {
        const availability = () => ({
            manufacturing: asUser(
                "manufacturing.services",
                () =>
                    invoke("ironstone.manufacturing.WorkCenterServices.get#Equipment", {assetId: ids.compressorId})
                        .availabilityText
            ),
            warehouse: asUser(
                "john.doe",
                () => invoke("ironstone.warehouse.FacilityServices.get#Equipment", {assetId: ids.compressorId}).availabilityText
            )
        })
        const recorded = asUser(users.supervisor, () => {
            ec.artifactExecution.disableAuthz()
            return invoke(R + "record#ResourceUnavailability", {
                assetId: ids.compressorId,
                unavailabilityReasonEnumId: "RurEquipmentFault",
                description: "Pressure relief valve lifting (MaintenanceDowntime spec)"
            })
        })
        const down = availability()
        const restored = asUser(users.supervisor, () => {
            ec.artifactExecution.disableAuthz()
            return invoke(R + "end#ResourceUnavailability", {
                resourceUnavailabilityId: recorded.resourceUnavailabilityId,
                expectedRevision: recorded.revision,
                dispositionEnumId: "MdispAvailable",
                endComments: "Valve reseated"
            })
        })
        return {recorded, down, restored, up: availability()}
    },
    then({recorded, down, restored, up}) {
        recorded.linked == false
        down.manufacturing == "Out of service"
        down.warehouse == "Out of service"
        restored.resultCode == "RESTORED"
        up.manufacturing != "Out of service"
        up.warehouse != "Out of service"
    }
})
