// Code in IronStone Projects (screen/Projects/Code/, Projects/ProjectDetail/Code.xml, Settings/Code.xml; service/ironstone/projects/CodeServices.xml;
// design-projects.md §7, §4 ProjectCode, §12 CodeSettings; impl-projects.md P3b) on the code demo (service/ironstone/projects/CodeDemoServices.xml:
// the repositories iron of IRON and acme-portal of ACME): the repository list by chip and by who may view what, the repository's
// header and tabs (files, a file, commits, branches, tags, the push log, the settings for its maintainers only), a branch and a tag
// made and deleted, Compare with a merge request opened from it and its work items linked, a commit with a work item linked and
// unlinked, git access (an SSH key, an access token), the code settings, the project's Code tab, the palette's Code group and the
// raw file. Authorization stays on. The spec makes its own branches (bt-…), tags and merge request and takes them out after.
// Run: ./moq test mr-boss --spec Code
const webroot = "component://webroot/screen/webroot.xml"
const SSH_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl bt@example"

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
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
// the gitECA post events of the demo's and the spec's changes run on the git pool: wait for them, running any left pending
function settle() {
    const started = Date.now()
    while (Date.now() - started < 20000) {
        const busy = sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", "acme-portal"])
                .condition("ecaStatus", "in", ["pending", "running"]).count())
        if (busy == 0) return
        sys(() => call("org.moqui.impl.GitServices.process#PendingGitUpdates", {}))
    }
}
// the test database is a copy taken right after the load, which can cut a demo update short while it runs: put it back to
// pending, as a restart does (process#PendingGitUpdates at boot), so settle runs it
function recoverCutShort() {
    sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", "in", ["iron", "acme-portal"]).condition("ecaStatus", "running")
            .updateAll({ ecaStatus: "pending" }))
}
const refNames = (repositoryId, refType) => sys(() => Array.from(call("org.moqui.impl.GitServices.get#GitRefs", { repositoryId, refType }).refList).map((ref) => ref.shortName))

spec({
    requires: ["git"],
    setupSpec() { login("john.doe"); recoverCutShort(); settle() },
    setup() { if (ec.user.username != "john.doe") throw new Error("the git update events left the user " + ec.user.username) },
    cleanupSpec() {
        sys(() => {
            for (const refName of refNames("iron", "branch").filter((name) => name.startsWith("bt-") || name.includes("-bt-")))
                ec.service.sync().name("org.moqui.impl.GitServices.delete#GitRef").parameters({ repositoryId: "iron", refName, refType: "branch" }).call()
            for (const refName of refNames("iron", "tag").filter((name) => name.startsWith("bt-")))
                ec.service.sync().name("org.moqui.impl.GitServices.delete#GitRef").parameters({ repositoryId: "iron", refName, refType: "tag" }).call()
            ec.message.clearErrors()
            const mrIds = Array.from(ec.entity.find("moqui.resource.GitMergeRequest").condition("repositoryId", "iron").condition("title", "like", "BT %").list())
                    .map((row) => row.mergeRequestId)
            if (mrIds.length) {
                ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition("mergeRequestId", "in", mrIds).deleteAll()
                ec.entity.find("moqui.resource.GitMergeRequestReviewer").condition("mergeRequestId", "in", mrIds).deleteAll()
                ec.entity.find("moqui.resource.GitMergeRequest").condition("mergeRequestId", "in", mrIds).deleteAll()
            }
            ec.entity.find("mantle.party.PartySetting").condition("partyId", "ORG_ZIZI_SERVICES").condition("partySettingTypeId", "ProjRepositoryDefaults").deleteAll()
            ec.entity.find("moqui.security.UserGroupPermission").condition({ userGroupId: "BOSS_PROJECT_CLIENT", userPermissionId: "SSH_GIT" }).deleteAll()
        })
        settle()
    },
})

