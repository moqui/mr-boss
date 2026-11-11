// A read an Admin screen makes through a service that checks its own permission and scope, with the refusal kept as its
// reason (impl-admin F129, P19). A service-call with ignore-error="true" clears the error message, so a screen could not tell
// a refusal from an empty list or a missing record: read() calls the service in a transaction and an error frame of its own
// and answers {out, failure}. failure is the refusal's own words when the service refused with a reason ("CODE: words", as
// the Admin, Mantle and framework services refuse, or "PERMISSION is required", as the framework's administration services
// refuse a missing permission), otherwise the screen's fallback text, so nothing but a refusal's reason is ever shown; null
// when the call succeeded.
function reasonOf(text) {
    const value = String(text || "")
    const coded = /\b[A-Z][A-Z0-9_]{2,}: ([^\n|]+)/.exec(value)
    if (coded) return coded[1].trim()
    const permission = /\b([A-Z][A-Z0-9_]{2,}(?: or [A-Z][A-Z0-9_]{2,})* is required[^\n|]*)/.exec(value)
    return permission ? permission[1].trim() : null
}

function read(name, parameters, fallback) {
    const unavailable = fallback || "This is not available to you."
    ec.message.pushErrors()
    try {
        const out =
            ec.service
                .sync()
                .name(name)
                .parameters(parameters || {})
                .requireNewTransaction(true)
                .call() || {}
        if (!ec.message.hasError()) return {out, failure: null}
        return {out: null, failure: reasonOf(ec.message.getErrorsString()) || unavailable}
    } catch (error) {
        return {out: null, failure: reasonOf(error?.message ?? error) || unavailable}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

;({read, reasonOf})
