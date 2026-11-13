// Commerce P14's "usable when" (impl-commerce P14; design-commerce §12.2 scenario 12, its feed half), as a walk through the
// Feeds and FeedDetail transitions with artifact authorization on and the Shop site's feed path: the channel operator starts
// a feed of POPC_DEFAULT, builds and publishes it, and the site serves it at feeds/{key}.xml; the publisher withdraws a product
// in it, and the feed is unavailable (FeedDetail names the product) until the next build, which leaves it out, is published;
// Channel health and Home's integration card show the feed. The rules are Mantle's StoreFeeds.
// Run: ./moq accept mr-boss --spec CommerceFeedsWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const stamp = String(Date.now()).slice(-6)
const SITE = "BOSS_FEED_SITE_" + stamp,
    HOST = "feeds" + stamp + ".zizi.example.test",
    KEY = "walk-" + stamp
const C = "mantle.product.StoreChannelServices."
const walk = {}
// a Commerce transition posted as the user, as its form submits it: the messages it leaves
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        const messages = Array.from(ec.message.getMessages?.() || []).map(String)
        ec.message.clearErrors()
        return {status: result.status, errors, messages}
    })
}
// the site's feed path as a visitor's request reaches it: the route, then the feed as the Shop transition answers it
function fetchFeed() {
    const route = system(() =>
        ec.service
            .sync()
            .name("pass.RouteServices.resolve#Route")
            .parameters({siteId: SITE, hostname: HOST, path: "/feeds/" + KEY + ".xml"})
            .call()
    )
    logout()
    try {
        const feed = ec.resource
            .script("component://mr-pass/screen/Shop/ShopFeeds.js")
            .feedOf({site: {siteId: SITE}}, route.screenParameters.feedKey, route.screenParameters.feedExtension)
        return Object.assign({screenPath: route.screenPath}, feed)
    } finally {
        ec.message.clearErrors()
        login("john.doe")
    }
}
const feedOf = () => asUser(users.channel, () => invoke(C + "get#StoreFeed", {productStoreFeedId: walk.feedId}), false)
function publishLatest() {
    const found = feedOf()
    return post(users.channel, "Integrations/FeedDetail/publishFeed", {
        productStoreFeedId: walk.feedId,
        feedBuildId: found.builds[0].feedBuildId,
        expectedRevision: found.feed.revision,
        operationKey: "walk-" + ec.user.randomString(20)
    })
}
const withdraw = (productId, action) =>
    asUser(
        users.publisher,
        () =>
            invoke("mantle.product.StoreMerchandisingServices.publish#StoreProducts", {
                productStoreId: ids.storeId,
                productIds: [productId],
                action,
                changeReason: "Feeds walk",
                operationKey: "walk-" + ec.user.randomString(20)
            }),
        false
    )

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
            make("mantle.public.PublicSite", {
                siteId: SITE,
                name: "Feeds walk " + stamp,
                state: "published",
                locale: "en",
                generation: 1
            })
            make("mantle.public.PublicSiteHost", {hostname: HOST, siteId: SITE, canonical: "Y"})
            make("mantle.public.PublicSiteApp", {
                siteId: SITE,
                appMountId: "shop",
                app: "shop",
                pathPrefix: "/",
                enabled: "Y",
                targetId: ids.storeId
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        if (walk.withdrawnId) withdraw(walk.withdrawnId, "publish")
        // the walk's feed, builds and site removed, so the demo store's sites are as they were
        system(() => {
            const remove = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().deleteAll()
            ec.entity
                .find("mantle.product.store.ProductStoreFeed")
                .condition({siteId: SITE})
                .disableAuthz()
                .updateAll({activeBuildId: null})
            remove("mantle.product.store.ProductStoreFeedBuild", {siteId: SITE})
            remove("mantle.product.store.ProductStoreFeed", {siteId: SITE})
            remove("mantle.public.PublicSiteApp", {siteId: SITE})
            remove("mantle.public.PublicSiteHost", {siteId: SITE})
            remove("mantle.public.PublicSite", {siteId: SITE})
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature("the channel operator starts, builds and publishes a feed of the demo store, and the Shop site serves it", {
    when() {
        const created = post(users.channel, "Integrations/Feeds/createFeed", {
            newProductStoreId: ids.storeId,
            newSiteId: SITE,
            feedName: "Walk marketplace feed",
            feedKey: KEY,
            newFormatEnumId: "PsffGoogleXml",
            includeImages: "Y"
        })
        walk.feedId = asUser(
            users.channel,
            () => invoke(C + "find#StoreFeeds", {productStoreId: ids.storeId, siteId: SITE}),
            false
        ).feeds[0]?.productStoreFeedId
        const before = fetchFeed()
        const built = post(users.channel, "Integrations/FeedDetail/buildFeed", {productStoreFeedId: walk.feedId})
        const build = asUser(
            users.channel,
            () => invoke(C + "get#FeedBuild", {feedBuildId: feedOf().builds[0].feedBuildId}),
            false
        )
        walk.withdrawnId = build.sample[0]?.id
        const published = publishLatest()
        return {created, before, built, build, published, served: fetchFeed()}
    },
    then(r) {
        r.created.errors == []
        walk.feedId != null
        r.before.status == 404
        r.built.errors == []
        r.build.build.complete == true
        r.build.build.rowCount > 0
        walk.withdrawnId != null
        r.published.errors == []
        r.served.screenPath == "/Shop/feed"
        r.served.status == 200
        r.served.contentType == "application/xml; charset=utf-8"
        r.served.body.includes("<g:id>" + walk.withdrawnId + "</g:id>")
        r.served.body.includes("https://" + HOST + "/products/")
    }
})

feature("withdrawing a product takes the feed down until a build without it is published", {
    when() {
        const withdrawn = withdraw(walk.withdrawnId, "withdraw")
        const blocked = fetchFeed()
        const detail = asUser(users.channel, () => lib.page("Integrations/FeedDetail", {productStoreFeedId: walk.feedId}))
        const refused = publishLatest()
        const rebuilt = post(users.channel, "Integrations/FeedDetail/buildFeed", {productStoreFeedId: walk.feedId})
        const republished = publishLatest()
        return {withdrawn, blocked, detail, refused, rebuilt, republished, served: fetchFeed()}
    },
    then(r) {
        r.withdrawn.doneCount == 1
        r.blocked.status == 404
        r.detail.errors == []
        r.detail.output.includes("withdrawn since this build")
        r.detail.output.includes(walk.withdrawnId)
        r.refused.errors.some(text => text.includes("BUILD_STALE")) || r.refused.messages.some(text => text.includes("withdrawn"))
        r.rebuilt.errors == []
        r.republished.errors == []
        r.served.status == 200
        !r.served.body.includes("<g:id>" + walk.withdrawnId + "</g:id>")
    }
})

feature("Channel health and Home's integration card show the store's feeds", {
    when() {
        return {
            health: asUser(users.channel, () => lib.page("Reports/ChannelHealth", {productStoreId: ids.storeId})),
            home: asUser(users.channel, () => lib.page("Home", {productStoreId: ids.storeId})),
            feeds: asUser(users.channel, () => lib.page("Integrations/Feeds", {productStoreId: ids.storeId}, "html"))
        }
    },
    then(r) {
        r.health.status == 200
        r.health.errors == []
        r.health.output.includes("Walk marketplace feed")
        r.health.output.includes("Product feeds")
        r.home.errors == []
        r.home.output.includes("Integration errors")
        r.feeds.status == 200
        r.feeds.errors == []
        r.feeds.output.includes("Walk marketplace feed")
    }
})
