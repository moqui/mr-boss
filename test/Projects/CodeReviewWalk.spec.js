// The usable-when walk of IronStone Projects P3b (impl-projects.md P3b; design-projects.md §7 and §5 Development) through the
// screens' transitions, with authorization on: in a project of its own (CRW, with john.doe its manager and joe.developer a
// programmer, and the repository crw-walk whose main asks for one approval and a passed ci/build), joe makes a branch from a work
// item on its Development tab, commits on it through the services (as a push would), opens a merge request from Compare (its
// Closes line links the item to complete on merge), john is asked to review, comments on a line and approves, CI posts its
// status, and joe merges: the merge request is merged, the branch deleted and the work item complete. The project is
// cancelled and the repository archived after, so the other specs' lists keep their records.
// Run: ./moq test mr-boss --spec CodeReviewWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "CRW"
const REPO = "crw-walk"
const ITEM = "CRW-1"

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
    return { status: str.status, errors: str.errorMessages.join(" | "), json: parsed }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
// the gitECA post events of each change run on the git pool: wait for them
function settle() {
    const started = Date.now()
    while (Date.now() - started < 20000) {
        const busy = sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", REPO).condition("ecaStatus", "in", ["pending", "running"]).count())
        if (busy == 0) return
        sys(() => call("org.moqui.impl.GitServices.process#PendingGitUpdates", {}))
    }
}
const item = () => sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", ITEM).one())
let branchName, mergeRequestId, headCommitId

spec({
    stepwise: true,
    requires: ["git"],
    setupSpec() {
        login("john.doe")
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Code review walk" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId, roleTypeId }).count())
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: ec.user.nowTimestamp, statusId: "WeptAssigned" })
            }
            call("mantle.work.ProjectServices.store#ProjectSetting", { workEffortId: PROJECT, settingTypeEnumId: "WstModules", settingValue: "code" })
            call("mantle.work.GitServices.create#ProjectRepository", { workEffortId: PROJECT, repositoryId: REPO, repositoryKind: "db",
                description: "The code review walk", applyDefaults: false })
            call("org.moqui.impl.GitServices.commit#GitFiles", { repositoryId: REPO, message: "Start the walk", fileMap: {
                "README.md": "# The walk\n\nA repository for the code review walk.\n", "src/threads.js": "export const threads = []\n" } })
            call("org.moqui.impl.GitServices.store#GitBranchRule", { repositoryId: REPO, refPattern: "main", allowForcePush: "N", allowDelete: "N",
                requiredApprovals: 1, requiredStatusContexts: "ci/build" })
            call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortId: ITEM, workEffortName: "Show the review threads under their lines",
                assignToPartyId: "ORG_ZIZI_JD", purposeEnumId: "WepNewFeature" })
            call("mantle.work.TaskServices.set#TaskStatus", { workEffortId: ITEM, statusId: "WeInProgress" })
        })
        settle()
    },
    setup() { if (ec.user.username != "john.doe") throw new Error("the git update events left the user " + ec.user.username) },
    cleanupSpec() {
        sys(() => {
            ec.message.clearErrors()
            call("org.moqui.impl.GitServices.archive#GitRepository", { repositoryId: REPO })
            ec.message.clearErrors()
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
        })
        settle()
    },
})

feature("joe makes a branch for the work item on its Development tab, named by the project's pattern", {
    when() {
        const before = as("joe.developer", () => render("apps/Projects/WorkItems/WorkItemDetail", { workEffortId: ITEM, tab: "development" }))
        const made = as("joe.developer", () => post("WorkItems/WorkItemDetail/createBranch", { workEffortId: ITEM }))
        settle()
        const dev = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.get#WorkItemDevelopment", { workEffortId: ITEM }).development))
        branchName = dev.branchList[0]?.name
        return { before, made, dev }
    },
    then({ before, made, dev }) {
        before.status == 200
        !before.broken
        before.output.includes("WorkItemBranchDialog")
        before.output.includes("CRW-1-show-the-review-threads-under-their")
        made.errors == ""
        dev.branchList.length == 1
        dev.branchList[0].name == "CRW-1-show-the-review-threads-under-their"
        dev.branchList[0].linkedBy == "Branch name"
    },
})

feature("joe commits on the branch through the services, as a push would; the commit links itself to the work item", {
    when() {
        sys(() => call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: REPO, branch: branchName }))
        try {
            // as joe (the commit's Moqui-User-Id), outside a screen: the service's own authorization is the app's, so off here
            headCommitId = as("joe.developer", () => sys(() => call("org.moqui.impl.GitServices.commit#GitFiles", { repositoryId: REPO,
                message: "CRW-1 Each thread under its line, with replies and Resolve", fileMap: {
                    "src/threads.js": "// the review threads of a file, by line\nexport const threads = []\nexport const byLine = (line) => threads.filter((thread) => thread.line === line)\n" } }).commitId))
        } finally { sys(() => call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: REPO, branch: "main" })) }
        settle()
        const dev = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.get#WorkItemDevelopment", { workEffortId: ITEM }).development))
        const page = as("joe.developer", () => render("apps/Projects/WorkItems/WorkItemDetail", { workEffortId: ITEM, tab: "development" }))
        return { dev, page }
    },
    then({ dev, page }) {
        headCommitId != null
        dev.commitList.map((row) => row.commitId).includes(headCommitId)
        dev.branchList[0].aheadBy == 1
        dev.branchList[0].canOpenMergeRequest == true
        page.output.includes("New merge request")
        page.output.includes("Each thread under its line")
    },
})

