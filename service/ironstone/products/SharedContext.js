// App routing and launcher capabilities for shared catalog mounts. Domain permissions are checked again in Mantle.
// Another app adds an authorized branch here, its Product360 tab names, route overrides, and its shared screen mounts.
const call = (n, p = {}) => ec.service.sync().name(n).parameters(p).call() || {}
const productTabs = [
    "Summary",
    "Features",
    "Categories",
    "Identifiers",
    "Dimensions",
    "Documents",
    "Associations",
    "Parties",
    "KitComponents",
    "Connections",
    "History",
    "Equipment",
    "Prices",
    "Suppliers",
    "Stock",
    "BOM",
    "Costs",
    "Packaging"
]
const paths = [
    "Categories/CategoryDetail",
    "DocumentDetail/datasheet",
    "Documents",
    "Features/FeatureDetail",
    "InventoryValuation",
    "Prices/CostHistory",
    "Prices/CostRollup",
    "Prices/PriceExplain",
    "Prices/PriceHistory",
    "Prices/PriceLists/PriceListDetail",
    "Prices/StandardCosts",
    "ProductImport",
    "Products/BulkPrice",
    "Products/Product360",
    "Products/VariantBuilder",
    "SupplierPrices/Supplier360",
    "Translations",
    "Units/Labels"
]
// Read the user's root grants directly: inherited screen authorization and disabled authz cannot grant another launcher.
function mayOpen(app) {
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return false
    if (ec.user.isInGroup("ADMIN")) return true
    const root = "component://mr-boss/screen/" + app + ".xml",
        groups = Array.from(ec.user.getUserGroupIdSet() || [])
    const grants = Array.from(
        ec.entity
            .find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groups)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .disableAuthz()
            .list()
    ).filter(r => (r.nameIsPattern === "Y" ? new RegExp("^(?:" + r.artifactName + ")$").test(root) : r.artifactName === root))
    return (
        grants.some(r => ["AUTHZT_ALLOW", "AUTHZT_ALWAYS"].includes(r.authzTypeEnumId)) &&
        !grants.some(r => r.authzTypeEnumId === "AUTHZT_DENY")
    )
}
// Warehouse's mounts (impl-warehouse P4: Inventory/Product360 and Inventory/Availability): a Warehouse user who reads the
// catalog (PRODUCT_CATALOG_VIEW) sees the physical tabs, master read only, the stock policy by its Warehouse permissions,
// and stock in their Warehouse facilities only (ironstone.warehouse.AccessServices' scope, facilityIds).
const warehouseTabs = ["Summary", "Identifiers", "Dimensions", "Stock", "Replenishment", "Documents", "History"]
function warehouseContext() {
    const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
    const userScope = warehouse.scope()
    if (!userScope.read) throw new Error("Shared catalog context is not available")
    const a = call("ironstone.products.CatalogServices.get#CatalogAccess"),
        read = !!a.capabilities?.read,
        capabilities = {
            systemAdmin: !!a.capabilities?.systemAdmin,
            read,
            stockPlan: read && !!(userScope.capabilities.policyPlan || userScope.capabilities.policyManage),
            stockManage: read && !!userScope.capabilities.policyManage
        }
    for (const name of ["catalogEdit", "catalogAdmin", "priceRead", "priceEdit", "supplierPriceRead", "supplierPriceEdit"])
        capabilities[name] = false
    for (const name of ["costRead", "costEstimate", "costApprove", "methodRead", "methodEdit", "methodApprove"])
        capabilities[name] = false
    Object.assign(capabilities, {methodAdmin: false, glPost: false, marginRead: false})
    return {
        capabilities,
        appRoot: "Warehouse",
        linkBase: "//Warehouse",
        webBase: "/qapps/Warehouse",
        printBase: "/apps/Warehouse",
        sharedLinks: {
            "": "//Warehouse/Inventory",
            "Products/Product360": "//Warehouse/Inventory/Product360",
            // Supplier360's Receiving tab (P7)
            "Receiving/ReceiptDetail": "//Warehouse/Receiving/ReceiptDetail"
        },
        productTabs: read ? warehouseTabs : [],
        connectionTypes: [],
        ownerPartyIds: read ? a.ownerPartyIds : [],
        organizationPartyIds: read ? a.organizationPartyIds : [],
        activeOrganizationPartyId: read ? a.activeOrganizationPartyId : null,
        facilityIds: read ? warehouse.facilityIds(userScope) : []
    }
}
// Manufacturing's mounts (impl-manufacturing P2; crosscut §3.5, §3.23): Shared/Product360 under BillsOfMaterials and the five
// method screens. A Manufacturing user who reads methods (METHOD_VIEW) reads the product master of their organizations'
// products read only, with the crosscut's Manufacturing tabs: Summary, Identifiers, Dimensions & units, BOM (with where used
// and the routing), Costs with cost read only, Stock and Documents, and Kit components read only (a kit's components, which
// where used links to). Method edit, release and cost write stay their own permissions, checked again in Mantle.
const manufacturingTabs = ["Summary", "Identifiers", "Dimensions", "BOM", "Costs", "Stock", "KitComponents", "Documents"]
const manufacturingPaths = {
    "": "BillsOfMaterials",
    "Products/Product360": "BillsOfMaterials/Product360",
    BillOfMaterialsDetail: "BillsOfMaterials/BillOfMaterialsDetail",
    WhereUsed: "BillsOfMaterials/WhereUsed",
    "Prices/CostRollup": "BillsOfMaterials/CostRollup",
    Routings: "Routings",
    RoutingDetail: "Routings/RoutingDetail",
    OperationTemplates: "Routings/OperationTemplates",
    // impl-manufacturing P5a: Product360's Open runs link
    WorkOrders: "WorkOrders/Find"
}
function manufacturingContext() {
    const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")
    const userScope = manufacturing.scope()
    if (!userScope.read) throw new Error("Shared catalog context is not available")
    const a = call("ironstone.products.CatalogServices.get#CatalogAccess"),
        source = a.capabilities || {},
        read = !!source.methodRead
    const capabilities = {systemAdmin: !!source.systemAdmin, read}
    for (const name of ["catalogEdit", "catalogAdmin", "priceRead", "priceEdit", "supplierPriceRead", "supplierPriceEdit"])
        capabilities[name] = false
    for (const name of ["costRead", "costEstimate", "costApprove", "methodRead", "methodEdit", "methodApprove", "methodAdmin"])
        capabilities[name] = read && !!source[name]
    Object.assign(capabilities, {stockPlan: false, stockManage: false, glPost: false, marginRead: false})
    return {
        capabilities,
        appRoot: "Manufacturing",
        linkBase: "//Manufacturing",
        webBase: "/qapps/Manufacturing",
        printBase: "/apps/Manufacturing",
        sharedLinks: Object.fromEntries(
            Object.entries(manufacturingPaths).map(([key, path]) => [key, "//Manufacturing/" + path])
        ),
        productTabs: read ? manufacturingTabs.filter(tab => tab !== "Costs" || capabilities.costRead) : [],
        connectionTypes: [],
        ownerPartyIds: read ? a.ownerPartyIds : [],
        organizationPartyIds: read ? a.organizationPartyIds : [],
        activeOrganizationPartyId: read ? a.activeOrganizationPartyId : null
    }
}
// Purchasing's mounts (impl-purchasing P2; crosscut §3.3, §3.5, §3.21): Shared/Product360 under Products, and Supplier360,
// SupplierPrices and PriceExplain under Suppliers. A Purchasing user with the buying lists (listRead) who reads the catalog
// (PRODUCT_CATALOG_VIEW) reads the product master read only with the crosscut's Purchasing tabs: Summary, Identifiers,
// Dimensions & units, Packaging, Suppliers (supplier prices, for a supplier-price reader), Stock, Documents, and BOM for a
// method reader. Prices are the purchase direction only (no sales price read); supplier-price edit, cost read and method read
// stay their own permissions, checked again in Mantle.
// P15: the Purchase history tab, the product's quotes and purchase order lines (Purchasing's ReportServices)
const purchasingTabs = [
    "Summary",
    "Identifiers",
    "Dimensions",
    "Packaging",
    "Suppliers",
    "Stock",
    "Documents",
    "BOM",
    "PurchaseHistory"
]
const purchasingPaths = {
    "": "Suppliers",
    "Products/Product360": "Products/Product360",
    "SupplierPrices/Supplier360": "Suppliers/Supplier360",
    "Suppliers/Supplier360": "Suppliers/Supplier360",
    "Suppliers/SupplierPrices": "Suppliers/SupplierPrices",
    "Prices/PriceExplain": "Suppliers/PriceExplain",
    "Performance/PurchaseHistory": "Performance/PurchaseHistory"
}
function purchasingContext() {
    const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
    const userScope = purchasing.scope()
    // the buying lists' catalog read (P2: Product360, SupplierPrices, PriceExplain) or Replenishment's stock read (P14a:
    // InventoryAvailability, its Stock tab and, for a stock-policy holder, the reorder policy)
    const replenishment = !!userScope.capabilities.replenishment
    if (!userScope.read || !(userScope.capabilities.listRead || replenishment))
        throw new Error("Shared catalog context is not available")
    const a = call("ironstone.products.CatalogServices.get#CatalogAccess"),
        source = a.capabilities || {},
        catalogRead = !!source.read && !!userScope.capabilities.listRead,
        read = catalogRead || replenishment
    const capabilities = {systemAdmin: !!source.systemAdmin, read}
    for (const name of ["catalogEdit", "catalogAdmin", "priceRead", "priceEdit", "costEstimate", "costApprove"])
        capabilities[name] = false
    for (const name of ["supplierPriceRead", "supplierPriceEdit", "costRead", "methodRead"])
        capabilities[name] = catalogRead && !!source[name]
    Object.assign(capabilities, {
        methodEdit: false,
        methodApprove: false,
        methodAdmin: false,
        stockPlan: replenishment && !!userScope.capabilities.stockPolicy,
        stockManage: false,
        glPost: false,
        marginRead: false
    })
    return {
        capabilities,
        appRoot: "Purchasing",
        linkBase: "//Purchasing",
        webBase: "/qapps/Purchasing",
        printBase: "/apps/Purchasing",
        sharedLinks: Object.fromEntries(Object.entries(purchasingPaths).map(([key, path]) => [key, "//Purchasing/" + path])),
        productTabs: catalogRead
            ? purchasingTabs.filter(
                  tab => (tab !== "Suppliers" || capabilities.supplierPriceRead) && (tab !== "BOM" || capabilities.methodRead)
              )
            : replenishment
              ? ["Stock"]
              : [],
        connectionTypes: [],
        ownerPartyIds: read ? a.ownerPartyIds : [],
        organizationPartyIds: read ? a.organizationPartyIds : [],
        activeOrganizationPartyId: read ? a.activeOrganizationPartyId : null
    }
}
// Customer Service's mounts (impl-customer-service P3, F52; crosscut §3.5, §3.7, §3.21): Shared/Product360,
// InventoryAvailability and PriceExplain under Availability. A Customer Service user who reads the catalog (PRODUCT_CATALOG_VIEW, every Customer
// Service user) reads the product master read only with the crosscut's Customer Service tabs: Summary, Identifiers,
// Dimensions & units, Stock (availability at the customer-serving facilities: the inventory facilities of the user's
// organizations' stores, else their warehouses), Documents, and Prices with their explanation for a price reader
// (PRICE_VIEW). No cost, supplier price, margin, method or stock policy: those capabilities are off here whatever the user
// holds, so Mantle's reads leave them out. An unready projection shows unknown, never zero (Inventory.js projection, F31).
const customerServiceTabs = ["Summary", "Identifiers", "Dimensions", "Stock", "Documents", "Prices"]
const customerServicePaths = {
    "": "Availability",
    "Products/Product360": "Availability/Product360",
    "Prices/PriceExplain": "Availability/PriceExplain",
    "Availability/InventoryAvailability": "Availability/InventoryAvailability",
    "Availability/StockAtDate": "Availability/StockAtDate"
}
function customerServiceFacilities(organizationPartyIds) {
    const stores = Array.from(
        ec.entity
            .find("mantle.product.store.ProductStore")
            .condition("organizationPartyId", "in", organizationPartyIds.length ? organizationPartyIds : ["_NA_"])
            .disableAuthz()
            .list()
    )
    const ids = new Set(stores.map(store => store.inventoryFacilityId).filter(Boolean))
    if (stores.length)
        for (const row of ec.entity
            .find("mantle.product.store.ProductStoreFacility")
            .condition(
                "productStoreId",
                "in",
                stores.map(store => store.productStoreId)
            )
            .disableAuthz()
            .list())
            ids.add(row.facilityId)
    if (!ids.size)
        for (const row of ec.entity
            .find("mantle.facility.Facility")
            .condition("ownerPartyId", "in", organizationPartyIds.length ? organizationPartyIds : ["_NA_"])
            .condition("facilityTypeEnumId", "FcTpWarehouse")
            .disableAuthz()
            .list())
            ids.add(row.facilityId)
    return Array.from(ids)
}
function customerServiceContext() {
    const service = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
    const userScope = service.scope()
    if (!userScope.read) throw new Error("Shared catalog context is not available")
    const a = call("ironstone.products.CatalogServices.get#CatalogAccess"),
        source = a.capabilities || {},
        read = !!source.read
    const capabilities = {systemAdmin: !!source.systemAdmin, read, priceRead: read && !!source.priceRead}
    for (const name of ["catalogEdit", "catalogAdmin", "priceEdit", "supplierPriceRead", "supplierPriceEdit"])
        capabilities[name] = false
    for (const name of ["costRead", "costEstimate", "costApprove", "methodRead", "methodEdit", "methodApprove", "methodAdmin"])
        capabilities[name] = false
    Object.assign(capabilities, {stockPlan: false, stockManage: false, glPost: false, marginRead: false})
    const organizationPartyIds = service.vendorIds(userScope)
    return {
        capabilities,
        appRoot: "CustomerService",
        linkBase: "//CustomerService",
        webBase: "/qapps/CustomerService",
        printBase: "/apps/CustomerService",
        sharedLinks: Object.fromEntries(
            Object.entries(customerServicePaths).map(([key, path]) => [key, "//CustomerService/" + path])
        ),
        productTabs: read ? customerServiceTabs.filter(tab => tab !== "Prices" || capabilities.priceRead) : [],
        connectionTypes: [],
        ownerPartyIds: read ? a.ownerPartyIds : [],
        organizationPartyIds: read ? a.organizationPartyIds : [],
        activeOrganizationPartyId: read ? a.activeOrganizationPartyId : null,
        facilityIds: read ? customerServiceFacilities(organizationPartyIds) : []
    }
}
function context(p) {
    const appRoot = p.appRoot || ec.context.appRoot || "Products"
    if (appRoot === "CustomerService") return customerServiceContext()
    if (appRoot === "Warehouse") return warehouseContext()
    if (appRoot === "Manufacturing") return manufacturingContext()
    if (appRoot === "Purchasing") return purchasingContext()
    if (appRoot !== "Products") throw new Error("Shared catalog context is not available")
    const a = call("ironstone.products.CatalogServices.get#CatalogAccess"),
        read = !!a.capabilities?.read,
        sharedLinks = Object.fromEntries(paths.map(path => [path, "//" + appRoot + "/" + path]))
    sharedLinks[""] = "//" + appRoot
    return Object.assign({}, a, {
        appRoot,
        linkBase: "//" + appRoot,
        webBase: "/qapps/" + appRoot,
        printBase: "/apps/" + appRoot,
        sharedLinks,
        productTabs: read ? productTabs : [],
        connectionTypes:
            read && p.includeConnections
                ? Object.entries({
                      Orders: ["Sales", "Purchasing"],
                      Invoices: ["Accounting"],
                      Shipments: ["Warehouse"],
                      Production: ["Manufacturing"],
                      Requests: ["Commons", "Projects"],
                      Agreements: ["Sales", "Purchasing"]
                  })
                      .filter(([, apps]) => apps.some(mayOpen))
                      .map(([kind]) => kind)
                : [],
        ownerPartyIds: read ? a.ownerPartyIds : [],
        organizationPartyIds: read ? a.organizationPartyIds : [],
        activeOrganizationPartyId: read ? a.activeOrganizationPartyId : null
    })
}
;({
    mayOpen,
    // Customer Service's customer-serving facilities (its StockAtDate and facility choices, impl-customer-service P3)
    customerServiceFacilities,
    execute: (op, p) => {
        if (op !== "context") throw new Error("Unknown shared context action")
        return context(p)
    }
})
