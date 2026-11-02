// ProjectDetail and its tabs (screen/Projects/Projects/ProjectDetail.xml and ProjectDetail/, StatusReport.xml;
// service/ironstone/projects/ProjectServices.xml; design-projects.md §4 ProjectDetail, ProjectOverview, ProjectWorkItems, ProjectTeam,
// ProjectFiles, ProjectSettings, §14 the status report; impl-projects.md P2) on the Projects demo
// (data/BossProjectsDemoData.xml): the header (status stages, health, numbers, the primary action by status), the overview's
// boxes, the Work items tab with the project fixed, a status update setting the health, the team's members, the settings boxes,
// the status report printed, the project the team may not see or manage, clone and save as template, and an empty project
// deleted. The spec makes its own projects (keys BT…) and moves back what it changes on the demo's. Authorization stays on.
// Run: ./moq test mr-boss --spec ProjectDetail
const webroot = "component://webroot/screen/webroot.xml"
const projectsRoot = "component://mr-boss/screen/Projects.xml"

// a screen as the client fetches it (lastStandalone true: the last level alone, a tab; 2: the detail's own level, its header)
function render(path, parameters, mode, standalone) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: standalone || "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(projectsRoot).render(path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), messages: str.messages ? str.messages.join(" | ") : "", output }
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
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
// a status set as it was, past the flow (the framework checks a status change against the flows)
const setStatus = (workEffortId, statusId) => sys(() => { const row = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", workEffortId).one(); row.statusId = statusId; row.update() })
const settingOf = (workEffortId, settingTypeEnumId) => one("mantle.work.effort.WorkEffortSetting", { workEffortId, settingTypeEnumId })?.settingValue ?? null

// takes out what the spec made (projects with their items and links, or single items), so the specs after it (Commons' task
// lists, WorkItems) see the demo as it was
function removeWorkEfforts(projectIds, itemCondition) {
    sys(() => {
        const cf = ec.entity.conditionFactory
        const conds = projectIds.map((id) => cf.makeCondition([cf.makeCondition("workEffortId", "equals", id), cf.makeCondition("rootWorkEffortId", "equals", id)], "or"))
        if (itemCondition) conds.push(itemCondition)
        if (!conds.length) return
        const rows = Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition(cf.makeCondition(conds, "or")).list())
        const ids = rows.map((row) => row.workEffortId)
        if (!ids.length) return
        for (const entityName of ["mantle.work.effort.WorkEffortParty", "mantle.work.effort.WorkEffortSetting", "mantle.work.effort.WorkEffortCategoryAppl",
                "mantle.work.effort.WorkEffortUpdate", "mantle.work.effort.WorkEffortCommEvent", "mantle.work.effort.WorkEffortGitRepository",
                "mantle.humanres.rate.RateAmount", "mantle.work.effort.WorkEffortRecurrence"])
            ec.entity.find(entityName).condition("workEffortId", "in", ids).deleteAll()
        ec.entity.find("mantle.work.effort.WorkEffortAssoc").condition("workEffortId", "in", ids).deleteAll()
        ec.entity.find("mantle.work.effort.WorkEffortAssoc").condition("toWorkEffortId", "in", ids).deleteAll()
        for (const row of rows) if (row.parentWorkEffortId || row.rootWorkEffortId) { row.parentWorkEffortId = null; row.rootWorkEffortId = null; row.update() }
        ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "in", ids).deleteAll()
        for (const id of projectIds) ec.entity.find("moqui.entity.SequenceValueItem").condition("seqName", "Project_" + id).deleteAll()
    })
}

spec({
    setupSpec() { login("john.doe") },
    cleanupSpec() {
        removeWorkEfforts(["BTCLONE", "BTTPL", "BTEMPTY", "BTJOE"], ec.entity.conditionFactory.makeCondition("workEffortName", "like", "BOSS_TEST From the project tab%"))
        // the status update posted on IRON
        sys(() => {
            const ids = Array.from(ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventTypeId", "StatusUpdate")
                    .condition("body", "like", "BOSS_TEST%").list()).map((row) => row.communicationEventId)
            if (ids.length) for (const entityName of ["mantle.work.effort.WorkEffortUpdate", "mantle.work.effort.WorkEffortCommEvent"])
                ec.entity.find(entityName).condition("communicationEventId", "in", ids).deleteAll()
        })
    },
})

