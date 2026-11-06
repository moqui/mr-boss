// Commerce P2's "usable when" (impl-commerce P2), as an acceptance walk through the screens' transitions with artifact
// authorization on: a manager creates a store for ORG_ZIZI_RETAIL with the organization's currency and no site, binds a
// facility from a date and a staff member, and readiness names what is missing; cloning POPC_DEFAULT copies its categories,
// facilities and staff but not its customers' party rows, and the clone is unpublished; a merchandiser reads StoreDetail
// but cannot save; another organization's manager is refused POPC_DEFAULT; a change of the store's tax gateway is in its
// History with the user and reason. And each Stores screen and StoreDetail tab opens for the manager. The rules themselves
// are Mantle's StoreAdmin and CommerceAccess's.
// Run: ./moq accept mr-boss --spec CommerceStoresWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system} = lib
const S = "mantle.product.store."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a transition posted as the user, as its form submits it: the messages it leaves
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        const messages = Array.from(ec.message.getMessages?.() || [])
        ec.message.clearErrors()
        return {status: result.status, errors, messages, output: String(result.output || "")}
    })
}
const list = (entity, conditions) =>
    system(() => Array.from(ec.entity.find(entity).condition(conditions).list()).map(row => row.getMap()))
const current = rowsFound => rowsFound.filter(row => row.thruDate == null || Number(row.thruDate) > Date.now())
const walk = {}

