// The usable-when walk of IronStone Projects P7 (impl-projects.md P7; design-projects.md §9 TeamPlanner, Allocations, §4 ProjectTeam)
// through the screens' transitions, with authorization on: in a project of its own (RWK, john.doe its manager and joe.developer a
// programmer), in the weeks of March 2028 (past the resource demo's allocations), john.doe requests a placeholder on the project's Team
// tab (a programmer who knows Rust, 20 hours a week, for approval); it is listed as Unstaffed and counted on Home; the staffing dialog
// ranks Joe Developer first (the skill and the hours free); john.doe staffs it with Joe, which allocates it; he allocates Joe 30 more
// hours and Bob half his week from the planner's dialog, Bob joining the project as a quality analyst; the planner shows Joe's 50 hours
// over his 40 and Bob's 20; a drag moves Joe's 30 hours a week later, which clears the first week; joe.developer sees the plan read only.
// The project is cancelled after, with its allocations.
// Run: ./moq test mr-boss --spec ResourceWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "RWK"
const made = {}

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
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), output, json: parsed }
}
function json(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, null)
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
const allocations = () => sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("rootWorkEffortId", PROJECT).orderBy("workEffortAllocationId").list()))
const plan = (who) => as(who || "john.doe", () => json("Resources/TeamPlanner/plan", { fromDate: "2028-03-08", weeks: "4", rootWorkEffortId: PROJECT }).json.planner)
const personOf = (planner, partyId) => planner.personList.find((person) => person.partyId == partyId)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Resource walk", visibilityEnumId: "WevWorkGroup" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", ownerPartyId: "ORG_ZIZI_SERVICES" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"]])
                call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: "2026-10-01 00:00:00", statusId: "WeptAssigned" })
        })
    },
    cleanupSpec() {
        sys(() => {
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
            for (const row of ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("rootWorkEffortId", PROJECT).list()) { row.statusId = "WealCancelled"; row.update() }
        })
    },
})

feature("john.doe requests a placeholder on the Team tab: a Rust programmer, 20 hours a week in March 2028; it is Unstaffed and counted on Home", {
    when() {
        const before = sys(() => call("mantle.work.ProjectServices.get#ProjectHomeCounts", { managers: true }).counts.allocationRequests)
        const requested = post("Projects/ProjectDetail/Team/requestAllocation", { workEffortId: PROJECT, allocPartyId: "", allocRoleTypeId: "Programmer",
            allocSkillTypeEnumId: "BossSkRust", allocFromDate: "2028-03-06", allocThruDate: "2028-03-31", amount: "20", unit: "h", request: "Y",
            comments: "The capacity service" })
        made.placeholder = allocations()[0]?.workEffortAllocationId
        const team = render("apps/Projects/Projects/ProjectDetail/Team", { workEffortId: PROJECT })
        const unstaffed = render("apps/Projects/Resources/Allocations", { list: "unstaffed", rootWorkEffortId: PROJECT })
        const after = sys(() => call("mantle.work.ProjectServices.get#ProjectHomeCounts", { managers: true }).counts.allocationRequests)
        return { requested, team, unstaffed, before, after, rows: allocations() }
    },
    then({ requested, team, unstaffed, before, after, rows }) {
        requested.errors == ""
        rows.length == 1
        rows[0].partyId == null
        rows[0].statusId == "WealRequested"
        rows[0].skillTypeEnumId == "BossSkRust"
        team.output.includes("Allocations · 1")
        team.output.includes("Programmer (Rust)")
        unstaffed.output.includes("Unstaffed · 1")
        unstaffed.output.includes("The capacity service")
        after == before + 1
    },
})

