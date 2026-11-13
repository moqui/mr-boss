// The usable-when walk of IronStone Projects P9 Reports and outputs (impl-projects.md P9; design-projects.md §11 Reports, §3 Home's manager
// charts, §14 the timesheet and team timesheet prints) on the demo data, with authorization on: john.doe (a Projects manager who manages
// money) opens the report index with all seven reports, and each report renders on the demo (ACME's demo time is
// data/BossProjectsDemoDataTimeReports.xml), in html-print and the terminal too; the measures as §11 defines them are mr-mantle's
// WorkProjectReports. Home's charts are checked in the terminal here (its qvt render is Billing.spec.js's). joe.developer (the team,
// no money) sees five reports, may not open Profitability or Utilization, and sees no money in any report. The timesheet and the team
// timesheet print. Nothing is changed. Profitability's worker cost (its cost, margin and chart) is opted out of AI (the user's call
// of Nov 12, 2026, impl-people P25 review): an agent's terminal render shows the placeholder.
// Run: ./moq test mr-boss --spec Reports
const webroot = "component://webroot/screen/webroot.xml"

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
const ok = (page) => page.status == 200 && page.errors == "" && !page.broken
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
// the days of the user's time zone, as the reports read them
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const daysBack = (days) => new Date(Date.parse(today() + "T12:00:00Z") - days * 86400000).toISOString().slice(0, 10)
const money = /\$[0-9][0-9,]*\.\d\d/

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    },
})

feature("the report index: seven reports for john.doe, five for joe.developer", {
    when() {
        // the index is server-static (impl-projects.md P11): its qvt template holds every report's card behind its condition, so
        // what each user is offered is read from the server's merge (html)
        return { john: render("apps/Projects/Reports", {}, "html"), joe: as("joe.developer", () => render("apps/Projects/Reports", {}, "html")) }
    },
    then({ john, joe }) {
        ok(john) && john.output.includes("Time report") && john.output.includes("Profitability report") && john.output.includes("Utilization report")
        ok(joe) && joe.output.includes("Time report") && joe.output.includes("Progress report") && !joe.output.includes("Profitability report")
        !joe.output.includes("Utilization report")
    },
})

feature("the time report renders SUPP's and ACME's hours by project and person, in print and the terminal", {
    when() {
        const from = daysBack(35), thru = today()
        const page = render("apps/Projects/Reports/Time", { fromDate: from, thruDate: thru, criterion1: "project", criterion2: "person" })
        const print = render("apps/Projects/Reports/Time", { fromDate: from, thruDate: thru, criterion1: "project" }, "html-print")
        const tui = render("apps/Projects/Reports/Time", { fromDate: from, thruDate: thru, criterion1: "project" }, "tui")
        return { page, print, tui }
    },
    then({ page, print, tui }) {
        ok(page) && page.output.includes("IronStone support desk (SUPP)") && page.output.includes("Acme customer portal (ACME)") && page.output.includes("m-chart")
        page.output.includes("Joe Developer")
        ok(print) && print.output.includes("IronStone support desk (SUPP)")
        ok(tui) && tui.output.includes("TimeReportChart")
    },
})

feature("Home in the terminal: john.doe's Hours by project chart", {
    when() {
        return { tui: render("apps/Projects/Home", {}, "tui") }
    },
    then({ tui }) {
        ok(tui) && tui.output.includes("HomeHoursByProject")
    },
})

feature("the timesheet and the team timesheet print: Joe's approved week (not Bob's to see), and the support queue's time by day and person", {
    when() {
        const sheet = sys(() => Array.from(ec.entity.find("mantle.work.time.Timesheet").condition("partyId", "ORG_ZIZI_JD").condition("statusId", "TmshApproved").list())[0])
        return {
            print: render("apps/Projects/Time/TimesheetPrint", { timesheetId: sheet.timesheetId }, "html-print"),
            bob: as("bob.developer", () => render("apps/Projects/Time/TimesheetPrint", { timesheetId: sheet.timesheetId }, "html-print")),
            team: render("apps/Projects/Time/TeamTimesheet", { itemId: "SUPP-1", list: "all" }, "html-print"),
        }
    },
    then({ print, bob, team }) {
        ok(print) && print.output.includes("Joe Developer") && print.output.includes("Entries by day") && print.output.includes("Upgraded the staging servers")
        // not Bob's to see (a timesheet is its person's, its approvers' and ADMIN's); the print never shows a rate
        ok(bob) && bob.output.includes("not available") && !bob.output.includes("Upgraded the staging servers") && !money.test(print.output)
        ok(team) && team.output.includes("SUPP-1 Answer the support queue") && team.output.includes("Hours by person") && team.output.includes("Joe Developer")
        team.output.includes("Bob Developer") && !money.test(team.output)
    },
})

