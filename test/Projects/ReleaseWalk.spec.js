// The usable-when walk of IronStone Projects P4b (impl-projects.md P4b; design-projects.md §4 Roadmap, MilestoneDetail,
// ReleaseDetail, ProjectRoadmap and ProjectDocs) through the screens' transitions, with authorization on: in a project of its
// own (RLW, members only, john.doe its manager and joe.developer a programmer, with the repository rlw-walk), joe makes a
// release and a milestone on the project's Roadmap tab and puts work items in them on their details; john sets up the project's
// documentation in the repository on its Docs tab (joe may not); joe generates the release's notes, saves them and publishes
// them to the docs space and CHANGELOG.md, reads the page on the Docs tab, and releases the release with a tag, its unfinished
// item taken out. bob.developer, not on the project, sees none of it: not on the Roadmap, not the release, not the docs page.
// The project is cancelled and the repository archived after, so the other specs' lists keep their records.
// Run: ./moq test mr-boss --spec ReleaseWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "RLW"
const REPO = "rlw-walk"

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    const messages = str.messages ? Array.from(str.messages) : []
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), output, json: parsed, messages }
}
function json(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render(path.startsWith("Commons/") ? "apps/" + path : "apps/Projects/" + path, parameters || {}, null)
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
function settle() {
    const started = Date.now()
    while (Date.now() - started < 20000) {
        const busy = sys(() => ec.entity.find("moqui.resource.GitUpdate").condition("repositoryId", REPO).condition("ecaStatus", "in", ["pending", "running"]).count())
        if (busy == 0) return
        sys(() => call("org.moqui.impl.GitServices.process#PendingGitUpdates", {}))
    }
}
const we = (id) => sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", id).one())
const releaseOf = (id) => sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortAssoc").condition("toWorkEffortId", id)
        .condition("workEffortAssocTypeEnumId", "WeatRelease").conditionDate("fromDate", "thruDate", null).list()).map((row) => row.workEffortId))
const text = (location) => sys(() => ec.resource.getLocationReference(location).exists ? ec.resource.getLocationReference(location).getText() : null)
let wikiSpaceId

spec({
    stepwise: true,
    requires: ["git"],
    setupSpec() {
        login("john.doe")
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Release walk" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId, roleTypeId }).count())
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: ec.user.nowTimestamp, statusId: "WeptAssigned" })
            }
            call("mantle.work.ProjectServices.store#ProjectSetting", { workEffortId: PROJECT, settingTypeEnumId: "WstModules", settingValue: "code,docs" })
            call("mantle.work.GitServices.create#ProjectRepository", { workEffortId: PROJECT, repositoryId: REPO, repositoryKind: "db",
                description: "The release walk", applyDefaults: false })
            call("org.moqui.impl.GitServices.commit#GitFiles", { repositoryId: REPO, message: "Start the walk", fileMap: {
                "README.md": "# The release walk\n", "src/app.js": "export const version = '1.0'\n" } })
            const task = (name, purposeEnumId) => call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortName: name, purposeEnumId }).workEffortId
            task("Sign in with a passkey", "WepNewFeature")
            task("The menu closes on phones", "WepFix")
            task("Export to CSV", "WepFeatureEnhance")
            for (const id of ["RLW-1", "RLW-2"]) {
                call("mantle.work.TaskServices.set#TaskStatus", { workEffortId: id, statusId: "WeInProgress" })
                call("mantle.work.TaskServices.set#TaskStatus", { workEffortId: id, statusId: "WeComplete" })
            }
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

feature("joe makes a release and a milestone on the project's Roadmap tab; bob, not on the project, may not, and sees neither", {
    when() {
        const release = as("joe.developer", () => post("Projects/ProjectDetail/Roadmap/savePlanItem", { workEffortId: PROJECT, kind: "release",
            workEffortName: "1.0", dueDay: "2026-12-11", description: "The first release of the walk." }))
        const milestone = as("joe.developer", () => post("Projects/ProjectDetail/Roadmap/savePlanItem", { workEffortId: PROJECT, kind: "milestone",
            workEffortName: "Beta", dueDay: "2026-11-27" }))
        const due = as("joe.developer", () => post("Projects/ProjectDetail/Roadmap/updateField", { workEffortId: PROJECT, planWorkEffortId: "RLW-MS-1",
            field: "due", value: "2026-11-20" }))
        const tab = as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Roadmap", { workEffortId: PROJECT, list: "all" }))
        const bobMakes = as("bob.developer", () => post("Projects/Roadmap/savePlanItem", { rootWorkEffortId: PROJECT, kind: "milestone", workEffortName: "Sneaky" }))
        const bobRoadmap = as("bob.developer", () => render("apps/Projects/Projects/Roadmap", { list: "all" }))
        return { release, milestone, due, tab, bobMakes, bobRoadmap, rel: we("RLW-REL-1"), ms: we("RLW-MS-1"),
            sneaky: sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition({ rootWorkEffortId: PROJECT, workEffortName: "Sneaky" }).count()) }
    },
    then({ release, milestone, due, tab, bobMakes, bobRoadmap, rel, ms, sneaky }) {
        release.errors == ""
        milestone.errors == ""
        rel.workEffortTypeEnumId == "WetRelease"
        rel.workEffortName == "1.0"
        ms.workEffortName == "Beta"
        due.json.valueText.includes("Nov 20, 2026")
        tab.status == 200
        !tab.broken
        tab.output.includes("RLW-REL-1")
        tab.output.includes("RLW-MS-1")
        bobMakes.errors.includes("not available") || bobMakes.errors.includes("not on the team")
        sneaky == 0
        !bobRoadmap.output.includes("RLW-REL-1")
    },
})

