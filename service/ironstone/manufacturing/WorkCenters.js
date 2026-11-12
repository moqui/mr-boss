// The Manufacturing reads of the Work centers area (impl-manufacturing P3; design-manufacturing §6): FacilityDetail's header
// in the Manufacturing context, the Equipment list, EquipmentDetail's Manufacturing context and the ResourceCalendar's
// items. Each read checks the user's Manufacturing scope through Manufacturing.js first (a facility or asset of their
// organizations); the work-center records themselves are Mantle's mantle.work.WorkCenterServices and
// ProductionPlanningServices, which the screens call after the access check, and which check their permissions again. No
// cost, rate or book value is read here.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, ms, dateText, denied} = lib
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")

const stockAssetTypes = ["AstTpInventory", "AstTpSupplies"]
const leftStatuses = ["AstDelivered", "AstDeactivated"]
const closedMaintenance = ["AsMntCompleted", "AsMntCancelled"]
const openOperationStatuses = ["WeApproved", "WeInProgress", "WeOnHold"]
const calendarCenterLimit = 50

const factory = () => ec.entity.conditionFactory
const blank = value => value == null || String(value).trim() === ""
const like = (field, text) =>
    factory()
        .makeCondition(field, "like", "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%")
        .ignoreCase()
const anyOf = conditions => (conditions.length === 1 ? conditions[0] : factory().makeCondition(conditions, "or"))
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const facilityName = facility => (facility ? facility.facilityName || facility.facilityId : "")
const nowMs = () => ms(ec.user.nowTimestamp)
const notEnded = () =>
    anyOf([
        factory().makeCondition("thruDate", "is-null", null),
        factory().makeCondition("thruDate", "greater", ec.user.nowTimestamp)
    ])
const isStock = asset => !asset.assetTypeEnumId || stockAssetTypes.includes(asset.assetTypeEnumId)
const hasLeft = asset => leftStatuses.includes(asset.statusId) || asset.actualEndOfLife != null

function facilityState(facility) {
    if (facility.closedDate && ms(facility.closedDate) <= nowMs())
        return {stateText: "Closed " + dateText(facility.closedDate), stateColor: "grey-8"}
    if (facility.openedDate && ms(facility.openedDate) > nowMs())
        return {stateText: "Opens " + dateText(facility.openedDate), stateColor: "info"}
    return {stateText: "Open", stateColor: "positive"}
}
// The facilities of the user's organizations at or under a plant (the plant, and its children), or every one of theirs.
function facilityIdsOf(userScope, plantId) {
    let query = manufacturing.facilityFind(userScope).selectField("facilityId")
    if (plantId)
        query = query.condition(
            anyOf([
                factory().makeCondition("facilityId", "equals", plantId),
                factory().makeCondition("parentFacilityId", "equals", plantId)
            ])
        )
    return Array.from(query.list()).map(row => row.facilityId)
}
// A current production assignment of an asset (WorkEffortAssetAssign) with its operation and run.
function assignmentsOf(assetId, limit = 20) {
    return Array.from(
        find("mantle.work.effort.WorkEffortAssetAssign")
            .condition("assetId", assetId)
            .condition("statusId", "not-in", ["WeaaRequestDenied", "WeaaDeparted"])
            .condition(notEnded())
            .orderBy("fromDate")
            .limit(limit)
            .list()
    ).map(row => {
        const work = one("mantle.work.effort.WorkEffort", {workEffortId: row.workEffortId})
        const runId = work?.rootWorkEffortId || work?.parentWorkEffortId
        const run = runId && runId !== row.workEffortId ? one("mantle.work.effort.WorkEffort", {workEffortId: runId}) : null
        const isOperation = run?.purposeEnumId === "WepProductionRun"
        return {
            workEffortId: row.workEffortId,
            workText: (work?.workEffortName || row.workEffortId) + (isOperation ? " · " + (run.workEffortName || runId) : ""),
            kindText: isOperation ? "Operation" : enumText(work?.workEffortTypeEnumId) || "Work",
            fromDate: row.fromDate,
            fromText: dateText(row.fromDate),
            thruText: dateText(row.thruDate),
            statusText: statusText(row.statusId),
            current: ms(row.fromDate) <= nowMs(),
            url: isOperation ? manufacturing.recordUrl("operation", row.workEffortId) : null
        }
    })
}
function nextServiceOf(assetId) {
    return Array.from(
        find("mantle.product.maintenance.AssetMaintenance")
            .condition("assetId", assetId)
            .condition("statusId", "not-in", closedMaintenance)
            .condition("maintenanceDate", "greater-equals", ec.user.nowTimestamp)
            .orderBy("maintenanceDate")
            .limit(1)
            .list()
    )[0]
}
// In maintenance: an AssetMaintenance in process, not a planned one or a request not yet started (impl-maintenance §4, F13; an
// owner contract with Maintenance, as Mantle's store#ProductionEquipment guard reads it); an outage is out of service above.
function openMaintenanceCount(assetId) {
    return find("mantle.product.maintenance.AssetMaintenance")
        .condition("assetId", assetId)
        .condition("statusId", "AsMntInProcess")
        .count()
}
// An asset's availability for production: left, out of service (an open outage, P11), assigned to work now, in maintenance
// now, or its status.
const outOfService = assetId =>
    find("mantle.work.effort.ResourceUnavailability")
        .condition("assetId", assetId)
        .condition("unavailabilityKindEnumId", "RukActual")
        .condition("thruDate", "is-null", null)
        // a corrected row is history (impl-maintenance P5)
        .condition("supersededByUnavailabilityId", "is-null", null)
        .count() > 0
