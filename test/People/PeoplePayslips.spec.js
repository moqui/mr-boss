// People's payslip screens (impl-people P26; design-people §8 Payslips, PayslipDetail, §3 SelfService, §15): the payroll operator's
// one html render of PayslipDetail (a preview slip explained line by line, its year to date, the line kept off the employee's
// payslip marked, Correct pay offered and no Issue statement), the payroll approver's one html render of Payslips (the run's slips,
// the preview and the issued one), and the employee's one html render of their own issued slip under Commons (MyPayslip: its lines
// and the download of its stored statement, not the line kept off it). Mantle's rules (slips on approval, preview never issued,
// corrections linked, the person's own issued slips alone) are Mantle's Payslips; the access case is PeopleAccessLater's. The
// usable-when walk is the acceptance PeoplePayslipsUsable. Run: ./moq test mr-boss --spec PeoplePayslips
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.humanres.PayrollRunServices."
const prefix = "PPL_SPEC_PSL"
const hannahEmp = "BOSS_PPL_HANNAH_EMP"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // Retail's monthly group with its June, a salaried structure (a salary and an employer fund kept off the payslip), Tomas
        // (people.employee) and Hannah assigned for June with salaries, made as data: configuration and assignment are their phases'
        system(() => {
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Spec payslip staff",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2026-06-01",
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
                .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-06-01"})
                .one()
            state.june = existing
                ? existing.timePeriodId
                : call("mantle.party.TimeServices.create#TimePeriod", {
                      partyId: ids.organizationId,
                      timePeriodTypeId: "PayrollMonth",
                      fromDate: "2026-06-01",
                      thruDate: "2026-06-30"
                  }).timePeriodId
            call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                payrollGroupId: state.group,
                timePeriodId: state.june,
                payDate: "2026-06-30"
            })
            const component = (code, name, kind, term) => {
                const payrollComponentId = prefix + "_C_" + code
                call("create#mantle.humanres.payroll.PayrollComponent", {
                    payrollComponentId,
                    organizationPartyId: ids.organizationId,
                    componentCode: prefix + "_" + code,
                    componentName: name,
                    componentKindEnumId: kind
                })
                call(
                    "create#mantle.humanres.payroll.PayrollComponentTerm",
                    Object.assign({payrollComponentId, statusId: "PtsPublished", fromDate: 0, currencyUomId: "USD"}, term)
                )
                return payrollComponentId
            }
            const salary = component("SAL", "Spec payslip salary", "PckEarning", {
                basisEnumId: "PcbFormula",
                formula: "round(annualSalary / periodsPerYear, 2)",
                inputNames: "annualSalary,periodsPerYear"
            })
            const fund = component("FUND", "Spec employer fund", "PckContribution", {
                basisEnumId: "PcbAmount",
                amount: "25",
                payslipVisible: "N"
            })
            call("create#mantle.humanres.payroll.PayrollStructure", {
                payrollStructureId: prefix + "_S",
                organizationPartyId: ids.organizationId,
                structureName: "Spec payslip salaried",
                currencyUomId: "USD",
                payBasisEnumId: "PpbSalaried",
                statusId: "PtsPublished",
                fromDate: 0
            })
            ;[salary, fund].forEach((payrollComponentId, index) =>
                call("create#mantle.humanres.payroll.PayrollStructureComponent", {
                    payrollStructureId: prefix + "_S",
                    payrollComponentId,
                    statusId: "PtsPublished",
                    fromDate: 0,
                    sequenceNum: index + 1
                })
            )
            for (const [partyRelationshipId, partyId, amount] of [
                [ids.employmentId, ids.employeePartyId, "42000"],
                [hannahEmp, ids.managerPartyId, "60000"]
            ]) {
                call("create#mantle.humanres.payroll.PayrollAssignment", {
                    partyRelationshipId,
                    partyId,
                    organizationPartyId: ids.organizationId,
                    payrollStructureId: prefix + "_S",
                    payrollGroupId: state.group,
                    isPrimary: "Y",
                    fromDate: "2026-06-01 00:00:00",
                    thruDate: "2026-07-01 00:00:00"
                })
                call("create#mantle.humanres.employment.EmploymentSalary", {
                    partyRelationshipId,
                    fromDate: "2026-06-01 00:00:00",
                    thruDate: "2026-07-01 00:00:00",
                    amount,
                    currencyUomId: "USD",
                    timePeriodTypeId: "PayrollYear"
                })
            }
        })
        const as = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
        state.runId = as(users.payroll, R + "create#Run", {payrollGroupId: state.group, timePeriodId: state.june}).payrollRunId
        as(users.payroll, R + "calculate#Run", {payrollRunId: state.runId})
        as(users.payroll, R + "submit#Run", {payrollRunId: state.runId})
        as(users.payApprover, R + "approve#Run", {payrollRunId: state.runId})
        const slipOf = partyRelationshipId =>
            system(() =>
                ec.entity
                    .find("mantle.humanres.payroll.Payslip")
                    .condition({payrollRunId: state.runId, partyRelationshipId})
                    .one()
            )?.payslipId
        state.tomasSlip = slipOf(ids.employmentId)
        state.hannahSlip = slipOf(hannahEmp)
        // Tomas's slip made final as P27's finalization would (preview mode makes none), then issued by the payroll operator
        system(() =>
            ec.entity
                .find("mantle.humanres.payroll.Payslip")
                .condition("payslipId", state.tomasSlip)
                .one()
                .setAll({statusId: "PssFinal", isPreview: "N"})
                .update()
        )
        state.issued = as(users.payroll, "mantle.humanres.PayrollResultServices.issue#Payslip", {payslipId: state.tomasSlip})
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("PayslipDetail's one html render as the payroll operator: a preview slip explained, Correct pay, no Issue statement", {
    when() {
        const rendered = asUser(users.payroll, () => page("Payroll/PayslipDetail", {payslipId: state.hannahSlip}, "html"))
        const out = rendered.output
        const problems = []
        for (const text of [
            "Payslip Hannah",
            "Preview: payroll's alone",
            "never issued to the employee",
            "Spec payslip salary",
            "5,000.00",
            "round(annualSalary / periodsPerYear, 2)",
            "Spec employer fund (not on the employee",
            "Rule from",
            "Year to date",
            "Correct pay",
            "Its pay run"
        ])
            if (!out.includes(text)) problems.push("missing " + text)
        for (const text of ["Issue statement", "Download statement"]) if (out.includes(text)) problems.push("shows " + text)
        return {status: rendered.status, errors: rendered.errors, problems}
    },
    then({status, errors, problems}) {
        status == 200
        errors.length == 0
        problems.join("; ") == ""
    }
})

