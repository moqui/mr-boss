// The Warehouse reads of facilities, locations and equipment (impl-warehouse P2; design-warehouse §12): the Facilities
// list and tree, FacilityDetail's header and tabs, the Warehouse context of EquipmentDetail and the choices of their
// forms. Each read checks the user's facility scope through Warehouse.js first; the writes are Mantle's
// mantle.facility.FacilityServices and store#ProductFacilityPolicy, which check FACILITY_EDIT or the planning
// permissions again. Restricted values (an asset's book) are read only for a user with financial read.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, ms, dateText} = lib
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
// the organizations Mantle's facility and stock guards let the user change (FACILITY_ALL_ORGANIZATIONS for every one)
const facilityScope = ec.resource.script("component://mr-mantle/service/mantle/facility/FacilityScope.js")

const choiceLimit = 30
const stockAssetTypes = ["AstTpInventory", "AstTpSupplies"]
const leftStatuses = ["AstDelivered", "AstDeactivated"]
const capacityUomTypes = ["UT_VOLUME_DRY_MEAS", "UT_VOLUME_LIQ_MEAS", "UT_WEIGHT_MEASURE", "UT_AREA_MEASURE", "UT_OTHER_MEASURE"]
const scheduleDays = 14

const factory = () => ec.entity.conditionFactory
const blank = value => value == null || String(value).trim() === ""
// a LIKE pattern of the text matched literally, ignoring case
const like = (field, text) =>
    factory()
        .makeCondition(field, "like", "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%")
        .ignoreCase()
const anyOf = conditions => (conditions.length === 1 ? conditions[0] : factory().makeCondition(conditions, "or"))
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const facilityName = facility => (facility ? facility.facilityName || facility.facilityId : "")
const now = () => ms(ec.user.nowTimestamp)
const isClosed = location => location.thruDate != null && ms(location.thruDate) <= now()
const isStock = asset => !asset.assetTypeEnumId || stockAssetTypes.includes(asset.assetTypeEnumId)
const hasLeft = asset => leftStatuses.includes(asset.statusId) || asset.actualEndOfLife != null

function facilityState(facility) {
    if (facility.closedDate && ms(facility.closedDate) <= now())
        return {stateText: "Closed " + dateText(facility.closedDate), stateColor: "grey-8"}
    if (facility.openedDate && ms(facility.openedDate) > now())
        return {stateText: "Opens " + dateText(facility.openedDate), stateColor: "info"}
    return {stateText: "Open", stateColor: "positive"}
}
function openLocationsOf(facilityId) {
    return find("mantle.facility.FacilityLocation")
        .condition("facilityId", facilityId)
        .condition(
            anyOf([
                factory().makeCondition("thruDate", "is-null", null),
                factory().makeCondition("thruDate", "greater", ec.user.nowTimestamp)
            ])
        )
}
// The facility a FacilityDetail read was given, refused like a missing one when it is not the user's.
function facilityOf(p) {
    const userScope = warehouse.required()
    warehouse.execute("checkRecord", {recordType: "facility", recordId: p.facilityId})
    return {userScope, facility: one("mantle.facility.Facility", {facilityId: p.facilityId})}
}
// What the user may do with a facility of ownerPartyId (with none, with any facility): the capability, and an owner that
// Mantle's guards accept for them, so no action is shown that the service would refuse.
function capabilitiesOf(userScope, ownerPartyId) {
    const capabilities = userScope.capabilities
    const mantleScope = facilityScope.scope()
    const writable = ownerPartyId
        ? facilityScope.owns(mantleScope, ownerPartyId)
        : !mantleScope.organizationPartyIds || mantleScope.organizationPartyIds.length > 0
    return {
        canEdit: !!capabilities.facilityEdit && writable,
        canPlan: !!(capabilities.policyPlan || capabilities.policyManage) && writable,
        financialRead: !!capabilities.financialRead
    }
}
function facilityRow(userScope, facility, names) {
    const parent = facility.parentFacilityId ? one("mantle.facility.Facility", {facilityId: facility.parentFacilityId}) : null
    const parentInScope = warehouse.inScope(userScope, parent)
    return Object.assign(
        {
            facilityId: facility.facilityId,
            facilityName: facilityName(facility),
            facilityTypeEnumId: facility.facilityTypeEnumId,
            typeText: enumText(facility.facilityTypeEnumId),
            // a parent outside the scope is not named, and the facility is at the top of the user's tree
            parentFacilityId: parentInScope ? parent.facilityId : null,
            parentName: parentInScope ? facilityName(parent) : "",
            // the stored parent, which an edit keeps unless the user changes it
            storedParentFacilityId: facility.parentFacilityId || null,
            ownerPartyId: facility.ownerPartyId,
            ownerName: names[facility.ownerPartyId] || facility.ownerPartyId || "",
            childCount: find("mantle.facility.Facility").condition("parentFacilityId", facility.facilityId).count(),
            locationCount: openLocationsOf(facility.facilityId).count()
        },
        facilityState(facility)
    )
}

