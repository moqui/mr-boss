// Maintenance's equipment and facilities (impl-maintenance P2; design-maintenance §6): EquipmentDetail's one qvt render under
// Maintenance (the resource administrator sees the identity, supplier warranty, Edit and no book value or Book tab; a finance
// reader's context carries the Book), the Equipment list and asset tags, the facility tree's hidden ancestor (an unnamed node,
// never its name or id) with the Facilities and FacilityDetail renders, Product360's spare parts and Employee360's Maintenance row
// (the custodian's public work card and the equipment Maintenance reads). Each screen with logic of its own is rendered once, in
// qvt, with all of its checks on that render. Access rules are MaintenanceAccess's; Mantle's rules (meters, custody, the writer)
// are Mantle's MaintenanceResources. The usable-when walk is the acceptance MaintenanceEquipmentWalk.
// Run: ./moq test mr-boss --spec MaintenanceEquipment
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
// a Services facility inside Retail's warehouse, for the hidden ancestor (made here, removed after)
const leased = "MNT_EQ_SPEC_LEASED"
const financeGroup = "BOSS_ACCOUNTING_READ"
const facilities = "mantle.product.MaintenanceResourceServices.find#MaintenanceFacilities"
// the supplier warranties, set from today so the expiring filter holds whenever the spec runs (restored after)
const dayMs = 24 * 60 * 60 * 1000
const dayFromNow = days => ec.l10n.format(new Date(Number(ec.user.nowTimestamp) + days * dayMs), "yyyy-MM-dd")
const warranties = {}
// a Mantle read as the user, the artifact check aside (as under the root's inheritable grant): its own scope decides
function read(user, service, parameters) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#mantle.facility.Facility", {
                facilityId: leased,
                facilityName: "Services leased bay",
                facilityTypeEnumId: "FcTpRoom",
                ownerPartyId: ids.organizationId,
                parentFacilityId: ids.otherFacilityId
            })
            for (const [assetId, days] of [[ids.compressorId, 400], [ids.airHandlerId, 10]]) {
                warranties[assetId] = ec.entity.find("mantle.product.asset.Asset").condition("assetId", assetId).one().warrantyThruDate
                call("update#mantle.product.asset.Asset", {assetId, warrantyThruDate: dayFromNow(days)})
            }
            // the reader also reads Accounting (a finance reader) for this spec
            call("create#moqui.security.UserGroupMember", {userId: "BOSS_MNT_READER", userGroupId: financeGroup, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            ec.entity.find("mantle.facility.Facility").condition("facilityId", leased).deleteAll()
            for (const [assetId, warrantyThruDate] of Object.entries(warranties))
                call("update#mantle.product.asset.Asset", {assetId, warrantyThruDate})
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition({userId: "BOSS_MNT_READER", userGroupId: financeGroup})
                .updateAll({thruDate: ec.user.nowTimestamp})
        })
    }
})

feature("EquipmentDetail under Maintenance shows the resource administrator its identity and warranty, no book; a finance reader's carries the Book", {
    when() {
        // the record (its header and tab bar) and its Identity tab, each rendered once (a qvt render of the record loads its tab
        // on its own)
        const header = asUser(users.resources, () => page("Equipment/EquipmentDetail", {assetId: ids.compressorId}))
        const rendered = asUser(users.resources, () =>
            page("Equipment/EquipmentDetail/Identity", {assetId: ids.compressorId, lastStandalone: "true"})
        )
        const resourcesBook = asUser(users.resources, () => invoke("ironstone.maintenance.EquipmentServices.get#Equipment", {assetId: ids.compressorId}).book)
        const finance = asUser(users.reader, () => invoke("ironstone.maintenance.EquipmentServices.get#Equipment", {assetId: ids.compressorId}))
        const other = asUser(users.retailPlanner, () => page("Equipment/EquipmentDetail/Identity", {assetId: ids.compressorId}))
        return {header, rendered, resourcesBook, finance, other}
    },
    then({header, rendered, resourcesBook, finance, other}) {
        header.status == 200 && header.errors.length == 0
        header.output.includes("Compressor C-1") && header.output.includes("In service")
        header.output.includes('name="Meters"') && header.output.includes('name="Assignments"')
        !header.output.includes('name="Book"')
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("AC200-0042")
        rendered.output.includes("Supplier warranty")
        rendered.output.includes(dayFromNow(400))
        rendered.output.includes("America/Chicago")
        rendered.output.includes("Edit equipment")
        !rendered.output.includes("Net book value") && !rendered.output.includes(">Book<")
        resourcesBook == null
        finance.book != null && finance.book.rows.some(row => row.label == "Net book value")
        !finance.canEdit
        other.output.includes("This equipment is not available in this app.")
        !other.output.includes("AC200-0042")
    }
})

