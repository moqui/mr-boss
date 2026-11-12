// The Maintenance contexts of the shared equipment and facility records (impl-maintenance P2; design-maintenance §6 "Shared master
// records", crosscut §3.10): EquipmentDetail's (get#Equipment: its identity with the supplier warranty, hierarchy, assignments,
// meters, registrations, the old maintenance records' files, and the Book only for a user Accounting's get#AssetBook admits),
// Employee360's AssignedEquipment under Maintenance (get#AssignedEquipment: the person's current holdings of the equipment the
// user's maintenance scope reads, not People's answer, which is the person's and HR's) and FacilityDetail's (get#FacilityDetail:
// its header, overview, children, rooms and features, equipment and certifications). Each checks the record through
// ironstone.maintenance.AccessServices.check#Record (the Maintenance root and Mantle's scope) before it reads; nothing here grants
// what Mantle's MaintenanceAccess refuses, and no cost or book value is read but the Book an Accounting reader is given.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenanceAccess = ec.resource.script("component://mr-mantle/service/mantle/work/MaintenanceAccess.js")
const resources = ec.resource.script("component://mr-mantle/service/mantle/product/MaintenanceResources.js")
const {find, one, call, ms} = lib

const ASSET = "mantle.product.asset.Asset"
const FACILITY = "mantle.facility.Facility"
const historyLimit = 20

const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const roleText = roleTypeId => (roleTypeId ? one("mantle.party.RoleType", {roleTypeId})?.description || roleTypeId : "")
const dateText = lib.dateText
const dayText = value => (value == null || value === "" ? "" : lib.calendarDateText(value))
const factRows = pairs =>
    pairs.filter(([, value]) => value != null && value !== "").map(([label, value]) => ({label, value: String(value)}))

// Whether the user's maintenance scope reads a related record (a parent, a facility, a part, a holding), once the record the
// screen opened was checked through check#Record (the root grant); Mantle's checks, refusing a missing one as one outside.
function readable(recordType, recordId, userScope = maintenanceAccess.scope()) {
    if (!recordId) return false
    return lib.check(() =>
        recordType === "facility" ? maintenanceAccess.requireFacility(userScope, recordId) : maintenanceAccess.requireAsset(userScope, recordId)
    ).allowed
}

