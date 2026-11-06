// Commerce's golden path in the live client (impl-commerce P5, the app's one regression walk): a designer opens the demo
// store's starter theme from Themes, moves the home page's hero below the products in ThemeEditor and saves, then previews
// the draft at phone width (the frame on ZIZI_SHOP's preview host answers the editor's channel); a publisher validates it
// on ThemeDetail and publishes it to the site. The authoring rules are Mantle's ThemeAuthoring and BOSS's CommerceThemes;
// drag and keyboard reordering and the preview's origin check are the acceptance ThemeEditorWalk. Each run moves the hero
// once more, so it checks the order it made, not a fixed one.
let pages = {}
spec({
    setupSpec() {
        for (const user of ["commerce.designer", "commerce.publisher"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
const order = page =>
    page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-section-outline] [data-section-id]"))
            .map(item => item.dataset.sectionId)
            .join(",")
    )

feature("a designer moves the home hero and previews at phone width, and a publisher publishes the theme", {
    expect() {
        const designer = pages["commerce.designer"]
        designer.goto("/qapps/Commerce/Website/Themes").status == 200
        designer.getByRole("link", {name: "Ziziwork Retail theme"}).first().click()
        designer.waitForURL(/ThemeDetail/)
        designer.getByRole("link", {name: "Edit theme"}).click()
        designer.waitForURL(/ThemeEditor/)
        designer.waitFor(() => document.querySelectorAll("[data-section-outline] [data-section-id]").length >= 2)
        const before = order(designer)
        const first = before.split(",")[0]
        designer
            .locator("[data-section-outline] [data-section-id='" + first + "']")
            .getByRole("button", {name: "Move down"})
            .click()
        const moved = order(designer)
        moved.split(",")[1] == first
        designer.getByRole("button", {name: "Save", exact: true}).click()
        designer.waitFor(() =>
            /Draft revision \d+$/.test(document.querySelector("[data-theme-editor] .text-caption")?.innerText || "")
        )
        designer.getByRole("button", {name: "Phone"}).click()
        designer.getByRole("button", {name: "Preview", exact: true}).click()
        designer.waitFor(() => (document.querySelector("[data-theme-preview]")?.style.width || "") === "390px")
        designer.evaluate(() => new URL(document.querySelector("[data-theme-preview]").src).hostname) ==
            "preview.shop.zizi.localhost"
        // the preview answered the editor's channel (its origin and nonce checked on both sides)
        designer.waitFor(() =>
            (document.querySelector("[data-theme-editor]")?.innerText || "").includes("Showing the saved draft")
        )
        designer.text().includes("at phone width")

        const publisher = pages["commerce.publisher"]
        publisher.goto(designer.url().replace(/ThemeEditor\?/, "ThemeDetail?") + "&validate=Y").status == 200
        publisher.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("The draft validates"))
        publisher.locator(".m-record-actions").getByRole("button", {name: "Publish", exact: true}).click()
        publisher
            .getByRole("dialog")
            .getByRole("button", {name: /Publish to/})
            .click()
        publisher.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
        publisher.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("This theme, release"))
        !/Error rendering|Exception in render/.test(publisher.text())
    }
})
