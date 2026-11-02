// Commons Home's setup card and the Commons settings (screen/Commons/Home.xml, screen/Commons/Settings/*;
// impl-drawers-commons.md M2): NotificationSettings lists the topics by inbox and saves john.doe's in-app, email and daily
// digest choice (NotificationTopicUser.digest); Preferences saves the appearance and a key binding into the KEYMAP preference
// and resets it; the setup card's Done and Dismiss are kept in COMMONS_SETUP; Account changes only the signed-in user, and
// its photo (the face image of the user's own party) is uploaded, replaced and removed, and shown by m-avatar in Chatter.
// Run: ./moq test mr-boss --spec CommonsSettings
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(`apps/Commons/${path}`, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, text: String(str.output || "").substring(0, 300) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const faces = (partyId) => sys(() => Array.from(ec.entity.find("mantle.party.PartyContent").condition("partyId", partyId)
        .condition("partyContentTypeEnumId", "PcntFaceImage").list()))
function get(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    return { status: str.status, output, json: json || {} }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}

spec({
    setupSpec() { login("john.doe") },
})

feature("NotificationSettings lists the topics by inbox, the providers' private ones too", {
    when() { return render("Settings/Notifications") },
    then({ status, errors, output, broken }) {
        status == 200
        errors == ""
        !broken
        output.includes("Notifications inbox")
        output.includes("Updates inbox")
        // ChatterMention is private, a Commons notification-topic provider
        // the Notifications inbox's topics before the Updates inbox's (each list in its own form-list, read in screen order)
        output.indexOf("Mentioned on a Record") >= 0
        output.indexOf("Mentioned on a Record") < output.indexOf("Activity on a Followed Record")
        output.includes("Daily digest")
    },
})

feature("NotificationSettings saves the daily digest of a topic for john.doe", {
    when() {
        const saved = post("Settings/Notifications/storeTopic", { topic: "WorkEffortReminder", receiveNotifications: "Y", digest: "Y" })
        const row = one("moqui.security.user.NotificationTopicUser", { topic: "WorkEffortReminder", userId: "EX_JOHN_DOE" })
        const rows = sys(() => call("ironstone.commons.CommonsServices.get#NotificationTopicRows", { providerTopics: ["WorkEffortReminder"] }))
        return { saved, row, shown: rows.notificationsRows.find((topic) => topic.topic === "WorkEffortReminder") }
    },
    then({ saved, row, shown }) {
        saved.errors == ""
        row.digest == "Y"
        row.receiveNotifications == "Y"
        row.emailNotifications == "N"
        shown.digest == "Y"
    },
})

feature("Preferences shows the keys of the shell and of the apps, saves an override in KEYMAP and resets it", {
    when() {
        const before = render("Settings/Preferences")
        const saved = post("Settings/Preferences/setKey", { scope: "global", id: "g c", keys: "g x", defaultKeys: "g c" })
        const keymap = ec.user.getPreference("KEYMAP")
        const after = render("Settings/Preferences")
        // the keymap rows as the server-static page reads them (its form-list's data)
        const keyRows = JSON.parse(ec.screen.makeTest().rootScreen(webroot).render("apps/Commons/Settings/Preferences/actions/Keymap", {}, null).output || "{}").keyRows || []
        const changed = keyRows.find((row) => row.scope === "global" && row.id === "g c") || {}
        const reset = post("Settings/Preferences/resetKey", { scope: "global", id: "g c" })
        return { before, saved, keymap, after, changed, reset, cleared: ec.user.getPreference("KEYMAP") }
    },
    then({ before, saved, keymap, after, changed, reset, cleared }) {
        before.status == 200
        before.errors == ""
        before.output.includes("Search and go to (the palette)")
        before.output.includes("Contacts")
        saved.errors == ""
        JSON.parse(keymap).global["g c"] == "g x"
        after.status == 200
        // the row now has the override and offers Reset to g c
        changed.overridden
        changed.keys == "g x"
        changed.defaultKeys == "g c"
        reset.errors == ""
        !cleared
    },
})

feature("Preferences saves the appearance and answers a page load", {
    when() {
        const saved = post("Settings/Preferences/saveAppearance", { darkMode: "Y", density: "compact", startApp: "Commons" })
        return { saved, dark: ec.user.getPreference("QUASAR_DARK"), left: ec.user.getPreference("QUASAR_LEFT_OPEN"),
            density: ec.user.getPreference("SHELL_DENSITY"), start: ec.user.getPreference("SHELL_START_APP") }
    },
    then({ saved, dark, left, density, start }) {
        saved.errors == ""
        saved.json.redirectUrl == "/qapps/Commons/Settings/Preferences"
        dark == "true"
        left == "false"
        density == "compact"
        start == "Commons"
    },
})

feature("the setup card keeps Done and Dismiss, and goes when every item is", {
    when() {
        const first = render("Home")
        post("Home/setSetup", { item: "mailAccount", state: "done" })
        const done = render("Home")
        post("Home/setSetup", { item: "all", state: "dismissed" })
        const dismissed = render("Home")
        return { first, done, dismissed, states: JSON.parse(ec.user.getPreference("COMMONS_SETUP")) }
    },
    then({ first, done, dismissed, states }) {
        first.status == 200
        first.errors == ""
        first.output.includes("Add a mail account")
        first.output.includes("Due today")
        first.output.includes("Requests assigned")
        !done.output.includes("Add a mail account")
        done.output.includes("Import contacts")
        !dismissed.output.includes("Get started")
        states.mailAccount == "done"
        states.importContacts == "dismissed"
    },
})

feature("Account changes the signed-in user only, whatever user the request names", {
    when() {
        // the form posts every field of the account, its email address too (left out, the account would lose it)
        const email = one("moqui.security.UserAccount", { userId: "EX_JOHN_DOE" }).emailAddress
        const saved = post("Settings/Account/updateAccount", { userId: "ORG_ZIZI_JD", partyId: "ORG_ZIZI_JD", firstName: "Johnny", lastName: "Doe",
            emailAddress: email, timeZone: "US/Central" })
        return { saved, email, john: one("mantle.party.Person", { partyId: "EX_JOHN_DOE" }), joe: one("mantle.party.Person", { partyId: "ORG_ZIZI_JD" }),
            account: one("moqui.security.UserAccount", { userId: "EX_JOHN_DOE" }), page: render("Settings/Account") }
    },
    then({ saved, email, john, joe, account, page }) {
        saved.errors == ""
        john.firstName == "Johnny"
        joe.firstName == "Joe"
        email != null
        account.emailAddress == email
        page.status == 200
        page.errors == ""
        page.output.includes("Two-factor sign-in")
        page.output.includes("Where you are signed in")
    },
    cleanup() { sys(() => call("update#mantle.party.Person", { partyId: "EX_JOHN_DOE", firstName: "John" })) },
})

feature("Account photo: john.doe's own face image, whatever party the request names; replaced by a new one, an SVG named as a PNG refused, removed; shown in Chatter", {
    when() {
        const png = "\u0089PNG fake image bytes for the spec"
        const joeBefore = faces("ORG_ZIZI_JD").length
        const first = post("Settings/Account/uploadPhoto", { partyId: "ORG_ZIZI_JD", contentFile: uploadedFile("john.png", png, "image/png") })
        const firstRows = faces("EX_JOHN_DOE")
        const second = post("Settings/Account/uploadPhoto", { contentFile: uploadedFile("john2.jpg", png, "image/jpeg") })
        const secondRows = faces("EX_JOHN_DOE")
        const disguised = post("Settings/Account/uploadPhoto", { contentFile: uploadedFile("page.png", "<svg/>", "image/svg+xml") })
        const page = render("Settings/Account")
        const photo = get("Settings/Account/myPhoto")
        const byUser = get("Settings/Account/userPhoto", { userId: "EX_JOHN_DOE" })
        const noUser = get("Settings/Account/userPhoto", { userId: "no-such-user" })
        // another user's id is that user's photo, not the viewer's: Joe Developer has none
        const joeId = sys(() => ec.entity.find("moqui.security.UserAccount").condition("username", "joe.developer").one()).userId
        const otherUser = get("Settings/Account/userPhoto", { userId: joeId })
        // Chatter: a note by john.doe has his face image, which the panel's avatar transition serves
        const request = { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" }
        const noteId = post("Chatter/logNote", Object.assign({ body: "<p>With my photo.</p>" }, request)).json.communicationEventId
        const entry = (get("Chatter/timeline", request).json.entryList || []).find((item) => item.key === `ce-${noteId}`) || {}
        const avatar = get("Chatter/avatar", { partyId: "EX_JOHN_DOE" })
        // Joe Developer removes his photo, not john.doe's
        const joeRemove = as("joe.developer", () => post("Settings/Account/removePhoto", { partyId: "EX_JOHN_DOE" }))
        const afterJoe = faces("EX_JOHN_DOE").length
        const removed = post("Settings/Account/removePhoto", {})
        const noPhoto = get("Settings/Account/myPhoto")
        const noByUser = get("Settings/Account/userPhoto", { userId: "EX_JOHN_DOE" })
        const pageAfter = render("Settings/Account")
        sys(() => call("ironstone.shared.ChatterServices.delete#Entry", Object.assign({ communicationEventId: noteId, recordEntityName: request.recordEntity }, request)))
        return { joeBefore, first, firstRows, second, secondRows, disguised, page, photo, byUser, noUser, otherUser, entry, avatar, joeRemove, afterJoe, removed, noPhoto, noByUser, pageAfter,
            joeAfter: faces("ORG_ZIZI_JD").length, johnAfter: faces("EX_JOHN_DOE").length }
    },
    then({ joeBefore, first, firstRows, second, secondRows, disguised, page, photo, byUser, noUser, otherUser, entry, avatar, joeRemove, afterJoe, removed, noPhoto, noByUser, pageAfter, joeAfter, johnAfter }) {
        first.errors == ""
        firstRows.length == 1
        firstRows[0].description == "john.png"
        second.errors == ""
        secondRows.length == 1
        secondRows[0].description == "john2.jpg"
        disguised.errors.includes("Choose an image file")
        page.status == 200
        !page.broken
        page.output.includes("Change photo")
        page.output.includes("myPhoto?v=" + secondRows[0].partyContentId)
        page.output.includes("Remove photo")
        photo.status == 200
        byUser.status == 200
        noUser.status == 404
        otherUser.status == 404
        entry.authorImage
        avatar.status == 200
        joeRemove.errors == ""
        afterJoe == 1
        removed.errors == ""
        noPhoto.status == 404
        noByUser.status == 404
        pageAfter.output.includes("Add a photo")
        !pageAfter.output.includes("Remove photo")
        joeAfter == joeBefore
        johnAfter == 0
    },
})

feature("the settings index links every settings page", {
    when() { return render("Settings") },
    then({ status, errors, output }) {
        status == 200
        errors == ""
        output.includes("Notification settings")
        output.includes("Comms settings")
    },
})
