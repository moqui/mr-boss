// People's pay run screens (impl-people P25; design-people §8 PayRuns, PayRunDetail): the payroll operator's one html render of
// PayRunDetail's Calculate and review with Ines opened (her lines with their explanations, the progress, Leon in error with his
// reason, Calculate offered), the payroll approver's one html render of PayRuns (the run, its errors, no New pay run for the
// approver), and People's Today: the payroll exceptions are the payroll operator's alone. Mantle's rules (each employee in its own
// unit, the split, the approval, consumed inputs) are Mantle's PayRuns; the access case (creating a run payroll's, HR refused with
// the same parameters, Services' group missing to Retail's payroll, the screens) is PeopleAccessLater's. The usable-when walk is the
// acceptance PeoplePayRunsUsable. Run: ./moq test mr-boss --spec PeoplePayRuns
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PayrollRunServices."
const prefix = "PPL_SPEC_PRN"
const inesEmp = "BOSS_PPL_INES_EMP"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // Retail's monthly salaried group, its April, a salary structure, Ines assigned with a salary and Leon assigned with none,
        // made as data: the configuration and assignment flows are their own phases'
        system(() => {
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Spec salaried staff",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2026-04-01",
                periodsPerYear: 12,
                payDateOffsetDays: 0,
                prorationEnumId: "PprCalendarDays",
                timeBasisEnumId: "PtbSchedule",
                payrollLocalizationId: "PlzDemonstration",
                liveEnabled: "N",
                fromDate: 0
            })
            const existing = ec.entity
                .find("mantle.party.time.TimePeriod")
                .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-04-01"})
                .one()
            state.april = existing
                ? existing.timePeriodId
                : call("mantle.party.TimeServices.create#TimePeriod", {
                      partyId: ids.organizationId,
                      timePeriodTypeId: "PayrollMonth",
                      fromDate: "2026-04-01",
                      thruDate: "2026-04-30"
                  }).timePeriodId
            call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                payrollGroupId: state.group,
                timePeriodId: state.april,
                payDate: "2026-04-30"
            })
            const componentId = prefix + "_C_SAL"
            call("create#mantle.humanres.payroll.PayrollComponent", {
                payrollComponentId: componentId,
                organizationPartyId: ids.organizationId,
                componentCode: prefix + "_SAL",
                componentName: "Spec monthly salary",
                componentKindEnumId: "PckEarning"
            })
            call("create#mantle.humanres.payroll.PayrollComponentTerm", {
                payrollComponentId: componentId,
                statusId: "PtsPublished",
                fromDate: 0,
                basisEnumId: "PcbFormula",
                formula: "round(annualSalary / periodsPerYear, 2)",
                inputNames: "annualSalary,periodsPerYear",
                currencyUomId: "USD"
            })
            state.structure = prefix + "_S"
            call("create#mantle.humanres.payroll.PayrollStructure", {
                payrollStructureId: state.structure,
                organizationPartyId: ids.organizationId,
                structureName: "Spec salaried",
                currencyUomId: "USD",
                payBasisEnumId: "PpbSalaried",
                statusId: "PtsPublished",
                fromDate: 0
            })
            call("create#mantle.humanres.payroll.PayrollStructureComponent", {
                payrollStructureId: state.structure,
                payrollComponentId: componentId,
                statusId: "PtsPublished",
                fromDate: 0,
                sequenceNum: 1
            })
            for (const [partyRelationshipId, partyId] of [
                [inesEmp, ids.reportPartyId],
                ["BOSS_PPL_LEON_EMP", ids.unmanagedPartyId]
            ])
                call("create#mantle.humanres.payroll.PayrollAssignment", {
                    partyRelationshipId,
                    partyId,
                    organizationPartyId: ids.organizationId,
                    payrollStructureId: state.structure,
                    payrollGroupId: state.group,
                    isPrimary: "Y",
                    fromDate: "2026-04-01 00:00:00"
                })
            call("create#mantle.humanres.employment.EmploymentSalary", {
                partyRelationshipId: inesEmp,
                fromDate: "2026-04-01 00:00:00",
                amount: "48000",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
        })
        const asPayroll = (service, parameters) => asUser(users.payroll, () => system(() => invoke(service, parameters)))
        state.runId = asPayroll(S + "create#Run", {payrollGroupId: state.group, timePeriodId: state.april}).payrollRunId
        state.calculated = asPayroll(S + "calculate#Run", {payrollRunId: state.runId})
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "PayRunDetail's one html render as the payroll operator: Ines's lines explained, Leon in error, the progress, Calculate",
    {
        when() {
            const rendered = asUser(users.payroll, () =>
                page("Payroll/PayRunDetail", {payrollRunId: state.runId, step: "review", partyRelationshipId: inesEmp}, "html")
            )
            const out = rendered.output
            const problems = []
            for (const text of [
                "Pay run Spec salaried staff",
                "Calculate and review",
                "Spec monthly salary",
                "4,000.00",
                "round(annualSalary / periodsPerYear, 2)",
                "The structure pays a salary",
                "Progress",
                "Calculate",
                "Preview only"
            ])
                if (!out.includes(text)) problems.push("missing " + text)
            return {status: rendered.status, errors: rendered.errors, problems, calculated: state.calculated}
        },
        then({status, errors, problems, calculated}) {
            status == 200
            errors.length == 0
            problems.join("; ") == ""
            calculated.calculatedCount >= 1
            calculated.errorCount >= 1
        }
    }
)

feature("PayRuns' one html render as the payroll approver, and payroll exceptions on Today for the payroll operator alone", {
    when() {
        const rendered = asUser(users.payApprover, () => page("Payroll/PayRuns", {payrollGroupId: state.group}, "html"))
        const today = user =>
            Array.from(
                asUser(user, () => system(() => invoke("ironstone.people.ContextServices.get#TodayItems", {}))).items || []
            )
                .filter(item => item.kind === "payroll")
                .map(item => item.title)
        return {
            status: rendered.status,
            errors: rendered.errors,
            listsRun: rendered.output.includes("Spec salaried staff"),
            offersNew: rendered.output.includes("New pay run"),
            payrollToday: today(users.payroll),
            approverToday: today(users.payApprover)
        }
    },
    then({status, errors, listsRun, offersNew, payrollToday, approverToday}) {
        status == 200
        errors.length == 0
        listsRun
        !offersNew
        payrollToday.some(title => title.includes("Spec salaried staff") && title.includes("in error"))
        // no amount and no person in the item
        payrollToday.every(title => !title.includes("4,000") && !title.includes("Leon"))
        approverToday.length == 0
    }
})
