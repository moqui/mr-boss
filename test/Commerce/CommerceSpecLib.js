// Helpers the Commerce specs share: the demo ids (data/BossCommerceDemoData.xml, BossZCommerceDemoData.xml,
// BossUsersDemoData.xml), the demo users by group, a block run as a user with artifact authorization on or off, a call's
// refusal message, a Commerce page render and the shell's menu and providers. Later phases add their ids and users here.
const ids = {
    // Ziziwork Retail's demo store and Ziziwork Services' digital store
    storeId: "POPC_DEFAULT",
    otherStoreId: "BOSS_COM_DIGITAL",
    // Accounting's store of its own demo organization (BOSS_ACCT_ORG), in no Commerce user's scope
    accountingStoreId: "BOSS_ACCT_STORE",
    // the demo sites, disabled until published
    siteId: "ZIZI_SHOP",
    otherSiteId: "ZIZI_DIGITAL",
    // Retail's store orders (Customer Service's demo, of POPC_DEFAULT) and Services' (BOSS_CS_SO_OTHER, of no store)
    storeOrderId: "BOSS_CS_SO_DELIVERED",
    noStoreOrderId: "BOSS_CS_SO_OTHER",
    customerId: "CustJqp",
    otherCustomerId: "BOSS_CS_CUST_OTHER",
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES"
}
// The demo users of each group (each also in BOSS_COMMERCE but the administrator), the store-limited staff member and the
// other organization's manager.
const users = {
    manager: "commerce.manager",
    merchandiser: "commerce.merchandiser",
    designer: "commerce.designer",
    developer: "commerce.developer",
    publisher: "commerce.publisher",
    operator: "commerce.operator",
    channel: "commerce.channel",
    subscriptions: "commerce.subscriptions",
    admin: "commerce.admin",
    read: "commerce.read",
    storeStaff: "commerce.storestaff",
    services: "commerce.services"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Commerce screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a
// widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// The shell's menu of Commerce and the launcher's apps for the user, as the shell fetches them.
function shell(user) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Commerce/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Commerce") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Commerce")?.providers
        }
    })
}

