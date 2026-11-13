// The design §14.3 review of People, "Confidentiality across every path" (impl-people P31, §8; design-people §1.1, §2 "Public
// directory projections", §14.3, §15), as one cross-cutting acceptance walk with artifact authorization on. The walk sets five secrets
// in Ziziwork Retail, each with the readers the design gives it:
// - pay: Tomas's salary (48,213.57 a year), the payroll readers' of Retail (people.payroll, people.payapprover, people.admin);
// - private person data: Ines's home phone, and her passport, whose number HR reads only masked (its last four); people.hr's;
// - a confidential case Tomas files with Retail's intake handler, with the handler's note and a file: people.case's and Tomas's;
// - a leave request HR asks for Ines with a reason: HR's (who asked, and HR of Retail) and Hannah's, her manager, who decides it with
//   no rule (Leave.js readsReason: the person, who asked, HR and the approvers);
// - an application to a Retail opening: the recruiter's (people.recruiter).
// Then each user of a People group with no other launcher (people.reader, .employee, .manager, .hr, .recruiter, .payroll,
// .payapprover, .develop, .case, .admin) and Accounting's payroll finance (finance.payroll, PAYROLL_VIEW, which reads nothing of
// People: PeopleAccessLater's P31 feature) gets none of a secret that is not theirs, with valid ids and parameters: not by URL (Employee360 under People and
// Commons, RequestDetail under People and Commons, LeaveRequestDetail, ApplicantDetail, PayAssignments, Payslips, the lists), the
// screens' services (get#Employee360Context, get#Employee360, get#Compensation, get#PeopleCase, get#Request, get#Application, the
// payroll register), direct calls of the Mantle services and the REST entity paths, transitions (Employee360's storePersonalInfo on
// Ines, a case's and a leave request's decision: refused, nothing changed), the employees import, the directory's and the leave list's
// CSV, the palette, the choices, universal search, Assist (the self-only tools people_my_leave_balances and people_my_payslip, and
// the agent renders a reader's own Assist reads: AI opt-out), the files and Chatter record checks, and the notifications sent while
// the walk ran (titles and messages of anyone's). The readers get theirs (each negative case has its positive one). Last, the kiosk
// display account, as Retail's registered tablet, reaches none of it. The scenarios each phase wrote stay theirs (PeopleDirectoryUsable,
// PeopleCasesUsable, PeoplePayAssignmentsUsable, PeoplePayslipsUsable, PeopleLeaveUsable, PeopleRecruitingUsable, PeopleKioskUsable);
// this walk puts every group through the same paths. The rules themselves are the regression specs' (PeopleAccess, PeopleAccessLater,
// Mantle's PeopleScope and the phases' specs). The invoice, payment and GL drill-down of payroll is AccountingPayrollOrigin's and
// PeoplePayHandoffUsable's. "Navigation and devices" is PeopleNavigationWalk, the phone width PeoplePhoneWalk.
// Run: ./moq accept mr-boss --spec PeopleReviewWalk
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const R = "mantle.request.RequestServices."
const L = "mantle.humanres.LeaveServices."
const H = "mantle.humanres.RecruitingServices."
const P = "mantle.humanres.PeopleServices."
const PS = "mantle.humanres.PayrollSetupServices."
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmss")
const token = "W31" + stamp
const secrets = {
    salary: ["48,213.57", "48213.57"],
    phone: "555-" + stamp.slice(-4),
    passport: "PP31" + stamp + "QX",
    caseSubject: `Remarks in the stockroom ${token}C`,
    leaveReason: `Clinic follow-up ${token}L`,
    applicantLastName: `Quill${token}A`
}
// what of each secret a text may show: the salary's amount; the phone and the masked passport; the case's and the leave's tokens;
// the applicant's name
const marks = {
    salary: secrets.salary,
    private: [secrets.phone, "•••• " + secrets.passport.slice(-4)],
    caseText: [token + "C"],
    leaveReason: [token + "L"],
    applicant: [secrets.applicantLastName]
}
const groupUsers = [
    users.reader,
    users.employee,
    users.manager,
    users.hr,
    users.recruiter,
    users.payroll,
    users.payApprover,
    users.develop,
    users.caseHandler,
    users.admin,
    users.financePayroll
]
// who may read each secret; everyone else is checked for none of it
const readers = {
    salary: [users.payroll, users.payApprover, users.admin],
    private: [users.hr],
    caseText: [users.caseHandler, users.employee],
    leaveReason: [users.hr, users.manager],
    applicant: [users.recruiter]
}
const outsidersOf = kind => groupUsers.filter(user => !readers[kind].includes(user))
const state = {}

