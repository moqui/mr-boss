// IronStone Projects P7 Resources (impl-projects.md P7; design-projects.md §9 TeamPlanner, Allocations, PersonDetail, §4 ProjectTeam's
// allocations and NewProject's Team step, §3 Home's allocation requests) on the resource demo (data/BossProjectsDemoDataTimeResources.xml,
// dated from the week it was loaded), with authorization on: john.doe (a Projects manager, who approves allocations) sees the team
// plan with Joe over-allocated this week and the placeholder UI designer to staff, Allocations' Requested list, Ana Designer's
// PersonDetail tabs (impl-projects.md F52: AppStructure renders the tabs' header only); ACME's Team tab with its Allocations box is
// checked in ProjectDetail.spec.js and Home's Allocation requests in Billing.spec.js, on their one render; joe.developer sees the plan read only and may not move an allocation or open the
// requests to decide; bob.developer may not open Ana, on no project he sees. NewProject's Team step allocates a member it adds with
// hours a week. Nothing is changed but a draft project, cancelled after.
// Run: ./moq test mr-boss --spec Resources
const webroot = "component://webroot/screen/webroot.xml"
const made = {}
let scenarioTime = null

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
    ec.user.setEffectiveTime(scenarioTime)
    try { return run() } finally { login("john.doe"); ec.user.setEffectiveTime(scenarioTime) }
}
// This week's Monday in the planner user's wall-date, rather than the host's UTC date.
const monday = (today) => { const js = new Date(today + "T12:00:00Z").getUTCDay()
    return new Date(Date.parse(today + "T12:00:00Z") - ((js + 6) % 7) * 86400000).toISOString().slice(0, 10) }
const personOf = (planner, partyId) => planner.personList.find((person) => person.partyId == partyId)

spec({
    setupSpec() {
        login("john.doe")
        sys(() => {
            // The demo chooses its week in UTC when loaded. Keep every user's planner in that fixture week,
            // including Sunday evenings when UTC is already Monday, without changing shared demo records.
            const allocation = ec.entity.find("mantle.work.effort.WorkEffortAllocation")
                    .condition({ partyId: "ORG_ZIZI_JD", rootWorkEffortId: "IRON" }).one()
            if (!allocation) throw new Error("Resources requires Joe's demo allocation on IRON")
            const from = String(allocation.fromDate)
            const day = /^\d{4}-\d{2}-\d{2}/.test(from) ? from.slice(0, 10) : new Date(Number(from)).toISOString().slice(0, 10)
            scenarioTime = Number(String(ec.l10n.parseTimestamp(day + " 12:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")))
            ec.user.setEffectiveTime(scenarioTime)
            call('create#mantle.party.Party',{partyId:'BOSS_RESOURCE_UNSHARED',partyTypeEnumId:'PtyPerson',ownerPartyId:'ORG_ZIZI_SERVICES'})
            call('create#mantle.party.Person',{partyId:'BOSS_RESOURCE_UNSHARED',firstName:'Unassigned',lastName:'Colleague'})
        })
        ec.artifactExecution.enableAuthz()
    },
    setup() {
        login("john.doe")
        ec.user.setEffectiveTime(scenarioTime)
    },
    cleanup() {
        ec.user.setEffectiveTime(null)
    },
    cleanupSpec() {
        sys(() => {
            for (const timeEntryId of made.timeEntries || []) {
                ec.entity.find("mantle.work.time.TimeEntry").condition("timeEntryId", timeEntryId).one()?.delete()
            }
            if (made.draft) {
                const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", made.draft).one()
                if (project) { project.statusId = "WeCancelled"; project.update() }
                for (const row of ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("rootWorkEffortId", made.draft).list()) { row.statusId = "WealCancelled"; row.update() }
            }
        })
    },
})

