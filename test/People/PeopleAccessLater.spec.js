// People access, P11 on (impl-people §2; design-people §1.1, §1.2): the access rules of leave policies, attendance, the shift
// roster, expenses, recruiting, skills and qualifications, offers and letters, training, confidential cases and reviews, one
// feature per phase's rule, each case of it a line of its problems, with artifact authorization enabled. P1 to P10's features
// (foundation, employees, organization, positions, approvals, hire, lifecycle, self-service, schedules, time) are PeopleAccess's,
// which also holds every phase's context links, menu groups and capabilities; both share PeopleSpecLib. A later phase adds a
// case here only for an access rule it adds.
// P11: Leave policies and Allocations HR's, Leave balances HR's and the managers' (the manager refused Leave policies, the
// self-service employee refused all three); a leave policy changed by an HR editor of the employer (the directory reader refused
// with the same parameters and the screen, Services' policy refused to Retail's HR), LeavePolicyDetail's one html render (the HR
// officer's), the employee's own balances through get#MyBalances alone (get#Balances not theirs), and the two leave choices.
// P13: the employee's clock on SelfService under Commons by its own grant (BOSS_PPL_CLOCK_SELF; the reader refused the punch with
// the same parameters), Time import HR's (the reader, the manager and the employee refused the screen; the reader refused the import
// with the parameters HR is answered, Services' employer refused to Retail's HR).
// P14: the Shift roster HR's and the managers' (the reader and the employee refused the screen), a shift of Tomas rostered by his
// manager (the reader refused with the same parameters, Services' employee refused to Retail's HR), and the employee's own shifts
// through get#MyShifts by its own grant (BOSS_PPL_SHIFTS_SELF); PEOPLE_ROSTER_EDIT (the user's call of Nov 12, 2026): the manager
// without it (a spec-local account of Hannah's) reads the roster but saves and publishes nothing, with the parameters she is
// accepted with.
// P15: Expense claims opened to the self-service employee by the expenses area's own grant (another app's user refused); a claim read
// by its claimant and manager and refused to the reader with the same parameters; HR claims for Retail's employee and is refused
// Services'; Payroll's InvoiceDetail (an expense claim's invoice) refused to HR. PEOPLE_EXPENSE_MANAGE (the user's call of Nov 12,
// 2026): HR reads the claim and claims for the employee with it; a spec-local HR account without it, and the payroll operator, are
// refused the same claim with the same parameters.
// P16: an opening's applications a recruiter's of its employer (the HR officer refused with the same parameters, Services' opening
// refused to Retail's recruiter), an application read by an interviewer of its panel alone (the HR officer refused it), and People's
// Forms the People administrator's (the HR officer refused the screen). P16 review (the user's call of Nov 12, 2026): the
// self-service employee on an interview's panel reads it through get#MyInterview and the reader is refused it with the same
// parameters; the panel member reads no application record host (its notes and files are the recruiters').
// P18: Skills & training's matrix development's, HR's and the managers' (the reader and the employee refused the screen), its
// Qualifications the employee's by the area's own grant; a verified qualification revoked by the development administrator of its
// employer (the reader refused with the same parameters, Services' qualification refused to Retail's development administrator), and
// the Development group (the reader's without the matrix). P18 review (the user's call of Nov 12, 2026): the manager evaluates her
// report's skill without PEOPLE_DEVELOP_EDIT, the reader is refused the same evaluation and the manager Services' employee.
// P17: an offer read by a recruiter of its employer (the directory reader refused it with the same parameters, Services' offer refused
// to Retail's recruiter), its pay set by payroll and refused to the HR officer with the same parameters, and an employment change's
// letter print HR's (the directory reader refused the screen). P17 review (the user's call of Nov 12, 2026): the employee reads
// their own issued letter through SelfService's My letters (the services and the transition by its own grant) and is refused Ines's;
// the reader (no self-service) is refused the employee's letter with the same parameters.
// P19: a training session scheduled by the development administrator of its employer (the HR officer refused with the same
// parameters), an assessment its trainer's (the reader refused the same assessment), Services' session refused to Retail's
// development administrator, the employee's Training by the area's own grant, and Training in the Development group. P19 review:
// the assessment forms the development administrator's (the HR officer and the employee refused the screen), the employee's
// self-service link to their training.
// P21: a confidential case read by its handler and its employee, and refused to the manager, the HR officer, the People
// administrator and the instance administrator with the same parameters; no Commons list, access check or id lookup holds it;
// RequestDetail's one qvt render as the handler (the case inside its AI opt-out) and the employee's html render by their own
// grant; Grievances opened to the self-service employee by its own grant and refused another app's user, and the Employees group
// with Grievances; the People root (qvt) and Employees (tui) levels the employee's frame of Grievances, refused alone.
// P20: a review cycle set up by a development editor of the employer (the HR officer refused with the same parameters, Services
// refused to Retail's review administrator); Review cycles the review administrator's (the HR officer and the employee refused the
// screen), Reviews the employee's by the area's own grant and their self-service link to it (the Performance group per user is
// PeopleAccess's menu feature).
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
// P30: a clocking badge issued by an HR officer of the employer (the directory reader refused with the same parameters, Services'
// employment refused to Retail's HR), its print HR's (the reader refused the screen and the print's POST, follow-up 4); its PIN
// set by the employee alone (HR refused with the same parameters) and reset by HR (the reader and the employee refused); a kiosk
// punch refused outside a registered device to the instance administrator, who holds PEOPLE_KIOSK_PUNCH, and to the employee,
// with the same parameters (the device's own punch is PeopleKiosk's); the kiosk bundle assigned by the access administrator and proposed by the identity operator under Admin's
// delegation rule, and refused to the reader.
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
// Run: ./moq test mr-boss --spec PeopleAccessLater
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, hit} = lib
const choices = "ironstone.people.ContextServices.get#Choices"
// a refusal of a user without People: the service is not authorized for them, or it refuses them
const refused = message => /PEOPLE_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// P14: a spec-local account whose group holds the manager's view permissions without PEOPLE_ROSTER_EDIT; it is Hannah's (the demo
// manager's) only while the roster feature runs, so no other feature meets a second account of hers
const teamOnly = "PPL_SPEC_TEAM_ONLY"
// P15: a spec-local HR officer of Retail (PEOPLE_HR_VIEW and PEOPLE_HR_EDIT) without PEOPLE_EXPENSE_MANAGE
const hrOnly = "PPL_SPEC_HR_ONLY"
// P26: the payslip case's group, made in its feature
const state26 = {}
// P31: a spec-local payroll finance user of Accounting (BOSS_ACCOUNTING_PAYROLL: PAYROLL_VIEW with the finance permissions), an agent
// of Retail, so the rule is met at an employer that has employees (finance.payroll is Accounting's organization's agent)
const financePayroll = "PPL_SPEC_FIN_PAYROLL"

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#moqui.security.UserGroup", {
                userGroupId: teamOnly,
                description: "People spec: a manager who does not roster"
            })
            for (const userPermissionId of ["PEOPLE_TEAM_VIEW", "PEOPLE_SELF_SERVICE"])
                call("create#moqui.security.UserGroupPermission", {userGroupId: teamOnly, userPermissionId, fromDate: 0})
            call("create#moqui.security.UserAccount", {
                userId: teamOnly,
                username: "people.spec.teamonly",
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA",
                timeZone: "America/Chicago"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_PEOPLE", teamOnly])
                call("create#moqui.security.UserGroupMember", {userId: teamOnly, userGroupId, fromDate: 0})
            call("create#moqui.security.UserGroup", {userGroupId: hrOnly, description: "People spec: HR without expenses"})
            for (const userPermissionId of ["PEOPLE_HR_VIEW", "PEOPLE_HR_EDIT"])
                call("create#moqui.security.UserGroupPermission", {userGroupId: hrOnly, userPermissionId, fromDate: 0})
            call("create#mantle.party.Party", {partyId: hrOnly, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: hrOnly, firstName: "People spec", lastName: "HR only"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: hrOnly,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: hrOnly,
                username: "people.spec.hronly",
                partyId: hrOnly,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_PEOPLE", hrOnly])
                call("create#moqui.security.UserGroupMember", {userId: hrOnly, userGroupId, fromDate: 0})
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
                .condition("userId", "in", [teamOnly, hrOnly, financePayroll])
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "leave policies are HR's of the employer: Retail's annual leave changed by Retail's HR officer, the directory reader refused with the same parameters and the screen, Services' policy refused to Retail's HR; Leave balances HR's and the managers'; the employee's own balances alone",
    {
        when() {
            const L = "mantle.humanres.LeaveServices."
            const as = (user, service, parameters) => asUser(user, () => system(() => refusal(L + service, parameters)))
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const revision = leavePolicyId => system(() => invoke(L + "get#Policy", {leavePolicyId})).policy.revision
            // a Services policy, for Retail's HR to be refused
            const other = system(() =>
                invoke(L + "store#Policy", {
                    organizationPartyId: ids.otherOrganizationId,
                    policyName: "Services access spec leave",
                    leaveTypeEnumId: "PltAnnual"
                })
            ).leavePolicyId
            const same = {
                leavePolicyId: ids.leavePolicyId,
                expectedRevision: revision(ids.leavePolicyId),
                policyName: "Annual leave"
            }
            const codes = {
                reader: code(as(users.reader, "store#Policy", same)),
                hr: code(as(users.hr, "store#Policy", same)),
                hrOther: code(
                    as(users.hr, "store#Policy", {
                        leavePolicyId: other,
                        expectedRevision: revision(other),
                        policyName: "Not mine"
                    })
                ),
                // the employee's own balances through get#MyBalances (its own grant); get#Balances is not theirs to call
                employeeOwn: code(asUser(users.employee, () => refusal(L + "get#MyBalances", {}))),
                employeeStaff: /RECORD_UNAVAILABLE|is not authorized/.test(
                    asUser(users.employee, () => refusal(L + "get#Balances", {partyRelationshipId: ids.otherEmploymentId}))
                )
            }
            const problems = []
            // the HR officer's one html render of LeavePolicyDetail: the demo policy's steps and the primary
            const detail = asUser(users.hr, () => page("Time/LeavePolicyDetail", {leavePolicyId: ids.leavePolicyId}, "html"))
            if (
                detail.status != 200 ||
                detail.errors.length ||
                !detail.output.includes("Accrual and carry-over") ||
                !detail.output.includes("1.75 days a month") ||
                !detail.output.includes("Assign")
            )
                problems.push(`the HR officer's LeavePolicyDetail: ${detail.status} ${detail.errors}`)
            for (const user of [users.reader, users.manager, users.employee]) {
                const refused = screenRefusal(user, "Time/LeavePolicies")
                if (!unauthorized(refused)) problems.push(`${user} opens LeavePolicies: ${refused || "opened"}`)
            }
            // the self-service employee opens Time & leave by its own grant (P10): HR's allocations and Leave balances stay refused
            // to them (their own balances are SelfService's)
            for (const path of ["Time/LeaveAllocations", "Time/LeaveBalances"]) {
                const refused = screenRefusal(users.employee, path)
                if (!unauthorized(refused)) problems.push(`the employee opens ${path}: ${refused || "opened"}`)
            }
            const balances = screenRefusal(users.manager, "Time/LeaveBalances")
            if (balances) problems.push(`the manager's LeaveBalances: ${balances}`)
            // the two leave choices, each with a selected value off the page
            const options = (choice, selected) =>
                asUser(users.hr, () => invoke(choices, {choice, term: "zzz", selected})).options.map(option => option.value)
            if (!options("leavePolicies", ids.leavePolicyId).includes(ids.leavePolicyId))
                problems.push("leavePolicies: no selected")
            if (!options("leaveTypes", "PltUnpaid").includes("PltUnpaid")) problems.push("leaveTypes: no selected")
            if (asUser(users.hr, () => invoke(choices, {choice: "leavePolicies"})).options.some(option => option.value === other))
                problems.push("the HR officer is offered Services' policy")
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    reader: "PERMISSION_DENIED",
                    hr: "accepted",
                    hrOther: "RECORD_UNAVAILABLE",
                    employeeOwn: "accepted",
                    employeeStaff: true
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "attendance: the employee clocks on SelfService under Commons by its own grant, the reader refused the punch with the same parameters; Time import HR's: the reader refused the import with the parameters HR is answered and the screen, Services' employer refused to Retail's HR",
    {
        when() {
            const A = "mantle.humanres.AttendanceServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            const punches = () =>
                system(() =>
                    ec.entity
                        .find("mantle.humanres.attendance.AttendancePunch")
                        .condition({partyRelationshipId: ids.employmentId, sourceEnumId: "AtsSelf"})
                        .count()
                )
            // the employee's clock transition under Commons (BOSS_PPL_CLOCK_SELF), in and out again
            const clock = () =>
                asUser(users.employee, () => {
                    const result = ec.screen
                        .makeTest()
                        .rootScreen("component://mr-boss/screen/Commons.xml")
                        .render("People/SelfService/clock", {}, "post")
                    const errors = Array.from(result.errorMessages || []).join(" | ")
                    ec.message.clearAll()
                    return errors
                })
            const before = punches()
            for (const pass of ["in", "out"]) {
                const errors = clock()
                if (errors) problems.push(`the employee's clock ${pass}: ${errors}`)
            }
            if (punches() !== before + 2) problems.push(`the employee's punches: ${before} then ${punches()}`)
            const file = {
                organizationPartyId: ids.organizationId,
                importText: "worker,time,direction\n" + ids.employeePartyId + ",2026-09-07 08:00,in\n",
                sourceSystem: "Access spec door",
                timeZone: "America/Chicago"
            }
            const codes = {
                readerPunch: code(asUser(users.reader, () => system(() => refusal(A + "record#Punch", {})))),
                hrImport: code(asUser(users.hr, () => system(() => refusal(A + "preview#Import", file)))),
                readerImport: code(asUser(users.reader, () => system(() => refusal(A + "preview#Import", file)))),
                hrOther: code(
                    asUser(users.hr, () =>
                        system(() =>
                            refusal(A + "preview#Import", Object.assign({}, file, {organizationPartyId: ids.otherOrganizationId}))
                        )
                    )
                )
            }
            const opened = screenRefusal(users.hr, "Time/TimeImport")
            if (opened) problems.push(`the HR officer's TimeImport: ${opened}`)
            for (const user of [users.reader, users.manager, users.employee]) {
                const refused = screenRefusal(user, "Time/TimeImport")
                if (!unauthorized(refused)) problems.push(`${user} opens TimeImport: ${refused || "opened"}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    readerPunch: "PERMISSION_DENIED",
                    hrImport: "accepted",
                    readerImport: "PERMISSION_DENIED",
                    hrOther: "ORGANIZATION_DENIED"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "the shift roster: HR's and the managers' screen; Tomas's shift rostered by his manager, the reader refused with the same parameters, Services' employee refused to Retail's HR; the employee's own shifts by their own grant; the manager without PEOPLE_ROSTER_EDIT reads the roster and saves and publishes nothing",
    {
        when() {
            const S = "mantle.humanres.ScheduleServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            const day = ec.l10n.format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd", null, "America/Chicago")
            const shift = {
                partyRelationshipId: ids.employmentId,
                startText: day + " 09:00",
                endText: day + " 17:00",
                timeZone: "America/Chicago"
            }
            const codes = {
                manager: code(asUser(users.manager, () => system(() => refusal(S + "store#Shift", shift)))),
                reader: code(asUser(users.reader, () => system(() => refusal(S + "store#Shift", shift)))),
                hrOther: code(
                    asUser(users.hr, () =>
                        system(() =>
                            refusal(S + "store#Shift", Object.assign({}, shift, {partyRelationshipId: ids.otherEmploymentId}))
                        )
                    )
                ),
                employeeShifts: code(asUser(users.employee, () => refusal(S + "get#MyShifts", {})))
            }
            // PEOPLE_ROSTER_EDIT: Hannah reads her roster and rosters Tomas, and publishes the week; her account without it reads the
            // same roster, every lane read only, and is refused the same shift and the same publish
            const week = {fromDay: day, days: 7}
            const rosterOf = roster => (roster?.lanes || []).filter(lane => lane.partyRelationshipId == ids.employmentId)
            const holder = asUser(users.manager, () =>
                system(() => ({
                    lanes: rosterOf(invoke(S + "get#Roster", week).roster),
                    publish: code(refusal(S + "publish#Shifts", week))
                }))
            )
            let nonHolder = null
            try {
                system(() => call("update#moqui.security.UserAccount", {userId: teamOnly, partyId: ids.managerPartyId}))
                nonHolder = asUser("people.spec.teamonly", () =>
                    system(() => {
                        const roster = invoke(S + "get#Roster", week).roster
                        return {
                            lanes: rosterOf(roster),
                            canRoster: !!roster?.canRoster,
                            save: code(refusal(S + "store#Shift", shift)),
                            publish: code(refusal(S + "publish#Shifts", week))
                        }
                    })
                )
            } finally {
                system(() =>
                    ec.entity.find("moqui.security.UserAccount").condition("userId", teamOnly).updateAll({partyId: null})
                )
            }
            codes.holder = holder.lanes.length + " " + holder.lanes.every(lane => lane.canRoster) + " " + holder.publish
            codes.nonHolder = [
                nonHolder.lanes.length,
                nonHolder.lanes.some(lane => lane.canRoster),
                nonHolder.canRoster,
                nonHolder.save,
                nonHolder.publish
            ].join(" ")
            for (const user of [users.manager, users.hr]) {
                const opened = screenRefusal(user, "Time/ShiftRoster")
                if (opened) problems.push(`${user}'s ShiftRoster: ${opened}`)
            }
            for (const user of [users.reader, users.employee]) {
                const refused = screenRefusal(user, "Time/ShiftRoster")
                if (!unauthorized(refused)) problems.push(`${user} opens ShiftRoster: ${refused || "opened"}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    manager: "accepted",
                    reader: "PERMISSION_DENIED",
                    hrOther: "RECORD_UNAVAILABLE",
                    employeeShifts: "accepted",
                    holder: "1 true accepted",
                    nonHolder: "1 false false PERMISSION_DENIED PERMISSION_DENIED"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "expenses: the employee opens Expense claims by the area's own grant, another app's user does not; a claim read by its claimant and manager and refused to the reader with the same parameters; HR claims for Retail's employee, not Services'; Payroll's InvoiceDetail refused to HR",
    {
        when() {
            const E = "mantle.humanres.ExpenseServices."
            const NEW_CLAIM = "mantle.account.InvoiceServices.create#ProjectExpenseInvoice"
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            const claim = asUser(users.employee, () =>
                system(() => invoke(NEW_CLAIM, {expenseClaim: true, fromPartyId: ids.employeePartyId, purpose: "Access spec"}))
            ).invoiceId
            const read = user => code(asUser(user, () => system(() => refusal(E + "get#Claim", {invoiceId: claim}))))
            const forEmployee = partyId =>
                code(asUser(users.hr, () => system(() => refusal(NEW_CLAIM, {expenseClaim: true, fromPartyId: partyId}))))
            // PEOPLE_EXPENSE_MANAGE: HR reads the claim and claims for Tomas; HR without it and the payroll operator do not
            const claimFor = user =>
                code(asUser(user, () => system(() => refusal(NEW_CLAIM, {expenseClaim: true, fromPartyId: ids.employeePartyId}))))
            const codes = {
                employeeRead: read(users.employee),
                managerRead: read(users.manager),
                readerRead: read(users.reader),
                hrRead: read(users.hr),
                hrOnlyRead: read("people.spec.hronly"),
                payrollRead: read(users.payroll),
                hrRetail: forEmployee(ids.employeePartyId),
                hrOnlyRetail: claimFor("people.spec.hronly"),
                hrServices: forEmployee(ids.otherEmployeePartyId)
            }
            const opened = screenRefusal(users.employee, "Expenses/ExpenseClaims", {show: "mine"})
            if (opened) problems.push(`the employee's Expense claims: ${opened}`)
            const otherApp = screenRefusal(users.otherApp, "Expenses/ExpenseClaims")
            if (!unauthorized(otherApp)) problems.push(`another app's user opens Expense claims: ${otherApp || "opened"}`)
            const invoice = screenRefusal(users.hr, "Payroll/InvoiceDetail", {invoiceId: claim})
            if (!unauthorized(invoice)) problems.push(`the HR officer opens Payroll's InvoiceDetail: ${invoice || "opened"}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    employeeRead: "accepted",
                    managerRead: "accepted",
                    readerRead: "RECORD_UNAVAILABLE",
                    hrRead: "accepted",
                    hrOnlyRead: "RECORD_UNAVAILABLE",
                    payrollRead: "RECORD_UNAVAILABLE",
                    hrRetail: "accepted",
                    hrOnlyRetail: "PERMISSION_DENIED",
                    hrServices: "PERMISSION_DENIED"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P16: an opening's applications are its recruiter's; an application is read by its interviewers; Forms the administrator's",
    {
        when() {
            const R = "mantle.humanres.RecruitingServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            // Retail's opening (the recruiter's) and Services' (the system administrator's), each with an application
            const retail = asUser(users.recruiter, () =>
                system(() => {
                    const opening = invoke(R + "store#Opening", {
                        organizationPartyId: ids.organizationId,
                        title: "Access spec opening",
                        emplPositionIds: ids.openingSeatId,
                        action: "open"
                    })
                    const made = invoke(R + "create#Application", {
                        jobOpeningId: opening.jobOpeningId,
                        firstName: "Access",
                        lastName: "Applicant"
                    })
                    return {jobOpeningId: opening.jobOpeningId, employmentApplicationId: made.employmentApplicationId}
                })
            )
            const services = system(() => {
                const opening = invoke(R + "store#Opening", {
                    organizationPartyId: ids.otherOrganizationId,
                    title: "Access spec technician",
                    emplPositionIds: ids.otherOpeningSeatId,
                    action: "open"
                })
                return {jobOpeningId: opening.jobOpeningId}
            })
            const find = {jobOpeningId: retail.jobOpeningId}
            // P16 review: an interview of Retail's application with the self-service employee on its panel
            const day = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            const publishedScorecards = system(() =>
                ec.entity
                    .find("moqui.screen.form.DbForm")
                    .condition({purposeEnumId: "DbfpInterviewScorecard", ownerPartyId: ids.organizationId})
                    .list()
            ).map(row => row.formId)
            const scorecardId = asUser(users.admin, () =>
                system(() => {
                    // the employer's scorecard: a spec form published for it when it has none
                    let formId = publishedScorecards[0]
                    if (!formId) {
                        const D = "mantle.party.FormDefinitionServices."
                        formId = invoke(D + "create#Form", {
                            purposeEnumId: "DbfpInterviewScorecard",
                            organizationPartyId: ids.organizationId,
                            description: "Access spec scorecard"
                        }).formId
                        invoke(D + "save#FormField", {formId, title: "Overall", fieldTypeEnumId: "DBFFT_text-line"})
                        invoke(D + "publish#Form", {formId})
                    }
                    return formId
                })
            )
            const scheduled = asUser(users.recruiter, () =>
                system(() =>
                    invoke(R + "schedule#Interview", {
                        employmentApplicationId: retail.employmentApplicationId,
                        startDate: ec.l10n.parseTimestamp(day + " 11:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS"),
                        panelPartyIds: ids.employeePartyId,
                        formId: scorecardId,
                        location: "Access room"
                    })
                )
            )
            // Mantle's own checks, as the user (the services are reached through People's screens)
            const as = (user, service, parameters) => asUser(user, () => system(() => code(refusal(service, parameters))))
            const myInterview = {workEffortId: scheduled.workEffortId}
            const record = user =>
                asUser(user, () =>
                    system(() => invoke(R + "check#ApplicationAccess", {employmentApplicationId: retail.employmentApplicationId}))
                ).recordVisible
            const codes = {
                recruiter: as(users.recruiter, R + "find#Applications", find),
                hr: as(users.hr, R + "find#Applications", find),
                otherEmployer: as(users.recruiter, R + "find#Applications", {jobOpeningId: services.jobOpeningId}),
                hrApplication: as(users.hr, R + "get#Application", {employmentApplicationId: retail.employmentApplicationId}),
                panelInterview: as(users.employee, R + "get#MyInterview", myInterview),
                readerInterview: as(users.reader, R + "get#MyInterview", myInterview),
                panelRecord: String(record(users.employee)) + " " + String(record(users.recruiter))
            }
            const forms = screenRefusal(users.admin, "Settings/Forms")
            if (forms) problems.push(`the administrator's Forms: ${forms}`)
            const hrForms = screenRefusal(users.hr, "Settings/Forms")
            if (!unauthorized(hrForms)) problems.push(`the HR officer opens Forms: ${hrForms || "opened"}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    recruiter: "accepted",
                    hr: "PERMISSION_DENIED",
                    otherEmployer: "RECORD_UNAVAILABLE",
                    hrApplication: "RECORD_UNAVAILABLE",
                    panelInterview: "accepted",
                    readerInterview: "RECORD_UNAVAILABLE",
                    panelRecord: "false true"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "skills and qualifications: the matrix development's, HR's and the managers' screen; a verified qualification revoked by the development administrator of its employer, the reader refused with the same parameters, Services' refused to Retail's; the manager evaluates her report's skill, the reader refused; the employee's qualifications by the area's own grant",
    {
        when() {
            const D = "mantle.humanres.DevelopmentServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const problems = []
            // a spec-local first aid certificate of Ines (Retail), verified, so the reader reads it (its validity) and may not revoke it
            const partyQualificationId = system(
                () =>
                    call("create#mantle.humanres.ability.PartyQualification", {
                        partyId: ids.reportPartyId,
                        qualificationTypeEnumId: ids.firstAidTypeId,
                        title: "People access spec first aid",
                        thruDate: new Date(Date.now() + 400 * 86400000),
                        verificationStatusId: "QlVerVerified"
                    }).partyQualificationId
            )
            const revision = system(() =>
                String(
                    ec.user.timestampMillis(
                        ec.entity
                            .find("mantle.humanres.ability.PartyQualification")
                            .condition("partyQualificationId", partyQualificationId)
                            .one().lastUpdatedStamp
                    )
                )
            )
            const revoke = {partyQualificationId, decision: "revoke", reason: "Spec", expectedRevision: revision}
            // the user's call of Nov 12, 2026: the manager evaluates her report Tomas's customer service (at the level he holds)
            // without PEOPLE_DEVELOP_EDIT; the reader is refused the same evaluation, and the manager Services' Kenji
            const evaluate = partyId => ({partyId, skillTypeEnumId: ids.serviceSkillId, skillLevel: "3", evidence: "Access spec"})
            const codes = {
                reader: code(asUser(users.reader, () => system(() => refusal(D + "verify#Qualification", revoke)))),
                develop: code(asUser(users.develop, () => system(() => refusal(D + "verify#Qualification", revoke)))),
                otherEmployer: code(
                    asUser(users.develop, () =>
                        system(() => refusal(D + "find#Qualifications", {partyQualificationId: ids.otherQualificationId}))
                    )
                ),
                managerEvaluates: code(
                    asUser(users.manager, () => system(() => refusal(D + "store#Skill", evaluate(ids.employeePartyId))))
                ),
                readerEvaluates: code(
                    asUser(users.reader, () => system(() => refusal(D + "store#Skill", evaluate(ids.employeePartyId))))
                ),
                managerOther: code(
                    asUser(users.manager, () => system(() => refusal(D + "store#Skill", evaluate(ids.otherEmployeePartyId))))
                )
            }
            for (const user of [users.develop, users.hr, users.manager]) {
                const opened = screenRefusal(user, "Development/SkillsMatrix")
                if (opened) problems.push(`${user}'s SkillsMatrix: ${opened}`)
            }
            for (const user of [users.reader, users.employee]) {
                const refused = screenRefusal(user, "Development/SkillsMatrix")
                if (!unauthorized(refused)) problems.push(`${user} opens SkillsMatrix: ${refused || "opened"}`)
            }
            const own = screenRefusal(users.employee, "Development/Qualifications")
            if (own) problems.push(`the employee's Qualifications: ${own}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    reader: "PERMISSION_DENIED",
                    develop: "accepted",
                    otherEmployer: "RECORD_UNAVAILABLE",
                    managerEvaluates: "accepted",
                    readerEvaluates: "PERMISSION_DENIED",
                    managerOther: "RECORD_UNAVAILABLE"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "P17: an offer is read by its employer's recruiters, its pay set by payroll alone; an employment letter's print is HR's",
    {
        when() {
            const R = "mantle.humanres.RecruitingServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const day = days => ec.l10n.format(new Date(Date.now() + days * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
            // an interviewed application's draft offer of an employer: Retail's by its recruiter, Services' by the system administrator
            const draftOffer = (organizationPartyId, seatId, lastName) =>
                system(() => {
                    const opening = invoke(R + "store#Opening", {
                        organizationPartyId,
                        title: "Access spec offer opening",
                        emplPositionIds: seatId,
                        action: "open"
                    })
                    const made = invoke(R + "create#Application", {
                        jobOpeningId: opening.jobOpeningId,
                        firstName: "Access",
                        lastName
                    })
                    for (const statusId of ["EaScreening", "EaInterview"])
                        invoke("update#mantle.humanres.employment.EmploymentApplication", {
                            employmentApplicationId: made.employmentApplicationId,
                            statusId
                        })
                    return invoke(R + "store#Offer", {
                        employmentApplicationId: made.employmentApplicationId,
                        emplPositionId: seatId,
                        fromDate: day(45)
                    }).employmentOfferId
                })
            const retail = asUser(users.recruiter, () => draftOffer(ids.organizationId, ids.openingSeatId, "Offeree"))
            const services = draftOffer(ids.otherOrganizationId, ids.otherOpeningSeatId, "Elsewhere")
            const as = (user, service, parameters) => asUser(user, () => system(() => code(refusal(service, parameters))))
            const pay = {employmentOfferId: retail, payAmount: "38000", currencyUomId: "USD", timePeriodTypeId: "PayrollYear"}
            const codes = {
                recruiter: as(users.recruiter, R + "get#Offer", {employmentOfferId: retail}),
                reader: as(users.reader, R + "get#Offer", {employmentOfferId: retail}),
                otherEmployer: as(users.recruiter, R + "get#Offer", {employmentOfferId: services}),
                hrPay: as(users.hr, R + "store#Offer", pay),
                payrollPay: as(users.payroll, R + "store#Offer", pay)
            }
            const problems = []
            const hrLetter = screenRefusal(users.hr, "Employees/EmploymentLetter", {employmentChangeId: "_NA_"})
            if (hrLetter) problems.push(`the HR officer's employment letter: ${hrLetter}`)
            const readerLetter = screenRefusal(users.reader, "Employees/EmploymentLetter", {employmentChangeId: "_NA_"})
            if (!unauthorized(readerLetter)) problems.push(`the reader opens an employment letter: ${readerLetter || "opened"}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    recruiter: "accepted",
                    reader: "RECORD_UNAVAILABLE",
                    otherEmployer: "RECORD_UNAVAILABLE",
                    hrPay: "PERMISSION_DENIED",
                    payrollPay: "accepted"
                }
            problems.join("\n") == ""
        }
    }
)

feature("P17 review: an employee reads their own issued letters in self-service, no one else's", {
    when() {
        const P = "mantle.humanres.PeopleServices."
        const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
        // spec-local issued lifecycle letters of Tomas (the employee) and Ines, as Mantle stores them
        const letterOf = (partyId, key) =>
            system(() => {
                const location = "dbresource://mantle/content/peopleLetter/access-spec-" + key + ".html"
                ec.resource.getLocationReference(location).putText("<html><body>Access spec letter " + key + "</body></html>")
                return call("create#mantle.humanres.employment.EmploymentLetter", {
                    employmentChangeId: "PPL_ACCESS_SPEC_" + key,
                    changeKindEnumId: "EckTransfer",
                    partyId,
                    organizationPartyId: ids.organizationId,
                    title: "Transfer",
                    contentLocation: location,
                    contentType: "text/html",
                    fileName: "Transfer-" + key + ".html",
                    includesPay: "N",
                    issuedDate: ec.user.nowTimestamp
                }).employmentLetterId
            })
        const own = letterOf(ids.employeePartyId, "OWN")
        const other = letterOf(ids.reportPartyId, "OTHER")
        // as the user with artifact authorization on: the services by SelfService's own grant, then Mantle's checks
        const as = (user, service, parameters) =>
            asUser(user, () => {
                const message = refusal(service, parameters)
                return /is not authorized/.test(message) ? "UNAUTHORIZED" : code(message)
            })
        const listed = asUser(users.employee, () => invoke(P + "find#MyLetters").letters || [])
        const opened = asUser(users.employee, () => hit("apps/Commons/People/SelfService/myLetter", {employmentLetterId: own}))
        return {
            codes: {
                employee: as(users.employee, P + "get#MyLetter", {employmentLetterId: own}),
                reader: as(users.reader, P + "get#MyLetter", {employmentLetterId: own}),
                another: as(users.employee, P + "get#MyLetter", {employmentLetterId: other})
            },
            listed: listed.map(row => row.employmentLetterId).filter(id => id === own || id === other),
            opened: !opened.refused && opened.output.includes("Access spec letter OWN")
        }
    },
    then({codes, listed, opened}) {
        codes ==
            {
                employee: "accepted",
                reader: "UNAUTHORIZED",
                another: "RECORD_UNAVAILABLE"
            }
        listed.length == 1
        opened == true
    }
})

feature(
    "training: a session scheduled by the development administrator of its employer, the HR officer refused with the same parameters; an assessment the session's trainer's, the reader refused the same assessment; Services' session refused to Retail's development administrator; the employee's Training by the area's own grant and self-service link; the assessment forms the development administrator's",
    {
        when() {
            const D = "mantle.humanres.DevelopmentServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const hour = 60 * 60 * 1000
            const problems = []
            // a spec-local course of Retail with no assessment form, and one session of Services' (its own course, Kenji training)
            const trainingClassId = asUser(users.develop, () =>
                system(() =>
                    invoke(D + "store#TrainingClass", {
                        organizationPartyId: ids.organizationId,
                        title: "People access spec course"
                    })
                )
            ).trainingClassId
            const otherSessionId = system(() => {
                const otherClassId = call("create#mantle.humanres.ability.TrainingClass", {
                    organizationPartyId: ids.otherOrganizationId,
                    title: "People access spec Services course"
                }).trainingClassId
                const workEffortId = call("create#mantle.work.effort.WorkEffort", {
                    workEffortTypeEnumId: "WetEvent",
                    purposeEnumId: "WepTraining",
                    workEffortName: "Training: People access spec Services course",
                    statusId: "WeInPlanning",
                    estimatedStartDate: new Date(Date.now() + 48 * hour),
                    estimatedCompletionDate: new Date(Date.now() + 50 * hour)
                }).workEffortId
                call("create#mantle.humanres.ability.TrainingSession", {
                    workEffortId,
                    trainingClassId: otherClassId,
                    organizationPartyId: ids.otherOrganizationId,
                    trainerPartyId: ids.otherEmployeePartyId,
                    capacity: 4
                })
                return workEffortId
            })
            const schedule = {
                trainingClassId,
                startDate: new Date(Date.now() + 24 * hour),
                endDate: new Date(Date.now() + 26 * hour),
                trainerPartyId: ids.managerPartyId,
                capacity: "4"
            }
            const codes = {hrSchedules: code(asUser(users.hr, () => system(() => refusal(D + "store#Training", schedule))))}
            const workEffortId = asUser(users.develop, () => system(() => invoke(D + "store#Training", schedule))).workEffortId
            const personTrainingId = asUser(users.develop, () =>
                system(() => invoke(D + "enroll#Training", {workEffortId, partyId: ids.employeePartyId}))
            ).personTrainingId
            // the session has taken place, and Hannah, its trainer, marked Tomas attended
            system(() =>
                call("update#mantle.work.effort.WorkEffort", {
                    workEffortId,
                    estimatedStartDate: new Date(Date.now() - 3 * hour),
                    estimatedCompletionDate: new Date(Date.now() - hour)
                })
            )
            asUser(users.manager, () => system(() => invoke(D + "mark#TrainingAttendance", {personTrainingId, attended: "Y"})))
            const assess = {personTrainingId, outcome: "fail", evidence: "Access spec"}
            Object.assign(codes, {
                readerAssesses: code(asUser(users.reader, () => system(() => refusal(D + "complete#Training", assess)))),
                trainerAssesses: code(asUser(users.manager, () => system(() => refusal(D + "complete#Training", assess)))),
                otherEmployer: code(
                    asUser(users.develop, () => system(() => refusal(D + "get#Training", {workEffortId: otherSessionId})))
                )
            })
            const own = screenRefusal(users.employee, "Development/Training")
            if (own) problems.push(`the employee's Training: ${own}`)
            // P19 review: the training assessment forms are the learning administrator's, not the HR officer's or the employee's
            const developForms = screenRefusal(users.develop, "Development/AssessmentForms")
            if (developForms) problems.push(`the learning administrator's assessment forms: ${developForms}`)
            for (const [user, who] of [
                [users.hr, "the HR officer"],
                [users.employee, "the employee"]
            ]) {
                const refused = screenRefusal(user, "Development/AssessmentForms")
                if (!unauthorized(refused)) problems.push(`${who} opens the assessment forms: ${refused || "opened"}`)
            }
            // P19 review: the employee's self-service links their own training places
            const links = asUser(users.employee, () =>
                invoke("ironstone.people.ContextServices.get#SelfServiceContext", {appRoot: "Commons"})
            )
            if (links.trainingUrl !== "/qapps/People/Development/Training?show=mine")
                problems.push(`the employee's training link: ${links.trainingUrl}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    hrSchedules: "PERMISSION_DENIED",
                    readerAssesses: "RECORD_UNAVAILABLE",
                    trainerAssesses: "accepted",
                    otherEmployer: "RECORD_UNAVAILABLE"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "confidential cases: the employee files a case with Retail's case handler, who reads it; the manager, the HR officer and the administrators are refused it with the same parameters; no other app's request list, detail or lookup holds it; RequestDetail shows it behind the AI opt-out to its handler and to the employee by their own grant; the employee opens Grievances by its own grant, the levels above it as its frame",
    {
        when() {
            const R = "mantle.request.RequestServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const subject = "People access spec: a confidential concern"
            const problems = []
            const requestId = asUser(users.employee, () =>
                system(
                    () =>
                        invoke(R + "create#PeopleCase", {subject, details: "Spec details", incidentDate: "2026-11-02"}).requestId
                )
            )
            const get = {requestId}
            const codes = {
                handler: code(asUser(users.caseHandler, () => system(() => refusal(R + "get#PeopleCase", get)))),
                filer: code(asUser(users.employee, () => system(() => refusal(R + "get#PeopleCase", get)))),
                manager: code(asUser(users.manager, () => system(() => refusal(R + "get#PeopleCase", get)))),
                hr: code(asUser(users.hr, () => system(() => refusal(R + "get#PeopleCase", get)))),
                admin: code(asUser(users.admin, () => system(() => refusal(R + "get#PeopleCase", get)))),
                system: code(asUser(users.system, () => system(() => refusal(R + "get#PeopleCase", get))))
            }
            // the handler's own requests in Commons, its access check there and the id lookup hold no case
            asUser(users.caseHandler, () =>
                system(() => {
                    const rows = Array.from(
                        invoke("ironstone.commons.RequestServices.find#RequestRows", {list: "all"}).rowList || []
                    )
                    if (rows.some(row => row.requestId === requestId))
                        problems.push("the case is in the handler's Commons requests")
                    const access = invoke("ironstone.commons.RequestServices.get#RequestAccess", {requestId, need: "check"})
                    if (access.visible) problems.push("Commons' request access admits the case")
                    if (invoke("mantle.GeneralServices.lookup#ById", {lookupId: requestId}).requestId)
                        problems.push("the id lookup finds the case")
                })
            )
            // P21 review: Commons answers the case as a missing request (found false), to the manager as to anyone
            const commonsAccess = asUser(users.manager, () =>
                system(() => invoke("ironstone.commons.RequestServices.get#RequestAccess", {requestId, need: "check"}))
            )
            if (commonsAccess.found || commonsAccess.visible) problems.push("Commons tells the manager the case exists")
            // P21 review: the handler's note on the case is on no other record, for the instance administrator either (a reply on
            // the handler's party record, Chatter's party branch)
            const noteText = "People access spec: the handler's note"
            const noteId = asUser(users.caseHandler, () =>
                system(() => invoke("mantle.request.RequestServices.add#RequestComment", {requestId, body: noteText}))
            ).communicationEventId
            const reply = asUser(users.system, () =>
                system(() =>
                    refusal("ironstone.shared.ChatterServices.reply#Entry", {
                        recordEntityName: "mantle.party.Party",
                        recordId: ids.caseHandlerPartyId,
                        parentCommEventId: noteId,
                        body: "People access spec: a reply from outside"
                    })
                )
            )
            if (!/is not on this record/.test(reply))
                problems.push(`the administrator replies to the case note: ${reply || "replied"}`)
            // P21 review: an agent's render of the case's Chatter panel as its handler (Assist's screen session) shows nothing of it
            const agentChatter = asUser(users.caseHandler, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .renderMode("tui")
                    .agent()
                    .render(
                        "Chatter/ChatterTui",
                        {recordEntity: "mantle.request.Request", recordId: requestId, appRoot: "People"},
                        null
                    )
                ec.message.clearErrors()
                return String(result.output || "")
            })
            if (agentChatter.includes(noteText) || !agentChatter.includes("This record is not available"))
                problems.push("an agent's render of the case's Chatter shows it")
            // RequestDetail under People: the handler's one qvt render (the case behind the opt-out), HR's html render (not available)
            const handlerPage = asUser(users.caseHandler, () => page("Employees/RequestDetail", {requestId}))
            if (handlerPage.errors.length) problems.push(`the handler's RequestDetail: ${handlerPage.errors.join(" | ")}`)
            if (!handlerPage.output.includes(subject)) problems.push("the handler's RequestDetail lacks the case")
            if (!handlerPage.output.includes('data-ai-opt-out="section"')) problems.push("the case is not opted out of AI")
            // the employee's html render: their own case, opened under People by its own grant (BOSS_PPL_CASES_SELF)
            const filerPage = asUser(users.employee, () => page("Employees/RequestDetail", {requestId}, "html"))
            if (filerPage.status != 200 || filerPage.errors.length || !filerPage.output.includes(subject))
                problems.push(`the employee's RequestDetail: ${filerPage.status} ${filerPage.errors.join(" | ")}`)
            const own = screenRefusal(users.employee, "Employees/Grievances")
            if (own) problems.push(`the employee's Grievances: ${own}`)
            if (!unauthorized(screenRefusal(users.otherApp, "Employees/Grievances")))
                problems.push("another app's user opens Grievances")
            // the levels above Grievances the employee may not open alone (the People root, Employees) answer, loaded for
            // Grievances, as its frame: in qvt the placeholder alone, in tui the active level (Employees has no tabs); asked for
            // alone they are refused (the framework's rule, docs/security/Attack-Surface.md "Parent frames")
            const level = (path, pagePath) =>
                asUser(users.employee, () => {
                    const test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
                    if (pagePath) test.header("X-Moqui-Page-Path", pagePath)
                    const result = test.render(path, {}, null)
                    const errors = Array.from(result.errorMessages || []).join(" | ")
                    ec.message.clearErrors()
                    return {status: result.status, output: String(result.output || ""), errors}
                })
            const grievances = "/apps/People/Employees/Grievances"
            const rootFrame = level("apps/People.qvt", grievances)
            if (
                rootFrame.status != 200 ||
                rootFrame.output != '<div class="m-frame"><m-subscreens-active></m-subscreens-active></div>'
            )
                problems.push(
                    `the People root's frame for Grievances: ${rootFrame.status} ${rootFrame.errors} ${rootFrame.output.slice(0, 200)}`
                )
            const areaFrame = level("apps/People/Employees.tui", grievances)
            const areaNodes = areaFrame.status == 200 ? JSON.parse(areaFrame.output).c : null
            if (!areaNodes || areaNodes.length != 1 || areaNodes[0].t != "active")
                problems.push(
                    `Employees' terminal frame for Grievances: ${areaFrame.status} ${areaFrame.errors} ${areaFrame.output.slice(0, 200)}`
                )
            for (const [path, pagePath] of [
                ["apps/People.qvt", null],
                ["apps/People/Employees.tui", null],
                ["apps/People/Employees.tui", "/apps/People/Employees/List"]
            ]) {
                const alone = level(path, pagePath)
                if (alone.status == 200 && !alone.errors) problems.push(`the employee opens ${path} for ${pagePath}`)
            }
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    handler: "accepted",
                    filer: "accepted",
                    manager: "RECORD_UNAVAILABLE",
                    hr: "RECORD_UNAVAILABLE",
                    admin: "RECORD_UNAVAILABLE",
                    system: "RECORD_UNAVAILABLE"
                }
            problems.join("\n") == ""
        }
    }
)

feature(
    "reviews: a review cycle set up by a development editor of the employer (the HR officer refused with the same parameters, Services refused to Retail's review administrator); Review cycles the review administrator's (the HR officer and the employee refused); Reviews the employee's by the area's own grant, and their self-service links their reviews",
    {
        when() {
            const R = "mantle.humanres.ReviewServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const cycle = organizationPartyId => ({
                organizationPartyId,
                cycleName: "People access spec cycle",
                reviewTemplateId: ids.reviewTemplateId,
                periodFromDate: "2026-01-01",
                periodThruDate: "2026-12-31"
            })
            const codes = {
                developStores: code(
                    asUser(users.develop, () => system(() => refusal(R + "store#Cycle", cycle(ids.organizationId))))
                ),
                hrStores: code(asUser(users.hr, () => system(() => refusal(R + "store#Cycle", cycle(ids.organizationId))))),
                otherEmployer: code(
                    asUser(users.develop, () => system(() => refusal(R + "store#Cycle", cycle(ids.otherOrganizationId))))
                )
            }
            const problems = []
            const cycles = screenRefusal(users.develop, "Performance/ReviewCycles")
            if (cycles) problems.push(`the review administrator's review cycles: ${cycles}`)
            for (const [user, who] of [
                [users.hr, "the HR officer"],
                [users.employee, "the employee"]
            ]) {
                const refused = screenRefusal(user, "Performance/ReviewCycles")
                if (!unauthorized(refused)) problems.push(`${who} opens the review cycles: ${refused || "opened"}`)
            }
            const own = screenRefusal(users.employee, "Performance/Reviews")
            if (own) problems.push(`the employee's Reviews: ${own}`)
            const links = asUser(users.employee, () =>
                invoke("ironstone.people.ContextServices.get#SelfServiceContext", {appRoot: "Commons"})
            )
            if (links.reviewsUrl !== "/qapps/People/Performance/Reviews?show=mine")
                problems.push(`the employee's reviews link: ${links.reviewsUrl}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes == {developStores: "accepted", hrStores: "PERMISSION_DENIED", otherEmployer: "ORGANIZATION_DENIED"}
            problems.join("\n") == ""
        }
    }
)

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
    "P30: a clocking badge is HR's of the employer, its print HR's, a kiosk punch a registered device's alone, and the kiosk bundle the access administrator's to assign",
    {
        when() {
            const A = "mantle.humanres.AttendanceServices."
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const as = (user, service, parameters) => code(asUser(user, () => system(() => refusal(service, parameters))))
            const issue = {partyRelationshipId: ids.employmentId, oneTimePin: "5931"}
            const punch = {badgeText: "1234 5678 9012 3456 7890", pin: "5931"}
            const proposal = user =>
                asUser(user, () => {
                    const out = refusal("org.moqui.admin.AccessServices.check#GrantProposal", {
                        bundleGroupIdList: ["BOSS_PEOPLE_KIOSK"]
                    })
                    // a caller with neither Admin permission is refused by name, with no reason code
                    if (out) return /ADMIN_ACCESS_VIEW or ADMIN_IDENTITY_VIEW is required/.test(out) ? "PERMISSION_DENIED" : out
                    return invoke("org.moqui.admin.AccessServices.check#GrantProposal", {
                        bundleGroupIdList: ["BOSS_PEOPLE_KIOSK"]
                    }).allowed
                        ? "accepted"
                        : "refused"
                })
            const codes = {
                hrIssues: as(users.hr, A + "issue#KioskBadge", issue),
                readerIssues: as(users.reader, A + "issue#KioskBadge", issue),
                hrIssuesServices: as(users.hr, A + "issue#KioskBadge", {
                    partyRelationshipId: ids.otherEmploymentId,
                    oneTimePin: "5931"
                }),
                adminPunches: as(users.system, A + "record#KioskPunch", punch),
                employeePunches: as(users.employee, A + "record#KioskPunch", punch),
                accessAssigns: proposal("admin.access"),
                identityProposes: proposal("admin.identity"),
                readerAssigns: proposal(users.reader)
            }
            // P30 review: the badge's PIN is the worker's (set#MyKioskPin, the caller's own badge alone), HR resets a forgotten one
            const kioskBadgeId = system(
                () =>
                    ec.entity
                        .find("mantle.humanres.attendance.KioskBadge")
                        .condition({partyRelationshipId: ids.employmentId})
                        .orderBy("-issuedDate")
                        .limit(1)
                        .one()?.kioskBadgeId
            )
            const own = {kioskBadgeId, currentPin: "5931", newPin: "7319"}
            Object.assign(codes, {
                hrSetsPin: as(users.hr, A + "set#MyKioskPin", own),
                readerResets: as(users.reader, A + "reset#KioskPin", {kioskBadgeId}),
                employeeResets: as(users.employee, A + "reset#KioskPin", {kioskBadgeId}),
                employeeSetsPin: as(users.employee, A + "set#MyKioskPin", own),
                hrResets: as(users.hr, A + "reset#KioskPin", {kioskBadgeId})
            })
            const problems = []
            const opened = screenRefusal(users.hr, "Employees/BadgePrint", {kioskBadgeId: "0"})
            if (opened) problems.push(`the HR officer's BadgePrint: ${opened}`)
            const refusedScreen = screenRefusal(users.reader, "Employees/BadgePrint", {kioskBadgeId: "0"})
            if (!unauthorized(refusedScreen)) problems.push(`${users.reader} opens BadgePrint: ${refusedScreen || "opened"}`)
            // follow-up 4: the print is a POST to BadgePrint's print, refused the reader as the page is
            const printed = asUser(users.reader, () =>
                ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot.xml")
                    .render("apps/People/Employees/BadgePrint/print", {kioskBadgeId}, "post")
            )
            const printRefusal = printed.status + " " + Array.from(printed.errorMessages || []).join(" | ")
            ec.message.clearErrors()
            if (!unauthorized(printRefusal) || String(printed.output || "").includes("<svg"))
                problems.push(`${users.reader} prints a badge: ${printRefusal}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes ==
                {
                    hrIssues: "accepted",
                    readerIssues: "RECORD_UNAVAILABLE",
                    hrIssuesServices: "RECORD_UNAVAILABLE",
                    adminPunches: "DEVICE_REQUIRED",
                    employeePunches: "DEVICE_REQUIRED",
                    accessAssigns: "accepted",
                    identityProposes: "accepted",
                    readerAssigns: "PERMISSION_DENIED",
                    hrSetsPin: "RECORD_UNAVAILABLE",
                    readerResets: "RECORD_UNAVAILABLE",
                    employeeResets: "RECORD_UNAVAILABLE",
                    employeeSetsPin: "accepted",
                    hrResets: "accepted"
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
