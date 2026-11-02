// Knowledge review (screen/Commons/Knowledge.xml and its subscreen Review, service/ironstone/commons/KnowledgeServices.xml over
// org.moqui.impl.WikiServices request, decide, cancel and find#WikiPageReviews; impl-drawers-commons.md M9, R23; design §10
// Review): a version asked for review from the page, decided from the tray's Notifications tab (approve publishes it, refuse
// asks for changes with the reason) or from the page and the Review list, cancelled by the one who asked; the requester told
// on WikiPageReviewDecision with a link that opens the page on its review. On the knowledge demo (data/BossKnowledgeDemoData.xml):
// joe.developer edits the Team handbook, bob.developer reads it, john.doe administers it. Every review this spec asks of
// john.doe is decided here, so his tray keeps the M2 demo's one approval for the specs after this one.
// Run: ./moq test mr-boss --spec KnowledgeReview
const commons = "component://mr-boss/screen/Commons.xml"
const NOTIFY = "org.moqui.impl.NotificationServices"

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
const pageRow = (id) => sys(() => ec.entity.find("moqui.resource.wiki.WikiPage").condition("wikiPageId", id).one())
const review = (id) => sys(() => ec.entity.find("moqui.resource.wiki.WikiPageReview").condition("wikiPageReviewId", id).one())
const approvals = () => Array.from(sys(() => call(`${NOTIFY}.get#UserNotifications`, { approvals: true })).notificationList || [])
const approvalFor = (reviewId) => approvals().find((row) => row.recordId === reviewId)
const decisions = () => Array.from(sys(() => call(`${NOTIFY}.get#UserNotifications`, { topic: "WikiPageReviewDecision" })).notificationList || [])
const save = (id, text, note) => post("savePage", { wikiPageId: id, pageText: text, versionNote: note || "" })
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const made = {}

spec({
    setupSpec() { login("john.doe") },
    cleanup() { login("john.doe") },
})

feature("the demo's review waits on john.doe in To do and on the page, and opens on its compare from the published version", {
    when() {
        const toDo = get("page", { wikiSpaceId: "BOSSKB", pagePath: "Release process" }).json.page.reviews
        const found = sys(() => call("ironstone.commons.KnowledgeServices.find#Reviews", { filter: "toDo" })).reviewList
        const demo = found.find((row) => row.wikiPageReviewId === "BOSS_DEMO_WPR_RELEASE")
        const diff = get("diff", { wikiPageId: demo.wikiPageId, fromVersionName: demo.baseVersionName, toVersionName: demo.versionName })
        return { toDo, demo, diff, list: render("Knowledge/Review") }
    },
    then({ toDo, demo, diff, list }) {
        toDo.map((row) => row.wikiPageReviewId) == ["BOSS_DEMO_WPR_RELEASE"]
        demo.canDecide
        demo.baseVersionName == "02"
        demo.versionName == "03"
        demo.requestedByName == "Joe Developer"
        demo.dueText.length > 0
        diff.json.fromShort == "02"
        diff.json.toShort == "03"
        diff.json.stats.insertions >= 2
        diff.json.html.includes("Watch the error log")
        list.status == 200
        list.output.includes("Release process")
        list.output.includes("To do")
    },
})

feature("joe.developer asks bob.developer to review a version; Bob approves it from the tray, which publishes it; Joe is told with a link to the page's review", {
    when() {
        made.travel = pageId("BOSSKB", "Policies/Travel")
        const requested = as("joe.developer", () => {
            save(made.travel, "# Travel\n\nTake the train when it is under four hours. Book flights a month ahead.\n", "Book flights ahead")
            return post("requestReview", { wikiPageId: made.travel, reviewerUserIds: "ORG_ZIZI_BD", dueDate: today(), note: "Check the booking rule" })
        })
        made.travelReview = requested.json.wikiPageReviewId
        const bob = as("bob.developer", () => {
            const toDo = sys(() => call("ironstone.commons.KnowledgeServices.find#Reviews", { filter: "toDo" })).reviewList
            const tray = approvalFor(made.travelReview)
            const approved = call_("Panel/Notifications/approve", { notificationMessageId: tray.notificationMessageId }, "post")
            return { toDo, tray, approved, after: approvalFor(made.travelReview) }
        })
        const joe = as("joe.developer", () => {
            const told = decisions().find((row) => row.recordId === made.travelReview)
            const rows = sys(() => call("ironstone.commons.CommonsServices.decorate#Notifications", { notificationList: [told] })).rows
            return { told, row: rows[0] }
        })
        return { requested, bob, joe, review: review(made.travelReview), page: pageRow(made.travel) }
    },
    then({ requested, bob, joe, review, page }) {
        requested.errors == ""
        requested.json.messageInfos[0].message == "Review requested"
        bob.toDo.some((row) => row.wikiPageReviewId === made.travelReview && row.canDecide && row.pageName === "Travel")
        bob.tray.canApprove
        bob.tray.refuseReasonRequired
        bob.tray.titleText == "Joe Developer asked you to review Travel"
        bob.tray.linkText == `/qapps/Commons/Knowledge?wikiPageId=${made.travel}&review=open`
        bob.approved.errors == ""
        bob.after == null
        review.statusId == "WprApproved"
        review.decidedByUserId == "ORG_ZIZI_BD"
        page.publishedVersionName == review.versionName
        joe.told.titleText == "Bob Developer approved Travel"
        joe.row.openUrl == `/qapps/Commons/Knowledge?wikiPageId=${made.travel}&review=${made.travelReview}`
    },
})

