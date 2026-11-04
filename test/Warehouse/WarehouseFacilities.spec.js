// Warehouse facilities and locations (impl-warehouse P2; design-warehouse §12): Facilities as a list and tree of the
// user's facilities, FacilityDetail's header and tabs with the Warehouse context, a facility administrator building a
// facility with its locations and their statuses through the screens' transitions (Mantle's store#Facility,
// store#FacilityLocation, store#FacilityLocationType, close#FacilityLocation), a parent cycle and a close of a location
// that holds stock refused, a reader who reads but cannot edit, the choices, and EquipmentDetail's Warehouse context. The
// Mantle rules themselves are mr-mantle's WarehouseFacilities spec.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {ids, asUser, refusal, invoke, page} = lib
const facilities = "ironstone.warehouse.FacilityServices."
const detail = "Locations/FacilityDetail"
const created = ["BOSS_WH_P2_SITE", "BOSS_WH_P2_HALL", "BOSS_WH_P2_CHILD"]

function cleanupFixtures() {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        const ownIds = Array.from(
            ec.entity.find("mantle.facility.Facility").condition("facilityName", "like", "P2 walk%").list()
        ).map(row => row.facilityId)
        for (const facilityId of created.concat(ownIds)) {
            for (const entity of [
                "mantle.facility.FacilityLocation",
                "mantle.facility.FacilityLocationType",
                "mantle.facility.FacilityContactMech"
            ])
                ec.entity.find(entity).condition("facilityId", facilityId).deleteAll()
            ec.entity
                .find("mantle.facility.Facility")
                .condition("parentFacilityId", facilityId)
                .updateAll({parentFacilityId: null})
            ec.entity.find("mantle.facility.Facility").condition("facilityId", facilityId).deleteAll()
        }
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    const result = page(path, parameters, "qvt")
    return result.errors.join(" | ")
}

spec({
    setupSpec() {
        cleanupFixtures()
        // a Retail facility inside another organization's facility, which its readers cannot see
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            ec.service
                .sync()
                .name("create#mantle.facility.Facility")
                .parameters({
                    facilityId: "BOSS_WH_P2_CHILD",
                    facilityName: "P2 child of another",
                    ownerPartyId: "ORG_ZIZI_RETAIL",
                    parentFacilityId: ids.otherFacilityId
                })
                .call()
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
    },
    cleanupSpec() {
        cleanupFixtures()
    }
})

feature("a reader lists their organization's facilities as a tree by parent, searched ignoring case", {
    when() {
        return asUser("warehouse.read", () => ({
            all: invoke(facilities + "get#Facilities", {}).facilityList,
            east: invoke(facilities + "get#Facilities", {text: "EAST"}).facilityList.map(row => row.facilityId),
            children: invoke(facilities + "get#Facilities", {parentFacilityId: ids.facilityId}).facilityList.map(
                row => row.facilityId
            ),
            percent: invoke(facilities + "get#Facilities", {text: "%"}).facilityList.length,
            list: page("Locations/Facilities"),
            tree: page("Locations/Facilities/facilityChildren", {parentFacilityId: ids.facilityId})
        }))
    },
    then({all, east, children, percent, list, tree}) {
        all.some(row => row.facilityId === ids.facilityId)
        all.some(row => row.facilityId === "BOSS_WH_ANNEX" && row.parentFacilityId === ids.facilityId)
        !all.some(row => row.facilityId === ids.otherFacilityId)
        all.find(row => row.facilityId === ids.facilityId).childCount >= 1
        east == [ids.eastFacilityId]
        // the annex, and Manufacturing's two demo lines under the warehouse (impl-manufacturing P1, F16); other specs may
        // add their own lines under it (ManufacturingWorkCenters' cell)
        ["BOSS_MFG_LINE_A", "BOSS_MFG_LINE_B", "BOSS_WH_ANNEX"].every(id => children.includes(id))
        children.every(id => id === "BOSS_WH_ANNEX" || id.startsWith("BOSS_MFG_"))
        percent == 0
        list.errors == []
        list.output.includes("Ziziwork Retail East Warehouse")
        !list.output.includes("New facility")
        tree.output.includes("BOSS_WH_ANNEX")
    }
})

