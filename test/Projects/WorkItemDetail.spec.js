// Projects WorkItemDetail (screen/Shared/WorkItemDetail.xml at Projects/WorkItems/WorkItemDetail, service/ironstone/projects/WorkItemServices.xml
// get#WorkItemDetail; design-projects.md §5 WorkItemDetail; impl-projects.md P2) on the Projects demo
// (data/BossProjectsDemoData.xml): the item's path, key and the stages of the development flow, the facts with the roll-up,
// plan items and labels, the tabs, the Development tab on the code demo (IRON-3's branch and merge request !1, MergeRequests.spec.js's
// demo); the compact render of the peek pane; the sub-item tree (a level, a move, a quick add);
// the links with a dependency's lag; the status along the flow with a resolution; the Edit dialog's fields, labels, Assign to
// me, the repeat rule and Stop repeating; Move to project with the subtree; who may see and change an item (Joe Developer on
// IRON's team, not on HIRE; impl-projects.md F1). The same screen in Commons keeps the Commons layout (Tasks.spec.js). The spec
// changes only the items it makes, so the demo stays for the specs after it. Authorization stays on.
// Run: ./moq test mr-boss --spec WorkItemDetail
const webroot = "component://webroot/screen/webroot.xml"
const projectsRoot = "component://mr-boss/screen/Projects.xml"
const made = {}

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(projectsRoot).render(path, parameters || {}, method || "post")
    const output = String(str.output || "")
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output }
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
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
const detail = (parameters) => render("apps/Projects/WorkItems/WorkItemDetail", parameters)
// the stages of the framework's status-bar: statusId to "state color"
const stagesOf = (output) => Object.fromEntries(Array.from(output.matchAll(/\{'statusId':'([^']+)','label':'(?:[^'\\]|\\.)*','color':'([^']*)','state':'(\w+)'\}/g))
        .map((match) => [match[1], match[3]]))
const transitionsOf = (output) => Object.fromEntries(Array.from(output.matchAll(/'label':'((?:[^'\\]|\\.)*)','color':'[^']*','isNext':(true|false),'isDanger':(true|false)/g))
        .map((match) => [match[1], match[2] === "true" ? "next" : match[3] === "true" ? "danger" : "other"]))

spec({
    setupSpec() { login("john.doe") },
})

feature("a work item renders with its path, key, the development flow's stages, the facts with the roll-up and its tabs", {
    when() {
        // Commons asked for the Development tab: it has none, so it opens on its overview
        return { three: detail({ workEffortId: "IRON-3" }), two: detail({ workEffortId: "IRON-2" }),
            commons: render("apps/Commons/Tasks/TaskDetail", { workEffortId: "IRON-3", tab: "development" }), acme: detail({ workEffortId: "ACME-6" }) }
    },
    then({ three, two, commons, acme }) {
        // a project on the Default flow: its work effort stages only (the Default flow holds every status type's moves)
        Object.keys(stagesOf(acme.output)).sort() == ["WeApproved", "WeComplete", "WeInPlanning", "WeInProgress"]
        acme.output.includes("Every week on Friday; next made on completion")
        three.status == 200
        three.errors == ""
        !three.broken
        // the path: the project, then the ancestors from the top
        three.output.includes("IronStone Projects")
        three.output.includes("IRON-1 Work items")
        three.output.includes("IRON-2 Work item tree view")
        three.output.includes("Expand and collapse rows")
        three.output.includes("m-workitem-key")
        // IRON is on the development flow: In Review is the current stage, In Testing next
        stagesOf(three.output).WeInReview == "current"
        stagesOf(three.output).WeInTesting == "todo"
        stagesOf(three.output).WeApproved == "done"
        Object.keys(transitionsOf(three.output)).includes("Test")
        // facts: the milestone, sprint, labels and the estimate
        three.output.includes("Beta")
        three.output.includes("Sprint 2")
        three.output.includes(">UI</q-chip>")
        three.output.includes("Assign to me")
        three.output.includes("Sub-items")
        three.output.includes("Links")
        three.output.includes('<m-chatter id="TaskChatter" record-entity="mantle.work.effort.WorkEffort" record-id="IRON-3"')
        three.output.includes('data-tab="development"')
        // a parent: its own estimate and the one with its sub-items
        two.output.includes("With sub-items")
        two.output.includes("14 h · 0/2 done")
        // the same item in Commons: the Commons layout, no path
        commons.status == 200
        commons.output.includes("TaskStatusBar")
        !commons.output.includes("m-workitem-key")
        !commons.output.includes("WorkItemBranches")
    },
})

