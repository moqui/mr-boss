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
function context(p) {
    const appRoot = p.appRoot || ec.context.appRoot || "Products"
    if (appRoot === "Warehouse") return warehouseContext()
    if (appRoot === "Manufacturing") return manufacturingContext()
    // Purchasing's Replenishment mount of InventoryAvailability (impl-purchasing P14a, crosscut §3.7)
    if (appRoot === "Purchasing")
        return ec.resource.script("component://mr-boss/service/ironstone/purchasing/Replenishment.js").catalogContext()
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
    execute: (op, p) => {
        if (op !== "context") throw new Error("Unknown shared context action")
        return context(p)
    }
})