spec({
    stepwise: true,
    setupSpec() {
        // a customer's bill-to row on the demo store, which a clone must leave behind
        system(() => {
            if (
                !ec.entity
                    .find(S + "ProductStoreParty")
                    .condition({productStoreId: ids.storeId, partyId: ids.customerId})
                    .list().length
            )
                ec.service
                    .sync()
                    .name("create#" + S + "ProductStoreParty")
                    .parameters({productStoreId: ids.storeId, partyId: ids.customerId, roleTypeId: "CustomerBillTo", fromDate: 0})
                    .call()
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a manager creates a store with the organization's currency and no site, binds a facility from a date and a staff member",
    {
        when() {
            const name = "Walk store " + Date.now()
            const created = post(users.manager, "Stores/Stores/createStore", {
                storeName: name,
                newOrganizationPartyId: ids.organizationId,
                defaultSalesChannelEnumId: "ScWeb"
            })
            const store = list(S + "ProductStore", {storeName: name})[0]
            walk.storeId = store?.productStoreId
            const preference = system(() =>
                ec.service
                    .sync()
                    .name("mantle.ledger.LedgerServices.find#PartyAcctgPreference")
                    .parameters({organizationPartyId: ids.organizationId})
                    .call()
            ).partyAcctgPreference
            const tomorrow = Date.now() + 86400000
            const facility = post(users.manager, "Stores/StoreDetail/Facilities/saveFacility", {
                productStoreId: walk.storeId,
                facilityId: "ZIRET_WH",
                sequenceNum: 1,
                fromDate: tomorrow
            })
            const staff = post(users.manager, "Stores/StoreDetail/Staff/saveStaff", {
                productStoreId: walk.storeId,
                partyId: "BOSS_COM_STAFF"
            })
            const general = asUser(users.manager, () =>
                lib.page("Stores/StoreDetail/General", {productStoreId: walk.storeId, lastStandalone: "1"})
            )
            return {
                created,
                store,
                currency: preference?.baseCurrencyUomId,
                facility,
                facilities: list(S + "ProductStoreFacility", {productStoreId: walk.storeId}),
                staff,
                staffRows: current(list(S + "ProductStoreParty", {productStoreId: walk.storeId, roleTypeId: "StoreStaff"})),
                mounts: list("mantle.public.PublicSiteApp", {app: "shop", targetId: walk.storeId}),
                general,
                tomorrow
            }
        },
        then({created, store, currency, facility, facilities, staff, staffRows, mounts, general, tomorrow}) {
            created.errors == []
            store != null
            store.defaultCurrencyUomId == currency
            facility.errors == []
            facilities.length == 1
            Number(facilities[0].fromDate) == tomorrow
            staff.errors == []
            staffRows.map(row => row.partyId) == ["BOSS_COM_STAFF"]
            mounts == []
            opened(general)
            general.output.includes("No site sells from this store")
            general.output.includes("No tax gateway is set")
            general.output.includes("No order placed email is bound")
            // the facility starts tomorrow, so today the store has none in effect
            general.output.includes("No facility fulfills its orders")
        }
    }
)

feature(
    "cloning POPC_DEFAULT copies its categories, facilities and staff, not its customers' party rows, and starts unpublished",
    {
        when() {
            const base = list(S + "ProductStore", {productStoreId: ids.storeId})[0]
            const name = "Walk clone " + Date.now()
            const cloned = post(users.manager, "Stores/StoreDetail/cloneStore", {
                productStoreId: ids.storeId,
                cloneStoreName: name,
                cloneOrganizationPartyId: ids.organizationId,
                copyCategories: "Y",
                copyEmails: "Y",
                copyFacilities: "Y",
                copyStaff: "Y",
                copySettings: "Y",
                approveReferences: "Y",
                expectedLastUpdatedStamp: base.lastUpdatedStamp,
                operationKey: "walk-clone-" + Date.now()
            })
            const clone = list(S + "ProductStore", {storeName: name})[0]
            const cloneId = clone?.productStoreId
            const inEffect = rowsFound => rowsFound.filter(row => row.thruDate == null || Number(row.thruDate) >= Date.now())
            return {
                cloned,
                clone,
                baseCategories: inEffect(list(S + "ProductStoreCategory", {productStoreId: ids.storeId})).length,
                categories: list(S + "ProductStoreCategory", {productStoreId: cloneId}).length,
                baseFacilities: inEffect(list(S + "ProductStoreFacility", {productStoreId: ids.storeId}))
                    .map(row => row.facilityId)
                    .sort(),
                facilities: list(S + "ProductStoreFacility", {productStoreId: cloneId})
                    .map(row => row.facilityId)
                    .sort(),
                staff: list(S + "ProductStoreParty", {productStoreId: cloneId, roleTypeId: "StoreStaff"}).map(row => row.partyId),
                customers: list(S + "ProductStoreParty", {productStoreId: cloneId}).filter(
                    row => row.roleTypeId !== "StoreStaff"
                ),
                products: list(S + "ProductStoreProduct", {productStoreId: cloneId}),
                mounts: list("mantle.public.PublicSiteApp", {app: "shop", targetId: cloneId}),
                promotions: list(S + "ProductStorePromotion", {productStoreId: cloneId})
            }
        },
        then({
            cloned,
            clone,
            baseCategories,
            categories,
            baseFacilities,
            facilities,
            staff,
            customers,
            products,
            mounts,
            promotions
        }) {
            cloned.errors == []
            clone != null
            clone.organizationPartyId == ids.organizationId
            baseCategories > 0
            categories == baseCategories
            facilities == baseFacilities
            staff.includes("BOSS_COM_STAFF")
            customers == []
            products == []
            mounts == []
            promotions == []
        }
    }
)

feature("a merchandiser reads StoreDetail but cannot save; another organization's manager is refused POPC_DEFAULT", {
    when() {
        const parameters = {productStoreId: ids.storeId}
        return {
            read: asUser(users.merchandiser, () => lib.page("Stores/StoreDetail", parameters)),
            readGeneral: asUser(users.merchandiser, () =>
                lib.page("Stores/StoreDetail/General", Object.assign({lastStandalone: "1"}, parameters))
            ),
            save: post(users.merchandiser, "Stores/StoreDetail/General/saveStore", {
                productStoreId: ids.storeId,
                storeName: "Merchandiser rename",
                organizationPartyId: ids.organizationId
            }),
            other: asUser(users.services, () => lib.page("Stores/StoreDetail", parameters)),
            name: list(S + "ProductStore", {productStoreId: ids.storeId})[0].storeName
        }
    },
    then({read, readGeneral, save, other, name}) {
        opened(read)
        read.output.includes("Ziziwork Retail Store")
        opened(readGeneral)
        !readGeneral.output.includes("Reason for the change")
        save.errors.join(" ").includes("COMMERCE_STORE_EDIT")
        name == "Ziziwork Retail Store"
        other.status == 200
        other.output.includes("is not available")
        !other.output.includes("Clone store")
    }
})

feature("a change of the store's tax gateway is in its History with the user and reason", {
    when() {
        const store = list(S + "ProductStore", {productStoreId: walk.storeId})[0]
        const saved = post(users.manager, "Stores/StoreDetail/General/saveStore", {
            productStoreId: walk.storeId,
            expectedLastUpdatedStamp: store.lastUpdatedStamp,
            storeName: store.storeName,
            organizationPartyId: store.organizationPartyId,
            defaultCurrencyUomId: store.defaultCurrencyUomId,
            defaultLocale: store.defaultLocale,
            defaultSalesChannelEnumId: store.defaultSalesChannelEnumId,
            taxGatewayConfigId: "LOCAL",
            changeReason: "Walk: the local tax tables"
        })
        const history = asUser(users.read, () =>
            lib.page("Stores/StoreDetail/History", {productStoreId: walk.storeId, lastStandalone: "1"}, "html")
        )
        return {saved, history}
    },
    then({saved, history}) {
        saved.errors == []
        opened(history)
        history.output.includes("Tax gateway")
        history.output.includes("Walk: the local tax tables")
        history.output.includes("Commerce Store manager")
    }
})

feature("each Stores screen and StoreDetail tab opens for the manager", {
    when() {
        const problems = []
        const tabs = ["General", "Sites", "Facilities", "Staff", "Emails", "OrderChecks", "SearchContent", "Settings", "History"]
        for (const path of ["Stores/Stores", "Stores/StoreGroups"].concat(tabs.map(tab => "Stores/StoreDetail/" + tab)))
            for (const mode of ["qvt", "html"]) {
                const rendered = asUser(users.manager, () =>
                    lib.page(path, {productStoreId: ids.storeId, lastStandalone: "1"}, mode)
                )
                if (!opened(rendered)) problems.push(`${path} ${mode}: ${rendered.status} ${rendered.errors.join(" | ")}`)
            }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
