// The Projects settings pages (screen/Projects/Settings/Index.xml, WorkItemTypes.xml, Workflows.xml, Labels.xml, Templates.xml;
// service/ironstone/projects/ProjectServices.xml; design-projects.md §12; impl-projects.md P2) on the Projects demo
// (data/BossProjectsDemoData.xml, Ziziwork Services' settings): the index; the work item types offered, their order and icons
// and a type of the organization's own, which QuickCreate then offers; a move of the Development flow added and removed and a
// status's color set and cleared; labels made, renamed, merged and deleted; templates listed and made. The team may change none.
// The spec puts back what it changes on the demo. Authorization stays on.
// Run: ./moq test mr-boss --spec ProjectsSettings
const webroot = "component://webroot/screen/webroot.xml"
const projectsRoot = "component://mr-boss/screen/Projects.xml"

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(projectsRoot).render(path, parameters || {}, "post")
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
const types = (rootWorkEffortId) => sys(() => call("ironstone.projects.ProjectServices.get#WorkItemTypes", rootWorkEffortId ? { rootWorkEffortId } : {}))

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
        removeWorkEfforts(["BTIRON", "BTBLANK", "BTJOE"])
        sys(() => ec.entity.find("moqui.basic.Enumeration").condition("enumTypeId", "WorkEffortPurpose").condition("description", "like", "BOSS_TEST%").deleteAll())
    },
})

feature("the settings index and each page render for a manager; the team is denied them", {
    when() {
        const pages = {}
        for (const page of ["Index", "WorkItemTypes", "Workflows", "Labels", "Templates"]) pages[page] = render(`apps/Projects/Settings/${page}`, {})
        return { pages, joe: as("joe.developer", () => render("apps/Projects/Settings/Labels", {})) }
    },
    then({ pages, joe }) {
        Object.values(pages).every((page) => page.status == 200 && page.errors == "" && !page.broken)
        pages.Index.output.includes("Projects settings")
        pages.Index.output.includes("Work item types")
        pages.WorkItemTypes.output.includes("Bug Fix")
        pages.WorkItemTypes.output.includes("Stop offering")
        pages.Workflows.output.includes("In Review")
        pages.Workflows.output.includes("Work statuses")
        pages.Labels.output.includes("Services")
        pages.Templates.output.includes("Client web site")
        joe.status != 200 || joe.errors != "" || !joe.output.includes("Work item labels")
    },
})

feature("the work item types: stop offering one, move one up, set an icon and add a type of our own, which QuickCreate offers", {
    when() {
        const before = types().offeredList.map((row) => row.enumId)
        const stopped = post("Settings/WorkItemTypes/changeType", { enumId: "WepSupport", change: "stop" })
        const up = post("Settings/WorkItemTypes/changeType", { enumId: "WepDocument", change: "up" })
        const icon = post("Settings/WorkItemTypes/changeType", { enumId: "WepTask", change: "icon", icon: "sym_o_check_circle" })
        const made = post("Settings/WorkItemTypes/createType", { label: "BOSS_TEST Spike", icon: "sym_o_science" })
        const after = types()
        // QuickCreate is server-static (impl-projects.md P11): its qvt template holds every kind's form, so the offered types are
        // read from the server's merge (html)
        const quick = render("apps/Projects/QuickCreate", { kind: "workItem", rootWorkEffortId: "IRON" }, "html")
        const byJoe = as("joe.developer", () => sys(() => { try { call("ironstone.projects.ProjectServices.store#WorkItemTypes", { offered: ["WepTask"] }); return null }
            catch (e) { ec.message.clearErrors(); return String(e.message) } }))
        // back: the organization's setting as the demo had it (none)
        sys(() => ec.entity.find("mantle.party.PartySetting").condition({ partyId: "ORG_ZIZI_SERVICES", partySettingTypeId: "ProjWorkItemTypes" }).deleteAll())
        return { before, stopped, up, icon, made, after, quick, byJoe, restored: types().offeredList.map((row) => row.enumId) }
    },
    then({ before, stopped, up, icon, made, after, quick, byJoe, restored }) {
        before == ["WepTask", "WepFix", "WepNewFeature", "WepFeatureEnhance", "WepDocument", "WepSupport"]
        stopped.errors == ""
        up.errors == ""
        icon.errors == ""
        made.errors == ""
        const offered = after.offeredList.map((row) => row.enumId)
        offered.slice(0, 5) == ["WepTask", "WepFix", "WepNewFeature", "WepDocument", "WepFeatureEnhance"]
        !offered.includes("WepSupport")
        offered.length == 6
        offered[5].startsWith("WepOrg")
        after.offeredList[0].icon == "sym_o_check_circle"
        after.offeredList[5].label == "BOSS_TEST Spike"
        quick.output.includes("BOSS_TEST Spike")
        !quick.output.includes("Support")
        byJoe.includes("Only project managers")
        restored == before
    },
})

