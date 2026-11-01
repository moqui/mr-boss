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

// P3: the policy screens' services open to Warehouse users only, and their lists keep to the user's organizations
const policyServices = "ironstone.warehouse.PolicyServices."
feature("the policy services refuse #user, with authz #enabled", {
    where: () => both.flatMap(row => [{user: "finance.read"}, {user: "catalog.stock.plan"}].map(u => Object.assign({}, u, row))),
    when({user, enabled}) {
        return asUser(
            user,
            () => ({
                context: refusal(policyServices + "get#PolicyContext", {appRoot: "Warehouse", facilityId: ids.facilityId}),
                pools: refusal(policyServices + "get#Pools", {appRoot: "Warehouse"})
            }),
            enabled
        )
    },
    then({context, pools}) {
        refused(context)
        refused(pools)
    }
})
feature("a capability user's pools, exceptions and store choices are their organization's", {
    when() {
        return asUser("warehouse.planner", () => ({
            pools: invoke(policyServices + "get#Pools", {appRoot: "Warehouse"}).poolRows,
            stores: invoke(policyServices + "get#PolicyChoices", {appRoot: "Warehouse", choice: "stores", term: ""}).options.map(
                row => row.value
            ),
            otherOrganization: refusal(policyServices + "get#PolicyContext", {
                appRoot: "Warehouse",
                organizationPartyId: "ORG_ZIZI_SERVICES"
            })
        }))
    },
    then({pools, stores, otherOrganization}) {
        pools.some(row => row.assetPoolId === "BOSS_WH_POOL")
        pools.every(row => row.ownerName === "Ziziwork Retail & Wholesale")
        stores.includes("POPC_DEFAULT")
        otherOrganization.includes("ORGANIZATION_UNAVAILABLE")
    }
})

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

