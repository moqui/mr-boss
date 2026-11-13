// People P24's "usable when" (impl-people P24; design-people §6 HoursForPay, §8 PayAdjustments, §14.3 "Source lock and worker invoice
// collision"), as an acceptance walk with artifact authorization on, through the screens' transitions: Retail's March has Tomas's
// approved week and approved paid leave, and Ines's submitted week still waiting. The payroll operator (people.payroll) reconciles
// the period on Hours for pay (Tomas ready, Ines blocked by her unapproved week), previews and prepares it (Tomas's hours and
// leave become inputs, Ines is named and left out), and makes a bonus for Tomas on Pay adjustments, which the payroll approver
// (people.payapprover) approves from To decide; preparing again makes nothing twice. Then a worker invoice that names Tomas's paid
// time entry is refused, and his week, once a pay input of it is finalized, is not reopened. The rules themselves are Mantle's
// PayInputs and mr-boss's PeoplePayInputs and PeopleAccessLater. Run: ./moq accept mr-boss --spec PeoplePayInputsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PayrollInputServices."
const INPUT = "mantle.humanres.payroll.PayrollInput"
const webroot = "component://webroot/screen/webroot.xml"
const tomasEmploymentId = ids.employmentId
const inesEmploymentId = "BOSS_PPL_INES_EMP"
const prefix = "WALK24"
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
const liveInputs = partyRelationshipId =>
    system(() =>
        Array.from(
            ec.entity
                .find(INPUT)
                .condition({partyRelationshipId})
                .condition("statusId", "in", ["PinProposed", "PinApproved", "PinFinalized"])
                .list()
        )
    )

