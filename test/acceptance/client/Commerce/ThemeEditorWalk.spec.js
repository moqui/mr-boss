// ThemeEditor in the browser (impl-commerce P5 acceptance; design-commerce §5 ThemeEditor, design-shop §12.6): a section
// dragged in the outline and the same section moved with Alt+Down end in the same order, and the saved draft has it; the
// preview answers the editor's channel only for the editor's origin and nonce: a page of another origin (the live shop's
// host) that frames it with the right nonce gets no answer, and the frame of the editor with a wrong nonce gets none either;
// the preview host answers only the preview (its other paths Not Found) with no-store, noindex, no referrer and
// frame-ancestors the BOSS origins, and a forged token is Not Found; a theme developer's <script> in a section is refused in
// TemplateEditor with its file and line, and a clean edit saves. Run: ./moq accept mr-boss --spec ThemeEditorWalk
let pages = {}
const PREVIEW_HOST = "preview.shop.zizi.localhost"
spec({
    setupSpec() {
        const page = browser.newPage({user: "commerce.designer", viewport: {width: 1440, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
        pages.designer = page
    }
})
const order = page =>
    page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-section-outline] [data-section-id]"))
            .map(item => item.dataset.sectionId)
            .join(",")
    )
function openEditor(page) {
    page.goto("/qapps/Commerce/Website/Themes").status == 200
    page.getByRole("link", {name: "Ziziwork Retail theme"}).first().click()
    page.waitForURL(/ThemeDetail/)
    page.getByRole("link", {name: "Edit theme"}).click()
    page.waitForURL(/ThemeEditor/)
    page.waitFor(() => document.querySelectorAll("[data-section-outline] [data-section-id]").length >= 2)
}

feature("a dragged section and the same section moved with the keyboard end in the same order, and the draft saves it", {
    expect() {
        const page = pages.designer
        openEditor(page)
        const before = order(page)
        const [first, second] = before.split(",")
        // drag the first section onto the second
        const dropped = page.evaluate(
            ([from, to]) => {
                const item = id => document.querySelector("[data-section-outline] [data-section-id='" + id + "']")
                const data = new DataTransfer()
                item(from).dispatchEvent(new DragEvent("dragstart", {bubbles: true, dataTransfer: data}))
                item(to).dispatchEvent(new DragEvent("dragover", {bubbles: true, cancelable: true, dataTransfer: data}))
                item(to).dispatchEvent(new DragEvent("drop", {bubbles: true, cancelable: true, dataTransfer: data}))
                return true
            },
            [first, second]
        )
        dropped
        const dragged = order(page)
        dragged.split(",")[1] == first
        page.getByRole("button", {name: "Undo"}).click()
        order(page) == before
        page.locator("[data-section-outline] [data-section-id='" + first + "']").focus()
        page.keyboard.press("Alt+ArrowDown")
        const keyed = order(page)
        keyed == dragged
        page.getByRole("button", {name: "Save", exact: true}).click()
        page.waitFor(() =>
            /Draft revision \d+$/.test(document.querySelector("[data-theme-editor] .text-caption")?.innerText || "")
        )
        page.goto(page.url())
        page.waitFor(() => document.querySelectorAll("[data-section-outline] [data-section-id]").length >= 2)
        order(page) == keyed
    }
})

feature("the preview answers only the editor's origin and nonce, and its host serves only the preview", {
    expect() {
        const page = pages.designer
        page.getByRole("button", {name: "Preview", exact: true}).click()
        page.waitFor(() => (document.querySelector("[data-theme-editor]")?.innerText || "").includes("Showing the saved draft"))
        const src = page.evaluate(() => document.querySelector("[data-theme-preview]").src)
        const path = src.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "")
        const nonce = /[?&]n=([0-9a-f]+)/.exec(src)[1]
        // the editor's own frame with a wrong nonce: no answer
        const wrongNonce = page.evaluate(
            ([url]) =>
                new Promise(resolve => {
                    const frame = document.createElement("iframe")
                    frame.src = url + "?n=0000"
                    frame.onload = () => {
                        const channel = new MessageChannel()
                        let answered = false
                        channel.port1.onmessage = () => {
                            answered = true
                        }
                        frame.contentWindow.postMessage({type: "moqui-theme-preview", nonce: "ffff"}, new URL(url).origin, [
                            channel.port2
                        ])
                        setTimeout(() => {
                            frame.remove()
                            resolve(answered)
                        }, 1500)
                    }
                    document.body.appendChild(frame)
                }),
            [src.replace(/\?.*$/, "")]
        )
        wrongNonce == false
        // a page of another origin (the live shop's host) with the right nonce: the preview refuses to be framed there
        const shop = browser.newPage({viewport: {width: 800, height: 600}, timeout: 30})
        shop.allowProblems(/.*/)
        shop.goto("http://shop.zizi.localhost:" + server.port + "/robots.txt")
        const foreign = shop.evaluate(
            ([url, n]) =>
                new Promise(resolve => {
                    const frame = document.createElement("iframe")
                    frame.src = url + "?n=" + n
                    let answered = false
                    frame.onload = () => {
                        const channel = new MessageChannel()
                        channel.port1.onmessage = () => {
                            answered = true
                        }
                        try {
                            frame.contentWindow.postMessage({type: "moqui-theme-preview", nonce: n}, "*", [channel.port2])
                        } catch (e) {}
                    }
                    document.body.appendChild(frame)
                    setTimeout(() => resolve(answered), 2500)
                }),
            [src.replace(/\?.*$/, ""), nonce]
        )
        foreign == false
        // the preview host's answers
        const host = {Host: PREVIEW_HOST + ":" + server.port}
        const preview = http.get(path, {headers: host})
        const csp = String(preview.header("content-security-policy"))
        const robots = String(preview.header("x-robots-tag"))
        preview.status == 200
        csp.includes("frame-ancestors http://localhost:* http://127.0.0.1:*")
        csp.includes("script-src 'nonce-")
        preview.header("cache-control") == "no-store"
        robots.includes("noindex")
        preview.header("referrer-policy") == "no-referrer"
        !preview.header("x-frame-options")
        http.get("/", {headers: host}).status == 404
        http.get("/account/Login", {headers: host}).status == 404
        http.get(path.slice(0, -1) + (path.endsWith("Q") ? "R" : "Q"), {headers: host}).status == 404
    }
})

