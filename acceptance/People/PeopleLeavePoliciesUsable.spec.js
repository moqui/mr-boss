// People P11's "usable when" (impl-people P11; design-people §7 LeavePolicies, LeavePolicyDetail, LeaveAllocations and
// LeaveBalances, §14.3 "Accrual and schedule changes"), as an acceptance walk with artifact authorization on: people.hr defines an
// annual-leave policy of Retail with monthly accrual (1.5 days a month) and a blocked week through LeavePolicies and
// LeavePolicyDetail, assigns it to Tomas and Ines from the first day of the month three months ago, allocates five days for this
// year to the Store Operations department through Allocations (previewed first: Rafael, not under the policy, is refused and named,
// Tomas and Ines are granted), runs the accrual twice (the first posts the three ended months of each, the second nothing), and
// reads each balance's movements on LeaveBalances (the grant and three accruals, 9.5 days). The rules themselves are Mantle's
// LeaveLedger and mr-boss's PeopleAccessLater.
// Run: ./moq accept mr-boss --spec PeopleLeavePoliciesUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const L = "mantle.humanres.LeaveServices."
const webroot = "component://webroot/screen/webroot.xml"
// Ines and Rafael, Retail employees in Store Operations beside Tomas (ids.employmentId)
const inesEmploymentId = "BOSS_PPL_INES_EMP"
const rafaelEmploymentId = "BOSS_PPL_RAFAEL_EMP"
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// the ledger entries of employments (the walk's checks read what the screens posted)
const entries = conditions =>
    system(() => Array.from(ec.entity.find("mantle.humanres.leave.LeaveLedgerEntry").condition(conditions).list()))