const tabs = [
    {tab: "Overview", text: "Forklift 2"},
    {tab: "Children", text: "Ziziwork Retail Warehouse Annex"},
    {tab: "Locations", text: "Shipping Dock"},
    {tab: "Products", text: "Product policies"},
    {tab: "Schedules", text: "Bookings in the next 14 days"},
    {tab: "Files", text: "WarehouseFacilityFiles"},
    {tab: "Conversation", text: "WarehouseFacilityConversation"}
]
function both(tab, facilityId) {
    const header = page(detail + "/" + tab, {facilityId})
    const alone = page(detail + "/" + tab, {facilityId, lastStandalone: "true"})
    return {output: header.output + alone.output, errors: header.errors.concat(alone.errors)}
}
feature("FacilityDetail's #tab tab renders for a reader, without edit actions, and for the facility admin with them", {
    where: tabs,
    when({tab}) {
        return {
            // the header (the shell's level) and the tab alone, as the client loads it after the header
            reader: asUser("warehouse.read", () => both(tab, ids.facilityId)),
            admin: asUser("warehouse.facility", () => both(tab, ids.facilityId)),
            other: asUser("warehouse.read", () => both(tab, ids.otherFacilityId))
        }
    },
    then({reader, admin, other, text, tab}) {
        reader.errors == []
        reader.output.includes(text)
        reader.output.includes("Ziziwork Retail Warehouse")
        !reader.output.includes("Edit facility")
        !reader.output.includes("New location")
        admin.errors == []
        admin.output.includes("Edit facility")
        other.output.includes("This facility is not available in this app.")
        // Files and Conversation are server-static: their sections are decided in the client, so the template is sent
        tab === "Files" || tab === "Conversation" || !other.output.includes(text)
    }
})

feature("the Locations tab leaves out a closed location until asked, and shows each type's status", {
    when() {
        return asUser("warehouse.facility", () => ({
            open: invoke(facilities + "get#FacilityLocations", {facilityId: ids.facilityId, pageSize: 100}),
            all: invoke(facilities + "get#FacilityLocations", {facilityId: ids.facilityId, includeClosed: true, pageSize: 100}),
            choice: invoke(facilities + "get#FacilityChoices", {choice: "locations", facilityId: ids.facilityId, term: "0"})
                .options
        }))
    },
    then({open, all, choice}) {
        !open.locationList.some(row => row.locationSeqId === "0199")
        all.locationList.find(row => row.locationSeqId === "0199").closed == true
        open.locationList.find(row => row.locationSeqId === "0601").typeText == "Shipping Dock"
        open.locationTypeList.find(row => row.locationTypeEnumId === "FltQuarantine").autoStatusId == "AstQuarantine"
        open.locationTypeList.find(row => row.locationTypeEnumId === "FltShipDock").autoStatusText == "Unchanged"
        open.canEdit == true
        !choice.some(row => row.value === "0199")
        choice.some(row => row.value === "0601")
    }
})

feature("a facility admin builds a facility with an area, receiving, quarantine, staging and pick locations and their statuses", {
    when() {
        return asUser("warehouse.facility", () => {
            const create = post("Locations/Facilities/createFacility", {
                facilityName: "P2 walk site",
                facilityTypeEnumId: "FcTpWarehouse",
                ownerPartyId: "ORG_ZIZI_RETAIL"
            })
            const site = Array.from(
                ec.entity.find("mantle.facility.Facility").condition("facilityName", "P2 walk site").disableAuthz().list()
            )[0]
            const locations = [
                ["R01", "FltReceiving"],
                ["Q01", "FltQuarantine"],
                ["S01", "FltStaging"],
                ["P01", "FltPick"],
                ["D01", "FltShipDock"]
            ].map(([locationSeqId, locationTypeEnumId], index) =>
                post(detail + "/Locations/storeLocation", {
                    facilityId: site.facilityId,
                    isNew: "true",
                    locationSeqId,
                    locationTypeEnumId,
                    areaId: "A",
                    capacity: "10",
                    sequenceNum: String(index + 1)
                })
            )
            const statuses = [
                ["FltReceiving", "AstOnHold"],
                ["FltQuarantine", "AstQuarantine"],
                ["FltPick", "AstAvailable"]
            ].map(([locationTypeEnumId, autoStatusId]) =>
                post(detail + "/Locations/storeLocationType", {
                    facilityId: site.facilityId,
                    locationTypeEnumId,
                    autoStatusId,
                    changeReason: "New site setup"
                })
            )
            const child = post(detail + "/Children/createFacility", {
                facilityId: site.facilityId,
                parentFacilityId: site.facilityId,
                facilityName: "P2 walk hall",
                facilityTypeEnumId: "FcTpBuilding",
                ownerPartyId: "ORG_ZIZI_RETAIL"
            })
            const hall = Array.from(
                ec.entity.find("mantle.facility.Facility").condition("facilityName", "P2 walk hall").disableAuthz().list()
            )[0]
            const cycle = post(detail + "/updateFacility", {
                facilityId: site.facilityId,
                facilityName: "P2 walk site",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                parentFacilityId: hall.facilityId
            })
            const found = invoke(facilities + "get#FacilityLocations", {facilityId: site.facilityId})
            return {create, site, locations, statuses, child, hall, cycle, found}
        })
    },
    then({create, site, locations, statuses, child, hall, cycle, found}) {
        create == ""
        site.ownerPartyId == "ORG_ZIZI_RETAIL"
        locations == ["", "", "", "", ""]
        statuses == ["", "", ""]
        found.locationList.map(row => row.locationSeqId) == ["R01", "Q01", "S01", "P01", "D01"]
        found.locationTypeList.find(row => row.locationTypeEnumId === "FltReceiving").autoStatusText == "On Hold"
        child == ""
        hall.parentFacilityId == site.facilityId
        cycle.includes("PARENT_CYCLE")
    }
})

