// People P25's "usable when" (impl-people P25; design-people §8 PayRuns, PayRunDetail, §8.2, §14.3 "Salary/rate change and mixed
// pay", "Failure and restart", "Approval and concurrent finalization", its approval half), as an acceptance walk with artifact
// authorization on, through the screens' transitions: Retail's December has a monthly group with Ines (salaried), Rafael (hourly),
// Tomas (hourly with pieces) and Leon (salaried, with no salary yet). The payroll operator (people.payroll) creates the run on Pay
// runs, reads its population, calculates it (three calculated, Leon in error with SALARY_MISSING), has Leon's salary set and
// calculates again (only Leon is calculated, the others' results stay as they were), and asks for approval; the payroll operator
// may not approve; the payroll approver (people.payapprover) reads the exact totals on the Approval step and approves them. Nothing
// is paid or posted. The rules themselves are Mantle's PayRuns and mr-boss's PeoplePayRuns and PeopleAccessLater.
// Run: ./moq accept mr-boss --spec PeoplePayRunsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PayrollRunServices."
const webroot = "component://webroot/screen/webroot.xml"
const prefix = "WALK25"
const emp = {ines: "BOSS_PPL_INES_EMP", rafael: "BOSS_PPL_RAFAEL_EMP", tomas: ids.employmentId, leon: "BOSS_PPL_LEON_EMP"}
const party = {ines: ids.reportPartyId, rafael: "BOSS_PPL_RAFAEL", tomas: ids.employeePartyId, leon: ids.unmanagedPartyId}
const state = {}
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const as = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const unitOf = partyRelationshipId =>
    system(() =>
        ec.entity
            .find("mantle.humanres.payroll.PayrollRunEmployment")
            .condition({payrollRunId: state.runId, partyRelationshipId})
            .one()
    )
const inesInvoices = () =>
    system(() => ec.entity.find("mantle.account.invoice.Invoice").condition({toPartyId: party.ines}).count())
const money = value => (value == null ? null : String(toDecimal(value).setScale(2)))