function availabilityOf(asset, assignments) {
    if (hasLeft(asset)) return {availabilityText: "Left the facility", availabilityColor: "grey-8", blocked: true}
    if (outOfService(asset.assetId)) return {availabilityText: "Out of service", availabilityColor: "negative", blocked: true}
    const now = assignments.find(row => row.current)
    if (now) return {availabilityText: "On " + now.workText, availabilityColor: "warning", blocked: false}
    if (openMaintenanceCount(asset.assetId))
        return {availabilityText: "In maintenance", availabilityColor: "negative", blocked: true}
    return {availabilityText: statusText(asset.statusId) || "Available", availabilityColor: "positive", blocked: false}
}

// ===== get#FacilityDetail =====
// FacilityDetail's header and Overview in the Manufacturing context: one of the user's facilities with its type, parent,
// owner, state, dates and contact, and the equipment there that has not left. Its identity is edited in Warehouse.
function facilityDetail(p) {
    const userScope = manufacturing.required()
    manufacturing.recordOf(userScope, "facility", p.facilityId)
    const facility = one("mantle.facility.Facility", {facilityId: p.facilityId})
    const parent = facility.parentFacilityId ? one("mantle.facility.Facility", {facilityId: facility.parentFacilityId}) : null
    const parentInScope = manufacturing.inScope(userScope, parent)
    const names = lib.partyNames([facility.ownerPartyId])
    const contact = lib.call("mantle.facility.FacilityServices.get#Facility", {facilityId: facility.facilityId})
    const equipment = Array.from(
        find("mantle.product.asset.Asset")
            .condition("facilityId", facility.facilityId)
            .condition("assetTypeEnumId", "not-in", stockAssetTypes)
            .condition(factory().makeCondition("assetTypeEnumId", "is-not-null", null))
            .orderBy("assetName")
            .orderBy("assetId")
            .limit(100)
            .list()
    ).filter(asset => !hasLeft(asset))
    const address = [contact.address1, contact.address2, contact.city, contact.postalCode].filter(v => !blank(v)).join(", ")
    const phone = [contact.countryCode, contact.areaCode, contact.contactNumber].filter(v => !blank(v)).join(" ")
    return {
        facility: Object.assign(
            {
                facilityId: facility.facilityId,
                facilityName: facilityName(facility),
                facilityTypeEnumId: facility.facilityTypeEnumId,
                typeText: enumText(facility.facilityTypeEnumId),
                parentFacilityId: parentInScope ? parent.facilityId : null,
                parentName: parentInScope ? facilityName(parent) : "",
                ownerPartyId: facility.ownerPartyId,
                ownerName: names[facility.ownerPartyId] || facility.ownerPartyId || "",
                description: facility.description || "",
                openedText: dateText(facility.openedDate),
                closedText: dateText(facility.closedDate),
                isWorkCenter: !!one("mantle.work.production.WorkCenter", {facilityId: facility.facilityId}),
                locationCount: null
            },
            facilityState(facility)
        ),
        contact: {addressText: address, phoneText: phone, emailAddress: contact.emailAddress || ""},
        equipmentList: equipment.map(asset => ({
            assetId: asset.assetId,
            assetName: asset.assetName || asset.assetId,
            typeText: enumText(asset.assetTypeEnumId),
            statusText: statusText(asset.statusId),
            locationSeqId: asset.locationSeqId || ""
        })),
        canEdit: false
    }
}

