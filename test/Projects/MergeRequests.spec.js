// Merge requests and review in IronStone Projects (screen/Projects/Code/MergeRequests.xml, MergeRequestDetail with Overview,
// Commits and Changes (a .qvue with ChangesTui), RepositoryDetail's Merge requests tab, the Development tab of WorkItemDetail and
// Home's reviews waiting; service/ironstone/projects/CodeServices.xml; design-projects.md §7, §5, §3; impl-projects.md P3b2) on the code
// demo (service/ironstone/projects/CodeDemoServices.xml: !1 of iron, IRON-3-expand-collapse into main by joe.developer, john.doe asked to
// review; IRON-7-timer with a failed check): the list by chip and by who may view what, the detail and its tabs, the review
// threads (a line comment, a reply, resolve and reopen), a review, reviewers added and removed, work items linked and unlinked,
// the draft and close moves, the Development tab with a branch made for a work item, and Home. The usable-when walk of P3b is
// CodeReviewWalk.spec.js. Authorization stays on. The spec puts the demo's !1 back as it found it.
// Run: ./moq test mr-boss --spec MergeRequests
const webroot = "component://webroot/screen/webroot.xml"

function render(path, parameters, mode, standalone) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: standalone || "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, redirect: String(str.header("Location") || "") }
}
function json(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, method || null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), json: parsed, output }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
function settle() {
    const started = Date.now()
    while (Date.now() - started < 20000) {
        const busy = sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", "acme-portal"])
                .condition("ecaStatus", "in", ["pending", "running"]).count())
        if (busy == 0) return
        sys(() => call("org.moqui.impl.GitServices.process#PendingGitUpdates", {}))
    }
}
const demoMr = () => sys(() => ec.entity.find("moqui.resource.GitMergeRequest").condition({ repositoryId: "iron", mergeRequestNum: 1 }).one())
let mrId, mrBefore, reviewersBefore, commentsBefore
const mrComments = () => sys(() => Array.from(ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition({ recordEntityName: "moqui.resource.GitMergeRequest",
    recordId: mrId }).list()).map((row) => row.communicationEventId))

spec({
    requires: ["git"],
    setupSpec() {
        login("john.doe")
        sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", "acme-portal"]).condition("ecaStatus", "running")
                .updateAll({ ecaStatus: "pending" }))
        settle()
        const mr = demoMr()
        mrId = mr.mergeRequestId
        mrBefore = mr.getMap()
        reviewersBefore = sys(() => Array.from(ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition("mergeRequestId", mrId).list()).map((row) => row.getMap()))
        commentsBefore = mrComments()
    },
    setup() { if (ec.user.username != "john.doe") throw new Error("the git update events left the user " + ec.user.username) },
    cleanupSpec() {
        sys(() => {
            // !1 as the demo has it: its fields, its reviewers, the demo's review thread and none of the spec's
            const mr = ec.entity.find("moqui.resource.GitMergeRequest").condition("mergeRequestId", mrId).one()
            for (const field of ["statusId", "title", "description", "closedDate", "lastUpdatedDate", "mergeableEnumId"]) mr.set(field, mrBefore[field] ?? null)
            mr.update()
            ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition("mergeRequestId", mrId).deleteAll()
            for (const row of reviewersBefore) { const value = ec.entity.makeValue("moqui.resource.GitMergeRequestReviewer"); value.setFields(row, true, null, null); value.create() }
            const commIds = mrComments().filter((id) => !commentsBefore.includes(id))
            if (commIds.length) {
                const replies = Array.from(ec.entity.find("mantle.party.communication.CommunicationEvent").condition("rootCommEventId", "in", commIds).list())
                        .map((row) => row.communicationEventId).filter((id) => !commIds.includes(id))
                ec.entity.find("mantle.party.communication.CommunicationEventGitAnchor").condition("communicationEventId", "in", commIds).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition("communicationEventId", "in", commIds).deleteAll()
                for (const id of replies.concat(commIds)) {
                    ec.entity.find("mantle.party.communication.CommunicationEventContent").condition("communicationEventId", id).deleteAll()
                    ec.entity.find("mantle.party.communication.CommunicationEventParty").condition("communicationEventId", id).deleteAll()
                    ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", id).deleteAll()
                }
            }
            ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition({ mergeRequestId: mrId, linkSourceEnumId: "WglsExplicit" }).deleteAll()
            for (const name of Array.from(call("org.moqui.impl.GitServices.get#GitRefs", { repositoryId: "iron", refType: "branch" }).refList).map((ref) => ref.shortName)
                    .filter((name) => name.includes("-mr-spec"))) {
                ec.service.sync().name("org.moqui.impl.GitServices.delete#GitRef").parameters({ repositoryId: "iron", refName: name, refType: "branch" }).call()
                ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition("repositoryId", "iron").condition("refName", "refs/heads/" + name).deleteAll()
            }
            ec.message.clearErrors()
        })
        settle()
    },
})

