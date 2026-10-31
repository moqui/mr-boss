// Shared repositories for clients (impl-projects.md P10b; design-projects.md §1.1, §4 ProjectCode, §7 Code): with authorization
// on, a client contact (sheldon.acme of Acme on ACME) reads the code of a repository its project shares with it (ACME's
// WstShareRepositories Y, set here and taken off after) through the Code screens, read only: the project's Code tab, Repositories,
// RepositoryDetail with Files, Commits, Branches, Tags and Merge requests, CommitDetail, MergeRequests and MergeRequestDetail with
// its Commits and Changes. It never reads an internal repository (iron), nor one its project does not share (sharing off again), and
// another client (gob.bluth of Bluth) never reads Acme's, even with its own project sharing; Compare, Git access, Activity and
// Settings are refused; the writes of the Code screens are refused and change nothing; no review note, line comment, check
// description, internal work item or Acme secret reaches the client. An internal user's Code screens are unchanged.
// The fixtures: a branch cc-theme in acme-portal with a commit, a merge request of it linked to ACME-1 (shared) and ACME-3 (Work
// group), a reviewer's note, a line comment, and a check with a description and a link, all with ZQX sentinels; taken out after.
// Run: ./moq test mr-boss --spec ClientCode
const webroot = "component://webroot/screen/webroot.xml"
const SHELDON = "sheldon.acme"
const GOB = "gob.bluth"
const REPO = "acme-portal"
const BRANCH = "cc-theme"
const made = {}
// what the client must never see of the code: the team's review, CI and internal items, and the other repositories
const CODE_SECRETS = ["ZQX-REVIEW-NOTE", "ZQX-LINE-COMMENT", "ZQX-CI-NOTE", "ci.internal.example", "Single sign-on with their directory",
    "IronStone Projects, the app", "Expand and collapse rows", "Bluth banana stand site", "ssh://", "Set up an SSH key"]
const leaksOf = (text, secrets) => secrets.filter((secret) => String(text || "").includes(secret))
// what is wrong with pages a client opens: not shown, refused, broken, not available, or a secret in them
const problems = (pages) => Object.entries(pages).flatMap(([name, page]) => [
    page.status != 200 ? `${name}: status ${page.status} ${page.errors.substring(0, 200)}` : null,
    page.refused ? `${name}: refused` : null, page.broken ? `${name}: broken` : null, page.notAvailable ? `${name}: not available` : null,
    leaksOf(page.output, CODE_SECRETS).length ? `${name} shows ${leaksOf(page.output, CODE_SECRETS).join(", ")}` : null].filter((one) => one))

