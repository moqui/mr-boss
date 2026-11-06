// Commerce themes (impl-commerce P5; design-commerce §5 Themes, ThemeDetail, ThemeEditor, TemplateEditor): ThemeDetail's one
// qvt render as the designer (Edit theme, but neither Publish nor Edit source, which are the publisher's and the theme
// developer's, as the shared context says) with the theme choices (another organization's manager offered none), and the editors' terminal twins once each: ThemeEditorTui lists the demo theme's
// home sections with Move down and saves a move through store#ThemeComposition, TemplateEditorTui opens a section's source
// in the text editor for the theme developer. The authoring rules (revisions, source checks, required components, preview)
// are Mantle's (test/public/ThemeAuthoring); the code permission's holder, non-holder and other organization are
// CommerceAccess's; the editor walk is test/client/Commerce/CommerceThemesWalk. Run: ./moq test mr-boss --spec Commerce/CommerceThemes
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const T = "mantle.public.ThemeServices."
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        state.themeId = system(
            () =>
                ec.entity
                    .find("mantle.public.PublicTheme")
                    .condition({productStoreId: ids.storeId})
                    .orderBy("themeId")
                    .disableAuthz()
                    .list()[0]?.themeId
        )
    },
    cleanupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("ThemeDetail shows the designer Edit theme but neither Publish nor Edit source; the publisher holds publish", {
    when() {
        const detail = asUser(users.designer, () => lib.page("Website/ThemeDetail", {themeId: state.themeId}))
        const can = user =>
            asUser(user, () => invoke("ironstone.commerce.ContextServices.get#SharedContext", {appRoot: "Commerce"}).capabilities)
        // the theme choices, each once with a selected value that is not on its page
        const choice = (name, extra) =>
            asUser(users.designer, () =>
                Array.from(
                    invoke(
                        "ironstone.commerce.ContextServices.get#Choices",
                        Object.assign({choice: name, term: "", selected: "NONE_SUCH"}, extra)
                    ).options || []
                ).map(option => option.value)
            )
        const choices = {
            themes: choice("themes", {productStoreId: ids.storeId}),
            starters: choice("themeStarters"),
            releases: choice("storeReleases", {productStoreId: ids.storeId}),
            sites: choice("themeSites", {themeId: state.themeId}),
            otherSites: asUser(users.services, () =>
                Array.from(
                    invoke("ironstone.commerce.ContextServices.get#Choices", {
                        choice: "themes",
                        term: "",
                        selected: state.themeId
                    }).options || []
                ).map(option => option.value)
            )
        }
        return {detail, publisher: can(users.publisher), developer: can(users.developer), choices}
    },
    then({detail, publisher, developer, choices}) {
        !!state.themeId
        detail.status == 200
        detail.errors == []
        detail.output.includes("Ziziwork Retail theme")
        detail.output.includes("Edit theme")
        detail.output.includes("Where it is used")
        detail.output.includes("Ziziwork Retail Store")
        !detail.output.includes("Edit source")
        !detail.output.includes("Publish to")
        publisher.themePublish == true
        publisher.themeCode == false
        developer.themeCode == true
        choices.themes.includes(state.themeId)
        !choices.themes.includes("NONE_SUCH")
        choices.starters.includes("mr-pass/starter")
        Array.isArray(choices.releases)
        choices.sites.includes(ids.siteId)
        !choices.otherSites.includes(state.themeId)
    }
})

feature("the editors' terminal twins: the theme's sections with a move, and a section's source for the theme developer", {
    when() {
        const editor = asUser(users.designer, () =>
            lib.page("Website/ThemeEditorTui", {themeId: state.themeId, template: "home"}, "tui")
        )
        const before = asUser(users.designer, () => invoke(T + "get#ThemeComposition", {themeId: state.themeId}), false)
        const order = list => (list.templates.find(t => t.name == "home")?.sections || []).map(s => s.id).join(",")
        const moved = asUser(users.designer, () => {
            const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").renderMode("tui").render(
                "Website/ThemeEditorTui/moveSection",
                {
                    themeId: state.themeId,
                    template: "home",
                    sectionId: "hero",
                    direction: "down",
                    expectedRevision: before.draftRevision
                },
                "POST"
            )
            return {status: result.status, errors: Array.from(result.errorMessages || [])}
        })
        const after = asUser(users.designer, () => invoke(T + "get#ThemeComposition", {themeId: state.themeId}), false)
        const source = asUser(users.developer, () =>
            lib.page("Website/TemplateEditorTui", {themeId: state.themeId, path: "sections/hero.html.fancy-locked"}, "tui")
        )
        return {editor, before: order(before), after: order(after), moved, source}
    },
    then({editor, before, after, moved, source}) {
        editor.status == 200
        editor.errors == []
        editor.output.includes("Sections of home")
        editor.output.includes("hero")
        editor.output.includes("Move down")
        before == "hero,products"
        moved.errors == []
        after == "products,hero"
        source.status == 200
        source.errors == []
        source.output.includes("store-hero")
        source.output.includes("Add, rename or remove a file")
    }
})