feature("Payslips' one html render as the payroll approver: the run's slips, the preview and the issued one", {
    when() {
        const rendered = asUser(users.payApprover, () => page("Payroll/Payslips", {payrollRunId: state.runId}, "html"))
        const out = rendered.output
        const problems = []
        for (const text of ["Payslips", "Hannah", "Tomas", "Preview", "Issued", "2026-06-30", "3,500.00", "Spec payslip staff"])
            if (!out.includes(text)) problems.push("missing " + text)
        return {status: rendered.status, errors: rendered.errors, problems}
    },
    then({status, errors, problems}) {
        status == 200
        errors.length == 0
        problems.join("; ") == ""
    }
})

feature(
    "MyPayslip's one html render as the employee under Commons: their issued slip and its statement, not the line kept off it",
    {
        when() {
            const rendered = asUser(users.employee, () =>
                page("People/MyPayslip", {payslipId: state.tomasSlip}, "html", "Commons")
            )
            const out = rendered.output
            const problems = []
            for (const text of [
                "Payslip for 2026-06-01 to 2026-06-30",
                "Spec payslip salary",
                "3,500.00",
                "Download statement",
                "Year to date"
            ])
                if (!out.includes(text)) problems.push("missing " + text)
            for (const text of ["Spec employer fund", "Correct pay", "Issue statement"])
                if (out.includes(text)) problems.push("shows " + text)
            return {status: rendered.status, errors: rendered.errors, problems, issued: state.issued}
        },
        then({status, errors, problems, issued}) {
            issued.statusId == "PssIssued"
            status == 200
            errors.length == 0
            problems.join("; ") == ""
        }
    }
)