function render(path, parameters, mode, standalone) {
    const all = Object.assign({ lastStandalone: typeof standalone === "string" ? standalone : "true" }, parameters || {})
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render("apps/Projects/" + path, all, null)
    const output = String(str.output || "")
    const errors = str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors, output, refused: str.status == 401 || str.status == 403 || /not authorized/i.test(errors + output),
        broken: /Error rendering|Exception in render/.test(output), notAvailable: /is not available|not shared with you/.test(output) }
}
function hit(path, parameters, method) {
    const full = path.startsWith("../") ? path.substring(3) : "apps/Projects/" + path
    const str = ec.screen.makeTest().rootScreen(webroot).render(full, parameters || {}, method || null)
    const output = String(str.output || "")
    const errors = str.errorMessages.join(" | ")
    ec.message.clearErrors()
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    return { status: str.status, errors, output, json, refused: str.status == 401 || str.status == 403 || /not authorized/i.test(errors) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
// as the user, with authorization on as for a request
function as(username, run) {
    login(username)
    const wasDisabled = ec.artifactExecution.authzDisabled()
    if (wasDisabled) ec.artifactExecution.enableAuthz()
    try { return run() } finally {
        if (wasDisabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
// a service as the current user with authorization off (a service is authorized by the screen calling it): what the service
// decides itself for a client (PROJECT_CLIENT), not the repository's view right, which the screens' renders check
const service = (name, parameters) => sys(() => {
    const out = ec.service.sync().name(name).parameters(parameters || {}).call() || {}
    const errors = ec.message.getErrorsString ? ec.message.getErrorsString() : ""
    ec.message.clearErrors()
    return Object.assign({}, out, { _errors: errors || "" })
})
function settle() {
    const started = Date.now()
    while (Date.now() - started < 20000) {
        const busy = sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", REPO])
                .condition("ecaStatus", "in", ["pending", "running"]).count())
        if (busy == 0) return
        sys(() => call("org.moqui.impl.GitServices.process#PendingGitUpdates", {}))
    }
}
function share(projectId, on) {
    sys(() => {
        const find = () => ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ workEffortId: projectId, settingTypeEnumId: "WstShareRepositories" })
        find().deleteAll()
        if (on) ec.service.sync().name("create#mantle.work.effort.WorkEffortSetting").parameters({ workEffortId: projectId,
            settingTypeEnumId: "WstShareRepositories", settingValue: "Y" }).call()
    })
}
// what a client's write could change, to compare before and after
const state = () => sys(() => ({
    refs: Array.from(call("org.moqui.impl.GitServices.get#GitRefs", { repositoryId: REPO }).refList).map((ref) => ref.refName + "@" + ref.commitId).sort().join(","),
    mr: (() => { const mr = ec.entity.find("moqui.resource.GitMergeRequest").condition("mergeRequestId", made.mrId).one()
        return [mr.statusId, mr.title, mr.description, mr.targetRef].join("|") })(),
    reviewers: Array.from(ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition("mergeRequestId", made.mrId).list())
            .map((row) => row.userId + ":" + row.statusId).sort().join(","),
    comments: ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition({ recordEntityName: "moqui.resource.GitMergeRequest",
        recordId: made.mrId }).count() + ec.entity.find("mantle.party.communication.CommunicationEvent").condition("fromPartyId", "ORG_ACME_SA").count(),
    mrItems: Array.from(ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition("mergeRequestId", made.mrId).list())
            .map((row) => row.workEffortId).sort().join(","),
    commitItems: ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition("repositoryId", REPO).count(),
    refLinks: ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition("repositoryId", REPO).condition("thruDate", "is-null", null).count(),
    projectRepos: ec.entity.find("mantle.work.effort.WorkEffortGitRepository").condition("repositoryId", REPO).conditionDate("fromDate", "thruDate", null).count(),
    repositories: ec.entity.find("moqui.resource.GitRepository").count(),
}))

spec({
    requires: ["git"],
    stepwise: false,
    setupSpec() {
        login("john.doe")
        sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", REPO]).condition("ecaStatus", "running")
                .updateAll({ ecaStatus: "pending" }))
        settle()
        sys(() => {
            made.shareBefore = Array.from(ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ settingTypeEnumId: "WstShareRepositories" })
                    .condition("workEffortId", "in", ["ACME", "BLUTH"]).list()).map((row) => row.getMap())
            // a branch with a commit, and a merge request of it into main
            call("org.moqui.impl.GitServices.create#GitRef", { repositoryId: REPO, refName: BRANCH, refType: "branch" })
            call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: REPO, branch: BRANCH })
            try {
                made.commitId = call("org.moqui.impl.GitServices.commit#GitFiles", { repositoryId: REPO, message: "The portal's colors for ACME-1",
                    fileMap: { "src/theme.css": ":root { --brand: #b40000; }\n" } }).commitId
            } finally { call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: REPO, branch: "main" }) }
        })
        settle()
        sys(() => {
            made.mrId = call("org.moqui.impl.GitReviewServices.create#MergeRequest", { repositoryId: REPO, sourceRef: BRANCH, targetRef: "main",
                title: "CC portal colors", description: "The brand colors of the portal." }).mergeRequestId
            for (const workEffortId of ["ACME-1", "ACME-3"]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition({ mergeRequestId: made.mrId, workEffortId }).count())
                    ec.service.sync().name("create#mantle.work.effort.WorkEffortGitMergeRequest").parameters({ mergeRequestId: made.mrId, workEffortId,
                        linkSourceEnumId: "WglsExplicit", completeOnMerge: "N" }).call()
            }
            // the team's review: a reviewer's note, a line comment, a check with its description and link
            ec.service.sync().name("create#moqui.resource.GitMergeRequestReviewer").parameters({ mergeRequestId: made.mrId, userId: "EX_JOHN_DOE",
                statusId: "GmrrChangesRequested", requestedDate: ec.user.nowTimestamp, reviewedDate: ec.user.nowTimestamp, reviewNote: "ZQX-REVIEW-NOTE: not this red" }).call()
            made.commentId = call("mantle.work.GitServices.create#ReviewComment", { mergeRequestId: made.mrId, body: "ZQX-LINE-COMMENT: the margin is thin here",
                path: "src/theme.css", newLine: 1, lineText: ":root { --brand: #b40000; }" }).communicationEventId
            call("org.moqui.impl.GitServices.create#GitCommitStatus", { repositoryId: REPO, commitId: made.commitId, state: "failure", context: "ci/build",
                description: "ZQX-CI-NOTE: the staging password expired", target_url: "https://ci.internal.example/run/9" })
            // the commit naming the Work group item ACME-3 (the demo's)
            made.sso = ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition({ repositoryId: REPO, workEffortId: "ACME-3" }).list()[0]?.commitId
        })
        ec.message.clearErrors()
        share("ACME", true)
    },
    cleanupSpec() {
        sys(() => {
            for (const id of [made.commentId].filter((id) => id)) {
                ec.entity.find("mantle.party.communication.CommunicationEventGitAnchor").condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", id).deleteAll()
            }
            if (made.mrId) {
                ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition("mergeRequestId", made.mrId).deleteAll()
                ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition("mergeRequestId", made.mrId).deleteAll()
                ec.entity.find("moqui.resource.GitMergeRequest").condition("mergeRequestId", made.mrId).deleteAll()
            }
            if (made.commitId) {
                ec.entity.find("moqui.resource.GitCommitStatus").condition({ repositoryId: REPO, commitId: made.commitId }).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition({ repositoryId: REPO, commitId: made.commitId }).deleteAll()
            }
            ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition({ repositoryId: REPO, refName: "refs/heads/" + BRANCH }).deleteAll()
            ec.service.sync().name("org.moqui.impl.GitServices.delete#GitRef").parameters({ repositoryId: REPO, refName: BRANCH, refType: "branch" }).call()
            ec.message.clearErrors()
            ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ settingTypeEnumId: "WstShareRepositories" })
                    .condition("workEffortId", "in", ["ACME", "BLUTH"]).deleteAll()
            for (const row of made.shareBefore || []) ec.service.sync().name("create#mantle.work.effort.WorkEffortSetting").parameters(row).call()
        })
        settle()
    },
})

