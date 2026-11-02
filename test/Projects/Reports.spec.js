// The usable-when walk of IronStone Projects P9 Reports and outputs (impl-projects.md P9; design-projects.md §11 Reports, §3 Home's manager
// charts, §14 the timesheet and team timesheet prints) on the demo data, with authorization on: john.doe (a Projects manager who manages
// money) opens the report index with all seven reports, and each report renders on the demo with its measures as §11 defines them (checked
// against the time entries and rates behind them: the time report's hours and billable value, the profitability's cost and value of ACME,
// whose demo time is data/BossProjectsDemoDataTimeReports.xml, the utilization of Joe over his capacity, the portfolio's % complete), in
// html-print and the terminal too; Home shows him Hours by project and Unbilled by client. joe.developer (the team, no money) sees five
// reports, may not open Profitability or Utilization, and sees no money in any report nor the charts on Home. The timesheet and the team
// timesheet print. Nothing is changed.
// Run: ./moq test mr-boss --spec Reports
const webroot = "component://webroot/screen/webroot.xml"
const REPORT = "mantle.work.ProjectReportServices"

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
const num = (value) => value == null ? 0 : Number(String(value))
const round = (value) => Math.round(value * 100) / 100
const near = (left, right) => Math.abs(num(left) - num(right)) < 0.006
// the days of the user's time zone, as the reports read them
const dayOf = (value) => ec.l10n.format(value, "yyyy-MM-dd")
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const daysBack = (days) => new Date(Date.parse(today() + "T12:00:00Z") - days * 86400000).toISOString().slice(0, 10)
const money = /\$[0-9][0-9,]*\.\d\d/
const one = (entityName, fields) => ec.entity.find(entityName).condition(fields).one()

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

feature("the time report: SUPP's and ACME's hours by project and week match their time entries, with the billable value at the client rates", {
    when() {
        const from = daysBack(35), thru = today()
        const page = render("apps/Projects/Reports/Time", { fromDate: from, thruDate: thru, criterion1: "project", criterion2: "person" })
        const print = render("apps/Projects/Reports/Time", { fromDate: from, thruDate: thru, criterion1: "project" }, "html-print")
        const tui = render("apps/Projects/Reports/Time", { fromDate: from, thruDate: thru, criterion1: "project" }, "tui")
        const out = sys(() => call(`${REPORT}.get#TimeReport`, { fromDate: from, thruDate: thru, criteria: ["project"] }))
        // the entries behind it, with the rate each is valued at (its own hour rate, else its RateAmount's)
        const expected = sys(() => {
            const sums = {}
            for (const entry of ec.entity.find("mantle.work.time.TimeEntryAndWorkEffort").condition("rootWorkEffortId", "in", ["SUPP", "ACME"])
                    .condition("fromDate", "greater-equals", ec.l10n.parseTimestamp(from + " 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")).list()) {
                if (dayOf(entry.fromDate) > thru) continue
                const one = sums[entry.rootWorkEffortId] || (sums[entry.rootWorkEffortId] = { hours: 0, billable: 0, amount: 0 })
                one.hours += num(entry.hours)
                if (entry.rateTypeEnumId === "RatpNoCharge") continue
                one.billable += num(entry.hours)
                const rate = entry.clientHourRate != null ? num(entry.clientHourRate)
                        : num(ec.entity.find("mantle.humanres.rate.RateAmount").condition("rateAmountId", entry.rateAmountId).one()?.rateAmount)
                one.amount += round(num(entry.hours) * rate)
            }
            return sums
        })
        const rowOf = (id) => out.rowList.find((row) => row.values[0].id == id)
        return { page, print, tui, supp: rowOf("SUPP"), acme: rowOf("ACME"), expected }
    },
    then({ page, print, tui, supp, acme, expected }) {
        ok(page) && page.output.includes("IronStone support desk (SUPP)") && page.output.includes("Acme customer portal (ACME)") && page.output.includes("m-chart")
        page.output.includes("Joe Developer")
        ok(print) && print.output.includes("IronStone support desk (SUPP)")
        ok(tui) && tui.output.includes("TimeReportChart")
        near(supp.hours, expected.SUPP.hours) && near(supp.billableHours, expected.SUPP.billable) && near(supp.amount, expected.SUPP.amount)
        // ACME's demo time: 32 hours, all billable
        near(acme.hours, 32) && near(acme.hours, expected.ACME.hours) && near(acme.amount, expected.ACME.amount) && acme.amount > 0
    },
})

feature("Home: john.doe sees Hours by project and Unbilled by client with their tables; joe.developer sees neither", {
    when() {
        return { john: render("apps/Projects/Home"), joe: as("joe.developer", () => render("apps/Projects/Home")),
            tui: render("apps/Projects/Home", {}, "tui") }
    },
    then({ john, joe, tui }) {
        ok(john) && john.output.includes("Hours by project") && john.output.includes("Unbilled by client") && john.output.includes("HomeHoursByProject")
        john.output.includes("Brightwater Dental Group")
        ok(tui) && tui.output.includes("HomeHoursByProject")
        ok(joe) && !joe.output.includes("Hours by project") && !joe.output.includes("Unbilled by client")
    },
})