feature("the Equipment list finds the scope's equipment with its custodian and warranty, and asset tags carry the equipment's link", {
    when() {
        const list = asUser(users.resources, () => page("Equipment/Find", {warranty: "expiring"}))
        const all = asUser(users.planner, () => page("Equipment/Find", {text: "Compressor"}))
        const tags = asUser(users.resources, () => page("Equipment/AssetTags", {assetIds: [ids.compressorId, ids.otherAssetId].join(",")}))
        const scanned = asUser(users.reader, () =>
            invoke("ironstone.maintenance.AccessServices.resolve#EquipmentScan", {
                scanText: "https://boss.example/qapps/Maintenance/Equipment/EquipmentDetail?assetId=" + ids.compressorId
            })
        )
        return {list, all, tags, scanned}
    },
    then({list, all, tags, scanned}) {
        list.status == 200 && list.errors.length == 0
        list.output.includes("Air handler AHU-2")
        !list.output.includes("Compressor C-1")
        list.output.includes("New equipment")
        all.output.includes("Compressor C-1") && all.output.includes("Kenji")
        !all.output.includes("New equipment")
        !all.output.includes("Forklift 2")
        tags.status == 200 && tags.errors.length == 0
        tags.output.includes("Compressor C-1") && tags.output.includes("<svg")
        tags.output.includes("1 of the equipment asked for is not available to you.")
        scanned.matches.length == 1 && scanned.matches[0].id == ids.compressorId
    }
})

feature("the facility tree names no ancestor outside the scope; Facilities and FacilityDetail show the rooms, zone and features", {
    when() {
        const tree = read(users.planner, facilities, {text: "leased"})
        const top = read(users.planner, facilities, {roots: true, pageSize: 100})
        const retail = read(users.retailPlanner, facilities, {text: "leased"})
        // the palette and the parent choice offer the facility, never the unnamed node above it
        const palette = asUser(users.planner, () => invoke("ironstone.maintenance.ContextServices.search#Records", {text: "leased"}).rows || [])
        const parents = asUser(users.planner, () =>
            invoke("ironstone.maintenance.ContextServices.get#Choices", {choice: "parentFacilities", term: "leased"}).options
        )
        const listed = asUser(users.planner, () => page("Facilities/Find", {}))
        const rooms = asUser(users.resources, () =>
            page("Facilities/FacilityDetail/Rooms", {facilityId: ids.floorId, lastStandalone: "true"})
        )
        // the record (its header, Move asked for under the other floor, its tab bar), rendered once
        const detail = asUser(users.resources, () =>
            page("Facilities/FacilityDetail", {facilityId: ids.meetingRoomId, moveToParentId: ids.otherFloorId})
        )
        return {tree, top, retail, palette, parents, listed, rooms, detail}
    },
    then({tree, top, retail, palette, parents, listed, rooms, detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Room 101 Huddle") && detail.output.includes("America/Chicago (inherited)")
        detail.output.includes("Bookings to come") && detail.output.includes("Move it")
        detail.output.includes('name="Rooms"') && !detail.output.includes('name="Locations"')
        tree.facilityList.some(row => row.facilityId == leased && row.parentFacilityId.startsWith("hidden-") && row.parentName == "")
        tree.facilityList.some(row => row.hiddenAncestor && row.facilityName == "")
        !JSON.stringify(tree.facilityList).includes(ids.otherFacilityId)
        !JSON.stringify(tree.facilityList).includes("Ziziwork Retail")
        top.facilityList.some(row => row.facilityId == ids.siteId && row.timeZoneText == "America/Chicago")
        !top.facilityList.some(row => row.facilityId == ids.buildingId)
        retail.facilityList.length == 0
        palette.some(row => row.recordId == leased) && palette.every(row => row.title && !String(row.recordId).startsWith("hidden-"))
        parents.some(option => option.value == leased) && parents.every(option => !String(option.value).startsWith("hidden-"))
        listed.status == 200 && listed.errors.length == 0
        listed.output.includes("Service Center")
        listed.output.includes("A facility you do not have access to")
        !listed.output.includes("New facility")
        rooms.status == 200 && rooms.errors.length == 0
        rooms.output.includes("Room 101 Huddle") && rooms.output.includes("Video conference")
        rooms.output.includes("Add feature")
    }
})

feature("Product360 under Maintenance lists the model's spare parts; Employee360 shows a custodian's work card and their equipment", {
    when() {
        const parts = asUser(users.resources, () =>
            page("Equipment/Product360/SpareParts", {productId: ids.modelId, lastStandalone: "true"})
        )
        const person = asUser(users.planner, () => page("Equipment/Employee360", {partyId: ids.custodianId}))
        return {parts, person}
    },
    then({parts, person}) {
        parts.status == 200 && parts.errors.length == 0
        parts.output.includes("AC-200 intake filter") && parts.output.includes("AC-200 drive belt")
        !parts.output.includes("Add spare part")
        person.status == 200 && person.errors.length == 0
        person.output.includes("Kenji")
        person.output.includes("Assigned equipment") && person.output.includes("Compressor C-1")
        !person.output.includes("Personal information")
    }
})