feature("closing a location that holds stock is refused, naming the stock; an empty one closes", {
    when() {
        return asUser("warehouse.facility", () => ({
            stocked: post(detail + "/Locations/closeLocation", {
                facilityId: ids.facilityId,
                locationSeqId: "01020301",
                changeReason: "Consolidating"
            }),
            empty: post(detail + "/Locations/closeLocation", {
                facilityId: ids.eastFacilityId,
                locationSeqId: "E0801",
                changeReason: "Receiving moved"
            }),
            reopen: post(detail + "/Locations/reopenLocation", {
                facilityId: ids.eastFacilityId,
                locationSeqId: "E0801",
                changeReason: "Receiving back"
            }),
            row: ec.entity
                .find("mantle.facility.FacilityLocation")
                .condition({facilityId: ids.facilityId, locationSeqId: "01020301"})
                .disableAuthz()
                .one()
        }))
    },
    then({stocked, empty, reopen, row}) {
        stocked.includes("LOCATION_IN_USE")
        stocked.includes("BOSS_WH_LOT_AVAIL")
        row.thruDate == null
        empty == ""
        reopen == ""
    }
})

feature("a reader or an operator reads the facility but cannot edit it", {
    when() {
        const tryAll = user =>
            asUser(user, () => ({
                rename: post(detail + "/updateFacility", {facilityId: ids.facilityId, facilityName: "Renamed"}),
                location: post(detail + "/Locations/storeLocation", {
                    facilityId: ids.facilityId,
                    isNew: "true",
                    locationSeqId: "X01"
                }),
                close: post(detail + "/Locations/closeLocation", {
                    facilityId: ids.facilityId,
                    locationSeqId: "0601",
                    changeReason: "x"
                }),
                policy: post(detail + "/Products/storeProductPolicy", {
                    facilityId: ids.facilityId,
                    productId: "BOSS_WH_LOTTED",
                    minimumStock: "1",
                    changeReason: "x"
                }),
                read: invoke(facilities + "get#FacilityDetail", {facilityId: ids.facilityId})
            }))
        return {reader: tryAll("warehouse.read"), mover: tryAll("warehouse.move")}
    },
    then({reader, mover}) {
        reader.rename.includes("PERMISSION_DENIED")
        reader.location.includes("PERMISSION_DENIED")
        reader.close.includes("PERMISSION_DENIED")
        reader.policy.includes("PERMISSION_DENIED")
        reader.read.facility.facilityName == "Ziziwork Retail Warehouse"
        reader.read.canEdit == false
        mover.rename.includes("PERMISSION_DENIED")
        mover.close.includes("PERMISSION_DENIED")
        mover.read.canEdit == false
    }
})

