// The usable-when walk of IronStone Projects P5 (impl-projects.md P5; design-projects.md §6) through the screens' transitions,
// with authorization on: a request arrives at IRON by email (a message to support+iron@ziziwork.example in the Support account,
// whose rule's createRequest action files it, as the mail sync runs the rules) and one from IRON's public form (/r/<token>, a
// visitor with no session user); john.doe, IRON's triage assignee, finds both in To review on the project's Requests tab and in
// Assigned to me; he triages them (accepts, assigns, sets the priority), makes a work item from each, and when joe.developer completes
// the items on WorkItemDetail the requests are Completed, Fixed for the bug and Completed for the feature; a reply to the email
// joins its request's conversation.
// Run: ./moq test mr-boss --spec RequestWalk
const webroot = "component://webroot/screen/webroot.xml"
const intakePage = "component://mr-boss/screen/RequestIntake.xml"
const TOKEN = "BossDemoIronIntakeForm1"
const SUPPORT = "BOSS_DEMO_MAIL_SUPPORT"
const walk = {}

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
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
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const all = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const byName = (name) => all("mantle.request.Request", { requestName: name })[0] || null
const request = (id) => one("mantle.request.Request", { requestId: id })
const stamp = Date.now()
// a message the sync stores in the Support Inbox, then the account's rules, as the sync runs them (authorization off)
function arrive(id, fields) {
    sys(() => {
        call("store#moqui.basic.email.EmailMessage", Object.assign({ emailMessageId: id, emailAccountId: SUPPORT, emailFolderId: "BOSS_DEMO_MAIL_S_INBOX",
            statusId: "ES_RECEIVED", contentType: "text/plain", messageDate: ec.user.nowTimestamp, receivedDate: ec.user.nowTimestamp, isRead: "N",
            hasAttachment: "N", rootEmailMessageId: id, messageId: `<${id}-${stamp}@walk.example>` }, fields))
        call("org.moqui.impl.EmailClientServices.run#EmailRules", { emailAccountId: SUPPORT, emailMessageIdList: [id] })
    })
    return one("moqui.basic.email.EmailMessage", { emailMessageId: id })
}

spec({
    stepwise: true,
    setupSpec() { login("john.doe") },
})

feature("a request arrives by email to IRON's address and one from IRON's public form", {
    when() {
        const message = arrive("BOSS_WALK_MAIL_1", { fromAddress: "walker.wren@acme.example", fromName: "Walker Wren", toAddresses: "Support <support+iron@ziziwork.example>",
            subject: "BOSS_WALK The CSV import skips the last row", bodyText: "Import a file with three rows and only two arrive." })
        walk.message = message
        logout()
        let form
        try {
            form = ec.screen.makeTest().rootScreen(intakePage).render("submit", { token: TOKEN, firstName: "Fiona", lastName: "Form",
                emailAddress: "fiona.form@example.org", requestTypeEnumId: "RqtNewFeature", requestName: "BOSS_WALK Show the sprint goal on the board",
                description: "The board could show the sprint's goal above the columns." }, "post")
        } finally { login("john.doe") }
        const email = byName("BOSS_WALK The CSV import skips the last row")
        const fromForm = byName("BOSS_WALK Show the sprint goal on the board")
        walk.email = email?.requestId
        walk.form = fromForm?.requestId
        return { email, fromForm, formJson: JSON.parse(String(form.output || "{}")) }
    },
    then({ email, fromForm, formJson }) {
        email.rootWorkEffortId == "IRON"
        email.statusId == "ReqSubmitted"
        email.salesChannelEnumId == "ScEmail"
        email.requestTypeEnumId == "RqtBugFix"
        fromForm.rootWorkEffortId == "IRON"
        fromForm.statusId == "ReqSubmitted"
        fromForm.salesChannelEnumId == "ScWeb"
        formJson.requestId == fromForm.requestId
    },
})

feature("john.doe, IRON's triage assignee, finds both to review on the project's Requests tab", {
    when() {
        return { tab: render("apps/Projects/Projects/ProjectDetail/Requests", { workEffortId: "IRON", list: "review" }),
            assigned: render("apps/Projects/Requests", { list: "assigned" }) }
    },
    then({ tab, assigned }) {
        tab.errors == ""
        tab.output.includes("BOSS_WALK The CSV import skips the last row")
        tab.output.includes("BOSS_WALK Show the sprint goal on the board")
        assigned.output.includes("BOSS_WALK The CSV import skips the last row")
    },
})

