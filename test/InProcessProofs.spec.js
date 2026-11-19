// OWASP ASVS 5.0.0, BOSS's in-process proofs (docs/ASVS-Matrix.md, V1 and V5): rules of the Mantle services BOSS's screens
// call that a client cannot see, run here on the server. The black-box proofs are in test/proofs.
// Run: ./moq test mr-boss --spec InProcessProofs
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const { ids, users, asUser, system, refusal } = lib

spec({
    setupSpec() {
        login("john.doe")
    },
})

// A call in its own transaction: its result, or its refusal's text.
const run = (service, parameters) => {
    ec.message.pushErrors()
    try {
        const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
        return Object.assign({}, out, { error: ec.message.hasError() ? ec.message.getErrorsString() : "" })
    } catch (error) {
        return { error: String(error.message || error) }
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// Data put into a regular expression is escaped first (`[.*+?^${}()|[\]\\]` each taken as itself), where a request's or a
// record's text is put into one: a catalog import's number grouping (Products' import, mantle/product/CatalogImport.js
// numeric, the group "." of a 1.234,5 format) and the tracking pattern Warehouse and Manufacturing generate lot and serial
// numbers from (mantle/shipment/Receiving.js patternParts, a pattern whose text holds "."). Unescaped, the grouping "." would
// take any character (1.2345678 read as 12345678), and the pattern's "." would count another lot's number toward the
// sequence (BP…009XA read as the 9th of BP…{seq:3}.A).
// The control: a number grouped as the format says is read, and the sequence goes on after the lot that is the pattern's.
// Does not prove: the third such site, a case's personal data redacted from a knowledge article (mantle/request/Knowledge.js
// redact, through create#ArticleFromCase), nor the patterns administrators write as patterns by design (artifact names,
// a setting's validRegexp).
feature("v5.0.0-1.2.9: a grouping mark or a lot pattern's text is matched as itself, never as a pattern", {
    when() {
        const imports = ec.resource.script("component://mr-mantle/service/mantle/product/CatalogImport.js")
        const format = { group: ".", decimal: "," }
        const number = (value) => {
            try {
                return imports.numeric(value, format)
            } catch (error) {
                return `refused: ${error.message}`
            }
        }
        const run6 = String(100000 + Math.floor(Math.random() * 900000))
        const prefix = `BP${run6}`
        const product = system(() => ec.entity.find("mantle.product.Product").selectField("productId").orderBy("productId").limit(1)
            .disableAuthz().list()[0]?.productId)
        const lots = [`${prefix}004.A`, `${prefix}009XA`].map((lotNumber, index) => {
            const lotId = `${prefix}_${index}`
            system(() => {
                const row = ec.entity.makeValue("mantle.product.asset.Lot")
                row.setFields({ lotId, lotNumber }, true, null, null)
                row.create()
            })
            return lotId
        })
        // as Warehouse's receiver, whom the service's own permission check (STOCK_RECEIVE) admits; artifact authorization is
        // the screen's, which this call has no screen for
        const generated = asUser("warehouse.receive", () => run("mantle.shipment.WarehouseTaskServices.generate#TrackingIdentities",
            { trackingKind: "lot", productId: product, count: 1, pattern: `${prefix}{seq:3}.A` }), false)
        system(() => ec.entity.find("mantle.product.asset.Lot").condition("lotId", "in", lots).disableAuthz().deleteAll())
        return { grouped: number("12.345.678,9"), ungrouped: number("1.2345678"), prefix, product, generated }
    },
    then({ grouped, ungrouped, prefix, product, generated }) {
        // the control: grouped by threes as the format says
        grouped == "12345678.9"
        ungrouped == "refused: Number grouping does not match the selected format"
        product != null
        generated.error == ""
        // the control: the next lot after the one the pattern made
        generated.identityRows[0].value == `${prefix}005.A`
    },
})

// The archive BOSS expands, a Commerce theme package (Website › Themes › Import, mantle.public.ThemeServices.import#Theme,
// ThemeAuthoring.js archiveFiles), is expanded under the package's bounds (Themes.js packageLimits: 8 MB, 300 files), which
// stop it while it expands: a package whose file grows past 8 MB fails at the bound, and a 301st entry is never written. The
// manifest (theme.json) names the Liquid engine, which the import refuses once it has read it, so no theme is made: as the
// first entry it is read (the control); as the 301st it is not, and the package is refused for having none.
// Does not prove: a limit known before expanding (the archive's headers are read as it expands), nor the framework's own
// expansions (a spreadsheet's or a document's text), which the framework's row covers.
feature("v5.0.0-5.2.3: a theme package expands within its byte and file bounds", {
    when() {
        const dir = `runtime://tmp/boss-proof-archive-${ec.user.randomString(12)}`
        const made = []
        const put = (name, text) => {
            ec.resource.getLocationReference(`${dir}/${name}`).putText(text)
            made.push(`${dir}/${name}`)
            return `${dir}/${name}`
        }
        const manifest = put("theme.json", JSON.stringify({ schemaVersion: 1, name: "Archive proof", engine: "liquid" }))
        const css = put("a.css", "body { color: #222; }")
        const big = put("big.css", "/* proof */".padEnd(9 * 1024 * 1024, " "))
        const styles = Array.from({ length: 300 }, (_, i) => ({ path: `assets/a${i}.css`, location: css }))
        const archive = (name, entries) => {
            ec.resource.writeTarGz(`${dir}/${name}`, entries)
            made.push(`${dir}/${name}`)
            return `${dir}/${name}`
        }
        const control = archive("control.tar.gz", [{ path: "theme.json", location: manifest }].concat(styles))
        const tooMany = archive("many.tar.gz", styles.concat([{ path: "theme.json", location: manifest }]))
        const tooBig = archive("big.tar.gz", [{ path: "theme.json", location: manifest }, { path: "assets/big.css", location: big }])
        const themes = () => system(() => ec.entity.find("mantle.public.PublicTheme").condition("productStoreId", ids.storeId).disableAuthz().count())
        // the directories the import expands into: archiveFiles' own removal leaves a directory that holds files (its delete
        // is not recursive), so the proof removes what its imports left
        const expansions = () => {
            const ref = ec.resource.getLocationReference("runtime://tmp/theme-import")
            return ref.getExists() ? Array.from(ref.getDirectoryEntries() ?? []).map((entry) => entry.getLocation()) : []
        }
        const remove = (ref) => {
            if (ref.isDirectory()) for (const child of Array.from(ref.getDirectoryEntries() ?? [])) remove(child)
            ref.delete()
        }
        const before = { themes: themes(), expansions: expansions() }
        // as Commerce's designer, whom the service's own check (COMMERCE_THEME_EDIT, the store's scope) admits; artifact
        // authorization is the Themes screen's, which this call has no screen for
        const tried = (packageFile) => asUser(users.designer, () =>
            refusal("mantle.public.ThemeServices.import#Theme", { productStoreId: ids.storeId, packageFile }), false)
        const result = { control: tried(control), tooMany: tried(tooMany), tooBig: tried(tooBig) }
        const bytes = { control: ec.resource.getLocationReference(control).getSize(), tooBig: ec.resource.getLocationReference(tooBig).getSize() }
        for (const location of made.concat([dir])) ec.resource.getLocationReference(location).delete()
        for (const location of expansions().filter((location) => !before.expansions.includes(location)))
            remove(ec.resource.getLocationReference(location))
        return Object.assign(result, { before, bytes, after: { themes: themes() } })
    },
    then({ control, tooMany, tooBig, before, bytes, after }) {
        // the control: within the bounds the manifest is read, and its engine refused
        control.includes("Liquid themes are not supported")
        tooMany.includes("A theme package has a theme.json")
        tooBig.includes("passes the size limit")
        // the package that grows past 8 MB is a few kilobytes
        bytes.tooBig < 100000
        after.themes == before.themes
    },
})