// get#Facilities: the user's facilities, searched by id or name and filtered by type and parent, a page at a time.
function facilities(p) {
    const userScope = warehouse.required()
    // a find is used once: one for the count and one for the page
    const build = () => {
        let query = find("mantle.facility.Facility").orderBy("facilityName").orderBy("facilityId")
        if (userScope.facilityOwnerIds) query = query.condition("ownerPartyId", "in", userScope.facilityOwnerIds)
        if (!blank(p.text)) query = query.condition(anyOf([like("facilityId", p.text), like("facilityName", p.text)]))
        if (!blank(p.facilityTypeEnumId)) query = query.condition("facilityTypeEnumId", p.facilityTypeEnumId)
        if (!blank(p.parentFacilityId)) query = query.condition("parentFacilityId", p.parentFacilityId)
        return query
    }
    const paged = lib.page(build(), p, "facilityList", build().count())
    const names = lib.partyNames(paged.rows.map(row => row.ownerPartyId))
    const facilityList = paged.rows.map(row => facilityRow(userScope, row, names))
    return Object.assign({}, paged, {facilityList, rows: undefined, canEdit: capabilitiesOf(userScope).canEdit})
}

// get#FacilityDetail: the header and overview of one of the user's facilities: identity, contact, children, equipment
// there and what the user may do.
function facilityDetail(p) {
    const {userScope, facility} = facilityOf(p)
    const names = lib.partyNames([facility.ownerPartyId])
    const contact = lib.call("mantle.facility.FacilityServices.get#Facility", {facilityId: facility.facilityId})
    const children = Array.from(
        find("mantle.facility.Facility")
            .condition("parentFacilityId", facility.facilityId)
            .orderBy("facilityName")
            .limit(200)
            .list()
    ).filter(child => warehouse.inScope(userScope, child))
    const childNames = lib.partyNames(children.map(child => child.ownerPartyId))
    const equipment = Array.from(
        find("mantle.product.asset.Asset")
            .condition("facilityId", facility.facilityId)
            .condition("assetTypeEnumId", "not-in", stockAssetTypes)
            .condition(factory().makeCondition("assetTypeEnumId", "is-not-null", null))
            .orderBy("assetName")
            .orderBy("assetId")
            .limit(100)
            .list()
    )
        .filter(asset => !hasLeft(asset))
        .map(asset => ({
            assetId: asset.assetId,
            assetName: asset.assetName || asset.assetId,
            typeText: enumText(asset.assetTypeEnumId),
            statusText: statusText(asset.statusId),
            locationSeqId: asset.locationSeqId || ""
        }))
    const row = facilityRow(userScope, facility, names)
    const address = [contact.address1, contact.address2, contact.city, contact.postalCode].filter(v => !blank(v)).join(", ")
    const phone = [contact.countryCode, contact.areaCode, contact.contactNumber].filter(v => !blank(v)).join(" ")
    return Object.assign({}, capabilitiesOf(userScope, facility.ownerPartyId), {
        facility: Object.assign(row, {
            description: facility.description || "",
            openedDate: facility.openedDate,
            closedDate: facility.closedDate,
            openedText: dateText(facility.openedDate),
            closedText: dateText(facility.closedDate),
            defaultDaysToShip: facility.defaultDaysToShip,
            closedLocationCount:
                find("mantle.facility.FacilityLocation").condition("facilityId", facility.facilityId).count() - row.locationCount
        }),
        contact: {
            address1: contact.address1 || "",
            address2: contact.address2 || "",
            city: contact.city || "",
            postalCode: contact.postalCode || "",
            countryGeoId: contact.countryGeoId || "",
            stateProvinceGeoId: contact.stateProvinceGeoId || "",
            countryCode: contact.countryCode || "",
            areaCode: contact.areaCode || "",
            contactNumber: contact.contactNumber || "",
            emailAddress: contact.emailAddress || "",
            addressText: address,
            phoneText: phone
        },
        childList: children.map(child => facilityRow(userScope, child, childNames)),
        equipmentList: equipment
    })
}

