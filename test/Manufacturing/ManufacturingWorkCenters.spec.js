// Manufacturing's work centers and equipment (impl-manufacturing P3, its "usable when"): a resource administrator makes a
// facility a line work center with two parallel slots and a capacity per hour for DEMO_1_1, and previews an offline time on
// it; an operator reads the center without its rate or Take offline while a cost reader sees the rate; the calendar shows
// line A's work hours and its shutdown day; and the Centers, Equipment and EquipmentDetail screens show what each user may
// see, through the calls the screens make after the Manufacturing access check. The Mantle calls run with artifact
// authorization disabled, as a screen's transition inherits it: they check their own permissions. The rate's cost authority,
// the unchanged people capacity and get#WorkCenter's rate by reader are mr-mantle's WorkCenters spec.
// Run: ./moq test mr-boss --spec ManufacturingWorkCenters
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const access = "ironstone.manufacturing.AccessServices."
const centers = "mantle.work.WorkCenterServices."
// a facility of Retail's under its warehouse that is not a work center yet, with a people capacity of six
const cellId = "BOSS_MFG_SPEC_CELL"
const store = (entity, fields) =>
    ec.service
        .sync()
        .name("store#" + entity)
        .parameters(fields)
        .call()

spec({
    setupSpec() {
        system(() =>
            store("mantle.facility.Facility", {
                facilityId: cellId,
                facilityTypeEnumId: "FcTpLine",
                parentFacilityId: ids.plantId,
                ownerPartyId: "ORG_ZIZI_RETAIL",
                facilityName: "Spec assembly cell",
                capacity: 6
            })
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a resource administrator makes a facility a line work center with two slots and a capacity per hour for DEMO_1_1", {
    when() {
        const checked = asUser(users.resource, () =>
            refusal(access + "check#Record", {recordType: "facility", recordId: cellId, capability: "methodResources"})
        )
        const writes = asUser(
            users.resource,
            () => {
                // as New work center and Add capacity post them, after the Manufacturing record check
                const made = invoke("mantle.work.RoutingServices.store#WorkCenter", {
                    facilityId: cellId,
                    plantFacilityId: ids.plantId,
                    calendarId: ids.lineCalendarId,
                    efficiencyPercent: 95,
                    schedulingPolicyEnumId: "WcspBackward",
                    changeReason: "New assembly cell"
                })
                const slots = invoke(centers + "store#WorkCenterCapacity", {
                    facilityId: cellId,
                    capacityBasisEnumId: "WccbSlots",
                    parallelSlots: 2,
                    changeReason: "Two fixtures"
                })
                const hourly = invoke(centers + "store#WorkCenterCapacity", {
                    facilityId: cellId,
                    capacityBasisEnumId: "WccbRate",
                    productId: "DEMO_1_1",
                    quantity: 12,
                    quantityUomId: "OTH_ea",
                    perDuration: 1,
                    durationUomId: "TF_hr",
                    changeReason: "Demonstrated rate"
                })
                return {made, slots, hourly}
            },
            false
        )
        // with a planned offline time a month on, previewed before it is recorded (the cell has no operation to move)
        const day = new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10)
        const detail = asUser(users.resource, () =>
            page("WorkCenters/FacilityDetail/WorkCenter", {
                facilityId: cellId,
                offlineFrom: day + " 05:00",
                offlineThru: day + " 07:00",
                offlineReason: "Fixture change",
                lastStandalone: "-3"
            })
        )
        return Object.assign({checked, detail}, writes)
    },
    then({checked, made, slots, hourly, detail}) {
        checked == ""
        made.facilityId == cellId
        slots.workCenterCapacity.capacityText == "2 parallel slots"
        hourly.workCenterCapacity.appliesToText.includes("DEMO_1_1")
        detail.errors == []
        detail.output.includes("Edit work center")
        detail.output.includes("2 parallel slots")
        detail.output.includes("Line A shifts")
        detail.output.includes("Calendar-adjusted hours")
        !detail.output.includes("Hourly rates")
        detail.output.includes("Offline preview")
        !detail.output.includes("could not be previewed")
        detail.output.includes("No open operation overlaps it.")
        detail.output.includes("Take offline")
    }
})
feature("an operator reads the work center without its rate or Take offline; a cost reader sees the rate", {
    when() {
        const read = user =>
            asUser(user, () => page("WorkCenters/FacilityDetail/WorkCenter", {facilityId: ids.lineId, lastStandalone: "-3"}))
        return {operator: read(users.operate), cost: read(users.cost)}
    },
    then({operator, cost}) {
        operator.errors == []
        operator.output.includes("Assembly line B")
        operator.output.includes("30 ea per hr")
        !operator.output.includes("Hourly rates")
        !operator.output.includes("Edit work center")
        // the offline times, read only: Take offline is the scheduler's and the resource administrator's
        operator.output.includes("Offline times")
        !operator.output.includes("Take offline")
        cost.output.includes("Hourly rates")
        // the cost reader holds METHOD_COST_EDIT but not METHOD_RESOURCES: no rate to add
        !cost.output.includes("Add rate")
    }
})
feature("the calendar shows line A's work hours on weekdays and its shutdown day, read only", {
    when() {
        return asUser(users.operate, () => ({
            events: invoke("ironstone.manufacturing.WorkCenterServices.get#ResourceCalendarEvents", {
                plantId: ids.plantId,
                start: "2026-11-23",
                end: "2026-11-30"
            }).eventList,
            agenda: page("WorkCenters/ResourceCalendarTui", {date: "2026-11-23"}, "tui")
        }))
    },
    then({events, agenda}) {
        const hours = events.filter(event => event.kind === "workHours" && event.title.includes("Assembly line A"))
        // Monday to Friday, 6:00 to 14:00
        hours.length == 5
        hours.map(event => event.start.substring(0, 10)) == ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"]
        // each an eight-hour shift
        hours.every(
            event =>
                Date.parse(event.end.replace(" ", "T") + ":00Z") - Date.parse(event.start.replace(" ", "T") + ":00Z") ===
                8 * 3600000
        )
        events.some(event => event.kind === "holiday" && event.start === "2026-11-27" && event.title.includes("shutdown"))
        events.every(event => event.canEdit === false)
        agenda.errors == []
        agenda.output.includes("Day shift")
        agenda.output.includes("Holiday")
    }
})
feature("the Centers list shows each center's slots and load; Equipment and EquipmentDetail show no book or cost", {
    when() {
        return asUser(users.operate, () => ({
            centersPage: page("WorkCenters/Centers"),
            equipmentPage: page("WorkCenters/Equipment"),
            detail: page("WorkCenters/EquipmentDetail", {assetId: ids.equipmentId}),
            facility: page("WorkCenters/FacilityDetail", {facilityId: ids.lineId})
        }))
    },
    then({centersPage, equipmentPage, detail, facility}) {
        centersPage.errors == []
        centersPage.output.includes("Assembly line A")
        centersPage.output.includes("Assembly line B")
        !centersPage.output.includes("Services kit line")
        // the operator makes no work center
        !centersPage.output.includes("New work center")
        equipmentPage.errors == []
        equipmentPage.output.includes("Assembly Bot 4 1234")
        detail.errors == []
        detail.output.includes("Safe use")
        detail.output.includes("Production assignments")
        !detail.output.includes("Net book value")
        !detail.output.includes("4,000")
        facility.errors == []
        facility.output.includes("Work centers")
        !facility.output.includes("Edit facility")
    }
})
