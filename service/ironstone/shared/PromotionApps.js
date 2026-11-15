// The shared promotion screens' per-app registrations (design-commerce §7 Promotions, the per-app table; crosscut §2
// Shared/Promotions, PromotionDetail, PromoCodes, PromoCodeDetail, §3.28; impl-marketing P19, F22): the four screens take their
// context from the registration of the app that mounts them, never from a branch on one app: the app's shared-context and choices
// services (the choice names its drop-downs use), the capabilities of its context that show the edit actions and the order links,
// where a promotion's products are chosen, how a code's customer is checked and whether the app links a promotion to its campaigns.
// Commerce's is the first (its Promotions area, as built in its P7); Marketing's the second (its Promotions area: the stores of the
// user's Marketing organizations within Commerce's store scope, Commerce's promotion permission deciding the edits, and the campaign
// links of PromotionDetail).
//
// A registration is data, never authority: Mantle's StorePromotionServices check COMMERCE_VIEW, COMMERCE_PROMOTION_EDIT and the
// store's scope themselves, and a capability only shows or hides an action. The app root is the mounting root's (its always-actions
// set appRoot), never a request parameter. An app with no registration sees "not available".
const apps = {
    Commerce: {
        contextService: "ironstone.commerce.ContextServices.get#SharedContext",
        choicesService: "ironstone.commerce.ContextServices.get#Choices",
        choices: {stores: "stores", customers: "customers"},
        capabilities: {promotionEdit: "promotionEdit", orders: "orders"},
        products: {
            service: "ironstone.products.CatalogServices.search#CatalogChoices",
            parameters: {appRoot: "Commerce", choice: "products"},
            out: "rows"
        },
        customerCheck: {service: "ironstone.commerce.ContextServices.check#Record", recordType: "customer"},
        campaignLinks: false
    },
    Marketing: {
        contextService: "ironstone.marketing.ContextServices.get#SharedContext",
        choicesService: "ironstone.marketing.ContextServices.get#Choices",
        choices: {stores: "promotionStores", customers: "promotionCustomers", campaigns: "promotionCampaigns"},
        capabilities: {promotionEdit: "promotionEdit", orders: null},
        products: {
            service: "ironstone.marketing.ContextServices.get#Choices",
            parameters: {choice: "promotionProducts"},
            out: "options"
        },
        customerCheck: {service: "ironstone.marketing.ContextServices.check#Record", recordType: "promotionCustomer"},
        campaignLinks: true
    }
}
const registration = appRoot => {
    const app = Object.hasOwn(apps, appRoot || "") ? apps[appRoot] : null
    if (!app) throw new Error("PROMOTIONS_CONTEXT: The promotions are not available here")
    return app
}
// The mounting app's registration with its context read now, in the shape the screens read (sharedMountContext): its capabilities
// (promotionEdit, orders), storeOptions (the stores a new promotion may take), appRoot, sharedLinks, and the registration itself.
function context(appRoot) {
    const app = registration(appRoot)
    const out = ec.service.sync().throwOnError(true).name(app.contextService).parameters({appRoot}).call() || {}
    const caps = out.capabilities || {}
    const storeOptions = out.storeOptions
        ? Array.from(out.storeOptions)
        : Array.from(
              ec.service.sync().name(app.choicesService).parameters({appRoot, choice: app.choices.stores, term: ""}).call()
                  ?.options || []
          )
    return {
        appRoot,
        capabilities: {
            promotionEdit: !!caps[app.capabilities.promotionEdit],
            orders: !!(app.capabilities.orders && caps[app.capabilities.orders])
        },
        storeOptions,
        sharedLinks: out.sharedLinks || {},
        campaignLinks: app.campaignLinks,
        choicesService: app.choicesService
    }
}
// A drop-down's options under the mounting app: its own name for the choice, from its choices service.
function choices(appRoot, p) {
    const app = registration(appRoot)
    const choice = Object.hasOwn(app.choices, p.choice || "") ? app.choices[p.choice] : null
    if (!choice) throw new Error("Unknown promotion choice " + p.choice)
    const out =
        ec.service
            .sync()
            .throwOnError(true)
            .name(app.choicesService)
            .parameters({
                appRoot,
                choice,
                term: p.term || null,
                selected: p.selected || null,
                productStoreId: p.productStoreId || null
            })
            .call() || {}
    return Array.from(out.options || [])
}
// A promotion's product choices under the mounting app.
function products(appRoot, p) {
    const app = registration(appRoot)
    const out =
        ec.service
            .sync()
            .throwOnError(true)
            .name(app.products.service)
            .parameters(Object.assign({term: p.term || null, selected: p.selected || null}, app.products.parameters))
            .call() || {}
    return Array.from(out[app.products.out] || [])
}
// A code's customer checked under the mounting app (its customer scope), refused as its check refuses.
function checkCustomer(appRoot, partyId) {
    const app = registration(appRoot)
    ec.service
        .sync()
        .name(app.customerCheck.service)
        .parameters({appRoot, recordType: app.customerCheck.recordType, recordId: partyId || ""})
        .call()
}
;({apps, context, choices, products, checkCustomer})
