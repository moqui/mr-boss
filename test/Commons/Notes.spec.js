// Commons Notes (screen/Commons/Notes.xml and Notes.qvue, service/ironstone/commons/KnowledgeServices.xml; impl-drawers-commons.md M9,
// R22; design-drawers-commons.md §10 Notes): the JSON transitions the screen calls under the Commons app root, on john.doe's demo
// notes (data/BossKnowledgeDemoData.xml). The list pinned first, then the latest changed, with the tags and their counts; search
// and a tag narrow it; a new note, saved on idle with no note and as a named version, a save that met another; pin, tags, a
// linked request; delete; Move to a space (database files keep the rows, a git space gets the history replayed); QuickCreate's
// note kind lands here; and Commons Home's recent pages. Joe Developer and Bob Developer may not read, change or find another
// user's notes (the notes space's restrictView and restrictUpdate). Authorization stays on.
// Run: ./moq test mr-boss --spec Notes
const commons = "component://mr-boss/screen/Commons.xml"
const RUN = Date.now().toString(36).slice(-3).toUpperCase()
const made = {}

function call_(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output: String(str.output || "") }
}
const get = (name, parameters) => call_(`Notes/${name}`, parameters, null)
const post = (name, parameters) => call_(`Notes/${name}`, parameters, "post")
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const pageId = (space, path) => sys(() => ec.entity.find("moqui.resource.wiki.WikiPage").condition("wikiSpaceId", space).condition("pagePath", path || null).one())?.wikiPageId
const titles = (answer) => (answer.json.noteList || []).map((note) => note.title)
const note = (id) => get("note", { wikiPageId: id }).json.page || null

spec({
    setupSpec() {
        login("john.doe")
        sys(() => {
            if (!ec.search.isAvailable()) return
            for (const document of ec.entity.find("moqui.entity.document.DataDocument").condition("primaryEntityName", "moqui.resource.wiki.WikiPage").list()) {
                ec.search.ensureIndex({ documentType: document.dataDocumentId })
                ec.search.indexDocuments(ec.entity.getDataDocuments(document.dataDocumentId, {}))
            }
        })
    },
    cleanup() { login("john.doe") },
})

feature("john.doe's notes: pinned first, then the latest changed, with snippets, when, and the tags with their counts", {
    when() { return get("notes") },
    then({ status, errors, json }) {
        status == 200
        errors == ""
        json.wikiSpaceId == "NOTES_EX_JOHN_DOE"
        json.noteList.slice(0, 4).map((row) => row.title) == ["Groceries", "Cabin Wi-Fi", "Call with Acme", "Ideas for the newsletter"]
        json.noteList[0].pinned
        json.noteList[1].pinned
        !json.noteList[2].pinned
        json.noteList[0].snippet.includes("coffee beans")
        json.noteList[0].tags == ["Home"]
        json.noteList[2].tags == ["Work"]
        json.noteList[0].whenText.length > 0
        json.tagList.find((tag) => tag.name === "Home").count == 2
        json.tagList.find((tag) => tag.name === "Work").count == 2
    },
})

feature("search narrows the notes by their text, and a tag by its notes", {
    when() { return { coffee: get("notes", { text: "coffee" }), work: get("notes", { tag: "Work" }), none: get("notes", { text: "zebra crossing" }) } },
    then({ coffee, work, none }) {
        titles(coffee) == ["Groceries"]
        titles(work) == ["Call with Acme", "Ideas for the newsletter"]
        none.json.noteList.length == 0
    },
})

