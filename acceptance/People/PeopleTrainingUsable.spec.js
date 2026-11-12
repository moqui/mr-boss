// People P19's "usable when" (impl-people P19; design-people §10 Training and TrainingDetail, §15 the completion certificate, §14.3
// "Qualifications and reviews"), as an acceptance walk with artifact authorization on, through the screens' transitions: the People
// administrator publishes Retail's fire warden assessment (as People's Forms builds it); the learning administrator (people.develop)
// schedules a session of Retail's fire warden course from Training, trained by Hannah (people.manager); Tomas (people.employee)
// opens Training by the area's own grant and asks for a place, which waits for Hannah, his manager, who approves it on
// TrainingDetail; the learning administrator enrolls Rafael at once. After the session, Hannah marks both attended and records
// their results: Tomas passes; Rafael fails, his result kept, and passes a second attempt. Both then hold the fire warden
// certificate, verified, with its expiry two years on, which the staffing check counts; Tomas reads his own outcome (never the
// trainer's answers) and prints his certificate as issued. The rules themselves are Mantle's Training and mr-boss's PeopleTraining.
// Run: ./moq accept mr-boss --spec PeopleTrainingUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const trainingPath = "apps/People/Development/Training/"
const detailPath = "apps/People/Development/TrainingDetail/"
const D = "mantle.humanres.DevelopmentServices."
const hour = 60 * 60 * 1000
// a request under the web root as the user (a transition's post), its status and errors
function request(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, "post")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const timeText = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd HH:mm", null, "America/Chicago")
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // Retail's fire warden assessment, built and published by the People administrator
        asUser(users.admin, () => {
            const F = "mantle.party.FormDefinitionServices."
            state.formId = system(() =>
                invoke(F + "create#Form", {
                    purposeEnumId: "DbfpTrainingAssessment",
                    organizationPartyId: ids.organizationId,
                    description: "Fire warden practical"
                })
            ).formId
            system(() =>
                invoke(F + "save#FormField", {
                    formId: state.formId,
                    newFieldName: "evacuation",
                    title: "Led the evacuation drill",
                    fieldTypeEnumId: "DBFFT_radio",
                    isRequired: "Y",
                    optionText: "1 | Not yet\n2 | Yes"
                })
            )
            system(() => invoke(F + "publish#Form", {formId: state.formId}))
        })
    }
})

feature("the learning administrator schedules a fire warden session from Training, trained by Hannah", {
    when() {
        const start = Date.now() + 3 * 24 * hour
        const scheduled = request(users.develop, trainingPath + "storeTraining", {
            trainingClassId: ids.fireWardenCourseId,
            startDate: timeText(start),
            endDate: timeText(start + 3 * hour),
            location: "Store 1 back office",
            trainerPartyId: ids.managerPartyId,
            capacity: "3",
            assessmentFormId: state.formId
        })
        const listed = read(users.develop, D + "find#Training", {trainingClassId: ids.fireWardenCourseId}).sessions
        state.sessionId = listed.find(row => row.location === "Store 1 back office")?.workEffortId
        return {scheduled, listed, opened: asUser(users.develop, () => page("Development/Training", {}))}
    },
    then({scheduled, listed, opened}) {
        scheduled.status == 302 && scheduled.errors == ""
        state.sessionId && listed.find(row => row.workEffortId == state.sessionId).trainerName == "Hannah Okafor"
        opened.status == 200 && opened.errors.length == 0 && opened.output.includes("Fire warden training")
    }
})

feature("Tomas asks for a place, which waits for Hannah's approval; the learning administrator enrolls Rafael at once", {
    when() {
        const opened = asUser(users.employee, () => page("Development/Training", {}))
        const asked = request(users.employee, trainingPath + "requestPlace", {
            workEffortId: state.sessionId,
            reason: "I open the store on Saturdays"
        })
        const waiting = read(users.employee, D + "get#Training", {workEffortId: state.sessionId}).enrollments[0]
        state.tomasPlace = waiting.personTrainingId
        const forHannah = read(users.manager, D + "get#Training", {personTrainingId: state.tomasPlace}).enrollments[0]
        const approved = request(users.manager, detailPath + "decide", {
            workEffortId: state.sessionId,
            personTrainingId: state.tomasPlace,
            decision: "approve",
            peopleApprovalId: forHannah.peopleApprovalId,
            sourceRevision: forHannah.sourceRevision
        })
        const enrolled = request(users.develop, detailPath + "enroll", {
            workEffortId: state.sessionId,
            partyId: ids.associatePartyId
        })
        const places = read(users.develop, D + "get#Training", {workEffortId: state.sessionId}).enrollments
        state.rafaelPlace = places.find(row => row.partyId === ids.associatePartyId)?.personTrainingId
        return {opened, asked, waiting, forHannah, approved, enrolled, places}
    },
    then({opened, asked, waiting, forHannah, approved, enrolled, places}) {
        opened.status == 200 && opened.errors.length == 0 && opened.output.includes("Ask for a place")
        asked.status == 302 && asked.errors == ""
        waiting.statusEnumId == "PtsRequested" && waiting.waitingText.includes("Hannah")
        forHannah.canDecide && forHannah.reason == "I open the store on Saturdays"
        approved.status == 302 && approved.errors == ""
        enrolled.status == 302 && enrolled.errors == ""
        places.length == 2 && places.every(row => row.statusEnumId == "PtsEnrolled")
    }
})

