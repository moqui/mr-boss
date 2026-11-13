// Commerce P3's "usable when" (impl-commerce P3), as an acceptance walk through the screens' transitions with artifact
// authorization on: publishing the demo's virtual product publishes its saleable variants, the preview lists them, and
// withdrawing one variant leaves the others public, another store unchanged; moving a category shared by two stores names
// both, a cycle is refused, and the terminal twin's moves give the same tree as the tree view's; a merchandiser without
// PRICE_EDIT sees store prices on Product360 and cannot change them. And each Merchandising screen opens for the
// merchandiser. The rules themselves are Mantle's StorePublication and CommerceAccess's.
// Run: ./moq accept mr-boss --spec CommerceAssortmentWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const M = "mantle.product.StoreMerchandisingServices."
const virtualId = "DEMO_VAR"
const sharedStoreId = "BOSS_COM_P3_WALK"
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a transition posted as the user, as its form or the tree view submits it: its errors and output
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, output: String(result.output || "")}
    })
}
const json = result => {
    try {
        return JSON.parse(result.output)
    } catch (error) {
        return {errors: result.output}
    }
}
const resolve = (productStoreId, productIds) =>
    system(() => invoke(M + "get#StorePublication", {productStoreId, productIds}).products || [])
const variantIds = () =>
    system(() =>
        Array.from(
            ec.entity
                .find("mantle.product.ProductAssoc")
                .condition({productId: virtualId, productAssocTypeEnumId: "PatVariant"})
                .list()
        ).map(row => row.toProductId)
    ).sort()
const rootOrder = productStoreId =>
    asUser(
        users.read,
        () =>
            Array.from(invoke(M + "get#StoreCategories", {productStoreId}).tree || [])
                .filter(node => node.parentProductCategoryId === "PopcBrowseRoot")
                .map(node => node.productCategoryId),
        false
    )
const walk = {}

