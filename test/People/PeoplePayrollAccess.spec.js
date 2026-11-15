// People payroll access, P22 to P29 and P31 (impl-people §2; design-people §1.1, §1.2): the access rules of payroll configuration,
// pay assignments, pay inputs and adjustments, pay runs, payslips, finalizing and settlement, payroll imports, the payroll register
// and Reports, and PAYROLL_VIEW without a People read, one feature per phase's rule, each case of it a line of its problems, with
// artifact authorization enabled. Split from PeopleAccessLater in Sales follow-up 4 (it ran over 15 s on a loaded run), every
// feature kept and unchanged; PeopleAccessLater holds P11 to P21 and P30, PeopleAccess P1 to P10 and every phase's context links,
// menu groups and capabilities; they share PeopleSpecLib and no state (P27's feature finalizes the run of the group P26's feature
// makes, so the two stay here, in that order). A later phase adds a case here only for a payroll access rule it adds.
// P22 (and its review's calls of Nov 12, 2026): a pay component stored by the payroll operator (PAYROLL_EDIT and PAYROLL_CONFIGURE)
// and refused to the HR officer with the same parameters, Services' component missing to Retail's payroll, its publishing asked by
// the payroll operator and approved by the payroll approver (the operator and HR refused the decision), and the pay configuration
// screens under Payroll opened to the payroll operator and refused to the HR officer (the Payroll group is PeopleAccess's menu
// feature).
// P23: Employee360's Compensation in the context's answer for the payroll operator and absent for the HR officer with the same
// parameters; a pay structure assigned by the payroll operator (a preview) and refused to the HR officer with the same parameters;
// Services' employee's compensation missing to Retail's payroll; PayAssignments the payroll operator's (the HR officer refused the
// screen); a pay change asked by the payroll operator and refused to the HR officer with the same parameters.
// P24: a pay group's period prepared by the payroll operator (a preview) and refused to the HR officer with the same parameters;
// an adjustment payroll's (refused for the permission to the HR officer, payroll past it with the same parameters); Services'
// group missing to Retail's payroll; Hours for pay the payroll operator's and the manager's (the HR officer refused the screen),
// Pay adjustments payroll's (the HR officer refused the screen).
// P25: a pay run created by the payroll operator and refused to the HR officer with the same parameters; Services' group missing to
// Retail's payroll; the runs read by the payroll approver and refused to the HR officer; PayRuns and PayRunDetail the payroll
// operator's and the approver's (the HR officer refused both screens).
// P26: a payslip corrected by the payroll operator and refused to the HR officer with the same parameters; the slip read by the payroll
// approver and missing to the HR officer; Services' slip missing to Retail's payroll; the employee's own preview slip missing to
// them through get#MyPayslip, and find#Payslips answering them nothing but their own issued slips; Payslips and PayslipDetail refused
// to the HR officer; MyPayslip opened to the employee by its own grant (BOSS_PPL_PAYSLIP_SELF) and refused another app's user.
// P27: a pay run finalized by the payroll operator alone (the HR officer refused with the same parameters, the operator past the
// permission to the group's own refusal: the demonstration group is not live), Services' run missing to Retail's payroll; its
// settlement read by the payroll approver and refused to the HR officer; a pay obligation's invoice in Payroll's InvoiceDetail
// (get#Obligation) a payroll reader's of its employer, refused to the HR officer and missing to Retail's payroll for Services'.
// P27 review: Overpayment recovery (PayRecovery) payroll's, its settings refused to the HR officer (the user's call of Nov 13, 2026).
// P28: a payroll history import previewed by the payroll operator (PEOPLE_IMPORT with PAYROLL_VIEW and PAYROLL_EDIT) and refused to
// the HR officer (PEOPLE_IMPORT without payroll) with the same parameters; the exchange read by the payroll approver and refused to
// the HR officer, Services' missing to Retail's payroll; PayrollExchange payroll's (one html render, the HR officer refused the
// screen) and the import listed in Admin's Imports with People's place.
// P29: the payroll register run by the payroll operator and refused to the HR officer with the same parameters, Services' headcount
// refused to Retail's HR; Reports opened to HR and payroll and refused to the directory reader and the manager; the confidential case
// intake set by the People administrator and refused to the HR officer with the same parameters; the clocking default set by the HR
// officer and refused to the directory reader with the same parameters, Services' refused to Retail's HR; Preferences the People
// administrator's (the HR officer refused the screen).
// P31 (the lead's call of Nov 13, 2026): PAYROLL_VIEW alone is no People read: Accounting's payroll finance (a spec-local account of
// BOSS_ACCOUNTING_PAYROLL, an agent of Retail) is refused Tomas's employee record, the directory and his compensation, with the
// parameters the payroll operator, who holds PEOPLE_DIRECTORY_VIEW beside it, is answered with.
// Run: ./moq test mr-boss --spec PeoplePayrollAccess
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal} = lib
// a refusal of a user without People: the service is not authorized for them, or it refuses them
const refused = message => /PEOPLE_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// P26: the payslip case's group, made in its feature
const state26 = {}
// P31: a spec-local payroll finance user of Accounting (BOSS_ACCOUNTING_PAYROLL: PAYROLL_VIEW with the finance permissions), an agent
// of Retail, so the rule is met at an employer that has employees (finance.payroll is Accounting's organization's agent)
const financePayroll = "PPL_SPEC_FIN_PAYROLL"

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#mantle.party.Party", {partyId: financePayroll, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: financePayroll, firstName: "People spec", lastName: "Payroll finance"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: financePayroll,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: financePayroll,
                username: "people.spec.financepayroll",
                partyId: financePayroll,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_ACCOUNTING", "BOSS_ACCOUNTING_PAYROLL"])
                call("create#moqui.security.UserGroupMember", {userId: financePayroll, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec users' memberships end, so no later spec meets a People user it does not know
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", "in", [financePayroll])
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

// P22: payroll configuration needs PAYROLL_EDIT and PAYROLL_CONFIGURE (design §1.1; the P22 review's call of Nov 12, 2026): the payroll
// operator, who holds both, stores a pay component of Retail and the HR officer (no payroll permission) is refused it with the same
// parameters; the payroll operator reads Retail's component and is refused Services' as missing; publishing it is approved by the
// payroll approver and refused to the payroll operator who asked; the pay configuration screens, under Payroll, open to the payroll
// operator and are refused to the HR officer.
feature(
    "payroll configuration: a pay component stored by the payroll operator and refused to HR with the same parameters; Services' component missing to Retail's payroll; publishing the approver's; the screens payroll's",
    {
        when() {
            const P = "mantle.humanres.PayrollSetupServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            const component = (organizationPartyId, componentCode) => ({
                organizationPartyId,
                componentCode,
                componentName: "Access spec " + componentCode,
                componentKindEnumId: "PckEarning",
                basisEnumId: "PcbAmount",
                amount: "10.00",
                currencyUomId: "USD"
            })
            const stored = componentCode =>
                system(() =>
                    ec.entity
                        .find("mantle.humanres.payroll.PayrollComponent")
                        .condition({organizationPartyId: ids.organizationId, componentCode})
                        .one()
                )
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(P + service, parameters))))
            const codes = {
                payroll: as(users.payroll, "store#Component", component(ids.organizationId, "ACCESS_A")),
                hr: as(users.hr, "store#Component", component(ids.organizationId, "ACCESS_B"))
            }
            if (stored("ACCESS_B")) problems.push("the HR officer's component was stored")
            const services = asUser(users.admin, () =>
                system(() => invoke(P + "store#Component", component(ids.otherOrganizationId, "ACCESS_S")))
            ).payrollComponentId
            const retail = stored("ACCESS_A")?.payrollComponentId
            codes.payrollReadsRetail = as(users.payroll, "find#Components", {payrollComponentId: retail})
            codes.payrollReadsServices = as(users.payroll, "find#Components", {payrollComponentId: services})
            // its example, then publishing asked by the payroll operator: refused to them and approved by the payroll approver
            const revision = () =>
                asUser(users.payroll, () => system(() => invoke(P + "find#Components", {payrollComponentId: retail}))).component
                    .revision
            asUser(users.payroll, () =>
                system(() =>
                    invoke(P + "store#ComponentExample", {
                        payrollComponentId: retail,
                        expectedRevision: revision(),
                        exampleName: "Ten",
                        inputValues: "",
                        expectedAmount: "10.00"
                    })
                )
            )
            const account = system(
                () =>
                    ec.entity
                        .find("mantle.ledger.account.GlAccountOrganization")
                        .condition("organizationPartyId", ids.organizationId)
                        .limit(1)
                        .one()?.glAccountId
            )
            asUser(users.payroll, () =>
                system(() =>
                    invoke(P + "store#Component", {
                        payrollComponentId: retail,
                        expectedRevision: revision(),
                        expenseGlAccountId: account
                    })
                )
            )
            codes.asked = as(users.payroll, "publish#Component", {
                payrollComponentId: retail,
                expectedRevision: revision(),
                reason: "Access spec"
            })
            codes.payrollDecides = as(users.payroll, "decide#Publication", {payrollComponentId: retail})
            codes.hrDecides = as(users.hr, "decide#Publication", {payrollComponentId: retail})
            codes.approverDecides = as(users.payApprover, "decide#Publication", {payrollComponentId: retail})
            for (const path of ["Payroll/PayComponents", "Payroll/PayStructures", "Payroll/PayGroups"]) {
                const opened = screenRefusal(users.payroll, path)
                if (opened) problems.push(`the payroll operator's ${path}: ${opened}`)
                const refusedScreen = screenRefusal(users.hr, path)
                if (!unauthorized(refusedScreen)) problems.push(`${users.hr} opens ${path}: ${refusedScreen || "opened"}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    payroll: "accepted",
                    hr: "PERMISSION_DENIED",
                    payrollReadsRetail: "accepted",
                    payrollReadsServices: "RECORD_UNAVAILABLE",
                    asked: "accepted",
                    payrollDecides: "PERMISSION_DENIED",
                    hrDecides: "PERMISSION_DENIED",
                    approverDecides: "accepted"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "pay assignments: Compensation answered to the payroll operator and absent for HR with the same parameters; assigning payroll's; Services' employee missing to Retail's payroll; the screen payroll's",
    {
        when() {
            const P = "mantle.humanres.PayrollSetupServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            // Retail's published structure and pay group, made as data (configuration is P22's)
            const structureId = "PPL_SPEC_ACC23_S"
            const groupId = "PPL_SPEC_ACC23_G"
            system(() => {
                call("create#mantle.humanres.payroll.PayrollStructure", {
                    payrollStructureId: structureId,
                    organizationPartyId: ids.organizationId,
                    structureName: "Access spec structure",
                    currencyUomId: "USD",
                    payBasisEnumId: "PpbHourly",
                    statusId: "PtsPublished",
                    fromDate: 0
                })
                call("create#mantle.humanres.payroll.PayrollGroup", {
                    payrollGroupId: groupId,
                    organizationPartyId: ids.organizationId,
                    groupName: "Access spec group",
                    currencyUomId: "USD",
                    timePeriodTypeId: "PayrollMonth",
                    firstPeriodFromDate: "2026-01-01",
                    periodsPerYear: 12,
                    payDateOffsetDays: 0,
                    prorationEnumId: "PprCalendarDays",
                    timeBasisEnumId: "PtbSchedule",
                    liveEnabled: "N",
                    fromDate: 0
                })
            })
            const context = user =>
                asUser(user, () =>
                    invoke("ironstone.people.ContextServices.get#Employee360Context", {
                        appRoot: "People",
                        partyId: ids.employeePartyId,
                        partyRelationshipId: ids.employmentId
                    })
                )
            const payroll = context(users.payroll)
            const hr = context(users.hr)
            if (!Array.from(payroll.regions || []).includes("compensation") || !payroll.record?.compensation)
                problems.push("the payroll operator reads no Compensation")
            if (Array.from(hr.regions || []).includes("compensation") || Object.hasOwn(hr.record || {}, "compensation"))
                problems.push("the HR officer reads Compensation")
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            const assign = {
                partyRelationshipIds: ids.employmentId,
                payrollStructureId: structureId,
                payrollGroupId: groupId,
                preview: true
            }
            const payRevision = payroll.record?.compensation?.payRevision
            const payChange = {
                partyRelationshipId: ids.employmentId,
                changeKind: "pay",
                salaryAmount: "2500",
                salaryCurrencyUomId: "USD",
                salaryPeriodTypeId: "PayrollMonth",
                reason: "Access spec",
                expectedRevision: payRevision
            }
            const codes = {
                payrollAssigns: as(users.payroll, P + "assign#PayStructure", assign),
                hrAssigns: as(users.hr, P + "assign#PayStructure", assign),
                hrReads: as(users.hr, P + "get#Compensation", {partyId: ids.employeePartyId}),
                payrollReadsServices: as(users.payroll, P + "get#Compensation", {partyId: ids.otherEmployeePartyId}),
                hrAsksPayChange: as(users.hr, "mantle.humanres.PeopleServices.preview#EmploymentChange", payChange),
                payrollPreviewsPayChange: as(users.payroll, "mantle.humanres.PeopleServices.preview#EmploymentChange", payChange)
            }
            const opened = screenRefusal(users.payroll, "Payroll/PayAssignments")
            if (opened) problems.push(`the payroll operator's PayAssignments: ${opened}`)
            const refusedScreen = screenRefusal(users.hr, "Payroll/PayAssignments")
            if (!unauthorized(refusedScreen)) problems.push(`${users.hr} opens PayAssignments: ${refusedScreen || "opened"}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    payrollAssigns: "accepted",
                    hrAssigns: "PERMISSION_DENIED",
                    hrReads: "PERMISSION_DENIED",
                    payrollReadsServices: "RECORD_UNAVAILABLE",
                    hrAsksPayChange: "PERMISSION_DENIED",
                    payrollPreviewsPayChange: "accepted"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P24: preparing pay inputs and adjusting pay are payroll's: the HR officer refused with the same parameters, Services' group missing to Retail's payroll; Hours for pay payroll's and the managers', Pay adjustments payroll's",
    {
        when() {
            const S = "mantle.humanres.PayrollInputServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            // a Retail group and a Services group with a period each, as data: configuration is P22's
            const group = (payrollGroupId, organizationPartyId) =>
                system(() => {
                    call("create#mantle.humanres.payroll.PayrollGroup", {
                        payrollGroupId,
                        organizationPartyId,
                        groupName: payrollGroupId,
                        currencyUomId: "USD",
                        timePeriodTypeId: "PayrollMonth",
                        firstPeriodFromDate: "2026-02-01",
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
                        .condition({partyId: organizationPartyId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-02-01"})
                        .one()
                    const timePeriodId = existing
                        ? existing.timePeriodId
                        : call("mantle.party.TimeServices.create#TimePeriod", {
                              partyId: organizationPartyId,
                              timePeriodTypeId: "PayrollMonth",
                              fromDate: "2026-02-01",
                              thruDate: "2026-02-28"
                          }).timePeriodId
                    call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                        payrollGroupId,
                        timePeriodId,
                        payDate: "2026-02-28"
                    })
                    return {payrollGroupId, timePeriodId}
                })
            const retail = group("PPL_SPEC_PAL_G", ids.organizationId)
            const services = group("PPL_SPEC_PAL_GS", ids.otherOrganizationId)
            const preview = Object.assign({preview: true}, retail)
            // the same adjustment for both: payroll passes the permission and is refused for the employment's missing pay group
            const adjustment = {
                partyRelationshipId: ids.employmentId,
                payrollComponentId: "NO_SUCH_COMPONENT",
                inputDate: "2026-02-10",
                amount: "10",
                reason: "Access spec"
            }
            const codes = {
                payrollPrepares: as(users.payroll, S + "prepare#Inputs", preview),
                hrPrepares: as(users.hr, S + "prepare#Inputs", preview),
                payrollServices: as(users.payroll, S + "prepare#Inputs", Object.assign({preview: true}, services)),
                payrollAdjusts: as(users.payroll, S + "store#Adjustment", adjustment),
                hrAdjusts: as(users.hr, S + "store#Adjustment", adjustment),
                managerReconciles: as(users.manager, S + "get#Reconciliation", retail),
                hrReconciles: as(users.hr, S + "get#Reconciliation", retail)
            }
            const problems = []
            for (const user of [users.payroll, users.manager]) {
                const opened = screenRefusal(user, "Time/HoursForPay")
                if (opened) problems.push(`${user}'s HoursForPay: ${opened}`)
            }
            for (const path of ["Time/HoursForPay", "Payroll/PayAdjustments"]) {
                const refusedScreen = screenRefusal(users.hr, path)
                if (!unauthorized(refusedScreen)) problems.push(`${users.hr} opens ${path}: ${refusedScreen || "opened"}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    payrollPrepares: "accepted",
                    hrPrepares: "PERMISSION_DENIED",
                    payrollServices: "RECORD_UNAVAILABLE",
                    payrollAdjusts: "NO_PAY_GROUP",
                    hrAdjusts: "PERMISSION_DENIED",
                    managerReconciles: "accepted",
                    hrReconciles: "PERMISSION_DENIED"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P25: a pay run is payroll's: created by the payroll operator and refused to the HR officer with the same parameters, Services' group missing to Retail's payroll; PayRuns and PayRunDetail payroll's",
    {
        when() {
            const S = "mantle.humanres.PayrollRunServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            // a Retail group and a Services group with a period each, as data: configuration is P22's
            const group = (payrollGroupId, organizationPartyId) =>
                system(() => {
                    call("create#mantle.humanres.payroll.PayrollGroup", {
                        payrollGroupId,
                        organizationPartyId,
                        groupName: payrollGroupId,
                        currencyUomId: "USD",
                        timePeriodTypeId: "PayrollMonth",
                        firstPeriodFromDate: "2026-05-01",
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
                        .condition({partyId: organizationPartyId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-05-01"})
                        .one()
                    const timePeriodId = existing
                        ? existing.timePeriodId
                        : call("mantle.party.TimeServices.create#TimePeriod", {
                              partyId: organizationPartyId,
                              timePeriodTypeId: "PayrollMonth",
                              fromDate: "2026-05-01",
                              thruDate: "2026-05-31"
                          }).timePeriodId
                    call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                        payrollGroupId,
                        timePeriodId,
                        payDate: "2026-05-31"
                    })
                    return {payrollGroupId, timePeriodId}
                })
            const retail = group("PPL_SPEC_PAL_RG", ids.organizationId)
            const services = group("PPL_SPEC_PAL_RGS", ids.otherOrganizationId)
            // the HR officer first, with the parameters the payroll operator then creates the run with
            const codes = {
                hrCreates: as(users.hr, S + "create#Run", retail),
                payrollCreates: as(users.payroll, S + "create#Run", retail),
                payrollServices: as(users.payroll, S + "create#Run", services),
                approverReads: as(users.payApprover, S + "find#Runs", {}),
                hrReads: as(users.hr, S + "find#Runs", {})
            }
            const problems = []
            const runId = system(() =>
                ec.entity.find("mantle.humanres.payroll.PayrollRun").condition({payrollGroupId: retail.payrollGroupId}).one()
            )?.payrollRunId
            for (const user of [users.payroll, users.payApprover])
                for (const [path, parameters] of [
                    ["Payroll/PayRuns", {}],
                    ["Payroll/PayRunDetail", {payrollRunId: runId}]
                ]) {
                    const opened = screenRefusal(user, path, parameters)
                    if (opened) problems.push(`${user}'s ${path}: ${opened}`)
                }
            for (const path of ["Payroll/PayRuns", "Payroll/PayRunDetail"]) {
                const refusedScreen = screenRefusal(users.hr, path, {payrollRunId: runId})
                if (!unauthorized(refusedScreen)) problems.push(`${users.hr} opens ${path}: ${refusedScreen || "opened"}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    hrCreates: "PERMISSION_DENIED",
                    payrollCreates: "accepted",
                    payrollServices: "RECORD_UNAVAILABLE",
                    approverReads: "accepted",
                    hrReads: "PERMISSION_DENIED"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P26: a payslip is payroll's: corrected by the payroll operator and refused to the HR officer with the same parameters, Services' slip missing to Retail's payroll; the employee's own issued slips alone",
    {
        when() {
            const R = "mantle.humanres.PayrollRunServices."
            const P = "mantle.humanres.PayrollResultServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            const call2 = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
            // Retail's group with its July, Tomas (people.employee) assigned with a salary, made as data; a run approved by the payroll
            // approver makes his preview slip. Services' slip as data (Kenji's): only its employer matters here
            system(() => {
                const g = "PPL_SPEC_PAL_SG"
                call("create#mantle.humanres.payroll.PayrollGroup", {
                    payrollGroupId: g,
                    organizationPartyId: ids.organizationId,
                    groupName: g,
                    currencyUomId: "USD",
                    timePeriodTypeId: "PayrollMonth",
                    firstPeriodFromDate: "2026-07-01",
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
                    .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: "2026-07-01"})
                    .one()
                const timePeriodId = existing
                    ? existing.timePeriodId
                    : call("mantle.party.TimeServices.create#TimePeriod", {
                          partyId: ids.organizationId,
                          timePeriodTypeId: "PayrollMonth",
                          fromDate: "2026-07-01",
                          thruDate: "2026-07-31"
                      }).timePeriodId
                call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                    payrollGroupId: g,
                    timePeriodId,
                    payDate: "2026-07-31"
                })
                call("create#mantle.humanres.payroll.PayrollComponent", {
                    payrollComponentId: g + "_C",
                    organizationPartyId: ids.organizationId,
                    componentCode: g + "_SAL",
                    componentName: "Access spec salary",
                    componentKindEnumId: "PckEarning"
                })
                call("create#mantle.humanres.payroll.PayrollComponentTerm", {
                    payrollComponentId: g + "_C",
                    statusId: "PtsPublished",
                    fromDate: 0,
                    basisEnumId: "PcbFormula",
                    formula: "round(annualSalary / periodsPerYear, 2)",
                    inputNames: "annualSalary,periodsPerYear",
                    currencyUomId: "USD"
                })
                call("create#mantle.humanres.payroll.PayrollStructure", {
                    payrollStructureId: g + "_S",
                    organizationPartyId: ids.organizationId,
                    structureName: g,
                    currencyUomId: "USD",
                    payBasisEnumId: "PpbSalaried",
                    statusId: "PtsPublished",
                    fromDate: 0
                })
                call("create#mantle.humanres.payroll.PayrollStructureComponent", {
                    payrollStructureId: g + "_S",
                    payrollComponentId: g + "_C",
                    statusId: "PtsPublished",
                    fromDate: 0,
                    sequenceNum: 1
                })
                call("create#mantle.humanres.payroll.PayrollAssignment", {
                    partyRelationshipId: ids.employmentId,
                    partyId: ids.employeePartyId,
                    organizationPartyId: ids.organizationId,
                    payrollStructureId: g + "_S",
                    payrollGroupId: g,
                    isPrimary: "Y",
                    fromDate: "2026-07-01 00:00:00",
                    thruDate: "2026-08-01 00:00:00"
                })
                call("create#mantle.humanres.employment.EmploymentSalary", {
                    partyRelationshipId: ids.employmentId,
                    fromDate: "2026-07-01 00:00:00",
                    thruDate: "2026-08-01 00:00:00",
                    amount: "36000",
                    currencyUomId: "USD",
                    timePeriodTypeId: "PayrollYear"
                })
                call("create#mantle.humanres.payroll.Payslip", {
                    payslipId: "PPL_SPEC_PAL_SLIP_SVC",
                    organizationPartyId: ids.otherOrganizationId,
                    partyRelationshipId: ids.otherEmploymentId,
                    partyId: ids.otherEmployeePartyId,
                    payDate: "2026-07-31",
                    currencyUomId: "USD",
                    runKindEnumId: "PrkRegular",
                    statusId: "PssPreview",
                    isPreview: "Y"
                })
                state26.group = {payrollGroupId: g, timePeriodId}
            })
            const runId = call2(users.payroll, R + "create#Run", state26.group).payrollRunId
            call2(users.payroll, R + "calculate#Run", {payrollRunId: runId})
            call2(users.payroll, R + "submit#Run", {payrollRunId: runId})
            call2(users.payApprover, R + "approve#Run", {payrollRunId: runId})
            const payslipId = system(() =>
                ec.entity
                    .find("mantle.humanres.payroll.Payslip")
                    .condition({payrollRunId: runId, partyRelationshipId: ids.employmentId})
                    .one()
            )?.payslipId
            const correction = {payslipId, reason: "Access spec"}
            // the HR officer first, with the parameters the payroll operator then corrects the slip with
            const codes = {
                hrCorrects: as(users.hr, R + "create#Correction", correction),
                payrollCorrects: as(users.payroll, R + "create#Correction", correction),
                approverReads: as(users.payApprover, P + "get#Payslip", {payslipId}),
                hrReads: as(users.hr, P + "get#Payslip", {payslipId}),
                payrollServices: as(users.payroll, P + "get#Payslip", {payslipId: "PPL_SPEC_PAL_SLIP_SVC"}),
                employeeOwnPreview: as(users.employee, P + "get#MyPayslip", {payslipId})
            }
            const listed = asUser(users.employee, () => system(() => invoke(P + "find#Payslips", {partyId: ids.reportPartyId})))
            const problems = []
            if (
                Array.from(listed.payslips || []).some(
                    row => (!row.historical && row.statusId !== "PssIssued") || row.partyId !== ids.employeePartyId
                )
            )
                problems.push("the employee's find#Payslips answers another's or a slip not issued")
            for (const path of ["Payroll/Payslips", "Payroll/PayslipDetail"]) {
                const refusedScreen = screenRefusal(users.hr, path, {payslipId})
                if (!unauthorized(refusedScreen)) problems.push(`${users.hr} opens ${path}: ${refusedScreen || "opened"}`)
            }
            const opened = screenRefusal(users.employee, "MyPayslip", {})
            if (opened) problems.push(`the employee's MyPayslip: ${opened}`)
            const otherApp = screenRefusal(users.otherApp, "MyPayslip", {})
            if (!unauthorized(otherApp)) problems.push(`${users.otherApp} opens MyPayslip: ${otherApp || "opened"}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    hrCorrects: "PERMISSION_DENIED",
                    payrollCorrects: "accepted",
                    approverReads: "accepted",
                    hrReads: "RECORD_UNAVAILABLE",
                    payrollServices: "RECORD_UNAVAILABLE",
                    employeeOwnPreview: "RECORD_UNAVAILABLE"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P29: the payroll register is payroll's, Reports a report reader's; the case intake the People administrator's, the clocking default HR's",
    {
        when() {
            const R = "mantle.humanres.PeopleReportServices.run#Report"
            const S = "mantle.humanres.PeopleServices.store#Settings"
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            const register = {reportId: "payrollRegister", fromDate: "2026-01-01", thruDate: "2026-12-31"}
            // the demo's own values, so nothing changes: Retail's intake handler and no clocking by default; the intake names the
            // settings revision it read (the P29 review)
            const revision = asUser(users.admin, () =>
                system(() => invoke("mantle.humanres.PeopleServices.get#Settings", {organizationPartyId: ids.organizationId}))
            ).employers?.[0]?.revision
            const intake = {
                organizationPartyId: ids.organizationId,
                intakeHandlerIds: ids.caseHandlerPartyId,
                expectedRevision: revision
            }
            const clocking = {organizationPartyId: ids.organizationId, clocking: "N"}
            const codes = {
                hrRegister: as(users.hr, R, register),
                payrollRegister: as(users.payroll, R, register),
                hrServicesHeadcount: as(users.hr, R, {reportId: "headcount", organizationPartyId: ids.otherOrganizationId}),
                hrIntake: as(users.hr, S, intake),
                adminIntake: as(users.admin, S, intake),
                readerClocking: as(users.reader, S, clocking),
                hrClocking: as(users.hr, S, clocking),
                hrServicesClocking: as(users.hr, S, {organizationPartyId: ids.otherOrganizationId, clocking: "N"})
            }
            const problems = []
            for (const user of [users.hr, users.payroll]) {
                const opened = screenRefusal(user, "Reports", {reportId: "headcount"})
                if (opened) problems.push(`${user}'s Reports: ${opened}`)
            }
            for (const [user, path] of [
                [users.reader, "Reports"],
                [users.manager, "Reports"],
                [users.hr, "Settings/Preferences"]
            ]) {
                const refusedScreen = screenRefusal(user, path, {})
                if (!unauthorized(refusedScreen)) problems.push(`${user} opens ${path}: ${refusedScreen || "opened"}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    hrRegister: "PERMISSION_DENIED",
                    payrollRegister: "accepted",
                    hrServicesHeadcount: "ORGANIZATION_DENIED",
                    hrIntake: "PERMISSION_DENIED",
                    adminIntake: "accepted",
                    readerClocking: "PERMISSION_DENIED",
                    hrClocking: "accepted",
                    hrServicesClocking: "ORGANIZATION_DENIED"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P27: finalizing a pay run is payroll's: the HR officer refused with the parameters the payroll operator is answered with, Services' run missing to Retail's payroll; the settlement and an obligation's invoice payroll's",
    {
        when() {
            const R = "mantle.humanres.PayrollRunServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            // P26's approved run of Retail's spec group (its regular run); Services' run, a payroll obligation of it and its invoice,
            // as data: only their employer matters here
            const runId = system(
                () =>
                    ec.entity
                        .find("mantle.humanres.payroll.PayrollRun")
                        .condition({payrollGroupId: state26.group.payrollGroupId, runKindEnumId: "PrkRegular"})
                        .one()?.payrollRunId
            )
            system(() => {
                call("create#mantle.humanres.payroll.PayrollRun", {
                    payrollRunId: "PPL_SPEC_PAL_RUN_SVC",
                    organizationPartyId: ids.otherOrganizationId,
                    currencyUomId: "USD",
                    runKindEnumId: "PrkRegular",
                    statusId: "PrnApproved"
                })
                call("create#mantle.account.invoice.Invoice", {
                    invoiceId: "PPL_SPEC_PAL_INV_SVC",
                    invoiceTypeEnumId: "InvoicePayroll",
                    fromPartyId: ids.otherEmployeePartyId,
                    toPartyId: ids.otherOrganizationId,
                    statusId: "InvoiceIncoming",
                    currencyUomId: "USD"
                })
                call("create#mantle.humanres.payroll.PayrollObligation", {
                    obligationKey: "NET:PPL_SPEC_PAL_SVC",
                    obligationKindEnumId: "PokNetPay",
                    payrollRunId: "PPL_SPEC_PAL_RUN_SVC",
                    organizationPartyId: ids.otherOrganizationId,
                    partyId: ids.otherEmployeePartyId,
                    payeePartyId: ids.otherEmployeePartyId,
                    currencyUomId: "USD",
                    invoiceId: "PPL_SPEC_PAL_INV_SVC",
                    amount: "100"
                })
            })
            const finalize = {payrollRunId: runId}
            return {
                codes: {
                    hrFinalizes: as(users.hr, R + "finalize#Run", finalize),
                    payrollFinalizes: as(users.payroll, R + "finalize#Run", finalize),
                    payrollServices: as(users.payroll, R + "finalize#Run", {payrollRunId: "PPL_SPEC_PAL_RUN_SVC"}),
                    approverSettlement: as(users.payApprover, R + "get#Settlement", finalize),
                    hrSettlement: as(users.hr, R + "get#Settlement", finalize),
                    hrObligation: as(users.hr, R + "get#Obligation", {invoiceId: "PPL_SPEC_PAL_INV_SVC"}),
                    payrollObligationServices: as(users.payroll, R + "get#Obligation", {invoiceId: "PPL_SPEC_PAL_INV_SVC"}),
                    hrRecovery: as(users.hr, "mantle.humanres.PayrollSetupServices.get#RecoverySettings", {})
                },
                // P27 review: the recovery settings' screen beside Pay groups, payroll's (people.payroll configures)
                payrollRecoveryScreen: screenRefusal(users.payroll, "Payroll/PayRecovery", {}),
                hrRecoveryScreen: screenRefusal(users.hr, "Payroll/PayRecovery", {})
            }
        },
        then({codes, payrollRecoveryScreen, hrRecoveryScreen}) {
            payrollRecoveryScreen == ""
            unauthorized(hrRecoveryScreen)
            codes ==
                {
                    hrFinalizes: "PERMISSION_DENIED",
                    // past the permission, to the group's own refusal (the demonstration localization is never live)
                    payrollFinalizes: "NOT_LIVE",
                    payrollServices: "RECORD_UNAVAILABLE",
                    approverSettlement: "accepted",
                    hrSettlement: "PERMISSION_DENIED",
                    hrObligation: "PERMISSION_DENIED",
                    payrollObligationServices: "RECORD_UNAVAILABLE",
                    hrRecovery: "PERMISSION_DENIED"
                }
        }
    }
)

feature(
    "P28: a payroll import is payroll's with People's import permission: the HR officer refused with the parameters the payroll operator is answered with; Services' exchange missing to Retail's payroll; PayrollExchange payroll's and listed in Admin's Imports",
    {
        when() {
            const X = "mantle.humanres.PayrollExchangeServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            // a history file of Retail's with one worker no one is: the import permission is the rule, the row its own refusal
            const history = {
                exchangeKind: "history",
                organizationPartyId: ids.organizationId,
                cutoverDate: "2026-01-01",
                currencyUomId: "USD",
                sourceSystem: "Former payroll",
                fileName: "history-2025.csv",
                importText: "worker,payDate,gross,net\nPPL_SPEC_NO_SUCH_WORKER,2025-12-31,1000,800"
            }
            const codes = {
                hrImports: as(users.hr, X + "preview#Batch", history),
                payrollImports: as(users.payroll, X + "preview#Batch", history)
            }
            const batch = system(() =>
                ec.entity
                    .find("mantle.humanres.payroll.PayrollExchangeBatch")
                    .condition({organizationPartyId: ids.organizationId, exchangeKindEnumId: "PxkHistory"})
                    .one()
            )
            // Services' exchange, as data: only its employer matters here
            system(() =>
                call("create#mantle.humanres.payroll.PayrollExchangeBatch", {
                    payrollExchangeBatchId: "PPL_SPEC_PAL_XCHG_SVC",
                    exchangeKindEnumId: "PxkHistory",
                    organizationPartyId: ids.otherOrganizationId,
                    batchKey: "PPL_SPEC_PAL_XCHG_SVC",
                    statusId: "PxbPreviewed"
                })
            )
            Object.assign(codes, {
                approverReads: as(users.payApprover, X + "get#Batch", {payrollExchangeBatchId: batch?.payrollExchangeBatchId}),
                hrReads: as(users.hr, X + "get#Batch", {payrollExchangeBatchId: batch?.payrollExchangeBatchId}),
                payrollServices: as(users.payroll, X + "get#Batch", {payrollExchangeBatchId: "PPL_SPEC_PAL_XCHG_SVC"})
            })
            // the one render of PayrollExchange (html), the batch opened with its problem rows
            const rendered = asUser(users.payroll, () =>
                page(
                    "Payroll/PayrollExchange",
                    {payrollExchangeBatchId: batch?.payrollExchangeBatchId, outcome: "problems"},
                    "html"
                )
            )
            const listed = system(() => invoke("org.moqui.admin.DataTransferServices.find#ImportRuns", {}))
            return {
                codes,
                rendered,
                hrScreen: screenRefusal(users.hr, "Payroll/PayrollExchange", {}),
                run: Array.from(listed.transferList || []).find(found => found.runId === batch?.payrollExchangeBatchId) || null
            }
        },
        then({codes, rendered, hrScreen, run}) {
            codes ==
                {
                    hrImports: "PERMISSION_DENIED",
                    payrollImports: "accepted",
                    approverReads: "accepted",
                    hrReads: "PERMISSION_DENIED",
                    payrollServices: "RECORD_UNAVAILABLE"
                }
            rendered.status == 200 && rendered.errors.length == 0
            rendered.output.includes("Import of payroll history") && rendered.output.includes("history-2025.csv")
            rendered.output.includes("No person is PPL_SPEC_NO_SUCH_WORKER")
            unauthorized(hrScreen)
            run.targetId == "payrollExchange" && run.ownerApp == "People" && run.ownerRoute == "peoplePayrollExchange"
            run.errorCount == 1 && run.ownerParameters.payrollExchangeBatchId == run.runId
        }
    }
)

feature(
    "P31: PAYROLL_VIEW alone reads no People employee: payroll finance is refused Tomas's record, the directory and his compensation, with the parameters the payroll operator is answered with",
    {
        when() {
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            const finance = "people.spec.financepayroll"
            const reads = user => ({
                employee: as(user, "mantle.humanres.PeopleServices.get#Employee360", {partyId: ids.employeePartyId}),
                compensation: as(user, "mantle.humanres.PayrollSetupServices.get#Compensation", {partyId: ids.employeePartyId}),
                directory: asUser(user, () =>
                    system(() => {
                        ec.message.pushErrors()
                        try {
                            const found = ec.service
                                .sync()
                                .name("mantle.humanres.PeopleServices.find#Employees")
                                .parameters({organizationPartyId: ids.organizationId})
                                .call()
                            return ec.message.hasError()
                                ? code(ec.message.getErrorsString())
                                : Array.from(found?.employees || []).length
                        } finally {
                            ec.message.clearErrors()
                            ec.message.popErrors()
                        }
                    })
                )
            })
            return {finance: reads(finance), payroll: reads(users.payroll)}
        },
        then({finance, payroll}) {
            finance.employee == "RECORD_UNAVAILABLE" && finance.compensation == "RECORD_UNAVAILABLE"
            finance.directory == "ORGANIZATION_DENIED"
            payroll.employee == "accepted" && payroll.compensation == "accepted" && payroll.directory > 0
        }
    }
)
