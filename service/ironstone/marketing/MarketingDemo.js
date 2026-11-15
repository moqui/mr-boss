// IronStone Marketing's demo loader (impl-marketing P14; ironstone.marketing.DemoServices): the content demo's wiki pages, which demo
// rows cannot write (their text is a versioned file of the wiki), through the wiki services; the rest of the demo is
// data/BossZZMarketingDemoData.xml's rows, in whose transaction it runs (they reference its campaign and list). Idempotent by fixed ID;
// a part that fails is named and the other made (AGENTS.md failure tolerance). Run by data loading or a system administrator
// (john.doe, artifact authorization off).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, call} = lib
const WIKI = "org.moqui.resource.WikiServices."
const ORG = "ORG_ZIZI_RETAIL"
const AUTHOR = "BOSS_MKT_AUTHOR"
const CAMPAIGN = "BOSS_MKT_CMP_SPRING"
const BLOG_SPACE = "MKTBLOG"
const PAGE_SPACE = "MKTPAGES"
const CATEGORY = "BOSS_MKT_BLOGCAT_GARDEN"
const dayMs = 86400000
const ago = days => new Date(Date.now() - days * dayMs)
// the three posts: the first two published (their page's version published, their publish date past), the third a draft
const posts = [
    {
        wikiBlogId: "BOSS_MKT_BLOG_ROSES",
        title: "Pruning roses in early spring",
        summary: "When to prune, how far to cut back and what to feed them after.",
        text: "<p>Prune roses as the buds swell, cutting to an outward-facing bud.</p>",
        publishDays: 6,
        published: true
    },
    {
        wikiBlogId: "BOSS_MKT_BLOG_TOMATOES",
        title: "Starting tomatoes indoors",
        summary: "Sow six to eight weeks before the last frost.",
        text: "<p>Sow tomato seed in small pots on a warm windowsill.</p>",
        publishDays: 3,
        published: true
    },
    {
        wikiBlogId: "BOSS_MKT_BLOG_BULBS",
        title: "Summer bulbs to plant now",
        summary: "Dahlias, gladioli and lilies for a summer border.",
        text: "<p>A draft: the bulb list is still being checked.</p>",
        publishDays: -5,
        published: false
    }
]
const pageText = [
    "# Spring in the garden",
    "",
    "Everything for the new season: seedlings, roses and the tools to look after them.",
    "",
    "[[subscribe BOSS_MKT_LIST_GARDEN]]"
].join("\n")