feature("Repositories: the demo's repositories by chip, each user seeing those of their projects", {
    when() {
        const john = sys(() => call("ironstone.projects.CodeServices.find#Repositories", { list: "all" }))
        const page = render("apps/Projects/Code/Repositories", { list: "all" })
        const bob = as("bob.developer", () => render("apps/Projects/Code/Repositories", { list: "all" }))
        const joeMine = as("joe.developer", () => render("apps/Projects/Code/Repositories"))
        // the mr-mantle specs that run first can put joe on their own projects with a repository: the chip counts those too, and
        // of the demo's repositories (iron and acme-portal, both on projects joe is on) none is left out
        const joeRepos = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.find#Repositories", {})))
        const joeDemo = joeRepos.rowList.map((row) => row.repositoryId).filter((id) => id == "iron" || id == "acme-portal")
        return { page, john, bob, joeMine, joeRepos, joeDemo }
    },
    then({ page, john, bob, joeMine, joeRepos, joeDemo }) {
        john.rowList.map((row) => row.repositoryId).includes("iron")
        john.rowList.map((row) => row.repositoryId).includes("acme-portal")
        page.status == 200
        !page.broken
        page.errors == ""
        page.output.includes("acme-portal")
        page.output.includes("IronStone Projects, the app")
        john.counts.archived == 0
        john.rowList.find((row) => row.repositoryId == "iron").projectsText == "IronStone Projects"
        john.rowList.find((row) => row.repositoryId == "iron").openMergeRequestCount == 1
        // bob is on IRON only
        bob.output.includes("IronStone Projects, the app")
        !bob.output.includes("acme-portal")
        joeMine.output.includes("acme-portal")
        joeMine.output.includes("Mine · " + joeRepos.counts.mine)
        joeDemo.sort() == ["acme-portal", "iron"]
    },
})

feature("RepositoryDetail: the header and each tab on the demo, and a repository the user may not view is not available", {
    when() {
        const tab = (name, parameters) => render(`apps/Projects/Code/RepositoryDetail/${name}`, Object.assign({ repositoryId: "iron" }, parameters || {}))
        return { header: render("apps/Projects/Code/RepositoryDetail", { repositoryId: "iron" }, "qvt", "2"), files: tab("Files"),
            file: tab("Files", { path: "src/tree.js" }), dir: tab("Files", { path: "src" }), commits: tab("Commits"), history: tab("Commits", { path: "src/board.js" }),
            branches: tab("Branches"), tags: tab("Tags"), activity: tab("Activity"), settings: tab("Settings"),
            joeSettings: as("joe.developer", () => tab("Settings")),
            bobAcme: as("bob.developer", () => render("apps/Projects/Code/RepositoryDetail", { repositoryId: "acme-portal" }, "qvt", "2")),
            nothing: tab("Files", { path: "no/such/thing" }) }
    },
    then({ header, files, file, dir, commits, history, branches, tags, activity, settings, joeSettings, bobAcme, nothing }) {
        for (const page of [header, files, file, dir, commits, history, branches, tags, activity, settings, joeSettings, bobAcme, nothing]) {
            assert(page.status == 200, page.errors)
            assert(!page.broken, page.output.substring(0, 300))
        }
        header.output.includes("IronStone Projects, the app")
        header.output.includes("New merge request")
        header.output.includes("In the database")
        header.output.includes("RepositoryCloneDialog")
        files.output.includes("README.md")
        files.output.includes("The app for project managers")
        file.output.includes("m-code") || file.output.includes("RepositoryFileCode")
        file.output.includes("Remember") == false
        file.output.includes("toggle(row)")
        dir.output.includes("tree.js")
        dir.output.includes("board.js")
        commits.output.includes("IRON-3 Expand and collapse rows")
        commits.output.includes("Passed")
        history.output.includes("Board grouped by assignee")
        !history.output.includes("IRON-2 Work item tree view")
        branches.output.includes("IRON-3-expand-collapse")
        branches.output.includes("2 ↑")
        branches.output.includes("Failed")
        branches.output.includes("!1 Expand and collapse rows (IRON-3)")
        tags.output.includes("IRON/v0.1")
        tags.output.includes("The first preview")
        activity.output.includes("Push log")
        settings.output.includes("Branch rules")
        settings.output.includes("1 approval")
        joeSettings.output.includes("changed by its maintainers")
        !joeSettings.output.includes("Branch rules")
        bobAcme.output.includes("is not available")
        nothing.output.includes("Nothing is at no/such/thing")
    },
})

