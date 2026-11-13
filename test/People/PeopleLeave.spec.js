// People's leave requests screens (impl-people P12; design-people §7 LeaveRequests and LeaveRequestDetail, §13 TeamCalendar, PE-21):
// LeaveRequestDetail's one qvt render as the manager deciding it (the balance statement, the days, Approve, the reason the approver
// reads in its section opted out of AI) and an agent's render of it (what Assist's screen and data tools read), which shows "Not
// shared with AI" in place of the reason; the team calendar's events, its terminal twin (with Earlier and Later) and Leave requests'
// list show the absence and never the reason or the leave type; the employee opens their own request and is told another's is not available. The rules are Mantle's
// LeaveRequests; access is the time area's grant (PeopleAccess's menus).
// Run: ./moq test mr-boss --spec PeopleLeave
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const L = "mantle.humanres.LeaveServices."
const REASON = "Private family matter"
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // Tomas (people.employee) and Ines under Retail's annual leave from Jan 2 (the demo policy starts Jan 1 in the server's
        // zone), 5 days granted for 2026; Hannah (people.manager) decides their leave
        state.setup = asUser(users.hr, () =>
            system(() => {
                const assigned = invoke(L + "assign#Policy", {
                    leavePolicyId: ids.leavePolicyId,
                    partyRelationshipIds: [ids.employmentId, ids.reportEmploymentId],
                    fromDate: "2026-01-02",
                    reason: "Spec"
                })
                const granted = invoke(L + "allocate#Leave", {
                    leavePolicyId: ids.leavePolicyId,
                    partyRelationshipIds: [ids.employmentId, ids.reportEmploymentId],
                    amount: "5",
                    periodFromDate: "2026-01-01",
                    periodThruDate: "2026-12-31",
                    operationKey: "PPL_SPEC_LEAVE_GRANT"
                })
                // HR asks a day for Ines, which Tomas may not read
                const ines = invoke(L + "submit#Request", {
                    partyRelationshipId: ids.reportEmploymentId,
                    leaveTypeEnumId: "PltAnnual",
                    fromDate: "2027-04-07",
                    reason: "Ines's own"
                })
                state.inesRequest = ines.leaveRequestId
                return (
                    [assigned.assignedCount, granted.allocatedCount].join("/") +
                    (ec.message.hasError() ? " " + ec.message.getErrorsString() : "")
                )
            })
        )
        // as the employee, through Mantle's own checks (the screen's transition is the time area's grant)
        state.request = asUser(users.employee, () =>
            system(() =>
                invoke(L + "submit#Request", {
                    leaveTypeEnumId: "PltAnnual",
                    fromDate: "2027-04-06",
                    dayPartEnumId: "LdpMorning",
                    reason: REASON
                })
            )
        ).leaveRequestId
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "LeaveRequestDetail as the manager deciding it: the balance and the days, Approve, the reason in its opted-out section; an agent's render has none of it",
    {
        when() {
            const detail = asUser(users.manager, () => page("Time/LeaveRequestDetail", {leaveRequestId: state.request}))
            const agent = asUser(users.manager, () => {
                const out = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .renderMode("tui")
                    .agent()
                    .render("Time/LeaveRequestDetail", {leaveRequestId: state.request, lastStandalone: "-2"}, null)
                ec.message.clearErrors()
                return {status: out.status, output: String(out.output || "")}
            })
            const approved = asUser(users.manager, () =>
                system(() => invoke(L + "decide#Request", {leaveRequestId: state.request, decision: "approve"}))
            )
            return {detail, agent, approved}
        },
        then({detail, agent, approved}) {
            state.setup == "2/2"
            detail.status == 200 && detail.errors.length == 0
            detail.output.includes("Tomas Lindqvist: 2027-04-06") && detail.output.includes("Left after it")
            detail.output.includes("Approve") && detail.output.includes("Refuse")
            // the approver reads the reason, in a section and field opted out of AI (no text actions, nothing in Assist's page state)
            detail.output.includes(REASON) && detail.output.includes('data-ai-opt-out="section"')
            agent.status == 200 && !agent.output.includes(REASON) && agent.output.includes("Not shared with AI")
            approved.statusEnumId == "LrsApproved"
        }
    }
)

feature(
    "the team calendar and Leave requests show the absence, never its reason or type; the employee is told another's request is not available",
    {
        when() {
            const calendar = asUser(users.manager, () => {
                const out = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .render("Time/TeamCalendar/calendarEvents", {start: "2027-04-01", end: "2027-04-30"}, null)
                ec.message.clearErrors()
                return JSON.parse(String(out.output || "{}"))
            })
            // the terminal twin of the calendar from the request's fortnight, with the way to the fortnights before and after
            const twin = asUser(users.manager, () => page("Time/TeamCalendarTui", {date: "2027-04-01"}, "tui"))
            const list = asUser(users.employee, () => page("Time/LeaveRequests", {show: "mine"}, "html"))
            const other = asUser(users.employee, () =>
                page("Time/LeaveRequestDetail", {leaveRequestId: state.inesRequest}, "html")
            )
            return {calendar, twin, list, other}
        },
        then({calendar, twin, list, other}) {
            const events = Array.from(calendar.eventList || [])
            const tomas = events.find(event => event.leaveRequestId === state.request)
            tomas.title == "Tomas Lindqvist · Out (morning)" && !tomas.allDay && tomas.url.includes(state.request)
            !JSON.stringify(events).includes(REASON) && !JSON.stringify(events).includes("Annual")
            // Ines's day waits for approval: not on the calendar
            !events.some(event => event.leaveRequestId === state.inesRequest)
            twin.status == 200 && twin.errors.length == 0 && twin.output.includes("Tomas Lindqvist · Out (morning)")
            twin.output.includes("date=2027-03-18") && twin.output.includes("date=2027-04-15") && !twin.output.includes(REASON)
            list.status == 200 && list.errors.length == 0 && list.output.includes("2027-04-06") && !list.output.includes(REASON)
            other.status == 200 && other.output.includes("not available to you") && !other.output.includes("Ines's own")
        }
    }
)