function asDemoAdministrator(operation) {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}
function space(wikiSpaceId, description, extra = {}) {
    if (one("moqui.resource.wiki.WikiSpace", {wikiSpaceId})) return
    call(
        WIKI + "create#WikiSpace",
        Object.assign({wikiSpaceId, description, restrictView: "N", restrictUpdate: "Y", addCreator: false}, extra)
    )
}
// A page written as the system, its save the author's, and its version published when asked: {wikiPageId, versionName}.
function page(wikiSpaceId, pageName, pageText, wikiType, publish) {
    const written = call(WIKI + "update#WikiPage", {
        wikiSpaceId,
        pageName,
        wikiType,
        pageText,
        versionNote: "Demo",
        historyUserId: AUTHOR
    })
    if (publish) call(WIKI + "set#PublishedVersion", {wikiPageId: written.wikiPageId, publishedVersionName: written.versionName})
    return written
}
function blog() {
    space(BLOG_SPACE, "Garden blog", {publicBlogUrl: "https://shop.ziziwork.example/blog"})
    if (!one("moqui.resource.wiki.WikiSpaceUser", {wikiSpaceId: BLOG_SPACE, userId: AUTHOR}))
        call("create#moqui.resource.wiki.WikiSpaceUser", {
            wikiSpaceId: BLOG_SPACE,
            userId: AUTHOR,
            allowView: "Y",
            allowUpdate: "Y"
        })
    if (!one("moqui.resource.wiki.WikiPageCategory", {wikiPageCategoryId: CATEGORY}))
        call("create#moqui.resource.wiki.WikiPageCategory", {wikiPageCategoryId: CATEGORY, categoryName: "Garden news"})
    for (const post of posts) {
        if (one("moqui.resource.wiki.WikiBlog", {wikiBlogId: post.wikiBlogId})) continue
        const written = page(BLOG_SPACE, post.wikiBlogId.toLowerCase(), post.text, "html", post.published)
        call("create#moqui.resource.wiki.WikiBlog", {
            wikiBlogId: post.wikiBlogId,
            wikiPageId: written.wikiPageId,
            title: post.title,
            author: "Marketing Author",
            summary: post.summary,
            publishDate: ago(post.publishDays)
        })
        call("create#moqui.resource.wiki.WikiBlogCategory", {wikiPageCategoryId: CATEGORY, wikiBlogId: post.wikiBlogId})
    }
    if (!one("mantle.marketing.campaign.CampaignContent", {campaignContentId: "BOSS_MKT_CC_ROSES"}))
        call("create#mantle.marketing.campaign.CampaignContent", {
            campaignContentId: "BOSS_MKT_CC_ROSES",
            marketingCampaignId: CAMPAIGN,
            organizationPartyId: ORG,
            contentKindEnumId: "CckBlogPost",
            wikiBlogId: "BOSS_MKT_BLOG_ROSES",
            wikiPageId: one("moqui.resource.wiki.WikiBlog", {wikiBlogId: "BOSS_MKT_BLOG_ROSES"}).wikiPageId,
            useText: "Newsletter article",
            intendedDate: ago(-7),
            fromDate: ago(5),
            createdByUserId: AUTHOR
        })
}
function landingPage() {
    const sitePageId = "BOSS_MKT_PAGE_SPRING"
    if (one("mantle.public.PublicSitePage", {sitePageId})) return
    space(PAGE_SPACE, "Landing pages of Ziziwork Retail")
    if (!one("mantle.marketing.content.MarketingPageSpace", {organizationPartyId: ORG, fromDate: new Date(0)}))
        call("create#mantle.marketing.content.MarketingPageSpace", {
            organizationPartyId: ORG,
            fromDate: new Date(0),
            wikiSpaceId: PAGE_SPACE
        })
    const written = page(PAGE_SPACE, "page-" + sitePageId, pageText, "md", true)
    call("create#mantle.public.PublicSitePage", {
        sitePageId,
        siteId: "ZIZI_SHOP",
        appMountId: "marketing",
        routePath: "spring-garden",
        title: "Spring in the garden",
        seoTitle: "Spring in the garden at Ziziwork",
        seoDescription: "Seedlings, roses and tools for the new season, and the garden newsletter.",
        wikiPageId: written.wikiPageId,
        versionName: written.versionName,
        fromDate: ago(5),
        publicationRevision: 1,
        publishedByUserId: AUTHOR,
        publishedDate: ago(5),
        createdByUserId: AUTHOR,
        createdDate: ago(6)
    })
    call("create#mantle.marketing.campaign.CampaignContent", {
        campaignContentId: "BOSS_MKT_CC_SPRING_PAGE",
        marketingCampaignId: CAMPAIGN,
        organizationPartyId: ORG,
        contentKindEnumId: "CckSitePage",
        sitePageId,
        useText: "Landing page",
        intendedDate: ago(5),
        fromDate: ago(6),
        createdByUserId: AUTHOR
    })
}
const parts = {blog, landingPage}
function load() {
    return asDemoAdministrator(() => {
        const errors = []
        for (const [name, part] of Object.entries(parts)) {
            try {
                part()
            } catch (error) {
                ec.message.clearErrors()
                ec.logger.error("Marketing content demo " + name + " was not loaded: " + error.message)
                errors.push(name + ": " + error.message)
            }
        }
        return {complete: errors.length === 0, errors}
    })
}
// P16: the spring planting webinar's video call (a call link of the framework, its token in no row), once
function webinarCall() {
    const workEffortId = "BOSS_MKT_EV_WEBINAR"
    const event = one("mantle.work.effort.WorkEffort", {workEffortId})
    if (!event || event.infoUrl) return
    const link = call("org.moqui.call.CallServices.create#CallLink", {
        name: "Spring planting webinar",
        policy: "lobby",
        video: true,
        expiryHours: 2160
    })
    if (!link.path) throw new Error("No call link: " + (link.reasonCode || "refused"))
    call("update#mantle.work.effort.WorkEffort", {workEffortId, infoUrl: link.path})
}
function loadEvents() {
    return asDemoAdministrator(() => {
        try {
            webinarCall()
            return {complete: true, errors: []}
        } catch (error) {
            ec.message.clearErrors()
            ec.logger.error("Marketing event demo was not loaded: " + error.message)
            return {complete: false, errors: ["webinarCall: " + error.message]}
        }
    })
}
const operations = {load, loadEvents}
;({
    execute(op, parameters) {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown marketing demo operation " + op)
        return operations[op](parameters || {})
    }
})
