// Commons Settings/ContactBooks (screen/Commons/Settings/ContactBooks.xml; design-drawers-commons.md §11 ContactBooks; impl M4): the user's
// books with their kind, size and sharing, a new shared book shared with Joe Developer to view (who then sees it in his Contacts scopes
// and may not change it), its groups as editable rows, unsharing, and deleting it; the default book cannot be deleted. Everything goes
// through mantle.party.ContactBookServices, whose own refusals (a personal book shared, a group name taken) Mantle's specs check. Authorization stays on, as for a browser request.
// Run: ./moq test mr-boss --spec ContactBookSettings
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output: String(str.output || "") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const books = (fields) => sys(() => Array.from(ec.entity.find("mantle.party.contact.ContactBook").condition(fields).list()))
const currentShares = (contactBookId) => sys(() => Array.from(ec.entity.find("mantle.party.contact.ContactBookShare").condition("contactBookId", contactBookId)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
const groupsOf = (contactBookId) => sys(() => Array.from(ec.entity.find("mantle.party.contact.ContactBookGroup").condition("contactBookId", contactBookId).list()))
let sharedBookId

spec({
    stepwise: true,
    setupSpec() { login("john.doe") },
    cleanupSpec() { login("john.doe") },
})

feature("the settings list john.doe's personal and shared books with their size and sharing, and their CardDAV addresses", {
    when() { return { shown: render("apps/Commons/Settings/ContactBooks", {}) } },
    then({ shown }) {
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes("My Contacts")
        shown.output.includes("Personal · default")
        shown.output.includes("Team Contacts")
        shown.output.includes("Shared · Ziziwork Services")
        shown.output.includes("John Doe (manage), Joe Developer (edit)")
        shown.output.includes("Customers")
        shown.output.includes("Phones and desktop apps (CardDAV)")
        shown.output.includes("/dav/addressbooks/john.doe/")
        shown.output.includes("New book")
        // Joe Developer's personal book is his alone
        !shown.output.includes("BOSS_DEMO_BOOK_JOE")
    },
})

feature("New book makes a shared book john.doe manages; Share opens it to Joe Developer to view", {
    when() {
        const created = post("Settings/ContactBooks/createBook", { contactBookName: "Spec Suppliers", visibilityEnumId: "CbvShared", ownerPartyId: "",
            description: "Suppliers for the spec" })
        sharedBookId = (books({ contactBookName: "Spec Suppliers" })[0] || {}).contactBookId
        const shared = post("Settings/ContactBooks/shareBook", { contactBookId: sharedBookId, shareUserId: "ORG_ZIZI_JD", permissionEnumId: "CbpView" })
        const shown = render("apps/Commons/Settings/ContactBooks", {})
        return { created, shared, shown, shares: currentShares(sharedBookId) }
    },
    then({ created, shared, shown, shares }) {
        created.errors == ""
        sharedBookId != null
        shared.errors == ""
        shares.length == 2
        shares.some((share) => share.userId === "EX_JOHN_DOE" && share.permissionEnumId === "CbpManage")
        shares.some((share) => share.userId === "ORG_ZIZI_JD" && share.permissionEnumId === "CbpView")
        shown.output.includes("Spec Suppliers")
        shown.output.includes("Joe Developer (view)")
    },
})

feature("groups are editable rows: add, rename and delete", {
    when() {
        const added = post("Settings/ContactBooks/createGroup", { contactBookId: sharedBookId, groupName: "Paper" })
        post("Settings/ContactBooks/createGroup", { contactBookId: sharedBookId, groupName: "Ink" })
        const paper = groupsOf(sharedBookId).find((group) => group.groupName === "Paper")
        const renamed = post("Settings/ContactBooks/updateGroup", { contactBookGroupId: paper.contactBookGroupId, groupName: "Paper and envelopes" })
        const ink = groupsOf(sharedBookId).find((group) => group.groupName === "Ink")
        const deleted = post("Settings/ContactBooks/deleteGroup", { contactBookGroupId: ink.contactBookGroupId })
        const shown = render("apps/Commons/Settings/ContactBooks", {})
        return { added, renamed, deleted, names: groupsOf(sharedBookId).map((group) => group.groupName), shown }
    },
    then({ added, renamed, deleted, names, shown }) {
        added.errors == ""
        renamed.errors == ""
        deleted.errors == ""
        names == ["Paper and envelopes"]
        shown.output.includes("Paper and envelopes")
    },
})

feature("Joe Developer sees the book shared with him in his Contacts scopes, may view it but not change it", {
    when() {
        login("joe.developer")
        try {
            const contacts = render("apps/Commons/Contacts", { find: "Y", scope: "all" })
            const settings = render("apps/Commons/Settings/ContactBooks", {})
            const rename = post("Settings/ContactBooks/updateBook", { contactBookId: sharedBookId, contactBookName: "Mine now" })
            return { contacts, settings, rename }
        } finally { login("john.doe") }
    },
    then({ contacts, settings, rename }) {
        contacts.output.includes("Spec Suppliers · shared")
        settings.output.includes("Spec Suppliers")
        settings.output.includes("you may view")
        // no Edit, Share or Delete for a viewer: the book's toolbar is empty and its groups are text
        !settings.output.includes("Edit Spec Suppliers")
        rename.errors.includes("You need manage permission on contact book Spec Suppliers")
        books({ contactBookId: sharedBookId })[0].contactBookName == "Spec Suppliers"
    },
})

feature("unshare, rename, and delete the book; the default personal book cannot be deleted", {
    when() {
        const joeShare = currentShares(sharedBookId).find((share) => share.userId === "ORG_ZIZI_JD")
        const unshared = post("Settings/ContactBooks/unshareBook", { contactBookId: sharedBookId, contactBookShareId: joeShare.contactBookShareId })
        const sharesAfter = currentShares(sharedBookId).length
        const renamed = post("Settings/ContactBooks/updateBook", { contactBookId: sharedBookId, contactBookName: "Spec Suppliers 2", description: "" })
        const name = books({ contactBookId: sharedBookId })[0].contactBookName
        const defaultBook = post("Settings/ContactBooks/deleteBook", { contactBookId: "BOSS_DEMO_BOOK_JD" })
        const deleted = post("Settings/ContactBooks/deleteBook", { contactBookId: sharedBookId })
        return { unshared, sharesAfter, renamed, name, defaultBook, deleted, gone: books({ contactBookId: sharedBookId }).length,
            stillThere: books({ contactBookId: "BOSS_DEMO_BOOK_JD" }).length }
    },
    then({ unshared, sharesAfter, renamed, name, defaultBook, deleted, gone, stillThere }) {
        unshared.errors == ""
        sharesAfter == 1
        renamed.errors == ""
        name == "Spec Suppliers 2"
        defaultBook.errors.includes("The default book cannot be deleted")
        deleted.errors == ""
        gone == 0
        stillThere == 1
    },
})