// a Mantle read as the user, for the walk's checks (the screens show the same answer)
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const dayText = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd")
// a calendar date (a Date at UTC noon or midnight) as yyyy-MM-dd
const utcDayText = date =>
    [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0")].join("-")
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the first day of the month three months ago, this year's first and last days, and the Monday to Friday of the week eight
        // weeks from now (out of the way of the leave the walks after it ask for Tomas, PeopleLeaveUsable's and
        // PeopleRosterUsable's, within five weeks: he stays under this policy in a whole run)
        const today = dayText(ec.user.timestampMillis(ec.user.nowTimestamp))
        const [year, month] = today.split("-").map(Number)
        const first = new Date(Date.UTC(year, month - 1 - 3, 1))
        state.assignFrom = utcDayText(first)
        state.yearFrom = year + "-01-01"
        state.yearThru = year + "-12-31"
        const weekday = new Date(today + "T12:00:00Z").getUTCDay()
        const monday = new Date(Date.parse(today + "T12:00:00Z") + (((8 - weekday) % 7 || 7) + 49) * 86400000)
        state.blockFrom = utcDayText(monday)
        state.blockThru = utcDayText(new Date(monday.getTime() + 4 * 86400000))
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("people.hr defines an annual-leave policy with monthly accrual and a blocked week, and assigns it to Tomas and Ines", {
    when() {
        const problems = []
        const created = request(
            users.hr,
            "apps/People/Time/LeavePolicies/storePolicy",
            {
                organizationPartyId: ids.organizationId,
                policyName: "Store annual leave",
                leaveTypeEnumId: "PltAnnual",
                unitEnumId: "LuDays",
                accrualFrequencyEnumId: "LafMonthly",
                isPaid: "Y",
                allocationRequired: "Y",
                fromDate: state.assignFrom
            },
            "post"
        )
        if (created.errors) problems.push(`the policy: ${created.errors}`)
        state.policyId = read(users.hr, L + "find#Policies", {term: "Store annual leave"}).policies[0]?.leavePolicyId
        const revision = () => read(users.hr, L + "get#Policy", {leavePolicyId: state.policyId}).policy.revision
        const step = request(
            users.hr,
            "apps/People/Time/LeavePolicyDetail/storeRule",
            {
                leavePolicyId: state.policyId,
                expectedRevision: revision(),
                serviceMonthsFrom: "0",
                amount: "1.5",
                capAmount: "25",
                carryLimit: "5",
                fromDate: state.assignFrom
            },
            "post"
        )
        if (step.errors) problems.push(`the accrual step: ${step.errors}`)
        const blocked = request(
            users.hr,
            "apps/People/Time/LeavePolicyDetail/storeBlock",
            {
                leavePolicyId: state.policyId,
                blockKindEnumId: "LbkBlocked",
                leaveTypeEnumId: "PltAnnual",
                fromDate: state.blockFrom,
                thruDate: state.blockThru,
                reason: "Stocktake week"
            },
            "post"
        )
        if (blocked.errors) problems.push(`the blocked week: ${blocked.errors}`)
        for (const partyRelationshipId of [ids.employmentId, inesEmploymentId]) {
            const assigned = request(
                users.hr,
                "apps/People/Time/LeavePolicyDetail/assignPolicy",
                {leavePolicyId: state.policyId, partyRelationshipId, fromDate: state.assignFrom, reason: "Store staff"},
                "post"
            )
            if (assigned.errors) problems.push(`the assignment of ${partyRelationshipId}: ${assigned.errors}`)
        }
        const policy = read(users.hr, L + "get#Policy", {leavePolicyId: state.policyId})
        const detail = asUser(users.hr, () => page("Time/LeavePolicyDetail", {leavePolicyId: state.policyId}, "html"))
        return {problems, policy, detail}
    },
    then({problems, policy, detail}) {
        problems.join("\n") == ""
        policy.policy.accrualText == "1.5 days a month"
        policy.policy.assignedCount == 2
        policy.blockedIntervals.length == 1
        policy.blockedIntervals[0].fromDay == state.blockFrom
        detail.status == 200
        detail.errors.length == 0
        detail.output.includes("Stocktake week")
        detail.output.includes("Tomas Lindqvist")
    }
})

feature(
    "people.hr allocates five days to Store Operations: Rafael, not under the policy, is refused and named; Tomas and Ines are granted",
    {
        when() {
            const terms = {
                leavePolicyId: state.policyId,
                departmentPartyId: ids.departmentId,
                amount: "5",
                periodFromDate: state.yearFrom,
                periodThruDate: state.yearThru,
                reason: "This year's grant"
            }
            const preview = asUser(users.hr, () => page("Time/LeaveAllocations", Object.assign({preview: "Y"}, terms), "html"))
            const previewed = read(users.hr, L + "preview#Allocation", terms)
            const allocated = request(
                users.hr,
                "apps/People/Time/LeaveAllocations/allocate",
                Object.assign({operationKey: previewed.operationKey}, terms),
                "post"
            )
            const grants = () =>
                [ids.employmentId, inesEmploymentId, rafaelEmploymentId].map(
                    partyRelationshipId =>
                        entries({partyRelationshipId, leavePolicyId: state.policyId, entryTypeEnumId: "LletGrant"}).length
                )
            const granted = grants()
            // the same confirmation again (a double submit) posts nothing more
            const again = request(
                users.hr,
                "apps/People/Time/LeaveAllocations/allocate",
                Object.assign({operationKey: previewed.operationKey}, terms),
                "post"
            )
            // the three of the demo; another spec's hire into Store Operations (in a whole run) is not under the policy either
            const known = [ids.employmentId, inesEmploymentId, rafaelEmploymentId]
            const outcomes = previewed.rows
                .filter(row => known.includes(row.partyRelationshipId))
                .map(row => row.partyRelationshipId + ":" + (row.reasonCode || row.outcome))
                .sort()
            return {preview, previewed, allocated, again, outcomes, granted, regranted: grants()}
        },
        then({preview, previewed, allocated, again, outcomes, granted, regranted}) {
            preview.status == 200
            preview.errors.length == 0
            preview.output.includes("Rafael Mbeki")
            preview.output.includes("Not under Store annual leave in that period")
            outcomes == [ids.employmentId + ":ready", inesEmploymentId + ":ready", rafaelEmploymentId + ":NOT_ASSIGNED"].sort()
            previewed.readyCount == 2
            allocated.errors == ""
            again.errors == ""
            granted == [1, 1, 0]
            regranted == [1, 1, 0]
        }
    }
)

feature("people.hr runs the accrual twice: the first posts the three ended months of Tomas and Ines, the second nothing", {
    when() {
        const run = () =>
            request(users.hr, "apps/People/Time/LeavePolicyDetail/runAccrual", {leavePolicyId: state.policyId}, "post")
        const accruals = () => entries({leavePolicyId: state.policyId, entryTypeEnumId: "LletAccrual"}).length
        const before = accruals()
        const first = run()
        const afterFirst = accruals()
        const second = run()
        return {first, second, posted: [afterFirst - before, accruals() - afterFirst]}
    },
    then({first, second, posted}) {
        first.errors == ""
        second.errors == ""
        posted == [6, 0]
    }
})

feature("people.hr reads each balance's movements: the grant and three accruals, 9.5 days, on LeaveBalances", {
    when() {
        const balances = read(users.hr, L + "get#Balances", {departmentPartyId: ids.departmentId, leaveTypeEnumId: "PltAnnual"})
        const rows = balances.balances.filter(row => row.leavePolicyId === state.policyId)
        const movements = [ids.employmentId, inesEmploymentId].map(partyRelationshipId => {
            const rendered = asUser(users.hr, () =>
                page("Time/LeaveBalances", {partyRelationshipId, leaveTypeEnumId: "PltAnnual"}, "html")
            )
            const ledger = read(users.hr, L + "find#Ledger", {partyRelationshipId, leaveTypeEnumId: "PltAnnual"})
            return {
                status: rendered.status,
                errors: rendered.errors.length,
                shown: rendered.output.includes("Movements of") && rendered.output.includes("Allocation for " + state.yearFrom),
                kinds: ledger.entries
                    .map(entry => entry.entryTypeEnumId)
                    .sort()
                    .join(",")
            }
        })
        return {rows, movements}
    },
    then({rows, movements}) {
        rows.map(row => row.partyRelationshipId + ":" + row.balance).sort() ==
            [ids.employmentId + ":9.5", inesEmploymentId + ":9.5"].sort()
        movements.every(row => row.status == 200 && row.errors == 0 && row.shown)
        movements.map(row => row.kinds) ==
            ["LletAccrual,LletAccrual,LletAccrual,LletGrant", "LletAccrual,LletAccrual,LletAccrual,LletGrant"]
    }
})
