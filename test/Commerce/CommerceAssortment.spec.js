// Commerce assortment and catalog mounts (impl-commerce P3; design-commerce §4 Merchandising, StoreCategories, §10): the
// publication batch as PublishProducts posts it (mantle.product.StoreMerchandisingServices.publish#StoreProducts, a result per
// product, one refused and the rest done), the shared-category preview Store categories makes before a move (every store of
// the user's that shows the category named), and Product360's one qvt render under Commerce (the publication pane, catalog
// tabs without costs). The publication and category rules themselves are Mantle's (StorePublication); the access case of a
// store-limited member refused another store's assortment is CommerceAccess's. The walk is the acceptance
// CommerceAssortmentWalk. Run: ./moq test mr-boss --spec Commerce/CommerceAssortment
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const M = "mantle.product.StoreMerchandisingServices."
// a Mantle call as the user, as a Commerce screen makes it (its authorization inherited from the screen)
const as = (user, service, parameters = {}) => asUser(user, () => invoke(M + service, parameters), false)
const sharedStoreId = "BOSS_COM_P3_SHARED"

spec({
    setupSpec() {
        // a second Retail store that shows Demo Category One as its browse root, so the category is shared with POPC_DEFAULT
        login("john.doe")
        system(() => {
            if (!ec.entity.find("mantle.product.store.ProductStore").condition("productStoreId", sharedStoreId).one())
                ec.service
                    .sync()
                    .name("create#mantle.product.store.ProductStore")
                    .parameters({
                        productStoreId: sharedStoreId,
                        storeName: "Retail outlet store",
                        organizationPartyId: ids.organizationId
                    })
                    .call()
        })
        as(users.merchandiser, "store#StoreCategory", {
            productStoreId: sharedStoreId,
            productCategoryId: "DEMO_ONE",
            storeCategoryTypeEnumId: "PsctBrowseRoot"
        })
    },
    cleanupSpec() {
        as(users.merchandiser, "store#StoreCategory", {
            productStoreId: sharedStoreId,
            productCategoryId: "DEMO_ONE",
            storeCategoryTypeEnumId: "PsctBrowseRoot",
            end: true
        })
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the publisher's batch answers per product: one already published is refused, the other published and then withdrawn", {
    when() {
        const batch = (action, productIds) =>
            as(users.publisher, "publish#StoreProducts", {
                productStoreId: ids.storeId,
                productIds,
                action,
                changeReason: "Assortment spec",
                operationKey: "assortment-spec-" + action + "-" + Date.now()
            })
        const published = batch("publish", ["DEMO_PA", "DEMO_1_1"])
        const answer = as(users.read, "get#StorePublication", {productStoreId: ids.storeId, productIds: ["DEMO_PA"]}).products
        const withdrawn = batch("withdraw", ["DEMO_PA"])
        return {published, answer, withdrawn}
    },
    then({published, answer, withdrawn}) {
        published.doneCount == 1
        published.results.find(row => row.productId == "DEMO_PA").ok == true
        published.results.find(row => row.productId == "DEMO_1_1").code == "ALREADY_PUBLISHED"
        answer[0].isPublic == true
        withdrawn.doneCount == 1
    }
})

feature("a move of a category another store of the user's shows names both stores before it changes them", {
    when() {
        const preview = as(users.merchandiser, "move#StoreCategory", {
            productStoreId: ids.storeId,
            productCategoryId: "DEMO_ONE",
            toParentCategoryId: "DEMO_TWO",
            previewOnly: true
        })
        const unconfirmed = asUser(
            users.merchandiser,
            () =>
                lib.refusal(M + "move#StoreCategory", {
                    productStoreId: ids.storeId,
                    productCategoryId: "DEMO_ONE",
                    toParentCategoryId: "DEMO_TWO"
                }),
            false
        )
        return {preview, unconfirmed}
    },
    then({preview, unconfirmed}) {
        Array.from(preview.affectedStores).some(row => row.productStoreId == sharedStoreId)
        Array.from(preview.affectedStores).some(row => row.productStoreId == ids.storeId)
        preview.moved == false
        unconfirmed.includes("CATEGORY_SHARED")
        unconfirmed.includes("Retail outlet store")
    }
})

// Product360 under Commerce, rendered once (qvt): its header, the publication pane naming the demo store, Commerce's tabs
// and no cost or margin
feature("Product360 under Commerce shows the product's publication in the user's stores and its catalog tabs, without costs", {
    when() {
        return asUser(users.merchandiser, () => lib.page("Merchandising/Product360", {productId: "DEMO_1_1"}))
    },
    then(result) {
        result.status == 200
        result.errors == []
        result.output.includes("Demo Product One-One")
        result.output.includes("Publication in your stores")
        result.output.includes("Ziziwork Retail Store")
        result.output.includes("Public")
        !result.output.includes("Standard estimate")
        !result.output.includes("Costs")
    }
})

// Review (P3): the shared price list under Commerce leaves out supplier prices and costs whatever else the user holds (the
// system administrator reads them under Products), and keeps the store's sales price
feature("the price rows under Commerce leave out supplier prices that Products shows the same user", {
    when() {
        const ids = appRoot =>
            asUser(
                "john.doe",
                () =>
                    Array.from(
                        invoke("ironstone.products.CatalogServices.find#ProductPrices", {appRoot, productId: "DEMO_1_1"})
                            .priceRows || []
                    ).map(row => row.productPriceId),
                false
            )
        return {products: ids("Products"), commerce: ids("Commerce")}
    },
    then({products, commerce}) {
        products.includes("BOSS_PUR_AGR_A_01")
        !commerce.includes("BOSS_PUR_AGR_A_01")
        commerce.includes("DEMO_1_1_CTL")
    }
})
