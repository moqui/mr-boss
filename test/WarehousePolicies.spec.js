// Warehouse P3 policies (impl-warehouse P3): the settings screens and FacilityDetail's Policies tab render for a reader
// and a manager, a manager changes a facility's operation policy and reservation default and a reader cannot, the
// trace names each value's source, a store's setting wins for its orders only, pools stay in their organization, and
// every choice answers a selected value outside the page.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {ids, asUser, refusal, invoke, page} = lib
const policies = "ironstone.warehouse.PolicyServices.",
    access = "ironstone.warehouse.AccessServices.",
    W = "mantle.facility.WarehousePolicyServices."
const tab = "component://mr-boss/screen/Shared/FacilityDetail/Policies.xml"
// FacilityDetail's Policies tab rendered on its own with the parameters FacilityDetail passes
function policiesTab(facilityId) {
    const result = ec.screen.makeTest().rootScreen(tab).renderMode("html").render("", {appRoot: "Warehouse", facilityId}, null)
    const output = String(result.output || "")
    const errors = Array.from(result.errorMessages || []).concat(
        output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    )
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// a transition posted as the browser does, under the Warehouse root with artifact authorization
function post(path, parameters) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("apps/Warehouse/" + path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return errors
}
const otherPoolId = "BOSS_WH_SPEC_OTHER_POOL"
spec({
    setupSpec() {
        asUser("john.doe", () => {
            ec.artifactExecution.disableAuthz()
            if (!ec.entity.find("mantle.product.asset.AssetPool").condition({assetPoolId: otherPoolId}).one())
                ec.service
                    .sync()
                    .name("create#mantle.product.asset.AssetPool")
                    .parameters({assetPoolId: otherPoolId, pseudoId: "SERVICES-POOL", ownerPartyId: "ORG_ZIZI_SERVICES"})
                    .call()
        })
    },
    cleanupSpec() {
        asUser("john.doe", () => {
            ec.artifactExecution.disableAuthz()
            ec.entity.find("mantle.product.asset.AssetPool").condition({assetPoolId: otherPoolId}).deleteAll()
        })
    }
})

feature("a reader reads the effective policy at their facility with its sources and cannot change it", {
    when() {
        return asUser("warehouse.read", () => ({
            policy: invoke(policies + "get#PolicyContext", {appRoot: "Warehouse", facilityId: ids.facilityId}).policy,
            other: refusal(policies + "get#PolicyContext", {appRoot: "Warehouse", facilityId: ids.otherFacilityId}),
            // Mantle refuses on its own, also with artifact authorization off
            store: asUser(
                "warehouse.read",
                () =>
                    refusal(W + "store#OperationPolicy", {facilityId: ids.facilityId, receiptSteps: 2, changeReason: "Refused"}),
                false
            ),
            posted: post("Settings/StockPolicies/OperationPolicy/storeOperationPolicy", {
                facilityId: ids.facilityId,
                receiptSteps: "2",
                changeReason: "Refused"
            }),
            check: refusal(access + "check#Record", {
                recordType: "facility",
                recordId: ids.facilityId,
                capability: "policyManage"
            })
        }))
    },
    then({policy, other, store, posted, check}) {
        posted.includes("PERMISSION_DENIED")
        policy.available == true
        policy.canManage == false
        policy.traceRows.find(row => row.field === "deliverySteps").sourceText == "Organization: Ziziwork Retail & Wholesale"
        policy.traceRows.find(row => row.field === "deliverySteps").valueText == "3 steps: pick, pack, then ship"
        policy.traceRows.find(row => row.field === "overReceiptPercent").sourceText == "Built-in default"
        policy.traceRows.find(row => row.field === "overReceiptPercent").valueText == "0%"
        other.includes("FACILITY_UNAVAILABLE")
        store.includes("authority")
        check.includes("PERMISSION_DENIED")
    }
})

let firstFromDate
feature("a manager sets a facility to two-step receipt and a facility reservation default; each change keeps history", {
    when() {
        return asUser("warehouse.manager", () => {
            const before = invoke(policies + "get#PolicyContext", {appRoot: "Warehouse", facilityId: ids.eastFacilityId}).policy
            const check = refusal(access + "check#Record", {
                recordType: "facility",
                recordId: ids.eastFacilityId,
                capability: "policyManage"
            })
            const operation = post("Settings/StockPolicies/OperationPolicy/storeOperationPolicy", {
                facilityId: ids.eastFacilityId,
                expectedFromDate: before.operationSettings.expectedFromDate,
                receiptSteps: "2",
                receivingLocationSeqId: "E0801",
                changeReason: "Two-step receipt at the east warehouse"
            })
            const reservation = post("Settings/ReservationPolicies/FacilityReservation/storeReservationPolicy", {
                facilityId: ids.eastFacilityId,
                reservationOrderEnumId: "AsResOrdFifoExp",
                changeReason: "Expiring stock first"
            })
            const after = invoke(policies + "get#PolicyContext", {appRoot: "Warehouse", facilityId: ids.eastFacilityId}).policy
            firstFromDate = after.operationSettings.expectedFromDate
            return {before, check, operation, reservation, after}
        })
    },
    then({before, check, operation, reservation, after}) {
        before.canManage == true
        check == ""
        operation == ""
        reservation == ""
        after.traceRows.find(row => row.field === "receiptSteps").valueText.startsWith("2 steps")
        after.traceRows.find(row => row.field === "receiptSteps").sourceText == "Facility: Ziziwork Retail East Warehouse"
        after.traceRows.find(row => row.field === "receivingLocationSeqId").valueText == "E0801"
        after.traceRows.find(row => row.field === "reservationOrderEnumId").valueText == "FIFO Expire"
        after.operationHistory.length == 1
        after.operationHistory[0].changeReason == "Two-step receipt at the east warehouse"
        firstFromDate != ""
    }
})

feature("the preview names the store's own reservation order for that store's orders only", {
    when() {
        return asUser("warehouse.manager", () => ({
            store: invoke(policies + "get#PolicyContext", {
                appRoot: "Warehouse",
                productStoreId: "POPC_DEFAULT",
                policyTypes: "reservation"
            }).policy,
            facility: invoke(policies + "get#PolicyContext", {appRoot: "Warehouse", facilityId: ids.facilityId}).policy
        }))
    },
    then({store, facility}) {
        store.traceRows.find(row => row.field === "reservationOrderEnumId").sourceText == "Store: Ziziwork Retail Store"
        store.store.storeName == "Ziziwork Retail Store"
        facility.traceRows.find(row => row.field === "reservationOrderEnumId").sourceText == "Built-in default"
    }
})

feature("pools and tracking exceptions stay in the user's organizations", {
    when() {
        return asUser("warehouse.read", () => ({
            pools: invoke(policies + "get#Pools", {appRoot: "Warehouse"}).poolRows.map(row => row.assetPoolId),
            own: invoke(policies + "get#PoolDetail", {appRoot: "Warehouse", assetPoolId: "BOSS_WH_POOL"}),
            other: refusal(policies + "get#PoolDetail", {appRoot: "Warehouse", assetPoolId: otherPoolId}),
            exceptions: invoke(policies + "get#TrackingExceptions", {appRoot: "Warehouse"}).exceptionRows.map(
                row => row.productId
            ),
            create: asUser(
                "warehouse.read",
                () =>
                    refusal("mantle.product.AssetPoolServices.store#AssetPool", {
                        ownerPartyId: "ORG_ZIZI_RETAIL",
                        pseudoId: "REFUSED",
                        changeReason: "Refused"
                    }),
                false
            )
        }))
    },
    then({pools, own, other, exceptions, create}) {
        pools.includes("BOSS_WH_POOL")
        !pools.includes(otherPoolId)
        own.partyRows[0].partyName == "Joe Q Public"
        own.storeRows[0].storeName == "Ziziwork Retail Store"
        other.includes("POOL_UNAVAILABLE")
        exceptions.includes("BOSS_WH_LOTTED")
        exceptions.includes("BOSS_WH_SERIAL")
        create.includes("POLICY_MANAGE_REQUIRED")
    }
})

feature("each policy choice answers a selected value outside its page, and an unknown choice is refused", {
    when() {
        const choice = (name, selected) =>
            invoke(policies + "get#PolicyChoices", {appRoot: "Warehouse", choice: name, term: "zzz-none", selected}).options.map(
                row => row.value
            )
        return asUser("warehouse.manager", () => ({
            stores: choice("stores", "POPC_DEFAULT"),
            products: choice("products", "BOSS_WH_LOTTED"),
            parties: choice("parties", "CustJqp"),
            foreignProduct: choice("products", "BOSS_PRD_OWN"),
            organizations: invoke(policies + "get#PolicyChoices", {appRoot: "Warehouse", choice: "organizations"}).options.map(
                row => row.value
            ),
            unknown: refusal(policies + "get#PolicyChoices", {appRoot: "Warehouse", choice: "everything"})
        }))
    },
    then({stores, products, parties, foreignProduct, organizations, unknown}) {
        stores == ["POPC_DEFAULT"]
        products == ["BOSS_WH_LOTTED"]
        parties == ["CustJqp"]
        foreignProduct == []
        organizations.includes("ORG_ZIZI_RETAIL")
        unknown.includes("Unknown Warehouse policy choice")
    }
})

const screens = [
    {path: "Settings/Index", parameters: {}, text: "Stock policies"},
    {path: "Settings/StockPolicies/OperationPolicy", parameters: {facilityId: ids.facilityId}, text: "Receipt steps"},
    {path: "Settings/StockPolicies/TrackingPolicy", parameters: {facilityId: ids.facilityId}, text: "Block expired stock"},
    {path: "Settings/StockPolicies/ProductTrackingExceptions", parameters: {}, text: "Lot-tracked sealant"},
    {
        path: "Settings/StockPolicies/PolicyPreview",
        parameters: {productStoreId: "POPC_DEFAULT"},
        text: "Store: Ziziwork Retail Store"
    },
    {
        path: "Settings/ReservationPolicies/FacilityReservation",
        parameters: {facilityId: ids.facilityId},
        text: "Reservation order"
    },
    {
        path: "Settings/ReservationPolicies/StoreReservation",
        parameters: {productStoreId: "POPC_DEFAULT"},
        text: "Ziziwork Retail Store"
    },
    {
        path: "Settings/ReservationPolicies/ReservationCheck",
        parameters: {facilityId: ids.facilityId},
        text: "reservations checked"
    },
    {path: "Settings/AssetPools/PoolList", parameters: {}, text: "KEY-ACCOUNTS"},
    {path: "Settings/AssetPools/PoolDetail", parameters: {assetPoolId: "BOSS_WH_POOL"}, text: "Key account stock"}
]
feature("the settings screen #path renders for a reader without the change actions a manager has", {
    where: screens,
    when({path, parameters}) {
        return {
            reader: asUser("warehouse.read", () => page(path, parameters, "html")),
            manager: asUser("warehouse.manager", () => page(path, parameters, "html"))
        }
    },
    then({reader, manager, text}) {
        reader.errors.length == 0
        manager.errors.length == 0
        reader.output.includes(text)
        manager.output.includes(text)
        !/Change operations|Change tracking|Change reservation default|Change store settings|New pool|Add party/.test(
            reader.output
        )
    }
})
feature("a manager has the change action of each screen", {
    expect() {
        const has = (path, parameters, text) =>
            asUser("warehouse.manager", () => page(path, parameters, "html").output.includes(text))
        has("Settings/StockPolicies/OperationPolicy", {facilityId: ids.facilityId}, "Change operations") == true
        has("Settings/StockPolicies/TrackingPolicy", {facilityId: ids.facilityId}, "Change tracking") == true
        has("Settings/ReservationPolicies/FacilityReservation", {}, "Change reservation default") == true
        has("Settings/ReservationPolicies/StoreReservation", {productStoreId: "POPC_DEFAULT"}, "Change store settings") == true
        has("Settings/AssetPools/PoolList", {}, "New pool") == true
        has("Settings/AssetPools/PoolDetail", {assetPoolId: "BOSS_WH_POOL"}, "Add party") == true
    }
})

feature("FacilityDetail's Policies tab renders on its own: a manager changes the facility's rows, a reader reads them", {
    when() {
        // FacilityDetail's mount authorizes the tab; on its own, artifact authorization is off and its service checks
        return {
            manager: asUser("warehouse.manager", () => policiesTab(ids.facilityId), false),
            reader: asUser("warehouse.read", () => policiesTab(ids.facilityId), false),
            other: asUser("warehouse.read", () => policiesTab(ids.otherFacilityId), false)
        }
    },
    then({manager, reader, other}) {
        manager.errors.length == 0
        manager.output.includes("Change operations")
        manager.output.includes("Change reservation default")
        manager.output.includes("Organization: Ziziwork Retail")
        reader.errors.length == 0
        reader.output.includes("Delivery steps")
        !reader.output.includes("Change operations")
        other.output.includes("are not available to you")
    }
})