feature("joe puts the work items in the release on ReleaseDetail, by type; one taken out of the milestone comes back", {
    when() {
        const added = as("joe.developer", () => post("Projects/ReleaseDetail/addItems", { workEffortId: "RLW-REL-1", itemWorkEffortIds: "RLW-1,RLW-2,RLW-3" }))
        const toMilestone = as("joe.developer", () => post("Projects/MilestoneDetail/addItems", { workEffortId: "RLW-MS-1", itemWorkEffortIds: "RLW-3" }))
        const removed = as("joe.developer", () => post("Projects/MilestoneDetail/removeItem", { workEffortId: "RLW-MS-1", itemWorkEffortId: "RLW-3" }))
        const candidates = as("joe.developer", () => json("Projects/MilestoneDetail/searchItems", { workEffortId: "RLW-MS-1", term: "csv" }))
        const detail = as("joe.developer", () => render("apps/Projects/Projects/ReleaseDetail", { workEffortId: "RLW-REL-1" }))
        const milestone = as("joe.developer", () => render("apps/Projects/Projects/MilestoneDetail", { workEffortId: "RLW-MS-1" }))
        return { added, toMilestone, removed, candidates, detail, milestone, releases: ["RLW-1", "RLW-2", "RLW-3"].map(releaseOf) }
    },
    then({ added, toMilestone, removed, candidates, detail, milestone, releases }) {
        added.errors == ""
        toMilestone.errors == ""
        removed.errors == ""
        releases == [["RLW-REL-1"], ["RLW-REL-1"], ["RLW-REL-1"]]
        candidates.json.some((option) => option.value == "RLW-3")
        detail.status == 200
        !detail.broken
        detail.output.includes("ReleaseStatusBar")
        detail.output.includes("Sign in with a passkey")
        detail.output.includes("Features")
        detail.output.includes("Fixes")
        milestone.status == 200
        !milestone.broken
        milestone.output.includes("MilestoneStatusBar")
    },
})

feature("john sets up the project's documentation in its repository on the Docs tab; joe, not managing it, may not", {
    when() {
        const before = as("joe.developer", () => json("Projects/ProjectDetail/Docs/setup", { workEffortId: PROJECT }))
        const joeSets = as("joe.developer", () => post("Projects/ProjectDetail/Docs/setupProjectDocs", { workEffortId: PROJECT, storage: "repository", repositoryId: REPO }))
        const made = post("Projects/ProjectDetail/Docs/setupProjectDocs", { workEffortId: PROJECT, storage: "repository", repositoryId: REPO })
        settle()
        wikiSpaceId = made.json?.wikiSpaceId
        const after = as("joe.developer", () => json("Projects/ProjectDetail/Docs/setup", { workEffortId: PROJECT }))
        const tab = as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Docs", { workEffortId: PROJECT }, "qvue"))
        return { before, joeSets, made, after, tab, home: text(`git://${REPO}/docs/${wikiSpaceId}.md`) }
    },
    then({ before, joeSets, made, after, tab, home }) {
        before.json.project.wikiSpaceId == null
        before.json.project.canSetup == false
        joeSets.errors.length > 0
        made.errors == ""
        wikiSpaceId == "RLW"
        after.json.spaceList.map((space) => space.wikiSpaceId) == ["RLW"]
        after.json.project.storageText.includes(REPO)
        after.json.project.canUpdate == true
        tab.status == 200
        tab.output.includes("module.exports")
        home.includes("Release walk documentation")
    },
})

