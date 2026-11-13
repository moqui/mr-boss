// Maintenance P2's "usable when" (impl-maintenance P2), as an acceptance walk through the screens' transitions with artifact
// authorization on: maint.resources registers a compressor under a room, records its hour meter, moves a room under another floor
// after the effect preview, changes a custodian from a date and prints two asset tags; a scanned tag opens EquipmentDetail for
// maint.reader; Retail's planner (maint.retail) sees none of it; Warehouse's and Manufacturing's EquipmentDetail are unchanged
// (their contexts, no Maintenance tab). The rules are MaintenanceAccess's, MaintenanceEquipment's and Mantle's
// MaintenanceResources.
// Run: ./moq accept mr-boss --spec MaintenanceEquipmentWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const state = {}

// A transition of a Maintenance screen posted as the user: its status, its errors and where it sent the user.
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {
            status: result.status,
            errors,
            location: String(result.header("Location") || ""),
            output: String(result.output || "")
        }
    })
}
// A Mantle read as the user under the root's inheritable grant (the artifact check aside; the service's own scope decides).
function read(user, service, parameters) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
}

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the room moved back under its floor; the walk's compressor and its readings stay as walk records of the run
        system(() => call("update#mantle.facility.Facility", {facilityId: ids.meetingRoomId, parentFacilityId: ids.floorId}))
    }
})

feature("the resource administrator registers a compressor in a room and records its hour meter", {
    when() {
        const registered = post(users.resources, "Equipment/Find/storeEquipment", {
            assetName: "Walk compressor C-9",
            productId: ids.modelId,
            assetTypeEnumId: "AstTpEquipment",
            serialNumber: "AC200-WALK-9",
            ownerPartyId: ids.organizationId,
            facilityId: ids.mechanicalRoomId,
            warrantyThruDate: "2027-12-31"
        })
        const created = system(() => ec.entity.find("mantle.product.asset.Asset").condition("serialNumber", "AC200-WALK-9").one())
        state.assetId = created?.assetId
        const meter = post(users.resources, "Equipment/EquipmentDetail/Meters/recordMeter", {
            assetId: state.assetId,
            meterChoice: "BOSS_MNT_COMP_HOURS",
            meterValue: "12",
            readingReasonEnumId: "AmrReading"
        })
        const lower = post(users.resources, "Equipment/EquipmentDetail/Meters/recordMeter", {
            assetId: state.assetId,
            meterChoice: "BOSS_MNT_COMP_HOURS",
            meterValue: "3",
            readingReasonEnumId: "AmrReading"
        })
        const meters = asUser(users.resources, () =>
            page("Equipment/EquipmentDetail/Meters", {assetId: state.assetId, lastStandalone: "true"})
        )
        return {registered, created, meter, lower, meters}
    },
    then({registered, created, meter, lower, meters}) {
        registered.errors.length == 0
        created != null && created.facilityId == ids.mechanicalRoomId && created.ownerPartyId == ids.organizationId
        meter.errors.length == 0
        lower.errors.join(" ").includes("READING_DECREASING")
        opened(meters) && meters.output.includes("Run hours") && meters.output.includes("12")
    }
})

feature("the resource administrator moves a room under the other floor after seeing what the move changes", {
    when() {
        const preview = read(users.resources, "mantle.product.MaintenanceResourceServices.preview#MaintenanceFacilityChange", {
            facilityId: ids.meetingRoomId,
            parentFacilityId: ids.otherFloorId
        }).effect
        // the record with the move asked for: its effect, and Move it
        const shown = asUser(users.resources, () =>
            page("Facilities/FacilityDetail", {facilityId: ids.meetingRoomId, moveToParentId: ids.otherFloorId})
        )
        const moved = post(users.resources, "Facilities/FacilityDetail/updateFacility", {
            facilityId: ids.meetingRoomId,
            parentFacilityId: ids.otherFloorId,
            originalParentFacilityId: ids.floorId
        })
        const room = system(() => ec.entity.find("mantle.facility.Facility").condition("facilityId", ids.meetingRoomId).one())
        const cycle = asUser(users.resources, () => {
            ec.artifactExecution.disableAuthz()
            return lib.refusal("mantle.product.MaintenanceResourceServices.preview#MaintenanceFacilityChange", {
                facilityId: ids.buildingId,
                parentFacilityId: ids.floorId
            })
        })
        return {preview, shown, moved, room, cycle}
    },
    then({preview, shown, moved, room, cycle}) {
        opened(shown) && shown.output.includes("Bookings to come") && shown.output.includes("Move it")
        preview.timeZoneBefore == "America/Chicago" && preview.timeZoneAfter == "America/Chicago"
        !preview.organizationChanges
        preview.insideCount == 0
        moved.errors.length == 0
        room.parentFacilityId == ids.otherFloorId
        cycle.includes("PARENT_CYCLE")
    }
})