feature("a branch and a tag made, the tag linked to the release, then both deleted; a member who is not a lead may not delete", {
    when() {
        const made = as("joe.developer", () => post("Code/RepositoryDetail/Branches/createBranch", { repositoryId: "iron", refName: "bt-branch", revision: "main" }))
        const joeDelete = as("joe.developer", () => post("Code/RepositoryDetail/Branches/deleteBranch", { repositoryId: "iron", refName: "bt-branch" }))
        const tag = post("Code/RepositoryDetail/Tags/createTag", { repositoryId: "iron", refName: "bt-tag", revision: "main", message: "A test tag" })
        const link = post("Code/RepositoryDetail/Tags/linkTag", { repositoryId: "iron", refName: "refs/tags/bt-tag", workEffortId: "IRON-REL-1" })
        settle()
        const linked = sys(() => ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition({ workEffortId: "IRON-REL-1", repositoryId: "iron", refName: "refs/tags/bt-tag" }).one())
        const unlink = post("Code/RepositoryDetail/Tags/unlinkTag", { repositoryId: "iron", refName: "refs/tags/bt-tag", workEffortId: "IRON-REL-1" })
        const tagGone = post("Code/RepositoryDetail/Tags/deleteTag", { repositoryId: "iron", refName: "bt-tag" })
        const branchGone = post("Code/RepositoryDetail/Branches/deleteBranch", { repositoryId: "iron", refName: "bt-branch" })
        const defaultGone = post("Code/RepositoryDetail/Branches/deleteBranch", { repositoryId: "iron", refName: "main" })
        settle()
        return { made, joeDelete, tag, link, linked, unlink, tagGone, branchGone, defaultGone, branches: refNames("iron", "branch"), tags: refNames("iron", "tag") }
    },
    then({ made, joeDelete, tag, link, linked, unlink, tagGone, branchGone, defaultGone, branches, tags }) {
        made.errors == ""
        joeDelete.errors.includes("delete")
        tag.errors == ""
        link.errors == ""
        linked != null
        linked.linkSourceEnumId == "WglsExplicit"
        unlink.errors == ""
        tagGone.errors == ""
        branchGone.errors == ""
        defaultGone.errors != ""
        !branches.includes("bt-branch")
        branches.includes("main")
        !tags.includes("bt-tag")
    },
})

feature("Compare: the demo's merge request branch, and a new branch's merge request opened with its work items linked", {
    when() {
        const open = render("apps/Projects/Code/Compare", { repositoryId: "iron", head: "IRON-3-expand-collapse" })
        // a branch named for IRON-4 with a commit, as joe
        sys(() => call("org.moqui.impl.GitServices.create#GitRef", { repositoryId: "iron", refName: "IRON-4-bt-drag", refType: "branch" }))
        sys(() => {
            call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: "iron", branch: "IRON-4-bt-drag" })
            try { call("org.moqui.impl.GitServices.commit#GitFiles", { repositoryId: "iron", message: "Drag a row onto another", fileMap: { "src/drag.js": "export const drop = () => null\n" } }) }
            finally { call("org.moqui.impl.GitServices.update#GitRepository", { repositoryId: "iron", branch: "main" }) }
        })
        settle()
        const fresh = as("joe.developer", () => render("apps/Projects/Code/Compare", { repositoryId: "iron", head: "IRON-4-bt-drag" }))
        const info = as("joe.developer", () => sys(() => call("ironstone.projects.CodeServices.get#CompareInfo", { repositoryId: "iron", head: "IRON-4-bt-drag" })))
        const opened = as("joe.developer", () => post("Code/Compare/openMergeRequest", { repositoryId: "iron", sourceRef: "IRON-4-bt-drag", targetRef: "main",
            title: "BT Drag to re-parent (IRON-4)", description: "Closes IRON-4", reviewerUserIds: "EX_JOHN_DOE", completeItems: "Y" }))
        const again = as("joe.developer", () => post("Code/Compare/openMergeRequest", { repositoryId: "iron", sourceRef: "IRON-4-bt-drag", targetRef: "main",
            title: "BT twice" }))
        const mr = sys(() => ec.entity.find("moqui.resource.GitMergeRequest").condition({ repositoryId: "iron", sourceRef: "IRON-4-bt-drag" }).one())
        const links = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortGitMergeRequest").condition("mergeRequestId", mr?.mergeRequestId || "_NA_").list()))
        const after = as("joe.developer", () => render("apps/Projects/Code/Compare", { repositoryId: "iron", head: "IRON-4-bt-drag" }))
        return { open, fresh, info, opened, again, mr, links, after }
    },
    then({ open, fresh, info, opened, again, mr, links, after }) {
        open.status == 200
        !open.broken
        open.output.includes("Able to merge")
        open.output.includes("is open for these branches")
        !open.output.includes("NewMergeRequest")
        fresh.status == 200
        !fresh.broken
        fresh.output.includes("NewMergeRequest")
        fresh.output.includes("src/drag.js")
        info.defaults.title == "Drag to re-parent (IRON-4)"
        info.defaults.description == "Closes IRON-4"
        info.defaults.reviewerUserIds.includes("EX_JOHN_DOE")
        opened.errors == ""
        again.errors.includes("already open")
        mr != null
        mr.statusId == "GmrOpen"
        links.map((link) => link.workEffortId) == ["IRON-4"]
        links[0].completeOnMerge == "Y"
        after.output.includes("is open for these branches")
    },
})