feature("a client reads its project's shared repository: the Code tab, the repository list and the repository's tabs, read only", {
    when() {
        return as(SHELDON, () => ({
            tab: render("Projects/ProjectDetail/Code", { workEffortId: "ACME" }),
            list: render("Code/Repositories", {}),
            detail: render("Code/RepositoryDetail", { repositoryId: REPO }, "qvt", "2"),
            tabs: hit("../menuData/apps/Projects/Code/RepositoryDetail", { repositoryId: REPO }),
            files: render("Code/RepositoryDetail/Files", { repositoryId: REPO }),
            file: render("Code/RepositoryDetail/Files", { repositoryId: REPO, path: "src/signin.html" }),
            raw: hit("Code/RepositoryDetail/Files/raw", { repositoryId: REPO, ref: "main", path: "README.md", download: "Y" }),
            commits: render("Code/RepositoryDetail/Commits", { repositoryId: REPO }),
            branches: render("Code/RepositoryDetail/Branches", { repositoryId: REPO }),
            tags: render("Code/RepositoryDetail/Tags", { repositoryId: REPO }),
            commit: render("Code/CommitDetail", { repositoryId: REPO, commitId: made.commitId }),
            ssoCommit: render("Code/CommitDetail", { repositoryId: REPO, commitId: made.sso }),
            access: service("ironstone.projects.CodeServices.get#RepositoryAccess", { repositoryId: REPO }),
            menu: hit("../menuData/apps/Projects/Code"),
        }))
    },
    then({ tab, list, detail, tabs, files, file, raw, commits, branches, tags, commit, ssoCommit, access, menu }) {
        problems({ tab, list, detail, files, file, commits, branches, tags, commit, ssoCommit }).join("\n") == ""
        // the Code tab: the repository with its HTTPS clone URL, commits, the open merge request, the tag; nothing to change
        tab.output.includes(REPO)
        tab.output.includes("The portal skeleton for ACME-1")
        tab.output.includes("CC portal colors")
        tab.output.includes("ACME/v0.1")
        !tab.output.includes("New repository")
        !tab.output.includes("unlinkRepository")
        !tab.output.includes("unlinkTag")
        // the list: only the shared repository, under one chip, no action
        list.output.includes(REPO)
        !list.output.includes(">iron<")
        list.output.includes("Shared with you")
        !list.output.includes("New repository")
        !list.output.includes("Mirror")
        // the repository: no SSH, no Git access, no New merge request; its tabs without Activity and Settings
        detail.output.includes("with your user name and password")
        !detail.output.includes("New merge request")
        !detail.output.includes("gitAccess")
        access.canView
        !access.canCreate
        !access.canUpdate
        !access.canDelete
        !access.isAdmin
        access.sshUrl == null
        access.repository.remoteUrl == null
        const tabNames = (Array.isArray(tabs.json) ? tabs.json : []).flatMap((level) => level.name === "RepositoryDetail" ? (level.subscreens || []).map((item) => item.name) : [])
        tabNames.includes("Files")
        tabNames.includes("Commits")
        tabNames.includes("MergeRequests")
        !tabNames.includes("Activity")
        !tabNames.includes("Settings")
        // the Code menu: Repositories and Merge requests, no Git access
        const codeItems = (Array.isArray(menu.json) ? menu.json : []).flatMap((level) => level.name === "Code" ? (level.subscreens || []).filter((item) => item.menuInclude).map((item) => item.name) : [])
        codeItems.includes("Repositories")
        codeItems.includes("MergeRequests")
        !codeItems.includes("GitAccess")
        // files, a file, the raw file
        files.output.includes("README.md")
        files.output.includes("Acme customer portal")
        file.output.includes("autocomplete")
        raw.status == 200
        raw.output.includes("Acme customer portal")
        // commits: the shared item ACME-1 linked, the Work group item ACME-3 not
        commits.output.includes("The portal skeleton for ACME-1")
        commits.output.includes("workEffortId=ACME-1")
        !commits.output.includes("workEffortId=ACME-3")
        // branches and tags: no New branch, Compare, Delete, New tag or Link
        branches.output.includes(BRANCH)
        !branches.output.includes("New branch")
        !branches.output.includes("New merge request")
        !branches.output.includes("deleteBranch")
        tags.output.includes("ACME/v0.1")
        !tags.output.includes("New tag")
        !tags.output.includes("deleteTag")
        !tags.output.includes("linkTag")
        // a commit: its diff, no checks, no Link or Unlink; the ACME-3 commit without its item
        commit.output.includes("theme.css")
        !commit.output.includes("Checks")
        !commit.output.includes("LinkItemDialog")
        !commit.output.includes("unlinkItem")
        ssoCommit.output.includes("sso.js")
        !ssoCommit.output.includes("workEffortId=ACME-3")
    },
})