// get#FacilityLocations: the facility's locations (open ones, or every one with includeClosed), searched by id or
// description and filtered by type, in pick order a page at a time, with each location type's asset status.
function facilityLocations(p) {
    const {userScope, facility} = facilityOf(p)
    const includeClosed = p.includeClosed === true || p.includeClosed === "true" || p.includeClosed === "Y"
    const build = () => {
        let query = (
            includeClosed
                ? find("mantle.facility.FacilityLocation").condition("facilityId", facility.facilityId)
                : openLocationsOf(facility.facilityId)
        )
            .orderBy("sequenceNum")
            .orderBy("areaId")
            .orderBy("aisleId")
            .orderBy("sectionId")
            .orderBy("levelId")
            .orderBy("positionId")
            .orderBy("locationSeqId")
        if (!blank(p.text)) query = query.condition(anyOf([like("locationSeqId", p.text), like("description", p.text)]))
        if (!blank(p.locationTypeEnumId)) query = query.condition("locationTypeEnumId", p.locationTypeEnumId)
        return query
    }
    const paged = lib.page(build(), p, "locationList", build().count())
    const locationList = paged.rows.map(location => {
        const closed = isClosed(location)
        const place = [
            ["Area", location.areaId],
            ["Aisle", location.aisleId],
            ["Section", location.sectionId],
            ["Level", location.levelId],
            ["Position", location.positionId]
        ]
            .filter(part => !blank(part[1]))
            .map(part => part[0] + " " + part[1])
            .join(" · ")
        return {
            facilityId: facility.facilityId,
            locationSeqId: location.locationSeqId,
            description: location.description || "",
            locationTypeEnumId: location.locationTypeEnumId,
            typeText: [enumText(location.locationTypeEnumId), enumText(location.storageTypeEnumId)].filter(Boolean).join(" · "),
            storageTypeEnumId: location.storageTypeEnumId || null,
            areaId: location.areaId,
            aisleId: location.aisleId,
            sectionId: location.sectionId,
            levelId: location.levelId,
            positionId: location.positionId,
            placeText: place,
            capacity: location.capacity,
            capacityUomId: location.capacityUomId,
            capacityText:
                location.capacity == null
                    ? ""
                    : String(location.capacity) +
                      (location.capacityUomId
                          ? " " +
                            (one("moqui.basic.Uom", {uomId: location.capacityUomId})?.abbreviation || location.capacityUomId)
                          : ""),
            sequenceNum: location.sequenceNum,
            closed,
            stateText: closed ? "Closed " + dateText(location.thruDate) : "Open",
            stateColor: closed ? "grey-8" : "positive"
        }
    })
    const types = rows("moqui.basic.Enumeration", {enumTypeId: "FacilityLocationType"}).sort(
        (a, b) => (a.sequenceNum ?? 0) - (b.sequenceNum ?? 0) || String(a.description).localeCompare(String(b.description))
    )
    const statuses = Object.fromEntries(
        rows("mantle.facility.FacilityLocationType", {facilityId: facility.facilityId}).map(row => [
            row.locationTypeEnumId,
            row.autoStatusId
        ])
    )
    const locationTypeList = types.map(type => ({
        facilityId: facility.facilityId,
        locationTypeEnumId: type.enumId,
        typeText: type.description || type.enumId,
        autoStatusId: statuses[type.enumId] || null,
        autoStatusText: statuses[type.enumId] ? statusText(statuses[type.enumId]) : "Unchanged",
        locationCount: openLocationsOf(facility.facilityId).condition("locationTypeEnumId", type.enumId).count()
    }))
    return Object.assign({}, paged, capabilitiesOf(userScope, facility.ownerPartyId), {
        locationList,
        locationTypeList,
        rows: undefined
    })
}

