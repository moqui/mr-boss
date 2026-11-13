// Warehouse access (impl-warehouse §2, §4, P1): one feature per access rule, each run once with artifact authorization
// on. Who may open Warehouse, the capabilities its groups' Mantle permissions give, the facility scope from the root
// grants' organization filters and what may not widen it, another organization's records refused like missing ones, a
// write refused for its permission, the Mantle entry points and REST stock paths reached only through the screens (F3),
// and the record links of a Warehouse-only user. Each area's lists and screens are checked by that area's spec; the walks
// of every route and user are test/acceptance/Warehouse/WarehouseAccessWalk.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {ids, asUser, refusal, invoke} = lib
const access = "ironstone.warehouse.AccessServices."
const task = "mantle.shipment.WarehouseTaskServices."
// a refusal of a user without Warehouse: the service is not authorized for them, or it refuses them itself
const refused = message => /WAREHOUSE_UNAVAILABLE|is not authorized/.test(message)
// the problem when message is not the expected answer: "" for a call that passes, else a reason code it must name
function outcome(name, message, reason) {
    if (reason === "") return message === "" ? [] : [`${name} is refused: ${message}`]
    return String(message).includes(reason) ? [] : [`${name} is not refused with ${reason}: ${message || "it passed"}`]
}
function make(entity, fields) {
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(fields)
        .disableAuthz()
        .call()
}
function removeAll(entity, condition) {
    ec.entity.find(entity).condition(condition).disableAuthz().deleteAll()
}

// The problem when a user's context does not default a new record to Retail with Retail's returns center in their scope.
function defaultOrganization(user) {
    const found = asUser(user, () => invoke(access + "get#SharedContext", {}))
    const scope = Array.from(found.organizationPartyIds || [])
    return scope.includes("BOSS_WH_RETURNS") && found.defaultOrganizationPartyId === "ORG_ZIZI_RETAIL"
        ? []
        : [`${user}'s default organization: ${found.defaultOrganizationPartyId} of ${scope}`]
}
feature("Warehouse opens to its groups: a holder gets the context and an area read, others are refused", {
    when() {
        const context = (user, parameters = {}) => asUser(user, () => refusal(access + "get#SharedContext", parameters))
        const assets = user => asUser(user, () => refusal("ironstone.warehouse.InventoryServices.find#Assets", {}))
        const picklist = user =>
            asUser(user, () => refusal("ironstone.warehouse.PickingServices.get#PicklistDetail", {workEffortId: "BOSS_WH_LOAD"}))
        return {
            problems: [
                ...outcome("the reader's context", context("warehouse.read"), ""),
                ...outcome("the administrator's context", context("warehouse.admin"), ""),
                ...outcome("the reader's Inventory read", assets("warehouse.read"), ""),
                ...outcome("the context under Accounting's root", context("warehouse.read", {appRoot: "Accounting"}),
                    "WAREHOUSE_CONTEXT"),
                // the Picking area is for its groups: the picker reads the picklist the reader is refused
                ...outcome("the picker's picklist", picklist("warehouse.pick"), ""),
                ...outcome("the reader's picklist", picklist("warehouse.read"), "RECORD_UNAVAILABLE"),
                // a new record's organization is the reader's own (Retail), though their scope also holds Retail's rollup child, the
                // returns center (impl-sales F111)
                ...defaultOrganization("warehouse.read")
            ],
            outsiders: [
                context("finance.read"),
                context("catalog.stock.plan"),
                assets("finance.read"),
                asUser("finance.read", () =>
                    refusal("ironstone.warehouse.PolicyServices.get#Pools", {appRoot: "Warehouse"}))
            ]
        }
    },
    then({problems, outsiders}) {
        problems.join("\n") == ""
        outsiders.filter(message => !refused(message)) == []
    }
})

const capabilityUsers = {
    "warehouse.read": [],
    "warehouse.receive": ["receive"],
    "warehouse.issue": ["issue"],
    "warehouse.move": ["move"],
    "warehouse.adjust": ["adjust"],
    "warehouse.count": ["count"],
    "warehouse.countreview": ["countReview"],
    "warehouse.pick": ["pick"],
    "warehouse.picksupervisor": ["loadEdit"],
    "warehouse.pack": ["pack"],
    "warehouse.ship": ["ship"],
    "warehouse.inspect": ["inspect"],
    "warehouse.quality": ["lotExpiryExtend", "qualityVerify", "qualityDispose", "qualityTemplateEdit"],
    "warehouse.facility": ["facilityEdit", "policyPlan", "policyManage"],
    "warehouse.manager": ["policyPlan", "policyManage"],
    "warehouse.planner": ["policyPlan"]
}
const stockCapabilities = ["receive", "issue", "move", "adjust", "count", "countReview", "lotExpiryExtend", "pick", "loadEdit",
    "pack", "ship", "facilityEdit", "inspect", "qualityVerify", "qualityDispose", "qualityTemplateEdit", "policyPlan",
    "policyManage"]
