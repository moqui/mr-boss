// People's time and rates (impl-people P10, F17, F57; design-people §13 MyTime, Timesheets, TimesheetDetail, TimeEntries and Rates,
// §3 MyTeam, SelfService, §1.4 Today): Projects' time screens and Rates mounted under People, reading their context from the mount.
// Under Retail's line policy (People's demo; Services keeps Projects' project policy) the manager, who has no Projects, reminds a
// report of a missing week from My team (another employer's employee skipped), sees the report's submitted week in People's
// Timesheets with People's links and approves it on People's TimesheetDetail, which the HR officer may not; the employee's week
// to submit is their Today item and self-service card under People; payroll reads and sets an employee's pay rate in People's
// Rates and reads the labor costing rates (RaprCost) there, while client rates and another employer's employees are not
// payroll's and the HR officer's rows are refused. Mantle's rules (the policy's approvers, the reminders' check, the
// costing lookup) are Mantle's WorkTimesheets and LaborCostingRate; the access cases are PeopleAccess's (the menu, the Payroll
// capability, the employee's context). The usable-when walk is the acceptance PeopleTimeUsable.
// Run: ./moq test mr-boss --spec PeopleTime
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const TS = "mantle.work.TimesheetServices."
const BILLING = "ironstone.projects.BillingServices."
const state = {}