feature("CommitDetail: the commit with its work item, checks and diff; a work item linked and unlinked by hand", {
    when() {
        const head = sys(() => call("org.moqui.impl.GitServices.get#GitLog", { repositoryId: "iron", limit: 1 }).commitList[0].commitId)
        const page = render("apps/Projects/Code/CommitDetail", { repositoryId: "iron", commitId: head })
        const linked = post("Code/CommitDetail/linkItem", { repositoryId: "iron", commitId: head, workEffortId: "IRON-10" })
        const withItem = sys(() => ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition({ workEffortId: "IRON-10", repositoryId: "iron", commitId: head }).one())
        const unlinked = post("Code/CommitDetail/unlinkItem", { repositoryId: "iron", commitId: head, workEffortId: "IRON-10" })
        const bad = post("Code/CommitDetail/linkItem", { repositoryId: "iron", commitId: head, workEffortId: "ACME-1x" })
        const bobAcme = as("bob.developer", () => render("apps/Projects/Code/CommitDetail", { repositoryId: "acme-portal", commitId: "main" }))
        return { page, linked, withItem, unlinked, bad, bobAcme,
            gone: sys(() => ec.entity.find("mantle.work.effort.WorkEffortGitCommit").condition({ workEffortId: "IRON-10", repositoryId: "iron", commitId: head }).count()) }
    },
    then({ page, linked, withItem, unlinked, bad, bobAcme, gone }) {
        page.status == 200
        !page.broken
        page.output.includes("IRON-3 Expand and collapse rows")
        !page.output.includes("Moqui-User-Id")
        page.output.includes("ci/build")
        page.output.includes("IRON-3")
        page.output.includes("src/tree.js")
        page.output.includes("moqui-diff")
        linked.errors == ""
        withItem != null
        unlinked.errors == ""
        gone == 0
        bad.errors.includes("not found")
        bobAcme.output.includes("is not available")
    },
})

