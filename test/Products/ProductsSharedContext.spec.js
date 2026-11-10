const C = "ironstone.products.CatalogServices."
function as(user, on, run) {
    login(user)
    if (on) ec.artifactExecution.enableAuthz()
    else ec.artifactExecution.disableAuthz()
    try {
        return run()
    } finally {
        ec.message.clearErrors()
        ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
function refused(name, p) {
    try {
        call(name, p)
        return ec.message.hasError()
    } catch (e) {
        return true
    } finally {
        ec.message.clearErrors()
    }
}
spec({
    cleanup() {
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})
feature("shared catalog routing derives the Products context and grants", {
    when() {
        return as("catalog.reader", true, () =>
            call(C + "get#SharedContext", {
                appRoot: "Products",
                capabilities: {costRead: true},
                ownerPartyIds: ["ORG_ZIZI_RETAIL"],
                productTabs: ["Forged"],
                includeConnections: true
            })
        )
    },
    then(r) {
        r.appRoot == "Products"
        r.sharedLinks["Products/Product360"] == "//Products/Products/Product360"
        r.printBase == "/apps/Products"
        r.productTabs.includes("Summary")
        !r.productTabs.includes("Forged")
        r.capabilities.costRead == false
        !r.ownerPartyIds.includes("ORG_ZIZI_RETAIL")
        !r.connectionTypes.includes("Invoices")
        !r.connectionTypes.includes("Orders")
        !r.connectionTypes.includes("Shipments")
    }
})
feature("unimplemented app contexts are rejected at every shared controller", {
    when() {
        return as("catalog.admin", true, () => {
            const names = [
                C + "get#SharedContext",
                C + "get#CatalogRecord",
                C + "get#ProductDetail",
                C + "get#PriceOptions",
                "ironstone.products.SupplierServices.find#SupplierPrices",
                "ironstone.products.PriceListServices.find#ProductPriceLists",
                "ironstone.products.InventoryServices.get#InventorySummary",
                "ironstone.products.MethodServices.get#MethodContext",
                "ironstone.products.CostServices.get#CostContext",
                "ironstone.products.DocumentServices.get#DocumentContext",
                "ironstone.products.ProductToolsServices.get#ToolsContext",
                "ironstone.products.CheckServices.get#CheckContext",
                "ironstone.products.ImportServices.get#ImportContext"
            ]
            return {
                failures: names.filter(
                    n => !refused(n, {appRoot: "Warehouse", recordId: "BOSS_PRD_OWN", productId: "BOSS_PRD_OWN"})
                )
            }
        })
    },
    then({failures}) {
        if (failures.length) log.warn("Accepted unexpected app root: " + failures.join(", "))
        failures == []
    }
})
feature("connection visibility follows actual root authorizations rather than an app group name", {
    when() {
        const userId = ec.entity
                .find("moqui.security.UserAccount")
                .condition("username", "catalog.reader")
                .disableAuthz()
                .one().userId,
            fromDate = "2000-01-01T00:00:00Z"
        ec.artifactExecution.disableAuthz()
        call("store#moqui.security.UserGroup", {
            userGroupId: "CATALOG_CONNECTION_TEST",
            description: "Connection root grant test"
        })
        call("store#moqui.security.ArtifactGroup", {
            artifactGroupId: "CATALOG_CONNECTION_TEST",
            description: "Connection root grant test"
        })
        call("store#moqui.security.ArtifactGroupMember", {
            artifactGroupId: "CATALOG_CONNECTION_TEST",
            artifactName: "component://mr-boss/screen/Warehouse.xml",
            artifactTypeEnumId: "AT_XML_SCREEN",
            authzActionEnumId: "AUTHZA_VIEW",
            nameIsPattern: "N"
        })
        call("store#moqui.security.ArtifactAuthz", {
            artifactAuthzId: "CATALOG_CONNECTION_TEST",
            userGroupId: "CATALOG_CONNECTION_TEST",
            artifactGroupId: "CATALOG_CONNECTION_TEST",
            authzTypeEnumId: "AUTHZT_ALLOW",
            authzActionEnumId: "AUTHZA_VIEW",
            inheritAuthz: "Y"
        })
        call("store#moqui.security.UserGroupMember", {userId, userGroupId: "CATALOG_CONNECTION_TEST", fromDate})
        let allowed
        try {
            allowed = as("catalog.reader", false, () => call(C + "get#SharedContext", {includeConnections: true}).connectionTypes)
        } finally {
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition({userId, userGroupId: "CATALOG_CONNECTION_TEST", fromDate})
                .disableAuthz()
                .deleteAll()
        }
        return {
            allowed,
            after: as("catalog.reader", false, () => call(C + "get#SharedContext", {includeConnections: true}).connectionTypes)
        }
    },
    then({allowed, after}) {
        allowed.includes("Shipments")
        !allowed.includes("Invoices")
        !after.includes("Shipments")
    }
})
feature("Product360 keeps its tab and link context when a request supplies forged routing metadata in #mode", {
    where: [{mode: "qvt"}, {mode: "html"}, {mode: "tui"}],
    when({mode}) {
        return as("catalog.reader", false, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Products.xml")
                .renderMode(mode)
                .withStaticData()
                .render(
                    "Products/Product360/Summary",
                    {
                        productId: "BOSS_PRD_OWN",
                        product360Tabs: ["Costs"],
                        sharedLinks: {"Products/Product360": "//Accounting/Bad"}
                    },
                    null
                )
        )
    },
    then(r) {
        r.status == 200
        r.errorMessages.length == 0
        const rendered = r.mode === "tui" ? JSON.stringify(JSON.parse(r.output).c) : r.output
        !rendered.includes("//Accounting/Bad")
        !/Error rendering|Exception in render/.test(r.output)
    }
})
feature("paid-access writes stay in Commerce even when a holder calls the read-only Products mount", {
    when() {
        const productId = "PRD_RO_PAID",
            subscriptionResourceId = "BOSS_COM_PAID_ACCESS",
            fromDate = new Date(Number(ec.user.nowTimestamp) + 86400000).toISOString()
        as("john.doe", false, () => {
            call("create#mantle.product.Product", {productId, productTypeEnumId: "PtDigital", ownerPartyId: "ORG_ZIZI_SERVICES"})
            call("create#mantle.product.store.ProductStoreProduct", {productStoreId: "BOSS_COM_DIGITAL", productId,
                fromDate: "2000-01-01T00:00:00Z", publicationKindEnumId: "PspkPublished"})
            call("create#mantle.product.subscription.ProductSubscriptionResource", {productId, subscriptionResourceId,
                fromDate, availableTime: 1, availableTimeUomId: "TF_mon"})
        })
        const write = (user, app, forged = null) => as(user, true, () =>
            ec.screen.makeTest().rootScreen("component://mr-boss/screen/" + app + ".xml").render(
                (app === "Commerce" ? "Merchandising" : "Products") + "/Product360/PaidAccess/savePaidAccess",
                {productId, subscriptionResourceId, fromDate, change: "Y", availableTime: 2, appRoot: forged}, "post"))
        const value = () => Number(ec.entity.find("mantle.product.subscription.ProductSubscriptionResource")
            .condition({productId, subscriptionResourceId}).disableAuthz().one().availableTime)
        const holder = write("john.doe", "Products"), holderValue = value(),
            forged = write("john.doe", "Products", "Commerce"), forgedValue = value(),
            nonholder = write("catalog.reader", "Products"),
            commerce = write("john.doe", "Commerce")
        return {holder, holderValue, forged, forgedValue, nonholder, commerce, savedValue: value()}
    },
    then(r) {
        r.holder.errorMessages.join(" ").includes("Commerce context")
        r.forged.errorMessages.join(" ").includes("Commerce context")
        r.nonholder.errorMessages.join(" ").includes("Commerce context")
        r.holderValue == 1
        r.forgedValue == 1
        r.commerce.errorMessages.length == 0
        r.savedValue == 2
    }
})
feature("inherited stock and supplier actions require their owning app context", {
    when() {
        const productId = "PRD_CTX_PRODUCT", assetId = "PRD_CTX_ASSET", vendorPartyId = "PRD_CTX_SUPPLIER",
            facilityId = "BOSS_PRD_WH", organizationPartyId = "ORG_ZIZI_SERVICES"
        as("john.doe", false, () => {
            call("create#mantle.product.Product", {productId, ownerPartyId: organizationPartyId, productTypeEnumId: "PtAsset"})
            for (const locationSeqId of ["CTX_FROM", "CTX_TO"])
                call("create#mantle.facility.FacilityLocation", {facilityId, locationSeqId})
            call("create#mantle.product.asset.Asset", {assetId, productId, facilityId, locationSeqId: "CTX_FROM",
                ownerPartyId: organizationPartyId, assetTypeEnumId: "AstTpInventory", statusId: "AstAvailable",
                hasQuantity: "Y", quantityOnHandTotal: 1, availableToPromiseTotal: 1})
            call("create#mantle.party.Party", {partyId: vendorPartyId, partyTypeEnumId: "PtyOrganization", ownerPartyId: organizationPartyId})
            call("create#mantle.party.Organization", {partyId: vendorPartyId, organizationName: "Context supplier"})
            call("create#mantle.party.PartyRole", {partyId: vendorPartyId, roleTypeId: "Supplier"})
        })
        const render = (user, app, path, parameters) => as(user, true, () => ec.screen.makeTest()
            .rootScreen("component://mr-boss/screen/" + app + ".xml").render(path, parameters, "post"))
        const move = {productId, facilityId, assetIdList: [assetId], toLocationSeqId: "CTX_TO", reason: "Context guard",
            operationKey: "PRD_CTX_MOVE", appRoot: "Warehouse"}
        const stock = render("john.doe", "Products", "Products/Product360/Stock/Locations/relocateAssets", move)
        const location = () => ec.entity.find("mantle.product.asset.Asset").condition({assetId}).disableAuthz().one().locationSeqId
        const refusedLocation = location()
        const stockReader = render("catalog.reader", "Products", "Products/Product360/Stock/Locations/relocateAssets", move)
        const warehouse = render("john.doe", "Warehouse", "Inventory/Availability/Locations/relocateAssets", move)
        const supplierArgs = {vendorPartyId, organizationPartyId, reason: "Context guard", appRoot: "Purchasing"}
        const supplier = render("john.doe", "Products", "SupplierPrices/Supplier360/submitSupplier", supplierArgs)
        const profiles = () => ec.entity.find("mantle.party.supplier.SupplierProfile")
            .condition({supplierPartyId: vendorPartyId, organizationPartyId}).disableAuthz().list()
        const refusedProfiles = profiles().length
        const purchasing = render("john.doe", "Purchasing", "Suppliers/Supplier360/submitSupplier", supplierArgs)
        return {stock, stockReader, refusedLocation, warehouse, savedLocation: location(), supplier, refusedProfiles,
            purchasing, supplierStatus: profiles()[0]?.approvalStatusId}
    },
    then(r) {
        r.stock.errorMessages.join(" ").includes("Warehouse context")
        r.stockReader.errorMessages.join(" ").includes("Warehouse context")
        r.refusedLocation == "CTX_FROM"
        r.warehouse.errorMessages.length == 0
        r.savedLocation == "CTX_TO"
        r.supplier.errorMessages.join(" ").includes("Purchasing context")
        r.refusedProfiles == 0
        r.purchasing.errorMessages.length == 0
        r.supplierStatus == "SupaPending"
    }
})