// Warehouse P5: the Move reads, the scan resolver, the guarded moves and the Handheld area
const moves = "ironstone.warehouse.MoveServices."
const moveCalls = [
    {service: moves + "get#MoveContext", parameters: {facilityId: "ZIRET_WH", locationSeqId: "0901"}},
    {service: moves + "find#RecentMoves", parameters: {}},
    {service: access + "resolve#Scan", parameters: {scanText: "SCN-1001", facilityId: "ZIRET_WH"}}
]
feature("#service answers a reader and refuses a user without Warehouse", {
    where: moveCalls,
    when({service, parameters}) {
        return {
            reader: asUser("warehouse.read", () => refusal(service, parameters)),
            finance: asUser("finance.read", () => refusal(service, parameters), false)
        }
    },
    then({reader, finance}) {
        reader == ""
        finance.includes("WAREHOUSE_UNAVAILABLE")
    }
})
feature("a forged asset, container or facility of another organization is refused by Move, and a scan never names one", {
    when() {
        return asUser("warehouse.move", () => ({
            asset: refusal(moves + "get#MoveContext", {facilityId: "ZIRET_WH", assetId: ids.otherAssetId}),
            container: refusal(moves + "get#MoveContext", {facilityId: "ZIRET_WH", containerId: "BOSS_WH_FORGED"}),
            facility: refusal(moves + "get#MoveContext", {facilityId: ids.otherFacilityId}),
            run: refusal(moves + "get#MoveContext", {facilityId: "ZIRET_WH", workEffortId: "BOSS_WH_FORGED_RUN"}),
            scanFacility: refusal(access + "resolve#Scan", {scanText: ids.otherAssetId, facilityId: ids.otherFacilityId}),
            scan: invoke(access + "resolve#Scan", {scanText: ids.otherAssetId}).matches,
            ownScan: invoke(access + "resolve#Scan", {scanText: ids.assetId}).matches
        }))
    },
    then({asset, container, facility, run, scanFacility, scan, ownScan}) {
        asset.includes("RECORD_UNAVAILABLE")
        container.includes("RECORD_UNAVAILABLE")
        facility.includes("FACILITY_UNAVAILABLE")
        run.includes("RECORD_UNAVAILABLE")
        scanFacility.includes("FACILITY_UNAVAILABLE")
        scan.length == 0
        ownScan.some(match => match.id == ids.assetId)
    }
})
// the Warehouse groups reach the guarded entry points only through the app's screens (F3); with authorization disabled
// the entry points check the permission and the organization themselves
feature("the guarded moves refuse another organization's stock and a user without the move permission", {
    when() {
        const task = "mantle.shipment.WarehouseTaskServices."
        const direct = (user, service, parameters, enabled = false) =>
            asUser(user, () => refusal(task + service, parameters), enabled)
        return {
            raw: direct(
                "warehouse.move",
                "move#Stock",
                {operationKey: "p5-access-0", assetId: ids.assetId, toLocationSeqId: "0701"},
                true
            ),
            otherAsset: direct("warehouse.move", "move#Stock", {
                operationKey: "p5-access-1",
                assetId: ids.otherAssetId,
                toLocationSeqId: "0701"
            }),
            otherContainer: direct("warehouse.move", "move#Container", {
                operationKey: "p5-access-2",
                containerId: ids.containerId,
                toLocationSeqId: "E0901",
                toFacilityId: ids.otherFacilityId
            }),
            reader: direct("warehouse.read", "move#Stock", {
                operationKey: "p5-access-3",
                assetId: ids.assetId,
                toLocationSeqId: "0701"
            }),
            readerRelocate: direct("warehouse.read", "relocate#Assets", {
                operationKey: "p5-access-4",
                assetIds: [ids.assetId],
                toLocationSeqId: "0701"
            }),
            readerRepair: direct("warehouse.move", "repair#FacilityReservations", {
                operationKey: "p5-access-5",
                facilityId: ids.facilityId,
                previewFingerprint: "x"
            }),
            page: asUser("warehouse.move", () =>
                lib.page("Transfers/Move/moveStock", {assetId: ids.otherAssetId, toLocationSeqId: "0701", operationKey: "p5-6"})
            )
        }
    },
    then({raw, otherAsset, otherContainer, reader, readerRelocate, readerRepair, page}) {
        raw.includes("is not authorized")
        otherAsset.includes("RECORD_UNAVAILABLE")
        otherContainer.includes("OTHER_FACILITY")
        reader.includes("PERMISSION_DENIED")
        readerRelocate.includes("PERMISSION_DENIED")
        readerRepair.includes("PERMISSION_DENIED")
        page.errors.join(" ").includes("RECORD_UNAVAILABLE")
    }
})
feature("the Handheld area and Move are filtered to the user's facilities, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.move",
            () => ({
                home: lib.page("Handheld/Home", {lookupId: ids.otherAssetId}, "html"),
                own: lib.page("Handheld/Home", {lookupId: ids.assetId}, "html"),
                move: lib.page("Transfers/Move", {facilityId: ids.facilityId, productId: "BOSS_WH_LOTTED"}, "html"),
                otherMove: lib.page("Handheld/Move", {facilityId: ids.otherFacilityId}, "html")
            }),
            enabled
        )
    },
    then({home, own, move, otherMove}) {
        home.errors == []
        !home.output.includes("Move it")
        own.output.includes("Move it")
        move.output.includes("BOSS_WH_LOT_AVAIL")
        !move.output.includes("BOSS_PRD_FOREIGN_STOCK")
        !move.output.includes(ids.eastAssetId)
        otherMove.output.includes("Choose the facility you work in")
    }
})
// Warehouse P10: another organization's count (BOSS_PRD_WH, ORG_ZIZI_SERVICES), made for these features and removed
const foreignCount = "BOSS_PRD_P10_COUNT"
const unavailableOrUnauthorized = message => /RECORD_UNAVAILABLE|is not authorized/.test(message)
function withForeignCount(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        if (!ec.entity.find("mantle.product.asset.PhysicalInventory").condition({physicalInventoryId: foreignCount}).one())
            ec.service
                .sync()
                .name("create#mantle.product.asset.PhysicalInventory")
                .parameters({
                    physicalInventoryId: foreignCount,
                    statusId: "PIInPlanning",
                    facilityId: ids.otherFacilityId,
                    countModeEnumId: "CntModeCycle",
                    blindIndicator: "N",
                    scopeVersion: 1
                })
                .call()
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.artifactExecution.disableAuthz()
        ec.entity.find("mantle.product.asset.PhysicalInventory").condition({physicalInventoryId: foreignCount}).deleteAll()
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
feature("a list under Counts is filtered for a capability user, with authz #enabled", {
    where: both,
    when({enabled}) {
        return withForeignCount(() =>
            asUser(
                "warehouse.count",
                () => ({
                    counts: lib.page("Counts/Counts", {}, "html"),
                    rows: Array.from(invoke("ironstone.warehouse.CountServices.get#CountList", {pageSize: 100}).counts).map(
                        row => row.physicalInventoryId
                    ),
                    foreign: refusal("ironstone.warehouse.CountServices.get#CountDetail", {physicalInventoryId: foreignCount}),
                    foreignMantle: refusal("mantle.product.InventoryCountServices.get#Count", {
                        physicalInventoryId: foreignCount
                    }),
                    foreignStart: refusal("mantle.product.InventoryCountServices.start#Count", {
                        physicalInventoryId: foreignCount
                    })
                }),
                enabled
            )
        )
    },
    then({counts, rows, foreign, foreignMantle, foreignStart}) {
        counts.errors == []
        counts.output.includes(ids.countId)
        !counts.output.includes(foreignCount)
        rows.includes(ids.countId)
        !rows.includes(foreignCount)
        foreign.includes("RECORD_UNAVAILABLE")
        // with authorization enabled a Warehouse group reaches no Mantle stock service directly (F3); with it disabled
        // Mantle refuses another organization's count itself
        unavailableOrUnauthorized(foreignMantle)
        unavailableOrUnauthorized(foreignStart)
    }
})
feature("the count reads and writes refuse a user without the count permissions, and the reader's count link is the lookup", {
    when() {
        return {
            // Mantle's own permission checks, with artifact authorization disabled (it would refuse the service first)
            readerMantle: asUser(
                "warehouse.read",
                () => ({
                    mantle: refusal("mantle.product.InventoryCountServices.get#Count", {physicalInventoryId: ids.countId}),
                    create: refusal("mantle.product.InventoryCountServices.create#Count", {
                        facilityId: ids.facilityId,
                        scopeLocationSeqId: "01020301"
                    })
                }),
                false
            ),
            counterReview: asUser(
                "warehouse.count",
                () => refusal("mantle.product.InventoryCountServices.review#Count", {physicalInventoryId: ids.countId}),
                false
            ),
            reader: asUser("warehouse.read", () => ({
                detail: refusal("ironstone.warehouse.CountServices.get#CountDetail", {physicalInventoryId: ids.countId}),
                variance: invoke("ironstone.warehouse.CountServices.get#CountVariance", {}).available,
                link: invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                    recordEntityName: "mantle.product.asset.PhysicalInventory",
                    id: ids.countId
                }).url
            })),
            counter: asUser("warehouse.count", () => ({
                variance: invoke("ironstone.warehouse.CountServices.get#CountVariance", {}).available,
                link: invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                    recordEntityName: "mantle.product.asset.PhysicalInventory",
                    id: ids.countId
                }).url
            }))
        }
    },
    then({readerMantle, counterReview, reader, counter}) {
        reader.detail.includes("PERMISSION_DENIED")
        readerMantle.mantle.includes("PERMISSION_DENIED")
        readerMantle.create.includes("PERMISSION_DENIED")
        counterReview.includes("PERMISSION_DENIED")
        reader.variance == false
        String(reader.link).includes("Home?lookupType=count")
        counter.variance == false
        String(counter.link).includes("Counts/CountDetail?physicalInventoryId=" + ids.countId)
    }
})

