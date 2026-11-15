// Marketing P14's "usable when" (impl-marketing P14; design-marketing §16.3 scenarios 10, its page half, and 19), as an acceptance
// walk through the screens' transitions with artifact authorization on: marketing.author writes a blog post with text and one from a
// page of the garden blog, adds a category and removes it, links the post to the running campaign and drafts a newsletter from it,
// whose preparation takes the category's approved posts and leaves their publication alone; a storeless landing page is made on the
// shop's Marketing mount with an embedded subscribe box, published, and read as a visitor, who subscribes from it; a private draft
// linked to the campaign is not public. The rules are Mantle's MarketingContent and SitePages, the renders MarketingContent, the
// public page mr-pass's MarketingPages (and the acceptance MarketingPagesHttp through a remote request).
// Run: ./moq accept mr-boss --spec MarketingContentWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const T = "mantle.marketing.MarketingContentServices."
const D = "mantle.marketing.CampaignSendServices."
const PORTAL = "mantle.marketing.MarketingPortalServices."
const WIKI = "org.moqui.resource.WikiServices."
const capture = ec.factory.getTool("MailCapture")
const site = "ZIZI_SHOP"
const state = {}

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const as = (user, service, parameters) =>
    asUser(user, () => system(() => ec.service.sync().name(service).parameters(parameters).call() || {}))
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
// a PASS operation's service as an anonymous visitor
function visitor(service, input) {
    logout()
    try {
        return ec.service
            .sync()
            .throwOnError(true)
            .name(PORTAL + service)
            .parameters({input})
            .requireNewTransaction(true)
            .call().result
    } catch (error) {
        return {kind: error.moquiErrorKind || "Error", error: String(error.message).split("\n")[0]}
    } finally {
        ec.message.clearErrors()
        login("john.doe")
    }
}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
        // the shop's site is published for the walk (the demo leaves it to be published)
        system(() =>
            ec.service.sync().name("update#mantle.public.PublicSite").parameters({siteId: site, state: "published"}).call()
        )
    },
    cleanupSpec() {
        ec.factory.waitWorkerPoolEmpty(50)
        capture.reset()
    }
})

feature("an author writes a post with text and one from a page, and adds and removes a category", {
    when() {
        const text = asUser(users.author, () =>
            post("Content/BlogPosts/storeBlogPost", {
                wikiSpaceId: ids.blogSpaceId,
                title: "Mulching for summer",
                author: "Marketing Author",
                summary: "Keep the moisture in.",
                blogText: "<p>Mulch after the soil warms.</p>"
            })
        )
        state.textPost = all("moqui.resource.wiki.WikiBlog", {title: "Mulching for summer"})[0]?.wikiBlogId
        const pageId = system(
            () =>
                ec.service
                    .sync()
                    .name(WIKI + "update#WikiPage")
                    .parameters({
                        wikiSpaceId: ids.blogSpaceId,
                        pageName: "watering-guide",
                        wikiType: "md",
                        pageText: "# Watering\n"
                    })
                    .call().wikiPageId
        )
        const fromPage = asUser(users.author, () =>
            post("Content/BlogPosts/storeBlogPost", {wikiSpaceId: ids.blogSpaceId, wikiPageId: pageId, title: "A watering guide"})
        )
        state.pagePost = all("moqui.resource.wiki.WikiBlog", {wikiPageId: pageId})[0]?.wikiBlogId
        const added = asUser(users.author, () =>
            post("Content/BlogPostDetail/addBlogCategory", {wikiBlogId: state.textPost, wikiPageCategoryId: ids.blogCategoryId})
        )
        const inCategory = all("moqui.resource.wiki.WikiBlogCategory", {wikiBlogId: state.textPost}).length
        const removed = asUser(users.author, () =>
            post("Content/BlogPostDetail/removeBlogCategory", {
                wikiBlogId: state.textPost,
                wikiPageCategoryId: ids.blogCategoryId
            })
        )
        const after = all("moqui.resource.wiki.WikiBlogCategory", {wikiBlogId: state.textPost}).length
        return {text, fromPage, added, inCategory, removed, after}
    },
    then(r) {
        r.text.errors == "" && !!state.textPost
        r.fromPage.errors == "" && !!state.pagePost
        r.added.errors == "" && r.inCategory == 1
        r.removed.errors == "" && r.after == 0
    }
})

