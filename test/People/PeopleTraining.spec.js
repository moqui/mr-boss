// People's training screens (impl-people P19; design-people §10 Training and TrainingDetail, §15 the completion certificate):
// Training's one qvt render as the learning administrator (Retail's fire warden session with its trainer and seats, Schedule
// session and the Courses box) with the choices trainers and trainingForms, each with a selected value off the page, and the
// employee's Today item for the session he is enrolled in; TrainingDetail's one qvt render as the trainer (Hannah) choosing Tomas's
// place to assess: the enrollment and the Record a result box over the assessment form's own field, then the result posted through
// its transition with authorization on, completing the place and granting the fire warden certificate; TrainingCertificate's one
// html-print render as Tomas: the stored certificate with his name and the course. The rules are Mantle's Training; access is
// PeopleAccess's.
// Run: ./moq test mr-boss --spec PeopleTraining
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const D = "mantle.humanres.DevelopmentServices."
const hour = 60 * 60 * 1000
const state = {}

// a screen transition as the client posts it, as the user with artifact authorization on
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, "post")
        return {status: result.status, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        const now = Date.now()
        // Retail's published fire warden assessment (built as People's Forms builds it)
        asUser(users.admin, () => {
            const F = "mantle.party.FormDefinitionServices."
            state.formId = system(() =>
                invoke(F + "create#Form", {
                    purposeEnumId: "DbfpTrainingAssessment",
                    organizationPartyId: ids.organizationId,
                    description: "Spec fire warden assessment"
                })
            ).formId
            system(() =>
                invoke(F + "save#FormField", {
                    formId: state.formId,
                    newFieldName: "evacuation",
                    title: "Evacuation drill",
                    fieldTypeEnumId: "DBFFT_radio",
                    isRequired: "Y",
                    optionText: "1 | Not yet\n2 | Led it"
                })
            )
            system(() => invoke(F + "publish#Form", {formId: state.formId}))
        })
        // a session tomorrow trained by Hannah, Tomas enrolled by the learning administrator
        asUser(users.develop, () => {
            state.sessionId = system(() =>
                invoke(D + "store#Training", {
                    trainingClassId: ids.fireWardenCourseId,
                    startDate: new Date(now + 24 * hour),
                    endDate: new Date(now + 27 * hour),
                    location: "Back office",
                    trainerPartyId: ids.managerPartyId,
                    capacity: "6",
                    assessmentFormId: state.formId
                })
            ).workEffortId
            state.placeId = system(() =>
                invoke(D + "enroll#Training", {workEffortId: state.sessionId, partyId: ids.employeePartyId})
            ).personTrainingId
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Training as the learning administrator: the session, Schedule session and Courses; the choices; Tomas's Today item", {
    when() {
        const rendered = asUser(users.develop, () => page("Development/Training", {}))
        const choose = (name, term, selected, organizationPartyId) =>
            asUser(users.develop, () =>
                invoke("ironstone.people.ContextServices.get#Choices", {
                    appRoot: "People",
                    choice: name,
                    term,
                    selected,
                    organizationPartyId
                })
            ).options.map(option => option.value)
        return {
            rendered,
            trainers: choose("trainers", "zzz", ids.managerPartyId),
            forms: choose("trainingForms", "zzz", state.formId, ids.organizationId),
            today: asUser(users.employee, () => system(() => invoke("ironstone.people.ContextServices.get#TodayItems", {}))).items
        }
    },
    then({rendered, trainers, forms, today}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Fire warden training") && rendered.output.includes("Back office")
        rendered.output.includes("Schedule session") && rendered.output.includes("New course")
        rendered.output.includes("1 of 6 taken") && rendered.output.includes("Fire warden certificate, valid 24 months")
        trainers.includes(ids.managerPartyId)
        forms == [state.formId]
        today.some(item => item.kind == "training" && item.title.startsWith("Training: Fire warden training"))
    }
})

feature("TrainingDetail as the trainer: Tomas's place to assess over the form's field, then his result completing it", {
    when() {
        // the session has taken place, and Hannah marked Tomas attended
        system(() =>
            call("update#mantle.work.effort.WorkEffort", {
                workEffortId: state.sessionId,
                estimatedStartDate: new Date(Date.now() - 4 * hour),
                estimatedCompletionDate: new Date(Date.now() - hour)
            })
        )
        asUser(users.manager, () =>
            system(() => invoke(D + "mark#TrainingAttendance", {personTrainingId: state.placeId, attended: "Y"}))
        )
        const rendered = asUser(users.manager, () =>
            page("Development/TrainingDetail", {workEffortId: state.sessionId, assessId: state.placeId})
        )
        const posted = post(users.manager, "apps/People/Development/TrainingDetail/completeTraining", {
            workEffortId: state.sessionId,
            personTrainingId: state.placeId,
            outcome: "pass",
            score: "90",
            evacuation: "2"
        })
        const place = system(() =>
            ec.entity.find("mantle.humanres.ability.PersonTraining").condition("personTrainingId", state.placeId).one()
        )
        return {rendered, posted, place}
    },
    then({rendered, posted, place}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Tomas Lindqvist") && rendered.output.includes("Attended")
        rendered.output.includes("Record a result for Tomas Lindqvist") && rendered.output.includes("Evacuation drill")
        !rendered.output.includes("Enroll a person")
        posted.status == 302 && posted.errors == ""
        place.statusEnumId == "PtsCompleted" && place.partyQualificationId && place.certificateHtmlLocation
    }
})

feature("TrainingCertificate as Tomas: the certificate as issued, and its stored PDF", {
    when() {
        // P19 review: the stored PDF as the self-service employee, with artifact authorization on
        const pdf = asUser(users.employee, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen(webroot)
                .render("apps/People/Development/TrainingDetail/certificatePdf", {personTrainingId: state.placeId}, null)
            return {status: result.status, errors: Array.from(result.errorMessages || []).join(" | ")}
        })
        return {
            rendered: asUser(users.employee, () =>
                page("Development/TrainingCertificate", {personTrainingId: state.placeId}, "html-print")
            ),
            pdf
        }
    },
    then({rendered, pdf}) {
        pdf.status == 200 && pdf.errors == ""
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Certificate of completion") && rendered.output.includes("Tomas Lindqvist")
        rendered.output.includes("Fire warden training") && rendered.output.includes("Fire warden certificate")
    }
})