// Warehouse P6: the adjustment, repack and lot correction reads, the guarded adjustments and the Adjustments and Repack mounts
const adjustments = "ironstone.warehouse.AdjustmentServices."
const adjustmentCalls = [
    {service: adjustments + "get#AdjustmentContext", parameters: {assetId: ids.assetId}},
    {service: adjustments + "get#RepackContext", parameters: {facilityId: "ZIRET_WH", productId: "BOSS_WH_SEAL_CASE"}},
    {service: adjustments + "get#LotCorrections", parameters: {lotId: ids.lotId}}
]
feature("#service answers a reader and refuses a user without Warehouse", {
    where: adjustmentCalls,
    when({service, parameters}) {
        return {
            reader: asUser("warehouse.read", () => refusal(service, parameters)),
            finance: asUser("finance.read", () => refusal(service, parameters), false)
        }
    },
    then({reader, finance}) {
        reader == ""
        finance.includes("WAREHOUSE_UNAVAILABLE")
    }
})
feature("a forged asset or facility of another organization is refused by Adjustments and Repack", {
    when() {
        return asUser("warehouse.adjust", () => ({
            asset: refusal(adjustments + "get#AdjustmentContext", {assetId: ids.otherAssetId}),
            facility: refusal(adjustments + "get#AdjustmentContext", {facilityId: ids.otherFacilityId}),
            repackAsset: refusal(adjustments + "get#RepackContext", {assetId: ids.otherAssetId}),
            lot: refusal(adjustments + "get#LotCorrections", {lotId: "BOSS_WH_FORGED_LOT"})
        }))
    },
    then({asset, facility, repackAsset, lot}) {
        asset.includes("RECORD_UNAVAILABLE")
        facility.includes("FACILITY_UNAVAILABLE")
        repackAsset.includes("RECORD_UNAVAILABLE")
        lot.includes("RECORD_UNAVAILABLE")
    }
})
// the Warehouse groups reach the guarded entry points only through the app's screens (F3); with authorization disabled
// the entry points check the permission and the organization themselves
feature("the guarded adjustments refuse another organization's stock and a user without the permission", {
    when() {
        const task = "mantle.shipment.WarehouseTaskServices."
        const direct = (user, service, parameters, enabled = false) =>
            asUser(user, () => refusal(task + service, parameters), enabled)
        return {
            raw: direct(
                "warehouse.adjust",
                "scrap#Asset",
                {operationKey: "p6-access-0", assetId: ids.assetId, varianceReasonEnumId: "InVrScrap"},
                true
            ),
            otherPreview: direct("warehouse.adjust", "preview#StockAdjustment", {assetId: ids.otherAssetId, quantity: 1}),
            otherScrap: direct("warehouse.adjust", "scrap#Asset", {
                operationKey: "p6-access-1",
                assetId: ids.otherAssetId,
                varianceReasonEnumId: "InVrScrap"
            }),
            readerScrap: direct("warehouse.read", "scrap#Asset", {
                operationKey: "p6-access-2",
                assetId: ids.assetId,
                varianceReasonEnumId: "InVrScrap"
            }),
            readerAdjust: direct("warehouse.read", "adjust#Stock", {
                operationKey: "p6-access-3",
                assetId: ids.assetId,
                quantity: 1,
                previewFingerprint: "x",
                varianceReasonEnumId: "InVrLost"
            }),
            moverPreview: direct("warehouse.move", "preview#StockAdjustment", {assetId: ids.assetId, quantity: 1}),
            readerLot: direct("warehouse.read", "correct#LotMetadata", {
                operationKey: "p6-access-4",
                lotId: ids.lotId,
                expirationDate: "2028-12-31",
                changeReason: "Access"
            }),
            readerRepack: direct("warehouse.read", "repack#Asset", {
                operationKey: "p6-access-5",
                assetId: "BOSS_WH_CASES",
                quantity: 1
            }),
            otherRepack: direct("warehouse.move", "repack#Asset", {
                operationKey: "p6-access-6",
                assetId: ids.otherAssetId,
                quantity: 1
            }),
            page: asUser("warehouse.adjust", () =>
                lib.page("Inventory/Adjustments/scrapAsset", {
                    assetId: ids.otherAssetId,
                    varianceReasonEnumId: "InVrScrap",
                    operationKey: "p6-7"
                })
            )
        }
    },
    then(r) {
        r.raw.includes("is not authorized")
        r.otherPreview.includes("RECORD_UNAVAILABLE")
        r.otherScrap.includes("RECORD_UNAVAILABLE")
        r.readerScrap.includes("PERMISSION_DENIED")
        r.readerAdjust.includes("PERMISSION_DENIED")
        r.moverPreview.includes("PERMISSION_DENIED")
        r.readerLot.includes("PERMISSION_DENIED")
        r.readerRepack.includes("PERMISSION_DENIED")
        r.otherRepack.includes("RECORD_UNAVAILABLE")
        r.page.errors.join(" ").includes("RECORD_UNAVAILABLE")
    }
})
feature("Adjustments and Repack are filtered to the user's facilities, with authz #enabled", {
    where: both,
    when({enabled}) {
        return {
            own: asUser("warehouse.adjust", () => lib.page("Inventory/Adjustments", {assetId: ids.assetId}, "html"), enabled),
            other: asUser(
                "warehouse.adjust",
                () => lib.page("Inventory/Adjustments", {assetId: ids.otherAssetId}, "html"),
                enabled
            ),
            reader: asUser("warehouse.read", () => lib.page("Inventory/Adjustments", {assetId: ids.assetId}, "html"), enabled),
            repack: asUser(
                "warehouse.move",
                () => lib.page("Transfers/Repack", {facilityId: ids.otherFacilityId, productId: "BOSS_PRD_OWN"}, "html"),
                enabled
            )
        }
    },
    then({own, other, reader, repack}) {
        own.errors == []
        own.output.includes("Adjust this asset")
        other.output.includes("Choose the facility you work in")
        !other.output.includes(ids.otherAssetId + ":")
        reader.output.includes("needs the adjust permission")
        !reader.output.includes("Adjust this asset")
        repack.output.includes("Choose the facility you work in")
    }
})
// P7: receiving
feature(
    "Receipts is filtered for a capability user, and the receipt reads refuse a user without Warehouse, with authz #enabled",
    {
        where: both,
        when({enabled}) {
            const receipts = "ironstone.warehouse.ReceiptServices."
            return {
                list: asUser("warehouse.receive", () => lib.page("Receiving/Receipts", {statusId: "all"}, "html"), enabled),
                reader: asUser("warehouse.read", () => refusal(receipts + "get#Receipts", {}), enabled),
                outsider: asUser("finance.read", () => refusal(receipts + "get#Receipts", {}), enabled),
                detail: asUser(
                    "warehouse.read",
                    () => refusal(receipts + "get#ReceiptDetail", {shipmentId: "BOSS_WH_SHIP_IN"}),
                    enabled
                ),
                supplier: asUser(
                    "warehouse.read",
                    () => refusal(receipts + "get#SupplierReceiving", {vendorPartyId: "ZiddlemanInc"}),
                    enabled
                )
            }
        },
        then({list, reader, outsider, detail, supplier}) {
            list.errors == []
            list.output.includes("BOSS_WH_SHIP_IN")
            !list.output.includes(ids.otherShipmentId)
            // an outgoing shipment is not a receipt
            !list.output.includes(ids.shipmentId)
            reader == ""
            refused(outsider)
            detail == ""
            supplier == ""
        }
    }
)
feature("a forged receipt, return or supplier of another organization is refused by Receiving", {
    when() {
        const receipts = "ironstone.warehouse.ReceiptServices."
        return asUser("warehouse.receive", () => ({
            detail: refusal(receipts + "get#ReceiptDetail", {shipmentId: ids.otherShipmentId}),
            outgoing: refusal(receipts + "get#ReceiptDetail", {shipmentId: ids.shipmentId}),
            receive: refusal(receipts + "get#ReceiveContext", {shipmentId: ids.otherShipmentId}),
            products: refusal(receipts + "get#ReceiptChoices", {choice: "receiptProducts", shipmentId: ids.otherShipmentId}),
            customer: refusal(receipts + "get#SupplierReceiving", {vendorPartyId: "CustJqp"}),
            page: lib.page("Receiving/ReceiptDetail", {shipmentId: ids.otherShipmentId}, "html")
        }))
    },
    then({detail, outgoing, receive, products, customer, page}) {
        detail.includes("RECORD_UNAVAILABLE")
        outgoing.includes("RECORD_UNAVAILABLE")
        receive.includes("RECORD_UNAVAILABLE")
        products.includes("RECORD_UNAVAILABLE")
        customer.includes("SUPPLIER_UNAVAILABLE")
        page.output.includes("Receipt not available")
    }
})
// the receipt entry points, as the moves: no artifact authorization for the Warehouse groups (F3); with it disabled each
// checks STOCK_RECEIVE and the organization itself
feature("the receipt entry points refuse a user without the receive permission and another organization's receipt", {
    when() {
        const task = "mantle.shipment.WarehouseTaskServices."
        const direct = (user, service, parameters, enabled = false) =>
            asUser(user, () => refusal(task + service, parameters), enabled)
        return {
            raw: direct(
                "warehouse.receive",
                "close#ReceiptRemainder",
                {operationKey: "p7-access-0", shipmentId: "BOSS_WH_SHIP_IN", choice: "close", reason: "x"},
                true
            ),
            reader: direct("warehouse.read", "receive#ShipmentStock", {
                operationKey: "p7-access-1",
                shipmentId: "BOSS_WH_SHIP_IN",
                productId: "BOSS_WH_LOTTED",
                quantityAccepted: 1
            }),
            readerEnsure: direct("warehouse.read", "ensure#PurchaseReceipt", {
                operationKey: "p7-access-2",
                orderId: "BOSS_WH_PO",
                orderPartSeqId: "01"
            }),
            readerAdHoc: direct("warehouse.read", "receive#AdHocStock", {
                operationKey: "p7-access-3",
                facilityId: ids.facilityId,
                productId: "BOSS_WH_LOTTED",
                quantity: 1,
                reason: "x"
            }),
            other: direct("warehouse.receive", "close#ReceiptRemainder", {
                operationKey: "p7-access-4",
                shipmentId: ids.otherShipmentId,
                choice: "close",
                reason: "x"
            }),
            otherAdHoc: direct("warehouse.receive", "receive#AdHocStock", {
                operationKey: "p7-access-5",
                facilityId: ids.otherFacilityId,
                productId: "BOSS_WH_LOTTED",
                quantity: 1,
                reason: "x"
            })
        }
    },
    then({raw, reader, readerEnsure, readerAdHoc, other, otherAdHoc}) {
        raw.includes("is not authorized")
        reader.includes("PERMISSION_DENIED")
        readerEnsure.includes("PERMISSION_DENIED")
        readerAdHoc.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
        otherAdHoc.includes("RECORD_UNAVAILABLE")
    }
})