feature("MergeRequests: the waiting chip first for john.doe, the chips' counts, the find, and RepositoryDetail's tab with the repository fixed", {
    when() {
        const john = sys(() => call("ironstone.projects.CodeServices.find#MergeRequests", {}))
        const page = render("apps/Projects/Code/MergeRequests")
        const open = render("apps/Projects/Code/MergeRequests", { list: "open" })
        const found = render("apps/Projects/Code/MergeRequests", { list: "all", text: "collapse" })
        const none = render("apps/Projects/Code/MergeRequests", { list: "all", text: "nothing like this" })
        const tab = render("apps/Projects/Code/RepositoryDetail/MergeRequests", { repositoryId: "iron", list: "all" })
        const acmeTab = render("apps/Projects/Code/RepositoryDetail/MergeRequests", { repositoryId: "acme-portal", list: "all" })
        const joe = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.find#MergeRequests", {})))
        const bobAcme = as("bob.developer", () => sys(() => call("ironstone.projects.CodeServices.find#MergeRequests", { list: "all", repositoryId: "acme-portal" })))
        return { john, page, open, found, none, tab, acmeTab, joe, bobAcme }
    },
    then({ john, page, open, found, none, tab, acmeTab, joe, bobAcme }) {
        john.list == "waiting"
        john.counts.waiting >= 1
        john.rowList[0].numText == "!1"
        john.rowList[0].checkLabel == "Passed"
        john.rowList[0].itemsText.includes("IRON-3")
        john.rowList[0].reviewersText.includes("Review requested")
        for (const one of [page, open, found, none, tab, acmeTab]) {
            assert(one.status == 200, one.errors)
            assert(!one.broken, one.output.substring(0, 400))
            assert(one.errors == "", one.errors)
        }
        page.output.includes("Waiting for my review · 1")
        page.output.includes("Expand and collapse rows (IRON-3)")
        page.output.includes("IRON-3-expand-collapse → main")
        open.output.includes("Expand and collapse rows (IRON-3)")
        found.output.includes("Expand and collapse rows (IRON-3)")
        none.output.includes("No merge requests match")
        tab.output.includes("Expand and collapse rows (IRON-3)")
        !acmeTab.output.includes("Expand and collapse rows (IRON-3)")
        // joe wrote it: nothing waits for him, Mine has it
        joe.list == "open"
        joe.counts.mine >= 1
        // bob is not on ACME: nothing of acme-portal
        bobAcme.rowList.length == 0
    },
})