feature("the Development tab on the code demo: IRON-3's branches and its merge request !1", {
    requires: ["git"],
    when() { return { development: detail({ workEffortId: "IRON-3", tab: "development" }) } },
    then({ development }) {
        development.status == 200
        !development.broken
        development.output.includes("WorkItemBranches")
        development.output.includes("!1 ")
    },
})

// A Smithy tracker for the issue features, made once: a site with a canonical host, a public repository with issues on (which
// makes its project), through Mantle's services as john.doe (the site's rows by its spec helpers, mr-mantle
// test/smithy/SmithySpecLib.js). An issue's task is a work item of that project.
function issueTracker() {
    if (made.tracker) return made.tracker
    const smithy = ec.resource.script("component://mr-mantle/test/smithy/SmithySpecLib.js")
    const key = Date.now().toString(36)
    const siteId = smithy.site("BWI" + key)
    smithy.make("mantle.public.PublicSiteHost", { hostname: "issues-" + key + ".boss.test", siteId, canonical: "Y" })
    smithy.make("mantle.public.PublicSiteParty", { siteId, partyId: ec.user.userAccount.partyId, state: "active", role: "owner", revision: 1 })
    const groupId = smithy.run("mantle.smithy.SmithyServices.create#Group", { siteId, pathSegment: "boss-issues", visibility: "public" }).groupId
    const repositoryId = smithy.run("mantle.smithy.SmithyServices.create#Repository", { siteId, groupId, slug: "code", visibility: "public", repositoryKind: "db" }).repositoryId
    smithy.run("mantle.smithy.SmithyServices.update#Repository", { input: { siteId, repositoryId, issuesEnabled: true,
        expectedRevision: Number(one("mantle.smithy.SmithyRepository", { repositoryId }).revision) } })
    const file = (title, more) => {
        const filed = smithy.run("mantle.smithy.SmithyIssueServices.create#Issue", { input: Object.assign({ siteId, repositoryId, title,
            body: "The text of " + title, operationId: "boss-wid-" + ec.user.randomString(12) }, more || {}) }).result
        return { issueNumber: filed.issueNumber, workEffortId: one("mantle.smithy.SmithyIssue", { repositoryId, issueNumber: filed.issueNumber }).workEffortId }
    }
    made.tracker = { smithy, siteId, repositoryId, file, projectId: one("mantle.smithy.SmithyRepository", { repositoryId }).workEffortId,
        url: "https://issues-" + key + ".boss.test/code/boss-issues/code/-/issues/" }
    return made.tracker
}

feature("a task that is an issue of a repository: its number with the public page's link, and the public conversation apart from Chatter", {
    requires: ["git"],
    when() {
        const tracker = issueTracker()
        const filed = tracker.file("Printer on fire")
        return { filed, page: detail({ workEffortId: filed.workEffortId }), url: tracker.url + filed.issueNumber }
    },
    then({ filed, page, url }) {
        page.status == 200
        page.errors == ""
        !page.broken
        // beside the key: the number in the repository, linked to the public page
        page.output.includes("m-workitem-key")
        page.output.includes("#" + filed.issueNumber)
        page.output.includes(url)
        // the outward conversation is its own box; Chatter stays for the internal notes
        page.output.includes("Public conversation")
        page.output.includes("The text of Printer on fire")
        page.output.includes('<m-chatter id="TaskChatter"')
        // its text is the issue's first post, so the Edit dialog does not offer the description
        page.output.includes("edit it on the issue")
    },
})

