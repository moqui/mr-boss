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
feature("a Warehouse-only user gets no Products link for a product they read", {
    when() {
        const link = user =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {docType: "MantleProduct", id: "BOSS_WH_SERIAL"})
                        .url || null
            )
        return {warehouse: link("warehouse.read"), admin: link("john.doe")}
    },
    then({warehouse, admin}) {
        warehouse == null
        admin == "/qapps/Products/Products/Product360?productId=BOSS_WH_SERIAL"
    }
})

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