feature("joe.developer asks john.doe; John refuses from the tray with what to change; Joe is told, and John's tray is back to the demo's one approval", {
    when() {
        const onboarding = pageId("BOSSKB", "Onboarding")
        const before = approvals().length
        const requested = as("joe.developer", () => post("requestReview", { wikiPageId: onboarding, reviewerUserIds: "EX_JOHN_DOE", note: "Please read" }))
        const waiting = approvals().length
        const tray = approvalFor(requested.json.wikiPageReviewId)
        const noReason = call_("Panel/Notifications/refuse", { notificationMessageId: tray.notificationMessageId }, "post")
        const refused = call_("Panel/Notifications/refuse", { notificationMessageId: tray.notificationMessageId, reason: "Add the Wi-Fi network" }, "post")
        const told = as("joe.developer", () => decisions().find((row) => row.recordId === requested.json.wikiPageReviewId))
        return { before, waiting, after: approvals().length, noReason, refused, told, review: review(requested.json.wikiPageReviewId) }
    },
    then({ before, waiting, after, noReason, refused, told, review }) {
        waiting == before + 1
        noReason.errors.length > 0
        refused.errors == ""
        after == before
        review.statusId == "WprChangesRequested"
        review.decisionNote == "Add the Wi-Fi network"
        told.titleText == "John Doe asked for changes to Onboarding"
        told.message.decisionNote == "Add the Wi-Fi network"
    },
})

feature("on the page: the review is the reviewer's to decide, and a note is not reviewed", {
    when() {
        const expenses = pageId("BOSSKB", "Policies/Expenses")
        const requested = as("joe.developer", () => post("requestReview", { wikiPageId: expenses, reviewerUserIds: "ORG_ZIZI_BD" }))
        const id = requested.json.wikiPageReviewId
        const notMine = as("joe.developer", () => post("decideReview", { wikiPageReviewId: id, decision: "approve" }))
        const bob = as("bob.developer", () => ({ view: get("page", { wikiPageId: expenses }).json.page,
            changes: post("decideReview", { wikiPageReviewId: id, decision: "changes", decisionNote: "Say which meals count" }) }))
        const note = as("joe.developer", () => post("requestReview", { wikiPageId: pageId("NOTES_ORG_ZIZI_JD", "Conference talk draft") }))
        return { requested, notMine, bob, note, review: review(id), page: pageRow(expenses) }
    },
    then({ requested, notMine, bob, note, review, page }) {
        requested.errors == ""
        notMine.errors.includes("This review is not yours to decide")
        bob.view.reviews.length == 1
        bob.view.reviews[0].canDecide
        bob.changes.errors == ""
        bob.changes.json.messageInfos[0].message == "Changes requested"
        review.statusId == "WprChangesRequested"
        page.publishedVersionName == null
        // a note is not reviewed
        note.errors.includes("A note is not reviewed")
    },
})

feature("the one who asked cancels; a review for anyone who may edit goes to the space's administrators; the Review list by filter and status", {
    when() {
        const policies = pageId("BOSSKB", "Policies")
        const asked = as("joe.developer", () => post("requestReview", { wikiPageId: policies, reviewerUserIds: "ORG_ZIZI_BD", note: "A first look" }))
        const bobTray = as("bob.developer", () => approvalFor(asked.json.wikiPageReviewId) != null)
        const bobCancel = as("bob.developer", () => post("cancelReview", { wikiPageReviewId: asked.json.wikiPageReviewId }))
        const cancelled = as("joe.developer", () => call_("Knowledge/Review/cancelReview", { wikiPageReviewId: asked.json.wikiPageReviewId, filter: "requested" }, "post"))
        const bobTrayAfter = as("bob.developer", () => approvalFor(asked.json.wikiPageReviewId) != null)
        // for anyone: the space's administrator (john.doe) is told, and decides it; a reader may not
        const anyone = as("joe.developer", () => post("requestReview", { wikiPageId: pageId("BOSSKB", "Office") }))
        const johnTray = approvalFor(anyone.json.wikiPageReviewId) != null
        const bobView = as("bob.developer", () => get("page", { wikiPageId: pageId("BOSSKB", "Office") }).json.page.reviews)
        const approved = call_("Knowledge/Review/decideReview", { wikiPageReviewId: anyone.json.wikiPageReviewId, decision: "approve", filter: "toDo" }, "post")
        const johnTrayAfter = approvalFor(anyone.json.wikiPageReviewId) != null
        const requestedList = as("joe.developer", () => render("Knowledge/Review", { filter: "requested", status: "any" }))
        const openList = as("joe.developer", () => render("Knowledge/Review", { filter: "requested" }))
        return { asked, bobTray, bobCancel, cancelled, bobTrayAfter, anyone, johnTray, bobView, approved, johnTrayAfter, requestedList, openList,
            cancelledReview: review(asked.json.wikiPageReviewId), anyoneReview: review(anyone.json.wikiPageReviewId), office: pageRow(pageId("BOSSKB", "Office")) }
    },
    then({ asked, bobTray, bobCancel, cancelled, bobTrayAfter, anyone, johnTray, bobView, approved, johnTrayAfter, requestedList, openList, cancelledReview,
            anyoneReview, office }) {
        asked.errors == ""
        bobTray
        bobCancel.errors.includes("Only the one who asked for a review cancels it")
        cancelled.errors == ""
        cancelledReview.statusId == "WprCancelled"
        !bobTrayAfter
        anyone.errors == ""
        anyoneReview.reviewerUserId == null
        johnTray
        bobView.length == 1
        !bobView[0].canDecide
        approved.errors == ""
        anyoneReview.statusId == "WprApproved"
        office.publishedVersionName != null
        !johnTrayAfter
        requestedList.status == 200
        requestedList.output.includes("Cancelled")
        requestedList.output.includes("Changes Requested")
        requestedList.output.includes("Approved")
        requestedList.output.includes("Release process")
        !openList.output.includes("Cancelled")
        openList.output.includes("Release process")
    },
})
