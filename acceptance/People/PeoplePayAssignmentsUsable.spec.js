// People P23's "usable when" (impl-people P23; design-people §8 PayAssignments, §4 Employee360's Compensation and EmploymentChange's
// pay change), as an acceptance walk with artifact authorization on, through the screens' transitions: the payroll operator
// (people.payroll) gives Leon a salary on Employee360's Compensation (his first, applied on the payroll approver's approval, the
// user's call of Nov 12, 2026), assigns him a published structure and
// the monthly pay group from a date on PayAssignments (previewed first), saves his tax profile with the demonstration localization's
// fields and sees his readiness clear; the HR officer (people.hr) opens the same Employee360 with no Compensation region. Then a
// raise for Tomas waits for the employer's payroll approver (people.payapprover), who reads and approves it, while his manager
// (people.manager, Hannah) reads nothing of it, and the salary in effect ends on its date. The rules themselves are Mantle's PayAssignments and mr-boss's PeoplePayAssignments and PeopleAccessLater.
// Run: ./moq accept mr-boss --spec PeoplePayAssignmentsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const P = "mantle.humanres.PayrollSetupServices."
const webroot = "component://webroot/screen/webroot.xml"
const payroll = users.payroll
const leonId = ids.unmanagedPartyId
const leonEmploymentId = "BOSS_PPL_LEON_EMP"
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a Mantle read or call as the user, for the walk's set-up and checks (the screens show the same answer)
const as = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const compensation = (user, partyId) => as(user, P + "get#Compensation", {partyId})
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // Retail's configuration, as P22's walk makes it: a salary component published on the payroll approver's approval, a
        // salaried structure with it, published the same way, and a monthly group bound to the demonstration localization
        const account = system(
            () =>
                ec.entity
                    .find("mantle.ledger.account.GlAccountOrganization")
                    .condition("organizationPartyId", ids.organizationId)
                    .orderBy("glAccountId")
                    .limit(1)
                    .one()?.glAccountId
        )
        const approve = parameters =>
            as(users.payApprover, P + "decide#Publication", Object.assign({decision: "approve"}, parameters))
        const salary = as(payroll, P + "store#Component", {
            organizationPartyId: ids.organizationId,
            componentCode: "WALK23_SALARY",
            componentName: "Monthly salary",
            componentKindEnumId: "PckEarning",
            basisEnumId: "PcbFormula",
            formula: "round(monthlySalary, 2)",
            inputNames: "monthlySalary",
            currencyUomId: "USD",
            expenseGlAccountId: account
        }).payrollComponentId
        const componentRevision = () => as(payroll, P + "find#Components", {payrollComponentId: salary}).component.revision
        as(payroll, P + "store#ComponentExample", {
            payrollComponentId: salary,
            expectedRevision: componentRevision(),
            exampleName: "A month",
            inputValues: "monthlySalary = 3200",
            expectedAmount: "3200.00"
        })
        // published from the start of today, so an assignment from today finds them in effect (published with no date, they
        // start at the publishing moment, after today's midnight)
        as(payroll, P + "publish#Component", {
            payrollComponentId: salary,
            expectedRevision: componentRevision(),
            fromDate: today(),
            reason: "Walk"
        })
        approve({payrollComponentId: salary})
        state.structureId = as(payroll, P + "store#Structure", {
            organizationPartyId: ids.organizationId,
            structureName: "Walk salaried staff",
            currencyUomId: "USD",
            payBasisEnumId: "PpbSalaried"
        }).payrollStructureId
        const structureRevision = () =>
            as(payroll, P + "find#Structures", {payrollStructureId: state.structureId}).structure.revision
        as(payroll, P + "store#StructureComponent", {
            payrollStructureId: state.structureId,
            expectedRevision: structureRevision(),
            payrollComponentId: salary
        })
        as(payroll, P + "publish#Structure", {
            payrollStructureId: state.structureId,
            expectedRevision: structureRevision(),
            fromDate: today(),
            reason: "Walk"
        })
        approve({payrollStructureId: state.structureId})
        state.groupId = as(payroll, P + "store#Group", {
            organizationPartyId: ids.organizationId,
            groupName: "Walk monthly",
            currencyUomId: "USD",
            timePeriodTypeId: "PayrollMonth",
            firstPeriodFromDate: "2026-01-01",
            periodsPerYear: "12",
            payDateOffsetDays: "0",
            prorationEnumId: "PprCalendarDays",
            timeBasisEnumId: "PtbSchedule",
            payrollLocalizationId: "PlzDemonstration"
        }).payrollGroupId
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the payroll operator gives Leon a salary and a structure from a date, saves his tax profile and sees his readiness clear",
    {
        when() {
            const problems = []
            const post = (path, parameters) => {
                const out = request(payroll, "apps/People/" + path, parameters, "post")
                if (out.errors) problems.push(`${path}: ${out.errors}`)
                return out
            }
            // his first salary, on Employee360's Compensation: a pay change the payroll approver approves
            post("Employees/Employee360/changePay", {
                partyId: leonId,
                partyRelationshipId: leonEmploymentId,
                salaryAmount: "3200",
                salaryCurrencyUomId: "USD",
                salaryPeriodTypeId: "PayrollMonth",
                effectiveDate: today(),
                reason: "Starting salary",
                expectedRevision: compensation(payroll, leonId).payRevision
            })
            const leonChange = Array.from(compensation(payroll, leonId).payChanges || [])[0]
            if (leonChange)
                as(users.payApprover, "mantle.humanres.PeopleServices.decide#EmploymentChange", {
                    employmentChangeId: leonChange.employmentChangeId,
                    decision: "approve"
                })
            else problems.push("Leon's first salary is not waiting for approval")
            const assign = preview =>
                post("Payroll/PayAssignments/assignPay", {
                    organizationPartyId: ids.organizationId,
                    partyRelationshipIds: leonEmploymentId,
                    payrollStructureId: state.structureId,
                    payrollGroupId: state.groupId,
                    fromDate: today(),
                    isPrimary: "Y",
                    preview: preview ? "Y" : ""
                })
            assign(true)
            const afterPreview = compensation(payroll, leonId).assignments.length
            assign(false)
            const beforeProfile = compensation(payroll, leonId).readiness.reasonCode
            const profile = compensation(payroll, leonId).profile
            post("Payroll/PayAssignments/storeProfile", {
                partyRelationshipId: leonEmploymentId,
                payrollLocalizationId: profile.payrollLocalizationId,
                expectedRevision: profile.revision,
                name1: "levyRegion",
                value1: "NORTH",
                name2: "levyExempt",
                value2: "N",
                reason: "Starting"
            })
            const after = compensation(payroll, leonId)
            const list = asUser(payroll, () =>
                page(
                    "Payroll/PayAssignments",
                    {organizationPartyId: ids.organizationId, term: "Leon", readiness: "ready"},
                    "html"
                )
            )
            return {problems, afterPreview, beforeProfile, after, list}
        },
        then({problems, afterPreview, beforeProfile, after, list}) {
            problems.join("\n") == ""
            afterPreview == 0
            beforeProfile == "PROFILE_MISSING"
            after.currentSalary.salaryText == "$3,200.00 a month"
            after.primary.structureName == "Walk salaried staff"
            after.primary.groupName == "Walk monthly"
            after.readiness.state == "ready"
            list.errors.length == 0
            list.output.includes("Walk salaried staff")
            list.output.includes("Ready for a preview run")
        }
    }
)