feature("the header of ACME: its status, health, client, manager and numbers, and in progress the status update is the primary action", {
    when() {
        const header = sys(() => call("ironstone.projects.ProjectServices.get#ProjectHeader", { workEffortId: "ACME" })).header
        const planning = sys(() => call("ironstone.projects.ProjectServices.get#ProjectHeader", { workEffortId: "HIRE" })).header
        const joe = as("joe.developer", () => sys(() => call("ironstone.projects.ProjectServices.get#ProjectHeader", { workEffortId: "HIRE" })))
        const joeAcme = as("joe.developer", () => sys(() => call("ironstone.projects.ProjectServices.get#ProjectHeader", { workEffortId: "ACME" })))
        return { header, planning, joe, joeAcme }
    },
    then({ header, planning, joe, joeAcme }) {
        header.statusLabel == "In Progress"
        header.healthLabel == "At Risk"
        header.healthDateText == "Oct 16"
        header.clientName == "Another Company Making Everything"
        header.managerName == "John Doe"
        header.openItems == 5
        header.nextMilestoneName == "Go live"
        header.hoursText == "32 of 160 h"
        header.canManage == true
        header.primaryAction.kind == "update"
        header.otherMoves.map((move) => move.statusId).sort() == ["WeCancelled", "WeComplete", "WeOnHold"]
        header.modules == ["requests", "time", "money", "client"]
        planning.primaryAction.kind == "status"
        planning.primaryAction.statusId == "WeApproved"
        planning.primaryAction.label == "Approve"
        joe.visible == false
        joeAcme.visible == true
        joeAcme.header.canManage == false
        joeAcme.header.budgetUsedText == ""
    },
})