feature("a confidential issue's task is nowhere for the tracker's project manager (the list, its detail, Today, a time entry by its id, a commit's links) and there for a Smithy Owner and an administrator", {
    requires: ["git"],
    when() {
        const tracker = issueTracker()
        const secret = tracker.file("A hole in the wall", { confidential: true }).workEffortId
        // Joe Developer manages the tracker's project: in Smithy a project role is a Maintainer's at most, never an Owner's, and
        // the confidential issue's task is in the companion project, whose members are the Owners alone
        const joe = one("moqui.security.UserAccount", { username: "joe.developer" }).partyId
        tracker.smithy.make("mantle.work.effort.WorkEffortParty", { workEffortId: tracker.projectId, partyId: joe, roleTypeId: "Manager", fromDate: Date.now() - 1000 })
        // the services as the screens call them: the rule under test is the services' own, by the user
        const call = (name, parameters) => {
            const out = ec.service.sync().name(name).parameters(parameters).disableAuthz().call() || {}
            ec.message.clearErrors()
            return out
        }
        const look = () => ({
            manages: Array.from(call("mantle.work.ProjectServices.get#VisibleProjectInfo", {}).managedProjectIds || []).includes(tracker.projectId),
            list: Array.from(call("ironstone.projects.WorkItemServices.find#WorkItems", { list: "all", text: "hole in the wall", withCounts: false }).rowList || [])
                .some((row) => row.workEffortId === secret),
            detail: !!call("ironstone.commons.TaskServices.get#TaskAccess", { workEffortId: secret, need: "check", app: "projects" }).visible,
            today: JSON.stringify(call("ironstone.commons.CommonsServices.get#TodayView", {})).includes(secret),
            // a time entry asked for the task by its id: the item is offered, with its name, only to one who sees it
            time: Array.from(call("ironstone.projects.TimeServices.get#TimeEntryEdit", { workEffortId: secret }).edit?.itemOptions || [])
                .some((option) => option.value === secret || String(option.label).includes("hole in the wall")),
            link: !!(call("ironstone.projects.CodeServices.get#VisibleWorkEfforts", { workEffortIdList: [secret] }).effortMap || {})[secret],
        })
        const manager = as("joe.developer", look)
        // the same user made an Owner of the repository, as its Members tab makes one: Mantle puts him on the companion project
        tracker.smithy.make("mantle.public.PublicSiteParty", { siteId: tracker.siteId, partyId: joe, state: "active", role: "member", revision: 1 })
        tracker.smithy.make("mantle.public.PublicSiteProfile", { siteId: tracker.siteId, partyId: joe, handle: "joedev", displayName: "Joe", discoverability: "public", revision: 1 })
        tracker.smithy.run("mantle.smithy.SmithyServices.set#RepositoryMember", { input: { siteId: tracker.siteId, repositoryId: tracker.repositoryId, handle: "joedev", role: "owner" } })
        return { manager, owner: as("joe.developer", look), admin: look() }
    },
    then({ manager, owner, admin }) {
        // a manager of the tracker's project, and nothing of this task anywhere
        manager.manages == true
        manager.list == false
        manager.detail == false
        manager.today == false
        manager.time == false
        manager.link == false
        owner.list == true
        owner.detail == true
        owner.time == true
        owner.link == true
        admin.list == true
        admin.detail == true
        admin.link == true
    },
})

feature("in the terminal (tui) the work item and the work items list render as model documents with no error node", {
    when() {
        const tui = (path, parameters) => {
            const str = ec.screen.makeTest().rootScreen(projectsRoot).renderMode("tui").render(path, Object.assign({ lastStandalone: "-2" }, parameters || {}), null)
            const output = String(str.output || "")
            let doc = null
            try { doc = JSON.parse(output) } catch (err) { doc = null }
            ec.message.clearErrors()
            return { status: str.status, errors: str.errorMessages.join(" | "), v: doc ? doc.v : null, errorNodes: (output.match(/"t":\s*"error"/g) || []).length, output }
        }
        return { detail: tui("WorkItems/WorkItemDetail", { workEffortId: "IRON-3" }), subItems: tui("WorkItems/WorkItemDetail", { workEffortId: "IRON-1", tab: "subitems" }),
            list: tui("WorkItems/List", { rootWorkEffortId: "IRON" }) }
    },
    then({ detail, subItems, list }) {
        detail.status == 200
        detail.errors == ""
        detail.v == 1
        detail.errorNodes == 0
        detail.output.includes("IRON-3")
        subItems.v == 1
        subItems.errorNodes == 0
        list.v == 1
        list.errorNodes == 0
        list.output.includes("Write the getting started guide")
    },
})