// ===== find#Equipment =====
// The equipment (assets that are not stock) at the user's facilities, under the plant or at one facility, by type and by
// id, name or serial ignoring case, a page at a time, each with its current production assignment, availability and next
// service.
function equipmentList(p) {
    const userScope = manufacturing.required()
    if (!blank(p.facilityId)) manufacturing.recordOf(userScope, "facility", p.facilityId)
    const facilityIds = blank(p.facilityId) ? facilityIdsOf(userScope, p.plantId || null) : [p.facilityId]
    const build = () => {
        let query = find("mantle.product.asset.Asset")
            .condition("facilityId", "in", facilityIds.length ? facilityIds : ["_NA_"])
            .condition("assetTypeEnumId", "not-in", stockAssetTypes)
            .condition(factory().makeCondition("assetTypeEnumId", "is-not-null", null))
            .condition("statusId", "not-in", leftStatuses)
            .orderBy("assetName")
            .orderBy("assetId")
        if (!blank(p.assetTypeEnumId)) query = query.condition("assetTypeEnumId", p.assetTypeEnumId)
        if (!blank(p.text))
            query = query.condition(anyOf([like("assetId", p.text), like("assetName", p.text), like("serialNumber", p.text)]))
        return query
    }
    const paged = lib.page(build(), p, "equipmentList", build().count())
    const facilities = new Map()
    const facilityOf = facilityId => {
        if (!facilities.has(facilityId)) facilities.set(facilityId, one("mantle.facility.Facility", {facilityId}))
        return facilities.get(facilityId)
    }
    const equipmentList = paged.rows.map(asset => {
        const facility = facilityOf(asset.facilityId)
        const assignments = assignmentsOf(asset.assetId, 5)
        const current = assignments.find(row => row.current) || null
        const next = nextServiceOf(asset.assetId)
        return Object.assign(
            {
                assetId: asset.assetId,
                assetName: asset.assetName || asset.assetId,
                serialNumber: asset.serialNumber || "",
                typeText: enumText(asset.assetTypeEnumId),
                facilityId: asset.facilityId,
                facilityName: facilityName(facility),
                isWorkCenter: !!one("mantle.work.production.WorkCenter", {facilityId: asset.facilityId}),
                assignedText: current ? current.workText : "",
                nextServiceText: next ? dateText(next.maintenanceDate) + " · " + enumText(next.maintenanceTypeEnumId) : ""
            },
            availabilityOf(asset, assignments)
        )
    })
    return Object.assign({}, paged, {rows: undefined, equipmentList})
}

