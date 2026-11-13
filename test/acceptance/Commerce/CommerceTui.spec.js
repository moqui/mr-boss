// Commerce's terminal sweep (impl-commerce P15; style-guide §4.8, §8.1; AGENTS.md: one sweep per app per mode, in acceptance):
// every Commerce screen, its own files and the shared screens its areas mount with their tabs (CommerceSpecLib.sweepScreens),
// renders in the tui render mode as a document of the TUI model (v 1) with no error node, on the demo's records, as the
// Commerce administrator with artifact authorization on. A .qvue screen's twin is its hidden plain-XML Tui screen beside it
// (StoreCategoriesTui, ThemeEditorTui, TemplateEditorTui). Each screen's own render checks are the phases' regression specs.
// Run: ./moq accept mr-boss --spec CommerceTui
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {users, sweepScreens, sweepParameters, sweepParametersOf} = lib
const root = "component://mr-boss/screen/Commerce.xml"
let screens, parameters

// the error nodes of a TUI document and the texts it shows, walking its nodes (TuiRender's walk)
function walk(nodes, errors, texts) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        for (const key of ["text", "title", "value"]) if (typeof node[key] === "string") texts.push(node[key])
        if (node.t === "formList")
            for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors, texts)
        walk(node.c, errors, texts)
    }
}
function cellWalk(cell, errors, texts) {
    if (typeof cell === "string") texts.push(cell)
    else if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors, texts)
    else if (cell) walk([cell], errors, texts)
}
function tui(path, values) {
    const rendered = ec.screen
        .makeTest()
        .rootScreen(root)
        .renderMode("tui")
        .render(path, Object.assign({lastStandalone: "-2"}, values || {}), null)
    let doc = null
    try {
        doc = JSON.parse(rendered.output)
    } catch (error) {
        doc = null
    }
    const nodeErrors = [],
        texts = []
    if (doc) walk(doc.c, nodeErrors, texts)
    const errors = Array.from(rendered.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: rendered.status, errors, doc, nodeErrors, texts, output: String(rendered.output || "")}
}

spec({
    setupSpec() {
        login(users.admin)
        ec.artifactExecution.enableAuthz()
        screens = sweepScreens()
        parameters = sweepParameters()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("every Commerce screen renders in tui as a model document with no error node, on the demo's records", {
    when() {
        const failures = []
        const unrecorded = []
        for (const [path] of screens) {
            const got = tui(path, sweepParametersOf(parameters, path))
            if (got.status != 200 || got.errors) failures.push(`${path}: status ${got.status}, ${got.errors}`)
            else if (!got.doc || got.doc.v != 1) failures.push(`${path}: not a TUI document: ${got.output.substring(0, 160)}`)
            else if (got.nodeErrors.length) failures.push(`${path}: ${got.nodeErrors.join(" | ")}`)
            // a detail screen with no record of its kind in the demo (no cart, contract or feed until a walk makes one) shows its
            // "not available" box, which is a render of its own
            if (/is not available: it does not exist/.test(got.output)) unrecorded.push(path)
        }
        if (failures.length) log.warn(`Commerce TUI failures:\n${failures.join("\n")}`)
        if (unrecorded.length) log.warn(`Commerce TUI: rendered with no demo record of their kind: ${unrecorded.join(", ")}`)
        return {failures, count: screens.length}
    },
    then({failures, count}) {
        count > 60
        failures.join("\n") == ""
    }
})

// the twins show their data: the store's record header, the orders list's demo order, a qvue screen's twin its tree
feature("the twins show the demo's data: the store, its order and its categories", {
    when() {
        return {
            store: tui("Stores/StoreDetail", parameters["Stores/StoreDetail"]),
            orders: tui("Orders/Orders", {productStoreId: lib.ids.storeId}),
            categories: tui("Merchandising/StoreCategoriesTui", parameters["Merchandising/StoreCategoriesTui"])
        }
    },
    then({store, orders, categories}) {
        store.texts.some(text => text.includes(lib.ids.storeId))
        store.texts.some(text => text.includes("Ziziwork Retail"))
        orders.nodeErrors.length == 0
        orders.output.includes(lib.ids.storeOrderId)
        categories.nodeErrors.length == 0
        categories.texts.length > 3
    }
})
