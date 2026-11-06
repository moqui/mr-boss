// Commerce stores (impl-commerce P2; design-commerce §3 Stores, StoreDetail, StoreGroups): the reads by scope Stores and
// StoreGroups make (mantle.product.StoreAdminServices.find#Stores, find#StoreGroups, check#StoreReadiness) for the reader,
// the other organization's manager and the store-limited staff member; and StoreDetail's one qvt render, its record header,
// tabs, readiness and the reservation group read only, with the manager's Clone and Save and the reader's same page
// without them. The store rules themselves are Mantle's (StoreAdmin); the access case of a store-limited member refused
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
        demo.siteText == "No site"
        readiness.findings.find(row => row.key == "site").ready == false
        readiness.findings.find(row => row.key == "facility").ready == true
        readiness.findings.find(row => row.key == "orderNotice").ready == true
        groups == []
    }
})

// StoreDetail's header and its General tab, each its own level in qvt (the shell loads a tab as its own request), each
// rendered once per user: the manager's with Clone and Save, the reader's without
feature(
    "StoreDetail shows the store's header and General its readiness and reservation read only; Clone and Save for the manager",
    {
        when() {
            const header = user => asUser(user, () => lib.page("Stores/StoreDetail", {productStoreId: ids.storeId}))
            const general = user =>
                asUser(user, () => lib.page("Stores/StoreDetail/General", {productStoreId: ids.storeId, lastStandalone: "1"}))
            return {
                manager: header(users.manager),
                reader: header(users.read),
                managerGeneral: general(users.manager),
                readerGeneral: general(users.read)
            }
        },
        then({manager, reader, managerGeneral, readerGeneral}) {
            manager.status == 200
            manager.errors == []
            manager.output.includes("Ziziwork Retail Store")
            manager.output.includes(ids.storeId)
            manager.output.includes("to fix")
            manager.output.includes("Clone store")
            manager.output.includes("Customer and other party rows")
            reader.status == 200
            reader.errors == []
            reader.output.includes("Ziziwork Retail Store")
            !reader.output.includes("Clone store")
            managerGeneral.status == 200
            managerGeneral.errors == []
            managerGeneral.output.includes("Readiness")
            managerGeneral.output.includes("No site sells from this store")
            managerGeneral.output.includes("Open in Warehouse")
            managerGeneral.output.includes("Reason for the change")
            readerGeneral.status == 200
            readerGeneral.errors == []
            readerGeneral.output.includes("Readiness")
            !readerGeneral.output.includes("Reason for the change")
        }
    }
)