feature("each group holds exactly its permissions' capabilities, and money shows only with financial read", {
    when() {
        const problems = []
        const capabilitiesOf = user => asUser(user, () => invoke(access + "get#SharedContext", {}).capabilities)
        for (const [user, granted] of Object.entries(capabilityUsers)) {
            const capabilities = capabilitiesOf(user)
            const held = stockCapabilities.filter(name => capabilities[name]).join(",")
            if (held !== granted.join(",")) problems.push(`${user} holds ${held}, not ${granted}`)
            if (capabilities.read !== true) problems.push(`${user} cannot read`)
            if (capabilities.financialRead !== false) problems.push(`${user} has financial read`)
        }
        const admin = asUser("warehouse.admin", () => invoke(access + "get#SharedContext", {}))
        const missing = stockCapabilities.filter(name => !admin.capabilities[name])
        if (missing.length) problems.push(`the administrator lacks ${missing}`)
        // a capability's effect: an order's fulfillment has its amounts for a user with financial read only
        const fulfillment = user =>
            asUser(user, () => invoke("ironstone.warehouse.PickingServices.get#OrderFulfillment", {orderId: "BOSS_WH_SO"}))
        const reader = fulfillment("warehouse.read")
        if (reader.orderFound !== true) problems.push("the reader does not find the order")
        if (reader.order?.totalText != null || reader.itemRows.some(row => row.amountText != null))
            problems.push("the reader sees the order's amounts")
        if (fulfillment("john.doe").order?.totalText == null) problems.push("the finance user does not see the order total")
        return {problems, allFacilities: admin.allFacilities}
    },
    then({problems, allFacilities}) {
        problems.join("\n") == ""
        allFacilities == true
    }
})

feature("a user's facilities are their organization's, and neither a chosen nor a given facility widens them", {
    when() {
        return asUser("warehouse.read", () => {
            const choices = parameters =>
                invoke(access + "get#Choices", Object.assign({choice: "facilities", term: ""}, parameters)).options.map(
                    row => row.value)
            const options = choices({})
            const selected = choices({selected: ids.otherFacilityId})
            const assets = invoke("ironstone.warehouse.InventoryServices.find#Assets", {showEmpty: true, pageNoLimit: true})
                .assetList.map(row => row.assetId)
            const chosen = invoke(access + "select#Facility", {facilityId: ids.eastFacilityId}).facilityId
            const afterChoice = invoke(access + "get#SharedContext", {}).facilityId
            const forged = refusal(access + "select#Facility", {facilityId: ids.otherFacilityId})
            // a preference set elsewhere to another organization's facility is ignored where it is read
            ec.user.setPreference("FacilityActive", ids.otherFacilityId)
            const ignored = invoke(access + "get#SharedContext", {}).facilityId
            invoke(access + "select#Facility", {})
            const problems = [
                ...(options.includes(ids.facilityId) && options.includes(ids.eastFacilityId) ? [] : [`own facilities ${options}`]),
                ...(options.includes(ids.otherFacilityId) ? ["another organization's facility is a choice"] : []),
                ...(selected.includes(ids.otherFacilityId) ? ["another organization's facility is a choice once selected"] : []),
                ...(assets.includes(ids.eastAssetId) ? [] : ["the reader's east asset is not listed"]),
                ...(assets.includes(ids.otherAssetId) ? ["another organization's asset is listed"] : []),
                ...(chosen === ids.eastFacilityId && afterChoice === ids.eastFacilityId ? [] : [`chosen ${chosen}, ${afterChoice}`]),
                ...outcome("choosing another organization's facility", forged, "FACILITY_UNAVAILABLE"),
                ...(ignored == null ? [] : [`the preference of another organization's facility gives ${ignored}`]),
                ...outcome("another organization's facility given", refusal(access + "get#SharedContext",
                    {facilityId: ids.otherFacilityId}), "FACILITY_UNAVAILABLE"),
                ...outcome("a scan in another organization's facility", refusal(access + "get#ScannedRecord",
                    {scanText: "PICK", facilityId: ids.otherFacilityId}), "FACILITY_UNAVAILABLE"),
                ...outcome("an unknown choice", refusal(access + "get#Choices", {choice: "everything"}), "Unknown Warehouse choice")
            ]
            return {problems, allFacilities: invoke(access + "get#SharedContext", {}).allFacilities}
        })
    },
    then({problems, allFacilities}) {
        problems.join("\n") == ""
        allFacilities == false
    }
})