feature("the timesheet and the team timesheet print: Joe's approved week (not Bob's to see), and the support queue's time by day and person", {
    when() {
        const sheet = sys(() => Array.from(ec.entity.find("mantle.work.time.Timesheet").condition("partyId", "ORG_ZIZI_JD").condition("statusId", "TmshApproved").list())[0])
        return {
            print: render("apps/Projects/Time/TimesheetPrint", { timesheetId: sheet.timesheetId }, "html-print"),
            bob: as("bob.developer", () => render("apps/Projects/Time/TimesheetPrint", { timesheetId: sheet.timesheetId }, "html-print")),
            team: render("apps/Projects/Time/TeamTimesheet", { itemId: "SUPP-1", list: "all" }, "html-print"),
            link: render("apps/Projects/Time/TimeEntries", { list: "all", itemId: "SUPP-1" }),
        }
    },
    then({ print, bob, team, link }) {
        ok(print) && print.output.includes("Joe Developer") && print.output.includes("Entries by day") && print.output.includes("Upgraded the staging servers")
        // not Bob's to see (a timesheet is its person's, its approvers' and ADMIN's); the print never shows a rate
        ok(bob) && bob.output.includes("not available") && !bob.output.includes("Upgraded the staging servers") && !money.test(print.output)
        ok(team) && team.output.includes("SUPP-1 Answer the support queue") && team.output.includes("Hours by person") && team.output.includes("Joe Developer")
        team.output.includes("Bob Developer") && !money.test(team.output)
        ok(link) && link.output.includes("TeamTimesheet?renderMode=html-print")
    },
})

feature("the work item, sprint, portfolio and progress reports render on the demo, in print and the terminal, with their measures", {
    when() {
        const portfolio = sys(() => call(`${REPORT}.get#PortfolioStatus`, {}))
        const iron = sys(() => one("mantle.work.effort.WorkEffort", { workEffortId: "IRON" }))
        return {
            workItems: render("apps/Projects/Reports/WorkItems", { rootWorkEffortId: "IRON", groupBy: "type" }),
            workItemsTui: render("apps/Projects/Reports/WorkItems", { rootWorkEffortId: "IRON" }, "tui"),
            sprints: render("apps/Projects/Reports/Sprints", { rootWorkEffortId: "IRON" }),
            sprintsPrint: render("apps/Projects/Reports/Sprints", { rootWorkEffortId: "IRON" }, "html-print"),
            portfolioPage: render("apps/Projects/Reports/Portfolio", {}),
            progress: render("apps/Projects/Reports/Progress", { rootWorkEffortId: "IRON", depth: "2" }),
            progressPrint: render("apps/Projects/Reports/Progress", { rootWorkEffortId: "IRON", depth: "2" }, "html-print"),
            ironRow: portfolio.projectList.find((row) => row.workEffortId == "IRON"), iron,
        }
    },
    then({ workItems, workItemsTui, sprints, sprintsPrint, portfolioPage, progress, progressPrint, ironRow, iron }) {
        ok(workItems) && workItems.output.includes("m-chart") && ok(workItemsTui)
        ok(sprints) && sprints.output.includes("Sprint 1") && sprints.output.includes("m-chart") && ok(sprintsPrint)
        ok(portfolioPage) && portfolioPage.output.includes("IronStone Projects") && portfolioPage.output.includes("Client budget")
        // % complete: the estimate less what remains, over the estimate
        near(ironRow.percentComplete, round((num(iron.estimatedWorkTime) - num(iron.remainingWorkTime)) * 100 / num(iron.estimatedWorkTime)))
        ok(progress) && progress.output.includes("General availability") && progress.output.includes("IRON-1")
        ok(progressPrint) && progressPrint.output.includes("IRON-2")
    },
})

feature("profitability and utilization for john.doe: ACME's cost at the workers' rates and value at the client rate; Joe's utilization over his capacity", {
    when() {
        const from = daysBack(42), thru = today()
        const profit = sys(() => call(`${REPORT}.get#ProjectProfitability`, { rootWorkEffortId: "ACME", fromDate: from, thruDate: thru })).projectList[0]
        const expected = sys(() => {
            const sums = { cost: 0, value: 0 }
            const rate = (own, id) => own != null ? num(own) : num(ec.entity.find("mantle.humanres.rate.RateAmount").condition("rateAmountId", id).one()?.rateAmount)
            for (const entry of ec.entity.find("mantle.work.time.TimeEntryAndWorkEffort").condition("rootWorkEffortId", "ACME").list()) {
                if (dayOf(entry.fromDate) < from) continue
                sums.cost += round(num(entry.hours) * rate(entry.vendorHourRate, entry.vendorRateAmountId))
                if (entry.rateTypeEnumId !== "RatpNoCharge") sums.value += round(num(entry.hours) * rate(entry.clientHourRate, entry.rateAmountId))
            }
            return sums
        })
        const utilization = sys(() => call(`${REPORT}.get#Utilization`, { partyId: "ORG_ZIZI_JD", weeks: 4 }))
        return {
            profitPage: render("apps/Projects/Reports/Profitability", {}),
            profitPrint: render("apps/Projects/Reports/Profitability", {}, "html-print"),
            utilPage: render("apps/Projects/Reports/Utilization", {}),
            utilTui: render("apps/Projects/Reports/Utilization", {}, "tui"),
            profit, expected, joe: utilization.personList[0],
        }
    },
    then({ profitPage, profitPrint, utilPage, utilTui, profit, expected, joe }) {
        ok(profitPage) && profitPage.output.includes("Brightwater Dental Group") && profitPage.output.includes("Acme customer portal") && money.test(profitPage.output)
        ok(profitPrint) && profitPrint.output.includes("Brightwater Dental Group")
        near(profit.timeCost, expected.cost) && near(profit.timeValue, expected.value) && profit.timeValue > 0
        near(profit.margin, profit.billableValue - profit.cost)
        ok(utilPage) && utilPage.output.includes("Joe Developer") && ok(utilTui)
        joe.weekList.filter((week) => week.utilization != null).every((week) => near(week.utilization, round(week.logged * 100 / week.capacity)))
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