spec({
    setupSpec() {
        login("john.doe")
        // the invoices to Ines before the walk (PeoplePayHandoffUsable's net pay in a whole run): the walk makes none
        state.inesInvoices = inesInvoices()
        // Retail's monthly group with its December, a salaried and an hourly structure (pieces elective), the four employees assigned,
        // Ines's salary, the hourly and piece rates, and the approved hours and pieces, made as data: configuration, assignment and
        // inputs are their own walks'
        system(() => {
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Walk monthly staff",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2026-12-01",
                periodsPerYear: 12,
                payDateOffsetDays: 0,
                prorationEnumId: "PprCalendarDays",
                timeBasisEnumId: "PtbTimesheets",
                payrollLocalizationId: "PlzDemonstration",
                liveEnabled: "N",
                fromDate: 0
            })
            const existing = ec.entity
                .find("mantle.party.time.TimePeriod")
                .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-12-01"})
                .one()
            state.december = existing
                ? existing.timePeriodId
                : call("mantle.party.TimeServices.create#TimePeriod", {
                      partyId: ids.organizationId,
                      timePeriodTypeId: "PayrollMonth",
                      fromDate: "2026-12-01",
                      thruDate: "2026-12-31"
                  }).timePeriodId
            call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                payrollGroupId: state.group,
                timePeriodId: state.december,
                payDate: "2026-12-31"
            })
            const component = (code, kind, term) => {
                const payrollComponentId = prefix + "_C_" + code
                call("create#mantle.humanres.payroll.PayrollComponent", {
                    payrollComponentId,
                    organizationPartyId: ids.organizationId,
                    componentCode: prefix + "_" + code,
                    componentName: "Walk " + code.toLowerCase(),
                    componentKindEnumId: kind
                })
                call(
                    "create#mantle.humanres.payroll.PayrollComponentTerm",
                    Object.assign(
                        {
                            payrollComponentId,
                            statusId: "PtsPublished",
                            fromDate: 0,
                            basisEnumId: "PcbFormula",
                            currencyUomId: "USD"
                        },
                        term
                    )
                )
                return payrollComponentId
            }
            const salary = component("SALARY", "PckEarning", {
                formula: "round(annualSalary / periodsPerYear, 2)",
                inputNames: "annualSalary,periodsPerYear"
            })
            const hourly = component("HOURLY", "PckEarning", {
                formula: "workedHours * hourlyRate",
                inputNames: "workedHours,hourlyRate"
            })
            state.piece = component("PIECE", "PckEarning", {formula: "pieces * pieceRate", inputNames: "pieces,pieceRate"})
            const structure = (id, basis, lines) => {
                call("create#mantle.humanres.payroll.PayrollStructure", {
                    payrollStructureId: id,
                    organizationPartyId: ids.organizationId,
                    structureName: id,
                    currencyUomId: "USD",
                    payBasisEnumId: basis,
                    statusId: "PtsPublished",
                    fromDate: 0
                })
                lines.forEach(([payrollComponentId, extra], index) =>
                    call(
                        "create#mantle.humanres.payroll.PayrollStructureComponent",
                        Object.assign(
                            {
                                payrollStructureId: id,
                                payrollComponentId,
                                statusId: "PtsPublished",
                                fromDate: 0,
                                sequenceNum: index + 1
                            },
                            extra || {}
                        )
                    )
                )
            }
            structure(prefix + "_SAL", "PpbSalaried", [[salary]])
            structure(prefix + "_HOUR", "PpbHourly", [[hourly], [state.piece, {eligibilityEnumId: "PleElected"}]])
            for (const [who, structureId, extra] of [
                ["ines", prefix + "_SAL"],
                ["leon", prefix + "_SAL"],
                ["rafael", prefix + "_HOUR"],
                ["tomas", prefix + "_HOUR", {electedComponentIds: state.piece}]
            ])
                call(
                    "create#mantle.humanres.payroll.PayrollAssignment",
                    Object.assign(
                        {
                            partyRelationshipId: emp[who],
                            partyId: party[who],
                            organizationPartyId: ids.organizationId,
                            payrollStructureId: structureId,
                            payrollGroupId: state.group,
                            isPrimary: "Y",
                            fromDate: "2026-12-01 00:00:00"
                        },
                        extra || {}
                    )
                )
            // Leon has no salary in December: one another walk gave him (PeoplePayAssignmentsUsable's first salary, from its run's
            // day) ends when December starts, as a whole run makes it before this walk
            const december = "2026-12-01 00:00:00"
            const decemberMs = ec.user.timestampMillis(december)
            for (const row of Array.from(
                ec.entity.find("mantle.humanres.employment.EmploymentSalary").condition("partyRelationshipId", emp.leon).list()
            )) {
                const key = {partyRelationshipId: row.partyRelationshipId, fromDate: row.fromDate}
                if (ec.user.timestampMillis(row.fromDate) >= decemberMs)
                    call("delete#mantle.humanres.employment.EmploymentSalary", key)
                else if (row.thruDate == null || ec.user.timestampMillis(row.thruDate) > decemberMs)
                    call("update#mantle.humanres.employment.EmploymentSalary", Object.assign(key, {thruDate: december}))
            }
            call("store#mantle.humanres.employment.EmploymentSalary", {
                partyRelationshipId: emp.ines,
                fromDate: "2026-12-01 00:00:00",
                thruDate: null,
                amount: "48000",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
            for (const [partyId, rateAmount, timePeriodUomId] of [
                [party.rafael, "20", "TF_hr"],
                [party.tomas, "15", "TF_hr"],
                [party.tomas, "0.5", "OTH_ea"]
            ])
                call("create#mantle.humanres.rate.RateAmount", {
                    partyId,
                    ratePurposeEnumId: "RaprVendor",
                    rateAmount,
                    rateCurrencyUomId: "USD",
                    timePeriodUomId,
                    fromDate: "2026-12-01 00:00:00"
                })
            let seq = 0
            const input = (who, values) => {
                seq++
                call(
                    "create#mantle.humanres.payroll.PayrollInput",
                    Object.assign(
                        {
                            partyRelationshipId: emp[who],
                            partyId: party[who],
                            organizationPartyId: ids.organizationId,
                            payrollGroupId: state.group,
                            timePeriodId: state.december,
                            statusId: "PinApproved",
                            entitlementKey: prefix + "_E" + seq,
                            activeEntitlementKey: prefix + "_E" + seq
                        },
                        values
                    )
                )
            }
            const worked = {inputTypeEnumId: "PitWorked", inputName: "workedHours", quantityUomId: "TF_hr"}
            input("rafael", Object.assign({inputDate: "2026-12-01", quantity: "8"}, worked))
            input("rafael", Object.assign({inputDate: "2026-12-02", quantity: "8"}, worked))
            input("tomas", Object.assign({inputDate: "2026-12-01", quantity: "8"}, worked))
            input("tomas", {
                inputTypeEnumId: "PitPieces",
                inputName: "pieces",
                quantityUomId: "OTH_ea",
                inputDate: "2026-12-01",
                quantity: "100"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the payroll operator creates the month's run, calculates it with Leon in error, fixes him and calculates only him", {
    when() {
        const created = request(
            users.payroll,
            "apps/People/Payroll/PayRuns/createRun",
            {payrollGroupId: state.group, timePeriodId: state.december},
            "post"
        )
        state.runId = system(() =>
            ec.entity.find("mantle.humanres.payroll.PayrollRun").condition({payrollGroupId: state.group}).one()
        )?.payrollRunId
        const population = asUser(users.payroll, () =>
            page("Payroll/PayRunDetail", {payrollRunId: state.runId, step: "population"}, "html")
        )
        const first = request(users.payroll, "apps/People/Payroll/PayRunDetail/calculateRun", {payrollRunId: state.runId}, "post")
        const leonFirst = unitOf(emp.leon)
        const inesFirst = unitOf(emp.ines)
        const review = asUser(users.payroll, () =>
            page("Payroll/PayRunDetail", {payrollRunId: state.runId, step: "review"}, "html")
        )
        // Leon's first salary, set as data (the pay change's own walk is PeoplePayAssignmentsUsable)
        system(() =>
            call("create#mantle.humanres.employment.EmploymentSalary", {
                partyRelationshipId: emp.leon,
                fromDate: "2026-12-01 00:00:00",
                amount: "36000",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
        )
        const again = request(users.payroll, "apps/People/Payroll/PayRunDetail/calculateRun", {payrollRunId: state.runId}, "post")
        return {
            createdErrors: created.errors,
            listed: ["Ines", "Rafael", "Tomas", "Leon"].every(name => population.output.includes(name)),
            firstErrors: first.errors,
            leonFirst: [leonFirst.statusId, leonFirst.reasonCode],
            reviewShowsReason: review.output.includes("The structure pays a salary"),
            againErrors: again.errors,
            leonAfter: unitOf(emp.leon).statusId,
            inesKept: String(unitOf(emp.ines).calculatedDate) == String(inesFirst.calculatedDate),
            gross: Object.fromEntries(Object.entries(emp).map(([who, id]) => [who, money(unitOf(id).grossAmount)]))
        }
    },
    then({createdErrors, listed, firstErrors, leonFirst, reviewShowsReason, againErrors, leonAfter, inesKept, gross}) {
        createdErrors == ""
        listed
        firstErrors == ""
        leonFirst == ["PruError", "SALARY_MISSING"]
        reviewShowsReason
        againErrors == ""
        leonAfter == "PruCalculated"
        inesKept
        gross == {ines: "4000.00", rafael: "320.00", tomas: "170.00", leon: "3000.00"}
    }
})

feature("the payroll operator asks for approval and may not approve; the payroll approver approves the exact totals", {
    when() {
        const submitted = request(
            users.payroll,
            "apps/People/Payroll/PayRunDetail/submitRun",
            {payrollRunId: state.runId, justification: "December"},
            "post"
        )
        const found = as(users.payApprover, S + "get#Run", {payrollRunId: state.runId})
        const byPayroll = request(
            users.payroll,
            "apps/People/Payroll/PayRunDetail/decideRun",
            {
                payrollRunId: state.runId,
                peopleApprovalId: found.approval?.peopleApprovalId,
                decision: "approve"
            },
            "post"
        )
        const approvalStep = asUser(users.payApprover, () =>
            page("Payroll/PayRunDetail", {payrollRunId: state.runId, step: "approval"}, "html")
        )
        const approved = request(
            users.payApprover,
            "apps/People/Payroll/PayRunDetail/decideRun",
            {
                payrollRunId: state.runId,
                peopleApprovalId: found.approval?.peopleApprovalId,
                sourceRevision: found.approval?.sourceRevision,
                decision: "approve"
            },
            "post"
        )
        const after = as(users.payroll, S + "get#Run", {payrollRunId: state.runId})
        const invoices = inesInvoices() - state.inesInvoices
        return {
            submittedErrors: submitted.errors,
            waiting: !!found.approval?.waiting && found.canDecide,
            payrollRefused: byPayroll.errors,
            totalsShown: approvalStep.output.includes("$7,490.00") && approvalStep.output.includes("$7,340.20"),
            approvedErrors: approved.errors,
            state: [after.run.statusId, after.approvalHolds],
            totals: [
                money(after.totals.gross),
                money(after.totals.localEmployee),
                money(after.totals.net),
                money(after.totals.employerCost)
            ],
            invoices
        }
    },
    then({submittedErrors, waiting, payrollRefused, totalsShown, approvedErrors, state, totals, invoices}) {
        submittedErrors == ""
        waiting
        payrollRefused != ""
        totalsShown
        approvedErrors == ""
        state == ["PrnApproved", true]
        // gross 4,000 + 320 + 170 + 3,000; the demonstration levy 2% of each (80 + 6.40 + 3.40 + 60); 1% from the employer
        totals == ["7490.00", "149.80", "7340.20", "7564.90"]
        invoices == 0
    }
})
