// People P12's "usable when" (impl-people P12; design-people §7 LeaveRequests and LeaveRequestDetail, §13 TeamCalendar, §14.3
// "Partial-day leave and simultaneous requests"), as an acceptance walk with artifact authorization on: Tomas (people.employee),
// under Retail's annual leave with five days more, requests the morning and then the afternoon of one day from his phone
// (Leave requests at phone width: the preview, then Request leave), two requests of one day; Hannah (people.manager) approves both
// from Approvals (the notification tray's approve service, as the Approvals list calls it); the team calendar shows Tomas out that
// day, morning and afternoon, without the reason or the leave type, and Projects' capacity takes the day off his hours; Tomas
// cancels the afternoon (asked, then approved by Hannah) and his balance is given back the half day, once. The rules themselves are
// Mantle's LeaveRequests and mr-boss's PeopleLeave.
// Run: ./moq accept mr-boss --spec PeopleLeaveUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const L = "mantle.humanres.LeaveServices."
const webroot = "component://webroot/screen/webroot.xml"
const REASON = "School play in the afternoon"
// a request under the web root as the user (a transition's post, a page), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .header("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
            .render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
// Tomas's annual leave balance, as he reads it on the day of his leave (an approved request is charged on its day)
const annualBalance = () =>
    (read(users.employee, L + "get#MyBalances", {leaveTypeEnumId: "PltAnnual", asOfDate: state.day}).balances || [])[0] || {}
const dayText = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd")
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // a Wednesday three weeks from now
        const today = dayText(ec.user.timestampMillis(ec.user.nowTimestamp))
        const weekday = new Date(today + "T12:00:00Z").getUTCDay()
        state.day = new Date(Date.parse(today + "T12:00:00Z") + (21 + ((3 - weekday + 7) % 7)) * 86400000)
            .toISOString()
            .substring(0, 10)
        state.year = today.substring(0, 4)
        // Tomas under an annual leave policy of Retail on the day, with five days more for this year (HR's, through the services
        // the screens call): Retail's annual leave, or in a whole run the policy PeopleLeavePoliciesUsable put him under; five days
        // added as an adjustment, since a whole run may have granted him this year already
        state.setup = asUser(users.hr, () =>
            system(() => {
                let policyId = lib.annualPolicyOn(ids.employmentId, state.day)
                if (!policyId) {
                    invoke(L + "assign#Policy", {
                        leavePolicyId: ids.leavePolicyId,
                        partyRelationshipIds: [ids.employmentId],
                        fromDate: state.year + "-01-02",
                        reason: "Acceptance"
                    })
                    policyId = ids.leavePolicyId
                }
                return invoke(L + "allocate#Leave", {
                    leavePolicyId: policyId,
                    partyRelationshipIds: [ids.employmentId],
                    amount: "5",
                    adjustment: true,
                    reason: "Acceptance: five days for the walk",
                    periodFromDate: state.year + "-01-01",
                    periodThruDate: state.year + "-12-31",
                    operationKey: "PPL_ACCEPT_LEAVE"
                }).allocatedCount
            })
        )
        // his balance before the walk's requests (five days in a run of this spec alone)
        state.before = annualBalance()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("Tomas requests the morning and the afternoon of one day from his phone: a preview each, then two requests", {
    when() {
        const out = {}
        const terms = part => ({request: "Y", rqTypeEnumId: "PltAnnual", rqFromDate: state.day, rqPartEnumId: part})
        out.preview = request(
            users.employee,
            "apps/People/Time/LeaveRequests",
            Object.assign({lastStandalone: "-2"}, terms("LdpMorning"))
        )
        const ask = (part, reason) =>
            request(
                users.employee,
                "apps/People/Time/LeaveRequests/requestLeave",
                {
                    rqTypeEnumId: "PltAnnual",
                    rqFromDate: state.day,
                    rqPartEnumId: part,
                    reason,
                    operationKey: "PPL_ACCEPT_" + part
                },
                "post"
            )
        out.morning = ask("LdpMorning", "")
        out.afternoon = ask("LdpAfternoon", REASON)
        const mine = read(users.employee, L + "find#Requests", {mine: true}).requests || []
        state.morning = mine.find(row => row.fromDay === state.day && row.partText === "Morning")?.leaveRequestId
        state.afternoon = mine.find(row => row.fromDay === state.day && row.partText === "Afternoon")?.leaveRequestId
        out.balance = annualBalance()
        return out
    },
    then({preview, morning, afternoon, balance}) {
        state.setup == 1
        preview.status == 200 && preview.errors == "" && preview.output.includes("Left after")
        morning.errors == "" && afternoon.errors == ""
        state.morning && state.afternoon && state.morning != state.afternoon
        // two halves reserved: one day pending, one day less available
        balance.balance == state.before.balance &&
            balance.pending == state.before.pending + 1 &&
            balance.available == state.before.available - 1
    }
})