// get#FacilityProducts: the facility's product policies (ProductFacility, a page at a time, searched by product id or
// name) and the product location policies (ProductFacilityLocation).
function facilityProducts(p) {
    const {userScope, facility} = facilityOf(p)
    const matchedIds = blank(p.text)
        ? null
        : Array.from(
              find("mantle.product.Product")
                  .condition(anyOf([like("productId", p.text), like("pseudoId", p.text), like("productName", p.text)]))
                  .selectField("productId")
                  .limit(500)
                  .list()
          ).map(row => row.productId)
    const build = () => {
        const query = find("mantle.facility.ProductFacility").condition("facilityId", facility.facilityId).orderBy("productId")
        return matchedIds ? query.condition("productId", "in", matchedIds.length ? matchedIds : ["_NA_"]) : query
    }
    const paged = lib.page(build(), p, "productList", build().count())
    const locationRows = Array.from(
        find("mantle.facility.ProductFacilityLocation")
            .condition("facilityId", facility.facilityId)
            .orderBy("productId")
            .orderBy("locationSeqId")
            .limit(200)
            .list()
    )
    const productIds = [...new Set(paged.rows.map(row => row.productId).concat(locationRows.map(row => row.productId)))]
    const products = Object.fromEntries(
        (productIds.length ? Array.from(find("mantle.product.Product").condition("productId", "in", productIds).list()) : []).map(
            product => [product.productId, product]
        )
    )
    const productText = productId => {
        const product = products[productId]
        return product ? (product.productName || productId) + (product.pseudoId ? " (" + product.pseudoId + ")" : "") : productId
    }
    const productList = paged.rows.map(row => ({
        facilityId: facility.facilityId,
        productId: row.productId,
        productText: productText(row.productId),
        minimumStock: row.minimumStock,
        maximumStock: row.maximumStock,
        reorderQuantity: row.reorderQuantity,
        daysToShip: row.daysToShip,
        reorderMethodEnumId: row.reorderMethodEnumId,
        reorderMethodText: enumText(row.reorderMethodEnumId),
        abcClassEnumId: row.abcClassEnumId,
        abcClassText: enumText(row.abcClassEnumId),
        lastUpdatedStamp: row.lastUpdatedStamp
    }))
    const locationPolicyList = locationRows.map(row => ({
        facilityId: facility.facilityId,
        productId: row.productId,
        productText: productText(row.productId),
        locationSeqId: row.locationSeqId,
        minimumStock: row.minimumStock,
        moveQuantity: row.moveQuantity,
        lastUpdatedStamp: row.lastUpdatedStamp
    }))
    return Object.assign({}, paged, capabilitiesOf(userScope, facility.ownerPartyId), {
        productList,
        locationPolicyList,
        rows: undefined
    })
}

// The events booking a facility or an asset in the next days (Commons' calendar, get#FullCalendarData).
function bookings(parameters) {
    const start = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    const end = ec.l10n.format(new Date(now() + scheduleDays * 86400000), "yyyy-MM-dd")
    try {
        const found = lib.probe(
            "mantle.work.EventServices.get#FullCalendarData",
            Object.assign({start, end, excludeCancelled: true}, parameters)
        )
        return Array.from(found.eventList || []).map(event => ({
            workEffortId: event.workEffortId,
            title: event.title,
            whenText: event.allDay
                ? String(event.start)
                : dateText(event.startMillis) + (event.endMillis ? " to " + dateText(event.endMillis) : ""),
            statusText: statusText(event.bookingStatusId || event.statusId),
            ownerName: event.ownerName || ""
        }))
    } catch (error) {
        ec.logger.error("Warehouse bookings of " + JSON.stringify(parameters) + ": " + error.message)
        return null
    }
}
// get#FacilitySchedule: the facility's bookings in the next two weeks, on the Commons calendar.
function facilitySchedule(p) {
    const {facility} = facilityOf(p)
    const bookingList = bookings({facilityId: facility.facilityId})
    return {
        bookingList: bookingList || [],
        scheduleAvailable: bookingList != null,
        bookable: facility.bookable === "Y",
        scheduleDays
    }
}

