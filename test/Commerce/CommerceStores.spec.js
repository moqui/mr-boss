// Commerce stores (impl-commerce P2; design-commerce §3 Stores, StoreDetail, StoreGroups): the reads by scope Stores and
// StoreGroups make (mantle.product.StoreAdminServices.find#Stores, find#StoreGroups, check#StoreReadiness) for the reader,
// the other organization's manager and the store-limited staff member; and StoreDetail's one qvt render, the manager's: its
// record header, tabs, readiness and the reservation group read only, with Clone and Save (the reader's get#Store says it
// cannot edit). The store rules themselves are Mantle's (StoreAdmin); the access case of a store-limited member refused
// another store of the organization is CommerceAccess's. Run: ./moq test mr-boss --spec Commerce/CommerceStores
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, invoke} = lib
const A = "mantle.product.StoreAdminServices."
// a Mantle read as the user, as a Commerce screen makes it (its authorization inherited from the screen)
const read = (user, service, parameters = {}) => asUser(user, () => invoke(A + service, parameters), false)
const storeIds = result => Array.from(result.stores || []).map(row => row.productStoreId)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("Stores, StoreGroups and readiness read each user's stores: the organization's, a store-limited member's own", {
    when() {
        return {
            reader: storeIds(read(users.read, "find#Stores", {pageSize: 100})),
            services: storeIds(read(users.services, "find#Stores", {pageSize: 100})),
            staff: storeIds(read(users.storeStaff, "find#Stores", {pageSize: 100})),
            demo: read(users.read, "find#Stores", {term: "Ziziwork Retail"}).stores[0],
            readiness: read(users.read, "check#StoreReadiness", {productStoreId: ids.storeId}),
            groups: read(users.services, "find#StoreGroups", {}).groups
        }
    },
    then({reader, services, staff, demo, readiness, groups}) {
        reader.includes(ids.storeId)
        !reader.includes(ids.otherStoreId)
        services.includes(ids.otherStoreId)
        !services.includes(ids.storeId)
        staff == [ids.storeId]
        demo.organizationName.startsWith("Ziziwork Retail")
        // ZIZI_SHOP's Shop mount sells from it (Shop P1), so the site check is met
        demo.siteText == "ZIZI_SHOP"
        readiness.findings.find(row => row.key == "site").ready == true
        readiness.findings.find(row => row.key == "facility").ready == true
        readiness.findings.find(row => row.key == "orderNotice").ready == true
        groups == []
    }
})

// StoreDetail's header and its General tab, each its own level in qvt (the shell loads a tab as its own request), each
// rendered once (AGENTS.md: one render per screen per mode), as the manager with Clone and Save; the reader's page without
// them follows from get#Store's canEdit and the capabilities, read without a second render
feature(
    "StoreDetail shows the store's header and General its readiness and reservation read only; Clone and Save for the manager",
    {
        when() {
            return {
                manager: asUser(users.manager, () => lib.page("Stores/StoreDetail", {productStoreId: ids.storeId})),
                managerGeneral: asUser(users.manager, () =>
                    lib.page("Stores/StoreDetail/General", {productStoreId: ids.storeId, lastStandalone: "1"})
                ),
                reader: read(users.read, "get#Store", {productStoreId: ids.storeId})
            }
        },
        then({manager, managerGeneral, reader}) {
            manager.status == 200
            manager.errors == []
            manager.output.includes("Ziziwork Retail Store")
            manager.output.includes(ids.storeId)
            // P6: the demo store's local gateway has no rate, which blocks a purchase (its site's Terms page is the demo's)
            manager.output.includes("1 thing to fix")
            manager.output.includes("Clone store")
            manager.output.includes("Customer and other party rows")
            managerGeneral.status == 200
            managerGeneral.errors == []
            managerGeneral.output.includes("Readiness")
            managerGeneral.output.includes("Open in Warehouse")
            // a checkout finding's fix opens CheckoutSettings for the manager (P6)
            managerGeneral.output.includes("Settings/CheckoutSettings?productStoreId=" + ids.storeId)
            managerGeneral.output.includes("Reason for the change")
            reader.store.productStoreId == ids.storeId
            reader.canEdit == false
        }
    }
)