feature("Hannah approves both from Approvals; the team calendar shows Tomas out without the reason, and capacity takes the day", {
    when() {
        const out = {}
        // the Approvals list's rows are her notices of the PeopleLeaveApproval topic; approving one calls the topic's approve service
        const notices = asUser(users.manager, () =>
            system(() =>
                Array.from(
                    ec.entity
                        .find("moqui.security.user.NotificationMessageByUser")
                        .condition({userId: ec.user.userId, topic: "PeopleLeaveApproval"})
                        .list()
                )
            )
        )
        out.notices = notices.length
        for (const notice of notices)
            out["approve" + notice.notificationMessageId] = request(
                users.manager,
                "apps/People/Approvals/Notifications/approve",
                {notificationMessageId: notice.notificationMessageId},
                "post"
            ).errors
        out.states = [state.morning, state.afternoon].map(
            id => read(users.employee, L + "get#Request", {leaveRequestId: id}).request?.statusEnumId
        )
        out.calendar = request(users.manager, "apps/People/Time/TeamCalendar/calendarEvents", {
            start: state.day,
            end: state.day
        }).output
        out.capacity = read(users.system, "mantle.work.ResourceServices.get#PartyCapacity", {
            partyIdList: [ids.employeePartyId],
            fromDate: state.day,
            thruDate: state.day
        }).capacityList?.[0]
        return out
    },
    then({notices, states, calendar, capacity}) {
        notices >= 2
        states.join() == "LrsApproved,LrsApproved"
        calendar.includes("Tomas Lindqvist · Out (morning)") && calendar.includes("Tomas Lindqvist · Out (afternoon)")
        !calendar.includes(REASON) && !calendar.includes("Annual")
        capacity.dayList[0].leave > 0 && capacity.dayList[0].capacity == 0
    }
})

feature("Tomas cancels the afternoon; once Hannah approves, his balance gets the half day back, once", {
    when() {
        const out = {}
        const revision = read(users.employee, L + "get#Request", {leaveRequestId: state.afternoon}).request?.revision
        out.asked = request(
            users.employee,
            "apps/People/Time/LeaveRequestDetail/decide",
            {leaveRequestId: state.afternoon, decision: "cancel", expectedRevision: revision},
            "post"
        ).errors
        out.approved = request(
            users.manager,
            "apps/People/Time/LeaveRequestDetail/decide",
            {leaveRequestId: state.afternoon, decision: "approve"},
            "post"
        ).errors
        out.again = request(
            users.manager,
            "apps/People/Time/LeaveRequestDetail/decide",
            {leaveRequestId: state.afternoon, decision: "approve"},
            "post"
        ).errors
        out.balance = annualBalance()
        out.reversals = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.humanres.leave.LeaveLedgerEntry")
                    .condition({sourceKey: "leave-reversal:" + state.afternoon})
                    .list()
            )
        ).length
        return out
    },
    then({asked, approved, again, balance, reversals}) {
        asked == "" && approved == "" && again == ""
        // the morning taken, the afternoon given back
        balance.balance == state.before.balance - 0.5 && balance.pending == state.before.pending
        reversals == 1
    }
})