feature("in the peek pane it renders compact: the title row, the facts, then the description, sub-items and Chatter without tabs", {
    when() { return { peek: detail({ workEffortId: "IRON-2", peek: "true" }) } },
    then({ peek }) {
        peek.status == 200
        peek.errors == ""
        peek.output.includes("WorkItemPeekChatter")
        peek.output.includes("PeekSubItemList")
        peek.output.includes("IRON-3")
        !peek.output.includes("m-task-tabs")
        !peek.output.includes("m-workitem-path")
    },
})

feature("the sub-items tab: the subtree as a tree with roll-ups, a level as JSON, a quick add under the item and a move within it", {
    allowMessageErrors: true,
    when() {
        const tab = detail({ workEffortId: "IRON-1", tab: "subitems" })
        const level = post("WorkItems/WorkItemDetail/subItemLevel", { workEffortId: "IRON-1", parentWorkEffortId: "IRON-2" }, "get")
        const added = post("WorkItems/WorkItemDetail/addSubItem", { workEffortId: "IRON-2", workEffortName: "BOSS_TEST Sub-item", purposeEnumId: "WepTask",
            estimatedWorkTime: "2" })
        const item = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST Sub-item" })[0] || null
        made.sub = item ? item.workEffortId : null
        // within the subtree of IRON-1: under IRON-5 (a sibling of IRON-2), then back to IRON-2 first
        const moved = post("WorkItems/WorkItemDetail/moveSubItem", { workEffortId: "IRON-1", subItemId: made.sub, parentWorkEffortId: "IRON-5", previousSiblingId: "" })
        const underFive = one("mantle.work.effort.WorkEffort", { workEffortId: made.sub }).parentWorkEffortId
        const toTop = post("WorkItems/WorkItemDetail/moveSubItem", { workEffortId: "IRON-1", subItemId: made.sub, parentWorkEffortId: "", previousSiblingId: "IRON-2" })
        const atTop = one("mantle.work.effort.WorkEffort", { workEffortId: made.sub }).parentWorkEffortId
        return { tab, level, added, item, moved, underFive, toTop, atTop }
    },
    then({ tab, level, added, item, moved, underFive, toTop, atTop }) {
        tab.status == 200
        tab.errors == ""
        tab.output.includes("Add a sub-item")
        tab.output.includes("'parentField':'parentWorkEffortId'")
        tab.output.includes("Work item tree view")
        tab.output.includes("Board grouped by assignee")
        level.json.subItemList.map((row) => row.subItemId) == ["IRON-3", "IRON-4"]
        level.json.subItemList[0].parentWorkEffortId == "IRON-2"
        added.errors == ""
        item.parentWorkEffortId == "IRON-2"
        item.rootWorkEffortId == "IRON"
        moved.errors == ""
        underFive == "IRON-5"
        toTop.errors == ""
        // the top of the subtree is the item shown
        atTop == "IRON-1"
    },
})

feature("the links tab: IRON-4 is blocked by IRON-3 a day after it; a link added and removed", {
    allowMessageErrors: true,
    when() {
        const four = detail({ workEffortId: "IRON-4", tab: "links" })
        const three = detail({ workEffortId: "IRON-3", tab: "links" })
        const added = post("WorkItems/WorkItemDetail/addLink", { workEffortId: made.sub, kind: "relatesTo", otherWorkEffortId: "IRON-9" })
        const self = post("WorkItems/WorkItemDetail/addLink", { workEffortId: made.sub, kind: "relatesTo", otherWorkEffortId: made.sub })
        const linked = current("mantle.work.effort.WorkEffortAssoc", { workEffortId: made.sub, workEffortAssocTypeEnumId: "WeatRelatesTo" }).map((row) => row.toWorkEffortId)
        const removed = post("WorkItems/WorkItemDetail/removeLink", { workEffortId: made.sub, fromWorkEffortId: made.sub, toWorkEffortId: "IRON-9",
            workEffortAssocTypeEnumId: "WeatRelatesTo" })
        return { four, three, added, self, linked, removed,
            left: current("mantle.work.effort.WorkEffortAssoc", { workEffortId: made.sub, workEffortAssocTypeEnumId: "WeatRelatesTo" }).length }
    },
    then({ four, three, added, self, linked, removed, left }) {
        four.status == 200
        four.output.includes("Blocked by")
        four.output.includes("IRON-3 Expand and collapse rows")
        three.output.includes("Blocks")
        three.output.includes("IRON-4 Drag to re-parent")
        added.errors == ""
        linked == ["IRON-9"]
        self.errors.includes("not linked to itself")
        removed.errors == ""
        left == 0
    },
})