feature("after the session Hannah marks both attended and records the results: Tomas passes, Rafael fails and passes again", {
    when() {
        // the session has taken place
        system(() =>
            call("update#mantle.work.effort.WorkEffort", {
                workEffortId: state.sessionId,
                estimatedStartDate: new Date(Date.now() - 4 * hour),
                estimatedCompletionDate: new Date(Date.now() - hour)
            })
        )
        const mark = personTrainingId =>
            request(users.manager, detailPath + "markAttendance", {
                workEffortId: state.sessionId,
                personTrainingId,
                attended: "Y"
            })
        const assess = (personTrainingId, outcome, evacuation) =>
            request(users.manager, detailPath + "completeTraining", {
                workEffortId: state.sessionId,
                personTrainingId,
                outcome,
                evacuation,
                evidence: "Observed in the drill"
            })
        const out = {marked: [mark(state.tomasPlace), mark(state.rafaelPlace)]}
        out.assessPage = asUser(users.manager, () =>
            page("Development/TrainingDetail", {workEffortId: state.sessionId, assessId: state.tomasPlace})
        )
        out.tomas = assess(state.tomasPlace, "pass", "2")
        out.rafaelFails = assess(state.rafaelPlace, "fail", "1")
        out.rafaelPasses = assess(state.rafaelPlace, "pass", "2")
        out.session = read(users.manager, D + "get#Training", {workEffortId: state.sessionId})
        return out
    },
    then({marked, assessPage, tomas, rafaelFails, rafaelPasses, session}) {
        marked.every(row => row.status == 302 && row.errors == "")
        assessPage.status == 200 && assessPage.output.includes("Led the evacuation drill")
        tomas.errors == "" && rafaelFails.errors == "" && rafaelPasses.errors == ""
        session.enrollments.every(row => row.statusEnumId == "PtsCompleted")
        session.results.length == 3 && session.results.filter(row => row.resultText == "Failed").length == 1
        session.results.every(row => row.answersText.startsWith("Led the evacuation drill"))
    }
})

feature("both hold the fire warden certificate with its expiry; Tomas reads his own outcome and prints his certificate", {
    when() {
        const held = partyId =>
            read(users.develop, D + "find#Qualifications", {partyId, qualificationTypeEnumId: ids.fireWardenTypeId})
                .qualifications
        return {
            tomasHeld: held(ids.employeePartyId),
            rafaelHeld: held(ids.associatePartyId),
            check: read(users.develop, D + "check#Qualifications", {
                partyIdList: [ids.employeePartyId, ids.associatePartyId],
                qualificationTypeEnumId: ids.fireWardenTypeId
            }),
            own: read(users.employee, D + "get#Training", {workEffortId: state.sessionId}),
            certificate: asUser(users.employee, () =>
                page("Development/TrainingCertificate", {personTrainingId: state.tomasPlace}, "html-print")
            )
        }
    },
    then({tomasHeld, rafaelHeld, check, own, certificate}) {
        tomasHeld.length == 1 && rafaelHeld.length == 1
        tomasHeld[0].verificationStatusId == "QlVerVerified" && tomasHeld[0].validity == "valid"
        const years = (tomasHeld[0].thruDate - Date.now()) / (365 * 24 * hour)
        years > 1.9 && years < 2.1
        check.results.every(row => row.state == "qualified")
        own.enrollments.length == 1 && own.results.length == 1 && own.results[0].resultText == "Passed"
        own.results[0].answersText == "" && own.results[0].evidence == null
        certificate.status == 200 &&
            certificate.output.includes("Tomas Lindqvist") &&
            certificate.output.includes("Fire warden certificate")
    }
})
