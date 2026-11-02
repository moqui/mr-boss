// NewProject (screen/Projects/Projects/NewProject.xml and NewProject/, service/ironstone/projects/ProjectServices.xml create#NewProject,
// save#ProjectModules, save#ProjectMoney, add#ProjectRate; design-projects.md §4 NewProject; impl-projects.md P2): the wizard's
// steps render (the later ones ask for Start first without a project); Start makes the project In Planning with the user its
// project manager, General by default, the key suggested from the name when left empty, from a template with its tree and
// settings; Create now opens the project; Team adds a member; Modules saves the modules, the flow, a repository in the database
// and a documentation space; Money the budgets and a rate; Review lists them and Create opens the project; the team may not
// open it. The spec's projects have keys BT…. Authorization stays on.
// Run: ./moq test mr-boss --spec NewProject
const webroot = "component://webroot/screen/webroot.xml"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
// a transition under the apps root, so an answer's //app path resolves as in the browser
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
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
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
    cleanupSpec() { removeWorkEfforts(["BTBNS", "BTBAKE", "BTNOW"]) },
})

feature("the wizard's steps render: Start with the templates; the later steps ask for Start first without a project", {
    when() {
        return { start: render("apps/Projects/Projects/NewProject/Start", {}), team: render("apps/Projects/Projects/NewProject/Team", {}),
            wizard: ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render("apps/Projects/Projects/NewProject", { lastStandalone: "2" }, null).output,
            joe: as("joe.developer", () => render("apps/Projects/Projects/NewProject/Start", {})) }
    },
    then({ start, team, wizard, joe }) {
        start.status == 200
        start.errors == ""
        !start.broken
        start.output.includes("What and for whom")
        start.output.includes("Client web site")
        start.output.includes("Create now")
        team.output.includes("Start the project first")
        wizard.includes("NewProjectWizard")
        joe.status != 200 || joe.errors != "" || !joe.output.includes("What and for whom")
    },
})

feature("Start makes the project in planning, the user its project manager, General, the key from the name; a template brings its tree and settings", {
    when() {
        const blank = post("Projects/NewProject/Start/createProject", { workEffortName: "BOSS_TEST Brand new site", projectKey: "",
            estimatedStartDate: "2026-11-02", estimatedCompletionDate: "2027-02-26", visibilityEnumId: "WevGeneral" })
        const made = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortName", "BOSS_TEST Brand new site").list()))[0]
        const fromTemplate = post("Projects/NewProject/Start/createProject", { workEffortName: "BOSS_TEST Bakery site", projectKey: "btbake",
            templateWorkEffortId: "TPLWEB", clientPartyId: "ORG_ACME", visibilityEnumId: "WevWorkGroup" })
        const bake = one("mantle.work.effort.WorkEffort", { workEffortId: "BTBAKE" })
        const bakeItems = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffort").condition("rootWorkEffortId", "BTBAKE").orderBy("workEffortId").list())
                .map((row) => row.workEffortId))
        const now = post("Projects/NewProject/Start/createProject", { workEffortName: "BOSS_TEST Now", projectKey: "BTNOW", createNow: "Y" })
        const taken = post("Projects/NewProject/Start/createProject", { workEffortName: "BOSS_TEST Taken", projectKey: "IRON" })
        return { blank, made, managers: made ? current("mantle.work.effort.WorkEffortParty", { workEffortId: made.workEffortId, roleTypeId: "ProjectManager" }).map((row) => row.partyId) : [],
            fromTemplate, bake, bakeItems, bakeCustomer: current("mantle.work.effort.WorkEffortParty", { workEffortId: "BTBAKE", roleTypeId: "Customer" }).map((row) => row.partyId),
            bakeShare: settingOf("BTBAKE", "WstShareNewItems"), basedOn: one("mantle.work.effort.WorkEffortAssoc", { workEffortId: "BTBAKE", toWorkEffortId: "TPLWEB", workEffortAssocTypeEnumId: "WeatBasedOn" }),
            now, taken }
    },
    then({ blank, made, managers, fromTemplate, bake, bakeItems, bakeCustomer, bakeShare, basedOn, now, taken }) {
        blank.errors == ""
        made.workEffortId == "BTBNS"
        made.statusId == "WeInPlanning"
        made.visibilityEnumId == "WevGeneral"
        made.isTemplate != "Y"
        managers == ["EX_JOHN_DOE"]
        String(blank.redirect).includes("workEffortId=BTBNS")
        fromTemplate.errors == ""
        bake.visibilityEnumId == "WevWorkGroup"
        bake.purposeEnumId == "WepPrClient"
        bake.isTemplate == "N"
        bakeItems.includes("BTBAKE-1")
        bakeItems.includes("BTBAKE-MS-1")
        bakeCustomer == ["ORG_ACME"]
        bakeShare == "Y"
        basedOn != null
        String(now.redirect).includes("ProjectDetail")
        taken.errors.includes("The key IRON is taken")
    },
})