feature(
    "john.doe's team planner: Joe over-allocated this week on IRON, ACME and SUPP, Ana on her own hours, the placeholder to staff, and the plan to change",
    {
        when() {
            const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
            const page = render("apps/Projects/Resources/TeamPlanner", {}, "qvue")
            const plan = json("Resources/TeamPlanner/plan", {weeks: "8"}).json
            const byProject = json("Resources/TeamPlanner/plan", {rootWorkEffortId: "ACME", weeks: "8"}).json
            const bySkill = json("Resources/TeamPlanner/plan", {skillTypeEnumId: "BossSkUiDesign"}).json
            const tui = render("apps/Projects/Resources/TeamPlannerTui", {fromDate: plan.planner.fromDate, weeks: "2"}, "tui")
            let people = null
            const findPeople = value => {
                if (!value || typeof value !== "object") return
                if (String(value.id || "").endsWith("TeamPlannerTuiPeople") && Array.isArray(value.columns)) people = value
                for (const entry of Object.values(value)) if (entry && typeof entry === "object") findPeople(entry)
            }
            findPeople(JSON.parse(tui.output))
            const weekTitles = plan.planner.weekList
                .slice(0, 2)
                .map(week =>
                    ec.l10n.format(ec.l10n.parseTimestamp(week.weekStart + " 12:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS"), "MMM d")
                )
            return {today, page, plan, byProject, bySkill, tui, people, weekTitles}
        },
        then({today, page, plan, byProject, bySkill, tui, people, weekTitles}) {
            page.status == 200
            page.output.includes("module.exports")
            const planner = plan.planner
            planner.fromDate == monday(today)
            planner.weekList.length == 8
            planner.canPlan == true
            planner.canRequest == true
            const joe = personOf(planner, "ORG_ZIZI_JD")
            joe.weekList[0].allocated == 48
            joe.weekList[0].over == true
            joe.allocationList.length == 3
            joe.allocationList.every(alloc => alloc.canChange == true)
            const ana = personOf(planner, "EX_PRJ_ANA")
            ana.source == "available"
            ana.weekList[0].base == 32
            ana.weekList[0].allocated == 24
            ana.weekList[0].over == false
            ana.skillList[0].label == "UI design"
            personOf(planner, "EX_JOHN_DOE").allocationList.some(alloc => alloc.allocationPercent == 20)
            // Bob's day of leave in week 3, and his requested hours on ACME
            const bob = personOf(planner, "ORG_ZIZI_BD")
            bob.weekList[3].leaveHours == 8
            bob.weekList[3].requested == 8
            planner.placeholderList.length == 1
            planner.placeholderList[0].roleText == "UI Designer"
            planner.placeholderList[0].statusId == "WealRequested"
            planner.projectList
                .map(project => project.workEffortId)
                .sort()
                .join(",") == "ACME,IRON,SUPP"
            // the find: ACME's people (with those requested on it) and its placeholder; UI design: Ana and Bob
            byProject.planner.personList
                .map(person => person.partyId)
                .sort()
                .join(",") == "EX_JOHN_DOE,EX_PRJ_ANA,ORG_ZIZI_BD,ORG_ZIZI_JD"
            byProject.planner.placeholderList.length == 1
            bySkill.planner.personList
                .map(person => person.partyId)
                .sort()
                .join(",") == "EX_PRJ_ANA,ORG_ZIZI_BD"
            tui.status == 200
            !tui.broken
            tui.output.includes("Joe Developer")
            tui.output.includes("48/40 !")
            people.columns.map(column => column.title) == ["Person", "Role"].concat(weekTitles)
            people.rows.every(row => row.cells.length === 4)
        }
    }
)

feature("joe.developer sees the plan read only: no changes, no requests to decide, and a move refused", {
    when() {
        const plan = as("joe.developer", () => json("Resources/TeamPlanner/plan", {}).json)
        const allocationId = plan.planner.personList.find((person) => person.partyId == "ORG_ZIZI_JD").allocationList[0].workEffortAllocationId
        const moved = as("joe.developer", () => post("Resources/TeamPlanner/moveAllocation", { workEffortAllocationId: allocationId, shiftDays: "7" }))
        const list = as("joe.developer", () => render("apps/Projects/Resources/Allocations", {}))
        const requested = as("joe.developer", () => render("apps/Projects/Resources/Allocations", { list: "requested" }))
        return { plan, moved, list, requested }
    },
    then({ plan, moved, list, requested }) {
        plan.planner.canPlan == false
        plan.planner.canRequest == false
        plan.planner.personList.every((person) => person.allocationList.every((alloc) => !alloc.canChange))
        moved.errors.includes("may not change")
        list.status == 200
        list.output.includes("Mine")
        // the requests are listed, without Approve
        requested.output.includes("UI Designer")
        !requested.output.includes("decide?workEffortAllocationId")
    },
})

