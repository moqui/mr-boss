// People P10's "usable when" (impl-people P10; design-people §14.3 "Pay rates and phones", its rates half; §13 MyTime, Timesheets,
// TimesheetDetail and Rates), as an acceptance walk with artifact authorization on, through the screens' transitions: people.employee
// keeps and submits a week from People's My time (they open no People launcher, only Time & leave by its own grant); their manager,
// people.manager, who has no Projects, finds it in People's Timesheets under Retail's line policy and approves it on People's
// TimesheetDetail; people.payroll sets the employee's pay rate in People's Rates, which a Projects manager with TIME_ENTRY_RATE
// (and no payroll grant) reads as set by payroll; and finance.admin sets a labor costing rate in Accounting's Costing policies,
// which People's Rates shows payroll read only. The rules are Mantle's WorkTimesheets and LaborCostingRate and mr-boss's
// PeopleTime and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeopleTimeUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, shell} = lib
const TS = "mantle.work.TimesheetServices."
const webroot = "component://webroot/screen/webroot.xml"
const opened = rendered => rendered.status === 200 && rendered.errors === ""
const state = {}
// a Projects manager of the demo (TIME_ENTRY_RATE, no PAYROLL_VIEW), made for the walk
const projectsManager = "PPL_TIME_ACC_PM"
// the username the walk signs in with (asUser logs in by username, not by userId)
const projectsManagerUsername = "people.time.pm"
const financeAdmin = "finance.admin"
// a screen under the web root as the user (a page, or a transition's post), with its errors
function request(user, path, parameters = {}, method = null) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).renderMode("html").render(path, parameters, method)
        const output = String(result.output || "")
        const errors = Array.from(result.errorMessages || [])
            .concat(output.match(/(Error rendering|Exception in render)[^\n<]*/g) || [])
            .join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output, errors}
    })
}
const as = (user, service, parameters = {}) => asUser(user, () => system(() => invoke(service, parameters)))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const week = invoke(TS + "get#WeekRange", {weekStart: 1})
            const last = invoke(TS + "get#WeekRange", {weekStart: 1, date: Number(String(week.fromDate)) - 86400000})
            state.lastWeekDay = last.weekStartDay
            state.lastFrom = Number(String(last.fromDate))
            state.today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
            call("create#mantle.party.Party", {partyId: projectsManager, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: projectsManager, firstName: "Time walk", lastName: "Projects manager"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: projectsManager,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: projectsManager,
                username: projectsManagerUsername,
                partyId: projectsManager,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_PROJECT_MANAGER"])
                call("create#moqui.security.UserGroupMember", {userId: projectsManager, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", projectsManager)
                .updateAll({thruDate: ec.user.nowTimestamp})
            if (state.sheetId) {
                ec.entity.find("mantle.work.time.TimeEntry").condition("timesheetId", state.sheetId).deleteAll()
                ec.entity.find("mantle.work.time.Timesheet").condition("timesheetId", state.sheetId).deleteAll()
            }
            ec.entity
                .find("mantle.humanres.rate.RateAmount")
                .condition({ratePurposeEnumId: "RaprVendor", partyId: ids.employeePartyId})
                .deleteAll()
            if (state.costingRateId)
                ec.entity.find("mantle.humanres.rate.RateAmount").condition("rateAmountId", state.costingRateId).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "people.employee submits a week from People's My time, and people.manager approves it in People's Timesheets without Projects",
    {
        when() {
            const problems = []
            if (shell(users.employee).apps.includes("People")) problems.push("the employee has the People launcher")
            if (shell(users.manager).apps.includes("Projects")) problems.push("the manager has Projects")
            // the employee's week: an entry of last week (no work item), then Submit week, through My time's transitions
            const myTime = request(users.employee, "apps/People/Time/MyTime")
            if (!opened(myTime)) problems.push(`My time: ${myTime.status} ${myTime.errors}`)
            const logged = request(
                users.employee,
                "apps/People/Time/MyTime/saveEntry",
                {day: state.lastWeekDay, hours: "4", billable: "N", comments: "Inventory count"},
                "post"
            )
            if (logged.errors) problems.push(`the employee logs time: ${logged.errors}`)
            state.sheetId = system(
                () =>
                    invoke(TS + "get#PartyTimesheet", {partyId: ids.employeePartyId, date: state.lastWeekDay, make: false})
                        .timesheetId
            )
            const submitted = request(
                users.employee,
                "apps/People/Time/MyTime/decide",
                {action: "submit", timesheetId: state.sheetId},
                "post"
            )
            if (submitted.errors) problems.push(`the employee submits: ${submitted.errors}`)
            // the manager: People's Timesheets lists it to approve, linking People's TimesheetDetail, where they approve it
            const list = request(users.manager, "apps/People/Time/Timesheets", {list: "toApprove"})
            if (!opened(list) || !list.output.includes("Tomas Lindqvist") || !list.output.includes("People/Time/TimesheetDetail"))
                problems.push(`the manager's Timesheets: ${list.status} ${list.errors}`)
            const detail = request(users.manager, "apps/People/Time/TimesheetDetail", {timesheetId: state.sheetId})
            if (!opened(detail) || !detail.output.includes("Approve"))
                problems.push(`the manager's TimesheetDetail: ${detail.status} ${detail.errors}`)
            const approved = request(
                users.manager,
                "apps/People/Time/TimesheetDetail/decide",
                {action: "approve", timesheetId: state.sheetId},
                "post"
            )
            if (approved.errors) problems.push(`the manager approves: ${approved.errors}`)
            const status = system(
                () => ec.entity.find("mantle.work.time.Timesheet").condition("timesheetId", state.sheetId).one()?.statusId
            )
            if (status !== "TmshApproved") problems.push(`the week is ${status}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "people.payroll sets the employee's pay rate in People's Rates, which a Projects manager with TIME_ENTRY_RATE reads as payroll's",
    {
        when() {
            const problems = []
            const saved = request(
                users.payroll,
                "apps/People/Payroll/Rates/saveRate",
                {
                    ratePurposeEnumId: "RaprVendor",
                    ratePartyId: ids.employeePartyId,
                    rateAmount: "27.75",
                    fromDate: state.today,
                    rateCurrencyUomId: "USD"
                },
                "post"
            )
            if (saved.errors) problems.push(`payroll sets the pay rate: ${saved.errors}`)
            const rates = request(users.payroll, "apps/People/Payroll/Rates", {purpose: "RaprVendor"})
            if (!opened(rates) || !rates.output.includes("27.75"))
                problems.push(`payroll's Rates: ${rates.status} ${rates.errors}`)
            // the Projects manager's Rates (Projects' own mount): the employee's worker pay rate without its amount
            const pmRows =
                as(projectsManagerUsername, "ironstone.projects.BillingServices.find#RateRows", {
                    ratePurposeEnumId: "RaprVendor",
                    partyId: ids.employeePartyId
                }).rowList || []
            const row = pmRows.find(one => one.partyId === ids.employeePartyId)
            if (!row || row.amountText !== "Set by payroll" || row.rateAmount != null || row.canChange)
                problems.push(`the Projects manager reads the pay rate: ${JSON.stringify(row)}`)
            const pmRates = request(projectsManagerUsername, "apps/Projects/Billing/Rates", {purpose: "RaprVendor"})
            if (!opened(pmRates) || pmRates.output.includes("27.75"))
                problems.push(`the Projects manager's Rates: ${pmRates.status} ${pmRates.errors}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "finance.admin sets a labor costing rate in Accounting's Costing policies, which People's Rates shows payroll read only",
    {
        when() {
            const problems = []
            const policies = request(financeAdmin, "apps/Accounting/Settings/CostingPolicies")
            if (!opened(policies) || !policies.output.includes("Labor costing rates"))
                problems.push(`Costing policies: ${policies.status} ${policies.errors}`)
            const saved = request(
                financeAdmin,
                "apps/Accounting/Settings/CostingPolicies/saveCostingRate",
                {workTypeEnumId: "WktpProductionSetup", rateAmount: "33.25", rateCurrencyUomId: "USD"},
                "post"
            )
            if (saved.errors) problems.push(`finance sets the costing rate: ${saved.errors}`)
            state.costingRateId = system(
                () => invoke("mantle.humanres.RateServices.get#CostingRate", {workTypeEnumId: "WktpProductionSetup"}).rateAmountId
            )
            const rows =
                as(users.payroll, "ironstone.projects.BillingServices.find#RateRows", {ratePurposeEnumId: "RaprCost"}).rowList ||
                []
            const row = rows.find(one => one.rateAmountId === state.costingRateId)
            if (!row || row.canChange || !row.amountText.includes("33.25"))
                problems.push(`payroll's costing row: ${JSON.stringify(row)}`)
            const rates = request(users.payroll, "apps/People/Payroll/Rates", {purpose: "RaprCost"})
            if (!opened(rates) || !rates.output.includes("33.25") || rates.output.includes("EditRateDialog"))
                problems.push(`payroll's Labor costing: ${rates.status} ${rates.errors}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