// get#Equipment: EquipmentDetail's Warehouse context (crosscut §3.10): a piece of equipment at one of the user's
// facilities, its identity, assignments to people and to work, its availability and bookings, its maintenance summary,
// and its book for a user with financial read only. Stock is not equipment and is refused like a missing record.
function equipment(p) {
    const userScope = warehouse.required()
    warehouse.execute("checkRecord", {recordType: "asset", recordId: p.assetId})
    const asset = one("mantle.product.asset.Asset", {assetId: p.assetId})
    if (isStock(asset)) lib.denied("RECORD_UNAVAILABLE", "Equipment " + p.assetId + " is not available")
    const facility = asset.facilityId ? one("mantle.facility.Facility", {facilityId: asset.facilityId}) : null
    const product = asset.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
    const partyAssignments = Array.from(
        find("mantle.product.asset.AssetPartyAssignment")
            .condition("assetId", asset.assetId)
            .condition(
                anyOf([
                    factory().makeCondition("thruDate", "is-null", null),
                    factory().makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                ])
            )
            .orderBy("fromDate")
            .limit(50)
            .list()
    )
    const workAssignments = Array.from(
        find("mantle.work.effort.WorkEffortAssetAssign")
            .condition("assetId", asset.assetId)
            .condition("statusId", "not-in", ["WeaaRequestDenied", "WeaaDeparted"])
            .condition(
                anyOf([
                    factory().makeCondition("thruDate", "is-null", null),
                    factory().makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                ])
            )
            .orderBy("fromDate")
            .limit(50)
            .list()
    )
    const names = lib.partyNames(partyAssignments.map(row => row.partyId).concat([asset.ownerPartyId]))
    const assignmentList = partyAssignments
        .map(row => ({
            kindText: "Person",
            whoText: names[row.partyId] || row.partyId,
            roleText: one("mantle.party.RoleType", {roleTypeId: row.roleTypeId})?.description || row.roleTypeId,
            fromText: dateText(row.fromDate),
            thruText: dateText(row.thruDate),
            statusText: statusText(row.statusId)
        }))
        .concat(
            workAssignments.map(row => {
                const effort = one("mantle.work.effort.WorkEffort", {workEffortId: row.workEffortId})
                return {
                    kindText: "Work",
                    whoText: (effort?.workEffortName || row.workEffortId) + " (" + row.workEffortId + ")",
                    roleText: enumText(effort?.workEffortTypeEnumId),
                    fromText: dateText(row.fromDate),
                    thruText: dateText(row.thruDate),
                    statusText: statusText(row.statusId)
                }
            })
        )
    const current = workAssignments.find(row => ms(row.fromDate) <= now())
    const left = hasLeft(asset)
    const maintenance = Array.from(
        find("mantle.product.maintenance.AssetMaintenance")
            .condition("assetId", asset.assetId)
            .orderBy("-maintenanceDate")
            .limit(10)
            .list()
    )
    const openMaintenance = find("mantle.product.maintenance.AssetMaintenance")
        .condition("assetId", asset.assetId)
        .condition("statusId", "not-in", ["AsMntCompleted", "AsMntCancelled"])
        .count()
    // in maintenance: an AssetMaintenance in process, not a planned one (impl-maintenance §4, F13; an owner contract with Maintenance);
    // the open jobs are still counted for the summary
    const inMaintenance = find("mantle.product.maintenance.AssetMaintenance")
        .condition("assetId", asset.assetId)
        .condition("statusId", "AsMntInProcess")
        .count()
    // out of service: the one open outage in force (impl-maintenance §4, P5; an owner contract with Maintenance)
    const outOfService =
        find("mantle.work.effort.ResourceUnavailability")
            .condition("assetId", asset.assetId)
            .condition("unavailabilityKindEnumId", "RukActual")
            .condition("thruDate", "is-null", null)
            .condition("supersededByUnavailabilityId", "is-null", null)
            .count() > 0
    const reading = Array.from(
        find("mantle.product.maintenance.AssetMeter").condition("assetId", asset.assetId).orderBy("-readingDate").limit(1).list()
    )[0]
    let bookRows = []
    if (!!userScope.capabilities.financialRead) {
        // the book only for a user with financial read: Accounting's get#AssetBook checks it again
        try {
            const book = lib.probe("mantle.ledger.AssetBookServices.get#AssetBook", {assetId: asset.assetId}).asset || {}
            bookRows = [
                ["In service", book.acquiredDateText],
                ["Acquire cost", book.acquireCost == null ? null : ec.l10n.formatCurrency(book.acquireCost, book.currencyUomId)],
                ["Net book value", book.netBook == null ? null : ec.l10n.formatCurrency(book.netBook, book.currencyUomId)]
            ]
                .filter(row => row[1])
                .map(row => ({label: row[0], value: String(row[1])}))
        } catch (error) {
            ec.logger.info("Warehouse equipment book of " + asset.assetId + ": " + error.message)
        }
    }
    const identityRows = [
        ["Product", product ? product.productName || product.productId : ""],
        ["Serial number", asset.serialNumber],
        ["Facility", facilityName(facility)],
        ["Location", asset.locationSeqId],
        ["Owner", names[asset.ownerPartyId] || asset.ownerPartyId],
        ["Asset type", enumText(asset.assetTypeEnumId)],
        ["Class", enumText(asset.classEnumId)],
        ["Received", dateText(asset.receivedDate)],
        ["Last meter reading", reading ? String(reading.meterValue) + " on " + dateText(reading.readingDate) : ""]
    ]
        .filter(row => !blank(row[1]))
        .map(row => ({label: row[0], value: String(row[1])}))
    const availability = left
        ? {availabilityText: "Left the facility", availabilityColor: "grey-8"}
        : outOfService
          ? {availabilityText: "Out of service", availabilityColor: "negative"}
          : current
            ? {availabilityText: "Assigned to work " + current.workEffortId, availabilityColor: "warning"}
            : inMaintenance
              ? {availabilityText: "In maintenance", availabilityColor: "warning"}
              : {availabilityText: statusText(asset.statusId) || "Available", availabilityColor: "positive"}
    const bookingList = bookings({assetId: asset.assetId})
    return Object.assign(availability, {
        asset: {
            assetId: asset.assetId,
            assetName: asset.assetName || asset.assetId,
            facilityId: asset.facilityId,
            facilityName: facilityName(facility),
            locationSeqId: asset.locationSeqId || "",
            statusText: statusText(asset.statusId),
            typeText: enumText(asset.assetTypeEnumId),
            productText: product ? product.productName || product.productId : ""
        },
        identityRows,
        assignmentList,
        bookingList: bookingList || [],
        scheduleAvailable: bookingList != null,
        maintenanceList: maintenance.map(row => ({
            assetMaintenanceId: row.assetMaintenanceId,
            typeText: enumText(row.maintenanceTypeEnumId),
            statusText: statusText(row.statusId),
            dateText: dateText(row.maintenanceDate),
            comments: row.comments || ""
        })),
        openMaintenanceCount: openMaintenance,
        bookRows,
        financialRead: !!userScope.capabilities.financialRead
    })
}