// ===== get#Equipment =====
// EquipmentDetail's Manufacturing context (crosscut §3.10's Manufacturing row): equipment at one of the user's facilities,
// its identity without any cost or book value, its production assignments now and ahead, the routing operations that need
// its model (its qualifications), its maintenance history, its safe-use instructions (the asset's manuals and its product's
// special instructions) and its availability, with blocked when it has left or is in maintenance. Stock is refused like a
// missing record.
function equipment(p) {
    const userScope = manufacturing.required()
    manufacturing.recordOf(userScope, "asset", p.assetId)
    const asset = one("mantle.product.asset.Asset", {assetId: p.assetId})
    if (isStock(asset)) denied("RECORD_UNAVAILABLE", "Equipment " + p.assetId + " is not available")
    const facility = asset.facilityId ? one("mantle.facility.Facility", {facilityId: asset.facilityId}) : null
    const center = facility ? one("mantle.work.production.WorkCenter", {facilityId: facility.facilityId}) : null
    const product = asset.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
    const assignments = assignmentsOf(asset.assetId)
    // the routing operations of the user's organizations that need this equipment model
    const needs = asset.productId
        ? Array.from(
              find("mantle.work.effort.WorkEffortAssetNeeded")
                  .condition("assetProductId", asset.productId)
                  .orderBy("workEffortId")
                  .limit(50)
                  .list()
          )
              .map(row => ({row, work: one("mantle.work.effort.WorkEffort", {workEffortId: row.workEffortId})}))
              .filter(
                  ({work}) => work && work.purposeEnumId === "WepRoutingTask" && manufacturing.owns(userScope, work.ownerPartyId)
              )
              .map(({row, work}) => {
                  const routing = work.parentWorkEffortId
                      ? one("mantle.work.effort.WorkEffort", {workEffortId: work.parentWorkEffortId})
                      : null
                  return {
                      workEffortId: work.workEffortId,
                      operationText: work.workEffortName || work.workEffortId,
                      routingText: routing ? routing.workEffortName || routing.workEffortId : "",
                      quantityText: row.estimatedQuantity == null ? "" : String(row.estimatedQuantity)
                  }
              })
        : []
    const maintenance = Array.from(
        find("mantle.product.maintenance.AssetMaintenance")
            .condition("assetId", asset.assetId)
            .orderBy("-maintenanceDate")
            .limit(20)
            .list()
    ).map(row => ({
        assetMaintenanceId: row.assetMaintenanceId,
        typeText: enumText(row.maintenanceTypeEnumId),
        statusText: statusText(row.statusId),
        dateText: dateText(row.maintenanceDate),
        comments: row.comments || ""
    }))
    const manuals = Array.from(
        find("mantle.product.asset.AssetContent")
            .condition("assetId", asset.assetId)
            .condition("contentTypeEnumId", "in", ["AcntManual", "AcntCertificate"])
            .orderBy("-contentDate")
            .limit(20)
            .list()
    ).map(row => ({
        title:
            row.description ||
            String(row.contentLocation || "")
                .split("/")
                .pop() ||
            row.assetContentId,
        kindText: enumText(row.contentTypeEnumId),
        dateText: dateText(row.contentDate)
    }))
    const productInstructions = asset.productId
        ? Array.from(
              find("mantle.product.ProductContent")
                  .condition("productId", asset.productId)
                  .condition("productContentTypeEnumId", "PcntSpecialInstr")
                  .limit(10)
                  .list()
          ).map(row => ({
              title:
                  row.description ||
                  String(row.contentLocation || "")
                      .split("/")
                      .pop() ||
                  row.productContentId,
              kindText: "Model instructions",
              dateText: dateText(row.fromDate)
          }))
        : []
    const names = lib.partyNames([asset.ownerPartyId])
    const identityRows = [
        ["Product", product ? product.productName || product.productId : ""],
        ["Serial number", asset.serialNumber],
        ["Facility", facilityName(facility)],
        ["Work center", center ? "Yes" : ""],
        ["Location", asset.locationSeqId],
        ["Owner", names[asset.ownerPartyId] || asset.ownerPartyId],
        ["Asset type", enumText(asset.assetTypeEnumId)],
        ["Received", dateText(asset.receivedDate)]
    ]
        .filter(row => !blank(row[1]))
        .map(row => ({label: row[0], value: String(row[1])}))
    return Object.assign(availabilityOf(asset, assignments), {
        asset: {
            assetId: asset.assetId,
            assetName: asset.assetName || asset.assetId,
            facilityId: asset.facilityId || null,
            facilityName: facilityName(facility),
            isWorkCenter: !!center,
            locationSeqId: asset.locationSeqId || "",
            statusText: statusText(asset.statusId),
            typeText: enumText(asset.assetTypeEnumId),
            productText: product ? product.productName || product.productId : ""
        },
        identityRows,
        assignmentList: assignments,
        qualificationList: needs,
        maintenanceList: maintenance,
        instructionList: manuals.concat(productInstructions)
    })
}