feature(
    "the author links the roses post to the campaign and drafts a newsletter; preparation leaves the posts' publication alone",
    {
        when() {
            const before = one("moqui.resource.wiki.WikiBlog", {wikiBlogId: ids.blogPostId})
            const page = one("moqui.resource.wiki.WikiPage", {wikiPageId: before.wikiPageId})
            // the demo's link of the roses post (Content › ContentDetail's Create draft send)
            const drafted = asUser(users.author, () =>
                post("Content/ContentDetail/createContentSend", {
                    campaignContentId: ids.contentLinkId,
                    contactListId: ids.gardenListId,
                    sendName: "Garden news, spring"
                })
            )
            const send = all("mantle.marketing.campaign.CampaignSend", {campaignContentId: ids.contentLinkId})[0]
            const prepared = as(users.author, D + "prepare#Send", {
                campaignSendId: send.campaignSendId,
                expectedRevision: entityLib.ms(send.lastUpdatedStamp)
            })
            const posts = all("mantle.marketing.campaign.CampaignSendPost", {campaignSendId: send.campaignSendId})
            const after = one("moqui.resource.wiki.WikiBlog", {wikiBlogId: ids.blogPostId})
            const pageAfter = one("moqui.resource.wiki.WikiPage", {wikiPageId: before.wikiPageId})
            return {drafted, send, prepared, posts, before, after, page, pageAfter}
        },
        then(r) {
            r.drafted.errors == ""
            r.send.postCategoryId == ids.blogCategoryId
            !r.prepared.refusal
            // the two published posts of the category, not the draft
            r.posts.length == 2 && !r.posts.some(p => p.wikiBlogId == "BOSS_MKT_BLOG_BULBS")
            entityLib.ms(r.after.publishDate) == entityLib.ms(r.before.publishDate)
            r.pageAfter.publishedVersionName == r.page.publishedVersionName
        }
    }
)

feature("a storeless landing page is published on the shop's Marketing mount and a visitor subscribes from it", {
    when() {
        const created = asUser(users.author, () =>
            post("Content/LandingPages/createPage", {siteId: site, title: "Tomato week", routePath: "tomato-week"})
        )
        const page = all("mantle.public.PublicSitePage", {siteId: site, routePath: "tomato-week"})[0]
        const saved = as(users.author, "mantle.public.ThemeServices.store#SitePage", {
            sitePageId: page.sitePageId,
            pageText: "# Tomato week\n\nSeedlings half price.\n\n[[subscribe " + ids.gardenListId + "]]\n"
        })
        const draft = visitor("get#Page", {siteId: site, routePath: "tomato-week"})
        const published = asUser(users.author, () =>
            post("Content/PageDetail/PagePublication/publishPage", {
                sitePageId: page.sitePageId,
                publishAction: "publish",
                versionName: saved.versionName,
                expectedRevision: one("mantle.public.PublicSitePage", {sitePageId: page.sitePageId}).publicationRevision || 0,
                operationKey: "mcw-" + page.sitePageId
            })
        )
        const live = visitor("get#Page", {siteId: site, routePath: "tomato-week"})
        const subscribed = visitor("request#Subscription", {
            siteId: site,
            emailAddress: "tomato.fan@example.test",
            contactListIds: [ids.gardenListId],
            consent: "Y",
            operationId: "mcw" + ec.user.randomString(12).replace(/[^A-Za-z0-9]/g, "x")
        })
        const requested = all("mantle.marketing.contact.SubscriptionRequest", {
            siteId: site,
            contactListId: ids.gardenListId
        }).length
        return {created, page, saved, draft, published, live, subscribed, requested}
    },
    then(r) {
        r.created.errors == "" && r.page.appMountId == "marketing"
        r.draft.kind == "NotFound"
        r.published.errors == ""
        r.live.page.title == "Tomato week" && r.live.page.parts.some(part => part.kind == "subscribe")
        !!r.subscribed.receipt && r.requested > 0
    }
})

feature("a private draft linked to the campaign is not public", {
    when() {
        const linked = asUser(users.author, () =>
            post("Content/Content/storeContent", {
                action: "add",
                marketingCampaignId: ids.runningCampaignId,
                contentKindEnumId: "CckBlogPost",
                sourceId: "BOSS_MKT_BLOG_BULBS",
                useText: "Summer preview"
            })
        )
        const link = all("mantle.marketing.campaign.CampaignContent", {wikiBlogId: "BOSS_MKT_BLOG_BULBS"})[0]
        const read = as(users.author, T + "get#CampaignContent", {campaignContentId: link.campaignContentId})
        const blog = one("moqui.resource.wiki.WikiBlog", {wikiBlogId: "BOSS_MKT_BLOG_BULBS"})
        const page = one("moqui.resource.wiki.WikiPage", {wikiPageId: blog.wikiPageId})
        return {linked, read, page}
    },
    then(r) {
        r.linked.errors == ""
        r.read.content.publicUrl == null && r.read.content.stateText != "Published"
        r.page.publishedVersionName == null
    }
})
