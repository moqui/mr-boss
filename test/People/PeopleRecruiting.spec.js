// People's recruiting screens (impl-people P16; design-people §5 ApplicantPipeline, §13 Forms): People's Forms (the survey builder
// with People's registration, service/ironstone/shared/SurveyApps.js) holds the employer's People forms and never its case feedback
// form, read from the service (mantle.party.FormDefinitionServices.find#Forms) and on the list's one qvt render as the People
// administrator, with New form; the applicant board's one qvt render as the recruiter (ApplicantPipeline: an opening of Retail's
// approved seat and its application, the board and Move to stage). The rules are Mantle's Recruiting and FormDefinitions;
// access is PeopleAccess's; the scenario is the acceptance PeopleRecruitingUsable. Customer Service's survey screens are its own
// specs' (CustomerServiceFeedback), unchanged.
// Run: ./moq test mr-boss --spec PeopleRecruiting
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const D = "mantle.party.FormDefinitionServices."
const R = "mantle.humanres.RecruitingServices."
const purposes = ["DbfpInterviewScorecard", "DbfpReview", "DbfpTrainingAssessment", "DbfpExitInterview"]
const state = {}

spec({
    stepwise: true,
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("People's Forms holds its People forms and no feedback form, from the service and on its one render (qvt)", {
    when() {
        return asUser(users.admin, () => {
            const made = system(() =>
                invoke(D + "create#Form", {
                    purposeEnumId: "DbfpInterviewScorecard",
                    organizationPartyId: ids.organizationId,
                    description: "Spec store scorecard"
                })
            )
            system(() =>
                invoke(D + "save#FormField", {
                    formId: made.formId,
                    title: "Overall",
                    fieldTypeEnumId: "DBFFT_radio",
                    isRequired: "Y",
                    optionText: "1 | No hire\n2 | Hire"
                })
            )
            system(() => invoke(D + "publish#Form", {formId: made.formId}))
            state.formId = made.formId
            const listed = system(() =>
                invoke(D + "find#Forms", {purposeEnumIds: purposes, organizationPartyId: ids.organizationId})
            )
            const feedback = system(() =>
                ec.entity
                    .find("moqui.screen.form.DbForm")
                    .condition({purposeEnumId: "DbfpCaseFeedback", ownerPartyId: ids.organizationId})
                    .count()
            )
            const rendered = page("Settings/Forms", {organizationPartyId: ids.organizationId})
            return {made, listed, feedback, rendered}
        })
    },
    then({made, listed, feedback, rendered}) {
        made.formId != null
        feedback >= 1
        listed.forms.some(form => form.formId == made.formId && form.published)
        listed.forms.every(form => purposes.includes(form.purposeEnumId))
        rendered.errors.length == 0
        rendered.output.includes("Spec store scorecard")
        rendered.output.includes("Interview scorecard")
        rendered.output.includes("New form")
        !rendered.output.includes("Retail case feedback")
        !rendered.output.includes("New feedback form")
    }
})

feature("the applicant board's one render (qvt): an opening of Retail's approved seat, its application and the bulk move", {
    when() {
        return asUser(users.recruiter, () => {
            const opening = system(() =>
                invoke(R + "store#Opening", {
                    organizationPartyId: ids.organizationId,
                    title: "Spec sales associate",
                    emplPositionIds: ids.openingSeatId,
                    scorecardFormId: state.formId,
                    action: "open"
                })
            )
            const made = system(() =>
                invoke(R + "create#Application", {
                    jobOpeningId: opening.jobOpeningId,
                    firstName: "Spec",
                    lastName: "Boardcandidate"
                })
            )
            const rendered = page("Staffing/ApplicantPipeline", {jobOpeningId: opening.jobOpeningId})
            return {opening, made, rendered}
        })
    },
    then({opening, made, rendered}) {
        opening.jobOpeningId != null
        made.employmentApplicationId != null
        rendered.errors.length == 0
        rendered.output.includes("Spec Boardcandidate")
        rendered.output.includes("Spec sales associate")
        rendered.output.includes("Move to stage")
        rendered.output.includes("Add application")
    }
})