const choices = [
    {choice: "facilityTypes", selected: "FcTpDock"},
    {choice: "locationTypes", selected: "FltMorgue"},
    {choice: "reorderMethods", selected: null},
    {choice: "abcClasses", selected: "AbcC"},
    {choice: "assetStatuses", selected: "AstMorgue"},
    {choice: "owners", selected: "ORG_ZIZI_RETAIL"},
    {choice: "parents", selected: ids.eastFacilityId},
    {choice: "capacityUoms", selected: "VDRY_m3"},
    {choice: "locations", selected: "0991"},
    {choice: "products", selected: "BOSS_WH_SERIAL"}
]
feature("the #choice choice answers its options and the label of a selected value outside the page", {
    where: choices,
    when({choice, selected}) {
        return asUser("warehouse.facility", () => ({
            options: invoke(facilities + "get#FacilityChoices", {
                choice,
                facilityId: ids.facilityId,
                term: "zzzz-no-match",
                selected
            }).options,
            other: invoke(facilities + "get#FacilityChoices", {
                choice,
                facilityId: ids.facilityId,
                term: "zzzz-no-match",
                selected: choice === "parents" ? ids.otherFacilityId : "BOSS_PRD_FOREIGN_NO_SUCH"
            }).options
        }))
    },
    then({options, other, selected}) {
        selected == null || options.some(row => row.value === selected)
        other == []
    }
})
feature("an unknown choice and another organization's facility locations are refused", {
    when() {
        return asUser("warehouse.facility", () => ({
            unknown: refusal(facilities + "get#FacilityChoices", {choice: "everything"}),
            locations: refusal(facilities + "get#FacilityChoices", {choice: "locations", facilityId: ids.otherFacilityId})
        }))
    },
    then({unknown, locations}) {
        unknown.includes("Unknown facility choice")
        locations.includes("RECORD_UNAVAILABLE")
    }
})

feature("EquipmentDetail's Warehouse context shows the forklift's identity, operator and maintenance, and refuses stock", {
    when() {
        return asUser("warehouse.read", () => ({
            forklift: page("Locations/EquipmentDetail", {assetId: "BOSS_WH_FORKLIFT"}),
            stock: page("Locations/EquipmentDetail", {assetId: ids.assetId}),
            other: page("Locations/EquipmentDetail", {assetId: ids.otherAssetId}),
            data: invoke(facilities + "get#Equipment", {assetId: "BOSS_WH_FORKLIFT"})
        }))
    },
    then({forklift, stock, other, data}) {
        forklift.errors == []
        forklift.output.includes("Forklift 2")
        forklift.output.includes("FL-2026-002")
        forklift.output.includes("Warehouse Moves")
        forklift.output.includes("Oil Change")
        forklift.output.includes("1 maintenance jobs open")
        !forklift.output.includes("Net book value")
        data.financialRead == false
        data.bookRows == []
        stock.output.includes("This equipment is not available in this app.")
        other.output.includes("This equipment is not available in this app.")
    }
})

feature("editing a facility whose parent the user cannot see keeps the parent", {
    when() {
        return asUser("warehouse.facility", () => {
            const detail = invoke(facilities + "get#FacilityDetail", {facilityId: "BOSS_WH_P2_CHILD"})
            const saved = post(detail.facility ? "Locations/FacilityDetail/updateFacility" : "x", {
                facilityId: "BOSS_WH_P2_CHILD",
                facilityName: "P2 child, renamed",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                parentFacilityId: detail.facility.storedParentFacilityId,
                originalParentFacilityId: detail.facility.storedParentFacilityId
            })
            return {
                detail,
                saved,
                row: ec.entity.find("mantle.facility.Facility").condition("facilityId", "BOSS_WH_P2_CHILD").disableAuthz().one()
            }
        })
    },
    then({detail, saved, row}) {
        detail.facility.parentName == ""
        detail.facility.storedParentFacilityId == ids.otherFacilityId
        saved == ""
        row.facilityName == "P2 child, renamed"
        row.parentFacilityId == ids.otherFacilityId
    }
})

feature(
    "the Warehouse administrator edits another organization's facility (FACILITY_ALL_ORGANIZATIONS); the facility admin may not",
    {
        when() {
            const original = ec.entity
                .find("mantle.facility.Facility")
                .condition("facilityId", ids.otherFacilityId)
                .disableAuthz()
                .one()
            const rename = name =>
                post("Locations/FacilityDetail/updateFacility", {
                    facilityId: ids.otherFacilityId,
                    facilityName: name,
                    ownerPartyId: original.ownerPartyId,
                    parentFacilityId: original.parentFacilityId || "",
                    originalParentFacilityId: original.parentFacilityId || ""
                })
            return {
                admin: asUser("warehouse.admin", () => ({
                    canEdit: invoke(facilities + "get#FacilityDetail", {facilityId: ids.otherFacilityId}).canEdit,
                    renamed: rename("P2 admin rename"),
                    restored: rename(original.facilityName)
                })),
                facilityAdmin: asUser("warehouse.facility", () => ({
                    canEdit: invoke(facilities + "get#FacilityDetail", {facilityId: ids.facilityId}).canEdit
                }))
            }
        },
        then({admin, facilityAdmin}) {
            admin.canEdit == true
            admin.renamed == ""
            admin.restored == ""
            facilityAdmin.canEdit == true
        }
    }
)