feature("a client reads a merge request of the shared repository: no reviewers, review threads, checks, Chatter or action", {
    when() {
        return as(SHELDON, () => ({
            list: render("Code/MergeRequests", { list: "all" }),
            tab: render("Code/RepositoryDetail/MergeRequests", { repositoryId: REPO, list: "all" }),
            found: service("ironstone.projects.CodeServices.find#MergeRequests", { list: "all", repositoryId: REPO }),
            header: render("Code/MergeRequestDetail", { mergeRequestId: made.mrId }, "qvt", "2"),
            overview: render("Code/MergeRequestDetail/Overview", { mergeRequestId: made.mrId }),
            commits: render("Code/MergeRequestDetail/Commits", { mergeRequestId: made.mrId }),
            changes: render("Code/MergeRequestDetail/Changes", { mergeRequestId: made.mrId }, "qvue"),
            changesJson: hit("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: made.mrId }),
            tui: render("Code/MergeRequestDetail/ChangesTui", { mergeRequestId: made.mrId }),
            detail: service("ironstone.projects.CodeServices.get#MergeRequestDetail", { mergeRequestId: made.mrId }),
            threads: service("mantle.work.GitServices.get#ReviewThreads", { mergeRequestId: made.mrId }),
            chatter: hit("Chatter/timeline", { recordEntity: "moqui.resource.GitMergeRequest", recordId: made.mrId }),
            chatterData: hit("Chatter/chatterData", { recordEntity: "moqui.resource.GitMergeRequest", recordId: made.mrId }),
        }))
    },
    then({ list, tab, found, header, overview, commits, changes, changesJson, tui, detail, threads, chatter, chatterData }) {
        problems({ list, tab, header, overview, commits, changes, tui }).join("\n") == ""
        leaksOf(changesJson.output, CODE_SECRETS) == []
        leaksOf(chatter.output, CODE_SECRETS) == []
        list.output.includes("CC portal colors")
        !list.output.includes("New merge request")
        !list.output.includes("Waiting for my review")
        tab.output.includes("CC portal colors")
        // the rows: no reviewers or comments, only the shared item
        found.rowList.length == 1
        found.rowList[0].reviewerList == []
        found.rowList[0].commentCount == 0
        found.rowList[0].itemList.map((item) => item.workEffortId) == ["ACME-1"]
        // the header and Overview: no action but the checkout commands; the description and ACME-1, no merge box or reviewers
        header.output.includes("CC portal colors")
        !header.output.includes("Mark ready")
        !header.output.includes("EditMergeRequestDialog")
        !header.output.includes("ReviewDialog")
        !header.output.includes("closeMergeRequest")
        overview.output.includes("The brand colors of the portal.")
        overview.output.includes("ACME-1")
        !overview.output.includes("Reviewers")
        !overview.output.includes("MergeBox")
        !overview.output.includes("MergeRequestChatter")
        !overview.output.includes("LinkItemDialog")
        commits.output.includes("The portal&#39;s colors") || commits.output.includes("The portal's colors")
        // the diff, without threads or the comment and review controls
        changesJson.json.changes.fileList.map((file) => file.path) == ["src/theme.css"]
        changesJson.json.changes.threadList == []
        !changesJson.json.changes.canComment
        !changesJson.json.changes.canReview
        !tui.output.includes("Review threads")
        // the services
        detail.detail.reviewerList == []
        detail.detail.checkList == []
        detail.detail.primaryAction == null
        !detail.detail.canEdit
        !detail.detail.canReview
        detail.detail.threadCounts.total == 0
        detail.detail.itemList.map((item) => item.workEffortId) == ["ACME-1"]
        threads.threadList == []
        // Chatter on a merge request is not a client's record
        !chatter.output.includes("ZQX")
        !chatterData.output.includes("ZQX")
    },
})

feature("refused: an internal repository, Compare, Git access, Activity, Settings, another client, and the code once sharing is off", {
    when() {
        const ironMr = sys(() => ec.entity.find("moqui.resource.GitMergeRequest").condition({ repositoryId: "iron", mergeRequestNum: 1 }).one()?.mergeRequestId)
        const sheldon = as(SHELDON, () => ({
            iron: render("Code/RepositoryDetail", { repositoryId: "iron" }, "qvt", "2"),
            ironFiles: render("Code/RepositoryDetail/Files", { repositoryId: "iron" }),
            ironCommit: render("Code/CommitDetail", { repositoryId: "iron", commitId: "main" }),
            ironMr: render("Code/MergeRequestDetail/Overview", { mergeRequestId: ironMr }),
            ironChanges: hit("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: ironMr }),
            ironRaw: hit("Code/RepositoryDetail/Files/raw", { repositoryId: "iron", ref: "main", path: "README.md" }),
            compare: render("Code/Compare", { repositoryId: REPO, head: BRANCH }),
            // Git access, Activity and Settings: refused as every screen file is in test/ClientIsolation.spec.js
            activityService: service("ironstone.projects.CodeServices.get#RepositoryActivity", { repositoryId: REPO }),
            compareService: service("ironstone.projects.CodeServices.get#CompareInfo", { repositoryId: REPO, head: BRANCH }),
            palette: service("ironstone.projects.CodeServices.search#CodePalette", { text: "acme" }),
        }))
        // Bluth's own project shares its repositories: still nothing of Acme's
        share("BLUTH", true)
        const gob = as(GOB, () => ({
            repo: render("Code/RepositoryDetail", { repositoryId: REPO }, "qvt", "2"),
            mr: render("Code/MergeRequestDetail/Overview", { mergeRequestId: made.mrId }),
            list: render("Code/Repositories", {}),
            mrs: render("Code/MergeRequests", { list: "all" }),
            tab: render("Projects/ProjectDetail/Code", { workEffortId: "BLUTH" }),
            acmeTab: render("Projects/ProjectDetail/Code", { workEffortId: "ACME" }),
        }))
        share("BLUTH", false)
        // ACME stops sharing: the client reads nothing of its code
        share("ACME", false)
        const off = as(SHELDON, () => ({
            tab: render("Projects/ProjectDetail/Code", { workEffortId: "ACME" }),
            repo: render("Code/RepositoryDetail", { repositoryId: REPO }, "qvt", "2"),
            files: render("Code/RepositoryDetail/Files", { repositoryId: REPO }),
            commit: render("Code/CommitDetail", { repositoryId: REPO, commitId: made.commitId }),
            mr: render("Code/MergeRequestDetail/Overview", { mergeRequestId: made.mrId }),
            changes: hit("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: made.mrId }),
            raw: hit("Code/RepositoryDetail/Files/raw", { repositoryId: REPO, ref: "main", path: "README.md" }),
            list: render("Code/Repositories", {}),
            mrs: render("Code/MergeRequests", { list: "all" }),
        }))
        share("ACME", true)
        return { ironMr, sheldon, gob, off }
    },
    then({ ironMr, sheldon, gob, off }) {
        ironMr != null
        sheldon.iron.notAvailable
        !sheldon.iron.output.includes("IronStone Projects, the app")
        sheldon.ironFiles.output.includes("is not available") || !sheldon.ironFiles.output.includes("README")
        sheldon.ironCommit.notAvailable
        !sheldon.ironMr.output.includes("Expand and collapse rows")
        sheldon.ironChanges.json?.changes == null
        sheldon.ironRaw.status == 404
        sheldon.compare.refused
        sheldon.activityService._errors != ""
        !sheldon.activityService.updateList?.length
        sheldon.compareService._errors != ""
        !sheldon.palette.resultList?.length
        gob.repo.notAvailable
        !gob.mr.output.includes("CC portal colors")
        gob.list.output.includes("No repository is shared with you")
        !gob.list.output.includes(REPO)
        !gob.mrs.output.includes("CC portal colors")
        gob.tab.output.includes("not shared with you")
        gob.acmeTab.refused || gob.acmeTab.notAvailable || !gob.acmeTab.output.includes(REPO)
        leaksOf(gob.repo.output + gob.mr.output + gob.acmeTab.output, ["Acme customer portal", "CC portal colors", "The portal skeleton"]) == []
        off.tab.output.includes("not shared with you")
        !off.tab.output.includes("The portal skeleton")
        off.repo.notAvailable
        !off.files.output.includes("Acme customer portal")
        off.commit.notAvailable
        !off.mr.output.includes("The brand colors")
        off.changes.json?.changes == null
        off.raw.status == 404
        off.list.output.includes("No repository is shared with you")
        !off.list.output.includes(REPO)
        !off.mrs.output.includes("CC portal colors")
    },
})

feature("a client changes nothing through the Code screens: a write of each is refused and the repository is unchanged", {
    when() {
        const before = state()
        const p = { repositoryId: REPO }
        const m = { mergeRequestId: made.mrId }
        // the client's deny is one pattern of write verbs (BOSS_PROJECTS_INTERNAL): one write of each Code screen, and IronStone's own service
        const results = as(SHELDON, () => [
            ["Branches/createBranch", hit("Code/RepositoryDetail/Branches/createBranch", Object.assign({ refName: "cc-client" }, p), "post")],
            ["Tags/createTag", hit("Code/RepositoryDetail/Tags/createTag", Object.assign({ refName: "cc-client-tag" }, p), "post")],
            ["CommitDetail/linkItem", hit("Code/CommitDetail/linkItem", Object.assign({ commitId: made.commitId, workEffortId: "ACME-1" }, p), "post")],
            ["Repositories/createRepository", hit("Code/Repositories/createRepository", { workEffortId: "ACME", repositoryId: "cc-client-repo" }, "post")],
            ["ProjectCode/linkRepository", hit("Projects/ProjectDetail/Code/linkRepository", { workEffortId: "ACME", repositoryId: REPO }, "post")],
            ["MergeRequestDetail/mergeMergeRequest", hit("Code/MergeRequestDetail/mergeMergeRequest", Object.assign({ mergeMethodEnumId: "GmmMerge" }, m), "post")],
            ["Overview/mergeMergeRequest", hit("Code/MergeRequestDetail/Overview/mergeMergeRequest", Object.assign({ mergeMethodEnumId: "GmmMerge" }, m), "post")],
            ["Changes/comment", hit("Code/MergeRequestDetail/Changes/comment", Object.assign({ body: "cc client comment", path: "src/theme.css", newLine: "1" }, m), "post")],
            ["comment#MergeRequest", { errors: service("ironstone.projects.CodeServices.comment#MergeRequest", Object.assign({ body: "cc boss" }, m))._errors }],
        ])
        const after = state()
        const comment = sys(() => ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", made.commentId).one()?.statusId)
        return { before, after, results, comment }
    },
    then({ before, after, results, comment }) {
        // each refused: a JSON transition answers nothing, a form transition an error
        const accepted = results.filter(([name, out]) => !(out.refused || (out.errors && out.errors.length) || (out.json && Object.keys(out.json).length == 0)
            || /not authorized|not available|may not|not found/i.test(out.output || ""))).map(([name]) => name)
        accepted == []
        JSON.stringify(after) == JSON.stringify(before)
        comment == "CeSent"
    },
})

feature("an internal user's Code screens are unchanged: the actions, reviewers, checks, threads and Chatter are there", {
    when() {
        login("john.doe")
        const wasDisabled = ec.artifactExecution.authzDisabled()
        if (wasDisabled) ec.artifactExecution.enableAuthz()
        try {
            return {
                tab: render("Projects/ProjectDetail/Code", { workEffortId: "ACME" }),
                detail: render("Code/RepositoryDetail", { repositoryId: REPO }, "qvt", "2"),
                tabs: hit("../menuData/apps/Projects/Code/RepositoryDetail", { repositoryId: REPO }),
                branches: render("Code/RepositoryDetail/Branches", { repositoryId: REPO }),
                commit: render("Code/CommitDetail", { repositoryId: REPO, commitId: made.commitId }),
                ssoCommit: render("Code/CommitDetail", { repositoryId: REPO, commitId: made.sso }),
                overview: render("Code/MergeRequestDetail/Overview", { mergeRequestId: made.mrId }),
                changesJson: hit("Code/MergeRequestDetail/Changes/changes", { mergeRequestId: made.mrId }),
                found: service("ironstone.projects.CodeServices.find#MergeRequests", { list: "all", repositoryId: REPO }),
                list: render("Code/Repositories", { list: "all" }),
                chatter: hit("Chatter/timeline", { recordEntity: "moqui.resource.GitMergeRequest", recordId: made.mrId }),
            }
        } finally { if (wasDisabled) ec.artifactExecution.disableAuthz() }
    },
    then({ tab, detail, tabs, branches, commit, ssoCommit, overview, changesJson, found, list, chatter }) {
        chatter.output.includes("ZQX-LINE-COMMENT")
        tab.output.includes("Unlink")
        detail.output.includes("Set up an SSH key")
        detail.output.includes("New merge request")
        const tabNames = (Array.isArray(tabs.json) ? tabs.json : []).flatMap((level) => level.name === "RepositoryDetail" ? (level.subscreens || []).map((item) => item.name) : [])
        tabNames.includes("Activity")
        tabNames.includes("Settings")
        branches.output.includes("New branch")
        commit.output.includes("Checks")
        commit.output.includes("ZQX-CI-NOTE")
        commit.output.includes("LinkItemDialog")
        ssoCommit.output.includes("workEffortId=ACME-3")
        overview.output.includes("Reviewers")
        overview.output.includes("ZQX-REVIEW-NOTE")
        overview.output.includes("MergeRequestChatter")
        changesJson.json.changes.threadList.length == 1
        changesJson.json.changes.canComment
        found.rowList[0].reviewerList.length == 1
        found.rowList[0].commentCount >= 1
        found.rowList[0].itemList.map((item) => item.workEffortId).sort() == ["ACME-1", "ACME-3"]
        list.output.includes("Mirror") || list.output.includes("New repository")
    },
})