feature("the status along the flow from the status-bar: a skip refused, review, then complete with a resolution", {
    allowMessageErrors: true,
    when() {
        const id = made.sub
        const skip = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: id, toStatusId: "WeInReview" })
        const begun = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: id, toStatusId: "WeInProgress" })
        const review = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: id, toStatusId: "WeInReview" })
        const shown = detail({ workEffortId: id }).output
        const completed = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: id, toStatusId: "WeComplete", resolutionEnumId: "WerDuplicate" })
        const after = one("mantle.work.effort.WorkEffort", { workEffortId: id })
        const reopened = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: id, toStatusId: "WeInProgress" })
        return { skip, begun, review, shown, completed, after, reopened, reopenedRow: one("mantle.work.effort.WorkEffort", { workEffortId: id }) }
    },
    then({ skip, begun, review, shown, completed, after, reopened, reopenedRow }) {
        skip.errors.includes("Status change not allowed from In Planning to In Review")
        begun.errors == ""
        review.errors == ""
        stagesOf(shown).WeInReview == "current"
        completed.errors == ""
        after.statusId == "WeComplete"
        after.resolutionEnumId == "WerDuplicate"
        reopened.errors == ""
        reopenedRow.statusId == "WeInProgress"
        reopenedRow.resolutionEnumId == "WerUnresolved"
    },
})

feature("the Edit dialog saves the fields that changed (estimate, milestone, parent); labels, Assign to me and Watch", {
    allowMessageErrors: true,
    when() {
        const id = made.sub
        const saved = post("WorkItems/WorkItemDetail/saveWorkItem", { workEffortId: id, workEffortName: "BOSS_TEST Sub-item renamed", purposeEnumId: "WepFix",
            priority: "3", visibilityEnumId: "WevGeneral", estimatedStartDate: "", estimatedCompletionDate: "2026-12-04", estimatedWorkTime: "5", remainingWorkTime: "4",
            estimatedPoints: "3", parentWorkEffortId: "IRON-6", milestoneId: "IRON-MS-1", releaseId: "", componentId: "", description: "Some **markdown**" })
        const badParent = post("WorkItems/WorkItemDetail/saveWorkItem", { workEffortId: id, parentWorkEffortId: "ACME-1" })
        const label = post("WorkItems/WorkItemDetail/addLabel", { workEffortId: id, labelId: "BOSS_DEMO_LBL_UI" })
        const labels = all("mantle.work.effort.WorkEffortCategoryAppl", { workEffortId: id }).map((row) => row.workEffortCategoryId)
        const unlabel = post("WorkItems/WorkItemDetail/removeLabel", { workEffortId: id, labelId: "BOSS_DEMO_LBL_UI" })
        const mine = post("WorkItems/WorkItemDetail/assignToMe", { workEffortId: id })
        const watched = post("WorkItems/WorkItemDetail/watch", { workEffortId: id })
        const shown = detail({ workEffortId: id }).output
        return { saved, badParent, label, labels, unlabel, mine, watched, shown, item: one("mantle.work.effort.WorkEffort", { workEffortId: id }),
            milestones: current("mantle.work.effort.WorkEffortAssoc", { toWorkEffortId: id, workEffortAssocTypeEnumId: "WeatMilestone" }).map((row) => row.workEffortId),
            labelsAfter: all("mantle.work.effort.WorkEffortCategoryAppl", { workEffortId: id }).length,
            assignees: current("mantle.work.effort.WorkEffortParty", { workEffortId: id, roleTypeId: "Assignee" }).map((row) => row.partyId),
            followers: all("mantle.party.communication.RecordFollower", { recordEntityName: "mantle.work.effort.WorkEffort", recordId: id }).length }
    },
    then({ saved, badParent, label, labels, unlabel, mine, watched, shown, item, milestones, labelsAfter, assignees, followers }) {
        saved.errors == ""
        item.workEffortName == "BOSS_TEST Sub-item renamed"
        item.purposeEnumId == "WepFix"
        item.priority == 3
        item.visibilityEnumId == "WevGeneral"
        Number(String(item.estimatedWorkTime)) == 5
        Number(String(item.estimatedPoints)) == 3
        item.parentWorkEffortId == "IRON-6"
        item.description == "Some **markdown**"
        milestones == ["IRON-MS-1"]
        badParent.errors.includes("is in another project")
        label.errors == ""
        labels == ["BOSS_DEMO_LBL_UI"]
        unlabel.errors == ""
        labelsAfter == 0
        mine.errors == ""
        assignees == ["EX_JOHN_DOE"]
        watched.errors == ""
        followers == 1
        shown.includes("Unwatch")
        shown.includes("IRON-6 Time")
    },
})