feature("a new note starts empty and saves itself as typed; a named version keeps its note; a save from an older version meets the newer one", {
    when() {
        const created = post("createNote", {})
        made.noteId = created.json.wikiPageId
        const opened = note(made.noteId)
        const idle = post("saveNote", { wikiPageId: made.noteId, pageText: `# Spec note ${RUN}\n\nFirst thought\n`, baseVersionName: opened.currentVersionName })
        const named = post("saveNote", { wikiPageId: made.noteId, pageText: `# Spec note ${RUN}\n\nFirst thought, then a second\n`, versionNote: "Both thoughts",
            baseVersionName: idle.json.currentVersionName })
        const stale = post("saveNote", { wikiPageId: made.noteId, pageText: "Older\n", baseVersionName: idle.json.currentVersionName })
        const history = get("history", { wikiPageId: made.noteId })
        const list = get("notes")
        return { created, opened, idle, named, stale, history, list, after: note(made.noteId) }
    },
    then({ created, opened, idle, named, stale, history, list, after }) {
        created.errors == ""
        opened.isMyNotes
        opened.title.startsWith("Note ")
        idle.json.versionName != null
        idle.json.messageInfos.length == 0
        named.json.messageInfos[0].message == "Version saved"
        stale.json.conflict
        history.json.versionList[0].note == "Both thoughts"
        history.json.versionList.length == 3
        history.json.canRestore
        after.title == `Spec note ${RUN}`
        after.text.includes("then a second")
        titles(list).includes(`Spec note ${RUN}`)
        // a note shows no review or publish: it is not a Knowledge page
        after.isNotes
        after.reviews.length == 0
    },
})

feature("pin, tags and a linked request on a note; the list follows", {
    when() {
        const pinned = post("setPinned", { wikiPageId: made.noteId, pinned: "true" })
        const tagged = post("setTags", { wikiPageId: made.noteId, tags: "Work,Ideas" })
        const linked = post("linkRecord", { wikiPageId: made.noteId, record: "mantle.request.Request|BOSS_DEMO_REQUEST" })
        const wrongKind = post("linkRecord", { wikiPageId: made.noteId, record: "mantle.party.Party|EX_JOHN_DOE" })
        const list = get("notes")
        const view = note(made.noteId)
        const unpinned = post("setPinned", { wikiPageId: made.noteId, pinned: "false" })
        const untagged = post("setTags", { wikiPageId: made.noteId, tags: "Ideas" })
        return { pinned, tagged, linked, wrongKind, list, view, unpinned, untagged, after: note(made.noteId) }
    },
    then({ pinned, tagged, linked, wrongKind, list, view, unpinned, untagged, after }) {
        pinned.json.pinned
        tagged.json.tagList == ["Ideas", "Work"]
        linked.errors == ""
        wrongKind.errors.includes("A page links to a task, an event or a request")
        list.json.noteList.findIndex((row) => row.wikiPageId === made.noteId) < 3
        list.json.tagList.find((tag) => tag.name === "Work").count == 3
        view.pinned
        view.records.map((record) => record.recordId) == ["BOSS_DEMO_REQUEST"]
        !after.pinned
        after.tags == ["Ideas"]
    },
})

feature("Move to a space: a note becomes a page of the space with its history, on database files", {
    when() {
        const moved = post("moveNote", { wikiPageId: made.noteId, toWikiSpaceId: "BOSSKB", toParentPath: "", toPageName: `Spec moved ${RUN}` })
        const page = call_("Knowledge/page", { wikiPageId: made.noteId }, null).json.page
        const gone = get("notes")
        const targets = get("moveTargets")
        return { moved, page, gone, targets }
    },
    then({ moved, page, gone, targets }) {
        moved.errors == ""
        moved.json.wikiSpaceId == "BOSSKB"
        !moved.json.replayed
        moved.json.messageInfos[0].link == `/qapps/Commons/Knowledge?wikiPageId=${made.noteId}`
        page.wikiSpaceId == "BOSSKB"
        page.pagePath == `Spec moved ${RUN}`
        page.versionCount == 3
        !page.isNotes
        !gone.json.noteList.some((row) => row.wikiPageId === made.noteId)
        targets.json.spaceList.some((space) => space.wikiSpaceId === "BOSSKB")
        !targets.json.spaceList.some((space) => space.wikiSpaceId.startsWith("NOTES_"))
    },
})

