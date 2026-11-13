// People's hours for pay and pay adjustments screens (impl-people P24; design-people §6 HoursForPay, §8 PayAdjustments): the payroll
// operator's one html render of HoursForPay with Ines's employment opened after her period was prepared (her approved hours,
// payable and prepared, Prepare inputs and Resolve a day, her timesheet linked), the payroll approver's one html render of
// PayAdjustments' To decide with the payroll operator's adjustment waiting (its amount, Approve and Refuse), and the
// choices P24 adds (the pay groups of hours for pay, for payroll and for a manager whose report is paid in one, a group's periods,
// and an employment's advances), each with a selected value that is not on the page. Mantle's rules (each input once, the time
// basis, the worker invoice, the source guards, the adjustment's approval) are Mantle's PayInputs; the access case (preparing and
// adjusting payroll's, HR refused with the same parameters, Services' group missing to Retail's payroll, the screens) is
// PeopleAccessLater's. The usable-when walk is the acceptance PeoplePayInputsUsable. Run: ./moq test mr-boss --spec PeoplePayInputs
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PayrollInputServices."
const choices = "ironstone.people.ContextServices.get#Choices"
const options = (user, parameters) => asUser(user, () => invoke(choices, parameters)).options
const prefix = "PPL_SPEC_PIN"
const employmentId = "BOSS_PPL_INES_EMP"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // Retail's monthly group paid from approved timesheets, its March, Ines in it, her approved week and an earning to adjust,
        // made as data: the configuration, assignment and time flows are their own phases'
        system(() => {
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Spec hourly staff",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2026-03-01",
                periodsPerYear: 12,
                payDateOffsetDays: 5,
                prorationEnumId: "PprHours",
                timeBasisEnumId: "PtbTimesheets",
                payrollLocalizationId: "PlzDemonstration",
                liveEnabled: "N",
                fromDate: 0
            })
            const existing = ec.entity
                .find("mantle.party.time.TimePeriod")
                .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-03-01"})
                .one()
            state.march = existing
                ? existing.timePeriodId
                : call("mantle.party.TimeServices.create#TimePeriod", {
                      partyId: ids.organizationId,
                      timePeriodTypeId: "PayrollMonth",
                      fromDate: "2026-03-01",
                      thruDate: "2026-03-31"
                  }).timePeriodId
            call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                payrollGroupId: state.group,
                timePeriodId: state.march,
                payDate: "2026-04-05"
            })
            call("create#mantle.humanres.payroll.PayrollAssignment", {
                partyRelationshipId: employmentId,
                partyId: ids.reportPartyId,
                organizationPartyId: ids.organizationId,
                payrollGroupId: state.group,
                isPrimary: "Y",
                fromDate: "2026-01-01 00:00:00"
            })
            state.timesheetId = prefix + "_TS"
            call("create#mantle.work.time.Timesheet", {
                timesheetId: state.timesheetId,
                partyId: ids.reportPartyId,
                fromDate: "2026-03-02 00:00:00",
                thruDate: "2026-03-08 23:59:59",
                statusId: "TmshApproved"
            })
            call("create#mantle.work.time.TimeEntry", {
                timeEntryId: prefix + "_TE",
                partyId: ids.reportPartyId,
                timesheetId: state.timesheetId,
                fromDate: "2026-03-03 09:00:00",
                thruDate: "2026-03-03 16:30:00",
                hours: "7.5"
            })
            state.bonus = prefix + "_C_BONUS"
            call("create#mantle.humanres.payroll.PayrollComponent", {
                payrollComponentId: state.bonus,
                organizationPartyId: ids.organizationId,
                componentCode: prefix + "_BONUS",
                componentName: "Spec bonus",
                componentKindEnumId: "PckEarning"
            })
            call("create#mantle.humanres.payroll.PayrollComponentTerm", {
                payrollComponentId: state.bonus,
                statusId: "PtsPublished",
                fromDate: 0,
                basisEnumId: "PcbAmount",
                amount: "0",
                currencyUomId: "USD"
            })
            state.advance = prefix + "_ADV"
            call("create#mantle.humanres.expense.EmployeeAdvance", {
                employeeAdvanceId: state.advance,
                partyRelationshipId: employmentId,
                partyId: ids.reportPartyId,
                organizationPartyId: ids.organizationId,
                purpose: "Spec trade fair",
                currencyUomId: "USD",
                amount: "300",
                statusEnumId: "EasApproved"
            })
        })
        const asPayroll = (service, parameters) => asUser(users.payroll, () => system(() => invoke(service, parameters)))
        state.prepared = asPayroll(S + "prepare#Inputs", {payrollGroupId: state.group, timePeriodId: state.march})
        state.adjustment = asPayroll(S + "store#Adjustment", {
            partyRelationshipId: employmentId,
            payrollComponentId: state.bonus,
            inputDate: "2026-03-10",
            amount: "150",
            reason: "Spec inventory count"
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "HoursForPay's one html render as the payroll operator: Ines's prepared hours, her timesheet linked, Prepare inputs and Resolve a day",
    {
        when() {
            const rendered = asUser(users.payroll, () =>
                page(
                    "Time/HoursForPay",
                    {payrollGroupId: state.group, timePeriodId: state.march, partyRelationshipId: employmentId},
                    "html"
                )
            )
            const out = rendered.output
            const problems = []
            for (const text of [
                "Hours for pay",
                "Spec hourly staff",
                "Approved timesheets",
                "Prepare inputs",
                "Resolve a day",
                "Hours of Ines",
                "7.5",
                "Prepared"
            ])
                if (!out.includes(text)) problems.push("no " + text)
            if (!out.includes("TimesheetDetail")) problems.push("no link to the timesheet")
            const week = /2026-03-0\d to 2026-03-\d\d/.exec(out)
            if (!week) problems.push("week text: " + (out.match(/[^>]{0,40}TimesheetDetail[^<]{0,120}/) || [""])[0])
            return {
                status: rendered.status,
                errors: rendered.errors,
                problems,
                prepared: Array.from(state.prepared.rows || []).map(row => row.partyId + " " + row.outcome)
            }
        },
        then({status, errors, problems, prepared}) {
            status == 200
            errors == []
            problems == []
            prepared == [ids.reportPartyId + " done"]
        }
    }
)

feature(
    "PayAdjustments' one html render as the payroll approver, the adjustment waiting with its amount; the hours groups, periods and advances choices",
    {
        when() {
            const rendered = asUser(users.payApprover, () => page("Payroll/PayAdjustments", {show: "decide"}, "html"))
            const out = rendered.output
            const problems = []
            for (const text of [
                "Pay adjustments",
                "Spec bonus",
                "150.00",
                "Approve",
                "Refuse",
                "Spec inventory count",
                "Waiting for"
            ])
                if (!out.includes(text)) problems.push("no " + text)
            if (out.includes("New adjustment")) problems.push("the approver offered New adjustment")
            const values = list => Array.from(list || []).map(option => option.value)
            return {
                status: rendered.status,
                errors: rendered.errors,
                problems,
                adjusted: state.adjustment.statusId,
                payrollGroups: values(
                    options(users.payroll, {choice: "hoursGroups", term: "zzz no match", selected: state.group})
                ),
                managerGroups: values(options(users.manager, {choice: "hoursGroups"})).includes(state.group),
                hrGroups: values(options(users.hr, {choice: "hoursGroups"})).length,
                periods: values(
                    options(users.payroll, {
                        choice: "payPeriods",
                        payrollGroupId: state.group,
                        term: "zzz",
                        selected: state.march
                    })
                ),
                advances: values(
                    options(users.payroll, {
                        choice: "payAdvances",
                        partyRelationshipId: employmentId,
                        term: "zzz",
                        selected: state.advance
                    })
                ),
                hrAdvances: values(options(users.hr, {choice: "payAdvances", partyRelationshipId: employmentId})).length
            }
        },
        then({status, errors, problems, adjusted, payrollGroups, managerGroups, hrGroups, periods, advances, hrAdvances}) {
            status == 200
            errors == []
            problems == []
            adjusted == "PinProposed"
            payrollGroups == [state.group]
            managerGroups
            hrGroups == 0
            periods == [state.march]
            advances == [state.advance]
            hrAdvances == 0
        }
    }
)