// ===== get#ResourceCalendarEvents =====
// The ResourceCalendar's items from start to end (days, yyyy-MM-dd in the user's zone), as Commons Calendar.qvue takes them,
// for the work centers at the plant (the selected one, else every one of the user's, up to 50): each center's work hours
// (WetAvailable work efforts of its calendar, recurring ones expanded) and the holidays of its calendar and of the plant's
// organization (WepHoliday), and the released operations at the centers by their estimated dates. Read only: nothing is
// movable or editable here (schedule changes are ProductionSchedule's). Each part on its own: one that fails is logged and
// named in failedSources.
function calendarEvents(p) {
    const userScope = manufacturing.required()
    const dayOk = text => /^\d{4}-\d{2}-\d{2}$/.test(String(text || ""))
    if (!dayOk(p.start) || !dayOk(p.end) || String(p.end) < String(p.start)) throw new Error("The range is two days, yyyy-MM-dd")
    const pattern = "yyyy-MM-dd HH:mm:ss.SSS"
    const rangeStart = ec.l10n.parseTimestamp(p.start + " 00:00:00.000", pattern)
    const rangeEnd = ec.l10n.parseTimestamp(p.end + " 00:00:00.000", pattern)
    const wall = millis => ec.l10n.format(new Date(Number(millis)), "yyyy-MM-dd HH:mm")
    const addDay = text => {
        const [y, m, d] = text.split("-").map(Number)
        return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().substring(0, 10)
    }
    const plantId = p.plantId || null
    // the plant is one of the user's facilities (its organization's holidays are read below)
    if (plantId) manufacturing.recordOf(userScope, "facility", plantId)
    const centerIds = manufacturing.workCenterIds()
    let centerQuery = manufacturing.facilityFind(userScope).condition("facilityId", "in", centerIds.length ? centerIds : ["_NA_"])
    if (plantId) {
        const planted = Array.from(find("mantle.work.production.WorkCenter", {plantFacilityId: plantId}).list()).map(
            row => row.facilityId
        )
        const inPlant = [factory().makeCondition("parentFacilityId", "equals", plantId)]
        if (planted.length) inPlant.push(factory().makeCondition("facilityId", "in", planted))
        centerQuery = centerQuery.condition(anyOf(inPlant))
    }
    const centers = Array.from(centerQuery.orderBy("facilityName").limit(calendarCenterLimit).list())
    const eventList = []
    const failedSources = []
    const attempt = (name, action) => {
        try {
            action()
        } catch (error) {
            failedSources.push(name)
            ec.logger.error("Resource calendar " + name + " for " + ec.user.username + " not read: " + error.message)
        }
    }
    const instancesOf = workEfforts => {
        if (!workEfforts.length) return []
        const out = lib.call("mantle.work.EventServices.get#EventInstances", {
            workEffortList: workEfforts.map(row => lib.map(row)),
            rangeStart,
            rangeEnd
        })
        return Array.from(out.instanceList || [])
    }
    // each center's calendar: its work hours and its holidays
    for (const center of centers)
        attempt("calendar of " + facilityName(center), () => {
            const workCenter = one("mantle.work.production.WorkCenter", {facilityId: center.facilityId})
            if (!workCenter?.calendarId) return
            const ids = rows("mantle.work.calendar.CalendarWorkEffort", {calendarId: workCenter.calendarId}).map(
                row => row.workEffortId
            )
            if (!ids.length) return
            const efforts = Array.from(find("mantle.work.effort.WorkEffort").condition("workEffortId", "in", ids).list()).filter(
                row =>
                    row.statusId !== "WeCancelled" &&
                    (row.workEffortTypeEnumId === "WetAvailable" || row.purposeEnumId === "WepHoliday")
            )
            for (const instance of instancesOf(efforts)) {
                const holiday = instance.workEffort?.purposeEnumId === "WepHoliday"
                const allDay = !!instance.allDay
                eventList.push({
                    kind: holiday ? "holiday" : "workHours",
                    key:
                        (holiday ? "holiday|" : "hours|") +
                        center.facilityId +
                        "|" +
                        instance.workEffortId +
                        "|" +
                        instance.start,
                    workEffortId: instance.workEffortId,
                    title:
                        (instance.workEffort?.workEffortName || (holiday ? "Holiday" : "Work hours")) +
                        " · " +
                        facilityName(center),
                    start: allDay ? instance.startDay : wall(instance.start),
                    end: allDay ? instance.endDay : instance.end == null ? null : wall(instance.end),
                    allDay,
                    canEdit: false
                })
            }
        })
    // the holidays of the plant's organization (or the user's organizations)
    attempt("holidays", () => {
        const plant = plantId ? one("mantle.facility.Facility", {facilityId: plantId}) : null
        const owners = plant ? [plant.ownerPartyId] : Array.from(new Set(centers.map(center => center.ownerPartyId)))
        if (!owners.length) return
        const holidays = Array.from(
            find("mantle.work.effort.WorkEffort")
                .condition("purposeEnumId", "WepHoliday")
                .condition("ownerPartyId", "in", owners)
                .condition("allDayStart", "greater-equals", p.start)
                .condition("allDayStart", "less", p.end)
                .list()
        )
        for (const holiday of holidays) {
            const day = lib.calendarDateText(holiday.allDayStart)
            eventList.push({
                kind: "holiday",
                key: "holiday|" + holiday.workEffortId,
                workEffortId: holiday.workEffortId,
                title: holiday.workEffortName || "Holiday",
                start: day,
                end: addDay(day),
                allDay: true,
                canEdit: false
            })
        }
    })
    // the released operations at the centers by their estimated dates
    attempt("operations", () => {
        if (!centers.length) return
        const operations = Array.from(
            find("mantle.work.effort.WorkEffort")
                .condition(
                    "workCenterFacilityId",
                    "in",
                    centers.map(center => center.facilityId)
                )
                .condition("workEffortTypeEnumId", "WetTask")
                .condition("statusId", "in", openOperationStatuses)
                .condition("estimatedStartDate", "less", rangeEnd)
                .condition("estimatedCompletionDate", "greater", rangeStart)
                .orderBy("estimatedStartDate")
                .limit(500)
                .list()
        )
        const names = new Map(centers.map(center => [center.facilityId, facilityName(center)]))
        for (const operation of operations) {
            const runId = operation.rootWorkEffortId || operation.parentWorkEffortId
            const run = runId ? one("mantle.work.effort.WorkEffort", {workEffortId: runId}) : null
            if (!run || run.purposeEnumId !== "WepProductionRun" || run.productionReleaseDate == null) continue
            if (!manufacturing.owns(userScope, run.ownerPartyId)) continue
            eventList.push({
                kind: "operation",
                key: "operation|" + operation.workEffortId,
                workEffortId: operation.workEffortId,
                title: [
                    operation.workEffortName || operation.workEffortId,
                    run.workEffortName || runId,
                    names.get(operation.workCenterFacilityId)
                ]
                    .filter(Boolean)
                    .join(" · "),
                start: wall(ms(operation.estimatedStartDate)),
                end: wall(ms(operation.estimatedCompletionDate)),
                allDay: false,
                canEdit: false,
                url: manufacturing.recordUrl("operation", operation.workEffortId)
            })
        }
    })
    return {eventList, failedSources, centerCount: centers.length}
}

const operations = {facilityDetail, equipmentList, equipment, calendarEvents}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Manufacturing work center operation " + op)
        return operations[op](parameters)
    }
})