feature("joe generates the release notes, saves them, and publishes them to the docs space and CHANGELOG.md; the Docs tab shows the page", {
    when() {
        const generated = as("joe.developer", () => post("Projects/ReleaseDetail/saveNotes", { workEffortId: "RLW-REL-1", generate: "Y" }))
        const draft = sys(() => call("mantle.work.ProjectServices.get#ReleaseNotes", { workEffortId: "RLW-REL-1" }).notesText)
        const saved = as("joe.developer", () => post("Projects/ReleaseDetail/saveNotes", { workEffortId: "RLW-REL-1", notesText: draft + "\nUpgrade with ./moq load.\n" }))
        const published = as("joe.developer", () => post("Projects/ReleaseDetail/saveNotes", { workEffortId: "RLW-REL-1", publish: "Y", toDocs: "Y", toChangelog: "Y", repositoryId: REPO }))
        settle()
        const page = as("joe.developer", () => json("Projects/ProjectDetail/Docs/page", { workEffortId: PROJECT, wikiSpaceId, pagePath: "Releases/1.0" }))
        const bobPage = as("bob.developer", () => json("Projects/ProjectDetail/Docs/page", { workEffortId: PROJECT, wikiSpaceId, pagePath: "Releases/1.0" }))
        const detail = as("joe.developer", () => render("apps/Projects/Projects/ReleaseDetail", { workEffortId: "RLW-REL-1" }))
        return { generated, draft, saved, published, page, bobPage, detail, file: text(`git://${REPO}/docs/${wikiSpaceId}/Releases/1.0.md`),
            changelog: text(`git://${REPO}/CHANGELOG.md`) }
    },
    then({ generated, draft, saved, published, page, bobPage, detail, file, changelog }) {
        generated.errors == ""
        draft.startsWith("The first release of the walk.")
        draft.includes("### Features\n\n- **RLW-1** Sign in with a passkey")
        draft.includes("### Fixes\n\n- **RLW-2** The menu closes on phones")
        !draft.includes("Export to CSV")
        saved.errors == ""
        published.errors == ""
        file.startsWith("# Release walk 1.0")
        file.includes("Upgrade with ./moq load.")
        changelog.startsWith("# Changelog\n\n## 1.0 - 2026-12-11")
        page.json.page.text.includes("Upgrade with ./moq load.")
        !bobPage.json?.page
        detail.output.includes("Releases/1.0")
    },
})

feature("joe releases 1.0: a tag v1.0 at main, the unfinished item out of any release, the release complete", {
    when() {
        const released = as("joe.developer", () => post("Projects/ReleaseDetail/releaseRelease", { workEffortId: "RLW-REL-1", moveUnfinishedTo: "none",
            createTag: "Y", repositoryId: REPO, tagName: "v1.0", revision: "main", publishDocs: "Y", notify: "N" }))
        settle()
        const detail = as("joe.developer", () => render("apps/Projects/Projects/ReleaseDetail", { workEffortId: "RLW-REL-1" }))
        const roadmap = as("joe.developer", () => render("apps/Projects/Projects/Roadmap", { list: "completed", kind: "release" }))
        const link = sys(() => call("ironstone.commons.PaletteServices.get#RecordLink", { recordEntityName: "mantle.work.effort.WorkEffort", id: "RLW-REL-1" }))
        const msLink = sys(() => call("ironstone.commons.PaletteServices.get#RecordLink", { recordEntityName: "mantle.work.effort.WorkEffort", id: "RLW-MS-1" }))
        return { released, detail, roadmap, link, msLink, release: we("RLW-REL-1"), open: releaseOf("RLW-3"),
            refs: sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortGitRef").condition({ workEffortId: "RLW-REL-1", repositoryId: REPO }).list()).map((row) => row.refName)) }
    },
    then({ released, detail, roadmap, link, msLink, release, open, refs }) {
        released.errors == ""
        release.statusId == "WeComplete"
        release.actualCompletionDate != null
        open == []
        refs.includes("refs/tags/v1.0")
        detail.output.includes("v1.0")
        !detail.output.includes("ReleaseReleaseDialog")
        roadmap.output.includes("RLW-REL-1")
        link.url == "/qapps/Projects/Projects/ReleaseDetail?workEffortId=RLW-REL-1"
        msLink.url == "/qapps/Projects/Projects/MilestoneDetail?workEffortId=RLW-MS-1"
    },
})

feature("the demo's IRON: its Roadmap tab with the sprints, its Docs tab with the space in the repository iron and a linked page", {
    when() {
        const roadmap = render("apps/Projects/Projects/ProjectDetail/Roadmap", { workEffortId: "IRON", list: "all", kind: "all" })
        const sprints = render("apps/Projects/Projects/ProjectDetail/Roadmap", { workEffortId: "IRON", list: "all", kind: "sprint" })
        const docs = json("Projects/ProjectDetail/Docs/setup", { workEffortId: "IRON" })
        const page = json("Projects/ProjectDetail/Docs/page", { workEffortId: "IRON", wikiSpaceId: "IRON", pagePath: "Getting started" })
        return { roadmap, sprints, docs, page }
    },
    then({ roadmap, sprints, docs, page }) {
        roadmap.status == 200
        !roadmap.broken
        roadmap.output.includes("General availability")
        roadmap.output.includes("IRON-REL-2")
        sprints.output.includes("Sprint 2")
        docs.json.project.wikiSpaceId == "IRON"
        docs.json.project.storageText.includes("iron")
        docs.json.project.linkedList.some((linked) => linked.spaceName == "Engineering notes")
        page.json.page.text.includes("Getting started")
    },
})
