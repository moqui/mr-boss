// People P26's "usable when" (impl-people P26; design-people §8 Payslips, PayslipDetail, §8.2 corrections, §14.3 "Regular, off-cycle
// and correction runs", §5 Q3), as an acceptance walk with artifact authorization on, through the screens' transitions: Retail's
// November has a monthly group with Tomas (people.employee, hourly) and Ines (salaried). The payroll operator (people.payroll) runs
// and asks for the month, the payroll approver (people.payapprover) approves it, and its results become preview slips: Payslips lists
// them and PayslipDetail explains each line from its rule and source; the employee sees none (no My payslips card, MyPayslip not
// available). Four hours of Tomas's approved late are corrected: the operator's Correct pay makes a correction run, calculated and
// asked on PayRunDetail and approved by the approver; its slip links to the original, which stays, with the net effect. Then, as
// the acceptance fixture only (§5 Q3: preview mode issues nothing; P27's finalization would make the slips final), both slips are
// made final and the operator issues them: the employee is told with no amount, sees both on SelfService and reads the correction
// with the net effect. Nothing is paid or posted. The rules themselves are Mantle's Payslips and mr-boss's PeoplePayslips and
// PeopleAccessLater. Run: ./moq accept mr-boss --spec PeoplePayslipsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PayrollRunServices."
const webroot = "component://webroot/screen/webroot.xml"
const prefix = "WALK26"
const emp = {ines: "BOSS_PPL_INES_EMP", tomas: ids.employmentId}
const party = {ines: ids.reportPartyId, tomas: ids.employeePartyId}
const SLIP = "mantle.humanres.payroll.Payslip"
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
const slipOf = (payrollRunId, partyRelationshipId) =>
    system(() => ec.entity.find(SLIP).condition({payrollRunId, partyRelationshipId}).one())
const tomasInvoices = () =>
    system(() => ec.entity.find("mantle.account.invoice.Invoice").condition({toPartyId: party.tomas}).count())
let seq = 0
function input(who, values) {
    seq++
    system(() =>
        call(
            "create#mantle.humanres.payroll.PayrollInput",
            Object.assign(
                {
                    partyRelationshipId: emp[who],
                    partyId: party[who],
                    organizationPartyId: ids.organizationId,
                    payrollGroupId: state.group,
                    timePeriodId: state.november,
                    statusId: "PinApproved",
                    inputTypeEnumId: "PitWorked",
                    inputName: "workedHours",
                    quantityUomId: "TF_hr",
                    entitlementKey: prefix + "_E" + seq,
                    activeEntitlementKey: prefix + "_E" + seq
                },
                values
            )
        )
    )
}
// a run calculated and asked by the payroll operator and approved by the payroll approver, through PayRunDetail's transitions
function calculateAskApprove(payrollRunId) {
    const calculated = request(users.payroll, "apps/People/Payroll/PayRunDetail/calculateRun", {payrollRunId}, "post")
    const asked = request(users.payroll, "apps/People/Payroll/PayRunDetail/submitRun", {payrollRunId}, "post")
    const found = as(users.payApprover, S + "get#Run", {payrollRunId})
    const approved = request(
        users.payApprover,
        "apps/People/Payroll/PayRunDetail/decideRun",
        {
            payrollRunId,
            peopleApprovalId: found.approval?.peopleApprovalId,
            sourceRevision: found.approval?.sourceRevision,
            decision: "approve"
        },
        "post"
    )
    return [calculated.errors, asked.errors, approved.errors].filter(Boolean).join(" | ")
}