feature("the HR officer opens Leon's Employee360 with no Compensation region; the payroll operator's shows it", {
    when() {
        const render = user =>
            asUser(user, () => page("Employees/Employee360", {partyId: leonId, partyRelationshipId: leonEmploymentId}, "html"))
        return {hr: render(users.hr), payroll: render(payroll)}
    },
    then({hr, payroll}) {
        hr.status == 200 && hr.errors.length == 0
        !hr.output.includes("Compensation")
        !hr.output.includes("3,200")
        payroll.errors.length == 0
        payroll.output.includes("Compensation")
        payroll.output.includes("$3,200.00 a month")
        payroll.output.includes("Walk salaried staff")
    }
})

feature(
    "a raise for Tomas waits for the payroll approver, who reads and approves it; his manager reads nothing of it; the salary in effect ends on its date",
    {
        when() {
            const problems = []
            const post = (user, path, parameters) => {
                const out = request(user, "apps/People/" + path, parameters, "post")
                if (out.errors) problems.push(`${user} ${path}: ${out.errors}`)
                return out
            }
            const change = (amount, effectiveDate, reason) =>
                post(payroll, "Employees/Employee360/changePay", {
                    partyId: ids.employeePartyId,
                    partyRelationshipId: ids.employmentId,
                    salaryAmount: amount,
                    salaryCurrencyUomId: "USD",
                    salaryPeriodTypeId: "PayrollMonth",
                    effectiveDate,
                    reason,
                    expectedRevision: compensation(payroll, ids.employeePartyId).payRevision
                })
            // the payroll approver reads the change waiting and approves it (the employer's payroll approvers decide by default)
            const approveWaiting = () => {
                const changes = as(users.payApprover, "mantle.humanres.PeopleServices.find#EmploymentChanges", {
                    partyId: ids.employeePartyId
                }).changes
                const waiting = Array.from(changes || []).find(row => row.isPayChange && row.canDecide)
                if (waiting)
                    as(users.payApprover, "mantle.humanres.PeopleServices.decide#EmploymentChange", {
                        employmentChangeId: waiting.employmentChangeId,
                        decision: "approve"
                    })
                return waiting || null
            }
            change("2800", "2026-01-01", "Starting salary")
            approveWaiting()
            const tomorrow = ec.l10n.format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd")
            change("3000", tomorrow, "Annual review")
            const waiting = compensation(payroll, ids.employeePartyId).payChanges
            const managerChanges = Array.from(
                as(users.manager, "mantle.humanres.PeopleServices.find#EmploymentChanges", {partyId: ids.employeePartyId})
                    .changes || []
            )
            const raise = approveWaiting()
            const after = compensation(payroll, ids.employeePartyId)
            return {problems, waiting, managerSees: managerChanges.some(row => row.isPayChange), raise, after}
        },
        then({problems, waiting, managerSees, raise, after}) {
            problems.join("\n") == ""
            waiting.length == 1
            !managerSees
            raise != null
            raise.salaryText == "$3,000.00 a month"
            after.payChanges.length == 0
            after.salaries.map(row => row.salaryText) == ["$3,000.00 a month", "$2,800.00 a month"]
            after.salaries[1].thruDateText != ""
        }
    }
)
