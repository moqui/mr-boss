// The range of a list's date-period find field for a screen that reads its parameters itself rather than through a
// search form: <name>_period (with _poffset and _pdate), else the days <name>_from and <name>_thru (thru inclusive, so the
// range ends at the start of the next day). A day that does not parse is left out of the range and named in `invalid`,
// with the search form's wording ("Raised: 'x' is not a valid date"); the screen reports it with `reportInvalid` after its
// find has run, since a service is not run while the request has an error.
function parameter(name) {
    const value = ec.web.parameters[name]
    return value == null || value === "" ? null : String(value)
}
function dateRange(name, title) {
    const invalid = []
    if (parameter(name + "_period")) {
        const range = ec.user.getPeriodRange(
            parameter(name + "_period"),
            parameter(name + "_poffset") || "0",
            parameter(name + "_pdate")
        )
        return {from: range ? range[0] : null, thru: range ? range[1] : null, invalid}
    }
    const day = suffix => {
        const text = parameter(name + suffix)
        if (!text) return null
        const parsed = ec.l10n.parseTimestamp(text.substring(0, 10) + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")
        if (parsed == null) invalid.push({field: name + suffix, message: title + ": '" + text + "' is not a valid date"})
        return parsed
    }
    const from = day("_from")
    const thruDay = day("_thru")
    return {from, thru: thruDay == null ? null : new Date(Number(String(thruDay)) + 86400000), invalid}
}
function reportInvalid(range) {
    for (const problem of range.invalid) ec.message.addValidationError(null, problem.field, null, problem.message)
}
;({dateRange, reportInvalid})
