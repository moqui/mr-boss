// The server-static check the ServerStatic specs share (README "Significant redesigns" 3, mr-moqui plans/archive/QvtServerStatic.md):
// ec.screen.staticReport runs the static half and the full check (an html render with the real actions and the wrapped ec) on
// each plain XML screen of an app root, as the current user. One spec per app or few apps keeps each well under 30 s.
const base = "component://mr-boss/screen"

// [app, path under its root, marked server-static] of the plain XML screens (not .qvue, not placeholders) under the roots
function screens(appList) {
    const found = []
    for (const app of appList) {
        const files = []
        ec.resource.getLocationReference(`${base}/${app}.xml`).walkChildTree(files, null)
        for (const file of files) {
            if (file.path === app || !file.location.endsWith(".xml")) continue
            const text = ec.resource.getLocationReference(file.location).getText()
            if (/render-modes="[^"]*qvue/.test(text) || text.includes('<label text="Placeholder:')) continue
            found.push([app, file.path.substring(app.length + 1), /server-static="[^"]*\bqvt\b/.test(text)])
        }
    }
    return found
}

// the full check of each screen with parametersOf(app, path), logged as a report; answers its rows
function check(found, parametersOf) {
    const rows = []
    for (const [app, path, marked] of found) {
        let report
        try {
            // from the apps root the app is mounted under, so a link from the app root (//Warehouse/...) resolves
            report = ec.screen.staticReport({
                rootScreen: "component://webroot/screen/webroot/apps.xml",
                screenPath: `${app}/${path}`,
                parameters: parametersOf(app, path) || {}
            })
        } catch (err) {
            report = {verdict: "error", violations: [], reasons: [String(err && err.message ? err.message : err)]}
        }
        ec.message.clearErrors()
        // the app roots' always-actions organization setup is on every screen: listed once in the summary, not per screen
        const orgSetup = report.violations.some(violation => violation.detail.includes("setup#UserOrganizationInfo"))
        // a violation of no screen is the shell's (the theme footer the apps root writes in html), not the checked screen's
        const why = report.reasons.concat(
            report.violations
                .filter(violation => violation.screen)
                .filter(violation => !violation.detail.includes("setup#UserOrganizationInfo"))
                .map(violation => `[${violation.kind}] ${violation.element} ${violation.detail}`)
        )
        if (orgSetup && why.length == 0) why.push("only the root's always-actions setup#UserOrganizationInfo")
        // only the shell's violations: the screen itself is clean
        const shellOnly = report.verdict === "violations" && report.reasons.length == 0 && report.violations.every(violation => !violation.screen)
        rows.push({key: `${app}/${path}`, marked, verdict: shellOnly ? "clean" : report.verdict, why})
    }
    ec.logger.warn(
        "Server-static report:\n" +
            rows
                .map(
                    row =>
                        `${row.marked ? "M " : "  "}${row.verdict.padEnd(22)} ${row.key}` +
                        (row.verdict === "clean" ? "" : "\n        " + row.why.slice(0, 6).join("\n        "))
                )
                .join("\n")
    )
    return rows
}

// the marked screens that are not clean, one line each ("" when none)
const unclean = rows =>
    rows
        .filter(row => row.marked && row.verdict !== "clean")
        .map(row => `${row.key}: ${row.verdict} ${row.why.join("; ")}`)
        .join("\n")

;({screens, check, unclean})