spec({
    setupSpec() {
        login("john.doe")
        // the invoices to Tomas before the walk (another walk's, an expense claim's say): the walk makes none
        state.tomasInvoices = tomasInvoices()
        // Retail's monthly group with its November, an hourly and a salaried structure, Tomas and Ines assigned for November, Ines's
        // salary, Tomas's hourly rate and his approved hours, made as data: configuration, assignment and inputs are their own walks'
        system(() => {
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Walk payslip staff",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2026-11-01",
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
                .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-11-01"})
                .one()
            state.november = existing
                ? existing.timePeriodId
                : call("mantle.party.TimeServices.create#TimePeriod", {
                      partyId: ids.organizationId,
                      timePeriodTypeId: "PayrollMonth",
                      fromDate: "2026-11-01",
                      thruDate: "2026-11-30"
                  }).timePeriodId
            call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                payrollGroupId: state.group,
                timePeriodId: state.november,
                payDate: "2026-11-30"
            })
            const component = (code, term) => {
                const payrollComponentId = prefix + "_C_" + code
                call("create#mantle.humanres.payroll.PayrollComponent", {
                    payrollComponentId,
                    organizationPartyId: ids.organizationId,
                    componentCode: prefix + "_" + code,
                    componentName: "Walk " + code.toLowerCase(),
                    componentKindEnumId: "PckEarning"
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
            const structure = (id, basis, payrollComponentId) => {
                call("create#mantle.humanres.payroll.PayrollStructure", {
                    payrollStructureId: id,
                    organizationPartyId: ids.organizationId,
                    structureName: id,
                    currencyUomId: "USD",
                    payBasisEnumId: basis,
                    statusId: "PtsPublished",
                    fromDate: 0
                })
                call("create#mantle.humanres.payroll.PayrollStructureComponent", {
                    payrollStructureId: id,
                    payrollComponentId,
                    statusId: "PtsPublished",
                    fromDate: 0,
                    sequenceNum: 1
                })
            }
            structure(
                prefix + "_SAL",
                "PpbSalaried",
                component("SALARY", {
                    formula: "round(annualSalary / periodsPerYear, 2)",
                    inputNames: "annualSalary,periodsPerYear"
                })
            )
            structure(
                prefix + "_HOUR",
                "PpbHourly",
                component("HOURLY", {formula: "workedHours * hourlyRate", inputNames: "workedHours,hourlyRate"})
            )
            for (const [who, structureId] of [
                ["ines", prefix + "_SAL"],
                ["tomas", prefix + "_HOUR"]
            ])
                call("create#mantle.humanres.payroll.PayrollAssignment", {
                    partyRelationshipId: emp[who],
                    partyId: party[who],
                    organizationPartyId: ids.organizationId,
                    payrollStructureId: structureId,
                    payrollGroupId: state.group,
                    isPrimary: "Y",
                    fromDate: "2026-11-01 00:00:00",
                    thruDate: "2026-12-01 00:00:00"
                })
            // stored, not created: PeoplePayHandoffUsable gives Ines the same salary for the month it runs in
            call("store#mantle.humanres.employment.EmploymentSalary", {
                partyRelationshipId: emp.ines,
                fromDate: "2026-11-01 00:00:00",
                thruDate: "2026-12-01 00:00:00",
                amount: "48000",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
            call("create#mantle.humanres.rate.RateAmount", {
                partyId: party.tomas,
                ratePurposeEnumId: "RaprVendor",
                rateAmount: "15",
                rateCurrencyUomId: "USD",
                timePeriodUomId: "TF_hr",
                fromDate: "2026-11-01 00:00:00",
                thruDate: "2026-12-01 00:00:00"
            })
        })
        input("tomas", {inputDate: "2026-11-02", quantity: "8"})
        input("tomas", {inputDate: "2026-11-03", quantity: "8"})
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("an approved run's results are preview slips: payroll reads each line explained; the employee sees none", {
    when() {
        const created = request(
            users.payroll,
            "apps/People/Payroll/PayRuns/createRun",
            {payrollGroupId: state.group, timePeriodId: state.november},
            "post"
        )
        state.runId = system(() =>
            ec.entity.find("mantle.humanres.payroll.PayrollRun").condition({payrollGroupId: state.group}).one()
        )?.payrollRunId
        const flow = calculateAskApprove(state.runId)
        state.original = slipOf(state.runId, emp.tomas)?.payslipId
        const list = asUser(users.payroll, () => page("Payroll/Payslips", {payrollRunId: state.runId}, "html"))
        const detail = asUser(users.payroll, () => page("Payroll/PayslipDetail", {payslipId: state.original}, "html"))
        const selfService = asUser(users.employee, () => page("People/SelfService", {}, "html", "Commons"))
        const mine = asUser(users.employee, () => page("People/MyPayslip", {payslipId: state.original}, "html", "Commons"))
        return {
            createdErrors: created.errors,
            flow,
            slip: [slipOf(state.runId, emp.tomas)?.statusId, slipOf(state.runId, emp.ines)?.statusId],
            listed: ["Tomas", "Ines", "Preview"].every(text => list.output.includes(text)),
            explained: ["workedHours * hourlyRate", "240.00", "Preview: payroll's alone", "Correct pay"].every(text =>
                detail.output.includes(text)
            ),
            noCard: !selfService.output.includes("My payslips"),
            notAvailable: mine.output.includes("Not available")
        }
    },
    then({createdErrors, flow, slip, listed, explained, noCard, notAvailable}) {
        createdErrors == ""
        flow == ""
        slip == ["PssPreview", "PssPreview"]
        listed
        explained
        noCard
        notAvailable
    }
})

feature("a correction run links to the original slip, which stays, with the net effect; the employee still sees nothing", {
    when() {
        // four more hours of November 20, approved late (an approved input, as data: hours for pay is its own walk's)
        input("tomas", {inputDate: "2026-11-20", quantity: "4"})
        const corrected = request(
            users.payroll,
            "apps/People/Payroll/PayslipDetail/createCorrection",
            {payslipId: state.original, reason: "Four hours of November 20 approved late"},
            "post"
        )
        state.correctionRun = system(() =>
            ec.entity.find("mantle.humanres.payroll.PayrollRun").condition({correctsPayslipId: state.original}).one()
        )?.payrollRunId
        const flow = calculateAskApprove(state.correctionRun)
        const slip = slipOf(state.correctionRun, emp.tomas)
        state.correction = slip?.payslipId
        const original = asUser(users.payroll, () => page("Payroll/PayslipDetail", {payslipId: state.original}, "html"))
        const listed = as(users.employee, "mantle.humanres.PayrollResultServices.find#Payslips", {})
        return {
            correctedErrors: corrected.errors,
            flow,
            links: [slip?.correctsPayslipId == state.original, slip?.runKindEnumId],
            change: slip ? String(toDecimal(slip.grossAmount).setScale(2)) : null,
            originalStays: [
                slipOf(state.runId, emp.tomas)?.statusId,
                String(toDecimal(slipOf(state.runId, emp.tomas).grossAmount).setScale(2))
            ],
            netEffect: original.output.includes("Net effect") && original.output.includes("Original and corrections"),
            employeeSees: Array.from(listed.payslips || []).length
        }
    },
    then({correctedErrors, flow, links, change, originalStays, netEffect, employeeSees}) {
        correctedErrors == ""
        flow == ""
        links == [true, "PrkCorrection"]
        // 4 h at 15: the change alone
        change == "60.00"
        originalStays == ["PssPreview", "240.00"]
        netEffect
        employeeSees == 0
    }
})

feature("issued (the acceptance fixture's final slips), the employee is told with no amount and reads both on SelfService", {
    when() {
        // as P27's finalization would make them (preview mode issues nothing, §5 Q3): the acceptance fixture alone
        for (const payslipId of [state.original, state.correction])
            system(() =>
                ec.entity
                    .find(SLIP)
                    .condition("payslipId", payslipId)
                    .one()
                    .setAll({statusId: "PssFinal", isPreview: "N"})
                    .update()
            )
        const issued = [state.original, state.correction].map(
            payslipId => request(users.payroll, "apps/People/Payroll/PayslipDetail/issuePayslip", {payslipId}, "post").errors
        )
        const notices = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.security.user.NotificationMessage")
                    .condition({topic: "PayslipIssued", recordId: state.original})
                    .list()
            )
        )
        const selfService = asUser(users.employee, () => page("People/SelfService", {}, "html", "Commons"))
        const correction = asUser(users.employee, () =>
            page("People/MyPayslip", {payslipId: state.correction}, "html", "Commons")
        )
        return {
            issued,
            told: notices.length == 1 && !String(notices[0].messageJson || "").includes("240"),
            card: selfService.output.includes("My payslips") && selfService.output.includes("2026-11-30"),
            correctionRead: ["Pay correction", "Net effect", "Download statement"].every(text =>
                correction.output.includes(text)
            ),
            invoices: tomasInvoices() - state.tomasInvoices
        }
    },
    then({issued, told, card, correctionRead, invoices}) {
        issued == ["", ""]
        told
        card
        correctionRead
        invoices == 0
    }
})