// The scope is read from the root grants' organization filters: another active organization, a grant with no filter set
// and a user in no organization widen nothing, and every grant on a restricted area carries the root's filter sets
// (MANTLE_USER_ORG and MANTLE_PRIVATE_CONTACT, the admin group's MANTLE_ACTIVE_ORG and MANTLE_PRIVATE_CONTACT).
feature("nothing outside the root grants widens the scope: an active organization, a bare grant, no organization", {
    given() {
        make("mantle.party.Party", {partyId: "BOSS_WH_SPEC_NOORG", partyTypeEnumId: "PtyPerson"})
        make("moqui.security.UserAccount", {userId: "BOSS_WH_SPEC_NOORG", username: "warehouse.spec.noorg",
            partyId: "BOSS_WH_SPEC_NOORG", currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394", passwordHashType: "SHA"})
        make("moqui.security.UserGroupMember", {userGroupId: "BOSS_WAREHOUSE", userId: "BOSS_WH_SPEC_NOORG", fromDate: 0})
        // the reader is also an Accounting administrator, who may make another organization active
        make("moqui.security.UserGroupMember", {userGroupId: "BOSS_ACCOUNTING_ADMIN", userId: "BOSS_WH_READ", fromDate: 0})
        // a misconfigured grant: the root authorized for the receive group with no filters at all
        make("moqui.security.ArtifactAuthz", {artifactAuthzId: "BOSS_WH_SPEC_BARE", userGroupId: "BOSS_WAREHOUSE_RECEIVE",
            artifactGroupId: "BOSS_WAREHOUSE", authzTypeEnumId: "AUTHZT_ALWAYS", authzActionEnumId: "AUTHZA_ALL"})
        return {}
    },
    when() {
        const problems = []
        const active = asUser("warehouse.read", () => {
            ec.user.setPreference("ACTIVE_ORGANIZATION", "ORG_ZIZI_SERVICES")
            try {
                const info = ec.service.sync().name("mantle.party.PartyServices.get#PartyOrganizationInfo").disableAuthz().call()
                const context = invoke(access + "get#SharedContext", {})
                const options = invoke(access + "get#Choices", {choice: "facilities"}).options.map(row => row.value)
                if (context.activeOrganizationPartyId != null || context.allFacilities !== false)
                    problems.push("the active organization widens the reader's context")
                if (options.includes(ids.otherFacilityId) || !options.includes(ids.facilityId))
                    problems.push(`the reader's facilities with another active organization: ${options}`)
                problems.push(...outcome("the active organization's asset",
                    refusal(access + "check#Record", {recordType: "asset", recordId: ids.otherAssetId}), "RECORD_UNAVAILABLE"))
                problems.push(...outcome("the reader's own asset",
                    refusal(access + "check#Record", {recordType: "asset", recordId: ids.assetId}), ""))
                return info.activeOrgId
            } finally {
                ec.user.setPreference("ACTIVE_ORGANIZATION", null)
            }
        })
        asUser("warehouse.receive", () => {
            if (invoke(access + "get#SharedContext", {}).allFacilities !== false) problems.push("a bare grant gives every facility")
            problems.push(...outcome("another organization's facility with a bare grant",
                refusal(access + "check#Record", {recordType: "facility", recordId: ids.otherFacilityId}), "RECORD_UNAVAILABLE"))
        })
        asUser("warehouse.spec.noorg", () => {
            const context = invoke(access + "get#SharedContext", {})
            if (context.facilityCount !== 0 || context.facilityId != null) problems.push("a user in no organization has a facility")
            problems.push(...outcome("an asset for a user in no organization",
                refusal(access + "check#Record", {recordType: "asset", recordId: ids.assetId}), "RECORD_UNAVAILABLE"))
        })
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            const grants = Array.from(ec.entity.find("moqui.security.ArtifactAuthz")
                .condition("artifactGroupId", "in", ["BOSS_WH_INSPECTION", "BOSS_WH_COUNTS", "BOSS_WH_PICKING",
                    "BOSS_WH_NEW_RECEIPT", "BOSS_WH_NEW_TRANSFER", "BOSS_WH_NEW_COUNT"])
                .condition("authzTypeEnumId", "not-equals", "AUTHZT_DENY").list())
            for (const grant of grants) {
                const sets = Array.from(ec.entity.find("moqui.security.ArtifactAuthzFilter")
                    .condition("artifactAuthzId", grant.artifactAuthzId).list())
                    .map(row => row.entityFilterSetId).sort().join(",")
                const expected = grant.userGroupId === "BOSS_WAREHOUSE_ADMIN" ? "MANTLE_ACTIVE_ORG,MANTLE_PRIVATE_CONTACT"
                    : "MANTLE_PRIVATE_CONTACT,MANTLE_USER_ORG"
                if (sets !== expected) problems.push(`grant ${grant.artifactAuthzId} has the filter sets ${sets}`)
            }
            return {problems, active, grantCount: grants.length}
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
    },
    then({problems, active, grantCount}) {
        problems.join("\n") == ""
        // Mantle lets the finance administrator make the other organization active
        active == "ORG_ZIZI_SERVICES"
        // the three areas' 11 and the receipt, transfer and count quick creates' two each (P18)
        grantCount == 17
    },
    cleanup() {
        // the spec user leaves the Warehouse group; the party and account stay, as other records the account made refer to them
        removeAll("moqui.security.UserGroupMember", {userId: "BOSS_WH_SPEC_NOORG"})
        removeAll("moqui.security.UserGroupMember", {userGroupId: "BOSS_ACCOUNTING_ADMIN", userId: "BOSS_WH_READ"})
        removeAll("moqui.security.ArtifactAuthz", {artifactAuthzId: "BOSS_WH_SPEC_BARE"})
    }
})

feature("another organization's record is refused like a missing one, by the record check and by an area's reads", {
    when() {
        const check = parameters => refusal(access + "check#Record", parameters)
        const reader = asUser("warehouse.read", () => {
            const problems = []
            for (const [recordType, own, other] of [["facility", ids.eastFacilityId, ids.otherFacilityId],
                ["asset", ids.assetId, ids.otherAssetId], ["shipment", ids.transferShipmentId, ids.otherShipmentId]]) {
                problems.push(...outcome(`the reader's ${recordType}`, check({recordType, recordId: own}), ""))
                problems.push(...outcome(`another organization's ${recordType}`, check({recordType, recordId: other}),
                    "RECORD_UNAVAILABLE"))
            }
            problems.push(...outcome("a missing asset", check({recordType: "asset", recordId: "BOSS_WH_NONE_SUCH"}),
                "RECORD_UNAVAILABLE"))
            problems.push(...outcome("another organization's location", check({recordType: "location", recordId: "PICK",
                facilityId: ids.otherFacilityId}), "RECORD_UNAVAILABLE"))
            problems.push(...outcome("the reader's location", check({recordType: "location", recordId: "0901",
                facilityId: ids.facilityId}), ""))
            problems.push(...outcome("Inventory's asset detail",
                refusal("ironstone.warehouse.InventoryServices.get#AssetDetail", {assetId: ids.otherAssetId}), "RECORD_UNAVAILABLE"))
            problems.push(...outcome("Shipping's outbound detail",
                refusal("ironstone.warehouse.PickingServices.get#OutboundDetail", {shipmentId: ids.otherShipmentId}),
                "RECORD_UNAVAILABLE"))
            if (invoke(access + "get#ScannedRecord", {scanText: ids.otherAssetId}).matches.length)
                problems.push("a scan names another organization's asset")
            // the record files panel under the Warehouse root, as the client loads it
            const files = assetId => {
                const out = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Warehouse.xml")
                    .render("RecordFiles/filesData", {recordEntity: "mantle.product.asset.Asset", recordId: assetId}, null)
                ec.message.clearErrors()
                try {
                    return JSON.parse(String(out.output || "{}"))
                } catch (error) {
                    return {}
                }
            }
            if (files(ids.assetId).visible !== true) problems.push("the reader's asset has no files panel")
            if (files(ids.otherAssetId).visible !== false) problems.push("another organization's asset has a files panel")
            return problems
        })
        const facility = asUser("warehouse.facility", () => [
            ...outcome("the facility admin's FacilityDetail",
                refusal("ironstone.warehouse.FacilityServices.get#FacilityDetail", {facilityId: ids.facilityId}), ""),
            ...outcome("another organization's FacilityDetail",
                refusal("ironstone.warehouse.FacilityServices.get#FacilityDetail", {facilityId: ids.otherFacilityId}),
                "RECORD_UNAVAILABLE")
        ])
        return {problems: reader.concat(facility)}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// A write is refused for its permission: the same move of the reader's own stock that the mover's check passes, and the
// mover is refused another organization's stock for the record, not the permission.
feature("a write is refused for its permission: the reader may not move stock the mover may", {
    when() {
        const moveCheck = user => asUser(user, () =>
            refusal(access + "check#Record", {recordType: "asset", recordId: ids.assetId, capability: "move"}))
        const receiveCheck = user => asUser(user, () =>
            refusal(access + "check#Record", {recordType: "shipment", recordId: "BOSS_WH_SHIP_IN", capability: "receive"}))
        const move = (user, assetId, key) => asUser(user, () => lib.page("Handheld/Move/moveStock",
            {assetId, toLocationSeqId: "0701", operationKey: key}).errors.join(" "))
        return {
            problems: [
                ...outcome("the mover's move check", moveCheck("warehouse.move"), ""),
                ...outcome("the reader's move check", moveCheck("warehouse.read"), "PERMISSION_DENIED"),
                ...outcome("the receiver's receive check", receiveCheck("warehouse.receive"), ""),
                ...outcome("the reader's receive check", receiveCheck("warehouse.read"), "PERMISSION_DENIED"),
                ...outcome("the reader's move", move("warehouse.read", ids.assetId, "wa-move-1"), "PERMISSION_DENIED"),
                ...outcome("the mover's move of another organization's stock",
                    move("warehouse.move", ids.otherAssetId, "wa-move-2"), "RECORD_UNAVAILABLE")
            ]
        }
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// F3: the Warehouse groups reach Mantle's guarded stock entry points only through the app's screens, and no Mantle REST
// stock mutator at all
feature("the Mantle stock entry points and REST mutators are not authorized for a Warehouse user alone (F3)", {
    when() {
        const problems = []
        asUser("warehouse.move", () => problems.push(...outcome("a direct move#Stock",
            refusal(task + "move#Stock", {operationKey: "wa-f3-1", assetId: ids.assetId, toLocationSeqId: "0701"}),
            "is not authorized")))
        asUser("warehouse.facility", () => problems.push(...outcome("a direct store#Facility",
            refusal("mantle.facility.FacilityServices.store#Facility", {facilityId: ids.facilityId, facilityName: "x"}),
            "is not authorized")))
        asUser("warehouse.admin", () => {
            for (const path of ["s1/mantle/assets/receive", "s1/mantle/shipments/BOSS_WH_SHIP_IN/receive",
                "s1/mantle/shipments/BOSS_WH_SHIP_OUT/issue",
                "s1/mantle/facilities/ZIRET_WH/products/BOSS_WH_LOTTED/physicalChange"]) {
                const rendered = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot/rest.xml")
                    .render(path, {quantity: "1"}, "post")
                if (![401, 403].includes(rendered.status)) problems.push(`${path}: ${rendered.status}`)
                ec.message.clearErrors()
            }
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// Standalone: a Warehouse-only user's record links open Warehouse's own screens, never another app's
feature("a Warehouse-only user's record links open Warehouse screens, and only for records it may see", {
    when() {
        const link = (user, parameters) =>
            asUser(user, () => invoke("ironstone.commons.PaletteServices.get#RecordLink", parameters).url || null)
        const count = {recordEntityName: "mantle.product.asset.PhysicalInventory", id: ids.countId}
        return {
            product: link("warehouse.read", {docType: "MantleProduct", id: "BOSS_WH_SERIAL"}),
            otherProduct: link("warehouse.read", {docType: "MantleProduct", id: "BOSS_PRD_OWN"}),
            finance: link("finance.read", {docType: "MantleProduct", id: "BOSS_WH_SERIAL"}),
            admin: link("john.doe", {docType: "MantleProduct", id: "BOSS_WH_SERIAL"}),
            shipment: link("warehouse.read", {recordEntityName: "mantle.shipment.Shipment", id: "BOSS_WH_SHIP_PICK"}),
            readerCount: link("warehouse.read", count),
            counterCount: link("warehouse.count", count)
        }
    },
    then({product, otherProduct, finance, admin, shipment, readerCount, counterCount}) {
        product == "/qapps/Warehouse/Inventory/Product360?productId=BOSS_WH_SERIAL"
        otherProduct == null
        finance == null
        admin == "/qapps/Products/Products/Product360?productId=BOSS_WH_SERIAL"
        String(shipment).includes("Shipping/ShipmentDetail?shipmentId=BOSS_WH_SHIP_PICK")
        // the reader may not open Counts, so its count link is the lookup
        String(readerCount).includes("Home?lookupType=count")
        String(counterCount).includes("Counts/CountDetail?physicalInventoryId=" + ids.countId)
    }
})