feature("Allocations' Requested list and the staffing dialog for john.doe; Ana's PersonDetail tabs; Bob sees a person on a shared project but not an unrelated colleague", {
    when() {
        const requested = render("apps/Projects/Resources/Allocations", { list: "requested" })
        const placeholder = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition({ rootWorkEffortId: "ACME" })
                .condition("partyId", "is-null", null).list())[0].workEffortAllocationId)
        const staff = render("apps/Projects/Resources/Allocations/Staff", { workEffortAllocationId: placeholder })
        const edit = render("apps/Projects/Resources/Allocations/EditAllocation", {})
        const tabs = {}
        for (const tab of ["Overview", "Allocations", "WorkItems", "Time", "Capacity"]) tabs[tab] = render(`apps/Projects/Resources/PersonDetail/${tab}`, { partyId: "EX_PRJ_ANA" })
        // Today's later hours belong to the current day; next week's hours do not belong to the last four weeks.
        const dayThru = Number(String(ec.user.getPeriodRange("day", "0")[1]))
        const nextWeekDay = Number(String(ec.user.getPeriodRange("day", "7")[0]))
        made.timeEntries = sys(() => [
            [dayThru - 1000, "Resource time today control"],
            [nextWeekDay, "Resource time future week control"]
        ].map(([fromDate, comments]) => call("create#mantle.work.time.TimeEntry", {
            partyId: "ORG_ZIZI_JD", workEffortId: "IRON-1", fromDate, hours: 0.25, comments
        }).timeEntryId))
        const joeTime = render("apps/Projects/Resources/PersonDetail/Time", { partyId: "ORG_ZIZI_JD" })
        const bob = as("bob.developer", () => render("apps/Projects/Resources/PersonDetail", { partyId: "EX_PRJ_ANA" }))
        const unrelated = as("bob.developer", () => render("apps/Projects/Resources/PersonDetail", {partyId:"BOSS_RESOURCE_UNSHARED"}))
        const bobAccess=as("bob.developer",()=>sys(()=>call("ironstone.projects.ResourceServices.get#PersonAccess",{partyId:"EX_PRJ_ANA"})))
        return { requested, staff, edit, tabs, joeTime, bob, unrelated, bobAccess }
    },
    then({ requested, staff, edit, tabs, joeTime, bob, unrelated, bobAccess }) {
        requested.status == 200
        !requested.broken
        requested.output.includes("Requested · 2")
        requested.output.includes("UI Designer (UI design)")
        requested.output.includes("Bob Developer")
        staff.status == 200
        !staff.broken
        // Ana has the skill (5 of 5), first
        staff.output.indexOf("Ana Designer") > 0
        staff.output.includes("Has the skill (5 of 5)")
        staff.output.indexOf("Ana Designer") < staff.output.indexOf("Joe Developer")
        edit.output.includes("Hours a week")
        Object.values(tabs).every((tab) => tab.status == 200 && !tab.broken && tab.errors == "")
        tabs.Overview.output.includes("UI design")
        tabs.Overview.output.includes("ana.designer@ziziwork.example")
        tabs.Overview.output.includes("Their working hours")
        tabs.Overview.output.includes("32 h a week")
        tabs.Allocations.output.includes("Acme customer portal")
        tabs.Capacity.output.includes("Capacity by week")
        joeTime.output.includes("The support queue")
        joeTime.output.includes("Resource time today control") && !joeTime.output.includes("Resource time future week control")
        bobAccess.canView == true
        bob.status == 200
        !bob.broken
        !bob.output.includes("This person is not available")
        unrelated.output.includes("This person is not available")
    },
})

feature("NewProject's Team step allocates a member", {
    when() {
        const started = sys(() => call("ironstone.projects.ProjectServices.create#NewProject", { workEffortName: "Resource draft", workEffortId: "RDR",
            estimatedStartDate: "2027-05-03 09:00:00", estimatedCompletionDate: "2027-05-28 17:00:00" }))
        made.draft = started.projectId
        const added = post("Projects/NewProject/Team/addMember", { workEffortId: made.draft, partyId: "ORG_ZIZI_BD", roleTypeId: "QualityAnalyst",
            hoursPerWeek: "12", allocFromDate: "2027-05-03", allocThruDate: "2027-05-28" })
        const step = render("apps/Projects/Projects/NewProject/Team", { workEffortId: made.draft })
        const rows = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortAllocation").condition("rootWorkEffortId", made.draft).list()))
        return { added, step, rows }
    },
    then({ added, step, rows }) {
        added.errors == ""
        rows.length == 1
        rows[0].partyId == "ORG_ZIZI_BD"
        rows[0].statusId == "WealAllocated"
        Number(String(rows[0].hoursPerWeek)) == 12
        step.output.includes("Allocations · 1")
    },
})
