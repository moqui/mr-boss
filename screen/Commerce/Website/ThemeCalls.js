// The JSON calls of Commerce's theme editors (ThemeEditor.qvue, TemplateEditor.qvue; impl-commerce P5): each transition calls
// one mantle.public.ThemeServices service in its own transaction and answers its result, or the refusal in `errors` (the
// reason code first) for the editor to show; the service checks the permission, the store and the draft revision.
// `previewUrl` makes a preview's address on the site's preview host with this request's scheme and port, since the
// authority's runtime serves both. CC0 1.0 Universal plus Grant of Patent License.
function probe(name, parameters) {
    ec.message.pushErrors()
    try {
        const out = Object.assign(
            {},
            ec.service.sync().name(name).parameters(parameters).requireNewTransaction(true).call() || {}
        )
        out.errors = ec.message.getErrorsString()
        return out
    } catch (error) {
        return {errors: String(error.message || error)}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
const json = text => {
    if (text == null || text === "") return null
    if (typeof text === "object") return text
    try {
        return JSON.parse(String(text))
    } catch (error) {
        return null
    }
}
// Answer a ThemeServices call as JSON.
function send(verbNoun, parameters) {
    ec.web.sendJsonResponse(probe("mantle.public.ThemeServices." + verbNoun, parameters))
}
// A preview's address: the preview host with this request's scheme and port, and the path that carries its token.
function previewUrl(made) {
    if (!made || !made.previewHost || !made.previewPath) return null
    const request = ec.web?.request
    const scheme = request?.getScheme ? request.getScheme() : "https"
    const port = request?.getServerPort ? Number(request.getServerPort()) : 0
    const defaultPort = (scheme === "https" && port === 443) || (scheme === "http" && port === 80) || !port
    return scheme + "://" + made.previewHost + (defaultPort ? "" : ":" + port) + made.previewPath
}
;({probe, json, send, previewUrl})
