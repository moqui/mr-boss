// The shared page screens' per-app registrations (design-commerce §5 Pages and PageDetail, the per-app table; crosscut §2
// Shared/Pages, Shared/PageDetail; impl-marketing P14, F22): Shared/Pages and Shared/PageDetail with its tabs take their context from
// the registration of the app that mounts them, never from a branch on one app: the app's shared-context and choices services, the
// site page app it works (mantle.public.ThemeServices' app: a Shop's pages or a Marketing mount's storeless landing pages), the
// capabilities of its context that show the edit and publish actions, its route to the page detail (a sharedLinks key), whether
// its pages take a policy role and a theme template, and its words. Commerce's is the first (its Website area, as built in its
// P4); Marketing's the second (its Content area's landing pages: no store, no policy role or template, its content grant both
// edits and publishes; themes stay Commerce's; P15: an optional review, its services named by the registration).
//
// A registration is data, never authority: the site page services check the user's permissions and scope themselves (a page's
// app is its mount's), and a capability only shows or hides an action. An app with no registration sees "not available".
const apps = {
    Commerce: {
        contextService: "ironstone.commerce.ContextServices.get#SharedContext",
        choicesService: "ironstone.commerce.ContextServices.get#Choices",
        pageApp: "shop",
        capabilities: {edit: "themeEdit", publish: "publish"},
        detailLink: "Website/PageDetail",
        storePages: true,
        words: {
            routeTip: "The address under the shop's pages/, such as returns or help/shipping",
            empty: "No pages match. A page is on a site one of your stores sells on.",
            unavailable: "it does not exist, or it is not on a site of one of your stores."
        }
    },
    Marketing: {
        contextService: "ironstone.marketing.ContextServices.get#SharedContext",
        choicesService: "ironstone.marketing.ContextServices.get#Choices",
        pageApp: "marketing",
        capabilities: {edit: "contentEdit", publish: "contentEdit"},
        detailLink: "Content/PageDetail",
        storePages: false,
        // P15 (impl-marketing §4 Nov 14): a landing page's optional review: an author asks, an approver of the organization is notified
        // and may approve or refuse at the text version; publishing stays the content grant's act with or without it
        review: {
            readService: "mantle.marketing.MarketingContentServices.get#PageReview",
            requestService: "mantle.marketing.CampaignServices.request#MarketingApproval",
            decideService: "mantle.marketing.CampaignServices.decide#MarketingApproval",
            targetKind: "page"
        },
        words: {
            routeTip: "The address under the Marketing mount's pages/, such as spring-sale",
            empty: "No landing pages match. A landing page is on a site whose Marketing mount serves one of your organizations.",
            unavailable: "it does not exist, or it is not on a Marketing mount of one of your organizations."
        }
    }
}
// The mounting app's registration with its context read now: {app, pageApp, can: {themeEdit, publish}, sharedLinks, detailUrl, ...};
// an app with none is refused, as its context service refuses a user it does not admit.
function context(appRoot) {
    const app = Object.hasOwn(apps, appRoot || "") ? apps[appRoot] : null
    if (!app) throw new Error("PAGES_CONTEXT: The pages are not available here")
    const out = ec.service.sync().throwOnError(true).name(app.contextService).parameters({appRoot}).call() || {}
    const caps = out.capabilities || {}
    return {
        app,
        pageApp: app.pageApp,
        storePages: app.storePages,
        words: app.words,
        choicesService: app.choicesService,
        can: {themeEdit: !!caps[app.capabilities.edit], publish: !!caps[app.capabilities.publish]},
        sharedLinks: out.sharedLinks || {},
        detailUrl: (out.sharedLinks || {})[app.detailLink] || null,
        review: app.review || null
    }
}
;({apps, context})