feature("the staffing dialog ranks Joe Developer first: he knows Rust and has the hours free; john.doe staffs the placeholder with him, which allocates it", {
    when() {
        const dialog = render("apps/Projects/Resources/Allocations/Staff", { workEffortAllocationId: made.placeholder })
        const candidates = sys(() => call("ironstone.projects.ResourceServices.get#StaffCandidates", { workEffortAllocationId: made.placeholder }).candidateList)
        const staffed = post("Resources/Allocations/Staff/staff", { workEffortAllocationId: made.placeholder, staffPartyId: "ORG_ZIZI_JD" })
        return { dialog, candidates, staffed, rows: allocations() }
    },
    then({ dialog, candidates, staffed, rows }) {
        dialog.status == 200
        !dialog.broken
        dialog.output.includes("Joe Developer")
        dialog.output.includes("Has the skill (4 of 5)")
        candidates[0].partyId == "ORG_ZIZI_JD"
        candidates[0].fits == true
        candidates[0].needHours == 80
        candidates[0].rateText != null
        staffed.errors == ""
        rows[0].partyId == "ORG_ZIZI_JD"
        rows[0].statusId == "WealAllocated"
    },
})

feature("from the planner's dialog john.doe allocates Joe 30 more hours and Bob half his week; the planner shows Joe over his capacity and Bob added to the team", {
    when() {
        const more = post("Resources/TeamPlanner/saveAllocation", { allocWorkEffortId: PROJECT, partyId: "ORG_ZIZI_JD", allocRoleTypeId: "Programmer",
            allocFromDate: "2028-03-06", allocThruDate: "2028-03-17", amount: "30", unit: "h" })
        const half = post("Resources/TeamPlanner/saveAllocation", { allocWorkEffortId: PROJECT, partyId: "ORG_ZIZI_BD", allocRoleTypeId: "QualityAnalyst",
            allocFromDate: "2028-03-06", allocThruDate: "2028-03-31", amount: "50", unit: "pct" })
        made.more = more.json?.workEffortAllocationId
        const bobOn = sys(() => ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId: "ORG_ZIZI_BD", roleTypeId: "QualityAnalyst" }).count())
        return { more, half, bobOn, planner: plan() }
    },
    then({ more, half, bobOn, planner }) {
        more.json.messageInfos[0].message == "Allocated"
        half.json.messageInfos[0].message == "Allocated"
        bobOn == 1
        planner.fromDate == "2028-03-06"
        planner.weekList.length == 4
        const joe = personOf(planner, "ORG_ZIZI_JD")
        joe.weekList[0].capacity == 40
        joe.weekList[0].allocated == 50
        joe.weekList[0].over == true
        joe.weekList[2].allocated == 20
        joe.weekList[2].over == false
        const bob = personOf(planner, "ORG_ZIZI_BD")
        bob.weekList[0].allocated == 20
        bob.allocationList[0].allocationPercent == 50
        planner.placeholderList.length == 0
        planner.projectList.map((project) => project.workEffortId).join(",") == PROJECT
    },
})

feature("a drag moves Joe's 30 hours a week later, clearing the first week; joe.developer sees the plan read only", {
    when() {
        const moved = post("Resources/TeamPlanner/moveAllocation", { workEffortAllocationId: made.more, shiftDays: "7" })
        const planner = plan()
        const joePlan = plan("joe.developer")
        const page = render("apps/Projects/Resources/TeamPlanner", { rootWorkEffortId: PROJECT }, "qvue")
        return { moved, planner, joePlan, page }
    },
    then({ moved, planner, joePlan, page }) {
        moved.json.moved == true
        const joe = personOf(planner, "ORG_ZIZI_JD")
        joe.weekList[0].allocated == 20
        joe.weekList[0].over == false
        joe.weekList[1].allocated == 50
        joe.weekList[2].allocated == 50
        joe.allocationList.find((alloc) => alloc.workEffortAllocationId == made.more).fromDay == "2028-03-13"
        joePlan.canPlan == false
        joePlan.personList.every((person) => person.allocationList.every((alloc) => !alloc.canChange))
        page.status == 200
        page.output.includes("module.exports")
    },
})
