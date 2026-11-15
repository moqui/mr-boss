// Marketing's content (impl-marketing P14; design-marketing §8 BlogPostDetail, LandingPages): BlogPostDetail's one qvt render of
// Retail's demo roses post for its author, with all of its checks on that render (the header and its publication, the body's
// published version and Knowledge, the category, the campaign use, Link to campaign offered); and the shared page screens' Marketing
// registration, checked on the registry and the context and choices services with no render of Shared/Pages: Marketing's landing pages
// app, its capabilities from Marketing's context, its route to PageDetail, the sites of its organizations, and the demo landing page
// read through the site page services as a Marketing reader and refused to another organization's author. The rules are Mantle's
// (test/marketing/MarketingContent, test/public/SitePages); the scenario is the acceptance MarketingContentWalk.
// Run: ./moq test mr-boss --spec MarketingContent
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system} = lib

spec({})

feature("BlogPostDetail shows a published post's header, body, category and campaign use to its author", {
    when() {
        return {detail: asUser(users.author, () => page("Content/BlogPostDetail", {wikiBlogId: ids.blogPostId}))}
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        !detail.output.includes("Error rendering") && !detail.output.includes("Exception in render")
        detail.output.includes("Pruning roses in early spring") && detail.output.includes("Garden blog")
        detail.output.includes("Published")
        // the body: its published version, written in Knowledge
        detail.output.includes("Published version") && detail.output.includes("Write in Knowledge")
        // its category and its campaign use (the spring campaign, as a newsletter article)
        detail.output.includes("Garden news") &&
            detail.output.includes("Spring garden launch") &&
            detail.output.includes("Newsletter article")
        // the author edits it and links it to a campaign
        detail.output.includes("LinkPostDialog") && detail.output.includes("AddCategory") && detail.output.includes("BlogPost")
    }
})

feature("the shared page screens' Marketing registration: its app, capabilities, sites and the demo landing page in scope", {
    when() {
        const registry = ec.resource.script("component://mr-boss/service/ironstone/shared/PageApps.js")
        const author = asUser(users.author, () => registry.context("Marketing"))
        const reader = asUser(users.reader, () => registry.context("Marketing"))
        const sites = asUser(users.author, () =>
            invoke("ironstone.marketing.ContextServices.get#Choices", {appRoot: "Marketing", choice: "sites"})
        )
        const as = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
        const pages = as(users.reader, "mantle.public.ThemeServices.find#SitePages", {app: "marketing"})
        const other = asUser(users.otherAuthor, () =>
            system(() =>
                lib.refusal("mantle.public.ThemeServices.store#SitePage", {sitePageId: ids.landingPageId, title: "Changed"})
            )
        )
        return {registry, author, reader, sites, pages, other}
    },
    then({registry, author, reader, sites, pages, other}) {
        registry.apps.Marketing.pageApp === "marketing" && registry.apps.Commerce.pageApp === "shop"
        author.pageApp === "marketing" && author.storePages === false
        author.can.themeEdit === true && author.can.publish === true
        reader.can.themeEdit === false && reader.can.publish === false
        author.detailUrl === author.sharedLinks["Content/PageDetail"] && !!author.detailUrl
        sites.options.some(option => option.value === "ZIZI_SHOP")
        pages.pages.some(p => p.sitePageId === ids.landingPageId && p.routeText === "/marketing/pages/spring-garden")
        other.includes("RECORD_UNAVAILABLE")
    }
})
