// Commerce feeds (impl-commerce P14; design-commerce §9 Feeds, FeedDetail, §3 ChannelHealth): the channel operator's feed of
// a spec store of the demo organization (its own Shop site, two demo products published), built from the public projection:
// FeedDetail shows the build with its preview and publish action and Feeds lists the feed (one qvt render each); Channel
// health under Reports answers the feed for the channel operator, lists it in the catalogue, and is refused the
// merchandiser. The spec's store and site leave the demo store's sites as they are. The feed rules are Mantle's
// (StoreFeeds); the walk over the demo store is the acceptance CommerceFeedsWalk.
// Run: ./moq test mr-boss --spec CommerceFeeds
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const C = "mantle.product.StoreChannelServices."
const STORE = "ZZZ_BOSS_FEED_STORE",
    SITE = "ZZZ_BOSS_FEED_SITE",
    HOST = "feeds.commerce-spec.example.test"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entity, values) =>
                ec.service
                    .sync()
                    .name("create#" + entity)
                    .parameters(values)
                    .call()
            if (!ec.entity.find("mantle.public.PublicSite").condition({siteId: SITE}).disableAuthz().one()) {
                make("mantle.product.store.ProductStore", {
                    productStoreId: STORE,
                    storeName: "Feeds spec store",
                    organizationPartyId: ids.organizationId,
                    defaultCurrencyUomId: "USD",
                    defaultLocale: "en_US"
                })
                for (const productId of ["DEMO_1_1", "DEMO_1_2"])
                    make("mantle.product.store.ProductStoreProduct", {productStoreId: STORE, productId, fromDate: 0})
                make("mantle.public.PublicSite", {
                    siteId: SITE,
                    name: "Commerce feeds spec",
                    state: "published",
                    locale: "en",
                    generation: 1
                })
                make("mantle.public.PublicSiteHost", {hostname: HOST, siteId: SITE, canonical: "Y"})
                make("mantle.public.PublicSiteApp", {
                    siteId: SITE,
                    appMountId: "shop",
                    app: "shop",
                    pathPrefix: "/shop",
                    enabled: "Y",
                    targetId: STORE
                })
            }
        })
        state.feedId = asUser(
            users.channel,
            () =>
                invoke(C + "store#StoreFeed", {
                    productStoreId: STORE,
                    siteId: SITE,
                    feedName: "Spec marketplace feed",
                    feedKey:
                        "spec-" +
                        ec.user
                            .randomString(6)
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, "x"),
                    formatEnumId: "PsffCsv",
                    // the spec store has no facility, so its stocked products are out of stock: kept as rows
                    includeUnavailable: "Y"
                }).productStoreFeedId,
            false
        )
        state.build = asUser(users.channel, () => invoke(C + "build#StoreFeed", {productStoreFeedId: state.feedId}), false)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("FeedDetail shows the build's preview and its publish action, and Feeds lists the feed", {
    when() {
        return {
            detail: asUser(users.channel, () => lib.page("Integrations/FeedDetail", {productStoreFeedId: state.feedId})),
            list: asUser(users.channel, () => lib.page("Integrations/Feeds", {productStoreId: STORE}))
        }
    },
    then(r) {
        state.build.failed == false
        state.build.build.rowCount > 0
        r.detail.status == 200
        r.detail.errors == []
        r.detail.output.includes("Spec marketplace feed")
        r.detail.output.includes("Preview of the build")
        r.detail.output.includes("Publish this build")
        r.detail.output.includes("DEMO_1_1")
        r.list.status == 200
        r.list.errors == []
        r.list.output.includes("Spec marketplace feed")
        r.list.output.includes("Not published")
    }
})

feature("Channel health answers the feed for the channel operator, in the catalogue, and not for the merchandiser", {
    when() {
        const health = asUser(
            users.channel,
            () =>
                invoke("ironstone.commerce.ReportingServices.get#ChannelHealth", {
                    appRoot: "Commerce",
                    productStoreId: STORE
                }),
            false
        ).answer
        const catalogue = asUser(
            users.channel,
            () => invoke("ironstone.commerce.ReportingServices.get#ReportCatalogue", {}),
            false
        )
        const merchandiser = asUser(
            users.merchandiser,
            () =>
                refusal("ironstone.commerce.ReportingServices.get#ChannelHealth", {
                    appRoot: "Commerce",
                    productStoreId: STORE
                }),
            false
        )
        return {health, catalogue, merchandiser}
    },
    then(r) {
        r.health.feeds.find(feed => feed.productStoreFeedId == state.feedId).stateText == "Not published"
        r.catalogue.reports.some(report => report.entryId == "Commerce.ChannelHealth")
        r.merchandiser.includes("PERMISSION_DENIED")
    }
})