// Warehouse P11: the picking and outgoing shipment reads, the guarded picks and wave, and the Picking and Shipping mounts
const foreignLoad = "BOSS_PRD_P11_LOAD"
function withForeignLoad(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        if (!ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId: foreignLoad}).one())
            ec.service
                .sync()
                .name("create#mantle.work.effort.WorkEffort")
                .parameters({
                    workEffortId: foreignLoad,
                    workEffortTypeEnumId: "WetEvent",
                    purposeEnumId: "WepShipmentShip",
                    statusId: "WeInPlanning",
                    facilityId: ids.otherFacilityId,
                    workEffortName: "Foreign picks",
                    estimatedStartDate: ec.user.nowTimestamp
                })
                .call()
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.artifactExecution.disableAuthz()
        ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId: foreignLoad}).deleteAll()
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
const picking = "ironstone.warehouse.PickingServices."
feature("a list under Picking is filtered for a capability user, with authz #enabled", {
    where: both,
    when({enabled}) {
        return withForeignLoad(() =>
            asUser(
                "warehouse.pick",
                () => ({
                    list: lib.page("Picking/Picklists", {}, "html"),
                    rows: Array.from(invoke(picking + "get#Picklists", {pageSize: 100}).picklistRows).map(row => row.workEffortId),
                    foreign: refusal(picking + "get#PicklistDetail", {workEffortId: foreignLoad}),
                    foreignPick: refusal(picking + "get#PickContext", {workEffortId: foreignLoad}),
                    shipments: Array.from(invoke(picking + "get#Shipments", {pageSize: 100}).shipmentRows).map(row => row.shipmentId),
                    foreignShipment: refusal(picking + "get#OutboundDetail", {shipmentId: ids.otherShipmentId})
                }),
                enabled
            )
        )
    },
    then({list, rows, foreign, foreignPick, shipments, foreignShipment}) {
        list.errors == []
        list.output.includes("Morning picks")
        !list.output.includes("Foreign picks")
        rows.includes("BOSS_WH_LOAD")
        !rows.includes(foreignLoad)
        foreign.includes("RECORD_UNAVAILABLE")
        foreignPick.includes("RECORD_UNAVAILABLE")
        shipments.includes("BOSS_WH_SHIP_PICK")
        !shipments.includes(ids.otherShipmentId)
        foreignShipment.includes("RECORD_UNAVAILABLE")
    }
})
feature("the Picking area is for the pick, pick supervisor and move groups; a reader gets no picklist and no link", {
    when() {
        const link = user => asUser(user, () => invoke("ironstone.warehouse.AccessServices.search#Records", {text: "Morning picks"}).rows
            .map(row => row.url).join(" "))
        return {
            readerPage: asUser("warehouse.read", () => lib.page("Picking/Picklists", {}, "html")),
            moverPage: asUser("warehouse.move", () => lib.page("Picking/PickLocationMoves", {facilityId: ids.facilityId}, "html")),
            readerRows: asUser("warehouse.read", () => invoke(picking + "get#Picklists", {}).picklistRows.length),
            readerDetail: asUser("warehouse.read", () => refusal(picking + "get#PicklistDetail", {workEffortId: "BOSS_WH_LOAD"})),
            readerLink: link("warehouse.read"),
            pickerLink: link("warehouse.pick"),
            shipmentLink: asUser("warehouse.read", () => invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                recordEntityName: "mantle.shipment.Shipment",
                id: "BOSS_WH_SHIP_PICK"
            }).url)
        }
    },
    then({readerPage, moverPage, readerRows, readerDetail, readerLink, pickerLink, shipmentLink}) {
        readerPage.errors.length > 0 || !readerPage.output.includes("Morning picks")
        moverPage.errors == []
        moverPage.output.includes("Below minimum")
        readerRows == 0
        readerDetail.includes("RECORD_UNAVAILABLE")
        !readerLink.includes("PicklistDetail")
        pickerLink.includes("Picking/PicklistDetail?workEffortId=BOSS_WH_LOAD")
        String(shipmentLink).includes("Shipping/ShipmentDetail?shipmentId=BOSS_WH_SHIP_PICK")
    }
})
feature("an order's Warehouse fulfillment shows money only with financial read", {
    when() {
        return {
            reader: asUser("warehouse.read", () => invoke(picking + "get#OrderFulfillment", {orderId: "BOSS_WH_SO"})),
            admin: asUser("john.doe", () => invoke(picking + "get#OrderFulfillment", {orderId: "BOSS_WH_SO"})),
            readerOutbound: asUser("warehouse.read", () => invoke(picking + "get#OutboundDetail", {shipmentId: "BOSS_WH_SHIP_PICK"})),
            foreignOrder: asUser("warehouse.read", () => refusal(picking + "get#OrderFulfillment", {orderId: "NO_SUCH_ORDER"}))
        }
    },
    then({reader, admin, readerOutbound, foreignOrder}) {
        reader.orderFound == true
        reader.order.totalText == null
        reader.itemRows.every(row => row.amountText == null)
        reader.partRows.every(row => row.canCreateShipment == false)
        admin.order.totalText != null
        readerOutbound.lineRows.every(row => row.unitAmountText == null)
        foreignOrder.includes("RECORD_UNAVAILABLE")
    }
})
// P11 review A2: the Handheld area is open to every Warehouse user, so its Pick and PickFace mounts refuse in the reads
feature("Handheld Pick and PickFace show a reader no picklist and no pick face, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.read",
            () => ({
                pick: lib.page("Handheld/Pick", {workEffortId: "BOSS_WH_LOAD"}, "html"),
                face: lib.page("Handheld/PickFace", {facilityId: ids.facilityId}, "html"),
                context: refusal(picking + "get#PickContext", {workEffortId: "BOSS_WH_LOAD"}),
                shipmentContext: refusal(picking + "get#PickContext", {shipmentId: "BOSS_WH_SHIP_PICK"}),
                needs: refusal(picking + "get#PickFaceNeeds", {facilityId: ids.facilityId})
            }),
            enabled
        )
    },
    then({pick, face, context, shipmentContext, needs}) {
        !pick.output.includes("Pick demo bracket")
        !pick.output.includes("01020201")
        face.output.includes("need the pick, pick supervisor or move permission")
        context.includes("PERMISSION_DENIED")
        shipmentContext.includes("PERMISSION_DENIED")
        needs.includes("PERMISSION_DENIED")
    }
})
// the guarded picks: through the screens only (F3: no artifact authorization for the entry points); Mantle checks
// SHIPMENT_PICK, SHIPMENT_LOAD_EDIT and STOCK_MOVE and the organization itself
feature("the pick entry points refuse a user without the permission and another organization's shipment or load", {
    when() {
        const task = "mantle.shipment.WarehouseTaskServices."
        const work = "mantle.work.ShipmentWorkServices."
        const direct = (user, service, parameters, enabled = false) => asUser(user, () => refusal(service, parameters), enabled)
        return withForeignLoad(() => ({
            raw: direct("warehouse.pick", task + "pick#ShipmentStock", {operationKey: "p11-access-0", shipmentId: "BOSS_WH_SHIP_PICK",
                shipmentItemSourceId: "BOSS_WH_SIS_PICK", quantity: 1}, true),
            reader: direct("warehouse.read", task + "pick#ShipmentStock", {operationKey: "p11-access-1",
                shipmentId: "BOSS_WH_SHIP_PICK", shipmentItemSourceId: "BOSS_WH_SIS_PICK", quantity: 1}),
            readerShort: direct("warehouse.read", task + "record#ShortPick", {operationKey: "p11-access-2",
                shipmentId: "BOSS_WH_SHIP_PICK", shipmentItemSourceId: "BOSS_WH_SIS_PICK", quantityShort: 1,
                locationSeqId: "01020201", reasonEnumId: "SprNotFound"}),
            pickerWave: direct("warehouse.pick", work + "preview#ShipmentLoadsForOrders", {facilityId: ids.facilityId}),
            pickerFinishLoad: direct("warehouse.pick", task + "finish#Pick", {operationKey: "p11-access-3",
                workEffortId: "BOSS_WH_LOAD"}),
            supervisorForeign: direct("warehouse.picksupervisor", task + "finish#Pick", {operationKey: "p11-access-4",
                workEffortId: foreignLoad}),
            supervisorForeignWave: direct("warehouse.picksupervisor", work + "preview#ShipmentLoadsForOrders",
                {facilityId: ids.otherFacilityId}),
            pickerForeign: direct("warehouse.pick", task + "pick#ShipmentStock", {operationKey: "p11-access-5",
                shipmentId: ids.otherShipmentId, shipmentItemSourceId: "x", quantity: 1}),
            readerFaces: direct("warehouse.read", task + "find#PickFaceReplenishment", {facilityId: ids.facilityId})
        }))
    },
    then({raw, reader, readerShort, pickerWave, pickerFinishLoad, supervisorForeign, supervisorForeignWave, pickerForeign,
        readerFaces}) {
        raw.includes("is not authorized")
        reader.includes("PERMISSION_DENIED")
        readerShort.includes("PERMISSION_DENIED")
        pickerWave.includes("PERMISSION_DENIED")
        pickerFinishLoad.includes("PERMISSION_DENIED")
        supervisorForeign.includes("RECORD_UNAVAILABLE")
        supervisorForeignWave.includes("RECORD_UNAVAILABLE")
        pickerForeign.includes("RECORD_UNAVAILABLE")
        readerFaces.includes("PERMISSION_DENIED")
    }
})