// a People transition posted as the user, through the web root as the browser posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen("component://webroot/screen/webroot.xml")
            .render("apps/People/" + path, parameters, "post")
        const result = {
            status: rendered.status,
            errors: Array.from(rendered.errorMessages || []).join(" | ")
        }
        ec.message.clearErrors()
        return result
    })
}
const sheetOf = partyId =>
    system(() => invoke(TS + "get#PartyTimesheet", {partyId, date: state.lastWeekDay, make: false}).timesheetId || null)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const week = invoke(TS + "get#WeekRange", {weekStart: 1})
            const last = invoke(TS + "get#WeekRange", {weekStart: 1, date: Number(String(week.fromDate)) - 86400000})
            state.lastWeekDay = last.weekStartDay
            state.lastFrom = Number(String(last.fromDate))
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the employee's week, its time and the pay rate the spec made go, so no later spec meets them
        system(() => {
            for (const sheetId of [state.sheetId].filter(Boolean)) {
                ec.entity.find("mantle.work.time.TimeEntry").condition("timesheetId", sheetId).deleteAll()
                ec.entity.find("mantle.work.time.Timesheet").condition("timesheetId", sheetId).deleteAll()
            }
            ec.entity
                .find("mantle.humanres.rate.RateAmount")
                .condition({ratePurposeEnumId: "RaprVendor", partyId: ids.employeePartyId})
                .deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature("Remind missing time from My team reaches the manager's report and skips another employer's employee", {
    when() {
        const reminded = post(users.manager, "MyTeam/remindMissing", {
            selectedIds: [ids.employeePartyId, ids.otherEmployeePartyId].join(",")
        })
        const noticesOf = partyId =>
            system(() =>
                Array.from(
                    ec.entity
                        .find("moqui.security.user.NotificationMessage")
                        .condition({topic: "TimesheetMissing", subTopic: partyId + ":" + state.lastWeekDay})
                        .list()
                )
            )
        const notices = noticesOf(ids.employeePartyId)
        const otherNotices = noticesOf(ids.otherEmployeePartyId)
        const policies = system(() => ({
            retail: invoke(TS + "get#TimesheetPolicy", {organizationPartyId: ids.organizationId}).policy.approvers,
            services: invoke(TS + "get#TimesheetPolicy", {organizationPartyId: ids.otherOrganizationId}).policy.approvers
        }))
        return {reminded, notices, otherNotices, policies}
    },
    then({reminded, notices, otherNotices, policies}) {
        reminded.errors == ""
        notices.length == 1
        // Kenji is Services' employee, not Hannah's report: she does not approve his week, so he is skipped
        otherNotices.length == 0
        // People's demo sets line on Retail; Services, Projects' demo organization, keeps the project policy
        policies.retail == "line"
        policies.services == "project"
    }
})

feature("the employee's week to submit is their Today item and self-service card under People", {
    when() {
        system(() =>
            invoke("mantle.work.TimeServices.store#TimeEntry", {
                partyId: ids.employeePartyId,
                fromDate: new Date(state.lastFrom + 33 * 3600000),
                thruDate: new Date(state.lastFrom + 36 * 3600000),
                hours: 3,
                rateTypeEnumId: "RatpNoCharge",
                comments: "Stock count"
            })
        )
        state.sheetId = sheetOf(ids.employeePartyId)
        return asUser(users.employee, () => ({
            // the source as the shell calls it, under the Commons root's grant
            today: system(() => invoke("ironstone.people.ContextServices.get#TodayItems", {}).items),
            self: invoke("mantle.humanres.PeopleServices.get#SelfService", {}),
            links: invoke("ironstone.people.ContextServices.get#SelfServiceContext", {appRoot: "Commons"}),
            hrToday: asUser(users.hr, () => system(() => invoke("ironstone.people.ContextServices.get#TodayItems", {}).items))
        }))
    },
    then({today, self, links, hrToday}) {
        today.some(
            item =>
                item.kind == "timesheet" &&
                item.timesheetId == state.sheetId &&
                item.url.startsWith("/qapps/People/Time/MyTime?weekDate=")
        )
        self.weeksToSubmit.some(week => week.timesheetId == state.sheetId && week.hours == 3 && week.overdue)
        links.myTimeUrl == "/qapps/People/Time/MyTime"
        // the HR officer keeps no time: no week of theirs to submit
        !hrToday.some(item => item.kind == "timesheet")
    }
})

feature("the manager approves the report's submitted week in People's Timesheets without Projects; the HR officer may not", {
    when() {
        const submitted = post(users.employee, "Time/MyTime/decide", {action: "submit", timesheetId: state.sheetId})
        // Timesheets under People, html (its rows): the report's week to approve, linking People's TimesheetDetail
        const list = asUser(users.manager, () => page("Time/Timesheets", {list: "toApprove"}, "html"))
        const hrApprove = asUser(users.hr, () => refusal(TS + "approve#Timesheet", {timesheetId: state.sheetId}))
        const approved = post(users.manager, "Time/TimesheetDetail/decide", {action: "approve", timesheetId: state.sheetId})
        const sheet = system(() => ec.entity.find("mantle.work.time.Timesheet").condition("timesheetId", state.sheetId).one())
        return {submitted, list, hrApprove, approved, status: sheet?.statusId}
    },
    then({submitted, list, hrApprove, approved, status}) {
        submitted.errors == ""
        list.errors.length == 0
        list.output.includes("Tomas Lindqvist")
        list.output.includes("/qapps/People/Time/TimesheetDetail?timesheetId=" + state.sheetId)
        !list.output.includes("/qapps/Projects/")
        hrApprove != ""
        approved.errors == ""
        status == "TmshApproved"
    }
})

feature(
    "Rates under People: payroll sets and reads an employee's pay rate and reads the labor costing rates; the HR officer's rows refused",
    {
        when() {
            const day = system(() => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"))
            const saved = post(users.payroll, "Payroll/Rates/saveRate", {
                ratePurposeEnumId: "RaprVendor",
                ratePartyId: ids.employeePartyId,
                rateAmount: "31.5",
                fromDate: day,
                rateCurrencyUomId: "USD"
            })
            const otherEmployer = post(users.payroll, "Payroll/Rates/saveRate", {
                ratePurposeEnumId: "RaprVendor",
                ratePartyId: ids.otherEmployeePartyId,
                rateAmount: "30",
                fromDate: day,
                rateCurrencyUomId: "USD"
            })
            const clientRate = post(users.payroll, "Payroll/Rates/saveRate", {
                ratePurposeEnumId: "RaprClient",
                rateAmount: "90",
                fromDate: day,
                rateCurrencyUomId: "USD"
            })
            // the services as Rates calls them, under the Payroll area's grant
            const pay = asUser(users.payroll, () =>
                system(() => invoke(BILLING + "find#RateRows", {ratePurposeEnumId: "RaprVendor"}))
            )
            const cost = asUser(users.payroll, () =>
                system(() => invoke(BILLING + "find#RateRows", {ratePurposeEnumId: "RaprCost"}))
            )
            // Rates under People, html: the pay rate and the Labor costing list, no client billing
            const rates = asUser(users.payroll, () => page("Payroll/Rates", {purpose: "RaprVendor"}, "html"))
            const hrRows = asUser(users.hr, () =>
                system(() => refusal(BILLING + "find#RateRows", {ratePurposeEnumId: "RaprVendor"}))
            )
            return {saved, otherEmployer, clientRate, pay, cost, rates, hrRows}
        },
        then({saved, otherEmployer, clientRate, pay, cost, rates, hrRows}) {
            saved.errors == ""
            otherEmployer.errors.includes("Payroll sets the pay rate of an employee")
            clientRate.errors.includes("Payroll sets the pay rate of an employee")
            pay.rowList.some(row => row.partyId == ids.employeePartyId && row.amountText.includes("31.50") && row.canChange)
            !pay.rowList.some(row => row.partyId == ids.otherEmployeePartyId)
            pay.counts.RaprClient == null
            cost.rowList.some(row => row.rateAmountId == ids.costingRateId && !row.canChange)
            rates.errors.length == 0
            rates.output.includes("Tomas Lindqvist")
            rates.output.includes("Labor costing")
            !rates.output.includes("Client billing")
            hrRows.includes("Rates are for those who manage money or payroll")
        }
    }
)
