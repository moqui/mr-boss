// The Products access rules, with authorization on: who opens the app, which grant gives each catalog capability, the
// organization scope, another organization's record hidden by its owner, catalog writes for the editor grant, and the
// grants Products leaves to Warehouse, Manufacturing and supplier pricing. The access walk is an acceptance test.
const CATALOG = "ironstone.products.CatalogServices.",
    PALETTE = "ironstone.commons.PaletteServices.get#RecordLink",
    LINK_INFO = "mantle.party.CommunicationServices.get#RecordLinkInfo",
    IMPORT = "mantle.product.ProductImportServices."
function as(user, run) {
    login(user)
    const disabled = ec.artifactExecution.authzDisabled()
    if (disabled) ec.artifactExecution.enableAuthz()
    try {
        return run()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
// data setup as the administrator, with authorization off
function setup(run) {
    login("john.doe")
    const disabled = ec.artifactExecution.disableAuthz()
    try {
        return run()
    } finally {
        ec.message.clearErrors()
        if (!disabled) ec.artifactExecution.enableAuthz()
    }
}
function access(id, need = "read", extra = {}) {
    return call(CATALOG + "get#CatalogRecord", Object.assign({recordId: id, need, checkOnly: true}, extra))
}
// the error a call ends with, "" when it succeeds
function refusal(name, params) {
    try {
        call(name, params)
        return ec.message.getErrorsString()
    } catch (e) {
        return String(e.message || e)
    } finally {
        ec.message.clearErrors()
    }
}
// the calls that did not end with their reason (a text or a pattern), "" when all did
function unrefused(cases) {
    return cases
        .map(([name, params, reason]) => {
            const error = refusal(name, params)
            const refused = typeof reason === "string" ? error.includes(reason) : reason.test(error)
            return refused ? "" : name + ": " + (error || "accepted")
        })
        .filter(problem => problem)
        .join(" | ")
}
function userId(username) {
    return ec.entity.find("moqui.security.UserAccount").condition("username", username).disableAuthz().one().userId
}
function capabilities() {
    return call(CATALOG + "get#CatalogAccess").capabilities
}
function stageProducts() {
    return {
        kindId: "products",
        organizationPartyId: "ORG_ZIZI_SERVICES",
        sourceText: "productId,productName\nBOSS_ACCESS_IMPORT,Private staged row\n"
    }
}
function shellApps() {
    const rendered = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("shellData", {}, null)
    return JSON.parse(rendered.output).apps.map(app => app.name)
}

feature("a Products group member has the Products launcher and a user outside it is refused the app", {
    when() {
        return {
            member: as("catalog.reader", () => ({apps: shellApps(), read: capabilities().read})),
            outsider: as("warehouse.read", () => ({
                apps: shellApps(),
                record: refusal(CATALOG + "get#CatalogAccess", {})
            }))
        }
    },
    then({member, outsider}) {
        member.apps.includes("Products")
        member.read == true
        !outsider.apps.includes("Products")
        outsider.record.includes("is not authorized for AT_SERVICE [ironstone.products.CatalogServices.get#CatalogAccess]")
    }
})

feature("each catalog capability comes from its own Mantle permission, not a group name or another app's administration", {
    when() {
        const reader = userId("catalog.reader"),
            date = "2000-01-01T00:00:00Z",
            groupId = "BOSS_SPEC_CATALOG_EDIT_PERMISSION"
        const member = group =>
            setup(() => call("create#moqui.security.UserGroupMember", {userId: reader, userGroupId: group, fromDate: date}))
        const unmember = group =>
            setup(() =>
                ec.entity.find("moqui.security.UserGroupMember").condition({userId: reader, userGroupId: group}).deleteAll()
            )
        const cost = user =>
            as(user, () => {
                const r = call("ironstone.products.CostServices.get#CostContext", {productId: "BOSS_PRD_OWN"})
                return {read: r.costAccess.read, count: r.standardCostRows.length}
            })
        const prices = user => as(user, () => call(CATALOG + "find#ProductPrices", {productId: "BOSS_PRD_OWN"}))
        let accounting, purchasing, permission
        try {
            member("BOSS_ACCOUNTING_ADMIN")
            accounting = as("catalog.reader", capabilities)
            unmember("BOSS_ACCOUNTING_ADMIN")
            member("BOSS_PURCHASING_ADMIN")
            purchasing = as("catalog.reader", capabilities)
            unmember("BOSS_PURCHASING_ADMIN")
            setup(() => {
                if (!ec.entity.find("moqui.security.UserGroup").condition("userGroupId", groupId).count())
                    call("create#moqui.security.UserGroup", {
                        userGroupId: groupId,
                        description: "Catalog edit by permission alone"
                    })
                call("create#moqui.security.UserGroupPermission", {
                    userGroupId: groupId,
                    userPermissionId: "PRODUCT_CATALOG_EDIT",
                    fromDate: 0
                })
            })
            member(groupId)
            permission = as("catalog.reader", () => ({
                capabilities: capabilities(),
                own: access("BOSS_PRD_OWN", "catalogEdit")
            }))
        } finally {
            unmember("BOSS_ACCOUNTING_ADMIN")
            unmember("BOSS_PURCHASING_ADMIN")
            unmember(groupId)
            setup(() => ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", groupId).deleteAll())
        }
        return {
            reader: as("catalog.reader", capabilities),
            price: as("catalog.price.edit", capabilities),
            admin: as("catalog.admin", capabilities),
            accounting,
            purchasing,
            permission,
            readerCost: cost("catalog.reader"),
            costReader: cost("catalog.cost.read"),
            adminCost: cost("catalog.admin"),
            sales: prices("catalog.price.read"),
            purchase: prices("catalog.supplier.price.read")
        }
    },
    then({reader, price, admin, accounting, purchasing, permission, readerCost, costReader, adminCost, sales, purchase}) {
        reader.read == true
        reader.catalogEdit == false
        reader.priceRead == false
        reader.supplierPriceRead == false
        reader.costRead == false
        reader.marginRead == false
        price.priceRead == true
        price.priceEdit == true
        price.catalogEdit == false
        price.supplierPriceRead == false
        price.costRead == false
        price.marginRead == false
        admin.glPost == false
        admin.stockPlan == false
        admin.methodEdit == false
        accounting.glPost == true
        accounting.costRead == true
        accounting.costEstimate == false
        purchasing.stockPlan == true
        purchasing.glPost == false
        permission.capabilities.catalogEdit == true
        permission.capabilities.catalogAdmin == false
        permission.own.canWrite == true
        readerCost.read == false
        readerCost.count == 0
        costReader.read == true
        costReader.count >= 1
        adminCost.read == true
        sales.priceRows.length > 0
        sales.priceRows.every(r => r.direction === "sales")
        !JSON.stringify(sales).includes("SERV-SUPPLY-01")
        purchase.priceRows.length > 0
        purchase.priceRows.every(r => r.direction === "purchase")
    }
})

feature("the organization scope bounds lists, searches, tags, check reports and internal callbacks", {
    when() {
        return as("catalog.reader", () => {
            const scoped = {
                own: access("BOSS_PRD_OWN"),
                shared: access("DEMO_SA_1"),
                list: call(CATALOG + "find#Products", {text: "catalog sample"}).productList.map(row => row.productId),
                tagged: call(CATALOG + "find#Products", {tagIds: ["BOSS_PRD_TAG"]}).productList.map(row => row.productId),
                ownCode: call(CATALOG + "search#ProductIds", {text: "BOSS-OWN-CODE"}).rows,
                otherCode: call(CATALOG + "search#ProductIds", {text: "BOSS-OTHER-CODE"}).rows,
                palette: call(CATALOG + "search#Catalog", {text: "BOSS-OTHER-CODE"}).rows,
                report: call("mantle.product.CatalogCheckServices.validate#Catalog", {
                    productIds: ["BOSS_CHK_EMPTY", "BOSS_PRD_OTHER"],
                    checkIds: ["requiredFields"]
                })
            }
            // a forged user context in an internal callback with authorization off does not widen the membership scope
            ec.user.context.filterOrgIds = ["ORG_ZIZI_RETAIL"]
            ec.user.context.activeOrgId = "ORG_ZIZI_RETAIL"
            ec.artifactExecution.disableAuthz()
            scoped.forged = {
                other: access("BOSS_PRD_OTHER"),
                own: access("BOSS_PRD_OWN"),
                arbitrary: access("EX_JOHN_DOE", "read", {recordEntityName: "moqui.security.UserAccount"})
            }
            return scoped
        })
    },
    then({own, shared, list, tagged, ownCode, otherCode, palette, report, forged}) {
        own.record.productId == "BOSS_PRD_OWN"
        own.canWrite == false
        shared.record.ownerPartyId == "_NA_"
        list == ["BOSS_PRD_OWN"]
        tagged == ["BOSS_PRD_OWN"]
        ownCode.length == 1
        ownCode[0].url == "/qapps/Products/Products/Product360?productId=BOSS_PRD_OWN"
        otherCode == []
        palette == []
        report.checkedCount == 1
        report.issueRows.some(r => r.productId === "BOSS_PRD_OTHER" && r.checkId === "record")
        !JSON.stringify(report).includes("Retail catalog sample")
        forged.other.record == null
        forged.own.record.productId == "BOSS_PRD_OWN"
        forged.arbitrary.record == null
    }
})

feature("another organization's product, feature group and staged import are hidden by their owner", {
    when() {
        setup(() => {
            call("store#mantle.product.feature.ProductFeatureGroup", {
                productFeatureGroupId: "BOSS_ACCESS_OTHER_GROUP",
                description: "Hidden access group",
                ownerPartyId: "ORG_ZIZI_RETAIL"
            })
        })
        const staged = as("catalog.edit", () => call(IMPORT + "stage#CatalogImport", stageProducts()))
        const group = "mantle.product.feature.ProductFeatureGroup"
        return as("catalog.reader", () => {
            const hidden = {
                record: access("BOSS_PRD_OTHER"),
                detail: refusal(CATALOG + "get#ProductDetail", {productId: "BOSS_PRD_OTHER"}),
                ownLink: call(PALETTE, {docType: "MantleProduct", id: "BOSS_PRD_OWN"}).url,
                otherLink: call(PALETTE, {docType: "MantleProduct", id: "BOSS_PRD_OTHER"}).url,
                ownGroup: call(PALETTE, {recordEntityName: group, id: "BOSS_PRD_GROUP"}).url,
                ownFeature: call(PALETTE, {recordEntityName: "mantle.product.feature.ProductFeature", id: "BOSS_PRD_FEATURE"})
                    .url,
                category: call(PALETTE, {recordEntityName: "mantle.product.category.ProductCategory", id: "BOSS_PRD_CAT"}).url,
                otherGroup: call(PALETTE, {recordEntityName: group, id: "BOSS_ACCESS_OTHER_GROUP"}).url,
                staged: refusal(IMPORT + "get#CatalogImportReport", {operationKey: staged.operationKey})
            }
            // the shared record callbacks, called internally with authorization off, still check the real owner
            ec.artifactExecution.disableAuthz()
            const info = (entity, id) => call(LINK_INFO, {recordEntityName: entity, recordId: id, checkOnly: true}).recordVisible
            hidden.ownInfo = info("mantle.product.Product", "BOSS_PRD_OWN")
            hidden.otherInfo = info("mantle.product.Product", "BOSS_PRD_OTHER")
            hidden.otherGroupInfo = info(group, "BOSS_ACCESS_OTHER_GROUP")
            return hidden
        })
    },
    then({
        record,
        detail,
        ownLink,
        otherLink,
        ownInfo,
        otherInfo,
        ownGroup,
        ownFeature,
        category,
        otherGroup,
        otherGroupInfo,
        staged
    }) {
        record.record == null
        record.canRead == false
        detail.includes("is not available")
        ownLink == "/qapps/Products/Products/Product360?productId=BOSS_PRD_OWN"
        otherLink == null
        ownInfo == true
        otherInfo == false
        ownGroup == "/qapps/Products/Features/FeatureGroups/FeatureGroupDetail?productFeatureGroupId=BOSS_PRD_GROUP"
        ownFeature == "/qapps/Products/Features/FeatureDetail?productFeatureId=BOSS_PRD_FEATURE"
        category == "/qapps/Products/Categories/CategoryDetail?productCategoryId=BOSS_PRD_CAT"
        otherGroup == null
        otherGroupInfo == false
        staged.includes("Open your own catalog import")
    }
})

feature("catalog writes need the editor grant over the owner, and shared records the administrator", {
    when() {
        const mount = (app, transition, parameters, method) => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/" + app + ".xml")
                .render(
                    "RecordFiles/" + transition,
                    Object.assign({recordEntity: "mantle.product.Product", recordId: "BOSS_PRD_OWN"}, parameters),
                    method
                )
            let data = null
            try {
                data = JSON.parse(result.output)
            } catch (err) {}
            const out = {data, errors: result.errorMessages.join(" | ") || (data && data.errors) || ""}
            ec.message.clearErrors()
            return out
        }
        const editor = as("catalog.edit", () => ({
            own: access("BOSS_PRD_OWN", "catalogEdit"),
            other: access("BOSS_PRD_OTHER", "catalogEdit"),
            shared: access("DEMO_SA_1", "catalogEdit"),
            price: access("BOSS_PRD_OWN", "priceEdit"),
            files: mount("Products", "filesData", {}, "get"),
            stage: refusal(IMPORT + "stage#CatalogImport", stageProducts())
        }))
        const reader = as("catalog.reader", () => ({
            own: access("BOSS_PRD_OWN", "catalogEdit"),
            files: mount("Products", "filesData", {}, "get"),
            stage: refusal(IMPORT + "stage#CatalogImport", stageProducts()),
            upload: mount("Products", "upload", {contentFile: uploadedFile("reader-refused.txt", "refused")}, "post").errors,
            commons: mount("Commons", "upload", {contentFile: uploadedFile("reader-refused.txt", "refused")}, "post").errors,
            writes: unrefused([
                [
                    CATALOG + "store#Product",
                    {productId: "BOSS_PRD_OWN", productName: "Denied"},
                    "Catalog editor authority is required"
                ],
                [
                    CATALOG + "transition#ProductStatus",
                    {productId: "BOSS_PRD_OWN", statusId: "PrdDiscontinued"},
                    "is not available for this action"
                ],
                [
                    CATALOG + "store#CatalogRow",
                    {kind: "identifier", productId: "BOSS_PRD_OWN", productIdTypeEnumId: "PidtSku", idValue: "DENIED"},
                    "is not available for this action"
                ],
                [
                    CATALOG + "store#ProductContent",
                    {productId: "BOSS_PRD_OWN", productContentTypeEnumId: "PcntDescription", contentText: "Denied"},
                    "Catalog edit access is required"
                ],
                [
                    CATALOG + "clone#Product",
                    {baseProductId: "BOSS_PRD_OWN", productId: "DENIED_CLONE"},
                    "Catalog editor authority is required"
                ],
                [CATALOG + "delete#UnusedDraft", {productId: "BOSS_PRD_DRAFT"}, "is not available for this action"],
                [
                    "ironstone.products.CategoryServices.store#Category",
                    {productCategoryId: "BOSS_PRD_CAT", categoryName: "Denied"},
                    "Catalog editor authority over the owner is required"
                ],
                [
                    "ironstone.products.VariantServices.create#VariantProducts",
                    {productId: "BOSS_PRD_VIRT", selectedFeatureSets: []},
                    "is not available for this action"
                ],
                [
                    CATALOG + "store#ProductPrice",
                    {
                        productId: "BOSS_PRD_OWN",
                        vendorPartyId: "ORG_ZIZI_SERVICES",
                        priceTypeEnumId: "PptCurrent",
                        priceUomId: "USD",
                        price: 1
                    },
                    "Sales-price authority is required"
                ],
                [
                    "mantle.product.ProductServices.store#ProductPackaging",
                    {packProductId: "BOSS_PRD_PACK", baseProductId: "BOSS_PRD_OWN", quantity: 24, changeReason: "Denied"},
                    "is not authorized for AT_SERVICE"
                ],
                [
                    "mantle.product.IdentifierServices.store#IdentifierPolicy",
                    {organizationPartyId: "ORG_ZIZI_SERVICES", productIdTypeEnumId: "PidtSku", changeReason: "Denied"},
                    "is not authorized for AT_SERVICE"
                ],
                [
                    "org.moqui.impl.UnitServices.store#Unit",
                    {uomId: "DENIED", description: "Denied", uomTypeEnumId: "UT_OTHER_MEASURE", changeReason: "Denied"},
                    "is not authorized for AT_SERVICE"
                ],
                [
                    "mantle.product.CatalogCheckServices.validate#Catalog",
                    {productIds: ["BOSS_PRD_OWN"], checkIds: ["estimates", "prices"]},
                    "needs additional read authority"
                ]
            ])
        }))
        return {editor, reader, admin: access("DEMO_SA_1", "catalogEdit")}
    },
    then({editor, reader, admin}) {
        editor.own.canWrite == true
        editor.other.record == null
        editor.shared.record == null
        editor.price.record == null
        admin.canWrite == true
        reader.own.record == null
        editor.files.data.canUpload == true
        reader.files.data.visible == true
        reader.files.data.canUpload == false
        reader.upload.includes("You may not add files")
        reader.commons.includes("You may not add files")
        editor.stage == ""
        reader.stage.includes("needs its own edit authority")
        reader.writes == ""
    }
})

feature("supplier prices, stock policy and methods keep their own grants over every Products grant", {
    when() {
        return {
            supplier: as("catalog.price.edit", () =>
                unrefused([
                    ["ironstone.products.SupplierServices.find#SupplierPrices", {}, "Supplier-price authority is required"],
                    [
                        "ironstone.products.SupplierServices.get#SupplierDetail",
                        {vendorPartyId: "BOSS_PRD_SUPPLIER"},
                        "Supplier-price authority is required"
                    ],
                    [
                        "ironstone.products.SupplierServices.store#SupplierPrice",
                        {productId: "BOSS_PRD_OWN", vendorPartyId: "BOSS_PRD_SUPPLIER", price: 1, priceUomId: "USD"},
                        "Supplier-price authority is required"
                    ]
                ])
            ),
            stock: as("catalog.edit", () =>
                unrefused(
                    ["store#FacilityPolicy", "store#TrackingPolicy"].map(name => [
                        "ironstone.products.InventoryServices." + name,
                        {
                            productId: "BOSS_PRD_OWN",
                            facilityId: "BOSS_PRD_WH",
                            minimumStock: 1,
                            lotRequired: "Y",
                            changeReason: "Refused"
                        },
                        "Warehouse stock-planner or manager authority is required"
                    ])
                )
            ),
            methods: as("catalog.admin", () =>
                unrefused(
                    [
                        "store#Bom",
                        "store#BomItem",
                        "release#BomDraft",
                        "get#BomExplosion",
                        "store#Routing",
                        "store#RoutingOperation",
                        "release#RoutingDraft",
                        "store#WorkCenter",
                        "store#WorkCenterRate"
                    ].map(name => [
                        "ironstone.products.MethodServices." + name,
                        {productId: "BOSS_PRD_OWN", componentProductId: "BOSS_PRD_OWN", changeReason: "Guard probe"},
                        /Manufacturing (edit|approve|read|resources) authority is required/
                    ])
                )
            )
        }
    },
    then({supplier, stock, methods}) {
        supplier == ""
        stock == ""
        methods == ""
    }
})