feature("MergeRequestDetail: the header, Overview with the merge box, Commits and Changes; a merge request the user may not view is not available", {
    when() {
        const header = render("apps/Projects/Code/MergeRequestDetail", { mergeRequestId: mrId }, "qvt", "2")
        const overview = render("apps/Projects/Code/MergeRequestDetail/Overview", { mergeRequestId: mrId })
        const commits = render("apps/Projects/Code/MergeRequestDetail/Commits", { mergeRequestId: mrId })
        const changes = render("apps/Projects/Code/MergeRequestDetail/Changes", { mergeRequestId: mrId }, "qvue")
        const changesJson = json("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: mrId })
        const tui = render("apps/Projects/Code/MergeRequestDetail/ChangesTui", { mergeRequestId: mrId })
        const joeHeader = as("joe.developer", () => render("apps/Projects/Code/MergeRequestDetail", { mergeRequestId: mrId }, "qvt", "2"))
        const missing = render("apps/Projects/Code/MergeRequestDetail", { mergeRequestId: "NO_SUCH_MR" }, "qvt", "2")
        return { header, overview, commits, changes, changesJson, tui, joeHeader, missing }
    },
    then({ header, overview, commits, changes, changesJson, tui, joeHeader, missing }) {
        for (const one of [header, overview, commits, changes, tui, joeHeader, missing]) {
            assert(one.status == 200, one.errors)
            assert(!one.broken, one.output.substring(0, 400))
        }
        header.output.includes("Expand and collapse rows (IRON-3)")
        header.output.includes("MergeRequestStatusBar")
        header.output.includes("IRON-3-expand-collapse")
        // john is the requested reviewer: Review is his primary action
        header.output.includes("review=true")
        overview.output.includes("ci/build")
        overview.output.includes("0 of 1 approvals")
        overview.output.includes("Able to merge")
        overview.output.includes("IRON-3")
        overview.output.includes("Completes on merge")
        overview.output.includes("MergeRequestChatter")
        commits.output.includes("IRON-3 Left and right arrows close and open a row")
        commits.output.includes("IRON-3 Remember the expanded rows")
        changes.output.includes("module.exports")
        changesJson.json.changes.fileList.map((file) => file.path).includes("src/tree.js")
        changesJson.json.changes.fileList.find((file) => file.path == "src/keys.js").hunkList[0].lineList[0].tag == "insert"
        changesJson.json.changes.canComment == true
        tui.output.includes("src/keys.js")
        // joe is the author: he may edit it, and merges once approved
        joeHeader.output.includes("EditMergeRequest")
        !joeHeader.output.includes("review=true")
        missing.output.includes("is not available")
    },
})

feature("review threads: john comments on a line of src/tree.js, joe replies, john resolves and reopens the thread; the comment is in Chatter", {
    when() {
        const commented = json("Code/MergeRequestDetail/Changes/comment", { mergeRequestId: mrId, body: "Should this key be **per project**?",
            path: "src/tree.js", newLine: 7, lineText: "const expanded = new Set(JSON.parse(localStorage.getItem('tree.expanded') || '[]'))" }, "post")
        const threadId = commented.json?.communicationEventId
        const replied = as("joe.developer", () => json("Code/MergeRequestDetail/Changes/comment", { mergeRequestId: mrId, body: "Good point: it is now.",
            parentCommEventId: threadId }, "post"))
        const resolved = json("Code/MergeRequestDetail/Changes/resolveThread", { mergeRequestId: mrId, communicationEventId: threadId, resolved: "true" }, "post")
        const afterResolve = json("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: mrId }).json?.changes
        const reopened = json("Code/MergeRequestDetail/Changes/resolveThread", { mergeRequestId: mrId, communicationEventId: threadId, resolved: "false" }, "post")
        const afterReopen = json("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: mrId }).json?.changes
        const bobComment = as("bob.developer", () => json("Code/MergeRequestDetail/Changes/comment", { mergeRequestId: mrId, body: "bob was here" }, "post"))
        const timeline = sys(() => call("ironstone.shared.ChatterServices.get#Timeline", { recordEntityName: "moqui.resource.GitMergeRequest", recordId: mrId }))
        const list = sys(() => call("ironstone.projects.CodeServices.find#MergeRequests", { list: "all", repositoryId: "iron" }))
        return { commented, threadId, replied, resolved, afterResolve, reopened, afterReopen, bobComment, timeline, list }
    },
    then({ commented, threadId, replied, resolved, afterResolve, reopened, afterReopen, bobComment, timeline, list }) {
        commented.errors == ""
        threadId != null
        replied.errors == ""
        replied.json.communicationEventId != null
        resolved.json.resolved == true
        afterResolve.threadList.find((thread) => thread.communicationEventId == threadId).resolved == true
        afterResolve.threadList.find((thread) => thread.communicationEventId == threadId).commentList.length == 2
        afterResolve.threadList.find((thread) => thread.communicationEventId == threadId).newLine == 7
        reopened.json.resolved == false
        afterReopen.threadList.find((thread) => thread.communicationEventId == threadId).resolved == false
        bobComment.json?.communicationEventId != null
        timeline.entryList.some((entry) => String(entry.title || "").includes("src/tree.js:7") || String(entry.bodyHtml || "").includes("per project"))
        list.rowList.find((row) => row.mergeRequestId == mrId).commentCount >= 3
    },
})

feature("reviewers and the review: john asks bob, removes him; joe may not approve his own; john requests changes, then approves", {
    when() {
        const added = post("Code/MergeRequestDetail/addReviewers", { mergeRequestId: mrId, addUserIds: "ORG_ZIZI_BD" })
        const withBob = sys(() => ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition({ mergeRequestId: mrId, userId: "ORG_ZIZI_BD" }).one())
        const removed = post("Code/MergeRequestDetail/Overview/removeReviewer", { mergeRequestId: mrId, removeUserId: "ORG_ZIZI_BD" })
        const withoutBob = sys(() => ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition({ mergeRequestId: mrId, userId: "ORG_ZIZI_BD" }).count())
        const ownApproval = as("joe.developer", () => json("Code/MergeRequestDetail/Changes/submitReview", { mergeRequestId: mrId, decision: "approve" }, "post"))
        const changes = json("Code/MergeRequestDetail/Changes/submitReview", { mergeRequestId: mrId, decision: "request_changes", note: "One question on the key" }, "post")
        const afterChanges = sys(() => call("ironstone.projects.CodeServices.find#MergeRequests", {}))
        const approved = post("Code/MergeRequestDetail/submitReview", { mergeRequestId: mrId, decision: "approve", note: "Looks good" })
        const overview = render("apps/Projects/Code/MergeRequestDetail/Overview", { mergeRequestId: mrId })
        const joeHeader = as("joe.developer", () => render("apps/Projects/Code/MergeRequestDetail", { mergeRequestId: mrId }, "qvt", "2"))
        return { added, withBob, removed, withoutBob, ownApproval, changes, afterChanges, approved, overview, joeHeader }
    },
    then({ added, withBob, removed, withoutBob, ownApproval, changes, afterChanges, approved, overview, joeHeader }) {
        added.errors == ""
        withBob != null
        withBob.statusId == "GmrrRequested"
        removed.errors == ""
        withoutBob == 0
        ownApproval.errors.includes("own")
        changes.json.statusId == "GmrrChangesRequested"
        // reviewed: no longer waiting for john
        afterChanges.counts.waiting == 0
        approved.errors == ""
        overview.output.includes("1 of 1 approvals")
        overview.output.includes("Looks good")
        // approved, checks passed, mergeable: Merge is joe's primary action
        joeHeader.output.includes("MergeHeader")
    },
})

feature("work items linked and unlinked by hand; Edit; Mark as draft and ready; Close and Reopen", {
    when() {
        const linked = post("Code/MergeRequestDetail/Overview/linkItem", { mergeRequestId: mrId, workEffortId: "IRON-10", completeOnMerge: "Y" })
        const link = sys(() => ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition({ mergeRequestId: mrId, workEffortId: "IRON-10" }).one())
        const unlinked = post("Code/MergeRequestDetail/Overview/unlinkItem", { mergeRequestId: mrId, workEffortId: "IRON-10" })
        const edited = post("Code/MergeRequestDetail/editMergeRequest", { mergeRequestId: mrId, title: "Expand and collapse rows, remembered (IRON-3)",
            description: mrBefore.description, targetRef: "main" })
        const draft = post("Code/MergeRequestDetail/markReady", { mergeRequestId: mrId, draft: "Y" })
        const asDraft = demoMr().statusId
        const ready = post("Code/MergeRequestDetail/markReady", { mergeRequestId: mrId, draft: "N" })
        const closed = post("Code/MergeRequestDetail/closeMergeRequest", { mergeRequestId: mrId, reopen: "N" })
        const asClosed = demoMr().statusId
        const closedHeader = render("apps/Projects/Code/MergeRequestDetail", { mergeRequestId: mrId }, "qvt", "2")
        const closedOverview = render("apps/Projects/Code/MergeRequestDetail/Overview", { mergeRequestId: mrId })
        const closedComment = json("Code/MergeRequestDetail/Changes/comment", { mergeRequestId: mrId, body: "late", path: "src/keys.js", newLine: 1 }, "post")
        const reopened = post("Code/MergeRequestDetail/closeMergeRequest", { mergeRequestId: mrId, reopen: "Y" })
        return { linked, link, unlinked, edited, draft, asDraft, ready, closed, asClosed, closedHeader, closedOverview, closedComment, reopened, after: demoMr() }
    },
    then({ linked, link, unlinked, edited, draft, asDraft, ready, closed, asClosed, closedHeader, closedOverview, closedComment, reopened, after }) {
        linked.errors == ""
        link != null
        link.completeOnMerge == "Y"
        unlinked.errors == ""
        edited.errors == ""
        draft.errors == ""
        asDraft == "GmrDraft"
        ready.errors == ""
        closed.errors == ""
        asClosed == "GmrClosed"
        closedHeader.output.includes("Reopen")
        closedOverview.output.includes("Closed without merging")
        closedComment.errors.includes("closed")
        reopened.errors == ""
        after.statusId == "GmrOpen"
        after.title == "Expand and collapse rows, remembered (IRON-3)"
    },
})

feature("WorkItemDetail's Development tab: IRON-3's branch, merge request and commits; a branch made for IRON-10 by its pattern", {
    when() {
        const iron3 = render("apps/Projects/WorkItems/WorkItemDetail", { workEffortId: "IRON-3", tab: "development" })
        const overview = render("apps/Projects/WorkItems/WorkItemDetail", { workEffortId: "IRON-3" })
        const dev = sys(() => call("ironstone.projects.CodeServices.get#WorkItemDevelopment", { workEffortId: "IRON-3" }).development)
        const made = post("WorkItems/WorkItemDetail/createBranch", { workEffortId: "IRON-10", repositoryId: "iron", branchName: "IRON-10-mr-spec" })
        settle()
        const iron10 = sys(() => call("ironstone.projects.CodeServices.get#WorkItemDevelopment", { workEffortId: "IRON-10" }).development)
        const page10 = render("apps/Projects/WorkItems/WorkItemDetail", { workEffortId: "IRON-10", tab: "development" })
        const otherRepo = post("WorkItems/WorkItemDetail/createBranch", { workEffortId: "IRON-10", repositoryId: "acme-portal", branchName: "IRON-10-mr-spec-2" })
        const commons = render("apps/Commons/Tasks/TaskDetail", { workEffortId: "IRON-3", tab: "development" })
        return { iron3, overview, dev, made, iron10, page10, otherRepo, commons }
    },
    then({ iron3, overview, dev, made, iron10, page10, otherRepo, commons }) {
        for (const one of [iron3, overview, page10, commons]) {
            assert(one.status == 200, one.errors)
            assert(!one.broken, one.output.substring(0, 400))
        }
        dev.shown == true
        dev.branchList.map((row) => row.name).includes("IRON-3-expand-collapse")
        dev.branchList.find((row) => row.name == "IRON-3-expand-collapse").aheadBy == 2
        dev.mergeRequestList[0].numText == "!1"
        dev.commitList.some((row) => row.summary.includes("IRON-3"))
        iron3.output.includes("WorkItemBranches")
        iron3.output.includes("!1 ")
        overview.output.includes('data-tab="development"')
        made.errors == ""
        iron10.branchList.map((row) => row.name).includes("IRON-10-mr-spec")
        page10.output.includes("IRON-10-mr-spec")
        otherRepo.errors.includes("not one of the project")
        // Commons has no Development tab
        !commons.output.includes("WorkItemBranches")
    },
})

feature("Projects Home: john.doe's reviews waiting, as a counter and a block", {
    when() {
        // ask john again, as a push that dismissed his approval would
        sys(() => ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition({ mergeRequestId: mrId, userId: "EX_JOHN_DOE" }).updateAll({ statusId: "GmrrRequested" }))
        const home = render("apps/Projects/Home")
        const counts = sys(() => call("mantle.work.ProjectServices.get#ProjectHomeCounts", {}).counts)
        const bob = as("bob.developer", () => render("apps/Projects/Home"))
        return { home, counts, bob }
    },
    then({ home, counts, bob }) {
        home.status == 200
        !home.broken
        counts.reviewsWaiting >= 1
        home.output.includes("Reviews waiting on me")
        home.output.includes("ReviewsWaitingList")
        home.output.includes("Expand and collapse rows")
        bob.output.includes("No review is waiting for you")
    },
})