// ===== get#Equipment =====
function equipment(p) {
    call("ironstone.maintenance.AccessServices.check#Record", {recordType: "asset", recordId: p.assetId, appRoot: "Maintenance"})
    const userScope = maintenanceAccess.scope()
    const caps = userScope.capabilities
    const asset = one(ASSET, {assetId: p.assetId})
    const names = lib.partyNames([asset.ownerPartyId, asset.warrantyPartyId])
    const product = asset.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
    const facilityShown = readable("facility", asset.facilityId, userScope)
    const facility = facilityShown ? one(FACILITY, {facilityId: asset.facilityId}) : null
    const zone = facilityShown ? resources.facilityTimeZone(asset.facilityId) : null
    const parentShown = readable("asset", asset.parentAssetId, userScope)
    const parent = parentShown ? one(ASSET, {assetId: asset.parentAssetId}) : null
    const organizationPartyId = maintenanceAccess.assetOrganization(asset.assetId)
    const warrantyThru = dayText(asset.warrantyThruDate)
    const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    const warrantyExpired = !!warrantyThru && warrantyThru < day
    const left = ["AstDelivered", "AstDeactivated"].includes(asset.statusId)
    return {
        asset: {
            assetId: asset.assetId,
            assetName: asset.assetName || asset.assetId,
            assetTypeEnumId: asset.assetTypeEnumId,
            typeText: enumText(asset.assetTypeEnumId),
            classEnumId: asset.classEnumId || null,
            classText: enumText(asset.classEnumId),
            productId: asset.productId || null,
            productName: product ? product.productName || product.productId : "",
            serialNumber: asset.serialNumber || "",
            softIdentifier: asset.softIdentifier || "",
            comments: asset.comments || "",
            statusText: statusText(asset.statusId),
            stateText: left ? statusText(asset.statusId) : "In service",
            stateColor: left ? "grey-8" : "positive",
            ownerName: asset.ownerPartyId ? names[asset.ownerPartyId] || asset.ownerPartyId : "",
            organizationPartyId,
            facilityId: facilityShown ? asset.facilityId : null,
            facilityName: facility ? facility.facilityName || facility.facilityId : "",
            locationSeqId: facilityShown ? asset.locationSeqId || "" : "",
            timeZoneText: zone ? zone.timeZone + (zone.inherited ? " (from its facility)" : "") : "",
            parentAssetId: parent ? parent.assetId : null,
            parentName: parent ? parent.assetName || parent.assetId : "",
            acquiredDateText: dateText(asset.acquiredDate),
            receivedDateText: dateText(asset.receivedDate),
            warrantyThruDate: warrantyThru,
            warrantyPartyId: asset.warrantyPartyId || null,
            warrantyPartyName: asset.warrantyPartyId ? names[asset.warrantyPartyId] || asset.warrantyPartyId : "",
            warrantyText: warrantyThru ? (warrantyExpired ? "Expired " : "Through ") + warrantyThru : "",
            warrantyColor: warrantyExpired ? "negative" : "positive",
            revision: String(ms(asset.lastUpdatedStamp))
        },
        canEdit: !!caps.resourceEdit,
        canMove: !!caps.resourceEdit && lib.access.has("STOCK_MOVE"),
        children: childRows(asset.assetId, userScope),
        assignments: assignmentRows(asset.assetId),
        meters: meterRows(asset),
        readings: readingRows(asset.assetId),
        registrations: registrationRows(asset.assetId),
        maintenanceFiles: maintenanceFileRows(asset.assetId),
        book: bookOf(asset.assetId)
    }
}
// the parts under it that the user reads
function childRows(assetId, userScope) {
    return Array.from(find(ASSET, {parentAssetId: assetId}).orderBy("assetName").limit(100).list())
        .filter(row => readable("asset", row.assetId, userScope))
        .map(row => ({
            assetId: row.assetId,
            assetName: row.assetName || row.assetId,
            serialNumber: row.serialNumber || "",
            statusText: statusText(row.statusId)
        }))
}
// its holders, current first, then the ended ones (the custody history)
function assignmentRows(assetId) {
    const rows = Array.from(find("mantle.product.asset.AssetPartyAssignment", {assetId}).orderBy("-fromDate").limit(historyLimit).list())
    const names = lib.partyNames(rows.map(row => row.partyId))
    const now = ms(ec.user.nowTimestamp)
    return rows
        .map(row => {
            const current = (ms(row.fromDate) ?? 0) <= now && (row.thruDate == null || ms(row.thruDate) > now)
            return {
                partyId: row.partyId,
                partyName: names[row.partyId] || row.partyId,
                roleTypeId: row.roleTypeId,
                roleText: roleText(row.roleTypeId),
                fromDateText: dateText(row.fromDate),
                thruDateText: dateText(row.thruDate),
                current,
                stateText: current ? "Current" : "Ended",
                stateColor: current ? "positive" : "grey-8"
            }
        })
        .sort((a, b) => Number(b.current) - Number(a.current))
}
// the model's meters, each with its latest reading
function meterRows(asset) {
    const models = asset.productId
        ? Array.from(find("mantle.product.maintenance.ProductMeter", {productId: asset.productId}).list())
        : []
    return models.map(meter => {
        const latest = find("mantle.product.maintenance.AssetMeter", {assetId: asset.assetId, productMeterId: meter.productMeterId})
            .orderBy("-readingDate")
            .limit(1)
            .one()
        return {
            productMeterId: meter.productMeterId,
            meterName:
                meter.meterName ||
                one("mantle.product.maintenance.ProductMeterType", {productMeterTypeId: meter.productMeterTypeId})?.description ||
                meter.productMeterId,
            unitText: meter.meterUomId ? one("moqui.basic.Uom", {uomId: meter.meterUomId})?.abbreviation || meter.meterUomId : "",
            cumulativeText: meter.isCumulative === "Y" ? "Counts up" : "",
            latestValue: latest?.meterValue != null ? String(latest.meterValue) : "",
            latestDateText: latest ? dateText(latest.readingDate) : ""
        }
    })
}
// the recent readings, the newest first
function readingRows(assetId) {
    return Array.from(find("mantle.product.maintenance.AssetMeter", {assetId}).orderBy("-readingDate").limit(historyLimit).list()).map(
        row => ({
            readingDate: row.readingDate,
            readingDateText: dateText(row.readingDate),
            meterText:
                (row.productMeterId ? one("mantle.product.maintenance.ProductMeter", {productMeterId: row.productMeterId})?.meterName : "") ||
                one("mantle.product.maintenance.ProductMeterType", {productMeterTypeId: row.productMeterTypeId})?.description ||
                "",
            meterValue: row.meterValue != null ? String(row.meterValue) : "",
            reasonText: enumText(row.readingReasonEnumId)
        })
    )
}
function registrationRows(assetId) {
    const rows = Array.from(find("mantle.product.maintenance.AssetRegistration", {assetId}).orderBy("-fromDate").list())
    const names = lib.partyNames(rows.map(row => row.govAgencyPartyId))
    return rows.map(row => ({
        assetRegSeqId: row.assetRegSeqId,
        registrationNumber: row.registrationNumber || "",
        licenseNumber: row.licenseNumber || "",
        agencyName: row.govAgencyPartyId ? names[row.govAgencyPartyId] || row.govAgencyPartyId : "",
        fromDateText: dateText(row.fromDate),
        thruDateText: dateText(row.thruDate)
    }))
}
// the files of its old maintenance records (AssetMaintenanceContent), listed where they are kept, never copied
function maintenanceFileRows(assetId) {
    const records = Array.from(find("mantle.product.maintenance.AssetMaintenance", {assetId}).selectField(["assetMaintenanceId"]).limit(200).list()).map(
        row => row.assetMaintenanceId
    )
    if (!records.length) return []
    return Array.from(
        find("mantle.product.maintenance.AssetMaintenanceContent").condition("assetMaintenanceId", "in", records).orderBy("-contentDate").limit(historyLimit).list()
    ).map(row => ({
        assetMaintenanceId: row.assetMaintenanceId,
        fileName: String(row.contentLocation || "").split("/").pop() || row.assetMaintenanceContentId,
        contentDateText: dateText(row.contentDate),
        description: row.description || ""
    }))
}
// the Book, read by Accounting's get#AssetBook as the user: null for a user it does not admit (no Accounting read in the owner
// organization) or an asset with no book; its amounts and dates only, its actions staying Accounting's
function bookOf(assetId) {
    let book
    ec.message.pushErrors()
    try {
        book = ec.service.sync().name("mantle.ledger.AssetBookServices.get#AssetBook").parameters({assetId}).requireNewTransaction(true).call()
        if (ec.message.hasError()) book = null
    } catch (error) {
        book = null
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    if (!book?.asset) return null
    const asset = book.asset
    return {
        stateText: asset.stateText,
        rows: factRows([
            ["Class", asset.classText],
            ["In service", asset.acquiredDateText],
            ["Method", asset.methodText],
            ["Useful life ends", asset.expectedEndOfLifeText],
            ["Acquire cost", asset.acquireCost != null ? ec.l10n.formatCurrency(asset.acquireCost, asset.currencyUomId) : ""],
            ["Accumulated depreciation", asset.accumulated != null ? ec.l10n.formatCurrency(asset.accumulated, asset.currencyUomId) : ""],
            ["Net book value", asset.netBook != null ? ec.l10n.formatCurrency(asset.netBook, asset.currencyUomId) : ""]
        ])
    }
}

// ===== get#AssignedEquipment =====
// The equipment a person holds now that the user's maintenance scope reads, for Employee360's AssignedEquipment under
// Maintenance (People's get#AssignedEquipment answers the person and HR only).
function assignedEquipment(p) {
    const userScope = maintenanceAccess.scope()
    if (!userScope.capabilities.resourceRead || !p.partyId) return {equipmentList: []}
    const holdings = Array.from(
        find("mantle.product.asset.AssetPartyAssignment", {partyId: p.partyId})
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .orderBy("-fromDate")
            .limit(100)
            .list()
    )
    const rows = []
    for (const holding of holdings) {
        if (!readable("asset", holding.assetId, userScope)) continue
        const asset = one(ASSET, {assetId: holding.assetId})
        const product = asset.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
        rows.push({
            assetId: asset.assetId,
            assetName: asset.assetName || asset.assetId,
            productName: product ? product.productName || product.productId : "",
            serialNumber: asset.serialNumber || "",
            roleText: roleText(holding.roleTypeId),
            fromDateText: dateText(holding.fromDate),
            returnTaskId: null
        })
    }
    return {equipmentList: rows}
}

// ===== get#FacilityDetail =====
// FacilityDetail's Maintenance context: the header (identity, organization, inherited time zone, state; Edit facility for a
// holder of FACILITY_EDIT, which store#Facility checks again), the overview's equipment, the children of the scope, the rooms
// inside it with their capacity, booking and current features, and the certifications. A parent outside the scope is not named.
function facilityDetail(p) {
    call("ironstone.maintenance.AccessServices.check#Record", {recordType: "facility", recordId: p.facilityId, appRoot: "Maintenance"})
    const userScope = maintenanceAccess.scope()
    const facility = one(FACILITY, {facilityId: p.facilityId})
    const listed = call("mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities", {parentFacilityId: facility.facilityId, includeClosed: true, pageSize: 100})
    const self = facilityRow(facility)
    const contact = call("mantle.facility.FacilityServices.get#Facility", {facilityId: facility.facilityId})
    const address = [contact.address1, contact.address2, contact.city, contact.postalCode].filter(Boolean).join(", ")
    const phone = [contact.countryCode, contact.areaCode, contact.contactNumber].filter(Boolean).join(" ")
    const children = Array.from(listed.facilityList || [])
    const equipment = call("mantle.product.MaintenanceResourceServices.find#MaintenanceEquipment", {facilityId: facility.facilityId, pageSize: 100})
    const features = Array.from(
        find("mantle.facility.FacilityFeature", {facilityId: facility.facilityId}).orderBy("-fromDate").list()
    ).map(row => ({
        featureEnumId: row.featureEnumId,
        featureText: enumText(row.featureEnumId),
        fromDateText: dateText(row.fromDate),
        thruDateText: dateText(row.thruDate),
        current: lib.active(row),
        comments: row.comments || ""
    }))
    const certifications = Array.from(
        find("mantle.facility.FacilityCertification", {facilityId: facility.facilityId}).orderBy("-fromDate").limit(50).list()
    ).map(row => ({
        certificationText: enumText(row.certificationTypeEnumId),
        fromDateText: dayText(row.fromDate),
        thruDateText: dayText(row.thruDate),
        certRegistrationId: row.certRegistrationId || "",
        auditScore: row.auditScore || ""
    }))
    return {
        canEdit: !!userScope.capabilities.facilityEdit,
        facility: Object.assign(self, {
            description: facility.description || "",
            openedDate: facility.openedDate,
            closedDate: facility.closedDate,
            openedText: dateText(facility.openedDate),
            closedText: dateText(facility.closedDate),
            defaultDaysToShip: facility.defaultDaysToShip,
            storedParentFacilityId: facility.parentFacilityId || null,
            storedTimeZone: facility.timeZone || null,
            capacity: facility.capacity,
            bookableFlag: facility.bookable || null,
            locationCount: null
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
        childList: children,
        roomList: children.filter(row => row.facilityTypeEnumId === "FcTpRoom" || row.bookable || row.capacity != null),
        featureList: features,
        equipmentList: Array.from(equipment.equipmentList || []),
        certificationList: certifications
    }
}
// The header's row of the facility, as Mantle's facility list gives it (its parent named only when in the scope).
function facilityRow(facility) {
    const found = call("mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities", {
        facilityId: facility.facilityId,
        includeClosed: true
    })
    const row = Array.from(found.facilityList || []).find(item => item.facilityId === facility.facilityId) || {}
    return Object.assign({}, row, {ownerName: row.organizationName || ""})
}

const operations = {equipment, assignedEquipment, facilityDetail}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance resources operation " + op)
    return operations[op](p || {})
}
;({execute: run})
