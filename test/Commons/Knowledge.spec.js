// Commons Knowledge (screen/Commons/Knowledge.xml and Knowledge.qvue, its subscreens Spaces and SpaceDetail,
// service/ironstone/commons/KnowledgeServices.xml; impl-drawers-commons.md M9, design-drawers-commons.md §10): the JSON transitions the
// screen calls under the Commons app root, on the knowledge demo (data/BossKnowledgeDemoData.xml). The side pane's spaces, the
// tree a level at a time, a page with its links, backlinks, history, tags, files and review; a new page, edit with a version
// note and a save that met another, history and compare, restore, publish, rename, move, a tree drop, delete; search; tags,
// files, watch and linked records; spaces made, cloned and shared. Joe Developer may not read the restricted page or the
// members-only space, and Bob Developer, who reads the handbook, may not change it (the wiki's rule, IronStone R21, R28;
// john.doe is ADMIN, so the refusals are other users'). Authorization stays on.
// Run: ./moq test mr-boss --spec Knowledge
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
const get = (name, parameters) => call_(`Knowledge/${name}`, parameters, null)
const post = (name, parameters) => call_(`Knowledge/${name}`, parameters, "post")
const render = (path, parameters) => {
    const str = ec.screen.makeTest().rootScreen(commons).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "-2" }, parameters || {}), null)
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output: String(str.output || "") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const pageId = (space, path) => sys(() => ec.entity.find("moqui.resource.wiki.WikiPage").condition("wikiSpaceId", space).condition("pagePath", path || null).one())?.wikiPageId
const page = (parameters) => get("page", parameters).json.page || null
const names = (answer) => (answer.json.childList || []).map((child) => child.name)