// the store's publisher publishes, withdraws or restores products of the store (the walk's reset and cleanup)
const publisher = (action, productIds) =>
    asUser(
        users.publisher,
        () =>
            invoke(M + "publish#StoreProducts", {
                productStoreId: ids.storeId,
                productIds,
                action,
                changeReason: "Walk reset",
                operationKey: "walk-reset-" + action + "-" + Date.now()
            }),
        false
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // a rerun starts from an unpublished virtual product with no variant excluded
        publisher("restore", variantIds())
        publisher("withdraw", [virtualId])
        // a second Retail store that shows Demo Category One, so the category is shared
        system(() => {
            if (!ec.entity.find("mantle.product.store.ProductStore").condition("productStoreId", sharedStoreId).one())
                ec.service
                    .sync()
                    .name("create#mantle.product.store.ProductStore")
                    .parameters({
                        productStoreId: sharedStoreId,
                        storeName: "Walk outlet store",
                        organizationPartyId: ids.organizationId
                    })
                    .call()
        })
        asUser(
            users.merchandiser,
            () =>
                invoke(M + "store#StoreCategory", {
                    productStoreId: sharedStoreId,
                    productCategoryId: "DEMO_ONE",
                    storeCategoryTypeEnumId: "PsctBrowseRoot"
                }),
            false
        )
        ec.message.clearErrors()
    },
    cleanupSpec() {
        // the virtual product unpublished again: the walks after this one (SitePagesWalk) take it as a draft product
        publisher("withdraw", [virtualId])
        asUser(
            users.merchandiser,
            () =>
                invoke(M + "store#StoreCategory", {
                    productStoreId: sharedStoreId,
                    productCategoryId: "DEMO_ONE",
                    storeCategoryTypeEnumId: "PsctBrowseRoot",
                    end: true
                }),
            false
        )
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("publishing the virtual product publishes its saleable variants, the preview lists them; another store is unchanged", {
    when() {
        walk.variants = variantIds()
        // a catalog editor has made the first three variants active; the rest are drafts, not saleable
        walk.saleable = walk.variants.slice(0, 3)
        system(() => {
            for (const productId of walk.saleable)
                ec.service.sync().name("update#mantle.product.Product").parameters({productId, statusId: "PrdActive"}).call()
        })
        const preview = asUser(users.publisher, () =>
            lib.page(
                "Merchandising/PublishProducts",
                {productStoreId: ids.storeId, productIds: virtualId, publishAction: "publish"},
                "html"
            )
        )
        const published = post(users.publisher, "Merchandising/PublishProducts/publish", {
            productStoreId: ids.storeId,
            productIds: virtualId,
            publishAction: "publish",
            changeReason: "Walk: the variants product",
            operationKey: "walk-publish-" + Date.now()
        })
        return {
            preview,
            published,
            here: resolve(ids.storeId, [virtualId].concat(walk.variants)),
            other: resolve(ids.otherStoreId, [virtualId].concat(walk.variants))
        }
    },
    then({preview, published, here, other}) {
        walk.variants.length > 1
        opened(preview)
        walk.variants.every(variantId => preview.output.includes(variantId))
        preview.output.includes("Variants the publication covers")
        published.errors == []
        here.find(answer => answer.productId === virtualId).isPublic
        walk.saleable.every(variantId => here.find(answer => answer.productId === variantId).isPublic)
        walk.saleable.every(variantId => here.find(answer => answer.productId === variantId).via === "virtual")
        here.filter(answer => !walk.saleable.includes(answer.productId) && answer.productId !== virtualId).every(
            answer => answer.reasonCode === "NOT_SELLABLE"
        )
        here.filter(answer => answer.via === "virtual").length == walk.variants.length
        other.every(answer => !answer.isPublic)
    }
})

feature("withdrawing one variant leaves the others public", {
    when() {
        const excluded = post(users.publisher, "Merchandising/PublishProducts/publish", {
            productStoreId: ids.storeId,
            productIds: walk.variants[0],
            publishAction: "exclude",
            changeReason: "Walk: one variant out",
            operationKey: "walk-exclude-" + Date.now()
        })
        return {excluded, answers: resolve(ids.storeId, walk.variants)}
    },
    then({excluded, answers}) {
        excluded.errors == []
        answers.find(answer => answer.productId === walk.variants[0]).isPublic == false
        answers.find(answer => answer.productId === walk.variants[0]).reasonCode == "VARIANT_EXCLUDED"
        walk.saleable.slice(1).every(variantId => answers.find(answer => answer.productId === variantId).isPublic)
    }
})

feature("moving a category two stores show names both; a cycle is refused", {
    when() {
        const move = parameters =>
            json(
                post(
                    users.merchandiser,
                    "Merchandising/StoreCategories/move",
                    Object.assign({productStoreId: ids.storeId}, parameters)
                )
            )
        return {
            preview: move({productCategoryId: "DEMO_ONE", toParentCategoryId: "DEMO_TWO", previewOnly: "true"}),
            unconfirmed: move({productCategoryId: "DEMO_ONE", toParentCategoryId: "DEMO_TWO"}),
            cycle: move({productCategoryId: "PopcBrowseRoot", toParentCategoryId: "DEMO_ONE"})
        }
    },
    then({preview, unconfirmed, cycle}) {
        !preview.errors
        preview.affectedStores.some(row => row.productStoreId === ids.storeId)
        preview.affectedStores.some(row => row.productStoreId === sharedStoreId)
        String(unconfirmed.errors).includes("Walk outlet store")
        String(cycle.errors).includes("CATEGORY_CYCLE")
    }
})

feature("the terminal twin's Move down and the tree view's moves give the same tree", {
    when() {
        const before = rootOrder(ids.storeId)
        const twin = post(users.merchandiser, "Merchandising/StoreCategoriesTui/moveCategory", {
            productStoreId: ids.storeId,
            moveCategoryId: "DEMO_TWO",
            fromParentCategoryId: "PopcBrowseRoot",
            direction: "down"
        })
        const afterTwin = rootOrder(ids.storeId)
        const tree = parameters =>
            json(
                post(
                    users.merchandiser,
                    "Merchandising/StoreCategories/move",
                    Object.assign({productStoreId: ids.storeId}, parameters)
                )
            )
        const up = tree({productCategoryId: "DEMO_TWO", fromParentCategoryId: "PopcBrowseRoot", direction: "up"})
        const back = rootOrder(ids.storeId)
        const down = tree({productCategoryId: "DEMO_TWO", fromParentCategoryId: "PopcBrowseRoot", direction: "down"})
        const afterTree = rootOrder(ids.storeId)
        // leave the demo as it was
        tree({productCategoryId: "DEMO_TWO", fromParentCategoryId: "PopcBrowseRoot", direction: "up"})
        return {before, twin, afterTwin, up, back, down, afterTree}
    },
    then({before, twin, afterTwin, up, back, down, afterTree}) {
        before.includes("DEMO_TWO")
        twin.errors == []
        afterTwin.indexOf("DEMO_TWO") == Math.min(before.indexOf("DEMO_TWO") + 1, before.length - 1)
        !up.errors
        back == before
        !down.errors
        afterTree == afterTwin
    }
})

feature("a merchandiser without PRICE_EDIT sees the store's prices on Product360 and cannot change them", {
    when() {
        const prices = asUser(users.merchandiser, () =>
            lib.page("Merchandising/Product360/Prices", {productId: "DEMO_1_1", lastStandalone: "1"}, "html")
        )
        const change = asUser(
            users.merchandiser,
            () =>
                lib.refusal("ironstone.products.CatalogServices.store#ProductPrice", {
                    appRoot: "Commerce",
                    productPriceId: "DEMO_1_1_CTL",
                    productId: "DEMO_1_1",
                    price: 1
                }),
            false
        )
        return {prices, change}
    },
    then({prices, change}) {
        opened(prices)
        prices.output.includes("16.99")
        prices.output.includes("Ziziwork Retail Store")
        !prices.output.includes("New sales price")
        !prices.output.includes("Review bulk change")
        change.includes("Price edit authority is required")
    }
})

feature("each Merchandising screen opens for the merchandiser", {
    when() {
        const problems = []
        const screens = {
            "Merchandising/Assortment": {productStoreId: ids.storeId},
            "Merchandising/PublishProducts": {productStoreId: ids.storeId, productIds: "DEMO_1_1", publishAction: "withdraw"},
            "Merchandising/StoreCategoriesTui": {productStoreId: ids.storeId, productCategoryId: "DEMO_ONE"},
            "Merchandising/Documents": {productId: "DEMO_1_1"},
            "Merchandising/PriceLists": {},
            "Merchandising/PriceExplain": {productId: "DEMO_1_1"},
            "Merchandising/CategoryDetail": {productCategoryId: "DEMO_ONE"},
            "Merchandising/InventoryAvailability": {productId: "DEMO_1_1"}
        }
        for (const [path, parameters] of Object.entries(screens))
            for (const mode of ["qvt", "html"]) {
                const rendered = asUser(users.merchandiser, () =>
                    lib.page(path, Object.assign({lastStandalone: "1"}, parameters), mode)
                )
                if (!opened(rendered)) problems.push(`${path} ${mode}: ${rendered.status} ${rendered.errors.join(" | ")}`)
            }
        const tree = asUser(users.merchandiser, () =>
            lib.page("Merchandising/StoreCategories", {productStoreId: ids.storeId, lastStandalone: "1"}, "tui")
        )
        if (!opened(tree)) problems.push(`Merchandising/StoreCategories tui: ${tree.status} ${tree.errors.join(" | ")}`)
        const category = asUser(users.merchandiser, () =>
            lib.page("Merchandising/CategoryDetail", {productCategoryId: "DEMO_ONE"}, "html")
        )
        return {problems, category}
    },
    then({problems, category}) {
        problems.join("\n") == ""
        category.output.includes("Shown in")
        category.output.includes("Ziziwork Retail Store")
    }
})