feature("a move of the Development flow added and removed, and a status's color set and cleared", {
    when() {
        const added = post("Settings/Workflows/storeTransition", { statusFlowId: "WorkEffortDevelopment", statusId: "WeInTesting", toStatusId: "WeOnHold", transitionName: "Park" })
        const row = one("moqui.basic.StatusFlowTransition", { statusFlowId: "WorkEffortDevelopment", statusId: "WeInTesting", toStatusId: "WeOnHold" })
        const page = render("apps/Projects/Settings/Workflows", { statusFlowId: "WorkEffortDevelopment" })
        const removed = post("Settings/Workflows/storeTransition", { statusFlowId: "WorkEffortDevelopment", statusId: "WeInTesting", toStatusId: "WeOnHold", remove: "Y" })
        const gone = one("moqui.basic.StatusFlowTransition", { statusFlowId: "WorkEffortDevelopment", statusId: "WeInTesting", toStatusId: "WeOnHold" }) == null
        const notWork = post("Settings/Workflows/storeTransition", { statusFlowId: "Default", statusId: "OrderOpen", toStatusId: "OrderApproved" })
        const before = one("moqui.basic.StatusItem", { statusId: "WeInTesting" })
        const colored = post("Settings/Workflows/updateStatus", { statusId: "WeInTesting", statusColor: "info" })
        const color = one("moqui.basic.StatusItem", { statusId: "WeInTesting" }).statusColor
        post("Settings/Workflows/updateStatus", { statusId: "WeInTesting", statusColor: before.statusColor || "" })
        return { added, row, page, removed, gone, notWork, colored, color, back: one("moqui.basic.StatusItem", { statusId: "WeInTesting" }).statusColor ?? null,
            was: before.statusColor ?? null }
    },
    then({ added, row, page, removed, gone, notWork, colored, color, back, was }) {
        added.errors == ""
        row.transitionName == "Park"
        page.output.includes("Park")
        removed.errors == ""
        gone
        notWork.errors.includes("work statuses")
        colored.errors == ""
        color == "info"
        back == was
    },
})

feature("labels: one made, renamed with another color, merged into another and deleted", {
    when() {
        const made = post("Settings/Labels/changeLabel", { action: "create", description: "BOSS_TEST Backend", colorName: "indigo" })
        const label = sys(() => ec.entity.find("mantle.work.effort.WorkEffortCategory").condition("description", "BOSS_TEST Backend").one())
        const renamed = post("Settings/Labels/changeLabel", { action: "update", workEffortCategoryId: label.workEffortCategoryId, description: "BOSS_TEST Server", colorName: "red" })
        const other = post("Settings/Labels/changeLabel", { action: "create", description: "BOSS_TEST Server side", colorName: "teal" })
        const otherLabel = sys(() => ec.entity.find("mantle.work.effort.WorkEffortCategory").condition("description", "BOSS_TEST Server side").one())
        sys(() => call("mantle.work.TaskServices.add#TaskLabel", { workEffortId: "IRON-10", workEffortCategoryId: label.workEffortCategoryId }))
        const merged = post("Settings/Labels/changeLabel", { action: "merge", fromCategoryId: label.workEffortCategoryId, intoCategoryId: otherLabel.workEffortCategoryId })
        const onItem = one("mantle.work.effort.WorkEffortCategoryAppl", { workEffortId: "IRON-10", workEffortCategoryId: otherLabel.workEffortCategoryId }) != null
        const deleted = post("Settings/Labels/changeLabel", { action: "delete", workEffortCategoryId: otherLabel.workEffortCategoryId })
        const notOurs = post("Settings/Labels/changeLabel", { action: "delete", workEffortCategoryId: "HolidayUsaFed" })
        return { made, label, renamed, renamedRow: one("mantle.work.effort.WorkEffortCategory", { workEffortCategoryId: label.workEffortCategoryId }),
            other, merged, onItem, deleted, gone: one("mantle.work.effort.WorkEffortCategory", { workEffortCategoryId: otherLabel.workEffortCategoryId }) == null,
            itemClean: one("mantle.work.effort.WorkEffortCategoryAppl", { workEffortId: "IRON-10", workEffortCategoryId: otherLabel.workEffortCategoryId }) == null, notOurs }
    },
    then({ made, label, renamed, renamedRow, other, merged, onItem, deleted, gone, itemClean, notOurs }) {
        made.errors == ""
        label.ownerPartyId == "ORG_ZIZI_SERVICES"
        label.colorName == "indigo"
        renamed.errors == ""
        merged.errors == ""
        renamedRow == null
        onItem
        deleted.errors == ""
        gone
        itemClean
        notOurs.errors.includes("not one of your labels")
    },
})

feature("templates: listed with their counts, one made as a copy of a project and a blank one", {
    when() {
        const list = sys(() => call("mantle.work.ProjectServices.get#ProjectTemplates", { organizationPartyId: "ORG_ZIZI_SERVICES" })).templateList
        const copy = post("Settings/Templates/createTemplate", { baseWorkEffortId: "IRON", workEffortId: "btiron", workEffortName: "BOSS_TEST Product template" })
        const blank = post("Settings/Templates/createTemplate", { workEffortId: "BTBLANK", workEffortName: "BOSS_TEST Blank template" })
        const page = render("apps/Projects/Settings/Templates", {})
        return { list, copy, blank, page, iron: one("mantle.work.effort.WorkEffort", { workEffortId: "BTIRON" }), blankRow: one("mantle.work.effort.WorkEffort", { workEffortId: "BTBLANK" }),
            ironItems: sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("rootWorkEffortId", "BTIRON").condition("workEffortTypeEnumId", "WetTask").count()) }
    },
    then({ list, copy, blank, page, iron, blankRow, ironItems }) {
        const web = list.find((row) => row.workEffortId === "TPLWEB")
        web.itemCount == 4
        web.milestoneCount == 1
        web.memberCount >= 1
        copy.errors == ""
        iron.isTemplate == "Y"
        ironItems >= 10
        blank.errors == ""
        blankRow.isTemplate == "Y"
        page.output.includes("BOSS_TEST Product template")
    },
})