feature("ProjectDetail renders in qvt with its title row, numbers, tabs and the overview's boxes; the team sees no Settings tab", {
    when() {
        return { acme: render("apps/Projects/Projects/ProjectDetail", { workEffortId: "ACME" }, "qvt", "2"),
            acmeOverview: render("apps/Projects/Projects/ProjectDetail/Overview", { workEffortId: "ACME" }),
            iron: render("apps/Projects/Projects/ProjectDetail/Overview", { workEffortId: "IRON" }),
            menu: ec.screen.makeTest().rootScreen(webroot).render("menuData/apps/Projects/Projects/ProjectDetail/Overview", { workEffortId: "IRON" }, null).output,
            joeMenu: as("joe.developer", () => ec.screen.makeTest().rootScreen(webroot).render("menuData/apps/Projects/Projects/ProjectDetail/Overview", { workEffortId: "IRON" }, null).output),
            joe: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail", { workEffortId: "IRON" }, "qvt", "2")),
            joeOverview: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Overview", { workEffortId: "IRON" })),
            hidden: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail", { workEffortId: "HIRE" }, "qvt", "2")),
            joeSettings: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Settings", { workEffortId: "IRON" })) }
    },
    then({ acme, acmeOverview, iron, menu, joeMenu, joe, joeOverview, hidden, joeSettings }) {
        acme.status == 200
        acme.errors == ""
        !acme.broken
        acme.output.includes("Acme customer portal")
        acme.output.includes("ProjectStatusBar")
        acme.output.includes("Post update")
        acme.output.includes("Print status report")
        acme.output.includes("Open items")
        acme.output.includes("Budget used")
        // the overview, the default tab, as the client loads it alone
        acmeOverview.status == 200
        acmeOverview.errors == ""
        !acmeOverview.broken
        acmeOverview.output.includes("Sign-in is late by a week")
        acmeOverview.output.includes("Go live")
        acmeOverview.output.includes("Customer sign-in")
        acmeOverview.output.includes("Time and budget")
        acmeOverview.output.includes("ProjectChatter")
        iron.status == 200
        !iron.broken
        iron.output.includes("Sprint 2 started on time")
        iron.output.includes("Work items")
        iron.output.includes("Joe Developer")
        menu.includes("\"Team\"")
        menu.includes("\"Settings\"")
        menu.includes("\"Work items\"")
        joeMenu.includes("\"Team\"")
        !joeMenu.includes("\"Settings\"")
        joe.status == 200
        !joe.broken
        !joe.output.includes("Post update")
        !joe.output.includes("Budget used")
        !joeOverview.broken
        !joeOverview.output.includes("Time and budget")
        hidden.output.includes("is not available")
        joeSettings.status != 200 || joeSettings.output.includes("not authorized") || joeSettings.errors != ""
    },
})

feature("the Work items tab is WorkItems with the project fixed, its links absolute, its quick add into the project", {
    when() {
        const tab = render("apps/Projects/Projects/ProjectDetail/WorkItems", { workEffortId: "IRON", list: "all" })
        const added = post("Projects/ProjectDetail/WorkItems/quickAdd", { workEffortId: "IRON", workEffortName: "BOSS_TEST From the project tab",
            projectId: "IRON", purposeEnumId: "WepTask", keep: "{\"list\":\"open\",\"rootWorkEffortId\":\"IRON\"}" })
        const made = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortName", "BOSS_TEST From the project tab").list()))
        return { tab, added, made }
    },
    then({ tab, added, made }) {
        tab.status == 200
        tab.errors == ""
        !tab.broken
        tab.output.includes("Expand and collapse rows")
        !tab.output.includes("Customer sign-in")
        tab.output.includes("/Projects/WorkItems/WorkItemDetail")
        added.errors == ""
        made.length == 1
        made[0].rootWorkEffortId == "IRON"
    },
})

feature("a status update by the manager sets the health, shows on the overview and tells the members", {
    when() {
        const posted = post("Projects/ProjectDetail/postUpdate", { workEffortId: "IRON", healthEnumId: "WehAtRisk", percentComplete: "25",
            body: "BOSS_TEST The timer needs another week." })
        const health = one("mantle.work.effort.WorkEffort", { workEffortId: "IRON" }).healthEnumId
        const overview = sys(() => call("ironstone.projects.ProjectServices.get#ProjectOverview", { workEffortId: "IRON" })).overview
        const notes = sys(() => Array.from(ec.entity.find("moqui.security.user.NotificationMessage").condition("topic", "ProjectStatusUpdate").list()))
                .filter((row) => { try { return JSON.parse(row.messageJson).workEffortId === "IRON" } catch (e) { return false } })
        // back: on track, as the demo has it
        sys(() => call("update#mantle.work.effort.WorkEffort", { workEffortId: "IRON", healthEnumId: "WehOnTrack" }))
        return { posted, health, overview, notes }
    },
    then({ posted, health, overview, notes }) {
        posted.errors == ""
        health == "WehAtRisk"
        overview.updateList[0].body == "BOSS_TEST The timer needs another week."
        overview.updateList[0].percentComplete == 25
        overview.updateList.length >= 2
        overview.activityList.some((entry) => entry.kind === "update")
        notes.length >= 1
    },
})

feature("the primary action moves a project along the Default flow, and a project the user does not manage is refused", {
    when() {
        const approved = post("Projects/ProjectDetail/changeStatus", { workEffortId: "HIRE", statusId: "WeApproved" })
        const status = one("mantle.work.effort.WorkEffort", { workEffortId: "HIRE" }).statusId
        setStatus("HIRE", "WeInPlanning")
        const joe = as("joe.developer", () => post("Projects/ProjectDetail/changeStatus", { workEffortId: "ACME", statusId: "WeOnHold" }))
        return { approved, status, joe, acme: one("mantle.work.effort.WorkEffort", { workEffortId: "ACME" }).statusId }
    },
    then({ approved, status, joe, acme }) {
        approved.errors == ""
        status == "WeApproved"
        joe.errors.includes("Only the managers of ACME")
        acme == "WeInProgress"
    },
})

feature("the Team tab: the members with their roles and the client contacts; a member added and ended by the manager", {
    when() {
        const tab = render("apps/Projects/Projects/ProjectDetail/Team", { workEffortId: "ACME" })
        const team = sys(() => call("ironstone.projects.ProjectServices.get#ProjectTeam", { workEffortId: "ACME" }))
        const added = post("Projects/ProjectDetail/Team/addMember", { workEffortId: "ACME", partyId: "ORG_ZIZI_BD", roleTypeId: "QualityAnalyst" })
        const after = current("mantle.work.effort.WorkEffortParty", { workEffortId: "ACME", partyId: "ORG_ZIZI_BD", roleTypeId: "QualityAnalyst" }).length
        const ended = post("Projects/ProjectDetail/Team/endMember", { workEffortId: "ACME", partyId: "ORG_ZIZI_BD", roleTypeId: "QualityAnalyst" })
        const left = current("mantle.work.effort.WorkEffortParty", { workEffortId: "ACME", partyId: "ORG_ZIZI_BD", roleTypeId: "QualityAnalyst" }).length
        return { tab, team, added, after, ended, left }
    },
    then({ tab, team, added, after, ended, left }) {
        tab.status == 200
        tab.errors == ""
        !tab.broken
        tab.output.includes("Add member")
        tab.output.includes("Client contacts")
        team.memberList.map((row) => row.name).includes("Joe Developer")
        team.memberList.find((row) => row.name === "John Doe").roleText == "Project Manager"
        team.clientList.map((row) => row.roleTypeId).sort() == ["ClientBilling", "ClientManager", "Customer"]
        !team.memberList.some((row) => row.roleTypeId === "Vendor")
        team.roleOptions.some((option) => option.key === "Programmer")
        !team.roleOptions.some((option) => option.key === "Customer")
        added.errors == ""
        after == 1
        ended.errors == ""
        left == 0
    },
})

feature("the Settings tab saves the general fields, the modules, the work item settings and the client access; Files and the status report render", {
    when() {
        const tab = render("apps/Projects/Projects/ProjectDetail/Settings", { workEffortId: "HIRE" })
        const general = post("Projects/ProjectDetail/Settings/saveGeneral", { workEffortId: "HIRE", workEffortName: "Hiring plan 2027", purposeEnumId: "WepPrOrgMgmt",
            priority: "4", visibilityEnumId: "WevWorkGroup", estimatedStartDate: "2026-11-02", estimatedCompletionDate: "2027-01-29", description: "The roles to hire next year and when." })
        const circular = post("Projects/ProjectDetail/Settings/saveGeneral", { workEffortId: "ACME", workEffortName: "Acme customer portal", visibilityEnumId: "WevGeneral",
            parentWorkEffortId: "ACMEAPP" })
        const modules = post("Projects/ProjectDetail/Settings/saveValues", { workEffortId: "HIRE", box: "modules", modules: ["time", "docs"] })
        const items = post("Projects/ProjectDetail/Settings/saveValues", { workEffortId: "HIRE", box: "workItems", workItemTypes: ["WepTask", "WepDocument"],
            statusFlowId: "WorkEffortDevelopment", estimateUnit: "points", shareNewItems: "Y" })
        const client = post("Projects/ProjectDetail/Settings/saveValues", { workEffortId: "HIRE", box: "clientAccess", clientSignIn: "Y" })
        const types = sys(() => call("ironstone.projects.ProjectServices.get#WorkItemTypes", { rootWorkEffortId: "HIRE" })).offeredList.map((row) => row.enumId)
        const hire = one("mantle.work.effort.WorkEffort", { workEffortId: "HIRE" })
        const saved = { modules: settingOf("HIRE", "WstModules"), types: settingOf("HIRE", "WstWorkItemTypes"), unit: settingOf("HIRE", "WstEstimateUnit"),
            share: settingOf("HIRE", "WstShareNewItems"), sprints: settingOf("HIRE", "WstSeveralSprints"), signIn: settingOf("HIRE", "WstClientSignIn"),
            repos: settingOf("HIRE", "WstShareRepositories") }
        // back: the demo has none of these
        sys(() => {
            ec.entity.find("mantle.work.effort.WorkEffortSetting").condition("workEffortId", "HIRE").deleteAll()
            call("update#mantle.work.effort.WorkEffort", { workEffortId: "HIRE", statusFlowId: null, estimatedCompletionDate: null, priority: 5 })
        })
        const files = render("apps/Projects/Projects/ProjectDetail/Files", { workEffortId: "IRON" })
        const report = render("apps/Projects/Projects/StatusReport", { workEffortId: "ACME" }, "html-print")
        const teamReport = as("joe.developer", () => render("apps/Projects/Projects/StatusReport", { workEffortId: "ACME" }, "html-print"))
        return { tab, general, circular, modules, items, client, types, hire, saved, files, report, teamReport }
    },
    then({ tab, general, circular, modules, items, client, types, hire, saved, files, report, teamReport }) {
        tab.status == 200
        tab.errors == ""
        !tab.broken
        tab.output.includes("Modules")
        tab.output.includes("Client access")
        tab.output.includes("Close or delete")
        general.errors == ""
        hire.priority == 4
        hire.statusFlowId == "WorkEffortDevelopment"
        circular.errors.includes("cannot be under itself")
        modules.errors == ""
        items.errors == ""
        client.errors == ""
        saved.modules == "docs,time"
        saved.types == "WepTask,WepDocument"
        saved.unit == "points"
        saved.share == "Y"
        saved.sprints == "N"
        saved.signIn == "Y"
        saved.repos == "N"
        types == ["WepTask", "WepDocument"]
        files.status == 200
        !files.broken
        files.output.includes("ProjectFiles")
        report.status == 200
        report.output.includes("Acme customer portal (ACME)")
        report.output.includes("Sign-in is late by a week")
        report.output.includes("Go live")
        report.output.includes("Time and budget")
        !teamReport.output.includes("Time and budget")
    },
})

feature("clone and save as template make projects from ACME; an empty project is deleted, one with work items is not", {
    when() {
        const cloned = post("Projects/ProjectDetail/cloneProject", { workEffortId: "ACME", isTemplate: "N", newWorkEffortId: "btclone", newWorkEffortName: "BOSS_TEST Acme copy" })
        const copy = one("mantle.work.effort.WorkEffort", { workEffortId: "BTCLONE" })
        const copyItems = sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("rootWorkEffortId", "BTCLONE").condition("workEffortTypeEnumId", "WetTask").count())
        const template = post("Projects/ProjectDetail/saveAsTemplate", { workEffortId: "ACME", templateWorkEffortId: "BTTPL", templateName: "BOSS_TEST Portal template" })
        const tpl = one("mantle.work.effort.WorkEffort", { workEffortId: "BTTPL" })
        const blank = sys(() => call("ironstone.projects.ProjectServices.create#NewProject", { workEffortId: "BTEMPTY", workEffortName: "BOSS_TEST Empty" }))
        const notEmpty = post("Projects/ProjectDetail/Settings/deleteProject", { workEffortId: "BTCLONE" })
        const deleted = post("Projects/ProjectDetail/Settings/deleteProject", { workEffortId: "BTEMPTY" })
        return { cloned, copy, copyItems, template, tpl, blank, notEmpty, deleted, gone: one("mantle.work.effort.WorkEffort", { workEffortId: "BTEMPTY" }) == null,
            still: one("mantle.work.effort.WorkEffort", { workEffortId: "BTCLONE" }) != null }
    },
    then({ cloned, copy, copyItems, template, tpl, blank, notEmpty, deleted, gone, still }) {
        cloned.errors == ""
        copy.isTemplate == "N"
        copy.statusId == "WeInPlanning"
        copyItems == 6
        template.errors == ""
        tpl.isTemplate == "Y"
        blank.projectId == "BTEMPTY"
        notEmpty.errors.includes("Only a project with no work items")
        still
        deleted.errors == ""
        gone
    },
})