spec({
    setupSpec() {
        login("john.doe")
        // Retail's hourly group paid from approved timesheets with its March, Tomas and Ines in it (March's alone, so the other pay
        // walks' periods are their own), their weeks, Tomas's paid leave and an earning for bonuses, made as data: configuration,
        // assignment, time and leave are their own walks'. Ines, not Rafael, has the waiting week: Rafael joined in October.
        system(() => {
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Walk hourly staff",
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
            for (const [partyRelationshipId, partyId] of [
                [tomasEmploymentId, ids.employeePartyId],
                [inesEmploymentId, "BOSS_PPL_INES"]
            ])
                call("create#mantle.humanres.payroll.PayrollAssignment", {
                    partyRelationshipId,
                    partyId,
                    organizationPartyId: ids.organizationId,
                    payrollGroupId: state.group,
                    isPrimary: "Y",
                    fromDate: "2026-01-01 00:00:00",
                    thruDate: "2026-04-01 00:00:00"
                })
            const week = (timesheetId, partyId, statusId) =>
                call("create#mantle.work.time.Timesheet", {
                    timesheetId,
                    partyId,
                    fromDate: "2026-03-02 00:00:00",
                    thruDate: "2026-03-08 23:59:59",
                    statusId
                })
            state.tomasWeek = prefix + "_TS_TOMAS"
            week(state.tomasWeek, ids.employeePartyId, "TmshApproved")
            week(prefix + "_TS_INES", "BOSS_PPL_INES", "TmshCompleted")
            state.tomasEntry = prefix + "_TE_TOMAS"
            call("create#mantle.work.time.TimeEntry", {
                timeEntryId: state.tomasEntry,
                partyId: ids.employeePartyId,
                timesheetId: state.tomasWeek,
                fromDate: "2026-03-02 09:00:00",
                thruDate: "2026-03-02 17:00:00",
                hours: "8"
            })
            call("create#mantle.work.time.TimeEntry", {
                timeEntryId: prefix + "_TE_INES",
                partyId: "BOSS_PPL_INES",
                timesheetId: prefix + "_TS_INES",
                fromDate: "2026-03-03 09:00:00",
                thruDate: "2026-03-03 17:00:00",
                hours: "8"
            })
            call("create#mantle.humanres.leave.LeavePolicy", {
                leavePolicyId: prefix + "_LP",
                policyName: "Walk paid leave",
                organizationPartyId: ids.organizationId,
                leaveTypeEnumId: "PltAnnual",
                unitEnumId: "LuDays",
                isPaid: "Y",
                fromDate: 0
            })
            call("create#mantle.humanres.leave.LeaveRequest", {
                leaveRequestId: prefix + "_LR",
                partyRelationshipId: tomasEmploymentId,
                partyId: ids.employeePartyId,
                organizationPartyId: ids.organizationId,
                leaveTypeEnumId: "PltAnnual",
                leavePolicyId: prefix + "_LP",
                unitEnumId: "LuDays",
                statusEnumId: "LrsApproved",
                fromDay: "2026-03-05",
                thruDay: "2026-03-05",
                decidedDate: "2026-03-01 08:00:00"
            })
            call("create#mantle.humanres.leave.LeaveRequestSegment", {
                leaveRequestId: prefix + "_LR",
                segmentSeqId: "01",
                fromDay: "2026-03-05",
                thruDay: "2026-03-05",
                dayPartEnumId: "LdpFull"
            })
            state.bonus = prefix + "_C_BONUS"
            call("create#mantle.humanres.payroll.PayrollComponent", {
                payrollComponentId: state.bonus,
                organizationPartyId: ids.organizationId,
                componentCode: prefix + "_BONUS",
                componentName: "Walk bonus",
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
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "the payroll operator reconciles and prepares March: Tomas's hours and leave become inputs once, Ines's unapproved week blocks her alone",
    {
        when() {
            const period = {payrollGroupId: state.group, timePeriodId: state.march}
            const reconciled = asUser(users.payroll, () => page("Time/HoursForPay", period, "html"))
            const preview = request(
                users.payroll,
                "apps/People/Time/HoursForPay/prepareInputs",
                Object.assign({preview: "Y"}, period),
                "post"
            )
            const previewWrote = liveInputs(tomasEmploymentId).length
            const prepared = request(users.payroll, "apps/People/Time/HoursForPay/prepareInputs", period, "post")
            const tomas = liveInputs(tomasEmploymentId)
                .map(row => row.inputTypeEnumId)
                .sort()
            const again = as(users.payroll, S + "prepare#Inputs", period)
            return {
                reconciled: [
                    reconciled.status,
                    reconciled.errors.length,
                    reconciled.output.includes("Ready to prepare"),
                    reconciled.output.includes("Time not approved")
                ],
                preview: [preview.errors, previewWrote],
                prepared: prepared.errors,
                tomas,
                ines: liveInputs(inesEmploymentId).length,
                again: Array.from(again.rows || [])
                    .map(row => row.partyId + " " + (row.reasonCode || row.outcome))
                    .sort()
            }
        },
        then({reconciled, preview, prepared, tomas, ines, again}) {
            reconciled == [200, 0, true, true]
            preview == ["", 0]
            prepared == ""
            tomas == ["PitPaidLeave", "PitWorked"]
            ines == 0
            again == ["BOSS_PPL_INES WEEK_NOT_APPROVED", ids.employeePartyId + " repeated"]
        }
    }
)

feature(
    "a bonus made on Pay adjustments waits for the payroll approver, who approves it from To decide; the period still makes nothing twice",
    {
        when() {
            const made = request(
                users.payroll,
                "apps/People/Payroll/PayAdjustments/storeAdjustment",
                {
                    organizationPartyId: ids.organizationId,
                    partyRelationshipId: tomasEmploymentId,
                    inputTypeEnumId: "PitAdjustment",
                    payrollComponentId: state.bonus,
                    inputDate: "2026-03-20",
                    amount: "250",
                    reason: "Walk: stock count weekend"
                },
                "post"
            )
            const bonus = liveInputs(tomasEmploymentId).find(row => row.inputTypeEnumId === "PitAdjustment")
            const toDecide = asUser(users.payApprover, () => page("Payroll/PayAdjustments", {show: "decide"}, "html"))
            const operatorDecides = as(users.payroll, S + "find#Adjustments", {show: "decide"}).adjustments?.length || 0
            const approved = request(
                users.payApprover,
                "apps/People/Payroll/PayAdjustments/decideAdjustment",
                {payrollInputId: bonus?.payrollInputId, decision: "approve"},
                "post"
            )
            const after = system(() => ec.entity.find(INPUT).condition("payrollInputId", bonus?.payrollInputId).one())
            const again = as(users.payroll, S + "prepare#Inputs", {payrollGroupId: state.group, timePeriodId: state.march})
            return {
                made: made.errors,
                waiting: bonus?.statusId,
                toDecide: [toDecide.output.includes("Walk bonus"), toDecide.output.includes("250.00")],
                operatorDecides,
                approved: approved.errors,
                after: after?.statusId,
                created: Number(again.createdCount),
                tomas: liveInputs(tomasEmploymentId).length
            }
        },
        then({made, waiting, toDecide, operatorDecides, approved, after, created, tomas}) {
            made == ""
            waiting == "PinProposed"
            toDecide == [true, true]
            operatorDecides == 0
            approved == ""
            after == "PinApproved"
            created == 0
            tomas == 3
        }
    }
)

feature("a worker invoice for Tomas's paid time is refused, and his week, once its pay is finalized, is not reopened", {
    when() {
        system(() =>
            call("create#mantle.account.invoice.Invoice", {
                invoiceId: prefix + "_WINV",
                invoiceTypeEnumId: "InvoiceSales",
                fromPartyId: ids.employeePartyId,
                toPartyId: ids.organizationId,
                statusId: "InvoiceIncoming",
                currencyUomId: "USD",
                invoiceDate: "2026-03-31 10:00:00"
            })
        )
        // Mantle's rule itself, called as the system (the service is Accounting's, which john.doe's groups do not grant)
        const invoiced = system(() =>
            lib.refusal("mantle.account.InvoiceServices.create#TimeEntryInvoiceItems", {
                invoiceId: prefix + "_WINV",
                ratePurposeEnumId: "RaprVendor",
                timeEntryIdList: [state.tomasEntry]
            })
        )
        // the pay run's finalization (P27) finalizes the week's hours; made here as data
        const worked = liveInputs(tomasEmploymentId).find(row => row.inputTypeEnumId === "PitWorked")
        system(() => call("update#" + INPUT, {payrollInputId: worked.payrollInputId, statusId: "PinFinalized"}))
        const reopened = system(() =>
            lib.refusal("mantle.work.TimesheetServices.reopen#Timesheet", {timesheetId: state.tomasWeek})
        )
        const detail = asUser(users.manager, () => page("Time/TimesheetDetail", {timesheetId: state.tomasWeek}, "html"))
        return {
            invoiced: /PAY_SOURCE_CONSUMED/.test(invoiced),
            reopened: /Payroll has paid/.test(reopened),
            detail: detail.output.includes("Paid by payroll")
        }
    },
    then({invoiced, reopened, detail}) {
        invoiced
        reopened
        detail
    }
})
