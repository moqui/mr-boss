// Marketing's tracking links (impl-marketing P15; design-marketing §8 TrackingLinks, TrackingLinkDetail, §18 the tracking URL and QR):
// TrackingLinkDetail's one qvt render of Retail's demo poster link for its author, with all of its checks on that render (the header,
// the landing page it goes to, its public address and QR code, Edit link, the observations); the link choices' vocabulary of the
// organization; a reader's capabilities (no edit; the aggregates by its report view) and another organization's author refused, through the service;
// Commerce Home's visits of the store's site; and the shared page screens' Marketing registration naming its review services (no
// render of Shared/PageDetail). The rules are Mantle's (test/marketing/Tracking, test/public/SitePages for the review); the scenario is
// the acceptance MarketingTrackingScenario.
// Run: ./moq test mr-boss --spec MarketingTracking
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system} = lib
const K = "mantle.marketing.TrackingServices."

spec({})

feature("TrackingLinkDetail shows a link's destination, address, QR code and observations to its author", {
    when() {
        return {detail: asUser(users.author, () => page("Content/TrackingLinkDetail", {trackingCodeId: ids.trackingLinkId}))}
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        !detail.output.includes("Error rendering") && !detail.output.includes("Exception in render")
        detail.output.includes("Spring garden poster (QR code)") && detail.output.includes("Spring garden launch")
        detail.output.includes("Active")
        // where it goes: the spring landing page with the link's source, medium and content
        detail.output.includes("https://shop.zizi.localhost/marketing/pages/spring-garden?utm_source=poster")
        detail.output.includes("Landing page: pages/spring-garden")
        // the address on the site's canonical host and its QR code
        detail.output.includes("https://shop.zizi.localhost/trk/ZIZI_SHOP/SpringQr2026")
        detail.output.includes("qrCode?trackingCodeId=" + ids.trackingLinkId) && detail.output.includes("Download QR code")
        // the author edits it and reads its observations
        detail.output.includes("EditLinkDialog") && detail.output.includes("Observations, last 30 days")
    }
})

feature("the link choices, a reader's and another organization's reach, Home's visits and the page review's registration", {
    when() {
        const sources = asUser(users.author, () =>
            invoke("ironstone.marketing.ContextServices.get#Choices", {
                appRoot: "Marketing",
                choice: "vocabulary",
                vocabularyKindEnumId: "MvkUtmSource",
                marketingCampaignId: ids.runningCampaignId
            })
        )
        // Mantle's own rule, authorization off (the screens reach it through Marketing's root grant)
        const reader = asUser(users.reader, () =>
            system(() => invoke(K + "get#TrackingLink", {trackingCodeId: ids.trackingLinkId}))
        )
        const readerList = asUser(users.reader, () =>
            system(() => invoke(K + "find#TrackingLinks", {marketingCampaignId: ids.runningCampaignId}))
        )
        const other = asUser(users.otherAuthor, () =>
            system(() => lib.refusal(K + "get#TrackingLink", {trackingCodeId: ids.trackingLinkId}))
        )
        const record = asUser(users.author, () =>
            invoke("ironstone.marketing.ContextServices.check#Record", {
                appRoot: "Marketing",
                recordType: "trackingLink",
                recordId: ids.trackingLinkId
            })
        )
        const home = asUser(
            "commerce.manager",
            () =>
                invoke("ironstone.commerce.ReportingServices.get#HomePeriod", {
                    appRoot: "Commerce",
                    productStoreId: "POPC_DEFAULT",
                    interval: "M"
                }).period
        )
        const registry = ec.resource.script("component://mr-boss/service/ironstone/shared/PageApps.js")
        return {sources, reader, readerList, other, record, home, registry}
    },
    then({sources, reader, readerList, other, record, home, registry}) {
        sources.options.map(option => option.value).join() == "poster,newsletter"
        // the demo reader holds MARKETING_REPORT_VIEW: the aggregates, and no edit
        reader.capabilities.canEdit === false && reader.observations.period.clicks == 0
        reader.trackingLink.publicUrl == "https://shop.zizi.localhost/trk/ZIZI_SHOP/SpringQr2026"
        readerList.trackingLinkList.length == 2
        other.includes("RECORD_UNAVAILABLE")
        record.kindName == "Tracking link" && record.label.includes("Spring garden poster")
        // the store's site sells for it: Home counts its visits (none recorded in the demo)
        home.visits != null && home.visits.visitsText == "0"
        registry.apps.Marketing.review.targetKind === "page" && registry.apps.Commerce.review == null
        registry.apps.Marketing.review.readService === "mantle.marketing.MarketingContentServices.get#PageReview"
    }
})