feature("Move into a git space replays the note's history", {
    requires: ["git"],
    when() {
        const second = post("createNote", { title: `Spec git note ${RUN}` })
        post("saveNote", { wikiPageId: second.json.wikiPageId, pageText: `# Spec git note ${RUN}\n\nOne\n`, versionNote: "One" })
        const toGit = post("moveNote", { wikiPageId: second.json.wikiPageId, toWikiSpaceId: "BOSSENG", toParentPath: "" })
        const gitHistory = call_("Knowledge/history", { wikiPageId: second.json.wikiPageId }, null)
        return { toGit, gitHistory }
    },
    then({ toGit, gitHistory }) {
        toGit.json.replayed
        toGit.json.versionCount == 2
        gitHistory.json.storage == "git"
        gitHistory.json.versionList.map((version) => version.note) == ["One", `Version 01`]
    },
})

feature("delete takes a note away; QuickCreate's note kind without a record lands in the notes; Home lists the recent pages", {
    when() {
        const created = post("createNote", { title: `Spec delete ${RUN}` })
        const deleted = post("deleteNote", { wikiPageId: created.json.wikiPageId })
        const quick = sys(() => call("ironstone.commons.QuickCreateServices.create#Note", { title: `Spec quick ${RUN}`, noteText: "Call the plumber" }))
        const list = get("notes")
        call_("Knowledge/page", { wikiSpaceId: "BOSSKB", pagePath: "Office" }, null)
        const recent = sys(() => call("ironstone.commons.KnowledgeServices.get#RecentPages", { limit: 5 })).pageList
        const home = ec.screen.makeTest().rootScreen(commons).renderMode("qvt").withStaticData().render("Home", { lastStandalone: "-2" }, null)
        ec.message.clearErrors()
        return { deleted, gone: pageId("NOTES_EX_JOHN_DOE", `Spec delete ${RUN}`), quick, list, recent, home: String(home.output || "") }
    },
    then({ deleted, gone, quick, list, recent, home }) {
        deleted.errors == ""
        gone == null
        quick.url == "/qapps/Commons/Notes?wikiPageId=" + quick.wikiPageId
        titles(list).includes(`Spec quick ${RUN}`)
        recent.some((row) => row.pagePath === "Office" && row.kind === "opened" && row.url.startsWith("/qapps/Commons/Knowledge?wikiPageId="))
        recent.some((row) => row.isNotes && row.url.startsWith("/qapps/Commons/Notes?wikiPageId="))
        home.includes("Recent pages")
        home.includes("Office")
    },
})

feature("Joe Developer and Bob Developer may not read, change or find another user's notes", {
    when() {
        const groceries = pageId("NOTES_EX_JOHN_DOE", "Groceries")
        const joeNote = pageId("NOTES_ORG_ZIZI_JD", "Conference talk draft")
        const joe = as("joe.developer", () => ({ read: get("note", { wikiPageId: groceries }), save: post("saveNote", { wikiPageId: groceries, pageText: "Mine" }),
            search: call_("Knowledge/search", { text: "Groceries" }, null), list: get("notes"), own: get("note", { wikiPageId: joeNote }) }))
        const bob = as("bob.developer", () => ({ list: get("notes") }))
        // john.doe, an administrator, reads another's note in Knowledge (the wiki's rule) but it is not one of his notes
        const john = { inNotes: get("note", { wikiPageId: joeNote }) }
        return { joe, bob, john, still: sys(() => ec.resource.getLocationText("dbresource://WikiSpace/NOTES_EX_JOHN_DOE/Groceries.md")) }
    },
    then({ joe, bob, john, still }) {
        joe.read.errors.includes("Page not found")
        joe.save.errors.includes("Page not found")
        !joe.search.json.pageList.some((hit) => hit.wikiSpaceId === "NOTES_EX_JOHN_DOE")
        joe.list.json.wikiSpaceId == "NOTES_ORG_ZIZI_JD"
        !joe.list.json.noteList.some((row) => row.title === "Groceries")
        joe.own.json.page.title == "Conference talk draft"
        bob.list.json.noteList.length == 0
        john.inNotes.errors.includes("Note not found")
        still.includes("coffee beans")
    },
})
