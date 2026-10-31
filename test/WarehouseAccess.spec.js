// Warehouse access (impl-warehouse §2, §4, P1): who may open Warehouse, the facility scope through the organization
// filters, the capabilities from the Mantle permissions, the record checks against forged ids, the facility preference,
// and the Mantle REST stock paths the Warehouse groups do not reach (F3). With artifact authorization enabled and
// disabled: the scope is read from the root grants, so disabling authorization widens nothing. Later phases add their
// services and mounts here.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {ids, asUser, refusal, invoke} = lib
const access = "ironstone.warehouse.AccessServices."
const both = [{enabled: true}, {enabled: false}]
// a refusal of a user without Warehouse: with authorization enabled the service is not authorized for them, and with it
// disabled the service refuses them
const refused = message => /WAREHOUSE_UNAVAILABLE|is not authorized/.test(message)

feature("a Warehouse user gets the context and others are refused with authz #enabled", {
    where: both,
    when({enabled}) {
        const context = user => asUser(user, () => refusal(access + "get#SharedContext", {}), enabled)
        return {
            reader: context("warehouse.read"),
            admin: context("warehouse.admin"),
            finance: context("finance.read"),
            planner: context("catalog.stock.plan"),
            other: asUser("warehouse.read", () => refusal(access + "get#SharedContext", {appRoot: "Accounting"}), enabled)
        }
    },
    then({reader, admin, finance, planner, other}) {
        reader == ""
        admin == ""
        refused(finance)
        refused(planner)
        other.includes("WAREHOUSE_CONTEXT")
    }
})
const capabilityUsers = [
    {user: "warehouse.read", granted: []},
    {user: "warehouse.receive", granted: ["receive"]},
    {user: "warehouse.issue", granted: ["issue"]},
    {user: "warehouse.move", granted: ["move"]},
    {user: "warehouse.adjust", granted: ["adjust"]},
    {user: "warehouse.count", granted: ["count"]},
    {user: "warehouse.countreview", granted: ["countReview"]},
    {user: "warehouse.pick", granted: ["pick"]},
    {user: "warehouse.picksupervisor", granted: ["loadEdit"]},
    {user: "warehouse.pack", granted: ["pack"]},
    {user: "warehouse.ship", granted: ["ship"]},
    {user: "warehouse.inspect", granted: ["inspect"]},
    {user: "warehouse.quality", granted: ["lotExpiryExtend", "qualityVerify", "qualityDispose", "qualityTemplateEdit"]},
    {user: "warehouse.facility", granted: ["facilityEdit", "policyPlan", "policyManage"]},
    {user: "warehouse.manager", granted: ["policyPlan", "policyManage"]},
    {user: "warehouse.planner", granted: ["policyPlan"]}
]
const stockCapabilities = [
    "receive",
    "issue",
    "move",
    "adjust",
    "count",
    "countReview",
    "lotExpiryExtend",
    "pick",
    "loadEdit",
    "pack",
    "ship",
    "facilityEdit",
    "inspect",
    "qualityVerify",
    "qualityDispose",
    "qualityTemplateEdit",
    "policyPlan",
    "policyManage"
]
feature("#user holds exactly the capabilities of its group's permissions", {
    where: capabilityUsers,
    when({user}) {
        return asUser(user, () => ({capabilities: invoke(access + "get#SharedContext", {}).capabilities}))
    },
    then({capabilities, granted}) {
        capabilities.read == true
        stockCapabilities.filter(name => capabilities[name]) == granted
        capabilities.financialRead == false
    }
})
feature("the administrator holds every warehouse capability and works in every organization's facilities", {
    when() {
        return asUser("warehouse.admin", () => ({
            context: invoke(access + "get#SharedContext", {}),
            other: refusal(access + "check#Record", {recordType: "facility", recordId: ids.otherFacilityId})
        }))
    },
    then({context, other}) {
        stockCapabilities.every(name => context.capabilities[name])
        context.allFacilities == true
        other == ""
    }
})
feature("a reader's facilities are their organization's, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.read",
            () => ({
                context: invoke(access + "get#SharedContext", {}),
                options: invoke(access + "get#Choices", {choice: "facilities", term: ""}).options.map(row => row.value),
                selected: invoke(access + "get#Choices", {
                    choice: "facilities",
                    term: "",
                    selected: ids.otherFacilityId
                }).options.map(row => row.value),
                unknown: refusal(access + "get#Choices", {choice: "everything"})
            }),
            enabled
        )
    },
    then({context, options, selected, unknown}) {
        context.allFacilities == false
        options.includes(ids.facilityId)
        options.includes(ids.eastFacilityId)
        !options.includes(ids.otherFacilityId)
        !selected.includes(ids.otherFacilityId)
        unknown.includes("Unknown Warehouse choice")
    }
})
const records = [
    {recordType: "facility", own: ids.eastFacilityId, other: ids.otherFacilityId},
    {recordType: "asset", own: ids.assetId, other: ids.otherAssetId},
    {recordType: "asset", own: ids.eastAssetId, other: "BOSS_PRD_FOREIGN_STOCK"},
    {recordType: "shipment", own: ids.transferShipmentId, other: ids.otherShipmentId},
    {recordType: "lot", own: ids.lotId, other: "BOSS_WH_FORGED"},
    {recordType: "container", own: ids.containerId, other: "BOSS_WH_FORGED"},
    {recordType: "return", own: ids.returnId, other: "BOSS_WH_FORGED"},
    {recordType: "count", own: ids.countId, other: "BOSS_WH_FORGED"}
]
feature("a forged #recordType id is refused like a missing one, with authz #enabled", {
    where: () => both.flatMap(row => records.map(record => Object.assign({}, record, row))),
    when({recordType, own, other, enabled}) {
        return asUser(
            "warehouse.read",
            () => ({
                own: refusal(access + "check#Record", {recordType, recordId: own}),
                other: refusal(access + "check#Record", {recordType, recordId: other}),
                missing: refusal(access + "check#Record", {recordType, recordId: "BOSS_WH_NONE_SUCH"})
            }),
            enabled
        )
    },
    then({own, other, missing}) {
        own == ""
        other.includes("RECORD_UNAVAILABLE")
        missing.includes("RECORD_UNAVAILABLE")
    }
})
feature("a location of the reader's facility passes and one of another organization's is refused", {
    when() {
        return asUser("warehouse.read", () => ({
            own: invoke(access + "check#Record", {recordType: "location", recordId: "0901", facilityId: ids.facilityId}),
            other: refusal(access + "check#Record", {recordType: "location", recordId: "PICK", facilityId: ids.otherFacilityId})
        }))
    },
    then({own, other}) {
        own.facilityId == ids.facilityId
        own.detail == "Quarantine"
        other.includes("RECORD_UNAVAILABLE")
    }
})
feature("a named capability is required: the receiver passes and the reader is refused on the same record", {
    when() {
        const check = user =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "shipment", recordId: "BOSS_WH_SHIP_IN", capability: "receive"})
            )
        return {receiver: check("warehouse.receive"), reader: check("warehouse.read")}
    },
    then({receiver, reader}) {
        receiver == ""
        reader.includes("PERMISSION_DENIED")
    }
})
feature("the facility preference never widens the scope, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.read",
            () => {
                const chosen = invoke(access + "select#Facility", {facilityId: ids.eastFacilityId})
                const afterChoice = invoke(access + "get#SharedContext", {}).facilityId
                const forged = refusal(access + "select#Facility", {facilityId: ids.otherFacilityId})
                // a preference set elsewhere to another organization's facility is ignored where it is read
                ec.user.setPreference("FacilityActive", ids.otherFacilityId)
                const ignored = invoke(access + "get#SharedContext", {}).facilityId
                const given = refusal(access + "get#SharedContext", {facilityId: ids.otherFacilityId})
                invoke(access + "select#Facility", {})
                return {chosen: chosen.facilityId, afterChoice, forged, ignored, given}
            },
            enabled
        )
    },
    then({chosen, afterChoice, forged, ignored, given}) {
        chosen == ids.eastFacilityId
        afterChoice == ids.eastFacilityId
        forged.includes("FACILITY_UNAVAILABLE")
        ignored == null
        given.includes("FACILITY_UNAVAILABLE")
    }
})
feature("the lookup reads only the reader's records and refuses another organization's facility", {
    when() {
        return asUser("warehouse.read", () => ({
            serial: invoke(access + "get#ScannedRecord", {scanText: "SCN-1003"}).matches,
            container: invoke(access + "get#ScannedRecord", {scanText: "TOTE-E1"}).matches,
            other: invoke(access + "get#ScannedRecord", {scanText: ids.otherAssetId}).matches,
            facility: refusal(access + "get#ScannedRecord", {scanText: "PICK", facilityId: ids.otherFacilityId})
        }))
    },
    then({serial, container, other, facility}) {
        serial.some(match => match.recordType === "asset" && match.recordId === ids.eastAssetId)
        container.some(match => match.recordType === "container" && match.recordId === ids.containerId)
        other == []
        facility.includes("FACILITY_UNAVAILABLE")
    }
})
feature("a Warehouse user in no organization works in no facility", {
    given() {
        const make = (entity, fields) =>
            ec.service
                .sync()
                .name("create#" + entity)
                .parameters(fields)
                .disableAuthz()
                .call()
        make("mantle.party.Party", {partyId: "BOSS_WH_SPEC_NOORG", partyTypeEnumId: "PtyPerson"})
        make("moqui.security.UserAccount", {
            userId: "BOSS_WH_SPEC_NOORG",
            username: "warehouse.spec.noorg",
            partyId: "BOSS_WH_SPEC_NOORG",
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        make("moqui.security.UserGroupMember", {userGroupId: "BOSS_WAREHOUSE", userId: "BOSS_WH_SPEC_NOORG", fromDate: 0})
        return {}
    },
    when() {
        return asUser("warehouse.spec.noorg", () => ({
            context: invoke(access + "get#SharedContext", {}),
            asset: refusal(access + "check#Record", {recordType: "asset", recordId: ids.assetId})
        }))
    },
    then({context, asset}) {
        context.facilityCount == 0
        context.facilityId == null
        asset.includes("RECORD_UNAVAILABLE")
    },
    cleanup() {
        // the user leaves the Warehouse group; the party and account stay, as other records the account made refer to them
        ec.entity.find("moqui.security.UserGroupMember").condition({userId: "BOSS_WH_SPEC_NOORG"}).disableAuthz().deleteAll()
    }
})
feature("the Warehouse groups reach no Mantle REST stock mutator (F3)", {
    where: [{user: "warehouse.receive"}, {user: "warehouse.adjust"}, {user: "warehouse.admin"}],
    when({user}) {
        return asUser(user, () => {
            const failures = []
            for (const path of [
                "s1/mantle/assets/receive",
                "s1/mantle/shipments/BOSS_WH_SHIP_IN/receive",
                "s1/mantle/shipments/BOSS_WH_SHIP_IN/items/BOSS_WH_LOTTED/receive",
                "s1/mantle/shipments/BOSS_WH_SHIP_OUT/issue",
                "s1/mantle/facilities/ZIRET_WH/products/BOSS_WH_LOTTED/physicalQuantity",
                "s1/mantle/facilities/ZIRET_WH/products/BOSS_WH_LOTTED/physicalChange"
            ]) {
                const rendered = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot/rest.xml")
                    .render(path, {quantity: "1"}, "post")
                if (![401, 403].includes(rendered.status)) failures.push(path + ": " + rendered.status)
                ec.message.clearErrors()
            }
            return {failures}
        })
    },
    then({failures}) {
        failures == []
    }
})
feature("an Accounting administrator's active organization of another organization does not widen their facilities", {
    given() {
        const wasDisabled = ec.artifactExecution.disableAuthz()
        ec.service
            .sync()
            .name("create#moqui.security.UserGroupMember")
            .parameters({userGroupId: "BOSS_ACCOUNTING_ADMIN", userId: "BOSS_WH_READ", fromDate: 0})
            .call()
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
        return {}
    },
    when() {
        return asUser("warehouse.read", () => {
            ec.user.setPreference("ACTIVE_ORGANIZATION", "ORG_ZIZI_SERVICES")
            try {
                const info = ec.service.sync().name("mantle.party.PartyServices.get#PartyOrganizationInfo").disableAuthz().call()
                return {
                    activeOrgId: info.activeOrgId,
                    context: invoke(access + "get#SharedContext", {}),
                    options: invoke(access + "get#Choices", {choice: "facilities"}).options.map(row => row.value),
                    other: refusal(access + "check#Record", {recordType: "asset", recordId: ids.otherAssetId}),
                    own: refusal(access + "check#Record", {recordType: "asset", recordId: ids.assetId})
                }
            } finally {
                ec.user.setPreference("ACTIVE_ORGANIZATION", null)
            }
        })
    },
    then({activeOrgId, context, options, other, own}) {
        // Mantle lets the finance administrator make the other organization active
        activeOrgId == "ORG_ZIZI_SERVICES"
        context.activeOrganizationPartyId == null
        context.allFacilities == false
        !options.includes(ids.otherFacilityId)
        options.includes(ids.facilityId)
        other.includes("RECORD_UNAVAILABLE")
        own == ""
    },
    cleanup() {
        ec.entity
            .find("moqui.security.UserGroupMember")
            .condition({userGroupId: "BOSS_ACCOUNTING_ADMIN", userId: "BOSS_WH_READ"})
            .disableAuthz()
            .deleteAll()
    }
})
// Entity filters come only from the record that authorizes a screen (the top frame), so a capability group's grant on a
// restricted area carries the root's filter sets: MANTLE_USER_ORG and MANTLE_PRIVATE_CONTACT, the admin group's
// MANTLE_ACTIVE_ORG and MANTLE_PRIVATE_CONTACT. Read from the grants, since the areas read no entity until their phases.
feature("every grant on a Warehouse area carries the organization and private-contact filters", {
    when() {
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            const grants = Array.from(
                ec.entity
                    .find("moqui.security.ArtifactAuthz")
                    .condition("artifactGroupId", "in", ["BOSS_WH_INSPECTION", "BOSS_WH_COUNTS", "BOSS_WH_PICKING"])
                    .condition("authzTypeEnumId", "not-equals", "AUTHZT_DENY")
                    .list()
            )
            const problems = []
            for (const grant of grants) {
                const sets = Array.from(
                    ec.entity
                        .find("moqui.security.ArtifactAuthzFilter")
                        .condition("artifactAuthzId", grant.artifactAuthzId)
                        .list()
                )
                    .map(row => row.entityFilterSetId)
                    .sort()
                    .join(",")
                const expected =
                    grant.userGroupId === "BOSS_WAREHOUSE_ADMIN"
                        ? "MANTLE_ACTIVE_ORG,MANTLE_PRIVATE_CONTACT"
                        : "MANTLE_PRIVATE_CONTACT,MANTLE_USER_ORG"
                if (sets !== expected) problems.push(grant.artifactAuthzId + ": " + sets)
            }
            return {count: grants.length, problems}
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
    },
    then({count, problems}) {
        count == 11
        problems == []
    }
})
feature("a grant with no MANTLE_ACTIVE_ORG set limits to the user's organizations, never every facility", {
    given() {
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            // a misconfigured grant: the root authorized for the receive group with no filters at all
            ec.service
                .sync()
                .name("create#moqui.security.ArtifactAuthz")
                .parameters({
                    artifactAuthzId: "BOSS_WH_SPEC_BARE",
                    userGroupId: "BOSS_WAREHOUSE_RECEIVE",
                    artifactGroupId: "BOSS_WAREHOUSE",
                    authzTypeEnumId: "AUTHZT_ALWAYS",
                    authzActionEnumId: "AUTHZA_ALL"
                })
                .call()
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
        return {}
    },
    when() {
        return asUser("warehouse.receive", () => ({
            context: invoke(access + "get#SharedContext", {}),
            other: refusal(access + "check#Record", {recordType: "facility", recordId: ids.otherFacilityId})
        }))
    },
    then({context, other}) {
        context.allFacilities == false
        other.includes("RECORD_UNAVAILABLE")
    },
    cleanup() {
        ec.entity
            .find("moqui.security.ArtifactAuthz")
            .condition("artifactAuthzId", "BOSS_WH_SPEC_BARE")
            .disableAuthz()
            .deleteAll()
    }
})
feature("a Warehouse-only user's product link opens Warehouse's Product360, never Products'", {
    when() {
        const link = (user, id = "BOSS_WH_SERIAL") =>
            asUser(
                user,
                () => invoke("ironstone.commons.PaletteServices.get#RecordLink", {docType: "MantleProduct", id}).url || null
            )
        return {
            warehouse: link("warehouse.read"),
            other: link("warehouse.read", "BOSS_PRD_OWN"),
            finance: link("finance.read"),
            admin: link("john.doe")
        }
    },
    then({warehouse, other, finance, admin}) {
        warehouse == "/qapps/Warehouse/Inventory/Product360?productId=BOSS_WH_SERIAL"
        other == null
        finance == null
        admin == "/qapps/Products/Products/Product360?productId=BOSS_WH_SERIAL"
    }
})

// P2: facilities and locations. The lists and FacilityDetail read only the user's facilities, the facility admin's writes
// through FacilityDetail are refused on another organization's facility, and Mantle's facility writes are reached only
// through the screens (no artifact authorization of their own for the Warehouse groups).
const facilityReads = "ironstone.warehouse.FacilityServices."
feature("a facility admin's facility list and FacilityDetail are their organization's, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.facility",
            () => ({
                list: invoke(facilityReads + "get#Facilities", {pageSize: 100}).facilityList.map(row => row.facilityId),
                own: refusal(facilityReads + "get#FacilityDetail", {facilityId: ids.facilityId}),
                other: refusal(facilityReads + "get#FacilityDetail", {facilityId: ids.otherFacilityId}),
                locations: refusal(facilityReads + "get#FacilityLocations", {facilityId: ids.otherFacilityId}),
                products: refusal(facilityReads + "get#FacilityProducts", {facilityId: ids.otherFacilityId}),
                schedule: refusal(facilityReads + "get#FacilitySchedule", {facilityId: ids.otherFacilityId}),
                equipment: refusal(facilityReads + "get#Equipment", {assetId: ids.otherAssetId})
            }),
            enabled
        )
    },
    then({list, own, other, locations, products, schedule, equipment}) {
        list.includes(ids.facilityId)
        list.includes(ids.eastFacilityId)
        !list.includes(ids.otherFacilityId)
        own == ""
        other.includes("RECORD_UNAVAILABLE")
        locations.includes("RECORD_UNAVAILABLE")
        products.includes("RECORD_UNAVAILABLE")
        schedule.includes("RECORD_UNAVAILABLE")
        equipment.includes("RECORD_UNAVAILABLE")
    }
})
feature(
    "FacilityDetail's writes refuse another organization's facility, and the Mantle facility services are not authorized alone",
    {
        when() {
            const page = lib.page
            return asUser("warehouse.facility", () => ({
                rename: page("Locations/FacilityDetail/updateFacility", {
                    facilityId: ids.otherFacilityId,
                    facilityName: "x"
                }).errors.join(" "),
                close: page("Locations/FacilityDetail/Locations/closeLocation", {
                    facilityId: ids.otherFacilityId,
                    locationSeqId: "x",
                    changeReason: "x"
                }).errors.join(" "),
                direct: refusal("mantle.facility.FacilityServices.store#Facility", {
                    facilityId: ids.facilityId,
                    facilityName: "x"
                })
            }))
        },
        then({rename, close, direct}) {
            rename.includes("RECORD_UNAVAILABLE")
            close.includes("RECORD_UNAVAILABLE")
            direct.includes("is not authorized")
        }
    }
)