// Warehouse P9: the putaway reads, the putaway entry point and the rule store
const putaways = "ironstone.warehouse.PutawayServices."
const putawayCalls = [
    {service: putaways + "get#PutawayContext", parameters: {facilityId: ids.facilityId}},
    {service: putaways + "get#PutawayQueueCounts", parameters: {facilityId: ids.facilityId}},
    {service: putaways + "get#PutawayRuleContext", parameters: {facilityId: ids.facilityId}},
    {service: putaways + "get#PutawayChoices", parameters: {choice: "categories"}}
]
feature("#service answers a reader and refuses a user without Warehouse", {
    where: putawayCalls,
    when({service, parameters}) {
        return {
            reader: asUser("warehouse.read", () => refusal(service, parameters)),
            finance: asUser("finance.read", () => refusal(service, parameters), false)
        }
    },
    then({reader, finance}) {
        reader == ""
        finance.includes("WAREHOUSE_UNAVAILABLE")
    }
})
feature("the putaway queue is filtered for a capability user, and forged stock or facilities are refused, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            "warehouse.move",
            () => ({
                queue: lib.page("Receiving/Putaway", {facilityId: ids.facilityId}, "html"),
                otherQueue: lib.page("Receiving/Putaway", {facilityId: ids.otherFacilityId}, "html"),
                facility: refusal(putaways + "get#PutawayContext", {facilityId: ids.otherFacilityId}),
                asset: refusal(putaways + "get#PutawayContext", {facilityId: ids.facilityId, assetId: ids.otherAssetId}),
                rules: refusal(putaways + "get#PutawayRuleContext", {facilityId: ids.otherFacilityId}),
                areas: refusal(putaways + "get#PutawayChoices", {choice: "areas", facilityId: ids.otherFacilityId}),
                post: lib.page("Receiving/Putaway/putawayStock", {assetId: ids.otherAssetId, operationKey: "p9-access-0"})
            }),
            enabled
        )
    },
    then({queue, otherQueue, facility, asset, rules, areas, post}) {
        queue.errors == []
        queue.output.includes("BOSS_WH_LOT_HOLD")
        !queue.output.includes("BOSS_PRD_")
        otherQueue.output.includes("Choose the facility you work in")
        facility.includes("FACILITY_UNAVAILABLE")
        asset.includes("RECORD_UNAVAILABLE")
        rules.includes("FACILITY_UNAVAILABLE")
        areas.includes("FACILITY_UNAVAILABLE")
        post.errors.join(" ").includes("RECORD_UNAVAILABLE")
    }
})
// as the moves: no artifact authorization for the Warehouse groups on the Mantle services (F3); with it disabled each
// checks its permission and the organization itself
feature("the putaway entry point and the rule store refuse a user without the permission and another organization's records", {
    when() {
        const direct = (user, service, parameters, enabled = false) => asUser(user, () => refusal(service, parameters), enabled)
        const putaway = "mantle.shipment.WarehouseTaskServices.putaway#Stock"
        const store = "mantle.facility.PutawayServices.store#PutawayRule"
        const rule = {facilityId: ids.facilityId, productId: "BOSS_WH_LOTTED", toLocationSeqId: "01020302", changeReason: "x"}
        return {
            raw: direct("warehouse.move", putaway, {operationKey: "p9-access-1", assetId: "BOSS_WH_LOT_HOLD"}, true),
            rawRule: direct("warehouse.facility", store, rule, true),
            reader: direct("warehouse.read", putaway, {operationKey: "p9-access-2", assetId: "BOSS_WH_LOT_HOLD"}),
            other: direct("warehouse.move", putaway, {operationKey: "p9-access-3", assetId: ids.otherAssetId}),
            mover: direct("warehouse.move", store, rule),
            otherRule: direct("warehouse.facility", store, Object.assign({}, rule, {facilityId: ids.otherFacilityId})),
            page: asUser("warehouse.move", () => lib.page("Locations/PutawayRules/storeRule", rule))
        }
    },
    then({raw, rawRule, reader, other, mover, otherRule, page}) {
        raw.includes("is not authorized")
        rawRule.includes("is not authorized")
        reader.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
        mover.includes("PERMISSION_DENIED")
        otherRule.includes("FACILITY_UNAVAILABLE")
        page.errors.join(" ").includes("PERMISSION_DENIED")
    }
})