// the secrets of a kind a text shows ([] when none); the full passport number is no one's, so every text is checked for it
function leaks(kind, text) {
    const shown = String(text ?? "")
    return marks[kind].filter(mark => shown.includes(mark))
}
const fullPassport = text => String(text ?? "").includes(secrets.passport)
// a service as the user: through a screen's authority (artifact authorization off, the service's own checks on: viaScreen) or as
// an outside caller would (on): {out, refused}
function call(user, service, parameters = {}, viaScreen = true) {
    return asUser(user, () => {
        ec.message.pushErrors()
        try {
            const run = () => ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            const out = viaScreen ? system(run) : run()
            return ec.message.hasError() ? {out: null, refused: ec.message.getErrorsString()} : {out, refused: ""}
        } catch (error) {
            return {out: null, refused: String(error.message)}
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
const json = got => JSON.stringify(got.out ?? null)
// a screen under an app root as the user, in a render mode (an agent's render when agent): status, output, errors
function render(user, path, parameters = {}, mode = "html", root = "People", agent = false) {
    return asUser(user, () => {
        let result
        try {
            let test = ec.screen.makeTest().rootScreen(`component://mr-boss/screen/${root}.xml`).renderMode(mode)
            if (agent) test = test.agent()
            result = test.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
        } catch (error) {
            result = {status: 0, output: "", errorMessages: [String(error.message)]}
        }
        ec.message.clearErrors()
        return {
            status: result.status,
            output: String(result.output || ""),
            errors: Array.from(result.errorMessages || []).join(" | ")
        }
    })
}
// a path under the web root as the user (a transition's post, the record panels' data, REST): status, output, errors, refused
function hit(user, path, parameters = {}, method = null) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {
            status: result.status,
            output: String(result.output || ""),
            errors,
            refused: result.status == 401 || result.status == 403 || /not authorized/i.test(errors)
        }
    })
}
const visible = (user, recordEntityName, recordId) =>
    call(user, "mantle.party.CommunicationServices.get#RecordLinkInfo", {recordEntityName, recordId, checkOnly: true}).out
        ?.recordVisible === true

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        state.startedAt = ec.user.nowTimestamp
        const problems = []
        // pay: Tomas's salary from a minute ago, as the data a pay change writes
        state.salaryFrom = new Date(ec.user.timestampMillis(ec.user.nowTimestamp) - 60000)
        system(() =>
            invoke("create#mantle.humanres.employment.EmploymentSalary", {
                partyRelationshipId: ids.employmentId,
                fromDate: state.salaryFrom,
                amount: "48213.57",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
        )
        // private: Ines's home phone and passport
        system(() => {
            invoke("mantle.party.ContactServices.store#PartyContactInfo", {
                partyId: ids.reportPartyId,
                replaceByPurpose: true,
                telecomContactMechPurposeId: "PhoneHome",
                contactNumber: secrets.phone
            })
            invoke("store#mantle.party.PartyIdentification", {
                partyId: ids.reportPartyId,
                partyIdTypeEnumId: "PtidPassport",
                idValue: secrets.passport
            })
        })
        // a case Tomas files with Retail's intake handler; the handler's note and a file on it
        state.requestId = call(users.employee, R + "create#PeopleCase", {
            subject: secrets.caseSubject,
            details: "It happened again on " + token,
            incidentDate: "2026-11-03"
        }).out?.requestId
        if (state.requestId) {
            state.noteId = call(users.caseHandler, R + "add#RequestComment", {
                requestId: state.requestId,
                body: "Handler's note " + token + "C"
            }).out?.communicationEventId
            state.fileId = system(() =>
                invoke("create#mantle.request.RequestContent", {requestId: state.requestId, description: "Walk file " + token})
            ).requestContentId
        } else problems.push("the case was not filed")
        // leave HR asks for Ines with a reason: under Retail's annual leave (assigned already by another spec or now), five days of
        // 2027 granted under the walk's own key, and a Wednesday in May 2027
        call(users.hr, L + "assign#Policy", {
            leavePolicyId: ids.leavePolicyId,
            partyRelationshipIds: [ids.reportEmploymentId],
            fromDate: "2026-01-02",
            reason: "Review walk"
        })
        call(users.hr, L + "allocate#Leave", {
            leavePolicyId: ids.leavePolicyId,
            partyRelationshipIds: [ids.reportEmploymentId],
            amount: "5",
            periodFromDate: "2027-01-01",
            periodThruDate: "2027-12-31",
            operationKey: "PPL_P31_WALK_" + stamp
        })
        const leave = call(users.hr, L + "submit#Request", {
            partyRelationshipId: ids.reportEmploymentId,
            leaveTypeEnumId: "PltAnnual",
            fromDate: "2027-05-12",
            reason: secrets.leaveReason
        })
        state.leaveRequestId = leave.out?.leaveRequestId
        if (!state.leaveRequestId) problems.push(`the leave request was not made: ${leave.refused}`)
        // an application to a Retail opening of the recruiter's (a new one on the vacant seat, else Retail's first open one)
        const opened = call(users.recruiter, H + "store#Opening", {
            organizationPartyId: ids.organizationId,
            title: "Review walk opening " + token,
            emplPositionIds: ids.openingSeatId,
            action: "open"
        })
        state.jobOpeningId =
            opened.out?.jobOpeningId ||
            system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.humanres.recruitment.JobOpening")
                            .condition("organizationPartyId", ids.organizationId)
                            .orderBy("-lastUpdatedStamp")
                            .limit(1)
                            .list()
                    )[0]?.jobOpeningId
            )
        state.applicationId = call(users.recruiter, H + "create#Application", {
            jobOpeningId: state.jobOpeningId,
            firstName: "Rowan",
            lastName: secrets.applicantLastName
        }).out?.employmentApplicationId
        if (!state.applicationId) problems.push("the application was not made")
        // an issued payslip of someone's, for the self-only payslip tool
        state.issuedSlip = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.humanres.payroll.Payslip")
                        .condition("statusId", "PssIssued")
                        .orderBy("payslipId")
                        .limit(1)
                        .list()
                ).map(row => ({payslipId: row.payslipId, partyId: row.partyId}))[0] || null
        )
        state.setupProblems = problems
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("mantle.humanres.employment.EmploymentSalary")
                .condition({partyRelationshipId: ids.employmentId, fromDate: state.salaryFrom})
                .deleteAll()
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the readers get their secrets: the payroll operator Tomas's salary, HR Ines's phone masked passport, the handler the case, HR and the deciding manager the leave reason, the recruiter the applicant",
    {
        when() {
            const compensation = call(users.payroll, "ironstone.people.ContextServices.get#Employee360Context", {
                appRoot: "People",
                partyId: ids.employeePartyId,
                partyRelationshipId: ids.employmentId
            })
            const ines = render(users.hr, "Employees/Employee360", {partyId: ids.reportPartyId})
            return {
                setupProblems: state.setupProblems,
                salary: leaks("salary", json(compensation)),
                privatePage: leaks("private", ines.output),
                passportShown: fullPassport(ines.output),
                caseText: leaks("caseText", json(call(users.caseHandler, R + "get#PeopleCase", {requestId: state.requestId}))),
                leaveReason: call(users.hr, L + "get#Request", {leaveRequestId: state.leaveRequestId}).out?.request?.reason,
                managerReason: call(users.manager, L + "get#Request", {leaveRequestId: state.leaveRequestId}).out?.request
                    ?.reason,
                applicant: leaks(
                    "applicant",
                    json(call(users.recruiter, H + "get#Application", {employmentApplicationId: state.applicationId}))
                )
            }
        },
        then({setupProblems, salary, privatePage, passportShown, caseText, leaveReason, managerReason, applicant}) {
            setupProblems == []
            salary.length > 0
            privatePage.length == 2
            passportShown == false
            caseText.length > 0
            leaveReason == secrets.leaveReason
            managerReason == secrets.leaveReason
            applicant.length > 0
        }
    }
)