// get#FacilityChoices: the options of the facility forms, searched by term, with the selected value's label. Refuses an
// unknown choice.
function choices(p) {
    const userScope = warehouse.required()
    const term = String(p.term || "").trim()
    const option = (value, label) => ({value, label})
    const withSelected = (options, label) => {
        if (!blank(p.selected) && !options.some(row => row.value === p.selected)) {
            const selectedLabel = label(p.selected)
            if (selectedLabel) options.push(option(p.selected, selectedLabel))
        }
        return options
    }
    const enumOptions = enumTypeId => {
        let query = find("moqui.basic.Enumeration")
            .condition("enumTypeId", enumTypeId)
            .orderBy("sequenceNum")
            .orderBy("description")
        if (term) query = query.condition(anyOf([like("description", term), like("enumId", term)]))
        return withSelected(
            Array.from(query.limit(choiceLimit).list()).map(row => option(row.enumId, row.description || row.enumId)),
            id => {
                const row = one("moqui.basic.Enumeration", {enumId: id})
                return row?.enumTypeId === enumTypeId ? row.description || id : null
            }
        )
    }
    const sources = {
        facilityTypes: () => enumOptions("FacilityType"),
        locationTypes: () => enumOptions("FacilityLocationType"),
        reorderMethods: () => enumOptions("ReorderMethod"),
        abcClasses: () => enumOptions("AbcClass"),
        storageTypes: () => enumOptions("StorageType"),
        assetStatuses: () => {
            let query = find("moqui.basic.StatusItem").condition("statusTypeId", "Asset").orderBy("sequenceNum")
            if (term) query = query.condition(like("description", term))
            return withSelected(
                Array.from(query.limit(choiceLimit).list()).map(row => option(row.statusId, row.description)),
                id => (one("moqui.basic.StatusItem", {statusId: id})?.statusTypeId === "Asset" ? statusText(id) : null)
            )
        },
        // the organizations Mantle lets the user own a facility by: their own, or every internal one
        owners: () => {
            const mantleScope = facilityScope.scope()
            const ids =
                mantleScope.organizationPartyIds ||
                Array.from(
                    find("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).selectField("partyId").limit(500).list()
                ).map(row => row.partyId)
            const names = lib.partyNames(ids)
            return withSelected(
                ids
                    .map(id => option(id, names[id] || id))
                    .filter(row => !term || row.label.toLowerCase().includes(term.toLowerCase()))
                    .slice(0, choiceLimit),
                id => (ids.includes(id) ? names[id] || id : null)
            )
        },
        parents: () => {
            let query = find("mantle.facility.Facility").orderBy("facilityName").limit(choiceLimit)
            if (userScope.facilityOwnerIds) query = query.condition("ownerPartyId", "in", userScope.facilityOwnerIds)
            if (!blank(p.facilityId)) query = query.condition("facilityId", "not-equals", p.facilityId)
            if (term) query = query.condition(anyOf([like("facilityId", term), like("facilityName", term)]))
            return withSelected(
                Array.from(query.list()).map(row => option(row.facilityId, facilityName(row))),
                id => {
                    const facility = one("mantle.facility.Facility", {facilityId: id})
                    return warehouse.inScope(userScope, facility) ? facilityName(facility) : null
                }
            )
        },
        capacityUoms: () => {
            let query = find("moqui.basic.Uom").condition("uomTypeEnumId", "in", capacityUomTypes).orderBy("description")
            if (term) query = query.condition(anyOf([like("description", term), like("abbreviation", term)]))
            return withSelected(
                Array.from(query.limit(choiceLimit).list()).map(row => option(row.uomId, row.description || row.uomId)),
                id => {
                    const uom = one("moqui.basic.Uom", {uomId: id})
                    return uom && capacityUomTypes.includes(uom.uomTypeEnumId) ? uom.description || id : null
                }
            )
        },
        // the facility's open locations: a closed one is not offered
        locations: () => {
            facilityOf(p)
            let query = openLocationsOf(p.facilityId).orderBy("sequenceNum").orderBy("locationSeqId").limit(choiceLimit)
            if (term) query = query.condition(anyOf([like("locationSeqId", term), like("description", term)]))
            const label = row => row.locationSeqId + (row.description ? " · " + row.description : "")
            return withSelected(
                Array.from(query.list()).map(row => option(row.locationSeqId, label(row))),
                id => {
                    const row = openLocationsOf(p.facilityId).condition("locationSeqId", id).one()
                    return row ? label(row) : null
                }
            )
        },
        // stock products of the user's organizations
        products: () => {
            let query = find("mantle.product.Product")
                .condition("productTypeEnumId", "in", ["PtAsset", "PtDigitalAsset", "PtAssetUse", "PtPickAssembly"])
                .orderBy("productName")
                .limit(choiceLimit)
            if (!userScope.unrestricted)
                query = query.condition("ownerPartyId", "in", userScope.organizationPartyIds.concat(["_NA_"]))
            if (term) query = query.condition(anyOf([like("productId", term), like("pseudoId", term), like("productName", term)]))
            const label = row => (row.productName || row.productId) + (row.pseudoId ? " (" + row.pseudoId + ")" : "")
            return withSelected(
                Array.from(query.list()).map(row => option(row.productId, label(row))),
                id => {
                    const row = one("mantle.product.Product", {productId: id})
                    const owned =
                        row && (userScope.unrestricted || [...userScope.organizationPartyIds, "_NA_"].includes(row.ownerPartyId))
                    return owned ? label(row) : null
                }
            )
        }
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown facility choice " + p.choice)
    return {options: sources[p.choice]()}
}

const operations = {facilities, facilityDetail, facilityLocations, facilityProducts, facilitySchedule, equipment, choices}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown facility read " + op)
        return operations[op](parameters)
    }
})