// P4: the Inventory area
const inventory = "ironstone.warehouse.InventoryServices."
feature("a list under Inventory is filtered for a capability user, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.move",
            () => ({
                assets: lib.page("Inventory/Assets", {showEmpty: true}, "html"),
                containers: lib.page("Inventory/Containers", {}, "html"),
                rows: invoke(inventory + "find#Assets", {showEmpty: true, pageSize: 100}).assetList.map(row => row.assetId)
            }),
            enabled
        )
    },
    then({assets, containers, rows}) {
        assets.errors == []
        assets.output.includes(ids.assetId)
        !assets.output.includes(ids.otherAssetId)
        !assets.output.includes("BOSS_PRD_FOREIGN_STOCK")
        containers.output.includes(ids.containerId)
        rows.includes(ids.eastAssetId)
        !rows.includes(ids.otherAssetId)
    }
})
const inventoryCalls = [
    {service: "find#Assets", parameters: {}},
    {service: "find#Movements", parameters: {}},
    {service: "find#Lots", parameters: {}},
    {service: "find#Containers", parameters: {}},
    {service: "get#AssetDetail", parameters: {assetId: "BOSS_WH_SER_1"}},
    {service: "get#Traceability", parameters: {rootType: "lot", rootId: "BOSS_WH_LOT_A"}},
    {service: "get#ProductStock", parameters: {productId: "BOSS_WH_LOTTED", part: "locations"}}
]
feature("Inventory's #service answers a reader and refuses a user without Warehouse", {
    where: inventoryCalls,
    when({service, parameters}) {
        return {
            reader: asUser("warehouse.read", () => refusal(inventory + service, parameters)),
            finance: asUser("finance.read", () => refusal(inventory + service, parameters), false)
        }
    },
    then({reader, finance}) {
        reader == ""
        finance.includes("WAREHOUSE_UNAVAILABLE")
    }
})
feature("a forged asset, lot, container or trace root of another organization is refused by Inventory", {
    when() {
        return asUser("warehouse.read", () => ({
            asset: refusal(inventory + "get#AssetDetail", {assetId: ids.otherAssetId}),
            ledger: refusal(inventory + "find#Movements", {assetId: "BOSS_PRD_FOREIGN_STOCK"}),
            container: refusal(inventory + "get#ContainerDetail", {containerId: "BOSS_WH_FORGED"}),
            trace: refusal(inventory + "get#Traceability", {rootType: "shipment", rootId: ids.otherShipmentId}),
            facility: refusal(inventory + "find#Movements", {facilityId: ids.otherFacilityId})
        }))
    },
    then({asset, ledger, container, trace, facility}) {
        asset.includes("RECORD_UNAVAILABLE")
        ledger.includes("RECORD_UNAVAILABLE")
        container.includes("RECORD_UNAVAILABLE")
        trace.includes("RECORD_UNAVAILABLE")
        facility.includes("FACILITY_UNAVAILABLE")
    }
})
feature("another organization's stock is not a record a Warehouse reader sees for files and notes", {
    when() {
        // the record files panel under the Warehouse root, as the client loads it (get#RecordLinkInfo under the root's
        // organization filter)
        const files = assetId =>
            asUser("warehouse.read", () => {
                const out = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Warehouse.xml")
                    .render("RecordFiles/filesData", {recordEntity: "mantle.product.asset.Asset", recordId: assetId}, null)
                ec.message.clearErrors()
                try {
                    return JSON.parse(String(out.output || "{}"))
                } catch (error) {
                    return {}
                }
            })
        return {own: files(ids.assetId), other: files(ids.otherAssetId)}
    },
    then({own, other}) {
        own.visible == true
        own.hasContent == true
        other.visible == false
    }
})