feature("he triages them: accepts both, gives the bug to Joe Developer at priority 2", {
    when() {
        const acceptBug = post("Requests/RequestDetail/changeStatus", { requestId: walk.email, toStatusId: "ReqReviewed" })
        const acceptFeature = post("Requests/RequestDetail/changeStatus", { requestId: walk.form, toStatusId: "ReqReviewed" })
        const assign = post("Requests/RequestDetail/triage", { requestId: walk.email, triageAction: "assign", value: "ORG_ZIZI_JD" })
        const priority = post("Requests/RequestDetail/triage", { requestId: walk.email, triageAction: "priority", value: "2" })
        return { acceptBug, acceptFeature, assign, priority, bug: request(walk.email), feature: request(walk.form) }
    },
    then({ acceptBug, acceptFeature, assign, priority, bug, feature }) {
        acceptBug.errors == ""
        acceptFeature.errors == ""
        assign.errors == ""
        priority.errors == ""
        bug.statusId == "ReqReviewed"
        bug.priority == 2
        feature.statusId == "ReqReviewed"
    },
})

feature("he makes a work item from each: a Bug Fix and a New Feature in IRON, assigned to Joe Developer", {
    when() {
        const bugItem = post("Requests/RequestDetail/makeWorkItem", { requestId: walk.email, rootWorkEffortId: "IRON", assignToPartyId: "ORG_ZIZI_JD" })
        const featureItem = post("Requests/RequestDetail/makeWorkItem", { requestId: walk.form, rootWorkEffortId: "IRON", assignToPartyId: "ORG_ZIZI_JD" })
        const linkOf = (id) => all("mantle.request.RequestWorkEffort", { requestId: id })[0]?.workEffortId
        walk.bugItem = linkOf(walk.email)
        walk.featureItem = linkOf(walk.form)
        return { bugItem, featureItem, bug: one("mantle.work.effort.WorkEffort", { workEffortId: walk.bugItem }),
            feature: one("mantle.work.effort.WorkEffort", { workEffortId: walk.featureItem }),
            work: render("apps/Projects/Requests/RequestDetail", { requestId: walk.email, tab: "work" }) }
    },
    then({ bugItem, featureItem, bug, feature, work }) {
        bugItem.errors == ""
        featureItem.errors == ""
        bug.rootWorkEffortId == "IRON"
        bug.purposeEnumId == "WepFix"
        bug.workEffortName == "BOSS_WALK The CSV import skips the last row"
        feature.purposeEnumId == "WepNewFeature"
        work.output.includes(walk.bugItem)
    },
})

feature("Joe Developer starts and completes the work on WorkItemDetail: each request follows to In Progress, then Completed", {
    when() {
        return as("joe.developer", () => {
            const start = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: walk.bugItem, toStatusId: "WeInProgress" })
            const bugStarted = request(walk.email).statusId
            const review = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: walk.bugItem, toStatusId: "WeInReview" })
            const done = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: walk.bugItem, toStatusId: "WeComplete" })
            const featureStart = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: walk.featureItem, toStatusId: "WeInProgress" })
            const featureDone = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: walk.featureItem, toStatusId: "WeComplete" })
            return { start, bugStarted, review, done, featureStart, featureDone, bug: request(walk.email), feature: request(walk.form) }
        })
    },
    then({ start, bugStarted, review, done, featureStart, featureDone, bug, feature }) {
        start.errors == ""
        bugStarted == "ReqInProgress"
        review.errors == ""
        done.errors == ""
        bug.statusId == "ReqCompleted"
        bug.requestResolutionEnumId == "RrFixed"
        featureStart.errors == ""
        featureDone.errors == ""
        feature.statusId == "ReqCompleted"
        feature.requestResolutionEnumId == "RrCompleted"
    },
})

feature("a reply to the email joins its request's conversation; the request shows the work done", {
    when() {
        arrive("BOSS_WALK_MAIL_2", { fromAddress: "walker.wren@acme.example", fromName: "Walker Wren", toAddresses: "support+iron@ziziwork.example",
            subject: "Re: BOSS_WALK The CSV import skips the last row", bodyText: "Thanks, all three rows arrive now.",
            inReplyTo: walk.message.messageId, referencesHeader: walk.message.messageId })
        return { links: all("mantle.request.RequestEmailMessage", { requestId: walk.email }).map((row) => row.emailMessageId),
            requests: all("mantle.request.Request", { requestName: "Re: BOSS_WALK The CSV import skips the last row" }).length,
            detail: render("apps/Projects/Requests/RequestDetail", { requestId: walk.email }) }
    },
    then({ links, requests, detail }) {
        links.includes("BOSS_WALK_MAIL_1")
        links.includes("BOSS_WALK_MAIL_2")
        requests == 0
        detail.errors == ""
        detail.output.includes("1/1 done")
    },
})