spec({
    setupSpec() {
        login("john.doe")
        // the search documents of the demo pages now, rather than when the data feed's worker indexes them
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

feature("the side pane has the spaces john.doe may read, with their storage and his rights, no notes space, and the review waiting on him", {
    when() { return get("setup") },
    then({ status, errors, json }) {
        status == 200
        errors == ""
        json.spaceList.some((space) => space.wikiSpaceId === "BOSSKB" && space.description === "Team handbook" && space.canAdmin && space.storage === "db")
        json.spaceList.some((space) => space.wikiSpaceId === "BOSSLEAD" && space.restrictView)
        !json.spaceList.some((space) => space.wikiSpaceId.startsWith("NOTES_"))
        json.reviewCount >= 1
        json.me.notesSpaceId == "NOTES_EX_JOHN_DOE"
        json.defaultWikiSpaceId != null
    },
})

feature("the engineering space is git in the database", {
    requires: ["git"],
    when() { return get("setup") },
    then({ status, errors, json }) {
        status == 200
        errors == ""
        json.spaceList.some((space) => space.wikiSpaceId === "BOSSENG" && space.storage === "git" && space.repositoryKind === "db" && space.storageText === "Git in the database")
    },
})

feature("the tree gives a level at a time: the top pages by name, then a page's own with the restricted one marked", {
    when() {
        return { top: get("children", { wikiSpaceId: "BOSSKB", pagePath: "" }), policies: get("children", { wikiSpaceId: "BOSSKB", pagePath: "Policies" }) }
    },
    then({ top, policies }) {
        top.status == 200
        names(top) == ["Office", "Onboarding", "Policies", "Release process"]
        top.json.childList.find((child) => child.name === "Policies").hasChildren
        !top.json.childList.find((child) => child.name === "Release process").hasChildren
        names(policies) == ["Expenses", "Security", "Travel"]
        policies.json.childList.find((child) => child.name === "Security").restricted
        policies.json.childList.find((child) => child.name === "Travel").pagePath == "Policies/Travel"
    },
})

feature("a page: its title, versions, last change, links and backlinks across spaces, and the review waiting on john.doe", {
    when() {
        return { release: page({ wikiSpaceId: "BOSSKB", pagePath: "Release process" }), home: page({ wikiSpaceId: "BOSSKB", pagePath: "" }),
            byId: page({ wikiPageId: pageId("BOSSKB", "Policies/Travel") }), old: page({ wikiSpaceId: "BOSSKB", pagePath: "Release process", versionName: "01" }) }
    },
    then({ release, home, byId, old }) {
        release.title == "Release process"
        release.currentVersionName == "03"
        release.publishedVersionName == "02"
        !release.isPublished
        release.versionCount == 3
        release.lastChange.userName == "Joe Developer"
        release.lastChange.note == "Release checklist from the team review"
        release.canUpdate
        release.text.includes("Watch the error log")
        release.links.map((link) => [link.toPagePath, link.found]) == [["Onboarding", true]]
        release.backlinks.some((link) => link.wikiSpaceId + "/" + link.pagePath == "BOSSKB/")
        release.backlinks.some((link) => link.wikiSpaceId + "/" + link.pagePath == "BOSSKB/Onboarding/First week")
        release.reviews.length == 1
        release.reviews[0].wikiPageReviewId == "BOSS_DEMO_WPR_RELEASE"
        release.reviews[0].canDecide
        release.reviews[0].requestedByName == "Joe Developer"
        release.reviews[0].url == "/qapps/Commons/Knowledge?wikiPageId=" + release.wikiPageId + "&review=BOSS_DEMO_WPR_RELEASE"
        release.breadcrumbs.map((crumb) => crumb.label) == ["Team handbook"]
        home.isRoot
        home.title == "Team handbook"
        home.links.filter((link) => !link.found).map((link) => link.toPagePath) == ["Policies/Remote work"]
        byId.pagePath == "Policies/Travel"
        byId.breadcrumbs.map((crumb) => crumb.pagePath) == ["", "Policies"]
        byId.lastChange.note == "Train first under four hours"
        old.viewingOld
        old.text.includes("3. Deploy")
        !old.text.includes("Rollback")
    },
})

feature("a page's backlinks include the engineering space", {
    requires: ["git"],
    when() {
        return { release: page({ wikiSpaceId: "BOSSKB", pagePath: "Release process" }) }
    },
    then({ release }) {
        release.backlinks.map((link) => link.wikiSpaceId + "/" + link.pagePath) == ["BOSSENG/", "BOSSKB/", "BOSSKB/Onboarding/First week"]
    },
})

feature("a new page under Office is made and opened; a page there already is refused, a name used under another page is another page", {
    when() {
        const created = post("createPage", { wikiSpaceId: "BOSSKB", parentPath: "Office", pageName: `Spec page ${RUN}` })
        made.pageId = created.json.wikiPageId
        const again = post("createPage", { wikiSpaceId: "BOSSKB", parentPath: "Office", pageName: `Spec page ${RUN}` })
        // a top-level Travel is a page of its own: Policies/Travel keeps its text (the wiki writes each page at its exact path)
        const travelBefore = page({ wikiSpaceId: "BOSSKB", pagePath: "Policies/Travel" }).text
        const elsewhere = post("createPage", { wikiSpaceId: "BOSSKB", parentPath: "", pageName: "Travel" })
        const travelAfter = page({ wikiSpaceId: "BOSSKB", pagePath: "Policies/Travel" }).text
        const topTravel = page({ wikiSpaceId: "BOSSKB", pagePath: "Travel" })
        const removed = post("deletePage", { wikiPageId: elsewhere.json.wikiPageId })
        // a space Joe may not read: nothing is said of its paths
        const hidden = as("joe.developer", () => post("createPage", { wikiSpaceId: "BOSSLEAD", parentPath: "", pageName: "Mine" }))
        return { created, again, elsewhere, travelBefore, travelAfter, topTravel, removed, hidden, view: page({ wikiPageId: made.pageId }),
            office: names(get("children", { wikiSpaceId: "BOSSKB", pagePath: "Office" })), top: names(get("children", { wikiSpaceId: "BOSSKB", pagePath: "" })) }
    },
    then({ created, again, elsewhere, travelBefore, travelAfter, topTravel, removed, hidden, view, office, top }) {
        created.status == 200
        created.json.pagePath == `Office/Spec page ${RUN}`
        view.text.startsWith(`# Spec page ${RUN}`)
        office.includes(`Spec page ${RUN}`)
        again.errors.includes("There is a page")
        elsewhere.errors == ""
        elsewhere.json.pagePath == "Travel"
        topTravel.text.startsWith("# Travel")
        travelAfter == travelBefore
        travelAfter.includes("Take the train")
        removed.errors == ""
        !top.includes("Travel")
        hidden.errors.includes("Page not found")
    },
})

feature("an edit saves a version with its note; a save from an older version meets the newer one and is kept until forced", {
    when() {
        const first = page({ wikiPageId: made.pageId })
        const saved = post("savePage", { wikiPageId: made.pageId, pageText: `# Spec page ${RUN}\n\nFirst words. See [Travel](../Policies/Travel).\n`,
            versionNote: "First words", baseVersionName: first.currentVersionName })
        const travelBack = page({ wikiSpaceId: "BOSSKB", pagePath: "Policies/Travel" }).backlinks.map((link) => link.pagePath)
        const conflict = post("savePage", { wikiPageId: made.pageId, pageText: "Mine\n", baseVersionName: first.currentVersionName })
        const unchanged = post("savePage", { wikiPageId: made.pageId, pageText: `# Spec page ${RUN}\n\nFirst words. See [Travel](../Policies/Travel).\n`,
            baseVersionName: saved.json.currentVersionName })
        const forced = post("savePage", { wikiPageId: made.pageId, pageText: `# Spec page ${RUN}\n\nSecond words.\n`, versionNote: "Second words",
            baseVersionName: first.currentVersionName, force: "true" })
        return { first, saved, conflict, unchanged, forced, after: page({ wikiPageId: made.pageId }), travelBack,
            travelAfter: page({ wikiSpaceId: "BOSSKB", pagePath: "Policies/Travel" }).backlinks.map((link) => link.pagePath) }
    },
    then({ first, saved, conflict, unchanged, forced, after, travelBack, travelAfter }) {
        saved.status == 200
        saved.json.versionName == "02"
        saved.json.messageInfos[0].message == "Saved as version 02"
        conflict.json.conflict
        conflict.json.conflictText == "John Doe saved this page since you opened it"
        unchanged.json.versionName == null
        unchanged.json.messageInfos[0].message == "No changes to save"
        forced.json.versionName == "03"
        after.text.includes("Second words")
        after.lastChange.note == "Second words"
        // the link of version 02 was indexed with it, and went with version 03
        travelBack.includes(`Office/Spec page ${RUN}`)
        !travelAfter.includes(`Office/Spec page ${RUN}`)
    },
})

feature("History lists the versions with their notes and authors; compare is the server's diff; restore writes an old one as the newest", {
    when() {
        const history = get("history", { wikiPageId: made.pageId })
        const diff = get("diff", { wikiPageId: made.pageId, fromVersionName: "02", toVersionName: "03" })
        const previous = get("diff", { wikiPageId: made.pageId, toVersionName: "02" })
        const restored = post("restoreVersion", { wikiPageId: made.pageId, versionName: "02" })
        return { history, diff, previous, restored, after: page({ wikiPageId: made.pageId }) }
    },
    then({ history, diff, previous, restored, after }) {
        history.status == 200
        history.json.versionList.map((version) => version.shortName) == ["03", "02", "01"]
        history.json.versionList.map((version) => version.note) == ["Second words", "First words", ""]
        history.json.versionList[0].userName == "John Doe"
        history.json.versionList[0].isCurrent
        history.json.canRestore
        history.json.canPublish
        history.json.storage == "db"
        diff.json.html.includes("moqui-diff")
        diff.json.stats.insertions >= 1
        diff.json.fromShort == "02"
        previous.json.fromShort == "01"
        restored.json.newVersionName == "04"
        after.text.includes("First words")
        after.lastChange.note == "Restored version 02"
    },
})

feature("publish marks the current version published; tags, a file, watching and a linked task show on the page", {
    when() {
        const published = post("publishVersion", { wikiPageId: made.pageId })
        const tagged = post("setTags", { wikiPageId: made.pageId, tags: "Spec, Office ,spec" })
        const uploaded = post("uploadAttachment", { wikiPageId: made.pageId, attachmentFile: [uploadedFile("plan.txt", "The plan"), uploadedFile("map.txt", "The map")] })
        const download = call_("Knowledge/attachment", { wikiPageId: made.pageId, filename: "plan.txt" }, null)
        const watched = post("followPage", { wikiPageId: made.pageId, follow: "true" })
        const linked = post("linkRecord", { wikiPageId: made.pageId, record: "mantle.work.effort.WorkEffort|BOSS_DEMO_TASK" })
        const view = page({ wikiPageId: made.pageId })
        const removed = post("deleteAttachment", { wikiPageId: made.pageId, filename: "map.txt" })
        const unlinked = post("unlinkRecord", { wikiPageId: made.pageId, recordEntityName: "mantle.work.effort.WorkEffort", recordId: "BOSS_DEMO_TASK" })
        return { published, tagged, uploaded, download, watched, linked, view, removed, unlinked, after: page({ wikiPageId: made.pageId }) }
    },
    then({ published, tagged, uploaded, download, watched, linked, view, removed, unlinked, after }) {
        published.json.publishedVersionName == "04"
        view.isPublished
        tagged.json.tagList == ["Office", "Spec"]
        view.tags == ["Office", "Spec"]
        uploaded.json.filenameList == ["plan.txt", "map.txt"]
        view.attachments.map((file) => file.filename) == ["map.txt", "plan.txt"]
        download.status == 200
        download.output.includes("The plan")
        watched.json.following
        view.following
        linked.errors == ""
        view.records.map((record) => record.recordId) == ["BOSS_DEMO_TASK"]
        removed.errors == ""
        after.attachments.map((file) => file.filename) == ["plan.txt"]
        after.records.length == 0
    },
})

feature("rename keeps the old path as an alias; a drop moves a page inside another and back", {
    when() {
        const renamed = post("renamePage", { wikiPageId: made.pageId, pageName: `Spec renamed ${RUN}` })
        const byOldPath = page({ wikiSpaceId: "BOSSKB", pagePath: `Office/Spec page ${RUN}` })
        const inside = post("dropPage", { wikiPageId: made.pageId, targetPagePath: "Onboarding", position: "inside" })
        const before = post("dropPage", { wikiPageId: made.pageId, targetPagePath: "Office/Wi-Fi and printers", position: "before" })
        const office = names(get("children", { wikiSpaceId: "BOSSKB", pagePath: "Office" }))
        const underItself = post("dropPage", { wikiPageId: pageId("BOSSKB", "Office"), targetPagePath: `Office/Spec renamed ${RUN}`, position: "inside" })
        return { renamed, byOldPath, inside, before, office, underItself }
    },
    then({ renamed, byOldPath, inside, before, office, underItself }) {
        renamed.json.pagePath == `Office/Spec renamed ${RUN}`
        byOldPath.wikiPageId == made.pageId
        byOldPath.pagePath == `Office/Spec renamed ${RUN}`
        inside.json.pagePath == `Onboarding/Spec renamed ${RUN}`
        before.json.pagePath == `Office/Spec renamed ${RUN}`
        office == [`Spec renamed ${RUN}`, "Wi-Fi and printers"]
        underItself.errors.includes("cannot move under itself")
    },
})

feature("Move takes a page to a git space and replays its history", {
    requires: ["git"],
    when() {
        const moved = post("movePage", { wikiPageId: made.pageId, toWikiSpaceId: "BOSSENG", toParentPath: "", versionNote: "To the engineering notes" })
        const there = page({ wikiPageId: made.pageId })
        const history = get("history", { wikiPageId: made.pageId })
        return { moved, there, history }
    },
    then({ moved, there, history }) {
        moved.json.wikiSpaceId == "BOSSENG"
        moved.json.replayed
        // the page's four versions and its file's one, a commit each
        moved.json.versionCount == 5
        there.wikiSpaceId == "BOSSENG"
        there.storage == "git"
        there.attachments.map((file) => file.filename) == ["plan.txt"]
        history.json.storage == "git"
        history.json.versionList.map((version) => version.note) == ["Restored version 02", "Second words", "First words", `Version 01`]
        history.json.versionList[0].noteMore.startsWith(`Moved from BOSSKB/Office/Spec renamed ${RUN}, version 04`)
        history.json.versionList[0].movedFrom == `BOSSKB/Office/Spec renamed ${RUN}`
        history.json.versionList.every((version) => version.versionName.length == 40 && version.userName == "John Doe")
    },
})

feature("delete takes a page with its files; a page with pages under it, or a space's home, is not deleted", {
    when() {
        const created = post("createPage", { wikiSpaceId: "BOSSKB", parentPath: "", pageName: `Spec delete ${RUN}` })
        post("uploadAttachment", { wikiPageId: created.json.wikiPageId, attachmentFile: uploadedFile("x.txt", "x") })
        const deleted = post("deletePage", { wikiPageId: created.json.wikiPageId })
        const withChildren = post("deletePage", { wikiPageId: pageId("BOSSKB", "Office") })
        const home = post("deletePage", { wikiPageId: pageId("BOSSKB", "") })
        return { deleted, withChildren, home, row: pageId("BOSSKB", `Spec delete ${RUN}`) }
    },
    then({ deleted, withChildren, home, row }) {
        deleted.errors == ""
        deleted.json.parentPath == ""
        row == null
        withChildren.errors.includes("has pages under it")
        home.errors.includes("not deleted")
    },
})

feature("search finds pages by their path or text in the spaces john.doe may read, never his notes", {
    when() {
        return { wifi: get("search", { text: "Wi-Fi" }), inSpace: get("search", { text: "Travel", wikiSpaceId: "BOSSKB" }), notes: get("search", { text: "Groceries" }) }
    },
    then({ wifi, inSpace, notes }) {
        wifi.status == 200
        wifi.json.pageList.some((hit) => hit.pagePath === "Office/Wi-Fi and printers")
        inSpace.json.pageList.every((hit) => hit.wikiSpaceId === "BOSSKB")
        inSpace.json.pageList.some((hit) => hit.pagePath === "Policies/Travel")
        // no note (the framework's Wiki spec may have put a Groceries page in a space of its own)
        !notes.json.pageList.some((hit) => hit.wikiSpaceId.startsWith("NOTES_"))
    },
})

feature("Joe Developer may not read the restricted page or the members-only space, in the tree, a page, search or backlinks", {
    when() {
        return as("joe.developer", () => ({ setup: get("setup"), policies: names(get("children", { wikiSpaceId: "BOSSKB", pagePath: "Policies" })),
            security: get("page", { wikiSpaceId: "BOSSKB", pagePath: "Policies/Security" }),
            lead: get("page", { wikiSpaceId: "BOSSLEAD", pagePath: "" }), leadTree: get("children", { wikiSpaceId: "BOSSLEAD", pagePath: "" }),
            search: get("search", { text: "Security" }),
            release: page({ wikiSpaceId: "BOSSKB", pagePath: "Release process" }) }))
    },
    then({ setup, policies, security, lead, leadTree, search, release }) {
        !setup.json.spaceList.some((space) => space.wikiSpaceId === "BOSSLEAD")
        setup.json.spaceList.some((space) => space.wikiSpaceId === "BOSSKB" && space.canUpdate && !space.canAdmin)
        policies == ["Expenses", "Travel"]
        security.errors.includes("Page not found")
        !security.output.includes("door codes")
        lead.errors.includes("Page not found")
        !leadTree.json.childList
        !search.json.pageList.some((hit) => hit.pagePath === "Policies/Security")
        // a reader of the page who is not its reviewer may not decide its review
        release.reviews.length == 1
        !release.reviews[0].canDecide
    },
})

feature("Bob Developer reads the handbook but may not change it nor add to it", {
    when() {
        const onboarding = pageId("BOSSKB", "Onboarding")
        return as("bob.developer", () => ({ view: page({ wikiPageId: onboarding }), save: post("savePage", { wikiPageId: onboarding, pageText: "Mine" }),
            create: post("createPage", { wikiSpaceId: "BOSSKB", pageName: "Bob page" }),
            security: page({ wikiSpaceId: "BOSSKB", pagePath: "Policies/Security" }) }))
    },
    then({ view, save, create, security }) {
        view.title == "Onboarding"
        !view.canUpdate
        save.errors.includes("You may not change this page")
        // update#WikiPage's refusal (each change of a page is refused by the one get#PageRef check)
        create.errors.includes("may not add pages")
        // Bob is named on the restricted page
        security.title == "Security"
    },
})

feature("Spaces: a new space on database files, settings, and members who then read it", {
    when() {
        const created = call_("Knowledge/Spaces/createSpace", { wikiSpaceId: `S${RUN}A`, description: `Spec space ${RUN}`, storage: "db", restrictView: "Y" }, "post")
        const mirror = as("joe.developer", () => call_("Knowledge/Spaces/createSpace", { wikiSpaceId: `S${RUN}M`, description: "Mirror", storage: "mirror",
            remoteUrl: "https://example.com/x.git" }, "post"))
        const member = call_("Knowledge/SpaceDetail/storeMember", { wikiSpaceId: `S${RUN}A`, userId: "ORG_ZIZI_BD", permission: "view" }, "post")
        const bobAfter = as("bob.developer", () => get("page", { wikiSpaceId: `S${RUN}A`, pagePath: "" }))
        const bobSettings = as("bob.developer", () => call_("Knowledge/SpaceDetail/updateSettings", { wikiSpaceId: `S${RUN}A`, description: "Bob's" }, "post"))
        const settings = call_("Knowledge/SpaceDetail/updateSettings", { wikiSpaceId: `S${RUN}A`, description: `Spec space ${RUN} renamed`,
            publicPageUrl: "https://help.example.com", restrictView: "Y", restrictUpdate: "Y" }, "post")
        const badUrl = call_("Knowledge/SpaceDetail/updateSettings", { wikiSpaceId: `S${RUN}A`, publicPageUrl: "javascript:alert(1)" }, "post")
        const lastAdmin = call_("Knowledge/SpaceDetail/removeMember", { wikiSpaceId: `S${RUN}A`, userId: "EX_JOHN_DOE" }, "post")
        const saved = post("savePage", { wikiSpaceId: `S${RUN}A`, pagePath: "", pageText: "# Spec space\n\nSecond version\n", versionNote: "Second" })
        const list = render("Knowledge/Spaces")
        const detail = render("Knowledge/SpaceDetail", { wikiSpaceId: "BOSSKB" })
        const joeDetail = as("joe.developer", () => render("Knowledge/SpaceDetail", { wikiSpaceId: `S${RUN}A` }))
        const space = sys(() => ec.entity.find("moqui.resource.wiki.WikiSpace").condition("wikiSpaceId", `S${RUN}A`).one())
        return { created, mirror, member, bobAfter, bobSettings, settings, badUrl, lastAdmin, saved, list, detail, joeDetail, space }
    },
    then({ created, mirror, member, bobAfter, bobSettings, settings, badUrl, lastAdmin, saved, list, detail, joeDetail, space }) {
        created.errors == ""
        mirror.errors.includes("Only an administrator adds a mirror")
        member.errors == ""
        bobAfter.json.page.title == `Spec space ${RUN}`
        bobSettings.errors.includes("Only an administrator of this space may do that")
        settings.errors == ""
        space.description == `Spec space ${RUN} renamed`
        space.publicPageUrl == "https://help.example.com"
        space.restrictUpdate == "Y"
        badUrl.errors.includes("A public URL starts with http")
        lastAdmin.errors.includes("A space keeps at least one administrator")
        // the automatic root page, the space's home page, this save
        saved.json.versionName == "03"
        list.status == 200
        list.output.includes(`Spec space ${RUN} renamed`)
        list.output.includes("Team handbook")
        detail.output.includes("Bob Developer")
        detail.output.includes("Policies/Security")
        detail.output.includes("Restrict a page")
        joeDetail.output.includes("This space is not available")
    },
})

feature("a git space and a clone of a database space keep their history", {
    requires: ["git"],
    when() {
        const git = call_("Knowledge/Spaces/createSpace", { wikiSpaceId: `S${RUN}G`, description: `Spec git ${RUN}`, storage: "gitdb" }, "post")
        const cloned = call_("Knowledge/Spaces/cloneSpace", { baseWikiSpaceId: `S${RUN}A`, wikiSpaceId: `S${RUN}C`, description: "Spec clone", storage: "gitdb",
            copyHistory: "Y" }, "post")
        const clonedHistory = get("history", { wikiSpaceId: `S${RUN}C`, pagePath: "" })
        return { git, cloned, clonedHistory, gitRoot: page({ wikiSpaceId: `S${RUN}G`, pagePath: "" }) }
    },
    then({ git, cloned, clonedHistory, gitRoot }) {
        git.errors == ""
        gitRoot.storage == "git"
        gitRoot.text.startsWith(`# Spec git ${RUN}`)
        cloned.errors == ""
        clonedHistory.json.storage == "git"
        clonedHistory.json.versionList.length == 3
    },
})

feature("restricting a page and naming who reads it, as an administrator of the space; Joe Developer then may not read it", {
    when() {
        const expenses = pageId("BOSSKB", "Policies/Expenses")
        const restricted = call_("Knowledge/SpaceDetail/restrictPage", { wikiSpaceId: "BOSSKB", pagePath: "Policies/Expenses", restrictView: "Y", restrictUpdate: "N" }, "post")
        const named = call_("Knowledge/SpaceDetail/storePageMember", { wikiSpaceId: "BOSSKB", wikiPageId: expenses, userId: "ORG_ZIZI_BD", permission: "view" }, "post")
        const joe = as("joe.developer", () => get("page", { wikiPageId: expenses }))
        const bob = as("bob.developer", () => page({ wikiPageId: expenses }))
        const opened = call_("Knowledge/SpaceDetail/restrictPage", { wikiSpaceId: "BOSSKB", wikiPageId: expenses, restrictView: "N", restrictUpdate: "N" }, "post")
        const joeAgain = as("joe.developer", () => page({ wikiPageId: expenses }))
        // restricting who edits needs no page member: the space's administrator edits any page they read
        const member = (id) => sys(() => ec.entity.find("moqui.resource.wiki.WikiPageUser").condition({ wikiPageId: id, userId: "EX_JOHN_DOE" }).one())
        const office = pageId("BOSSKB", "Office")
        const editOnly = call_("Knowledge/SpaceDetail/restrictPage", { wikiSpaceId: "BOSSKB", wikiPageId: office, restrictView: "N", restrictUpdate: "Y" }, "post")
        const editOnlyMember = member(office)
        const stillEdits = page({ wikiPageId: office }).canUpdate
        call_("Knowledge/SpaceDetail/restrictPage", { wikiSpaceId: "BOSSKB", wikiPageId: office, restrictView: "N", restrictUpdate: "N" }, "post")
        return { restricted, named, joe, bob, opened, joeAgain, viewMember: member(expenses), editOnly, editOnlyMember, stillEdits }
    },
    then({ restricted, named, joe, bob, opened, joeAgain, viewMember, editOnly, editOnlyMember, stillEdits }) {
        restricted.errors == ""
        named.errors == ""
        joe.errors.includes("Page not found")
        bob.title == "Expenses"
        opened.errors == ""
        joeAgain.title == "Expenses"
        viewMember.allowView == "Y"
        editOnly.errors == ""
        editOnlyMember == null
        stillEdits
    },
})

feature("the screens render: Knowledge as its component, and in it the review list and the spaces", {
    when() {
        const knowledge = ec.screen.makeTest().rootScreen(commons).renderMode("qvue").render("Knowledge", { lastStandalone: "-2" }, null)
        ec.message.clearErrors()
        return { knowledge: { status: knowledge.status, output: String(knowledge.output || "") }, review: render("Knowledge/Review"),
            requested: as("joe.developer", () => render("Knowledge/Review", { filter: "requested" })) }
    },
    then({ knowledge, review, requested }) {
        knowledge.status == 200
        knowledge.output.includes("module.exports")
        knowledge.output.includes("BossKnowledge")
        // the page is the framework's m-markdown, with the wiki's links resolved by the screen; no Marked of its own
        knowledge.output.includes('<m-markdown ref="body"')
        knowledge.output.includes(':resolve-link="resolveLink"')
        !knowledge.output.includes("marked.umd")
        review.status == 200
        review.output.includes("Release process")
        review.output.includes("Please check the new rollback steps")
        requested.output.includes("Release process")
    },
})

feature("Duplicate: a page with the pages under it, under a new name in the same space; refusals", {
    allowMessageErrors: true,
    when() {
        const policies = pageId("BOSSKB", "Policies")
        const office = pageId("BOSSKB", "Office")
        const tree = post("duplicatePage", { wikiPageId: policies, toWikiSpaceId: "BOSSKB", toParentPath: "Office", toPageName: `Policies copy ${RUN}`, withChildren: "true" })
        const base = `Office/Policies copy ${RUN}`
        const copied = names(get("children", { wikiSpaceId: "BOSSKB", pagePath: base }))
        const travel = page({ wikiSpaceId: "BOSSKB", pagePath: `${base}/Travel` })
        const travelSource = page({ wikiSpaceId: "BOSSKB", pagePath: "Policies/Travel" })
        const history = get("history", { wikiPageId: pageId("BOSSKB", `${base}/Travel`) })
        // Joe Developer may not read the restricted Security page, so his copy is without it
        const joe = as("joe.developer", () => ({
            tree: post("duplicatePage", { wikiPageId: policies, toParentPath: "Office", toPageName: `Joe policies ${RUN}`, withChildren: "true" }),
            restricted: post("duplicatePage", { wikiPageId: pageId("BOSSKB", "Policies/Security"), toPageName: `Joe security ${RUN}` }) }))
        const joeCopied = names(get("children", { wikiSpaceId: "BOSSKB", pagePath: `Office/Joe policies ${RUN}` }))
        return { tree, copied, travel, travelSource, history, joe, joeCopied,
            underItself: post("duplicatePage", { wikiPageId: policies, toParentPath: "Policies", toPageName: "Again", withChildren: "true" }),
            home: post("duplicatePage", { wikiPageId: pageId("BOSSKB", ""), toPageName: "Home copy" }),
            badName: post("duplicatePage", { wikiPageId: office, toPageName: "a/b" }) }
    },
    then({ tree, copied, travel, travelSource, history, joe, joeCopied, underItself, home, badName }) {
        tree.status == 200
        tree.errors == ""
        tree.json.pageCount == 4
        tree.json.failedPaths.length == 0
        tree.json.pagePath == `Office/Policies copy ${RUN}`
        copied == ["Expenses", "Security", "Travel"]
        travel.text == travelSource.text
        history.json.versionList.length == 1
        history.json.versionList[0].note.includes("Copied from BOSSKB/Policies/Travel")
        joe.tree.errors == ""
        joe.tree.json.pageCount == 3
        joeCopied == ["Expenses", "Travel"]
        joe.restricted.errors.includes("Page not found")
        underItself.errors.includes("not copied under itself")
        home.errors.includes("copied with its space")
        badName.errors.includes("A page name has")
    },
})

feature("a page copied into a git space keeps its file", {
    requires: ["git"],
    when() {
        const office = pageId("BOSSKB", "Office")
        const single = post("duplicatePage", { wikiPageId: office, toWikiSpaceId: "BOSSENG", toPageName: `Office copy ${RUN}` })
        const singleFile = call_("Knowledge/attachment", { wikiPageId: pageId("BOSSENG", `Office copy ${RUN}`), filename: "floor-plan.txt" }, null)
        return { single, singleFile }
    },
    then({ single, singleFile }) {
        single.errors == ""
        single.json.wikiSpaceId == "BOSSENG"
        singleFile.status == 200
        singleFile.output.includes("Floor plan of the office")
    },
})
