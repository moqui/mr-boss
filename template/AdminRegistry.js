// What Admin's own screens read of the framework's registries (org.moqui.admin.ReadinessServices: readiness, the overview
// and the settings index; mr-moqui plans/Admin-Screens-Down.md A6), with what is Admin's: the organization as the scope a
// request is narrowed by, and a registration's place as a link. The framework answers a place as a key (a check's fixRoute, a
// card's route, a settings entry's destinationRoute); Admin's mount resolves it (the framework's AdminMount.js over the routes
// Admin.js gives), and a fix link, a card's link and Health's link are shown only where the place opens to the viewer's own
// groups (ironstone.admin.RegistryServices.get#OpenPaths). A settings entry is linked as it is: the framework's index lists
// it only where its screen opens. Called from a screen's actions, where the mount is in the context.
const calls = ec.resource.script("component://framework/service/org/moqui/admin/AdminCalls.js")
const mounts = ec.resource.script("component://tools/template/AdminMount.js")
const SERVICES = "org.moqui.admin.ReadinessServices."

// A mount link's place as a path under /qapps with its query: another app's plain URL, a screen of an Admin area (the
// routes are relative to one), or a framework app's screen path. Null for anything else.
function pathOf(link) {
    if (!link) return null
    const url = String(link.plain ? link.href : link.url)
    const query = link.plain
        ? ""
        : Object.keys(link.parameters || {})
              .map(name => encodeURIComponent(name) + "=" + encodeURIComponent(String(link.parameters[name])))
              .join("&")
    const withQuery = path => (query ? path + (path.includes("?") ? "&" : "?") + query : path)
    if (link.plain) return url.startsWith("/qapps/") ? url.slice("/qapps/".length) : null
    if (url.startsWith("../../")) return withQuery("Admin/" + url.slice("../../".length))
    const app = /^\/\/apps\/(.+)$/.exec(url)
    return app ? withQuery(app[1]) : null
}
// The URLs of places ({route, id, parameters}), each null where the mount has no route for its key or the place does not
// open to the viewer.
function openUrls(places) {
    const routes = mounts.state().routes
    const paths = places.map(place => (place && place.route ? pathOf(mounts.link(routes, place.route, place.id, place.parameters)) : null))
    if (!paths.some(Boolean)) return paths.map(() => null)
    const found = calls.read("ironstone.admin.RegistryServices.get#OpenPaths", {paths})
    const open = Array.from(found.out?.open || [])
    return paths.map((path, index) => (path && open[index] === true ? "/qapps/" + path : null))
}
const scopeOf = organizationPartyId => (organizationPartyId ? {organizationPartyId} : null)
// The checks with what Admin's screens read of each: the organization its scope names and its fix link where it opens.
function withFixUrls(checks) {
    const rows = Array.from(checks || [])
    const urls = openUrls(rows.map(row => ({route: row.fixRoute, id: row.fixId, parameters: row.fixParameters})))
    return rows.map((row, index) =>
        Object.assign({}, row, {organizationPartyId: row.scope?.organizationPartyId || null, fixUrl: urls[index] || ""})
    )
}

// get#Readiness as the viewer: {out, failure} as AdminCalls.read answers, out's checks with organizationPartyId and fixUrl.
// find is the framework's (providerKey, ownerApp, healthGroupEnumId, state) with Admin's organizationPartyId.
function readiness(find, fallback) {
    const asked = Object.assign({}, find || {})
    const organizationPartyId = asked.organizationPartyId || null
    delete asked.organizationPartyId
    asked.scopeParameters = scopeOf(organizationPartyId)
    const called = calls.read(SERVICES + "get#Readiness", asked, fallback || "The checks are not available to you.")
    if (called.out) called.out = Object.assign({}, called.out, {checks: withFixUrls(called.out.checks)})
    return called
}
// get#Overview as the viewer: attention with fixUrl, and the cards by key, each with its url where it opens.
function overview(organizationPartyId) {
    const called = calls.read(
        SERVICES + "get#Overview",
        {scopeParameters: scopeOf(organizationPartyId)},
        "The overview is not available to you."
    )
    if (!called.out) return called
    const cards = Array.from(called.out.cards || [])
    const urls = openUrls(cards.map(card => ({route: card.route, id: card.routeId, parameters: card.parameters})))
    called.out = Object.assign({}, called.out, {
        attention: withFixUrls(called.out.attention),
        cards: cards.map((card, index) => Object.assign({}, card, {url: urls[index]}))
    })
    return called
}
// find#Settings as the viewer: the entries that have a place under Admin, each with its url.
function settings(find, fallback) {
    const called = calls.read(SERVICES + "find#Settings", find || {}, fallback || "The settings index is not available to you.")
    if (!called.out) return called
    const routes = mounts.state().routes
    const entries = []
    for (const entry of Array.from(called.out.entries || [])) {
        const path = pathOf(mounts.link(routes, entry.destinationRoute))
        if (path) entries.push(Object.assign({}, entry, {url: "/qapps/" + path}))
    }
    called.out = Object.assign({}, called.out, {entries})
    return called
}
// Health's rows as the framework's AdminReadiness.health made them, a fix link left only where its place opens.
function openFixes(rows) {
    const list = Array.from(rows || [])
    const urls = openUrls(list.map(row => ({route: row.fixRoute, id: row.fixId, parameters: row.fixParameters})))
    return list.map((row, index) => (urls[index] ? row : Object.assign({}, row, {fixHref: "", fixUrl: "", fixParameters: {}})))
}

;({readiness, overview, settings, openFixes, openUrls})
