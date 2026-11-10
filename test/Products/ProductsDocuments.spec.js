const D = "ironstone.products.DocumentServices.",
    C = "ironstone.products.CatalogServices."
function as(user, fn, on = false) {
    login(user)
    if (on) ec.artifactExecution.enableAuthz()
    else ec.artifactExecution.disableAuthz()
    try {
        return fn()
    } finally {
        ec.message.clearErrors()
        ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
function invoke(n, p) {
    try {
        const out = call(n, p) || {},
            error = ec.message.getErrorsString()
        ec.message.clearErrors()
        return Object.assign({}, out, {error})
    } catch (e) {
        ec.message.clearErrors()
        return {error: String(e.message || e)}
    }
}
spec({
    cleanup() {
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})
feature("document #path renders in #mode using the same guarded typed content", {
    where: [
        "Documents",
        "DocumentDetail",
        "Translations",
        "Products/Product360/Documents",
        "Categories/CategoryDetail/Content"
    ].flatMap(path => ["qvt", "html", "tui"].map(mode => ({path, mode}))),
    expect({path, mode}) {
        const p = path.includes("Categor")
            ? {productCategoryId: "BOSS_PRD_CAT"}
            : {productId: "BOSS_PRD_OWN", ...(path === "DocumentDetail" ? {productContentId: "BOSS_CONTENT_SAMPLE"} : {})}
        const r = as("catalog.edit", () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Products.xml")
                .renderMode(mode)
                .withStaticData()
                .render(path, p, null)
        )
        if (r.errorMessages.length) log.warn(r.errorMessages.join(" | "))
        r.status == 200
        r.errorMessages.length == 0
        !/Error rendering|Exception in render/.test(r.output)
    }
})
feature("document readers can preview their content while editor writes and foreign owners remain guarded", {
    when() {
        return {
            reader: as("catalog.reader", () => call(D + "get#DocumentContext", {productContentId: "BOSS_CONTENT_SAMPLE"})),
            resource: as("catalog.reader", () =>
                call("mantle.product.ContentServices.get#CatalogContentResource", {productContentId: "BOSS_CONTENT_SAMPLE"})
            ),
            denied: as("catalog.reader", () =>
                invoke("mantle.product.ContentServices.store#CatalogContent", {productId: "BOSS_PRD_OWN", contentText: "Denied"})
            ),
            foreign: as("catalog.edit", () => invoke(D + "get#DocumentContext", {productId: "BOSS_PRD_OTHER"}))
        }
    },
    then({reader, resource, denied, foreign}) {
        reader.document.contentId == "BOSS_CONTENT_SAMPLE"
        reader.canEdit == false
        resource.contentLocation.includes("/product/BOSS_PRD_OWN/")
        ;/access|authority/.test(denied.error)
        foreign.error.includes("not available")
    }
})
feature("document language choices and the suggested target include only readable catalog owners", {
    when() {
        as("john.doe", () => {
            call("create#mantle.product.category.ProductCategory", {
                productCategoryId: "BPRD_LOCALE_FOREIGN",
                categoryName: "Foreign locale fixture",
                ownerPartyId: "ORG_ZIZI_RETAIL"
            })
            for (const [productId, locale] of [["BOSS_PRD_OWN", "qab_XS"], ["BOSS_PRD_OTHER", "qaa_XR"]])
                call("create#mantle.product.ProductContent", {productId, locale})
            for (const [productCategoryId, locale] of [["BOSS_PRD_CAT", "qad_XS"], ["BPRD_LOCALE_FOREIGN", "qac_XR"]])
                call("create#mantle.product.category.ProductCategoryContent", {productCategoryId, locale})
            for (const [productStoreId, locale] of [["POPC_DEFAULT", "qae_XS"], ["BOSS_COM_DIGITAL", "qaf_XR"]])
                call("create#mantle.product.ProductContent", {productId: "BOSS_PRD_OWN", productStoreId, locale})
        })
        return {
            reader: as("catalog.reader", () => call(D + "get#DocumentContext", {productId: "BOSS_PRD_OWN"})),
            administrator: as("john.doe", () => call(D + "get#DocumentContext", {productId: "BOSS_PRD_OWN"})),
            commerce: as("commerce.storestaff", () => call(D + "get#DocumentContext", {appRoot: "Commerce"}))
        }
    },
    then({reader, administrator, commerce}) {
        reader.localeOptions.some(row => row.value === "qab_XS")
        reader.localeOptions.some(row => row.value === "qad_XS")
        !reader.localeOptions.some(row => ["qaa_XR", "qac_XR"].includes(row.value))
        !["qaa_XR", "qac_XR"].includes(reader.targetLocale)
        administrator.localeOptions.some(row => row.value === "qaa_XR")
        administrator.localeOptions.some(row => row.value === "qac_XR")
        commerce.localeOptions.some(row => row.value === "qae_XS")
        !commerce.localeOptions.some(row => row.value === "qaf_XR")
    }
})
feature("the app content and translation wrappers use native optimistic revisions and retained conflict drafts", {
    when() {
        return as("catalog.edit", () => {
            const created = call(C + "store#ProductContent", {
                    productId: "BOSS_PRD_OWN",
                    productContentTypeEnumId: "PcntProductName",
                    locale: "en",
                    contentText: "Products translation source"
                }),
                before = call(D + "get#DocumentContext", {productContentId: created.productContentId}),
                translation = call("mantle.product.ContentServices.store#CatalogTranslation", {
                    productId: "BOSS_PRD_OWN",
                    sourceContentId: created.productContentId,
                    sourceRevision: before.expectedRevision,
                    targetLocale: "es",
                    targetText: "Nombre traducido",
                    markReviewed: true
                }),
                saved = call("mantle.product.ContentServices.store#CatalogContent", {
                    productContentId: created.productContentId,
                    expectedRevision: before.expectedRevision,
                    contentText: "Edited source"
                }),
                conflict = call("mantle.product.ContentServices.store#CatalogContent", {
                    productContentId: created.productContentId,
                    expectedRevision: before.expectedRevision,
                    contentText: "Concurrent submission"
                }),
                translations = call("mantle.product.ContentServices.find#CatalogTranslations", {
                    productId: "BOSS_PRD_OWN",
                    sourceLocale: "en",
                    targetLocale: "es"
                })
            return {created, translation, saved, conflict, translations}
        })
    },
    then({created, translation, saved, conflict, translations}) {
        created.productContentId != null
        translation.contentId != null
        saved.conflict == false
        conflict.conflict == true
        translations.translationRows.find(r => r.contentId === created.productContentId).reviewState == "Needs review"
    }
})
feature("raw typed content, conflict drafts and their audit rows retain the catalog owner boundary", {
    expect() {
        const n = as("john.doe", () =>
            call("mantle.product.ProductServices.create#ProductContent", {
                productId: "BOSS_PRD_OTHER",
                productContentTypeEnumId: "PcntDescription",
                contentText: "FOREIGN_CONTENT_SENTINEL"
            })
        )
        const result = as(
            "catalog.edit",
            () =>
                invoke("mantle.party.CommunicationServices.get#RecordLinkInfo", {
                    recordEntityName: "mantle.product.ProductContent",
                    recordId: n.productContentId,
                    checkOnly: true
                }),
            true
        )
        result.recordVisible == false || result.error.includes("not authorized")
    }
})