// P15: the Commerce screens a sweep renders (the acceptance CommerceTui and CommerceServerStatic): [path, file location] of
// each screen file under the root, and of each shared screen an area mounts with its own subscreens, by its path in
// Commerce; and each one's demo record (sweepParameters, read once: the demo's first contract, cart, return, case, feed, theme
// and page where the demo has no fixed id).
function sweepScreens() {
    const base = "component://mr-boss/screen/"
    const found = []
    const files = []
    ec.resource.getLocationReference(base + "Commerce.xml").walkChildTree(files, null)
    for (const file of files)
        if (file.path !== "Commerce" && /\.xml$/.test(file.location))
            found.push([file.path.substring("Commerce/".length), file.location])
    for (const area of ec.resource.getLocationReference(base + "Commerce").getDirectoryEntries()) {
        if (!/\.xml$/.test(area.location)) continue
        const areaName = area.location.substring(area.location.lastIndexOf("/") + 1).replace(/\.xml$/, "")
        for (const match of String(area.getText()).matchAll(
            /<subscreens-item name="([A-Za-z0-9]+)" location="(component:\/\/mr-boss\/screen\/Shared\/[A-Za-z0-9]+\.xml)"/g
        )) {
            const path = areaName + "/" + match[1]
            if (found.some(([known]) => known === path)) continue
            found.push([path, match[2]])
            const tabs = []
            ec.resource.getLocationReference(match[2]).walkChildTree(tabs, null)
            for (const tab of tabs)
                if (tab.location !== match[2] && /\.xml$/.test(tab.location))
                    found.push([areaName + "/" + match[1] + tab.path.substring(tab.path.indexOf("/")), tab.location])
        }
    }
    return found
}
function sweepParameters() {
    const first = (entity, conditions, orderBy) =>
        system(() => {
            let query = ec.entity.find(entity).condition(conditions || {})
            if (orderBy) query = query.orderBy(orderBy)
            return Array.from(query.limit(1).list())[0] || null
        })
    const store = {productStoreId: ids.storeId}
    const contract = first("mantle.product.subscription.StoreRecurringContract", {productStoreId: ids.otherStoreId}, "contractId")
    const cart = first("mantle.order.StoreCartAccess", {productStoreId: ids.storeId}, "-lastActivityDate")
    // a return of one of the demo store's orders
    const returned = system(() => {
        const storeOrders = Array.from(
            ec.entity.find("mantle.order.OrderHeader").condition({productStoreId: ids.storeId}).selectField("orderId").list()
        ).map(row => row.orderId)
        return storeOrders.length
            ? Array.from(
                  ec.entity.find("mantle.order.return.ReturnItem").condition("orderId", "in", storeOrders).limit(1).list()
              )[0]
            : null
    })
    const request = first("mantle.request.Request", {requestTypeEnumId: "RqtSupport"}, "-requestDate")
    const feed = first("mantle.product.store.ProductStoreFeed", {}, "productStoreFeedId")
    const theme = first("mantle.public.PublicTheme", {productStoreId: ids.storeId}, "themeId")
    const sitePage = first("mantle.public.PublicSitePage", {siteId: ids.siteId}, "sitePageId")
    const product = {productId: "DEMO_1_1", productStoreId: ids.storeId}
    const category = {productCategoryId: "DEMO_ONE", productStoreId: ids.storeId}
    return {
        "Stores/StoreDetail": store,
        "Merchandising/Assortment": store,
        "Merchandising/PublishProducts": Object.assign({productIds: "DEMO_1_1"}, store),
        "Merchandising/StoreCategories": store,
        "Merchandising/StoreCategoriesTui": store,
        "Merchandising/Product360": product,
        "Merchandising/CategoryDetail": category,
        "Merchandising/Documents": product,
        "Merchandising/PriceExplain": product,
        "Merchandising/InventoryAvailability": {productId: "DEMO_1_1", facilityId: "ZIRET_WH"},
        "Merchandising/Reviews": store,
        "Website/PageDetail": {sitePageId: sitePage?.sitePageId || "-"},
        "Website/Navigation": {siteId: ids.siteId},
        "Website/Themes": store,
        "Website/ThemeDetail": {themeId: theme?.themeId || "-"},
        "Website/ThemeEditor": {themeId: theme?.themeId || "-"},
        "Website/ThemeEditorTui": {themeId: theme?.themeId || "-"},
        "Website/TemplateEditor": {themeId: theme?.themeId || "-"},
        "Website/TemplateEditorTui": {themeId: theme?.themeId || "-"},
        "Orders/OrderDetail": {orderId: ids.storeOrderId},
        "Orders/CartDetail": {orderId: cart?.orderId || "-"},
        "Orders/ReturnDetail": {returnId: returned?.returnId || "-"},
        "Orders/LogNote": {orderId: ids.storeOrderId},
        "Customers/SubscriptionDetail": {contractId: contract?.contractId || "-"},
        "Customers/Customer360": {customerPartyId: ids.customerId, partyId: ids.customerId},
        "Customers/RequestDetail": {requestId: request?.requestId || "-"},
        "Promotions/PromotionDetail": {storePromotionId: "PopcBuyGet"},
        "Promotions/PromoCodeDetail": {promoCodeId: "TEST1"},
        "Integrations/IntegrationDetail": {systemMessageRemoteId: "BOSS_COM_MARKETPLACE"},
        "Integrations/ChannelImport": {systemMessageRemoteId: "BOSS_COM_MARKETPLACE"},
        "Integrations/FeedDetail": {productStoreFeedId: feed?.productStoreFeedId || "-"},
        "Settings/CheckoutSettings": store,
        Chatter: {recordEntity: "mantle.product.store.ProductStore", recordId: ids.storeId},
        RecordFiles: {recordEntity: "mantle.product.store.ProductStore", recordId: ids.storeId}
    }
}
// A screen path's parameters: its own, else its nearest parent's (a tab takes its detail screen's record).
function sweepParametersOf(parameters, path) {
    if (parameters[path]) return parameters[path]
    const parent = Object.keys(parameters)
        .filter(prefix => path.startsWith(prefix + "/"))
        .sort((a, b) => b.length - a.length)[0]
    return parent ? parameters[parent] : {}
}

;({ids, users, asUser, system, refusal, invoke, page, shell, sweepScreens, sweepParameters, sweepParametersOf})