feature(
    "no one but a secret's readers gets it by URL: the record screens under People and Commons, the lists and the payroll screens",
    {
        when() {
            const problems = []
            const check = (kind, user, label, got) => {
                const shown = leaks(kind, got.output)
                if (shown.length) problems.push(`${user}: ${label} shows ${shown.join(", ")}`)
            }
            for (const user of groupUsers) {
                for (const label of ["People", "Commons"]) {
                    const root = label === "People" ? "People" : "Commons"
                    const path = label === "People" ? "Employees/Employee360" : "People/Employee360"
                    const tomas = render(
                        user,
                        path,
                        {partyId: ids.employeePartyId, partyRelationshipId: ids.employmentId},
                        "html",
                        root
                    )
                    if (!readers.salary.includes(user)) check("salary", user, `${label}'s Employee360 of Tomas`, tomas)
                    const ines = render(user, path, {partyId: ids.reportPartyId}, "html", root)
                    if (!readers.private.includes(user)) check("private", user, `${label}'s Employee360 of Ines`, ines)
                    if (fullPassport(ines.output) || fullPassport(tomas.output))
                        problems.push(`${user}: an Employee360 shows the passport`)
                }
                if (!readers.caseText.includes(user)) {
                    check(
                        "caseText",
                        user,
                        "RequestDetail",
                        render(user, "Employees/RequestDetail", {requestId: state.requestId})
                    )
                    check("caseText", user, "Grievances", render(user, "Employees/Grievances"))
                    check(
                        "caseText",
                        user,
                        "Commons' RequestDetail",
                        render(user, "Requests/RequestDetail", {requestId: state.requestId}, "html", "Commons")
                    )
                    check("caseText", user, "Home", render(user, "Home"))
                }
                if (!readers.leaveReason.includes(user))
                    check(
                        "leaveReason",
                        user,
                        "LeaveRequestDetail",
                        render(user, "Time/LeaveRequestDetail", {leaveRequestId: state.leaveRequestId})
                    )
                // a list never shows a leave reason, to its readers either
                check("leaveReason", user, "LeaveRequests", render(user, "Time/LeaveRequests", {show: "all"}))
                if (!readers.applicant.includes(user)) {
                    check(
                        "applicant",
                        user,
                        "ApplicantDetail",
                        render(user, "Staffing/ApplicantDetail", {employmentApplicationId: state.applicationId})
                    )
                    check(
                        "applicant",
                        user,
                        "ApplicantPipeline",
                        render(user, "Staffing/ApplicantPipeline", {jobOpeningId: state.jobOpeningId})
                    )
                }
                if (!readers.salary.includes(user)) {
                    check(
                        "salary",
                        user,
                        "PayAssignments",
                        render(user, "Payroll/PayAssignments", {organizationPartyId: ids.organizationId})
                    )
                    check("salary", user, "Payslips", render(user, "Payroll/Payslips"))
                }
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "nor through the screens' services, a direct call of the Mantle services, the REST entity paths or the payroll register",
    {
        when() {
            const problems = []
            const services = {
                salary: [
                    [
                        "ironstone.people.ContextServices.get#Employee360Context",
                        {appRoot: "People", partyId: ids.employeePartyId}
                    ],
                    [PS + "get#Compensation", {partyId: ids.employeePartyId}],
                    [P + "get#Employee360", {partyId: ids.employeePartyId}]
                ],
                private: [
                    [P + "get#Employee360", {partyId: ids.reportPartyId}],
                    ["ironstone.people.ContextServices.get#Employee360Context", {appRoot: "People", partyId: ids.reportPartyId}]
                ],
                caseText: [
                    [R + "get#PeopleCase", {requestId: state.requestId}],
                    [R + "find#PeopleCases", {}],
                    ["ironstone.commons.RequestServices.find#RequestRows", {list: "all"}],
                    ["mantle.GeneralServices.lookup#ById", {lookupId: state.requestId}]
                ],
                leaveReason: [
                    [L + "get#Request", {leaveRequestId: state.leaveRequestId}],
                    [L + "find#Requests", {}]
                ],
                applicant: [
                    [H + "get#Application", {employmentApplicationId: state.applicationId}],
                    [H + "find#Applications", {jobOpeningId: state.jobOpeningId}]
                ]
            }
            for (const user of groupUsers) {
                for (const [kind, calls] of Object.entries(services)) {
                    for (const [service, parameters] of calls) {
                        // the screens' path (the service's own checks) for those it is not for, and a direct call (artifact
                        // authorization on) for everyone: neither answers what is not theirs
                        if (!readers[kind].includes(user)) {
                            const shown = leaks(kind, json(call(user, service, parameters)))
                            if (shown.length) problems.push(`${user}: ${service} answers ${shown.join(", ")}`)
                        }
                        const direct = call(user, service, parameters, false)
                        const shown = readers[kind].includes(user) ? [] : leaks(kind, json(direct))
                        if (shown.length) problems.push(`${user}: ${service} called directly answers ${shown.join(", ")}`)
                    }
                }
                if (fullPassport(json(call(user, P + "get#Employee360", {partyId: ids.reportPartyId}))))
                    problems.push(`${user}: get#Employee360 answers the passport number`)
                for (const path of [
                    "rest/e1/mantle.humanres.employment.EmploymentSalary",
                    "rest/e1/mantle.humanres.leave.LeaveRequest",
                    "rest/e1/mantle.humanres.employment.EmploymentApplication",
                    "rest/e1/mantle.request.PeopleCase"
                ]) {
                    const got = hit(user, path)
                    if (!got.refused) problems.push(`${user}: ${path} is not refused: ${got.status} ${got.output.slice(0, 120)}`)
                }
                // the payroll register is a payroll reader's; finance.payroll's PAYROLL_VIEW is no People read (the lead's call of
                // Nov 13, 2026), so it is answered no employer's rows
                const register = call(user, "mantle.humanres.PeopleReportServices.run#Report", {
                    reportId: "payrollRegister",
                    fromDate: "2026-01-01",
                    thruDate: "2027-12-31"
                })
                if (user === users.financePayroll) {
                    if (!register.refused && Array.from(register.out?.rows || []).length)
                        problems.push(`${user}: the payroll register answered rows`)
                } else if (!readers.salary.includes(user) && !register.refused)
                    problems.push(`${user}: the payroll register answered`)
                // the id lookup knows no case but its readers'
                if (
                    !readers.caseText.includes(user) &&
                    call(user, "mantle.GeneralServices.lookup#ById", {lookupId: state.requestId}).out?.requestId
                )
                    problems.push(`${user}: the id lookup finds the case`)
                if (!readers.salary.includes(user) && leaks("salary", json(register)).length)
                    problems.push(`${user}: the payroll register shows the salary`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "nor by a transition: Employee360's storePersonalInfo on Ines, a case's or a leave request's decision are refused and change nothing",
    {
        when() {
            const problems = []
            const revision = call(users.hr, P + "get#Employee360", {partyId: ids.reportPartyId}).out?.personalInfo?.revision
            const caseStatus = () =>
                system(() => ec.entity.find("mantle.request.Request").condition("requestId", state.requestId).one())?.statusId
            const leaveStatus = () =>
                system(() =>
                    ec.entity.find("mantle.humanres.leave.LeaveRequest").condition("leaveRequestId", state.leaveRequestId).one()
                )?.statusEnumId
            const before = {caseStatus: caseStatus(), leaveStatus: leaveStatus()}
            for (const user of outsidersOf("private")) {
                const posted = hit(
                    user,
                    "apps/People/Employees/Employee360/storePersonalInfo",
                    {partyId: ids.reportPartyId, expectedRevision: revision, homePhone: "555-9999"},
                    "post"
                )
                if (!posted.errors && !posted.refused) problems.push(`${user}: storePersonalInfo on Ines was accepted`)
            }
            for (const user of outsidersOf("caseText")) {
                const changed = call(user, R + "change#PeopleCase", {
                    requestId: state.requestId,
                    action: "close",
                    outcomeNote: "Walk"
                })
                if (!changed.refused) problems.push(`${user}: change#PeopleCase was accepted`)
            }
            for (const user of outsidersOf("leaveReason")) {
                const decided = call(user, L + "decide#Request", {leaveRequestId: state.leaveRequestId, decision: "approve"})
                if (!decided.refused) problems.push(`${user}: decide#Request was accepted`)
            }
            const phone = call(users.hr, P + "get#Employee360", {partyId: ids.reportPartyId}).out?.personalInfo?.homePhone
            return {problems, phone, before, after: {caseStatus: caseStatus(), leaveStatus: leaveStatus()}}
        },
        then({problems, phone, before, after}) {
            problems.join("\n") == ""
            phone == secrets.phone
            after == before
        }
    }
)

feature(
    "nor by an import or an export: the employees import is HR's, the directory and leave CSV carry no private value or reason",
    {
        when() {
            const problems = []
            const T = "org.moqui.admin.DataTransferServices."
            // the employees import batches (a TransferBatch keeps no operation key; no one else stages one during the feature)
            const batches = () =>
                system(() => ec.entity.find("moqui.server.TransferBatch").condition("targetId", "employees").count())
            const before = batches()
            for (const user of groupUsers) {
                const target = call(user, T + "get#ImportTarget", {targetId: "employees"})
                if (user !== users.hr && target.out?.target?.importAllowed === true)
                    problems.push(`${user}: the employees import is allowed`)
                if (user !== users.hr) {
                    const staged = call(user, T + "stage#Import", {
                        targetId: "employees",
                        organizationPartyId: ids.organizationId,
                        sourceText: "firstName,lastName,emailAddress\nWalk,Import" + stamp + ",walk.import@example.com",
                        operationKey: "PPL_P31_WALK_" + user
                    })
                    if (!staged.refused && staged.out?.refused !== true) problems.push(`${user}: an employees import was staged`)
                }
                const directory = render(user, "Employees", {term: "Varga", pageNoLimit: "true"}, "csv")
                const shown = leaks("private", directory.output)
                if (shown.length) problems.push(`${user}: the directory's CSV shows ${shown.join(", ")}`)
                if (fullPassport(directory.output) || leaks("salary", directory.output).length)
                    problems.push(`${user}: the directory's CSV shows a passport or a salary`)
                const leave = render(user, "Time/LeaveRequests", {show: "all", pageNoLimit: "true"}, "csv")
                if (leaks("leaveReason", leave.output).length) problems.push(`${user}: the leave requests' CSV shows the reason`)
            }
            const hrTarget = call(users.hr, T + "get#ImportTarget", {targetId: "employees"})
            return {problems, staged: batches() - before, hrAllowed: hrTarget.out?.target?.importAllowed}
        },
        then({problems, staged, hrAllowed}) {
            problems.join("\n") == ""
            staged == 0
            hrAllowed == true
        }
    }
)

feature("nor through the palette, the choices or universal search", {
    when() {
        const problems = []
        const C = "ironstone.people.ContextServices."
        for (const user of groupUsers) {
            for (const [kind, text] of [
                ["salary", "Lindqvist"],
                ["private", "Varga"],
                ["caseText", token + "C"],
                ["leaveReason", token + "L"],
                ["applicant", secrets.applicantLastName]
            ]) {
                if (readers[kind].includes(user)) continue
                const palette = call(user, C + "search#Records", {text}, false)
                if (leaks(kind, json(palette)).length) problems.push(`${user}: the palette finds the ${kind} by "${text}"`)
                const search = call(user, "mantle.search.UniversalSearchServices.search#Universal", {q: text})
                // its results alone: the answer echoes the text searched for as its query
                if (leaks(kind, JSON.stringify(search.out?.results ?? null)).length)
                    problems.push(`${user}: universal search finds the ${kind} by "${text}"`)
            }
            // the drop-downs offer no other employer and no one of Services to a user of Retail's (the People administrator reads
            // every employer), and no private value
            for (const choice of ["employers", "people", "employees", "staff"]) {
                const options =
                    call(user, C + "get#Choices", {choice, term: "", organizationPartyId: ids.organizationId}, false).out
                        ?.options || []
                const text = JSON.stringify(options)
                if (
                    user !== users.admin &&
                    options.some(option => [ids.otherOrganizationId, ids.otherEmployeePartyId].includes(option.value))
                )
                    problems.push(`${user}: the ${choice} choices offer Services`)
                for (const kind of Object.keys(marks))
                    if (!readers[kind].includes(user) && leaks(kind, text).length)
                        problems.push(`${user}: the ${choice} choices show the ${kind}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "nor through Assist: the self-only tools answer the caller's own, and a reader's agent render shows nothing opted out of AI",
    {
        when() {
            const problems = []
            const slip = state.issuedSlip
            for (const user of groupUsers) {
                // people_my_leave_balances (get#MyBalances): the caller's own, never Ines's employment or a reason
                const balances = json(call(user, L + "get#MyBalances", {partyId: ids.reportPartyId}))
                if (balances.includes(ids.reportEmploymentId) || leaks("leaveReason", balances).length)
                    problems.push(`${user}: get#MyBalances answers Ines's balances`)
                // people_my_payslip (get#MyPayslip): another's issued slip is not the caller's
                if (slip) {
                    const partyId = system(() =>
                        ec.entity.find("moqui.security.UserAccount").condition("username", user).one()
                    )?.partyId
                    if (partyId !== slip.partyId) {
                        const got = call(user, "mantle.humanres.PayrollResultServices.get#MyPayslip", {payslipId: slip.payslipId})
                        if (got.out?.payslip) problems.push(`${user}: get#MyPayslip answers ${slip.partyId}'s slip`)
                    }
                }
            }
            if (!slip) log.info("No issued payslip in the database: get#MyPayslip's other person's slip was not asked")
            // a reader's own Assist reads the screen as an agent: the opted-out values are not shared with AI
            const agents = {
                salary: render(
                    users.payroll,
                    "Employees/Employee360",
                    {partyId: ids.employeePartyId, partyRelationshipId: ids.employmentId},
                    "tui",
                    "People",
                    true
                ),
                caseText: render(
                    users.caseHandler,
                    "Employees/RequestDetail",
                    {requestId: state.requestId},
                    "tui",
                    "People",
                    true
                ),
                leaveReason: render(
                    users.hr,
                    "Time/LeaveRequestDetail",
                    {leaveRequestId: state.leaveRequestId},
                    "tui",
                    "People",
                    true
                )
            }
            for (const [kind, got] of Object.entries(agents))
                if (leaks(kind, got.output).length) problems.push(`an agent's render shows the ${kind} to its reader's Assist`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "nor through files, Chatter or notifications: the record checks admit a host's readers alone, and no notice names a secret",
    {
        when() {
            const problems = []
            const hosts = [
                ["caseText", "mantle.request.Request", state.requestId],
                ["caseText", "mantle.party.communication.CommunicationEvent", state.noteId],
                ["caseText", "mantle.request.RequestContent", state.fileId],
                ["applicant", "mantle.humanres.employment.EmploymentApplication", state.applicationId]
            ]
            for (const user of groupUsers) {
                for (const [kind, entityName, recordId] of hosts)
                    if (!readers[kind].includes(user) && recordId && visible(user, entityName, recordId))
                        problems.push(`${user}: ${entityName} ${recordId} is visible`)
                // the employment's notes and files are HR's (and the person's own)
                if (
                    ![users.hr, users.employee].includes(user) &&
                    visible(user, "mantle.humanres.employment.Employment", ids.employmentId)
                )
                    problems.push(`${user}: Tomas's employment's files and notes are visible`)
                // the case's files and conversation as the record panels fetch them under People
                if (!readers.caseText.includes(user)) {
                    const files = hit(user, "apps/People/RecordFiles/filesData", {
                        recordEntity: "mantle.request.Request",
                        recordId: state.requestId
                    })
                    if (leaks("caseText", files.output).length || files.output.includes("Walk file " + token))
                        problems.push(`${user}: the case's files show it`)
                    const chatter = render(
                        user,
                        "Chatter/ChatterTui",
                        {recordEntity: "mantle.request.Request", recordId: state.requestId, appRoot: "People"},
                        "tui"
                    )
                    if (leaks("caseText", chatter.output).length) problems.push(`${user}: the case's Chatter shows it`)
                }
            }
            // every notice sent while the walk ran, to anyone: no amount, private value, case subject or leave reason
            const notices = system(() =>
                Array.from(
                    ec.entity
                        .find("moqui.security.user.NotificationMessage")
                        .condition("sentDate", "greater-equals", state.startedAt)
                        .selectField(["notificationMessageId", "topic", "titleText", "messageJson"])
                        .list()
                ).map(row => ({topic: row.topic, text: String(row.titleText || "") + " " + String(row.messageJson || "")}))
            )
            for (const notice of notices)
                for (const kind of ["salary", "private", "caseText", "leaveReason"])
                    if (leaks(kind, notice.text).length) problems.push(`a ${notice.topic} notice names the ${kind}`)
            return {problems, notices: notices.length}
        },
        then({problems, notices}) {
            problems.join("\n") == ""
            // the case's intake notice and the leave approval at least
            notices > 0
        }
    }
)

feature("the kiosk display account, as Retail's registered tablet, reaches none of it", {
    when() {
        const tablet = system(() => lib.kioskTablet("People review clock"))
        const outside = got => /This device opens only PEOPLE_CLOCKING/.test(got.errors)
        const paths = [
            ["apps/People/Employees/Employee360", {partyId: ids.employeePartyId}],
            ["apps/People/Employees/Employee360", {partyId: ids.reportPartyId}],
            ["apps/People/Employees/RequestDetail", {requestId: state.requestId}],
            ["apps/People/Time/LeaveRequestDetail", {leaveRequestId: state.leaveRequestId}],
            ["apps/People/Staffing/ApplicantDetail", {employmentApplicationId: state.applicationId}],
            ["apps/People/Payroll/PayAssignments", {}],
            ["apps/People/Employees/List", {term: "Varga"}],
            ["apps/Commons/People/Employee360", {partyId: ids.employeePartyId}],
            ["apps/Commons/Requests/RequestDetail", {requestId: state.requestId}],
            ["rest/e1/mantle.humanres.employment.EmploymentSalary", {}],
            ["qapps/People/Employees/List", {}]
        ]
        const problems = []
        for (const [path, parameters] of paths) {
            const got = lib.deviceRequest(path, parameters, tablet.cookie)
            if (!outside(got)) problems.push(`the tablet opens ${path}: ${got.status}`)
            for (const kind of Object.keys(marks))
                if (leaks(kind, got.output).length) problems.push(`the tablet's ${path} shows the ${kind}`)
        }
        const kiosk = lib.deviceRequest("apps/People/Time/ClockingKiosk", {}, tablet.cookie)
        // the device's requests leave the thread signed out; the identity and access administrator revokes it
        login(users.system)
        system(() =>
            invoke("mantle.party.IdentityServices.revoke#SharedDevice", {deviceId: tablet.deviceId, reason: "Review walk done"})
        )
        return {problems, kiosk}
    },
    then({problems, kiosk}) {
        problems.join("\n") == ""
        kiosk.status == 200 && kiosk.errors == ""
    }
})