feature("the repeat rule: set in words under the facts, then stopped", {
    when() {
        const id = made.sub
        const repeat = post("WorkItems/WorkItemDetail/setRepeat", { workEffortId: id, frequency: "MONTHLY", interval: "1", byMonthDay: "4", fromCompletion: "N" })
        const rule = one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: id })
        const shown = detail({ workEffortId: id }).output
        const stopped = post("WorkItems/WorkItemDetail/setRepeat", { workEffortId: id, frequency: "" })
        return { repeat, rule, shown, stopped, gone: one("mantle.work.effort.WorkEffortRecurrence", { workEffortId: id }) }
    },
    then({ repeat, rule, shown, stopped, gone }) {
        repeat.errors == ""
        rule.rrule == "FREQ=MONTHLY;BYMONTHDAY=4"
        shown.includes("Every month on the 4th; next made on completion")
        shown.includes("Stop repeating")
        stopped.errors == ""
        gone == null
    },
})

feature("Joe Developer, on IRON's team, sees and changes IRON-10; HIRE-1 of the Work group project is not available to him", {
    allowMessageErrors: true,
    when() {
        const out = as("joe.developer", () => ({
            iron: detail({ workEffortId: "IRON-10" }), hire: detail({ workEffortId: "HIRE-1" }),
            edit: post("WorkItems/WorkItemDetail/saveWorkItem", { workEffortId: "IRON-10", priority: "4" }),
        }))
        out.priority = one("mantle.work.effort.WorkEffort", { workEffortId: "IRON-10" }).priority
        sys(() => call("update#mantle.work.effort.WorkEffort", { workEffortId: "IRON-10", priority: 5 }))
        return out
    },
    then({ iron, hire, edit, priority }) {
        iron.status == 200
        iron.output.includes("Write the getting started guide")
        iron.output.includes("WorkItemEditDialog")
        hire.output.includes("is not available")
        !hire.output.includes("List the roles for next year")
        edit.errors == ""
        priority == 4
    },
})

feature("Move to project takes the item with its sub-items to a project the user is on; Delete for the owner of an item with no time", {
    allowMessageErrors: true,
    when() {
        const parent = post("WorkItems/List/quickAdd", { workEffortName: "BOSS_TEST Mover", projectId: "IRON", keep: "{}" })
        const mover = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST Mover" })[0]
        post("WorkItems/WorkItemDetail/addSubItem", { workEffortId: mover.workEffortId, workEffortName: "BOSS_TEST Mover child" })
        const child = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST Mover child" })[0]
        const moved = post("WorkItems/WorkItemDetail/moveToProject", { workEffortId: mover.workEffortId, rootWorkEffortId: "ACME" })
        const withChild = post("WorkItems/WorkItemDetail/deleteTask", { workEffortId: mover.workEffortId })
        const childDeleted = post("WorkItems/WorkItemDetail/deleteTask", { workEffortId: child.workEffortId })
        return { parent, moved, withChild, childDeleted, moverRow: one("mantle.work.effort.WorkEffort", { workEffortId: mover.workEffortId }),
            childRow: one("mantle.work.effort.WorkEffort", { workEffortId: child.workEffortId }) }
    },
    then({ parent, moved, withChild, childDeleted, moverRow, childRow }) {
        parent.errors == ""
        moved.errors == ""
        moverRow.rootWorkEffortId == "ACME"
        withChild.errors.includes("sub-tasks")
        childDeleted.errors == ""
        childRow == null
    },
})
