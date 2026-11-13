// People P27's "usable when" (impl-people P27; design-people §8.2 steps 6 and 7, §8.3, §14.3 "Accounting and posting", "Payment
// and bank changes", "Localization readiness"; design-accounting AC-23), as an acceptance walk with artifact authorization on,
// through the screens' transitions: Retail's demonstration group's approved run is refused Finalize on PayRunDetail with its two
// reasons (the demonstration localization is never live; the group is not enabled for live pay); under this test's own live
// fixture (a real localization of its own, a live group bound to a levy authority and Retail's accounts) the payroll operator
// finalizes an approved run once (a second Finalize makes nothing again), a payroll finance user of Accounting (finance with
// PAYROLL_VIEW) approves and pays Ines's net pay invoice, PayRunDetail's Settlement shows it posted and paid, and a general ledger
// reader (finance.gl, no PAYROLL_VIEW) cannot open the worker's payroll invoice. The rules themselves are Mantle's PayObligations
// and mr-boss's AccountingPayrollOrigin and PeopleAccessLater. Run: ./moq accept mr-boss --spec PeoplePayHandoffUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.humanres.PayrollRunServices."
const webroot = "component://webroot/screen/webroot.xml"
const prefix = "WALK27"
const ines = {partyId: ids.reportPartyId, employmentId: "BOSS_PPL_INES_EMP"}
const financePayroll = prefix + "_FINANCE"
// the username the walk signs in with (asUser logs in by username, not by userId)
const financePayrollUsername = "walk.finance.payroll"
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
const runOf = payrollGroupId =>
    system(() => ec.entity.find("mantle.humanres.payroll.PayrollRun").condition({payrollGroupId}).one())?.payrollRunId
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
// a group of Retail with this month's period paid today, Ines assigned to it with her salary
function group(payrollGroupId, payrollLocalizationId, extra = {}) {
    const from = today().slice(0, 8) + "01"
    call(
        "create#mantle.humanres.payroll.PayrollGroup",
        Object.assign(
            {
                payrollGroupId,
                organizationPartyId: ids.organizationId,
                groupName: payrollGroupId,
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: from,
                periodsPerYear: 12,
                payDateOffsetDays: 0,
                prorationEnumId: "PprCalendarDays",
                timeBasisEnumId: "PtbTimesheets",
                payrollLocalizationId,
                liveEnabled: "N",
                fromDate: 0
            },
            extra
        )
    )
    const [year, month] = from.split("-").map(Number)
    const thru = from.slice(0, 8) + String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")
    const existing = ec.entity
        .find("mantle.party.time.TimePeriod")
        .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: from})
        .one()
    state.period = existing
        ? existing.timePeriodId
        : call("mantle.party.TimeServices.create#TimePeriod", {
              partyId: ids.organizationId,
              timePeriodTypeId: "PayrollMonth",
              fromDate: from,
              thruDate: thru
          }).timePeriodId
    call("create#mantle.humanres.payroll.PayrollGroupPeriod", {payrollGroupId, timePeriodId: state.period, payDate: today()})
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const salary = prefix + "_C_SALARY"
            call("create#mantle.humanres.payroll.PayrollComponent", {
                payrollComponentId: salary,
                organizationPartyId: ids.organizationId,
                componentCode: prefix + "_SALARY",
                componentName: "Walk salary",
                componentKindEnumId: "PckEarning"
            })
            call("create#mantle.humanres.payroll.PayrollComponentTerm", {
                payrollComponentId: salary,
                statusId: "PtsPublished",
                fromDate: 0,
                basisEnumId: "PcbFormula",
                formula: "round(annualSalary / periodsPerYear, 2)",
                inputNames: "annualSalary,periodsPerYear",
                currencyUomId: "USD",
                expenseGlAccountId: "631100000",
                liabilityGlAccountId: "224000000"
            })
            call("create#mantle.humanres.payroll.PayrollStructure", {
                payrollStructureId: prefix + "_SAL",
                organizationPartyId: ids.organizationId,
                structureName: "Walk salaried",
                currencyUomId: "USD",
                payBasisEnumId: "PpbSalaried",
                statusId: "PtsPublished",
                fromDate: 0
            })
            call("create#mantle.humanres.payroll.PayrollStructureComponent", {
                payrollStructureId: prefix + "_SAL",
                payrollComponentId: salary,
                statusId: "PtsPublished",
                fromDate: 0,
                sequenceNum: 1
            })
            // the demonstration group (preview only) and this test's own live fixture: a real localization of its own, calculating
            // as the demonstration, and a live group bound to a levy authority and Retail's accounts
            state.demo = prefix + "_DEMO"
            group(state.demo, "PlzDemonstration")
            state.authority = prefix + "_AUTHORITY"
            call("create#mantle.party.Party", {partyId: state.authority, partyTypeEnumId: "PtyOrganization"})
            call("create#mantle.party.Organization", {partyId: state.authority, organizationName: "Walk levy authority"})
            call("create#mantle.humanres.payroll.PayrollLocalization", {
                payrollLocalizationId: prefix + "_LIVE",
                localizationName: "Walk live localization (acceptance fixture)",
                calculationServiceName: "mantle.humanres.PayrollLocalizationServices.calculate#Demonstration",
                coverageFromDate: "2000-01-01 00:00:00",
                releaseVersion: "1",
                isDemonstration: "N"
            })
            state.live = prefix + "_LIVEGRP"
            group(state.live, prefix + "_LIVE", {
                liveEnabled: "Y",
                localizationPayeePartyId: state.authority,
                localizationLiabilityGlAccountId: "224000000",
                localizationExpenseGlAccountId: "631100000"
            })
            // Ines in the demonstration group the first half of the walk, then in the live group
            call("create#mantle.humanres.payroll.PayrollAssignment", {
                payrollAssignmentId: prefix + "_A_DEMO",
                partyRelationshipId: ines.employmentId,
                partyId: ines.partyId,
                organizationPartyId: ids.organizationId,
                payrollStructureId: prefix + "_SAL",
                payrollGroupId: state.demo,
                isPrimary: "Y",
                fromDate: 0
            })
            // Ines's salary for the month (the demo data gives no one a salary; a salaried unit without one is in error), ending
            // when the next month starts so PeoplePayRunsUsable's December is its own
            const monthStart = today().slice(0, 8) + "01"
            const [year, month] = monthStart.split("-").map(Number)
            const nextMonth = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
            call("store#mantle.humanres.employment.EmploymentSalary", {
                partyRelationshipId: ines.employmentId,
                fromDate: monthStart + " 00:00:00",
                thruDate: nextMonth + " 00:00:00",
                amount: "48000",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
            // a payroll finance user of Accounting: Retail's agent with the approver's and treasury's groups and PAYROLL_VIEW
            call("create#moqui.security.UserGroup", {userGroupId: financePayroll, description: "Walk payroll finance"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: financePayroll,
                userPermissionId: "PAYROLL_VIEW",
                fromDate: 0
            })
            call("create#mantle.party.Party", {partyId: financePayroll, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: financePayroll, firstName: "Walk", lastName: "Payroll finance"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: financePayroll,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: financePayroll,
                username: financePayrollUsername,
                partyId: financePayroll,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of [
                "BOSS_USERS",
                "BOSS_ACCOUNTING",
                "BOSS_ACCOUNTING_APPROVE",
                "BOSS_ACCOUNTING_TREASURY",
                financePayroll
            ])
                call("create#moqui.security.UserGroupMember", {userId: financePayroll, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", financePayroll)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
    }
})

feature("the demonstration group's approved run is refused Finalize with its two reasons", {
    when() {
        request(
            users.payroll,
            "apps/People/Payroll/PayRuns/createRun",
            {payrollGroupId: state.demo, timePeriodId: state.period},
            "post"
        )
        const runId = runOf(state.demo)
        as(users.payroll, R + "calculate#Run", {payrollRunId: runId})
        as(users.payroll, R + "submit#Run", {payrollRunId: runId})
        as(users.payApprover, R + "approve#Run", {payrollRunId: runId})
        const shown = asUser(users.payroll, () => page("Payroll/PayRunDetail", {payrollRunId: runId, step: "finalize"}, "html"))
        const refused = request(users.payroll, "apps/People/Payroll/PayRunDetail/finalizeRun", {payrollRunId: runId}, "post")
        // Ines moves to the live group from here (the demonstration assignment ended, a live one from the period's start)
        system(() => {
            call("update#mantle.humanres.payroll.PayrollAssignment", {payrollAssignmentId: prefix + "_A_DEMO", thruDate: 0})
            call("create#mantle.humanres.payroll.PayrollAssignment", {
                partyRelationshipId: ines.employmentId,
                partyId: ines.partyId,
                organizationPartyId: ids.organizationId,
                payrollStructureId: prefix + "_SAL",
                payrollGroupId: state.live,
                isPrimary: "Y",
                fromDate: 0
            })
        })
        return {shown: shown.output, refused: refused.errors}
    },
    then({shown, refused}) {
        shown.includes("This pay group is not live")
        shown.includes("PREVIEW_ONLY")
        shown.includes("LIVE_NOT_ENABLED")
        refused.includes("NOT_LIVE")
        refused.includes("PREVIEW_ONLY")
        refused.includes("LIVE_NOT_ENABLED")
    }
})

feature("under the live fixture the payroll operator finalizes the approved run once", {
    when() {
        request(
            users.payroll,
            "apps/People/Payroll/PayRuns/createRun",
            {payrollGroupId: state.live, timePeriodId: state.period},
            "post"
        )
        state.runId = runOf(state.live)
        request(users.payroll, "apps/People/Payroll/PayRunDetail/calculateRun", {payrollRunId: state.runId}, "post")
        request(users.payroll, "apps/People/Payroll/PayRunDetail/submitRun", {payrollRunId: state.runId}, "post")
        as(users.payApprover, R + "approve#Run", {payrollRunId: state.runId})
        const finalized = request(
            users.payroll,
            "apps/People/Payroll/PayRunDetail/finalizeRun",
            {payrollRunId: state.runId},
            "post"
        )
        const obligations = () =>
            system(() =>
                Array.from(
                    ec.entity.find("mantle.humanres.payroll.PayrollObligation").condition({payrollRunId: state.runId}).list()
                )
            )
        const first = obligations().length
        const again = request(users.payroll, "apps/People/Payroll/PayRunDetail/finalizeRun", {payrollRunId: state.runId}, "post")
        state.net = obligations().find(row => row.obligationKindEnumId === "PokNetPay")?.invoiceId
        return {
            errors: finalized.errors + again.errors,
            status: system(() =>
                ec.entity.find("mantle.humanres.payroll.PayrollRun").condition({payrollRunId: state.runId}).one()
            ).statusId,
            first,
            after: obligations().length,
            invoiceStatus: system(() => ec.entity.find("mantle.account.invoice.Invoice").condition({invoiceId: state.net}).one())
                ?.statusId
        }
    },
    then({errors, status, first, after, invoiceStatus}) {
        errors == ""
        status == "PrnFinalized"
        // Ines's net pay and the authority's levies
        first == 2
        after == first
        invoiceStatus == "InvoiceReceived"
    }
})

feature("Accounting approves, posts and pays the net pay; Settlement shows it; a general ledger reader cannot open it", {
    when() {
        const stamp = () =>
            system(() => ec.entity.find("mantle.account.invoice.Invoice").condition({invoiceId: state.net}).one())
                .lastUpdatedStamp
        const approved = as(financePayrollUsername, "mantle.account.InvoiceServices.approve#Payable", {
            invoiceId: state.net,
            lastUpdatedStamp: stamp()
        })
        const unpaid = system(() =>
            ec.entity.find("mantle.account.invoice.Invoice").condition({invoiceId: state.net}).one()
        ).unpaidTotal
        const payment = as(financePayrollUsername, "mantle.account.PaymentServices.create#Payment", {
            paymentTypeEnumId: "PtPayrollPayment",
            fromPartyId: ids.organizationId,
            toPartyId: ines.partyId,
            amount: unpaid,
            amountUomId: "USD",
            paymentInstrumentEnumId: "PiCompanyCheck",
            statusId: "PmntDelivered",
            effectiveDate: ec.user.nowTimestamp
        })
        as(financePayrollUsername, "mantle.account.PaymentServices.apply#InvoicePayment", {
            paymentId: payment.paymentId,
            invoiceId: state.net
        })
        const settlement = asUser(users.payroll, () =>
            page("Payroll/PayRunDetail", {payrollRunId: state.runId, step: "settlement"}, "html")
        )
        const glReader = asUser("finance.gl", () =>
            system(() =>
                lib.refusal("mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {
                    invoiceId: state.net,
                    organizationPartyId: ids.organizationId
                })
            )
        )
        return {approved, settlement: settlement.output, glReader}
    },
    then({approved, settlement, glReader}) {
        approved.statusId == "InvoiceApproved"
        settlement.includes(state.net)
        settlement.includes("Posted")
        settlement.includes("Payment instructions")
        glReader.includes("INVOICE_UNAVAILABLE")
    }
})