// the member is not part of the git feature below: Money's Review lists him in a binary without git too
feature("Team adds a member", {
    when() {
        const step = render("apps/Projects/Projects/NewProject/Team", { workEffortId: "BTBNS" })
        const added = post("Projects/NewProject/Team/addMember", { workEffortId: "BTBNS", partyId: "ORG_ZIZI_JD", roleTypeId: "Programmer" })
        return { step, added, members: current("mantle.work.effort.WorkEffortParty", { workEffortId: "BTBNS", partyId: "ORG_ZIZI_JD" }).length }
    },
    then({ step, added, members }) {
        step.status == 200
        !step.broken
        step.output.includes("Who works on it")
        added.errors == ""
        members == 1
    },
})

feature("Modules saves the modules, the flow, a repository in the database and a documentation space", {
    requires: ["git"],
    when() {
        const modulesStep = render("apps/Projects/Projects/NewProject/Modules", { workEffortId: "BTBNS" })
        const saved = post("Projects/NewProject/Modules/saveModules", { workEffortId: "BTBNS", modules: ["code", "docs", "time"], estimateUnit: "points",
            statusFlowId: "WorkEffortDevelopment", repositoryChoice: "db", repositoryId: "btbns-site", docsChoice: "db" })
        const repos = current("mantle.work.effort.WorkEffortGitRepository", { workEffortId: "BTBNS" }).map((row) => row.repositoryId)
        return { modulesStep, saved, repos,
            modules: settingOf("BTBNS", "WstModules"), unit: settingOf("BTBNS", "WstEstimateUnit"), docs: settingOf("BTBNS", "WstDocsWikiSpace"),
            flow: one("mantle.work.effort.WorkEffort", { workEffortId: "BTBNS" }).statusFlowId }
    },
    then({ modulesStep, saved, repos, modules, unit, docs, flow }) {
        modulesStep.status == 200
        !modulesStep.broken
        modulesStep.output.includes("Repository")
        saved.errors == ""
        modules == "code,docs,time"
        unit == "points"
        flow == "WorkEffortDevelopment"
        repos == ["btbns-site"]
        docs == "BTBNS"
    },
})

feature("Money saves the billing basis and the budgets and adds a rate; Review lists everything and Create opens the project", {
    when() {
        const step = render("apps/Projects/Projects/NewProject/Money", { workEffortId: "BTBNS" })
        const saved = post("Projects/NewProject/Money/saveMoney", { workEffortId: "BTBNS", billingBasis: "FixedPrice", totalTimeAllowed: "120", totalClientCostAllowed: "15000" })
        const rate = post("Projects/NewProject/Money/addRate", { workEffortId: "BTBNS", ratePurposeEnumId: "RaprClient", workTypeEnumId: "WktpDevelopment", rateAmount: "150" })
        const rates = sys(() => Array.from(ec.entity.find("mantle.humanres.rate.RateAmount").condition("workEffortId", "BTBNS").list()))
        const review = render("apps/Projects/Projects/NewProject/Review", { workEffortId: "BTBNS" })
        const finished = post("Projects/NewProject/Review/finish", { workEffortId: "BTBNS" })
        return { step, saved, rate, rates, review, finished, project: one("mantle.work.effort.WorkEffort", { workEffortId: "BTBNS" }),
            basis: settingOf("BTBNS", "WstBillingBasis") }
    },
    then({ step, saved, rate, rates, review, finished, project, basis }) {
        step.status == 200
        !step.broken
        step.output.includes("How it is paid for")
        saved.errors == ""
        basis == "FixedPrice"
        Number(String(project.totalTimeAllowed)) == 120
        Number(String(project.totalClientCostAllowed)) == 15000
        rate.errors == ""
        rates.length == 1
        rates[0].ratePurposeEnumId == "RaprClient"
        rates[0].workTypeEnumId == "WktpDevelopment"
        review.status == 200
        !review.broken
        review.output.includes("BOSS_TEST Brand new site (BTBNS)")
        review.output.includes("Fixed price")
        review.output.includes("Joe Developer (Programmer)")
        String(finished.redirect).includes("ProjectDetail")
    },
})