feature("joe opens a merge request from Compare; its Closes line links the item to complete on merge and john is asked to review", {
    when() {
        const info = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.get#CompareInfo", { repositoryId: REPO, head: branchName })))
        const opened = as("joe.developer", () => post("Code/Compare/openMergeRequest", { repositoryId: REPO, sourceRef: branchName, targetRef: "main",
            title: info.defaults.title, description: info.defaults.description, reviewerUserIds: info.defaults.reviewerUserIds.join(","),
            completeItems: info.defaults.completeItems }))
        const mr = sys(() => ec.entity.find("moqui.resource.GitMergeRequest").condition({ repositoryId: REPO, sourceRef: branchName }).one())
        mergeRequestId = mr?.mergeRequestId
        const links = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition("mergeRequestId", mergeRequestId || "_NA_").list()))
        const waiting = sys(() => call("ironstone.projects.CodeServices.find#MergeRequests", { list: "waiting" }))
        const notified = sys(() => ec.entity.find("moqui.security.user.NotificationMessage").condition("topic", "MergeRequestReview").count())
        return { info, opened, mr, links, waiting, notified }
    },
    then({ info, opened, mr, links, waiting, notified }) {
        info.defaults.title == "Show the review threads under their lines (CRW-1)"
        info.defaults.description == "Closes CRW-1"
        info.defaults.reviewerUserIds.includes("EX_JOHN_DOE")
        opened.errors == ""
        opened.redirect.includes("MergeRequestDetail")
        mr != null
        mr.statusId == "GmrOpen"
        links.map((link) => link.workEffortId) == ["CRW-1"]
        links[0].completeOnMerge == "Y"
        waiting.rowList.map((row) => row.mergeRequestId).includes(mergeRequestId)
        notified >= 1
    },
})

feature("john comments on a line of the diff and approves; the merge waits for ci/build", {
    when() {
        const changes = json("Code/MergeRequestDetail/Changes/changes", { mergeRequestId }).json?.changes
        const line = changes.fileList.find((file) => file.path == "src/threads.js").hunkList[0].lineList.find((one) => one.tag == "insert")
        const comment = json("Code/MergeRequestDetail/Changes/comment", { mergeRequestId, body: "Sort the threads by line?", path: "src/threads.js",
            newLine: line.newNo, lineText: line.text }, "post")
        const approved = json("Code/MergeRequestDetail/Changes/submitReview", { mergeRequestId, decision: "approve", note: "Good, with the one question" }, "post")
        const detail = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.get#MergeRequestDetail", { mergeRequestId, parts: "threads" }).detail))
        return { changes, line, comment, approved, detail }
    },
    then({ changes, line, comment, approved, detail }) {
        changes.fileList.length == 1
        line.newNo == 1
        comment.json.communicationEventId != null
        approved.json.statusId == "GmrrApproved"
        detail.approvalCount == 1
        detail.threadCounts.open == 1
        detail.canMerge == false
        detail.missingList.some((text) => text.includes("ci/build"))
    },
})

feature("CI posts a passed ci/build on the head; joe may now merge", {
    when() {
        sys(() => call("org.moqui.impl.GitServices.create#GitCommitStatus", { repositoryId: REPO, commitId: headCommitId, state: "success", context: "ci/build",
            description: "Build and tests passed", targetUrl: "https://ci.example.com/crw/1" }))
        const detail = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.get#MergeRequestDetail", { mergeRequestId, parts: "" }).detail))
        const header = as("joe.developer", () => render("apps/Projects/Code/MergeRequestDetail", { mergeRequestId }, "qvt", "2"))
        return { detail, header }
    },
    then({ detail, header }) {
        detail.checkState == "success"
        detail.missingList.length == 0
        detail.canMerge == true
        detail.primaryAction == "merge"
        header.output.includes("MergeHeader")
    },
})

feature("joe merges with a squash and deletes the branch: the merge request is merged and the work item complete", {
    when() {
        const merged = as("joe.developer", () => post("Code/MergeRequestDetail/mergeMergeRequest", { mergeRequestId, mergeMethodEnumId: "GmmSquash",
            commitMessage: "Show the review threads under their lines (!1)", deleteSourceBranch: "Y" }))
        settle()
        const mr = sys(() => ec.entity.find("moqui.resource.GitMergeRequest").condition("mergeRequestId", mergeRequestId).one())
        const branches = sys(() => Array.from(call("org.moqui.impl.GitServices.get#GitRefs", { repositoryId: REPO, refType: "branch" }).refList).map((ref) => ref.shortName))
        const log = sys(() => Array.from(call("org.moqui.impl.GitServices.get#GitLog", { repositoryId: REPO, limit: 1 }).commitList))
        const dev = sys(() => call("ironstone.projects.CodeServices.get#WorkItemDevelopment", { workEffortId: ITEM }).development)
        const overview = render("apps/Projects/Code/MergeRequestDetail/Overview", { mergeRequestId })
        return { merged, mr, branches, log, task: item(), dev, overview }
    },
    then({ merged, mr, branches, log, task, dev, overview }) {
        merged.errors == ""
        mr.statusId == "GmrMerged"
        mr.mergedByUserId == "ORG_ZIZI_JD"
        !branches.includes("CRW-1-show-the-review-threads-under-their")
        log[0].summary == "Show the review threads under their lines (!1)"
        task.statusId == "WeComplete"
        dev.mergeRequestList[0].statusId == "GmrMerged"
        overview.output.includes("Merged into main")
    },
})
