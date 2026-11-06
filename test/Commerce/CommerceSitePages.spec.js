// Commerce site pages (impl-commerce P4; design-commerce §5 Pages, PageDetail): Pages lists the pages of the sites the
// user's stores sell on (find#SitePages, as Pages reads it), and PageDetail's one qvt render (its Publication tab, for the
// publisher: what the site shows and the Publish dialog); and F65: under Commerce, CategoryDetail's
// parent and member writes are refused in favour of Store categories. The page, navigation and publication rules are
// Mantle's (test/public/SitePages); the designer, reader and other-organization case is CommerceAccess's. The walk is the
// acceptance CommerceSitePagesWalk. Run: ./moq test mr-boss --spec Commerce/CommerceSitePages
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const T = "mantle.public.ThemeServices."
const route = "commerce-spec-page"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        const existing = system(() =>
            ec.entity.find("mantle.public.PublicSitePage").condition({siteId: ids.siteId, routePath: route}).disableAuthz().one()
        )
        state.sitePageId = existing
            ? existing.sitePageId
            : asUser(
                  users.designer,
                  () =>
                      invoke(T + "store#SitePage", {
                          siteId: ids.siteId,
                          title: "Commerce spec page",
                          routePath: route,
                          pageText: "# Commerce spec page\n"
                      }).sitePageId,
                  false
              )
    },
    cleanupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("Pages lists the pages of the sites the user's stores sell on, and none of another organization's", {
    when() {
        const listed = user => asUser(user, () => Array.from(invoke(T + "find#SitePages", {pageSize: 100}).pages || []), false)
        return {designer: listed(users.designer), services: listed(users.services)}
    },
    then({designer, services}) {
        designer.some(row => row.sitePageId == state.sitePageId)
        designer.every(row => row.siteId == ids.siteId)
        designer.find(row => row.sitePageId == state.sitePageId).routeText == "/pages/" + route
        !services.some(row => row.siteId == ids.siteId)
    }
})

// PageDetail's Publication tab rendered once (qvt) as the publisher: what the site shows and the Publish dialog
feature("PageDetail's Publication tab shows what the site shows and the publisher's Publish, with the page's address", {
    when() {
        return asUser(users.publisher, () =>
            lib.page("Website/PageDetail/PagePublication", {sitePageId: state.sitePageId, lastStandalone: "1"})
        )
    },
    then(result) {
        result.status == 200
        result.errors == []
        result.output.includes("Publish Commerce spec page")
        result.output.includes("/pages/" + route)
        result.output.includes("On the site")
        result.output.includes("Not published yet")
        result.output.includes("Publish")
        !result.output.includes("Not available")
    }
})

// F65: Commerce changes a category's parents and products in Store categories (the shared-store check, the site
// generation); CategoryDetail's own writes refuse under Commerce, and Products' stay
feature("under Commerce, CategoryDetail's parent and member writes are refused in favour of Store categories", {
    when() {
        const post = (root, path) =>
            asUser("john.doe", () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen(root)
                    .render(
                        path,
                        {productCategoryId: "DEMO_ONE", parentProductCategoryId: "DEMO_TWO", fromDate: Date.now() + 86400000},
                        "post"
                    )
                const errors = Array.from(result.errorMessages || []).join(" ")
                ec.message.clearErrors()
                return errors
            })
        return {commerce: post("component://mr-boss/screen/Commerce.xml", "Merchandising/CategoryDetail/Parents/storeParents")}
    },
    then({commerce}) {
        commerce.includes("Store categories")
    }
})