feature("the resource administrator changes a custodian from a date, and prints two asset tags", {
    when() {
        const later = post(users.resources, "Equipment/EquipmentDetail/Assignments/changeCustody", {
            assetId: state.assetId,
            roleTypeId: "Custodian",
            newPartyId: "BOSS_PPL_SOFIA",
            effectiveDate: "2099-01-01 08:00"
        })
        const changed = post(users.resources, "Equipment/EquipmentDetail/Assignments/changeCustody", {
            assetId: state.assetId,
            roleTypeId: "Custodian",
            newPartyId: "BOSS_PPL_SOFIA",
            effectiveDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd") + " 00:00"
        })
        const holders = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.product.asset.AssetPartyAssignment")
                    .condition({assetId: state.assetId, roleTypeId: "Custodian"})
                    .list()
            )
        )
        const tags = asUser(users.resources, () =>
            page(
                "Equipment/AssetTags",
                {assetIds: [state.assetId, ids.compressorId].join(","), lastStandalone: "true"},
                "html-print"
            )
        )
        const svgCount = (tags.output.match(/<svg/g) || []).length
        return {later, changed, holders, tags, svgCount}
    },
    then({later, changed, holders, tags, svgCount}) {
        later.errors.join(" ").includes("DATE_FUTURE")
        changed.errors.length == 0
        holders.some(row => row.partyId == "BOSS_PPL_SOFIA" && row.thruDate == null)
        opened(tags)
        tags.output.includes("Walk compressor C-9") && tags.output.includes("Compressor C-1")
        svgCount == 2
    }
})

feature("a scanned tag opens EquipmentDetail for a reader; Retail's planner sees none of it", {
    when() {
        const link = "/qapps/Maintenance/Equipment/EquipmentDetail?assetId=" + state.assetId
        const scanned = asUser(users.reader, () =>
            invoke("ironstone.maintenance.AccessServices.resolve#EquipmentScan", {scanText: link})
        )
        // posted under the web root, as the browser posts it: the transition answers Maintenance's shared link (//Maintenance/...),
        // which names the app from the apps root
        const opensDetail = asUser(users.reader, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .render("apps/Maintenance/Equipment/Find/openScanned", {assetId: state.assetId}, "post")
            const errors = Array.from(result.errorMessages || [])
            ec.message.clearErrors()
            return {errors, location: String(result.header("Location") || "")}
        })
        // with EquipmentDetail's header (page's two last levels), which names the equipment
        const detail = asUser(users.reader, () => page("Equipment/EquipmentDetail/Identity", {assetId: state.assetId}))
        const retailScan = asUser(users.retailPlanner, () =>
            invoke("ironstone.maintenance.AccessServices.resolve#EquipmentScan", {scanText: link})
        )
        const retailList = asUser(users.retailPlanner, () => page("Equipment/Find", {text: "compressor"}))
        const retailFacilities = read(
            users.retailPlanner,
            "mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities",
            {
                text: "Room"
            }
        )
        const retailDetail = asUser(users.retailPlanner, () => page("Equipment/EquipmentDetail", {assetId: state.assetId}))
        return {scanned, opensDetail, detail, retailScan, retailList, retailFacilities, retailDetail}
    },
    then({scanned, opensDetail, detail, retailScan, retailList, retailFacilities, retailDetail}) {
        scanned.matches.length == 1 && scanned.matches[0].id == state.assetId
        opensDetail.errors.length == 0 && opensDetail.location.includes("EquipmentDetail")
        opened(detail) && detail.output.includes("Walk compressor C-9") && !detail.output.includes("Edit equipment")
        retailScan.matches.length == 0
        opened(retailList) && !retailList.output.includes("Compressor C-1") && !retailList.output.includes("Walk compressor")
        !retailFacilities.facilityList.some(row => String(row.facilityId).startsWith("BOSS_MNT_"))
        retailDetail.output.includes("This equipment is not available in this app.")
    }
})

feature("Warehouse's and Manufacturing's EquipmentDetail keep their contexts and show no Maintenance tab", {
    when() {
        const warehouse = asUser("john.doe", () =>
            page("Locations/EquipmentDetail", {assetId: ids.otherAssetId}, "html", "Warehouse")
        )
        const manufacturing = asUser("john.doe", () =>
            page("WorkCenters/EquipmentDetail", {assetId: ids.otherAssetId}, "html", "Manufacturing")
        )
        return {warehouse, manufacturing}
    },
    then({warehouse, manufacturing}) {
        opened(warehouse) && warehouse.output.includes("Forklift 2")
        !warehouse.output.includes("EquipmentTabs") && !warehouse.output.includes("Record a reading")
        opened(manufacturing)
        !manufacturing.output.includes("EquipmentTabs")
    }
})