feature("Git access: an SSH key added and removed, an access token made and revoked", {
    when() {
        const page = as("joe.developer", () => render("apps/Projects/Code/GitAccess"))
        const added = as("joe.developer", () => post("Code/GitAccess/addSshKey", { publicKey: SSH_KEY, description: "BT laptop" }))
        const keys = sys(() => Array.from(ec.entity.find("moqui.security.UserSshKey").condition({ userId: "ORG_ZIZI_JD", description: "BT laptop" })
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
        const removed = as("joe.developer", () => post("Code/GitAccess/deleteSshKey", { sshKeyId: keys[0]?.sshKeyId || "_NA_" }))
        const token = as("joe.developer", () => post("Code/GitAccess/createAccessToken", { description: "BT token", expireDays: "5" }))
        const tokens = sys(() => Array.from(ec.entity.find("moqui.security.UserLoginKey").condition({ userId: "ORG_ZIZI_JD", description: "BT token" })
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
        const revoked = as("joe.developer", () => post("Code/GitAccess/revokeAccessToken", { loginKey: tokens[0]?.loginKey || "_NA_" }))
        const left = sys(() => ec.entity.find("moqui.security.UserLoginKey").condition({ userId: "ORG_ZIZI_JD", description: "BT token" })
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).count())
        const account = as("joe.developer", () => render("apps/Commons/Settings/Account"))
        return { page, added, keys, removed, token, tokens, revoked, left, account }
    },
    then({ page, added, keys, removed, token, tokens, revoked, left, account }) {
        page.status == 200
        !page.broken
        page.output.includes("How to clone")
        page.output.includes("git config --global user.email")
        added.errors == ""
        keys.length == 1
        removed.errors == ""
        token.errors == ""
        tokens.length == 1
        revoked.errors == ""
        left == 0
        account.output.includes("Git and API access")
        account.output.includes("/qapps/Projects/Code/GitAccess")
    },
})

feature("Code settings: the repository defaults and conventions saved by a manager and refused to the team; SSH access granted and revoked", {
    when() {
        const page = render("apps/Projects/Settings/Code")
        const saved = post("Settings/Code/saveDefaults", { storage: "db", branch: "trunk", mergeMethod: "GmmSquash", protectDefault: "Y", approvals: "2" })
        const conventions = post("Settings/Code/saveConventions", { keywordComplete: "Y", branchPattern: "<KEY>-<n>-<words>", mergeRequestMoves: "Y" })
        const badPattern = post("Settings/Code/saveConventions", { branchPattern: "feature-<words>" })
        const teamRefused = as("bob.developer", () => sys(() => {
            const out = ec.service.sync().name("ironstone.projects.CodeServices.store#RepositoryDefaults").parameters({ storage: "local" }).call()
            const errors = ec.message.getErrorsString(); ec.message.clearErrors(); return errors
        }))
        const granted = post("Settings/Code/setSsh", { userGroupId: "BOSS_PROJECT_CLIENT", grant: "Y" })
        const holds = sys(() => ec.entity.find("moqui.security.UserGroupPermission").condition({ userGroupId: "BOSS_PROJECT_CLIENT", userPermissionId: "SSH_GIT" })
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).count())
        const revoked = post("Settings/Code/setSsh", { userGroupId: "BOSS_PROJECT_CLIENT", grant: "N" })
        const adminRefused = post("Settings/Code/setSsh", { userGroupId: "ADMIN", grant: "N" })
        const defaults = sys(() => call("mantle.work.GitServices.get#RepositoryDefaults", { organizationPartyId: "ORG_ZIZI_SERVICES" }).defaults)
        return { page, saved, conventions, badPattern, teamRefused, granted, holds, revoked, adminRefused, defaults,
            after: sys(() => ec.entity.find("moqui.security.UserGroupPermission").condition({ userGroupId: "BOSS_PROJECT_CLIENT", userPermissionId: "SSH_GIT" })
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).count()) }
    },
    then({ page, saved, conventions, badPattern, teamRefused, granted, holds, revoked, adminRefused, defaults, after }) {
        page.status == 200
        !page.broken
        page.output.includes("Repository defaults")
        page.output.includes("SSH access")
        saved.errors == ""
        defaults.storage == "db"
        defaults.branch == "trunk"
        defaults.mergeMethod == "GmmSquash"
        defaults.protectDefault == "Y"
        defaults.approvals == 2
        conventions.errors == ""
        badPattern.errors.includes("names the work item")
        teamRefused.includes("Only project managers")
        granted.errors == ""
        holds == 1
        revoked.errors == ""
        after == 0
        adminRefused.errors.includes("does not change here")
    },
})

feature("ProjectCode: IRON's repositories, open merge request, recent commits and tags; the palette's Code group; the raw file", {
    when() {
        const tab = render("apps/Projects/Projects/ProjectDetail/Code", { workEffortId: "IRON" })
        const hire = render("apps/Projects/Projects/ProjectDetail/Code", { workEffortId: "HIRE" })
        const palette = sys(() => call("ironstone.projects.CodeServices.search#CodePalette", { text: "iron" }).rows)
        const byNumber = sys(() => call("ironstone.projects.CodeServices.search#CodePalette", { text: "!1" }).rows)
        const raw = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/Code/RepositoryDetail/Files/raw", { repositoryId: "iron", path: "README.md" }, null)
        const rawBob = as("bob.developer", () => ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/Code/RepositoryDetail/Files/raw",
            { repositoryId: "acme-portal", path: "README.md" }, null))
        ec.message.clearErrors()
        return { tab, hire, palette, byNumber, rawText: String(raw.output || ""), rawBobText: String(rawBob.output || ""), rawBobStatus: rawBob.status }
    },
    then({ tab, hire, palette, byNumber, rawText, rawBobText, rawBobStatus }) {
        tab.status == 200
        !tab.broken
        tab.output.includes("iron")
        tab.output.includes("Expand and collapse rows (IRON-3)")
        tab.output.includes("IRON/v0.1")
        tab.output.includes("Board grouped by assignee")
        hire.status == 200
        hire.output.includes("The Code module is off")
        palette.some((row) => row.title == "iron" && row.url.includes("RepositoryDetail?repositoryId=iron"))
        byNumber.some((row) => row.title.startsWith("!1 ") && row.url.includes("MergeRequestDetail"))
        rawText.includes("# IronStone Projects")
        !rawBobText.includes("Acme customer portal")
    },
})