feature("the work item, sprint, portfolio and progress reports render on the demo, in print and the terminal", {
    when() {
        return {
            workItems: render("apps/Projects/Reports/WorkItems", { rootWorkEffortId: "IRON", groupBy: "type" }),
            workItemsTui: render("apps/Projects/Reports/WorkItems", { rootWorkEffortId: "IRON" }, "tui"),
            sprints: render("apps/Projects/Reports/Sprints", { rootWorkEffortId: "IRON" }),
            sprintsPrint: render("apps/Projects/Reports/Sprints", { rootWorkEffortId: "IRON" }, "html-print"),
            portfolioPage: render("apps/Projects/Reports/Portfolio", {}),
            progress: render("apps/Projects/Reports/Progress", { rootWorkEffortId: "IRON", depth: "2" }),
            progressPrint: render("apps/Projects/Reports/Progress", { rootWorkEffortId: "IRON", depth: "2" }, "html-print"),
        }
    },
    then({ workItems, workItemsTui, sprints, sprintsPrint, portfolioPage, progress, progressPrint }) {
        ok(workItems) && workItems.output.includes("m-chart") && ok(workItemsTui)
        ok(sprints) && sprints.output.includes("Sprint 1") && sprints.output.includes("m-chart") && ok(sprintsPrint)
        ok(portfolioPage) && portfolioPage.output.includes("IronStone Projects") && portfolioPage.output.includes("Client budget")
        ok(progress) && progress.output.includes("General availability") && progress.output.includes("IRON-1")
        ok(progressPrint) && progressPrint.output.includes("IRON-2")
    },
})

feature("profitability and utilization for john.doe: ACME and Brightwater with money, Joe's utilization, in print and the terminal", {
    when() {
        return {
            profitPage: render("apps/Projects/Reports/Profitability", {}),
            profitPrint: render("apps/Projects/Reports/Profitability", {}, "html-print"),
            profitAgent: (() => {
                const str = ec.screen.makeTest().rootScreen(webroot).renderMode("tui").agent().withStaticData()
                    .render("apps/Projects/Reports/Profitability", { lastStandalone: "true" }, null)
                ec.message.clearErrors()
                return { status: str.status, output: String(str.output || "") }
            })(),
            utilPage: render("apps/Projects/Reports/Utilization", {}),
            utilTui: render("apps/Projects/Reports/Utilization", {}, "tui"),
        }
    },
    then({ profitPage, profitPrint, profitAgent, utilPage, utilTui }) {
        ok(profitPage) && profitPage.output.includes("Brightwater Dental Group") && profitPage.output.includes("Acme customer portal") && money.test(profitPage.output)
        ok(profitPrint) && profitPrint.output.includes("Brightwater Dental Group")
        profitAgent.status == 200 && profitAgent.output.includes("Brightwater Dental Group") && profitAgent.output.includes("Not shared with AI")
        ok(utilPage) && utilPage.output.includes("Joe Developer") && ok(utilTui)
    },
})

feature("joe.developer: no Profitability or Utilization, and no money in any report he may open", {
    when() {
        return as("joe.developer", () => ({
            profit: render("apps/Projects/Reports/Profitability", {}),
            util: render("apps/Projects/Reports/Utilization", {}),
            pages: [["Time", { criterion1: "project", fromDate: daysBack(42) }], ["WorkItems", {}], ["Sprints", { rootWorkEffortId: "IRON" }], ["Portfolio", {}],
                ["Progress", { rootWorkEffortId: "IRON", depth: "2" }]].map(([name, params]) => Object.assign({ name }, render(`apps/Projects/Reports/${name}`, params))),
            print: render("apps/Projects/Reports/Time", { criterion1: "project", fromDate: daysBack(42) }, "html-print"),
        }))
    },
    then({ profit, util, pages, print }) {
        profit.status != 200 || profit.output.includes("not") && !money.test(profit.output)
        util.status != 200 || !util.output.includes("Joe Developer")
        pages.every((page) => ok(page))
        pages.filter((page) => money.test(page.output) || page.output.includes("Billable value") || page.output.includes("Client budget")).map((page) => page.name) == []
        ok(print) && !money.test(print.output)
    },
})
