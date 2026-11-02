// Commons Settings/Sync and the device addresses of Calendars, Contact books and a drive (screen/Commons/Settings/Sync.xml,
// Calendars.xml, ContactBooks.xml, screen/Commons/Files/DriveSettings.xml; design-drawers-commons.md §11 Sync): john.doe makes
// an app password for a phone (shown once, then a device with its name), sees the addresses a device uses (the DAV server,
// his calendars, contact books and drives, from org.moqui.impl.DavServices.get#SyncAddresses) and the steps per platform, and
// revokes it. The password then logs a DAV request in until it is revoked.
// Run: ./moq test mr-boss --spec SyncSettings
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const made = {}

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(`apps/Commons/${path}`, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    const errors = str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const devices = () => sys(() => Array.from(ec.entity.find("moqui.security.UserAppPassword").condition("userId", ec.user.userId)
        .condition("name", "Spec phone").list()))
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
function base64(text) {
    const bytes = Array.from(text).map((ch) => ch.charCodeAt(0))
    let out = ""
    for (let i = 0; i < bytes.length; i += 3) {
        const [a, b, c] = [bytes[i], bytes[i + 1], bytes[i + 2]]
        const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
        out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (b == null ? "=" : B64[(n >> 6) & 63]) + (c == null ? "=" : B64[n & 63])
    }
    return out
}
const davRoot = (password) => sys(() => call("org.moqui.impl.DavServices.serve#DavRequest", { method: "PROPFIND", path: "/dav/",
    headers: { Authorization: `Basic ${base64(`john.doe:${password}`)}`, Depth: "0" } }))

spec({
    stepwise: true,
    setupSpec() { login("john.doe") },
})

feature("Sync lists no devices yet, the addresses a device uses and the steps per platform", {
    when() { return render("Settings/Sync") },
    then({ status, errors, output, broken }) {
        status == 200
        errors == ""
        !broken
        output.includes("Devices")
        output.includes("New app password")
        output.includes("/dav/calendars/john.doe/")
        output.includes("/dav/addressbooks/john.doe/")
        output.includes("/dav/files/john.doe/")
        output.includes("iPhone and iPad")
        output.includes("DAVx⁵")
        output.includes("Thunderbird")
    },
})

feature("New app password makes one for the phone, a device by its name", {
    when() {
        const created = post("Settings/Sync/createAppPassword", { name: "Spec phone" })
        const rows = devices()
        const page = render("Settings/Sync")
        return { created, rows, page }
    },
    then({ created, rows, page }) {
        created.errors == ""
        rows.length == 1
        rows[0].passwordHash != null
        rows[0].revokedDate == null
        page.output.includes("Spec phone")
        !page.output.includes("No devices yet")
    },
})

feature("an app password made by the service is taken by the DAV server until Revoke", {
    when() {
        made.password = sys(() => call("org.moqui.impl.UserServices.create#UserAppPassword", { name: "Spec laptop" }).password)
        made.laptopId = sys(() => ec.entity.find("moqui.security.UserAppPassword").condition("userId", ec.user.userId)
                .condition("name", "Spec laptop").one()).appPasswordId
        const before = davRoot(made.password)
        const revoked = post("Settings/Sync/revokeAppPassword", { appPasswordId: made.laptopId })
        const after = davRoot(made.password)
        const page = render("Settings/Sync")
        return { before, revoked, after, page }
    },
    then({ before, revoked, after, page }) {
        before.status == 207
        revoked.errors == ""
        after.status == 401
        !page.output.includes("Spec laptop")
    },
})

feature("Calendars and Contact books show each one's CalDAV and CardDAV address, a drive its WebDAV address", {
    when() {
        const calendars = render("Settings/Calendars")
        const books = render("Settings/ContactBooks")
        const personalDriveId = sys(() => call("org.moqui.impl.FileServices.get#UserDrives", {}).personalDriveId)
        const drive = render("Files/DriveSettings", { driveId: personalDriveId })
        return { calendars, books, drive }
    },
    then({ calendars, books, drive }) {
        calendars.errors == ""
        calendars.output.includes("Phones and desktop apps (CalDAV)")
        calendars.output.includes("/dav/calendars/john.doe/")
        books.errors == ""
        books.output.includes("Phones and desktop apps (CardDAV)")
        drive.errors == ""
        drive.output.includes("On your devices")
        drive.output.includes("/dav/files/john.doe/My%20files/")
    },
})