feature("a theme developer's script in a section is refused with its file and line, and a clean edit saves", {
    expect() {
        const page = browser.newPage({user: "commerce.developer", viewport: {width: 1440, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=|THEME_SOURCE_INVALID|422|Unprocessable/)
        page.goto("/qapps/Commerce/Website/Themes").status == 200
        page.getByRole("link", {name: "Ziziwork Retail theme"}).first().click()
        page.waitForURL(/ThemeDetail/)
        page.getByRole("link", {name: "Edit source"}).click()
        page.waitForURL(/TemplateEditor/)
        const file = "sections/rich-text.html.fancy-locked"
        const openFile = path => {
            page.locator("[data-theme-files] [data-path='" + path + "']").click()
            page.waitFor(() => !!document.querySelector("[data-template-editor] .cm-content"))
        }
        const typeAtEnd = text => {
            page.locator("[data-template-editor] .cm-content").click()
            page.keyboard.press("Meta+ArrowDown")
            page.keyboard.press("Control+End")
            page.keyboard.press("End")
            page.keyboard.press("Enter")
            page.keyboard.type(text)
        }
        const revision = () =>
            page.evaluate(() => /Draft revision (\d+)/.exec(document.querySelector("[data-template-editor]").innerText)[1])
        openFile(file)
        typeAtEnd('<p onclick="steal()">x')
        page.getByRole("button", {name: "Save", exact: true}).click()
        page.waitFor(() => !!document.querySelector("[data-diagnostics]"))
        const finding = page.evaluate(() => document.querySelector("[data-diagnostics]").innerText)
        finding.includes(file + ":")
        // leave the refused text without saving it, open the file again and add plain text, which saves
        openFile("sections/hero.html.fancy-locked")
        page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
        page.waitFor(
            () => !!document.querySelector("[data-theme-files] .q-item--active[data-path='sections/hero.html.fancy-locked']")
        )
        openFile(file)
        const before = revision()
        typeAtEnd("Reviewed")
        page.getByRole("button", {name: "Save", exact: true}).click()
        page.waitFor(rev => /Draft revision (\d+)/.exec(document.querySelector("[data-template-editor]").innerText)[1] !== rev, {
            arg: before
        })
        !page.evaluate(() => !!document.querySelector("[data-editor-error]"))
    }
})
